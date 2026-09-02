// Owner Dashboard — the short, owner-level view of the business.
// One tile registry drives the on-screen grid, the saved templates and the
// PDF / PowerPoint export, so the three can never diverge.
import { formatMoney } from "@/lib/number-format";
import {
  DEFAULT_OWNER_METRIC_IDS,
  OWNER_METRICS,
  type OwnerCustomMetric,
} from "@/lib/owner-metric-catalogue";
import type { Block, Page } from "@/lib/board-report-blocks";

export type OwnerSectionId =
  | "financial"
  | "commercial"
  | "operations"
  | "working_capital"
  | "people"
  | "risk"
  | "shareholder";

export const OWNER_SECTIONS: { id: OwnerSectionId; label: string; question: string }[] = [
  { id: "financial", label: "Financial performance", question: "Are we making money?" },
  { id: "commercial", label: "Commercial & growth", question: "Is future revenue secured?" },
  { id: "operations", label: "Operational performance", question: "Can we deliver profitably?" },
  { id: "working_capital", label: "Working capital & cash", question: "Is cash trapped in the business?" },
  { id: "people", label: "People & organisation", question: "Do we have the capacity and stability?" },
  { id: "risk", label: "Risk & compliance", question: "What could hurt us?" },
  { id: "shareholder", label: "Shareholder value", question: "Is the company worth more than last year?" },
];

export type TileUnit = "money" | "pct" | "num" | "days" | "x";
export type Ryg = "green" | "amber" | "red" | "none";

export type OwnerTile = {
  id: string;
  section: OwnerSectionId;
  label: string;
  unit: TileUnit;
  higherIsBetter: boolean;
  value: number | null;
  target: number | null;
  /** Signed change vs the comparison period, in the tile's own unit. */
  trend: number | null;
  trendLabel: string;
  status: Ryg;
  hint?: string;
};

/** What a saved template stores. Tile ids are stable, so layouts survive data changes. */
export type OwnerTemplateConfig = {
  sections: OwnerSectionId[];
  /** Metric ids on the board. Empty means "the default essentials pack". */
  selected: string[];
  /** Company-invented metrics, entered with the monthly financials. */
  custom: OwnerCustomMetric[];
  hiddenTiles: string[];
  tileOrder: Record<string, string[]>;
  renames: Record<string, string>;
  targets: Record<string, number>;
};

export const DEFAULT_OWNER_CONFIG: OwnerTemplateConfig = {
  sections: OWNER_SECTIONS.map((s) => s.id),
  selected: [],
  custom: [],
  hiddenTiles: [],
  tileOrder: {},
  renames: {},
  targets: {},
};

export function normalizeOwnerConfig(raw: unknown): OwnerTemplateConfig {
  const c = (raw ?? {}) as Partial<OwnerTemplateConfig>;
  const valid = new Set(OWNER_SECTIONS.map((s) => s.id));
  const sections = Array.isArray(c.sections)
    ? c.sections.filter((s): s is OwnerSectionId => valid.has(s as OwnerSectionId))
    : DEFAULT_OWNER_CONFIG.sections;
  return {
    sections: sections.length ? sections : DEFAULT_OWNER_CONFIG.sections,
    selected: Array.isArray(c.selected) ? c.selected.filter((x): x is string => typeof x === "string") : [],
    custom: Array.isArray(c.custom) ? (c.custom as OwnerCustomMetric[]).filter((m) => m && typeof m.id === "string") : [],
    hiddenTiles: Array.isArray(c.hiddenTiles) ? c.hiddenTiles : [],
    tileOrder: c.tileOrder && typeof c.tileOrder === "object" ? c.tileOrder : {},
    renames: c.renames && typeof c.renames === "object" ? c.renames : {},
    targets: c.targets && typeof c.targets === "object" ? c.targets : {},
  };
}

