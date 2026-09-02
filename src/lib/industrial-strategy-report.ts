// Builds a presentation-ready summary of the Industrial Strategy Framework
// (Strategy Foundation → Industrial Strategy Framework) using the shared
// board-report block contract, so the PDF and PowerPoint renderers can
// consume it unchanged.
import type { Block, Page } from "@/lib/board-report-blocks";
import type { FrameworkEntry, FrameworkRow } from "@/hooks/use-industrial-strategy";
import {
  ADVANTAGES,
  AVOID,
  CASCADE,
  COCKPIT_LAYERS,
  COMPONENTS,
  DELIVERABLES,
  EXECUTIVE_PRINCIPLE,
  MATURITY,
  MONTHLY_REVIEW,
  PHASES,
  PRODUCT_BUCKETS,
  STEPS,
  SUPPLIER_CLASSES,
  TWELVE_QUESTIONS,
  segmentBucket,
} from "@/lib/industrial-strategy-framework";

export const ISF_SECTIONS = [
  { id: "cascade", label: "Strategic cascade", desc: "The one-page ambition → transformation cascade." },
  { id: "segments", label: "Where to play", desc: "Segment attractiveness × right to win, with the call." },
  { id: "advantages", label: "How we win", desc: "The chosen sources of advantage and the rationale." },
  { id: "components", label: "Architecture components", desc: "The nine components and what has been decided." },
  { id: "capabilities", label: "Capabilities", desc: "Competitive requirement → capability → maturity → action." },
  { id: "products", label: "Product portfolio", desc: "Grow / fix / simplify / harvest / exit." },
  { id: "mfgModel", label: "Manufacturing model", desc: "Make / buy / partner and the operating model." },
  { id: "capacity", label: "Capacity strategy", desc: "Demand cases, utilisation, bottleneck and response." },
  { id: "footprint", label: "Footprint", desc: "Site options on total landed cost." },
  { id: "suppliers", label: "Supply chain", desc: "Supplier classification, risk and mitigation." },
  { id: "technology", label: "Technology", desc: "Business problem → solution → value → readiness." },
  { id: "cost", label: "Cost transformation", desc: "Structural cost levers, baseline, target and saving." },
  { id: "quality", label: "Quality strategy", desc: "Metrics, drivers and prevention actions." },
  { id: "orgTalent", label: "Organization & talent", desc: "Required capability per function and the action." },
  { id: "capital", label: "Capital allocation", desc: "Requests scored on fit, return and risk." },
  { id: "initiatives", label: "Initiative portfolio", desc: "Funded initiatives, owners, impact and timing." },
  { id: "progress", label: "Progress", desc: "The 16 steps and the 9-phase process tracker." },
  { id: "cockpit", label: "Cockpit & monthly review", desc: "Layered cockpit values and the monthly read-out." },
  { id: "guardrails", label: "Guardrails & deliverables", desc: "What to avoid, the 12 questions, the deliverables." },
] as const;

export type IsfSectionId = (typeof ISF_SECTIONS)[number]["id"];

export const DEFAULT_ISF_SECTIONS: Record<IsfSectionId, boolean> = ISF_SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.id]: true }),
  {} as Record<IsfSectionId, boolean>,
);

const ACCENT = "#e85d3a";
const INK = "#171b21";

function s(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && s(v) !== "" ? n : null;
}

