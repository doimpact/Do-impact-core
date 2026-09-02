// Business Health & Operational Excellence — the pickable metric database.
// Mirrors the owner metric catalogue pattern: one reference list drives the
// picker dialog, the tile computation, the saved templates and the export.
import type { TileUnit } from "@/lib/owner-dashboard";

export type BhSectionId = "financial" | "strategy" | "commercial" | "operations" | "people";
export type BhMetricSource = "auto" | "kpi" | "manual";
export type BhPackId = "default" | "lean" | "growth" | "opex" | "cash";

export const BH_SECTIONS: { id: BhSectionId; label: string; question: string }[] = [
  { id: "financial", label: "Financial health", question: "Are we making money and holding cash?" },
  { id: "strategy", label: "Strategy & transformation", question: "Are we moving the business forward?" },
  { id: "commercial", label: "Commercial & growth", question: "Is future revenue secured and profitable?" },
  { id: "operations", label: "Operations & delivery", question: "Can we deliver safely, on time and at cost?" },
  { id: "people", label: "People & organisation", question: "Do we have the capability and stability?" },
];

/** The 14 review dimensions, grouped under the four pillars plus financial health. */
export const BH_GROUPS: { id: string; section: BhSectionId; label: string }[] = [
  { id: "fin.pl", section: "financial", label: "Profit & loss performance" },
  { id: "fin.cash", section: "financial", label: "Cash & liquidity" },
  { id: "fin.wc", section: "financial", label: "Working capital" },
  { id: "fin.value", section: "financial", label: "Shareholder value" },

  { id: "str.objectives", section: "strategy", label: "Strategic objectives" },
  { id: "str.initiatives", section: "strategy", label: "Transformation initiatives" },
  { id: "str.risk", section: "strategy", label: "Risk, governance & compliance" },

  { id: "com.demand", section: "commercial", label: "Demand & pipeline" },
  { id: "com.customer", section: "commercial", label: "Customer & margin quality" },

  { id: "ops.sqd", section: "operations", label: "Safety, quality & delivery" },
  { id: "ops.cost", section: "operations", label: "Cost & productivity" },
  { id: "ops.supply", section: "operations", label: "Supply chain & inventory" },
  { id: "ops.npi", section: "operations", label: "Industrialisation & new products" },

  { id: "ppl.capability", section: "people", label: "Capability & capacity" },
  { id: "ppl.engagement", section: "people", label: "Engagement & retention" },
];

export const BH_PACKS: { id: BhPackId; name: string; blurb: string }[] = [
  { id: "default", name: "Standard review", blurb: "The default business health review." },
  { id: "lean", name: "One-page short form", blurb: "A dozen headline measures only." },
  { id: "growth", name: "Growth review", blurb: "Demand, margin quality and capacity." },
  { id: "opex", name: "Operational excellence", blurb: "SQDC, loss, COPQ and supply chain." },
  { id: "cash", name: "Cash & working capital", blurb: "Cash, receivables and inventory." },
];

export const BH_SOURCES: { id: BhMetricSource; name: string; blurb: string }[] = [
  { id: "auto", name: "Auto", blurb: "Calculated from data already in the app." },
  { id: "kpi", name: "KPI library", blurb: "Reads the matching KPI on the KPIs page." },
  { id: "manual", name: "Manual entry", blurb: "You type it in with the monthly financials." },
];

export type BhMetricDef = {
  id: string;
  section: BhSectionId;
  group: string;
  label: string;
  definition: string;
  unit: TileUnit;
  higherIsBetter: boolean;
  source: BhMetricSource;
  kpiMatch?: string;
  defaultTarget?: number | null;
  packs: BhPackId[];
};

const m = (
  id: string,
  group: string,
  label: string,
  definition: string,
  unit: TileUnit,
  higherIsBetter: boolean,
  source: BhMetricSource,
  packs: BhPackId[],
  extra: { kpiMatch?: string; defaultTarget?: number | null } = {},
): BhMetricDef => ({
  id,
  section: BH_GROUPS.find((g) => g.id === group)!.section,
  group,
  label,
  definition,
  unit,
  higherIsBetter,
  source,
  packs,
  ...extra,
});