/** The metric ids a config actually shows. */
export function selectedMetricIds(config: OwnerTemplateConfig): string[] {
  const base = config.selected.length ? config.selected : DEFAULT_OWNER_METRIC_IDS;
  const customIds = config.custom.map((m) => m.id);
  return Array.from(new Set([...base, ...customIds.filter((id) => !config.selected.length || config.selected.includes(id))]));
}


// ── inputs ────────────────────────────────────────────────────────────

export type OwnerFinancialRow = {
  id?: string;
  month: string; // yyyy-mm-dd (first of month)
  revenue?: number | null;
  revenue_budget?: number | null;
  revenue_py?: number | null;
  cogs?: number | null;
  opex?: number | null;
  ebitda?: number | null;
  ebitda_budget?: number | null;
  ebitda_py?: number | null;
  cash?: number | null;
  debt?: number | null;
  operating_cash_flow?: number | null;
  free_cash_flow?: number | null;
  ar_total?: number | null;
  ar_over_60?: number | null;
  ap_total?: number | null;
  inventory?: number | null;
  headcount?: number | null;
  labor_cost?: number | null;
  overtime_pct?: number | null;
  turnover_pct?: number | null;
  safety_incidents?: number | null;
  valuation_multiple?: number | null;
  notes?: string | null;
  /** Manual-source and custom metric values keyed by metric id. */
  extras?: Record<string, number | null> | null;
};

export type OwnerKpiPoint = {
  libraryKey: string | null;
  name: string;
  unit: string | null;
  target: number | null;
  higherIsBetter: boolean;
  latest: number | null;
  previous: number | null;
};

export type OwnerInputs = {
  fins: OwnerFinancialRow[]; // any order; sorted internally, ascending by month
  kpis: OwnerKpiPoint[];
  custom?: OwnerCustomMetric[];
  commercial: {
    backlog12: number;
    weightedPipeline: number;
    target12: number;
    topAccountShare: number | null;
    openPipeline?: number;
    openCount?: number;
    wonValue?: number;
    wonCount?: number;
    lostCount?: number;
  };
  risk: {
    openEscalations: number;
    overdueActions: number;
    expiringCerts: number;
    atRiskInitiatives: number;
    openCriticalRoles?: number;
  };
};

// ── helpers ───────────────────────────────────────────────────────────

function n(v: number | null | undefined): number | null {
  if (v == null) return null;
  const x = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(x) ? x : null;
}

function sum(vals: (number | null)[]): number | null {
  const ok = vals.filter((v): v is number => v != null);
  return ok.length ? ok.reduce((a, b) => a + b, 0) : null;
}

function div(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

function pct(a: number | null, b: number | null): number | null {
  const r = div(a, b);
  return r == null ? null : r * 100;
}

function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return a - b;
}

export function ryg(
  value: number | null,
  target: number | null,
  higherIsBetter: boolean,
  amberBandPct = 5,
): Ryg {
  if (value == null || target == null) return "none";
  if (target === 0) return value === 0 ? "green" : higherIsBetter ? "red" : "green";
  const ratio = (value / target) * 100;
  if (higherIsBetter) {
    if (ratio >= 100) return "green";
    return ratio >= 100 - amberBandPct ? "amber" : "red";
  }
  if (ratio <= 100) return "green";
  return ratio <= 100 + amberBandPct ? "amber" : "red";
}