function money(v: unknown): string {
  const n = num(v);
  if (n === null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function labelOf(list: { key: string; label: string }[], key: unknown): string {
  const k = s(key).toLowerCase();
  return list.find((x) => x.key === k)?.label ?? (k ? k.toUpperCase() : "—");
}

/** Wrap long tables so a slide never overflows. */
function tableBlocks(head: string[], rows: string[][], perPage: number): Block[][] {
  const out: Block[][] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    out.push([{ type: "table", head, rows: rows.slice(i, i + perPage) }]);
  }
  return out.length ? out : [[{ type: "table", head, rows: [] }]];
}

export type IsfInput = {
  companyName: string;
  periodLabel: string;
  generatedOn: Date;
  entries: FrameworkEntry[];
  rows: FrameworkRow[];
  sections?: Record<IsfSectionId, boolean>;
  headline?: string;
};

export function buildIndustrialStrategyPages(input: IsfInput): Page[] {
  const { companyName, periodLabel, entries, rows } = input;
  const on = input.sections ?? DEFAULT_ISF_SECTIONS;

  const entry = (section: string, item: string) =>
    entries.find((e) => e.section_key === section && e.item_key === item) ?? null;
  const text = (section: string, item: string) => s(entry(section, item)?.content);
  const rowsOf = (section: string) => rows.filter((r) => r.section_key === section);

  const pages: Page[] = [];
  const push = (blocks: Block[]) => {
    if (blocks.length) pages.push({ blocks });
  };

  // 1 — Title
  pages.push({ dark: true, blocks: [] });

  const headline = s(input.headline);
  const openers: Block[] = [
    { type: "h1", text: "Industrial strategy on a page", sub: `${companyName} · ${periodLabel}` },
  ];
  if (headline) openers.push({ type: "p", text: headline });
  openers.push({ type: "note", title: "The principle", text: EXECUTIVE_PRINCIPLE });

  // 2 — Strategic cascade
  if (on.cascade) {
    const bands = CASCADE.map((b) => ({ band: b, value: text("cascade", b.key) })).filter((x) => x.value);
    if (bands.length) {
      openers.push({ type: "h2", text: "The strategic cascade" });
      const first = bands.slice(0, 4);
      const rest = bands.slice(4);
      for (const b of first) openers.push({ type: "note", title: `${b.band.label} — ${b.band.question}`, text: b.value });
      push(openers);
      if (rest.length) {
        push([
          { type: "h1", text: "The strategic cascade", sub: "continued" },
          ...rest.map<Block>((b) => ({ type: "note", title: `${b.band.label} — ${b.band.question}`, text: b.value })),
        ]);
      }
    } else {
      push(openers);
    }
  } else {
    push(openers);
  }

  // 3 — Where to play
  if (on.segments) {
    const segs = rowsOf("segments").filter((r) => s(r.data.segment) || s(r.label));
    if (segs.length) {
      const counts = { invest: 0, build: 0, maintain: 0, exit: 0 } as Record<string, number>;
      const body = segs.map((r) => {
        const a = num(r.data.attractiveness) ?? 0;
        const w = num(r.data.rightToWin) ?? 0;
        const b = segmentBucket(a, w);
        counts[b.key] = (counts[b.key] ?? 0) + 1;
        return [s(r.data.segment) || s(r.label), a ? String(a) : "—", w ? String(w) : "—", b.label, s(r.data.notes) || "—"];
      });
      push([
        { type: "h1", text: "Where to play", sub: "Segment attractiveness × right to win" },
        {
          type: "stats",
          items: [
            { label: "Invest", value: String(counts.invest ?? 0), color: "#16a34a" },
            { label: "Build", value: String(counts.build ?? 0), color: "#0284c7" },
            { label: "Maintain", value: String(counts.maintain ?? 0), color: "#d97706" },
            { label: "Exit", value: String(counts.exit ?? 0), color: "#dc2626" },
          ],
        },
        { type: "table", head: ["Segment", "Attractive", "Right to win", "Call", "Why"], rows: body },
      ]);
    }
  }

  // 4 — How we win
  if (on.advantages) {
    const chosen = entries
      .filter((e) => e.section_key === "how-to-win" && e.status === "selected")
      .map((e) => ADVANTAGES.find((a) => a.key === e.item_key))
      .filter((a): a is (typeof ADVANTAGES)[number] => Boolean(a));
    const rationale = text("how-to-win", "rationale");
    if (chosen.length || rationale) {
      const blocks: Block[] = [{ type: "h1", text: "How we win", sub: "Two or three advantages — not eight" }];
      if (chosen.length) {
        blocks.push({
          type: "stats",
          items: chosen.slice(0, 4).map((a) => ({ label: "Advantage", value: a.label, color: ACCENT })),
        });
        blocks.push({
          type: "table",
          head: ["Advantage", "The claim we can make"],
          rows: chosen.map((a) => [a.label, a.claim]),
        });
      }
      if (rationale) blocks.push({ type: "note", title: "Why these — and what we give up", text: rationale });
      push(blocks);
    }
  }

  // 5 — Nine architecture components
  if (on.components) {
    const filled = COMPONENTS.map((c) => ({ c, value: text("components", c.key) })).filter((x) => x.value);
    if (filled.length) {
      const perPage = 3;
      for (let i = 0; i < filled.length; i += perPage) {
        const slice = filled.slice(i, i + perPage);
        push([
          {
            type: "h1",
            text: "Industrial strategy architecture",
            sub: i === 0 ? "Nine integrated components" : "continued",
          },
          ...slice.flatMap<Block>((x) => [
            { type: "h2", text: `${x.c.label} — ${x.c.question}` },
            { type: "p", text: x.value },
            { type: "note", title: "Output", text: x.c.output },
          ]),
        ]);
      }
    }
  }

  // 6 — Capabilities
  if (on.capabilities) {
    const caps = rowsOf("capabilities").filter((r) => s(r.data.requirement) || s(r.data.capability));
    if (caps.length) {
      const body = caps.map((r) => [
        s(r.data.requirement) || "—",
        s(r.data.capability) || "—",
        labelOf(MATURITY, r.data.maturity),
        s(r.data.action) || "—",
      ]);
      const gaps = caps.filter((r) => s(r.data.maturity).toLowerCase() !== "have").length;
      push([
        { type: "h1", text: "Strategy-to-capability map", sub: "What we must become exceptionally good at" },
        {
          type: "stats",
          items: [
            { label: "Capabilities mapped", value: String(caps.length), color: INK },
            { label: "Gaps to close", value: String(gaps), color: "#d97706" },
          ],
        },
        { type: "table", head: ["Competitive requirement", "Required capability", "Maturity", "Action / owner"], rows: body },
      ]);
    }
  }

  // 7 — Product portfolio
  if (on.products) {
    const prods = rowsOf("products").filter((r) => s(r.data.product) || s(r.label));
    if (prods.length) {
      const counts: Record<string, number> = {};
      const body = prods.map((r) => {
        const bucket = labelOf(PRODUCT_BUCKETS, r.data.bucket);
        counts[bucket] = (counts[bucket] ?? 0) + 1;
        const margin = num(r.data.margin);
        return [
          s(r.data.product) || s(r.label),
          money(r.data.revenue),
          margin === null ? "—" : `${margin}%`,
          s(r.data.complexity) ? s(r.data.complexity).toUpperCase() : "—",
          bucket,
        ];
      });
      push([
        { type: "h1", text: "Product portfolio strategy", sub: "Economics and complexity, not habit" },
        {
          type: "stats",
          items: PRODUCT_BUCKETS.filter((b) => counts[b.label]).map((b) => ({
            label: b.label,
            value: String(counts[b.label]),
            color: b.key === "grow" ? "#16a34a" : b.key === "exit" ? "#dc2626" : ACCENT,
          })),
        },
        { type: "table", head: ["Product / family", "Revenue", "Contribution", "Complexity", "Call"], rows: body },
      ]);
    }
  }

  // Manufacturing model
  if (on.mfgModel) {
    const mm = rowsOf("mfg-model").filter((r) => s(r.data.scope) || s(r.label));
    const opModel = text("mfg-model", "operating-model");
    if (mm.length || opModel) {
      const blocks: Block[] = [
        { type: "h1", text: "Manufacturing model", sub: "Make, buy or partner — then the operating model" },
      ];
      if (mm.length) {
        blocks.push({
          type: "table",
          head: ["Process / family", "Decision", "Why", "Action / owner"],
          rows: mm.map((r) => [
            s(r.data.scope) || s(r.label),
            s(r.data.decision) ? s(r.data.decision).toUpperCase() : "—",
            s(r.data.reason) || "—",
            s(r.data.action) || "—",
          ]),
        });
      }
      if (opModel) blocks.push({ type: "note", title: "Operating model", text: opModel });
      push(blocks);
    }
  }

  // Capacity strategy
  if (on.capacity) {
    const cap = rowsOf("capacity").filter((r) => s(r.data.case) || s(r.label));
    if (cap.length) {
      push([
        { type: "h1", text: "Capacity strategy", sub: "Demand → hours → utilisation → bottleneck → response" },
        {
          type: "table",
          head: ["Case", "Demand", "Required hrs", "Available hrs", "Utilisation", "Bottleneck", "Response"],
          rows: cap.map((r) => {
            const req = num(r.data.required);
            const av = num(r.data.available);
            return [
              (s(r.data.case) || s(r.label) || "—").toUpperCase(),
              money(r.data.demand),
              money(r.data.required),
              money(r.data.available),
              req && av ? `${Math.round((req / av) * 100)}%` : "—",
              s(r.data.bottleneck) || "—",
              s(r.data.response) || "—",
            ];
          }),
        },
      ]);
    }
  }

  // Footprint
  if (on.footprint) {
    const fp = rowsOf("footprint").filter((r) => s(r.data.option) || s(r.label));
    if (fp.length) {
      push([
        { type: "h1", text: "Footprint strategy", sub: "Decided on total landed cost, not labour rate" },
        {
          type: "table",
          head: ["Site / option", "Labour", "Material + freight", "Facility + overhead", "Risk / quality", "Total landed", "Call"],
          rows: fp.map((r) => [
            s(r.data.option) || s(r.label),
            money(r.data.labour),
            money(r.data.material),
            money(r.data.overhead),
            money(r.data.risk),
            money(r.data.landed),
            s(r.data.call) ? s(r.data.call).toUpperCase() : "—",
          ]),
        },
      ]);
    }
  }


  // 8 — Supply chain
  if (on.suppliers) {
    const sup = rowsOf("suppliers").filter((r) => s(r.data.supplier) || s(r.label));
    if (sup.length) {
      const counts: Record<string, number> = {};
      const body = sup.map((r) => {
        const cls = s(r.data.class).toUpperCase() || "—";
        if (SUPPLIER_CLASSES.includes(cls)) counts[cls] = (counts[cls] ?? 0) + 1;
        const lt = num(r.data.leadTime);
        return [
          s(r.data.supplier) || s(r.label),
          money(r.data.spend),
          lt === null ? "—" : `${lt} wk`,
          cls,
          s(r.data.risk) ? s(r.data.risk).toUpperCase() : "—",
          s(r.data.mitigation) || "—",
        ];
      });
      const highRisk = sup.filter((r) => s(r.data.risk).toLowerCase() === "high").length;
      push([
        { type: "h1", text: "Supply chain strategy", sub: "Supplier segmentation and risk" },
        {
          type: "stats",
          items: [
            ...SUPPLIER_CLASSES.filter((c) => counts[c]).map((c) => ({ label: c, value: String(counts[c]), color: INK })),
            { label: "High risk", value: String(highRisk), color: "#dc2626" },
          ],
        },
        { type: "table", head: ["Supplier / material", "Spend", "Lead time", "Class", "Risk", "Mitigation"], rows: body },
      ]);
    }
  }

  // Technology
  if (on.technology) {
    const tech = rowsOf("technology").filter((r) => s(r.data.problem) || s(r.data.solution) || s(r.label));
    if (tech.length) {
      push([
        { type: "h1", text: "Technology strategy", sub: "Every technology tied to an economic problem" },
        {
          type: "table",
          head: ["Business problem", "Solution", "Annual value", "Investment", "Readiness", "Call"],
          rows: tech.map((r) => [
            s(r.data.problem) || "—",
            s(r.data.solution) || s(r.label) || "—",
            money(r.data.value),
            money(r.data.investment),
            labelOf(MATURITY, r.data.readiness),
            s(r.data.call) ? s(r.data.call).toUpperCase() : "—",
          ]),
        },
      ]);
    }
  }

  // Cost transformation
  if (on.cost) {
    const levers = rowsOf("cost").filter((r) => s(r.data.lever) || s(r.label));
    if (levers.length) {
      const saving = levers.reduce((t, r) => t + (num(r.data.saving) ?? 0), 0);
      push([
        { type: "h1", text: "Cost transformation", sub: "Structural drivers, not across-the-board cuts" },
        {
          type: "stats",
          items: [
            { label: "Levers", value: String(levers.length), color: INK },
            { label: "Annual saving", value: money(saving), color: "#16a34a" },
          ],
        },
        {
          type: "table",
          head: ["Area", "Lever", "Baseline", "Target", "Saving", "Owner"],
          rows: levers.map((r) => [
            s(r.data.area) ? s(r.data.area).toUpperCase() : "—",
            s(r.data.lever) || s(r.label),
            money(r.data.baseline),
            money(r.data.target),
            money(r.data.saving),
            s(r.data.owner) || "—",
          ]),
        },
      ]);
    }
  }

  // Quality
  if (on.quality) {
    const q = rowsOf("quality").filter((r) => s(r.data.metric) || s(r.label));
    if (q.length) {
      push([
        { type: "h1", text: "Quality strategy", sub: "From inspect–detect–correct to design–prevent–control" },
        {
          type: "table",
          head: ["Metric", "Current", "Target", "Main driver", "Prevention action", "Owner"],
          rows: q.map((r) => [
            s(r.data.metric) || s(r.label),
            money(r.data.current),
            money(r.data.target),
            s(r.data.driver) || "—",
            s(r.data.action) || "—",
            s(r.data.owner) || "—",
          ]),
        },
      ]);
    }
  }

  // Organization & talent
  if (on.orgTalent) {
    const org = rowsOf("org-talent").filter((r) => s(r.data.capability) || s(r.data.function) || s(r.label));
    if (org.length) {
      push([
        { type: "h1", text: "Organization & talent", sub: "The minimum critical capability set" },
        {
          type: "table",
          head: ["Function", "Required capability", "Have it?", "Action", "Owner"],
          rows: org.map((r) => [
            s(r.data.function) || "—",
            s(r.data.capability) || s(r.label) || "—",
            labelOf(MATURITY, r.data.maturity),
            s(r.data.action) ? s(r.data.action).toUpperCase() : "—",
            s(r.data.owner) || "—",
          ]),
        },
      ]);
    }
  }

  // Capital allocation
  if (on.capital) {
    const cap = rowsOf("capital").filter((r) => s(r.data.request) || s(r.label));
    if (cap.length) {
      const total = cap.reduce((t, r) => t + (num(r.data.amount) ?? 0), 0);
      const funded = cap.filter((r) => s(r.data.decision).toLowerCase() === "fund").length;
      push([
        { type: "h1", text: "Capital allocation", sub: "One framework: fit × return × risk" },
        {
          type: "stats",
          items: [
            { label: "Requests", value: String(cap.length), color: INK },
            { label: "Funded", value: String(funded), color: "#16a34a" },
            { label: "Capital", value: money(total), color: ACCENT },
          ],
        },
        {
          type: "table",
          head: ["Request", "Amount", "Fit", "Return", "Risk", "Score", "Timing", "Decision"],
          rows: cap.map((r) => {
            const fit = num(r.data.fit) ?? 0;
            const ret = num(r.data.return) ?? 0;
            const risk = num(r.data.risk) ?? 0;
            const score = fit + ret + risk;
            return [
              s(r.data.request) || s(r.label),
              money(r.data.amount),
              fit ? String(fit) : "—",
              ret ? String(ret) : "—",
              risk ? String(risk) : "—",
              score ? `${score}/15` : "—",
              s(r.data.timing) || "—",
              s(r.data.decision) ? s(r.data.decision).toUpperCase() : "—",
            ];
          }),
        },
      ]);
    }
  }

  // 9 — Initiative portfolio
  if (on.initiatives) {
    const inits = rowsOf("initiatives").filter((r) => s(r.data.initiative) || s(r.data.objective));
    if (inits.length) {
      const impact = inits.reduce((t, r) => t + (num(r.data.impact) ?? 0), 0);
      const invest = inits.reduce((t, r) => t + (num(r.data.investment) ?? 0), 0);
      const head = ["Objective", "Initiative", "Owner", "Target", "Impact", "Investment", "Timing"];
      const body = inits.map((r) => [
        s(r.data.objective) || "—",
        s(r.data.initiative) || "—",
        s(r.data.owner) || "—",
        s(r.data.target) || "—",
        money(r.data.impact),
        money(r.data.investment),
        s(r.data.timing) || "—",
      ]);
      const chunks = tableBlocks(head, body, 12);
      chunks.forEach((blocks, i) => {
        push([
          {
            type: "h1",
            text: "Strategic initiative portfolio",
            sub: i === 0 ? "Funded initiatives with single accountable owners" : "continued",
          },
          ...(i === 0
            ? [
                {
                  type: "stats",
                  items: [
                    { label: "Initiatives", value: String(inits.length), color: INK },
                    { label: "Financial impact", value: money(impact), color: "#16a34a" },
                    { label: "Investment", value: money(invest), color: ACCENT },
                  ],
                } as Block,
              ]
            : []),
          ...blocks,
        ]);
      });
    }
  }

  // 10 — Progress
  if (on.progress) {
    const stepsDone = STEPS.filter((st) => entry("steps", st.key)?.status === "done");
    const phasesDone = PHASES.filter((p) => entry("phases", p.key)?.status === "done");
    const stepNotes = STEPS.map((st) => ({ st, note: text("steps", st.key) }));
    const documented = stepNotes.filter((x) => x.note).length;

    push([
      { type: "h1", text: "Where we are", sub: "16 working steps · 9-phase process" },
      {
        type: "stats",
        items: [
          { label: "Steps complete", value: `${stepsDone.length} / ${STEPS.length}`, color: "#16a34a" },
          { label: "Phases complete", value: `${phasesDone.length} / ${PHASES.length}`, color: "#0284c7" },
          { label: "Steps with findings", value: `${documented} / ${STEPS.length}`, color: ACCENT },
        ],
      },
      {
        type: "table",
        head: ["#", "Phase", "Weeks", "Output", "Status"],
        rows: PHASES.map((p) => [
          String(p.n),
          p.label,
          p.weeks,
          p.output,
          entry("phases", p.key)?.status === "done" ? "Green — complete" : "Yellow — in progress",
        ]),
        rygColumns: [4],
      },
    ]);
    if (stepNotes.length) {
      const perPage = 8;
      for (let i = 0; i < stepNotes.length; i += perPage) {
        push([
          { type: "h1", text: "Findings by step", sub: i === 0 ? "What the work has told us" : "continued" },
          {
            type: "table",
            head: ["#", "Step", "Finding / decision", "Status"],
            rows: stepNotes.slice(i, i + perPage).map((x) => [
              String(x.st.n),
              x.st.title,
              x.note || "—",
              entry("steps", x.st.key)?.status === "done" ? "Green — done" : "Yellow — open",
            ]),
            rygColumns: [3],
          },
        ]);
      }
    }
  }

  // 11 — Cockpit + monthly review
  if (on.cockpit) {
    const layers = COCKPIT_LAYERS.map((l) => ({
      l,
      metrics: l.metrics.map((m) => ({ m, v: text("cockpit", m.key) })).filter((x) => x.v),
    })).filter((x) => x.metrics.length);
    if (layers.length) {
      push([
        { type: "h1", text: "Industrial Strategy Cockpit", sub: "One page, reviewed monthly" },
        {
          type: "table",
          head: ["Layer", "Measure", "Current read"],
          rows: layers.flatMap((x) => x.metrics.map((mm) => [x.l.label, mm.m.label, mm.v])),
        },
      ]);
    }
    const review = MONTHLY_REVIEW.map((g) => ({ g, v: text("monthly-review", g.key) })).filter((x) => x.v);
    if (review.length) {
      push([
        { type: "h1", text: "Monthly Industrial Strategy Review", sub: "This month's read-out" },
        ...review.map<Block>((x) => ({ type: "note", title: x.g.label, text: x.v })),
      ]);
    }
  }

  // 12 — Guardrails & deliverables
  if (on.guardrails) {
    const twelve = text("guardrails", "twelve-questions");
    const moat = text("guardrails", "moat");
    push([
      { type: "h1", text: "Guardrails", sub: "How industrial strategy fails" },
      { type: "table", head: ["Avoid", "Why"], rows: AVOID.map((a) => [a.label, a.why]) },
      ...(twelve ? [{ type: "note", title: "Answers to the twelve questions", text: twelve } as Block] : []),
    ]);
    push([
      { type: "h1", text: "The twelve questions", sub: "If the leadership team cannot answer these, the strategy is not finished" },
      { type: "table", head: ["#", "Question"], rows: TWELVE_QUESTIONS.map((q, i) => [String(i + 1), q]) },
    ]);
    push([
      { type: "h1", text: "Deliverables", sub: "What a complete industrial strategy contains" },
      { type: "table", head: ["#", "Deliverable"], rows: DELIVERABLES.map((d, i) => [String(i + 1), d]) },
      ...(moat ? [{ type: "note", title: "The moat we are building", text: moat } as Block] : []),
    ]);
  }

  return pages;
}
