// Shared block contract for the Board Report. The on-page preview, the PDF
// renderer (board-pdf.ts) and the PowerPoint renderer (board-pptx.ts) all
// consume exactly these shapes so the three outputs can never diverge.

export type PlanRow = { year: number; month: number; label: string; target: number; booked: number; weighted: number };

export type KpiChart = {
  name: string;
  unit: string;
  target: number | null;
  higherIsBetter: boolean;
  status: "on" | "off" | "none";
  points: { month: string; actual: number | null; target: number | null }[];
  latest: number | null;
};

export type DriverLever = {
  title: string;
  description?: string | null;
  color: string;
  items: { title: string; horizon_year?: number | null; target_metric?: string | null; status?: string | null }[];
};

export type StatItem = { label: string; value: string; color?: string };

export type WaterfallRow = {
  name: string;
  range: [number, number];
  fill: string;
  label: string;
  isAnchor: boolean;
  signed: number;
};

export type BlockBody =
  | { type: "h1"; text: string; sub?: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "note"; title?: string; text: string }
  | { type: "stats"; items: StatItem[] }
  | { type: "table"; head: string[]; rows: string[][]; rygColumns?: number[]; pctColumns?: number[] }
  | { type: "retro"; working: string[]; improve: string[] }
  | { type: "plan_chart"; rows: PlanRow[] }
  | { type: "kpi_charts"; pillar: string; kpis: KpiChart[] }
  | { type: "driver_tree"; vision: string; totals: { total: number; onTrack: number; atRisk: number }; levers: DriverLever[] }
  | {
      type: "custom_waterfall";
      title: string;
      comment?: string;
      rows: WaterfallRow[];
      levers: { label: string; delta: number; comment?: string }[];
    };

export type Block = BlockBody & { id?: string };
export type Page = { id?: string; dark?: boolean; blocks: Block[] };

export const KPI_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}

/** Short human-ish label used in the editor chrome. */
export function blockLabel(b: Block): string {
  switch (b.type) {
    case "h1": return b.text;
    case "h2": return b.text;
    case "p": return "Paragraph";
    case "note": return b.title ? `Note — ${b.title}` : "Note";
    case "stats": return "Stat row";
    case "table": return `Table — ${b.head.join(" / ").slice(0, 40)}`;
    case "retro": return "Retrospective";
    case "plan_chart": return "Plan vs pipeline chart";
    case "kpi_charts": return `KPI charts — ${b.pillar}`;
    case "driver_tree": return "Value-driver tree";
    case "custom_waterfall": return `Waterfall — ${b.title}`;
    default: return "Block";
  }
}

function signature(b: Block): string {
  switch (b.type) {
    case "h1": return b.text;
    case "h2": return b.text;
    case "p": return b.text.slice(0, 60);
    case "note": return `${b.title ?? ""}|${b.text.slice(0, 40)}`;
    case "stats": return b.items.map((i) => i.label).join(",");
    case "table": return b.head.join(",");
    case "retro": return "retro";
    case "plan_chart": return "plan";
    case "kpi_charts": return b.pillar;
    case "driver_tree": return "tree";
    case "custom_waterfall": return b.title;
    default: return "";
  }
}

/**
 * Deterministic ids so saved layout overrides survive a data refresh or a
 * section being toggled (ids are content-derived, not position-derived).
 */
export function assignIds(pages: Page[]): Page[] {
  const seen = new Map<string, number>();
  const pageSeen = new Map<string, number>();
  return pages.map((page, pi) => {
    const anchor = page.dark
      ? "cover"
      : (page.blocks.find((b) => b.type === "h1") as { text?: string } | undefined)?.text ?? `idx${pi}`;
    const pbase = `pg:${hash(anchor)}`;
    const pn = (pageSeen.get(pbase) ?? 0) + 1;
    pageSeen.set(pbase, pn);
    return {
      ...page,
      id: page.id ?? `${pbase}:${pn}`,
      blocks: page.blocks.map((b) => {
        const base = `${b.type}:${hash(signature(b))}`;
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        return { ...b, id: b.id ?? `${base}:${n}` };
      }),
    };
  });
}


/**
 * Stable key for a table row. Content-derived only, so a row stays deleted
 * even after other rows above it are removed.
 */
export function tableRowKey(row: string[], _idx?: number): string {
  return hash(row.join("|"));
}