export function formatTileValue(v: number | null, unit: TileUnit): string {
  if (v == null || !Number.isFinite(v)) return "—";
  switch (unit) {
    case "money": return formatMoney(v);
    case "pct": return `${v.toFixed(1)}%`;
    case "days": return `${Math.round(v)} d`;
    case "x": return `${v.toFixed(1)}x`;
    default: return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
}

export function formatTileTrend(t: number | null, unit: TileUnit): string {
  if (t == null || !Number.isFinite(t)) return "—";
  const sign = t > 0 ? "+" : t < 0 ? "−" : "";
  const abs = Math.abs(t);
  if (unit === "money") return `${sign}${formatMoney(abs)}`;
  if (unit === "pct") return `${sign}${abs.toFixed(1)} pp`;
  if (unit === "days") return `${sign}${Math.round(abs)} d`;
  if (unit === "x") return `${sign}${abs.toFixed(1)}x`;
  return `${sign}${abs.toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
}

export function statusLabel(s: Ryg): string {
  return s === "green" ? "Green" : s === "amber" ? "Amber" : s === "red" ? "Red" : "—";
}

function findKpi(kpis: OwnerKpiPoint[], keys: string[], nameMatch: RegExp): OwnerKpiPoint | null {
  const byKey = kpis.find((k) => k.libraryKey && keys.includes(k.libraryKey));
  if (byKey) return byKey;
  return kpis.find((k) => nameMatch.test(k.name)) ?? null;
}

function ltm(rows: OwnerFinancialRow[], pick: (r: OwnerFinancialRow) => number | null | undefined) {
  return sum(rows.slice(-12).map((r) => n(pick(r) as number | null)));
}

// ── tile computation ──────────────────────────────────────────────────

export function computeOwnerTiles(input: OwnerInputs, targetOverrides: Record<string, number> = {}): OwnerTile[] {
  const rows = [...input.fins].sort((a, b) => a.month.localeCompare(b.month));
  const cur = rows[rows.length - 1] ?? null;
  const prev = rows[rows.length - 2] ?? null;

  const out: OwnerTile[] = [];
  const push = (t: Omit<OwnerTile, "status"> & { status?: Ryg }) => {
    const target = targetOverrides[t.id] ?? t.target;
    out.push({
      ...t,
      target: target ?? null,
      status: t.status ?? ryg(t.value, target ?? null, t.higherIsBetter),
    });
  };

  // Financial ---------------------------------------------------------
  const rev = n(cur?.revenue);
  const revPrev = n(prev?.revenue);
  const grossProfit = cur ? delta(n(cur.revenue), n(cur.cogs)) : null;
  const grossPrev = prev ? delta(n(prev.revenue), n(prev.cogs)) : null;
  const ebitda = n(cur?.ebitda);
  const ebitdaPrev = n(prev?.ebitda);
  const year = cur ? cur.month.slice(0, 4) : null;
  const ytdRows = year ? rows.filter((r) => r.month.slice(0, 4) === year) : [];
  const revYtd = sum(ytdRows.map((r) => n(r.revenue)));
  const revBudgetYtd = sum(ytdRows.map((r) => n(r.revenue_budget)));
  const ebitdaYtd = sum(ytdRows.map((r) => n(r.ebitda)));
  const ebitdaBudgetYtd = sum(ytdRows.map((r) => n(r.ebitda_budget)));

  push({ id: "fin.revenue", section: "financial", label: "Revenue (month)", unit: "money", higherIsBetter: true,
    value: rev, target: n(cur?.revenue_budget), trend: delta(rev, revPrev), trendLabel: "vs prior month",
    hint: "Actual revenue against budget for the latest closed month." });
  push({ id: "fin.revenue_py", section: "financial", label: "Revenue vs last year", unit: "money", higherIsBetter: true,
    value: rev, target: n(cur?.revenue_py), trend: delta(rev, n(cur?.revenue_py)), trendLabel: "vs same month LY" });
  push({ id: "fin.revenue_ytd", section: "financial", label: "Revenue year to date", unit: "money", higherIsBetter: true,
    value: revYtd, target: revBudgetYtd, trend: delta(revYtd, revBudgetYtd), trendLabel: "vs budget year to date" });
  push({ id: "fin.gross_profit", section: "financial", label: "Gross profit (month)", unit: "money", higherIsBetter: true,
    value: grossProfit, target: null, trend: delta(grossProfit, grossPrev), trendLabel: "vs prior month" });
  push({ id: "fin.gross_margin", section: "financial", label: "Gross margin", unit: "pct", higherIsBetter: true,
    value: pct(grossProfit, rev), target: null, trend: delta(pct(grossProfit, rev), pct(grossPrev, revPrev)), trendLabel: "vs prior month",
    hint: "(Revenue − COGS) / Revenue." });
  push({ id: "fin.ebitda", section: "financial", label: "EBITDA (month)", unit: "money", higherIsBetter: true,
    value: ebitda, target: n(cur?.ebitda_budget), trend: delta(ebitda, ebitdaPrev), trendLabel: "vs prior month" });
  push({ id: "fin.ebitda_margin", section: "financial", label: "EBITDA margin", unit: "pct", higherIsBetter: true,
    value: pct(ebitda, rev), target: null, trend: delta(pct(ebitda, rev), pct(ebitdaPrev, revPrev)), trendLabel: "vs prior month" });
  push({ id: "fin.ebitda_ytd", section: "financial", label: "EBITDA year to date", unit: "money", higherIsBetter: true,
    value: ebitdaYtd, target: ebitdaBudgetYtd, trend: delta(ebitdaYtd, ebitdaBudgetYtd), trendLabel: "vs budget year to date" });
  push({ id: "fin.opex", section: "financial", label: "Operating expense", unit: "money", higherIsBetter: false,
    value: n(cur?.opex), target: null, trend: delta(n(cur?.opex), n(prev?.opex)), trendLabel: "vs prior month" });
  push({ id: "fin.opex_pct", section: "financial", label: "Opex as % of revenue", unit: "pct", higherIsBetter: false,
    value: pct(n(cur?.opex), rev), target: null, trend: delta(pct(n(cur?.opex), rev), pct(n(prev?.opex), revPrev)), trendLabel: "vs prior month" });
  push({ id: "fin.cash", section: "financial", label: "Cash on hand", unit: "money", higherIsBetter: true,
    value: n(cur?.cash), target: null, trend: delta(n(cur?.cash), n(prev?.cash)), trendLabel: "vs prior month" });
  push({ id: "fin.ocf", section: "financial", label: "Operating cash flow", unit: "money", higherIsBetter: true,
    value: n(cur?.operating_cash_flow), target: null, trend: delta(n(cur?.operating_cash_flow), n(prev?.operating_cash_flow)), trendLabel: "vs prior month" });
  push({ id: "fin.fcf", section: "financial", label: "Free cash flow (month)", unit: "money", higherIsBetter: true,
    value: n(cur?.free_cash_flow), target: null, trend: delta(n(cur?.free_cash_flow), n(prev?.free_cash_flow)), trendLabel: "vs prior month" });
  const fcfLtm = ltm(rows, (r) => r.free_cash_flow);
  push({ id: "fin.fcf_ltm", section: "financial", label: "Free cash flow (LTM)", unit: "money", higherIsBetter: true,
    value: fcfLtm, target: null, trend: null, trendLabel: "last twelve months" });
  const burn = fcfLtm != null && fcfLtm < 0 ? Math.abs(fcfLtm) / 12 : null;
  push({ id: "fin.cash_runway", section: "financial", label: "Cash runway", unit: "num", higherIsBetter: true,
    value: burn ? div(n(cur?.cash), burn) : null, target: null, trend: null,
    trendLabel: burn ? "months at current burn" : "cash generative — no burn" });
  push({ id: "fin.budget_variance", section: "financial", label: "Revenue vs budget", unit: "pct", higherIsBetter: true,
    value: pct(rev, n(cur?.revenue_budget)), target: 100, trend: null, trendLabel: "month actual over budget" });

  // Commercial --------------------------------------------------------
  const {
    backlog12, weightedPipeline, target12, topAccountShare,
    openPipeline = 0, openCount = 0, wonValue = 0, wonCount = 0, lostCount = 0,
  } = input.commercial;
  push({ id: "com.backlog", section: "commercial", label: "Booked backlog (12m)", unit: "money", higherIsBetter: true,
    value: backlog12, target: target12 || null, trend: null, trendLabel: "vs 12-month target",
    hint: "Confirmed orders on the books for the next twelve months." });
  push({ id: "com.pipeline", section: "commercial", label: "Weighted pipeline", unit: "money", higherIsBetter: true,
    value: weightedPipeline, target: null, trend: null, trendLabel: "open opportunities" });
  push({ id: "com.pipeline_gross", section: "commercial", label: "Open pipeline (unweighted)", unit: "money", higherIsBetter: true,
    value: openPipeline, target: null, trend: null, trendLabel: "all live opportunities" });
  push({ id: "com.coverage", section: "commercial", label: "Coverage vs target", unit: "pct", higherIsBetter: true,
    value: pct(backlog12 + weightedPipeline, target12 || null), target: 100, trend: null, trendLabel: "backlog + pipeline / target" });
  push({ id: "com.win_rate", section: "commercial", label: "Win rate", unit: "pct", higherIsBetter: true,
    value: wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : null, target: 40, trend: null,
    trendLabel: "won / (won + lost)" });
  push({ id: "com.avg_deal", section: "commercial", label: "Average deal size", unit: "money", higherIsBetter: true,
    value: openCount > 0 ? openPipeline / openCount : null, target: null, trend: null, trendLabel: "across open opportunities" });
  push({ id: "com.won_value", section: "commercial", label: "Won value", unit: "money", higherIsBetter: true,
    value: wonValue, target: null, trend: null, trendLabel: "opportunities marked won" });
  push({ id: "com.open_count", section: "commercial", label: "Open opportunities", unit: "num", higherIsBetter: true,
    value: openCount, target: null, trend: null, trendLabel: "live in the funnel" });
  push({ id: "com.concentration", section: "commercial", label: "Top-customer share", unit: "pct", higherIsBetter: false,
    value: topAccountShare, target: 30, trend: null, trendLabel: "of open pipeline value",
    hint: "Concentration risk — a high share means one customer can move the whole year." });

  // KPI-library backed metrics ------------------------------------------
  for (const m of OWNER_METRICS.filter((x) => x.source === "kpi")) {
    const k = findKpi(input.kpis, m.kpiKeys ?? [], new RegExp(m.kpiMatch ?? m.label, "i"));
    push({
      id: m.id, section: m.section, label: m.label,
      unit: k?.unit === "currency" ? "money" : m.unit,
      higherIsBetter: k?.higherIsBetter ?? m.higherIsBetter,
      value: k?.latest ?? null, target: k?.target ?? m.defaultTarget ?? null,
      trend: delta(k?.latest ?? null, k?.previous ?? null), trendLabel: "vs prior period",
      hint: k ? undefined : "Add this KPI on the KPIs page to light this tile up.",
    });
  }

  // Working capital ----------------------------------------------------
  const revLtm = ltm(rows, (r) => r.revenue);
  const cogsLtm = ltm(rows, (r) => r.cogs);
  const dso = div(n(cur?.ar_total), div(revLtm, 365));
  const dsoPrev = div(n(prev?.ar_total), div(revLtm, 365));
  const dio = div(n(cur?.inventory), div(cogsLtm, 365));
  const dpo = div(n(cur?.ap_total), div(cogsLtm, 365));
  const netWc =
    n(cur?.ar_total) != null && n(cur?.inventory) != null && n(cur?.ap_total) != null
      ? (n(cur?.ar_total) as number) + (n(cur?.inventory) as number) - (n(cur?.ap_total) as number)
      : null;
  push({ id: "wc.dso", section: "working_capital", label: "DSO — days sales outstanding", unit: "days", higherIsBetter: false,
    value: dso, target: 45, trend: delta(dso, dsoPrev), trendLabel: "vs prior month" });
  push({ id: "wc.dio", section: "working_capital", label: "Inventory days", unit: "days", higherIsBetter: false,
    value: dio, target: 60, trend: null, trendLabel: "on LTM cost of goods" });
  push({ id: "wc.dpo", section: "working_capital", label: "DPO — days payable", unit: "days", higherIsBetter: true,
    value: dpo, target: 45, trend: null, trendLabel: "on LTM cost of goods" });
  push({ id: "wc.ccc", section: "working_capital", label: "Cash conversion cycle", unit: "days", higherIsBetter: false,
    value: dso != null && dio != null && dpo != null ? dso + dio - dpo : null, target: 60, trend: null, trendLabel: "DSO + inventory − DPO" });
  push({ id: "wc.ar60", section: "working_capital", label: "Receivables over 60 days", unit: "pct", higherIsBetter: false,
    value: pct(n(cur?.ar_over_60), n(cur?.ar_total)), target: 10, trend: null, trendLabel: "of total receivables" });
  push({ id: "wc.ar_total", section: "working_capital", label: "Receivables balance", unit: "money", higherIsBetter: false,
    value: n(cur?.ar_total), target: null, trend: delta(n(cur?.ar_total), n(prev?.ar_total)), trendLabel: "vs prior month" });
  push({ id: "wc.ap_total", section: "working_capital", label: "Payables balance", unit: "money", higherIsBetter: true,
    value: n(cur?.ap_total), target: null, trend: delta(n(cur?.ap_total), n(prev?.ap_total)), trendLabel: "vs prior month" });
  push({ id: "wc.inventory", section: "working_capital", label: "Inventory value", unit: "money", higherIsBetter: false,
    value: n(cur?.inventory), target: null, trend: delta(n(cur?.inventory), n(prev?.inventory)), trendLabel: "vs prior month" });
  push({ id: "wc.inventory_turns", section: "working_capital", label: "Inventory turns", unit: "x", higherIsBetter: true,
    value: div(cogsLtm, n(cur?.inventory)), target: 6, trend: null, trendLabel: "LTM cost of goods / stock" });
  push({ id: "wc.net_wc", section: "working_capital", label: "Net working capital", unit: "money", higherIsBetter: false,
    value: netWc, target: null, trend: null, trendLabel: "receivables + stock − payables" });
  push({ id: "wc.wc_pct_revenue", section: "working_capital", label: "Working capital % of revenue", unit: "pct", higherIsBetter: false,
    value: pct(netWc, revLtm), target: 20, trend: null, trendLabel: "on LTM revenue" });

  // People --------------------------------------------------------------
  const heads = n(cur?.headcount);
  push({ id: "ppl.headcount", section: "people", label: "Headcount", unit: "num", higherIsBetter: true,
    value: heads, target: null, trend: delta(heads, n(prev?.headcount)), trendLabel: "vs prior month" });
  push({ id: "ppl.rev_per_head", section: "people", label: "Revenue per employee (LTM)", unit: "money", higherIsBetter: true,
    value: div(revLtm, heads), target: null, trend: null, trendLabel: "last twelve months" });
  push({ id: "ppl.labour_pct", section: "people", label: "Labour cost % of revenue", unit: "pct", higherIsBetter: false,
    value: pct(n(cur?.labor_cost), rev), target: 30, trend: delta(pct(n(cur?.labor_cost), rev), pct(n(prev?.labor_cost), revPrev)), trendLabel: "vs prior month" });
  push({ id: "ppl.overtime", section: "people", label: "Overtime", unit: "pct", higherIsBetter: false,
    value: n(cur?.overtime_pct), target: 8, trend: delta(n(cur?.overtime_pct), n(prev?.overtime_pct)), trendLabel: "vs prior month" });
  push({ id: "ppl.turnover", section: "people", label: "Employee turnover", unit: "pct", higherIsBetter: false,
    value: n(cur?.turnover_pct), target: 10, trend: delta(n(cur?.turnover_pct), n(prev?.turnover_pct)), trendLabel: "vs prior month" });
  push({ id: "ppl.safety", section: "people", label: "Safety incidents (month)", unit: "num", higherIsBetter: false,
    value: n(cur?.safety_incidents), target: 0, trend: delta(n(cur?.safety_incidents), n(prev?.safety_incidents)), trendLabel: "vs prior month" });
  push({ id: "ppl.open_roles", section: "people", label: "Open critical roles", unit: "num", higherIsBetter: false,
    value: input.risk.openCriticalRoles ?? null, target: 0, trend: null, trendLabel: "unfilled key positions" });

  // Risk ----------------------------------------------------------------
  push({ id: "risk.escalations", section: "risk", label: "Open escalations", unit: "num", higherIsBetter: false,
    value: input.risk.openEscalations, target: 0, trend: null, trendLabel: "daily management" });
  push({ id: "risk.overdue", section: "risk", label: "Overdue actions", unit: "num", higherIsBetter: false,
    value: input.risk.overdueActions, target: 0, trend: null, trendLabel: "past due date" });
  push({ id: "risk.certs", section: "risk", label: "Certifications expiring (90d)", unit: "num", higherIsBetter: false,
    value: input.risk.expiringCerts, target: 0, trend: null, trendLabel: "next 90 days" });
  push({ id: "risk.initiatives", section: "risk", label: "Initiatives at risk", unit: "num", higherIsBetter: false,
    value: input.risk.atRiskInitiatives, target: 0, trend: null, trendLabel: "blocked or off track" });

  // Manual-entry and company-custom metrics -------------------------------
  const extrasCur = (cur?.extras ?? {}) as Record<string, number | null>;
  const extrasPrev = (prev?.extras ?? {}) as Record<string, number | null>;
  const manual = [
    ...OWNER_METRICS.filter((m) => m.source === "manual").map((m) => ({
      id: m.id, section: m.section, label: m.label, unit: m.unit,
      higherIsBetter: m.higherIsBetter, target: m.defaultTarget ?? null,
    })),
    ...(input.custom ?? []).map((m) => ({
      id: m.id, section: m.section, label: m.label, unit: m.unit,
      higherIsBetter: m.higherIsBetter, target: m.target ?? null,
    })),
  ];
  for (const m of manual) {
    const v = n(extrasCur[m.id]);
    push({
      id: m.id, section: m.section, label: m.label, unit: m.unit, higherIsBetter: m.higherIsBetter,
      value: v, target: m.target, trend: delta(v, n(extrasPrev[m.id])),
      trendLabel: "vs prior month",
      hint: v == null ? "Enter this with the monthly financials." : undefined,
    });
  }


  // Shareholder value -----------------------------------------------------
  const ebitdaLtm = ltm(rows, (r) => r.ebitda);
  const multiple = n(cur?.valuation_multiple);
  const netDebt = cur ? delta(n(cur.debt), n(cur.cash)) : null;
  const ev = ebitdaLtm != null && multiple != null ? ebitdaLtm * multiple : null;
  const ebitdaLtmPrev = sum(rows.slice(-24, -12).map((r) => n(r.ebitda)));
  push({ id: "shv.ebitda_ltm", section: "shareholder", label: "EBITDA (last 12 months)", unit: "money", higherIsBetter: true,
    value: ebitdaLtm, target: null, trend: delta(ebitdaLtm, ebitdaLtmPrev), trendLabel: "vs prior twelve months" });
  push({ id: "shv.ebitda_margin_ltm", section: "shareholder", label: "EBITDA margin (LTM)", unit: "pct", higherIsBetter: true,
    value: pct(ebitdaLtm, revLtm), target: null, trend: null, trendLabel: "last twelve months" });
  push({ id: "shv.net_debt", section: "shareholder", label: "Net debt", unit: "money", higherIsBetter: false,
    value: netDebt, target: null, trend: null, trendLabel: "debt − cash" });
  push({ id: "shv.ev", section: "shareholder", label: "Indicative enterprise value", unit: "money", higherIsBetter: true,
    value: ev, target: null, trend: null, trendLabel: "LTM EBITDA × multiple",
    hint: "Directional only — set the multiple in the monthly financial entry." });
  push({ id: "shv.equity", section: "shareholder", label: "Indicative equity value", unit: "money", higherIsBetter: true,
    value: ev != null && netDebt != null ? ev - netDebt : ev, target: null, trend: null, trendLabel: "enterprise value − net debt" });
  push({ id: "shv.leverage", section: "shareholder", label: "Net debt / EBITDA", unit: "x", higherIsBetter: false,
    value: div(netDebt, ebitdaLtm), target: 3, trend: null, trendLabel: "on LTM EBITDA" });
  push({ id: "shv.multiple", section: "shareholder", label: "Valuation multiple", unit: "x", higherIsBetter: true,
    value: multiple, target: null, trend: null, trendLabel: "used for the valuation" });

  return out;
}

/** Apply a saved template: chosen metrics, section order, hidden tiles, order and renames. */
export function applyOwnerConfig(
  tiles: OwnerTile[],
  config: OwnerTemplateConfig,
): { section: OwnerSectionId; label: string; question: string; tiles: OwnerTile[] }[] {
  const hidden = new Set(config.hiddenTiles);
  const chosen = new Set(selectedMetricIds(config));
  return config.sections
    .map((id) => {
      const meta = OWNER_SECTIONS.find((s) => s.id === id)!;
      let list = tiles
        .filter((t) => t.section === id && chosen.has(t.id) && !hidden.has(t.id))
        .map((t) => ({ ...t, label: config.renames[t.id] ?? t.label }));

      const order = config.tileOrder[id];
      if (order?.length) {
        const rank = new Map(order.map((tid, i) => [tid, i]));
        list = list
          .map((t, i) => ({ t, i }))
          .sort((a, b) => (rank.get(a.t.id) ?? 1000 + a.i) - (rank.get(b.t.id) ?? 1000 + b.i))
          .map((x) => x.t);
      }
      return { section: id, label: meta.label, question: meta.question, tiles: list };
    })
    .filter((s) => s.tiles.length > 0);
}

/**
 * Owner dashboard as report blocks — reuses the existing table/stats/note block
 * types so the PDF and PowerPoint renderers stay unchanged and the exported
 * tables remain fully editable in PowerPoint.
 */
export function buildOwnerPages(
  companyName: string,
  periodLabel: string,
  sections: { section: OwnerSectionId; label: string; question: string; tiles: OwnerTile[] }[],
  headline?: string,
): Page[] {
  const pages: Page[] = [{ dark: true, blocks: [] }];
  const blocks: Block[] = [
    { type: "h1", text: "Owner dashboard", sub: `${companyName} · ${periodLabel}` },
  ];
  if (headline?.trim()) blocks.push({ type: "note", title: "Owner's view", text: headline.trim() });

  const flat = sections.flatMap((s) => s.tiles);
  const spotlight = ["fin.revenue", "fin.ebitda", "fin.cash", "com.backlog"]
    .map((id) => flat.find((t) => t.id === id))
    .filter((t): t is OwnerTile => !!t);
  if (spotlight.length) {
    blocks.push({
      type: "stats",
      items: spotlight.map((t) => ({
        label: t.label,
        value: formatTileValue(t.value, t.unit),
        color: t.status === "red" ? "#dc2626" : t.status === "amber" ? "#d97706" : "#16a34a",
      })),
    });
  }

  for (const s of sections) {
    blocks.push({ type: "h2", text: `${s.label} — ${s.question}` });
    blocks.push({
      type: "table",
      head: ["Metric", "Actual", "Target", "Trend", "Status"],
      rows: s.tiles.map((t) => [
        t.label,
        formatTileValue(t.value, t.unit),
        t.target == null ? "—" : formatTileValue(t.target, t.unit),
        formatTileTrend(t.trend, t.unit),
        statusLabel(t.status),
      ]),
      rygColumns: [4],
    });
  }

  pages.push({ blocks });
  return pages;
}