export const BH_METRICS: BhMetricDef[] = [
  // ── Financial health ────────────────────────────────────────────────
  m("bhf.revenue", "fin.pl", "Revenue (month)", "Actual revenue for the latest closed month against budget.", "money", true, "auto", ["default", "lean", "growth"]),
  m("bhf.revenue_ytd", "fin.pl", "Revenue year to date", "Calendar year to date revenue against budget.", "money", true, "auto", ["default"]),
  m("bhf.revenue_growth", "fin.pl", "Revenue growth vs last year", "Month revenue against the same month a year ago.", "pct", true, "auto", ["default", "growth"], { defaultTarget: 100 }),
  m("bhf.gross_margin", "fin.pl", "Gross margin", "(Revenue − COGS) / Revenue.", "pct", true, "auto", ["default", "lean", "growth"]),
  m("bhf.ebitda", "fin.pl", "EBITDA (month)", "Month EBITDA against budget.", "money", true, "auto", ["default", "lean"]),
  m("bhf.ebitda_margin", "fin.pl", "EBITDA margin", "EBITDA as a share of revenue.", "pct", true, "auto", ["default", "lean"]),
  m("bhf.ebitda_ytd", "fin.pl", "EBITDA year to date", "Year to date EBITDA against year to date budget.", "money", true, "auto", ["default"]),
  m("bhf.opex_pct", "fin.pl", "Opex as % of revenue", "Operating expense divided by revenue.", "pct", false, "auto", ["default", "opex"]),
  m("bhf.budget_variance", "fin.pl", "Revenue vs budget", "Month revenue as a percentage of budget.", "pct", true, "auto", ["default"], { defaultTarget: 100 }),

  m("bhf.cash", "fin.cash", "Cash on hand", "Closing cash balance for the month.", "money", true, "auto", ["default", "lean", "cash"]),
  m("bhf.ocf", "fin.cash", "Operating cash flow", "Cash generated by operations in the month.", "money", true, "auto", ["default", "cash"]),
  m("bhf.fcf", "fin.cash", "Free cash flow (month)", "Operating cash flow after capital spend.", "money", true, "auto", ["default", "cash"]),
  m("bhf.fcf_ltm", "fin.cash", "Free cash flow (LTM)", "Free cash flow over the last twelve months.", "money", true, "auto", ["cash"]),
  m("bhf.runway", "fin.cash", "Cash runway", "Cash divided by average monthly burn — blank when cash generative.", "num", true, "auto", ["cash"]),

  m("bhf.dso", "fin.wc", "DSO — days sales outstanding", "Receivables divided by average daily LTM revenue.", "days", false, "auto", ["default", "cash"], { defaultTarget: 45 }),
  m("bhf.dio", "fin.wc", "Inventory days", "Inventory divided by average daily LTM cost of goods.", "days", false, "auto", ["default", "cash", "opex"], { defaultTarget: 60 }),
  m("bhf.dpo", "fin.wc", "DPO — days payable", "Payables divided by average daily LTM cost of goods.", "days", true, "auto", ["cash"], { defaultTarget: 45 }),
  m("bhf.ccc", "fin.wc", "Cash conversion cycle", "DSO plus inventory days less DPO.", "days", false, "auto", ["default", "cash"], { defaultTarget: 60 }),
  m("bhf.ar60", "fin.wc", "Receivables over 60 days", "Overdue receivables as a share of the total.", "pct", false, "auto", ["cash"], { defaultTarget: 10 }),
  m("bhf.inventory_turns", "fin.wc", "Inventory turns", "LTM cost of goods divided by inventory value.", "x", true, "auto", ["cash", "opex"], { defaultTarget: 6 }),
  m("bhf.net_wc_pct", "fin.wc", "Working capital % of revenue", "Net working capital over LTM revenue.", "pct", false, "auto", ["cash"], { defaultTarget: 20 }),

  m("bhf.ebitda_ltm", "fin.value", "EBITDA (last 12 months)", "Rolling twelve-month EBITDA.", "money", true, "auto", ["default"]),
  m("bhf.net_debt", "fin.value", "Net debt", "Debt less cash.", "money", false, "auto", ["default"]),
  m("bhf.leverage", "fin.value", "Net debt / EBITDA", "Leverage on LTM EBITDA.", "x", false, "auto", ["default"], { defaultTarget: 3 }),
  m("bhf.equity_value", "fin.value", "Indicative equity value", "LTM EBITDA × multiple, less net debt.", "money", true, "auto", ["default"]),
  m("bhf.rev_per_head", "fin.value", "Revenue per employee (LTM)", "LTM revenue divided by headcount.", "money", true, "auto", ["default", "opex"]),

  // ── Strategy & transformation ────────────────────────────────────────
  m("bhs.objectives", "str.objectives", "Strategic objectives", "Objectives live in the current strategy.", "num", true, "auto", ["default"]),
  m("bhs.on_track", "str.objectives", "Objectives on track", "Share of objectives marked on track.", "pct", true, "auto", ["default", "lean"], { defaultTarget: 80 }),
  m("bhs.at_risk", "str.objectives", "Objectives at risk", "Objectives flagged at risk.", "num", false, "auto", ["default"], { defaultTarget: 0 }),
  m("bhs.not_started", "str.objectives", "Objectives not started", "Objectives with no progress yet.", "num", false, "auto", ["default"]),
  m("bhs.hoshin_items", "str.objectives", "Hoshin items in play", "Long-term, annual and priority items on the X-matrix.", "num", true, "auto", []),

  m("bhs.initiatives", "str.initiatives", "Active initiatives", "Improvement and transformation initiatives running.", "num", true, "auto", ["default"]),
  m("bhs.initiatives_done", "str.initiatives", "Initiatives completed", "Initiatives that reached the final stage.", "num", true, "auto", ["default"]),
  m("bhs.benefit_plan", "str.initiatives", "Benefit planned", "Planned benefit across the value waterfall.", "money", true, "auto", ["default"]),
  m("bhs.benefit_actual", "str.initiatives", "Benefit realised", "Benefit booked against the waterfall.", "money", true, "auto", ["default", "lean"]),
  m("bhs.benefit_capture", "str.initiatives", "Benefit capture rate", "Realised benefit as a share of plan.", "pct", true, "auto", ["default"], { defaultTarget: 90 }),
  m("bhs.a3_open", "str.initiatives", "Open A3 / problem solves", "Structured problem solving still open.", "num", false, "auto", []),

  m("bhs.overdue_actions", "str.risk", "Overdue actions", "Actions past their due date across the business.", "num", false, "auto", ["default", "lean"], { defaultTarget: 0 }),
  m("bhs.open_actions", "str.risk", "Open actions", "Actions still to close.", "num", false, "auto", ["default"]),
  m("bhs.blocked_actions", "str.risk", "Blocked actions", "Actions waiting on a decision or a dependency.", "num", false, "auto", ["default"], { defaultTarget: 0 }),
  m("bhs.certs_expiring", "str.risk", "Certifications expiring (90d)", "Approvals and certifications due in the next quarter.", "num", false, "auto", ["default"], { defaultTarget: 0 }),
  m("bhs.audit_findings", "str.risk", "Open audit findings", "Internal and external audit findings still open.", "num", false, "manual", [], { defaultTarget: 0 }),
  m("bhs.insurance_review", "str.risk", "Key risks reviewed", "Top enterprise risks reviewed this period.", "num", true, "manual", []),

  // ── Commercial & growth ──────────────────────────────────────────────
  m("bhc.backlog", "com.demand", "Booked backlog (12m)", "Confirmed orders on the books for the next twelve months.", "money", true, "auto", ["default", "lean", "growth"]),
  m("bhc.coverage", "com.demand", "Coverage vs target", "Backlog plus weighted pipeline against the twelve-month target.", "pct", true, "auto", ["default", "growth"], { defaultTarget: 100 }),
  m("bhc.pipeline", "com.demand", "Weighted pipeline", "Open opportunity value weighted by probability.", "money", true, "auto", ["default", "growth"]),
  m("bhc.pipeline_gross", "com.demand", "Open pipeline (unweighted)", "Total value of all live opportunities.", "money", true, "auto", ["growth"]),
  m("bhc.open_count", "com.demand", "Open opportunities", "Number of live opportunities in the funnel.", "num", true, "auto", ["growth"]),
  m("bhc.win_rate", "com.demand", "Win rate", "Won opportunities divided by won plus lost.", "pct", true, "auto", ["default", "growth"], { defaultTarget: 40 }),
  m("bhc.avg_deal", "com.demand", "Average deal size", "Average value of an open opportunity.", "money", true, "auto", ["growth"]),
  m("bhc.quotes_open", "com.demand", "Quotes in progress", "Quotes issued or under negotiation.", "num", true, "auto", ["growth"]),
  m("bhc.quote_turnaround", "com.demand", "Quote turnaround", "Average days from enquiry to quote issued.", "days", false, "manual", ["growth"], { defaultTarget: 5 }),

  m("bhc.accounts", "com.customer", "Active accounts", "Customers on the books.", "num", true, "auto", ["default"]),
  m("bhc.concentration", "com.customer", "Top-customer share", "Largest customer as a share of open pipeline value.", "pct", false, "auto", ["default", "growth"], { defaultTarget: 30 }),
  m("bhc.contracts_active", "com.customer", "Active contracts", "Contracts currently in force.", "num", true, "auto", []),
  m("bhc.contracts_expiring", "com.customer", "Contracts expiring (180d)", "Agreements up for renewal within six months.", "num", false, "auto", ["growth"]),
  m("bhc.voc_open", "com.customer", "Open customer actions", "Voice of the customer follow-ups still open.", "num", false, "auto", ["default"], { defaultTarget: 0 }),
  m("bhc.otd_customer", "com.customer", "Customer on-time delivery", "Delivery performance as the customer scores it.", "pct", true, "kpi", ["default", "lean", "growth"], { kpiMatch: "on.?time", defaultTarget: 95 }),
  m("bhc.nps", "com.customer", "Net promoter score", "Customer advocacy score you enter each month.", "num", true, "manual", [], { defaultTarget: 40 }),
  m("bhc.complaints", "com.customer", "Customer complaints", "Formal complaints received in the month.", "num", false, "manual", ["opex"], { defaultTarget: 0 }),
  m("bhc.price_realisation", "com.customer", "Price realisation", "Achieved price against list or quoted price.", "pct", true, "manual", ["growth"], { defaultTarget: 100 }),

  // ── Operations & delivery ────────────────────────────────────────────
  m("bho.safety_incidents", "ops.sqd", "Safety incidents (month)", "Recordable incidents in the month.", "num", false, "auto", ["default", "lean", "opex"], { defaultTarget: 0 }),
  m("bho.near_miss", "ops.sqd", "Near misses reported", "Leading safety indicator — reporting culture.", "num", true, "manual", ["opex"]),
  m("bho.otif", "ops.sqd", "On-time in-full", "Orders shipped complete and on time.", "pct", true, "kpi", ["default", "opex"], { kpiMatch: "otif|in.?full", defaultTarget: 95 }),
  m("bho.scrap", "ops.sqd", "Scrap rate", "Scrap as a share of production value.", "pct", false, "kpi", ["default", "opex"], { kpiMatch: "scrap", defaultTarget: 2 }),
  m("bho.rework", "ops.sqd", "Rework rate", "Rework hours or value as a share of output.", "pct", false, "kpi", ["opex"], { kpiMatch: "rework", defaultTarget: 3 }),
  m("bho.fpy", "ops.sqd", "First pass yield", "Units right first time without rework.", "pct", true, "kpi", ["default", "opex"], { kpiMatch: "first pass|fpy", defaultTarget: 95 }),
  m("bho.escalations", "ops.sqd", "Open escalations", "Daily management escalations still open.", "num", false, "auto", ["default", "lean", "opex"], { defaultTarget: 0 }),
  m("bho.red_days", "ops.sqd", "Red marks (last 30 days)", "Days a daily management metric was red.", "num", false, "auto", ["opex"]),

  m("bho.oee", "ops.cost", "OEE", "Overall equipment effectiveness on the constraint.", "pct", true, "kpi", ["default", "opex"], { kpiMatch: "oee", defaultTarget: 75 }),
  m("bho.downtime", "ops.cost", "Unplanned downtime", "Hours lost to unplanned stoppages.", "num", false, "auto", ["opex"]),
  m("bho.copq", "ops.cost", "Cost of poor quality", "Booked cost of failure, scrap and rework.", "money", false, "auto", ["default", "opex"]),
  m("bho.productivity", "ops.cost", "Labour productivity", "Output per direct labour hour.", "num", true, "kpi", ["opex"], { kpiMatch: "productivit" }),
  m("bho.overtime", "ops.cost", "Overtime", "Overtime as a share of worked hours.", "pct", false, "auto", ["default", "opex"], { defaultTarget: 8 }),
  m("bho.labour_pct", "ops.cost", "Labour cost % of revenue", "Direct and indirect labour over revenue.", "pct", false, "auto", ["default", "opex"], { defaultTarget: 30 }),
  m("bho.capacity_util", "ops.cost", "Capacity utilisation", "Load against demonstrated capacity.", "pct", true, "kpi", ["growth", "opex"], { kpiMatch: "utilis|utiliz|capacity", defaultTarget: 85 }),
  m("bho.energy", "ops.cost", "Energy cost per unit", "Energy spend divided by units produced.", "money", false, "manual", []),

  m("bho.supplier_otd", "ops.supply", "Supplier on-time delivery", "Inbound delivery performance.", "pct", true, "kpi", ["default", "opex"], { kpiMatch: "supplier.*(on.?time|otd)", defaultTarget: 95 }),
  m("bho.suppliers", "ops.supply", "Active suppliers", "Suppliers in the managed base.", "num", true, "auto", []),
  m("bho.supplier_risk", "ops.supply", "Suppliers at risk", "Suppliers with an open high risk or escalation.", "num", false, "auto", ["default", "opex"], { defaultTarget: 0 }),
  m("bho.inventory", "ops.supply", "Inventory value", "Stock on hand at the month end.", "money", false, "auto", ["default", "cash"]),
  m("bho.shortages", "ops.supply", "Material shortages", "Lines short against the schedule.", "num", false, "manual", ["opex"], { defaultTarget: 0 }),
  m("bho.long_lead", "ops.supply", "Long-lead items at risk", "Long-lead materials tracked as late in SIOP.", "num", false, "auto", []),

  m("bho.npi_projects", "ops.npi", "Live NPI projects", "New product introductions in flight.", "num", true, "auto", ["growth"]),
  m("bho.npi_gate_late", "ops.npi", "NPI gates overdue", "Gate reviews past their planned date.", "num", false, "auto", ["growth"], { defaultTarget: 0 }),
  m("bho.capex_projects", "ops.npi", "Live capital projects", "Equipment and capital projects running.", "num", true, "auto", []),
  m("bho.capex_at_risk", "ops.npi", "Capital projects at risk", "Capital projects flagged red or blocked.", "num", false, "auto", [], { defaultTarget: 0 }),

  // ── People & organisation ────────────────────────────────────────────
  m("bhp.headcount", "ppl.capability", "Headcount", "People on the payroll at month end.", "num", true, "auto", ["default"]),
  m("bhp.employees", "ppl.capability", "People on the org chart", "Employees held in the people module.", "num", true, "auto", []),
  m("bhp.skills_coverage", "ppl.capability", "Skills coverage", "Assessed skills against required role skills.", "pct", true, "auto", ["default"], { defaultTarget: 85 }),
  m("bhp.open_roles", "ppl.capability", "Open critical roles", "Key positions still unfilled.", "num", false, "auto", ["default"], { defaultTarget: 0 }),
  m("bhp.dev_plans", "ppl.capability", "Development plans active", "People with a live development plan.", "num", true, "auto", []),
  m("bhp.training_open", "ppl.capability", "Training actions open", "Training and qualification actions outstanding.", "num", false, "auto", ["default"]),
  m("bhp.succession", "ppl.capability", "Critical roles with a successor", "Key roles with a named, ready successor.", "pct", true, "manual", [], { defaultTarget: 80 }),

  m("bhp.turnover", "ppl.engagement", "Employee turnover", "Leavers as a share of headcount.", "pct", false, "auto", ["default", "lean"], { defaultTarget: 10 }),
  m("bhp.absence", "ppl.engagement", "Absence rate", "Unplanned absence as a share of available hours.", "pct", false, "manual", ["opex"], { defaultTarget: 3 }),
  m("bhp.engagement", "ppl.engagement", "Engagement score", "Pulse or survey score you enter each period.", "num", true, "manual", [], { defaultTarget: 75 }),
  m("bhp.suggestions", "ppl.engagement", "Improvement ideas submitted", "Continuous improvement suggestions from the team.", "num", true, "manual", ["opex"]),
  m("bhp.tenure", "ppl.engagement", "Average tenure", "Average years of service.", "num", true, "manual", []),
];

export const DEFAULT_BH_METRIC_IDS = BH_METRICS.filter((x) => x.packs.includes("default")).map((x) => x.id);

export function bhMetricsForPack(pack: BhPackId): string[] {
  return BH_METRICS.filter((x) => x.packs.includes(pack)).map((x) => x.id);
}

export type BhCustomMetric = {
  id: string;
  label: string;
  section: BhSectionId;
  group: string;
  unit: TileUnit;
  higherIsBetter: boolean;
  target: number | null;
  definition?: string;
};
