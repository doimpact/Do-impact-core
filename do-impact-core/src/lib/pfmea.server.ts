/**
 * Server-only PFMEA generation helpers (Lovable AI Gateway).
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

export type GeneratedRow = {
  step_no?: string | null;
  step_name: string;
  function_req?: string | null;
  failure_mode?: string | null;
  effect?: string | null;
  severity?: number | null;
  classification?: string | null;
  cause?: string | null;
  occurrence?: number | null;
  prevention_control?: string | null;
  detection_control?: string | null;
  detection?: number | null;
  action?: string | null;
};

export type GenerateInput = {
  partNumber: string;
  partName?: string | null;
  customer?: string | null;
  program?: string | null;
  processFamily: string;
  specialCharacteristics?: string | null;
  notes?: string | null;
  steps: { step_no?: string | null; step_name: string }[];
  depth: "lean" | "standard" | "thorough";
  /** Optional drawing/spec as a data URL (image/* or application/pdf). */
  fileDataUrl?: string | null;
  fileName?: string | null;
  fileMime?: string | null;
  /** When true, extract the process steps from the file instead of using `steps`. */
  extractStepsFromFile?: boolean;
};

const perStep = { lean: 1, standard: 2, thorough: 3 } as const;

function buildPrompt(input: GenerateInput) {
  const n = perStep[input.depth];
  const stepList = input.steps.length
    ? input.steps.map((s, i) => `${s.step_no ?? (i + 1) * 10}: ${s.step_name}`).join("\n")
    : "(none provided — derive a realistic routing from the drawing/spec and the process family)";

  return [
    "You are a senior manufacturing quality engineer producing a Process FMEA (PFMEA) to AIAG-VDA 1st edition.",
    "",
    `Part number: ${input.partNumber}`,
    input.partName ? `Part name: ${input.partName}` : "",
    input.customer ? `Customer: ${input.customer}` : "",
    input.program ? `Program: ${input.program}` : "",
    `Process family: ${input.processFamily}`,
    input.specialCharacteristics ? `Known special / key characteristics: ${input.specialCharacteristics}` : "",
    input.notes ? `Context notes: ${input.notes}` : "",
    "",
    "Process steps:",
    stepList,
    "",
    `For every process step produce ${n} worksheet line(s) covering the most credible failure modes.`,
    "Each line must contain: step_no, step_name, function_req (function/requirement), failure_mode, effect,",
    "severity (1-10), classification (CC for critical, SC for significant, or null), cause, occurrence (1-10),",
    "prevention_control, detection_control, detection (1-10), and action (a recommended action, or null when risk is acceptable).",
    "Ratings must follow standard AIAG-VDA severity/occurrence/detection scales and be internally consistent.",
    "Recommend an action whenever the combination would give a High or Medium Action Priority.",
    "Write in concise industrial English. Do not invent customer names, standards or numbers that were not provided;",
    "reference generic standards only where they genuinely apply to the process family.",
    "",
    'Respond with JSON only, shaped as: {"rows": [ { ...fields above... } ]}',
  ]
    .filter(Boolean)
    .join("\n");
}

function gatewayError(status: number, body: string): Error {
  let message = body;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    message = parsed.error?.message ?? parsed.message ?? body;
  } catch {
    /* keep the raw body */
  }
  if (status === 402) return new Error(message || "AI credits are exhausted for this workspace.");
  if (status === 403) return new Error(message || "AI is not available for this workspace.");
  if (status === 429) return new Error("The AI service is busy right now — try again in a moment.");
  if (status >= 500) return new Error("The AI service is temporarily unavailable — try again shortly.");
  return new Error(message || `AI request failed (${status})`);
}

export async function generatePfmeaRows(input: GenerateInput): Promise<GeneratedRow[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const content: Record<string, unknown>[] = [{ type: "text", text: buildPrompt(input) }];
  if (input.fileDataUrl) {
    const mime = input.fileMime ?? "";
    if (mime.startsWith("image/")) {
      content.push({ type: "image_url", image_url: { url: input.fileDataUrl } });
    } else {
      content.push({
        type: "file",
        file: { filename: input.fileName ?? "drawing.pdf", file_data: input.fileDataUrl },
      });
    }
    content.push({
      type: "text",
      text: input.extractStepsFromFile
        ? "Read the attached drawing/specification: extract the key characteristics, tolerances and material, derive the likely manufacturing routing, and build the PFMEA from it."
        : "Use the attached drawing/specification to ground the characteristics, tolerances and controls in the worksheet.",
    });
  }

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw gatewayError(res.status, await res.text());

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: { rows?: GeneratedRow[] } | GeneratedRow[];
  try {
    parsed = JSON.parse(cleaned) as { rows?: GeneratedRow[] };
  } catch {
    throw new Error("The AI response could not be read. Try again, or reduce the number of steps.");
  }

  const rows = Array.isArray(parsed) ? parsed : (parsed.rows ?? []);
  const clamp = (n: unknown) => {
    const v = typeof n === "number" ? Math.round(n) : Number(n);
    return Number.isFinite(v) ? Math.min(10, Math.max(1, v)) : null;
  };
  const text = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s === "" ? null : s.slice(0, 2000);
  };

  return rows
    .filter((r) => r && typeof r.step_name === "string" && r.step_name.trim() !== "")
    .slice(0, 120)
    .map((r) => ({
      step_no: text(r.step_no),
      step_name: String(r.step_name).trim().slice(0, 300),
      function_req: text(r.function_req),
      failure_mode: text(r.failure_mode),
      effect: text(r.effect),
      severity: clamp(r.severity),
      classification: text(r.classification),
      cause: text(r.cause),
      occurrence: clamp(r.occurrence),
      prevention_control: text(r.prevention_control),
      detection_control: text(r.detection_control),
      detection: clamp(r.detection),
      action: text(r.action),
    }));
}
