// Business Health & Operational Excellence Review.
// One tile registry drives the on-screen review, the saved templates and the
// PDF / PowerPoint export, so the three can never diverge.
import {
  formatTileTrend,
  formatTileValue,
  ryg,
  statusLabel,
  type OwnerFinancialRow,
  type OwnerKpiPoint,
  type Ryg,
  type TileUnit,
} from "@/lib/owner-dashboard";
import {
  BH_GROUPS,
  BH_METRICS,
  BH_SECTIONS,
  DEFAULT_BH_METRIC_IDS,
  type BhCustomMetric,
  type BhSectionId,
} from "@/lib/business-health-catalogue";
import type { Block, Page } from "@/lib/board-report-blocks";

export type BhTile = {
  id: string;
  section: BhSectionId;
  group: string;
  label: string;
  unit: TileUnit;
  higherIsBetter: boolean;
  value: number | null;
  target: number | null;
  trend: number | null;
  trendLabel: string;
  status: Ryg;
  hint?: string;
};

export type BhTemplateConfig = {
  sections: BhSectionId[];
  selected: string[];
  custom: BhCustomMetric[];
  hiddenTiles: string[];
  tileOrder: Record<string, string[]>;
  renames: Record<string, string>;
  targets: Record<string, number>;
};

export const DEFAULT_BH_CONFIG: BhTemplateConfig = {
  sections: BH_SECTIONS.map((s) => s.id),
  selected: [],
  custom: [],
  hiddenTiles: [],
  tileOrder: {},
  renames: {},
  targets: {},
};

export function normalizeBhConfig(raw: unknown): BhTemplateConfig {
  const c = (raw ?? {}) as Partial<BhTemplateConfig>;
  const valid = new Set(BH_SECTIONS.map((s) => s.id));
  const sections = Array.isArray(c.sections)
    ? c.sections.filter((s): s is BhSectionId => valid.has(s as BhSectionId))
    : DEFAULT_BH_CONFIG.sections;
  return {
    sections: sections.length ? sections : DEFAULT_BH_CONFIG.sections,
    selected: Array.isArray(c.selected) ? c.selected.filter((x): x is string => typeof x === "string") : [],
    custom: Array.isArray(c.custom) ? (c.custom as BhCustomMetric[]).filter((x) => x && typeof x.id === "string") : [],
    hiddenTiles: Array.isArray(c.hiddenTiles) ? c.hiddenTiles : [],
    tileOrder: c.tileOrder && typeof c.tileOrder === "object" ? c.tileOrder : {},
    renames: c.renames && typeof c.renames === "object" ? c.renames : {},
    targets: c.targets && typeof c.targets === "object" ? c.targets : {},
  };
}

export function bhSelectedMetricIds(config: BhTemplateConfig): string[] {
  const base = config.selected.length ? config.selected : DEFAULT_BH_METRIC_IDS;
  const customIds = config.custom.map((x) => x.id);
  return Array.from(
    new Set([...base, ...customIds.filter((id) => !config.selected.length || config.selected.includes(id))]),
  );
}

// ── inputs ────────────────────────────────────────────────────────────

export type BhInputs = {
  fins: OwnerFinancialRow[];
  kpis: OwnerKpiPoint[];
  custom?: BhCustomMetric[];
  strategy: {
    objectives: number;
    onTrack: number;
    atRisk: number;
    notStarted: number;
    hoshinItems: number;
    initiatives: number;
    initiativesDone: number;
    benefitPlan: number | null;
    benefitActual: number | null;
    a3Open: number;
    overdueActions: number;
    openActions: number;
    blockedActions: number;
    expiringCerts: number;
  };
  commercial: {
    backlog12: number;
    target12: number;
    weightedPipeline: number;
    openPipeline: number;
    openCount: number;
    wonCount: number;
    lostCount: number;
    topAccountShare: number | null;
    accounts: number;
    quotesOpen: number;
    contractsActive: number;
    contractsExpiring: number;
    vocOpen: number;
  };
  operations: {
    openEscalations: number;
    redMarks: number;
    downtimeHours: number | null;
    copqTotal: number | null;
    suppliers: number;
    suppliersAtRisk: number;
    longLeadAtRisk: number;
    npiProjects: number;
    npiGatesLate: number;
    capexProjects: number;
    capexAtRisk: number;
  };
  people: {
    employees: number;
    skillsCoverage: number | null;
    openRoles: number;
    devPlans: number;
    trainingOpen: number;
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
function ltm(rows: OwnerFinancialRow[], pick: (r: OwnerFinancialRow) => number | null | undefined) {
  return sum(rows.slice(-12).map((r) => n(pick(r) as number | null)));
}
function findKpi(kpis: OwnerKpiPoint[], match: RegExp): OwnerKpiPoint | null {
  return kpis.find((k) => match.test(k.name)) ?? null;
}
const groupOf = (id: string) => BH_METRICS.find((x) => x.id === id)?.group ?? "";

// ── tile computation ──────────────────────────────────────────────────

export function computeBhTiles(input: BhInputs, targetOverrides: Record<string, number> = {}): BhTile[] {
  const rows = [...input.fins].sort((a, b) => a.month.localeCompare(b.month));
  const cur = rows[rows.length - 1] ?? null;
  const prev = rows[rows.length - 2] ?? null;

  const out: BhTile[] = [];
  const push = (t: Omit<BhTile, "status" | "group"> & { status?: Ryg; group?: string }) => {
    const target = targetOverrides[t.id] ?? t.target;
    out.push({
      ...t,
      group: t.group ?? groupOf(t.id),
      target: target ?? null,
      status: t.status ?? ryg(t.value, target ?? null, t.higherIsBetter),
    });
  };

  // ── Financial health ────────────────────────────────────────────────
  const rev = n(cur?.revenue);
  const revPrev = n(prev?.revenue);
  const gp = cur ? delta(n(cur.revenue), n(cur.cogs)) : null;
  const gpPrev = prev ? delta(n(prev.revenue), n(prev.cogs)) : null;
  const ebitda = n(cur?.ebitda);
  const ebitdaPrev = n(prev?.ebitda);
  const year = cur ? cur.month.slice(0, 4) : null;
  const ytd = year ? rows.filter((r) => r.month.slice(0, 4) === year) : [];
  const revYtd = sum(ytd.map((r) => n(r.revenue)));
  const revBudgetYtd = sum(ytd.map((r) => n(r.revenue_budget)));
  const ebitdaYtd = sum(ytd.map((r) => n(r.ebitda)));
  const ebitdaBudgetYtd = sum(ytd.map((r) => n(r.ebitda_budget)));
  const revLtm = ltm(rows, (r) => r.revenue);
  const cogsLtm = ltm(rows, (r) => r.cogs);
  const ebitdaLtm = ltm(rows, (r) => r.ebitda);

  push({ id: "bhf.revenue", section: "financial", label: "Revenue (month)", unit: "money", higherIsBetter: true,
    value: rev, target: n(cur?.revenue_budget), trend: delta(rev, revPrev), trendLabel: "vs prior month" });
  push({ id: "bhf.revenue_ytd", section: "financial", label: "Revenue year to date", unit: "money", higherIsBetter: true,
    value: revYtd, target: revBudgetYtd, trend: delta(revYtd, revBudgetYtd), trendLabel: "vs budget year to date" });
  push({ id: "bhf.revenue_growth", section: "financial", label: "Revenue growth vs last year", unit: "pct", higherIsBetter: true,
    value: pct(rev, n(cur?.revenue_py)), target: 100, trend: null, trendLabel: "month vs same month last year" });
  push({ id: "bhf.gross_margin", section: "financial", label: "Gross margin", unit: "pct", higherIsBetter: true,
    value: pct(gp, rev), target: null, trend: delta(pct(gp, rev), pct(gpPrev, revPrev)), trendLabel: "vs prior month" });
  push({ id: "bhf.ebitda", section: "financial", label: "EBITDA (month)", unit: "money", higherIsBetter: true,
    value: ebitda, target: n(cur?.ebitda_budget), trend: delta(ebitda, ebitdaPrev), trendLabel: "vs prior month" });
  push({ id: "bhf.ebitda_margin", section: "financial", label: "EBITDA margin", unit: "pct", higherIsBetter: true,
    value: pct(ebitda, rev), target: null, trend: delta(pct(ebitda, rev), pct(ebitdaPrev, revPrev)), trendLabel: "vs prior month" });
  push({ id: "bhf.ebitda_ytd", section: "financial", label: "EBITDA year to date", unit: "money", higherIsBetter: true,
    value: ebitdaYtd, target: ebitdaBudgetYtd, trend: delta(ebitdaYtd, ebitdaBudgetYtd), trendLabel: "vs budget year to date" });
  push({ id: "bhf.opex_pct", section: "financial", label: "Opex as % of revenue", unit: "pct", higherIsBetter: false,
    value: pct(n(cur?.opex), rev), target: null, trend: delta(pct(n(cur?.opex), rev), pct(n(prev?.opex), revPrev)), trendLabel: "vs prior month" });
  push({ id: "bhf.budget_variance", section: "financial", label: "Revenue vs budget", unit: "pct", higherIsBetter: true,
    value: pct(rev, n(cur?.revenue_budget)), target: 100, trend: null, trendLabel: "month actual over budget" });

  push({ id: "bhf.cash", section: "financial", label: "Cash on hand", unit: "money", higherIsBetter: true,
    value: n(cur?.cash), target: null, trend: delta(n(cur?.cash), n(prev?.cash)), trendLabel: "vs prior month" });
  push({ id: "bhf.ocf", section: "financial", label: "Operating cash flow", unit: "money", higherIsBetter: true,
    value: n(cur?.operating_cash_flow), target: null, trend: delta(n(cur?.operating_cash_flow), n(prev?.operating_cash_flow)), trendLabel: "vs prior month" });
  push({ id: "bhf.fcf", section: "financial", label: "Free cash flow (month)", unit: "money", higherIsBetter: true,
    value: n(cur?.free_cash_flow), target: null, trend: delta(n(cur?.free_cash_flow), n(prev?.free_cash_flow)), trendLabel: "vs prior month" });
  const fcfLtm = ltm(rows, (r) => r.free_cash_flow);
  push({ id: "bhf.fcf_ltm", section: "financial", label: "Free cash flow (LTM)", unit: "money", higherIsBetter: true,
    value: fcfLtm, target: null, trend: null, trendLabel: "last twelve months" });
  const burn = fcfLtm != null && fcfLtm < 0 ? Math.abs(fcfLtm) / 12 : null;
  push({ id: "bhf.runway", section: "financial", label: "Cash runway", unit: "num", higherIsBetter: true,
    value: burn ? div(n(cur?.cash), burn) : null, target: null, trend: null,
    trendLabel: burn ? "months at current burn" : "cash generative — no burn" });

  const dso = div(n(cur?.ar_total), div(revLtm, 365));
  const dsoPrev = div(n(prev?.ar_total), div(revLtm, 365));
  const dio = div(n(cur?.inventory), div(cogsLtm, 365));
  const dpo = div(n(cur?.ap_total), div(cogsLtm, 365));
  const netWc =
    n(cur?.ar_total) != null && n(cur?.inventory) != null && n(cur?.ap_total) != null
      ? (n(cur?.ar_total) as number) + (n(cur?.inventory) as number) - (n(cur?.ap_total) as number)
      : null;
  push({ id: "bhf.dso", section: "financial", label: "DSO — days sales outstanding", unit: "days", higherIsBetter: false,
    value: dso, target: 45, trend: delta(dso, dsoPrev), trendLabel: "vs prior month" });
  push({ id: "bhf.dio", section: "financial", label: "Inventory days", unit: "days", higherIsBetter: false,
    value: dio, target: 60, trend: null, trendLabel: "on LTM cost of goods" });
  push({ id: "bhf.dpo", section: "financial", label: "DPO — days payable", unit: "days", higherIsBetter: true,
    value: dpo, target: 45, trend: null, trendLabel: "on LTM cost of goods" });
  push({ id: "bhf.ccc", section: "financial", label: "Cash conversion cycle", unit: "days", higherIsBetter: false,
    value: dso != null && dio != null && dpo != null ? dso + dio - dpo : null, target: 60, trend: null, trendLabel: "DSO + stock − DPO" });
  push({ id: "bhf.ar60", section: "financial", label: "Receivables over 60 days", unit: "pct", higherIsBetter: false,
    value: pct(n(cur?.ar_over_60), n(cur?.ar_total)), target: 10, trend: null, trendLabel: "of total receivables" });
  push({ id: "bhf.inventory_turns", section: "financial", label: "Inventory turns", unit: "x", higherIsBetter: true,
    value: div(cogsLtm, n(cur?.inventory)), target: 6, trend: null, trendLabel: "LTM cost of goods / stock" });
  push({ id: "bhf.net_wc_pct", section: "financial", label: "Working capital % of revenue", unit: "pct", higherIsBetter: false,
    value: pct(netWc, revLtm), target: 20, trend: null, trendLabel: "on LTM revenue" });

  const netDebt = cur ? delta(n(cur.debt), n(cur.cash)) : null;
  const multiple = n(cur?.valuation_multiple);
  const ev = ebitdaLtm != null && multiple != null ? ebitdaLtm * multiple : null;
  const heads = n(cur?.headcount);
  push({ id: "bhf.ebitda_ltm", section: "financial", label: "EBITDA (last 12 months)", unit: "money", higherIsBetter: true,
    value: ebitdaLtm, target: null, trend: delta(ebitdaLtm, sum(rows.slice(-24, -12).map((r) => n(r.ebitda)))), trendLabel: "vs prior twelve months" });
  push({ id: "bhf.net_debt", section: "financial", label: "Net debt", unit: "money", higherIsBetter: false,
    value: netDebt, target: null, trend: null, trendLabel: "debt − cash" });
  push({ id: "bhf.leverage", section: "financial", label: "Net debt / EBITDA", unit: "x", higherIsBetter: false,
    value: div(netDebt, ebitdaLtm), target: 3, trend: null, trendLabel: "on LTM EBITDA" });
  push({ id: "bhf.equity_value", section: "financial", label: "Indicative equity value", unit: "money", higherIsBetter: true,
    value: ev != null && netDebt != null ? ev - netDebt : ev, target: null, trend: null, trendLabel: "LTM EBITDA × multiple − net debt",
    hint: "Directional only — set the multiple in the monthly financial entry." });
  push({ id: "bhf.rev_per_head", section: "financial", label: "Revenue per employee (LTM)", unit: "money", higherIsBetter: true,
    value: div(revLtm, heads ?? (input.people.employees || null)), target: null, trend: null, trendLabel: "last twelve months" });

  // ── Strategy & transformation ───────────────────────────────────────
  const s = input.strategy;
  push({ id: "bhs.objectives", section: "strategy", label: "Strategic objectives", unit: "num", higherIsBetter: true,
    value: s.objectives, target: null, trend: null, trendLabel: "in the current strategy" });
  push({ id: "bhs.on_track", section: "strategy", label: "Objectives on track", unit: "pct", higherIsBetter: true,
    value: s.objectives ? (s.onTrack / s.objectives) * 100 : null, target: 80, trend: null, trendLabel: "of all objectives" });
  push({ id: "bhs.at_risk", section: "strategy", label: "Objectives at risk", unit: "num", higherIsBetter: false,
    value: s.atRisk, target: 0, trend: null, trendLabel: "flagged at risk" });
  push({ id: "bhs.not_started", section: "strategy", label: "Objectives not started", unit: "num", higherIsBetter: false,
    value: s.notStarted, target: null, trend: null, trendLabel: "no progress yet" });
  push({ id: "bhs.hoshin_items", section: "strategy", label: "Hoshin items in play", unit: "num", higherIsBetter: true,
    value: s.hoshinItems, target: null, trend: null, trendLabel: "on the X-matrix" });
  push({ id: "bhs.initiatives", section: "strategy", label: "Active initiatives", unit: "num", higherIsBetter: true,
    value: s.initiatives, target: null, trend: null, trendLabel: "in flight" });
  push({ id: "bhs.initiatives_done", section: "strategy", label: "Initiatives completed", unit: "num", higherIsBetter: true,
    value: s.initiativesDone, target: null, trend: null, trendLabel: "reached the final stage" });
  push({ id: "bhs.benefit_plan", section: "strategy", label: "Benefit planned", unit: "money", higherIsBetter: true,
    value: s.benefitPlan, target: null, trend: null, trendLabel: "across the value waterfall" });
  push({ id: "bhs.benefit_actual", section: "strategy", label: "Benefit realised", unit: "money", higherIsBetter: true,
    value: s.benefitActual, target: s.benefitPlan, trend: null, trendLabel: "booked against plan" });
  push({ id: "bhs.benefit_capture", section: "strategy", label: "Benefit capture rate", unit: "pct", higherIsBetter: true,
    value: pct(s.benefitActual, s.benefitPlan), target: 90, trend: null, trendLabel: "realised / planned" });
  push({ id: "bhs.a3_open", section: "strategy", label: "Open A3 / problem solves", unit: "num", higherIsBetter: false,
    value: s.a3Open, target: null, trend: null, trendLabel: "structured problem solving" });
  push({ id: "bhs.overdue_actions", section: "strategy", label: "Overdue actions", unit: "num", higherIsBetter: false,
    value: s.overdueActions, target: 0, trend: null, trendLabel: "past due date" });
  push({ id: "bhs.open_actions", section: "strategy", label: "Open actions", unit: "num", higherIsBetter: false,
    value: s.openActions, target: null, trend: null, trendLabel: "still to close" });
  push({ id: "bhs.blocked_actions", section: "strategy", label: "Blocked actions", unit: "num", higherIsBetter: false,
    value: s.blockedActions, target: 0, trend: null, trendLabel: "waiting on a decision" });
  push({ id: "bhs.certs_expiring", section: "strategy", label: "Certifications expiring (90d)", unit: "num", higherIsBetter: false,
    value: s.expiringCerts, target: 0, trend: null, trendLabel: "next 90 days" });

  // ── Commercial & growth ─────────────────────────────────────────────
  const c = input.commercial;
  push({ id: "bhc.backlog", section: "commercial", label: "Booked backlog (12m)", unit: "money", higherIsBetter: true,
    value: c.backlog12, target: c.target12 || null, trend: null, trendLabel: "vs 12-month target" });
  push({ id: "bhc.coverage", section: "commercial", label: "Coverage vs target", unit: "pct", higherIsBetter: true,
    value: pct(c.backlog12 + c.weightedPipeline, c.target12 || null), target: 100, trend: null, trendLabel: "backlog + pipeline / target" });
  push({ id: "bhc.pipeline", section: "commercial", label: "Weighted pipeline", unit: "money", higherIsBetter: true,
    value: c.weightedPipeline, target: null, trend: null, trendLabel: "probability weighted" });
  push({ id: "bhc.pipeline_gross", section: "commercial", label: "Open pipeline (unweighted)", unit: "money", higherIsBetter: true,
    value: c.openPipeline, target: null, trend: null, trendLabel: "all live opportunities" });
  push({ id: "bhc.open_count", section: "commercial", label: "Open opportunities", unit: "num", higherIsBetter: true,
    value: c.openCount, target: null, trend: null, trendLabel: "live in the funnel" });
  push({ id: "bhc.win_rate", section: "commercial", label: "Win rate", unit: "pct", higherIsBetter: true,
    value: c.wonCount + c.lostCount > 0 ? (c.wonCount / (c.wonCount + c.lostCount)) * 100 : null, target: 40, trend: null,
    trendLabel: "won / (won + lost)" });
  push({ id: "bhc.avg_deal", section: "commercial", label: "Average deal size", unit: "money", higherIsBetter: true,
    value: c.openCount > 0 ? c.openPipeline / c.openCount : null, target: null, trend: null, trendLabel: "across open opportunities" });
  push({ id: "bhc.quotes_open", section: "commercial", label: "Quotes in progress", unit: "num", higherIsBetter: true,
    value: c.quotesOpen, target: null, trend: null, trendLabel: "issued or negotiating" });
  push({ id: "bhc.accounts", section: "commercial", label: "Active accounts", unit: "num", higherIsBetter: true,
    value: c.accounts, target: null, trend: null, trendLabel: "customers on the books" });
  push({ id: "bhc.concentration", section: "commercial", label: "Top-customer share", unit: "pct", higherIsBetter: false,
    value: c.topAccountShare, target: 30, trend: null, trendLabel: "of open pipeline value" });
  push({ id: "bhc.contracts_active", section: "commercial", label: "Active contracts", unit: "num", higherIsBetter: true,
    value: c.contractsActive, target: null, trend: null, trendLabel: "in force" });
  push({ id: "bhc.contracts_expiring", section: "commercial", label: "Contracts expiring (180d)", unit: "num", higherIsBetter: false,
    value: c.contractsExpiring, target: null, trend: null, trendLabel: "up for renewal" });
  push({ id: "bhc.voc_open", section: "commercial", label: "Open customer actions", unit: "num", higherIsBetter: false,
    value: c.vocOpen, target: 0, trend: null, trendLabel: "voice of the customer" });

  // ── Operations & delivery ───────────────────────────────────────────
  const o = input.operations;
  push({ id: "bho.safety_incidents", section: "operations", label: "Safety incidents (month)", unit: "num", higherIsBetter: false,
    value: n(cur?.safety_incidents), target: 0, trend: delta(n(cur?.safety_incidents), n(prev?.safety_incidents)), trendLabel: "vs prior month" });
  push({ id: "bho.escalations", section: "operations", label: "Open escalations", unit: "num", higherIsBetter: false,
    value: o.openEscalations, target: 0, trend: null, trendLabel: "daily management" });
  push({ id: "bho.red_days", section: "operations", label: "Red marks (last 30 days)", unit: "num", higherIsBetter: false,
    value: o.redMarks, target: null, trend: null, trendLabel: "daily management board" });
  push({ id: "bho.downtime", section: "operations", label: "Unplanned downtime", unit: "num", higherIsBetter: false,
    value: o.downtimeHours, target: null, trend: null, trendLabel: "hours lost, last 30 days" });
  push({ id: "bho.copq", section: "operations", label: "Cost of poor quality", unit: "money", higherIsBetter: false,
    value: o.copqTotal, target: null, trend: null, trendLabel: "booked failure cost" });
  push({ id: "bho.overtime", section: "operations", label: "Overtime", unit: "pct", higherIsBetter: false,
    value: n(cur?.overtime_pct), target: 8, trend: delta(n(cur?.overtime_pct), n(prev?.overtime_pct)), trendLabel: "vs prior month" });
  push({ id: "bho.labour_pct", section: "operations", label: "Labour cost % of revenue", unit: "pct", higherIsBetter: false,
    value: pct(n(cur?.labor_cost), rev), target: 30, trend: delta(pct(n(cur?.labor_cost), rev), pct(n(prev?.labor_cost), revPrev)), trendLabel: "vs prior month" });
  push({ id: "bho.suppliers", section: "operations", label: "Active suppliers", unit: "num", higherIsBetter: true,
    value: o.suppliers, target: null, trend: null, trendLabel: "in the managed base" });
  push({ id: "bho.supplier_risk", section: "operations", label: "Suppliers at risk", unit: "num", higherIsBetter: false,
    value: o.suppliersAtRisk, target: 0, trend: null, trendLabel: "open high risk or escalation" });
  push({ id: "bho.inventory", section: "operations", label: "Inventory value", unit: "money", higherIsBetter: false,
    value: n(cur?.inventory), target: null, trend: delta(n(cur?.inventory), n(prev?.inventory)), trendLabel: "vs prior month" });
  push({ id: "bho.long_lead", section: "operations", label: "Long-lead items at risk", unit: "num", higherIsBetter: false,
    value: o.longLeadAtRisk, target: 0, trend: null, trendLabel: "tracked late in SIOP" });
  push({ id: "bho.npi_projects", section: "operations", label: "Live NPI projects", unit: "num", higherIsBetter: true,
    value: o.npiProjects, target: null, trend: null, trendLabel: "new product introductions" });
  push({ id: "bho.npi_gate_late", section: "operations", label: "NPI gates overdue", unit: "num", higherIsBetter: false,
    value: o.npiGatesLate, target: 0, trend: null, trendLabel: "past planned gate date" });
  push({ id: "bho.capex_projects", section: "operations", label: "Live capital projects", unit: "num", higherIsBetter: true,
    value: o.capexProjects, target: null, trend: null, trendLabel: "equipment and capital" });
  push({ id: "bho.capex_at_risk", section: "operations", label: "Capital projects at risk", unit: "num", higherIsBetter: false,
    value: o.capexAtRisk, target: 0, trend: null, trendLabel: "red or blocked" });

  // ── People & organisation ───────────────────────────────────────────
  const p = input.people;
  push({ id: "bhp.headcount", section: "people", label: "Headcount", unit: "num", higherIsBetter: true,
    value: heads, target: null, trend: delta(heads, n(prev?.headcount)), trendLabel: "vs prior month" });
  push({ id: "bhp.employees", section: "people", label: "People on the org chart", unit: "num", higherIsBetter: true,
    value: p.employees, target: null, trend: null, trendLabel: "held in the people module" });
  push({ id: "bhp.skills_coverage", section: "people", label: "Skills coverage", unit: "pct", higherIsBetter: true,
    value: p.skillsCoverage, target: 85, trend: null, trendLabel: "assessed vs required skills" });
  push({ id: "bhp.open_roles", section: "people", label: "Open critical roles", unit: "num", higherIsBetter: false,
    value: p.openRoles, target: 0, trend: null, trendLabel: "unfilled key positions" });
  push({ id: "bhp.dev_plans", section: "people", label: "Development plans active", unit: "num", higherIsBetter: true,
    value: p.devPlans, target: null, trend: null, trendLabel: "people with a live plan" });
  push({ id: "bhp.training_open", section: "people", label: "Training actions open", unit: "num", higherIsBetter: false,
    value: p.trainingOpen, target: null, trend: null, trendLabel: "outstanding" });
  push({ id: "bhp.turnover", section: "people", label: "Employee turnover", unit: "pct", higherIsBetter: false,
    value: n(cur?.turnover_pct), target: 10, trend: delta(n(cur?.turnover_pct), n(prev?.turnover_pct)), trendLabel: "vs prior month" });

  // ── KPI-library backed metrics ──────────────────────────────────────
  for (const def of BH_METRICS.filter((x) => x.source === "kpi")) {
    const k = findKpi(input.kpis, new RegExp(def.kpiMatch ?? def.label, "i"));
    push({
      id: def.id, section: def.section, group: def.group, label: def.label,
      unit: k?.unit === "currency" ? "money" : def.unit,
      higherIsBetter: k?.higherIsBetter ?? def.higherIsBetter,
      value: k?.latest ?? null, target: k?.target ?? def.defaultTarget ?? null,
      trend: delta(k?.latest ?? null, k?.previous ?? null), trendLabel: "vs prior period",
      hint: k ? undefined : "Add this KPI on the KPIs page to light this tile up.",
    });
  }

  // ── Manual and custom metrics ───────────────────────────────────────
  const extrasCur = (cur?.extras ?? {}) as Record<string, number | null>;
  const extrasPrev = (prev?.extras ?? {}) as Record<string, number | null>;
  const manual = [
    ...BH_METRICS.filter((x) => x.source === "manual").map((x) => ({
      id: x.id, section: x.section, group: x.group, label: x.label, unit: x.unit,
      higherIsBetter: x.higherIsBetter, target: x.defaultTarget ?? null,
    })),
    ...(input.custom ?? []).map((x) => ({
      id: x.id, section: x.section, group: x.group, label: x.label, unit: x.unit,
      higherIsBetter: x.higherIsBetter, target: x.target ?? null,
    })),
  ];
  for (const x of manual) {
    const v = n(extrasCur[x.id]);
    push({
      id: x.id, section: x.section, group: x.group, label: x.label, unit: x.unit, higherIsBetter: x.higherIsBetter,
      value: v, target: x.target, trend: delta(v, n(extrasPrev[x.id])), trendLabel: "vs prior month",
      hint: v == null ? "Enter this with the monthly figures." : undefined,
    });
  }

  return out;
}

export type BhRenderedGroup = { id: string; label: string; tiles: BhTile[] };
export type BhRenderedSection = {
  section: BhSectionId;
  label: string;
  question: string;
  groups: BhRenderedGroup[];
  tiles: BhTile[];
};

/** Apply a saved template: chosen metrics, section order, hidden tiles, order and renames. */
export function applyBhConfig(tiles: BhTile[], config: BhTemplateConfig): BhRenderedSection[] {
  const hidden = new Set(config.hiddenTiles);
  const chosen = new Set(bhSelectedMetricIds(config));
  return config.sections
    .map((id) => {
      const meta = BH_SECTIONS.find((x) => x.id === id)!;
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

      const groups = BH_GROUPS.filter((g) => g.section === id)
        .map((g) => ({ id: g.id, label: g.label, tiles: list.filter((t) => t.group === g.id) }))
        .filter((g) => g.tiles.length > 0);
      const ungrouped = list.filter((t) => !BH_GROUPS.some((g) => g.id === t.group));
      if (ungrouped.length) groups.push({ id: `${id}.other`, label: "Other measures", tiles: ungrouped });

      return { section: id, label: meta.label, question: meta.question, groups, tiles: list };
    })
    .filter((x) => x.tiles.length > 0);
}

/** Headline counts for the executive summary. */
export function bhScorecard(sections: BhRenderedSection[]) {
  const flat = sections.flatMap((s) => s.tiles);
  const red = flat.filter((t) => t.status === "red").length;
  const amber = flat.filter((t) => t.status === "amber").length;
  const green = flat.filter((t) => t.status === "green").length;
  const scored = red + amber + green;
  return { red, amber, green, scored, total: flat.length, healthPct: scored ? (green / scored) * 100 : null };
}

/**
 * The review as report blocks — reuses the existing table/stats/note block
 * types so the PDF and PowerPoint renderers stay unchanged and the exported
 * tables remain fully editable in PowerPoint.
 */
export function buildBhPages(
  companyName: string,
  periodLabel: string,
  sections: BhRenderedSection[],
  narratives: Record<string, string> = {},
  headline?: string,
): Page[] {
  const pages: Page[] = [{ dark: true, blocks: [] }];
  const score = bhScorecard(sections);
  const intro: Block[] = [
    { type: "h1", text: "Business health & operational excellence review", sub: `${companyName} · ${periodLabel}` },
  ];
  if (headline?.trim()) intro.push({ type: "note", title: "Executive summary", text: headline.trim() });
  intro.push({
    type: "stats",
    items: [
      { label: "Measures reviewed", value: String(score.total) },
      { label: "On target", value: String(score.green), color: "#16a34a" },
      { label: "Watch", value: String(score.amber), color: "#d97706" },
      { label: "Off target", value: String(score.red), color: "#dc2626" },
    ],
  });
  intro.push({
    type: "table",
    head: ["Pillar", "Measures", "On target", "Watch", "Off target"],
    rows: sections.map((s) => [
      s.label,
      String(s.tiles.length),
      String(s.tiles.filter((t) => t.status === "green").length),
      String(s.tiles.filter((t) => t.status === "amber").length),
      String(s.tiles.filter((t) => t.status === "red").length),
    ]),
  });
  pages.push({ blocks: intro });

  for (const s of sections) {
    const blocks: Block[] = [{ type: "h1", text: s.label, sub: s.question }];
    const note = narratives[s.section]?.trim();
    if (note) blocks.push({ type: "note", title: "Commentary", text: note });
    for (const g of s.groups) {
      blocks.push({ type: "h2", text: g.label });
      blocks.push({
        type: "table",
        head: ["Measure", "Actual", "Target", "Trend", "Status"],
        rows: g.tiles.map((t) => [
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
  }

  return pages;
}
