/**
 * Decision Playbook — rule-based engine.
 *
 * Pure TypeScript: given a goal and a set of numeric / choice inputs it returns
 * recommended next actions, the assumptions those recommendations rest on, and
 * the measures to watch. No AI, no network, no database — the same inputs always
 * produce the same playbook, and every recommendation carries the rule that fired
 * it in plain language.
 */

export type Horizon = "week" | "month" | "quarter";
export type Weight = "low" | "med" | "high";

export type PlaybookInputs = Record<string, number | string | null>;

export type GoalInput =
  | {
      key: string;
      label: string;
      kind: "number";
      unit?: string;
      hint?: string;
      min?: number;
      max?: number;
      prefillMetric?: string;
    }
  | {
      key: string;
      label: string;
      kind: "choice";
      hint?: string;
      options: { value: string; label: string }[];
    };

export type GoalDef = {
  key: string;
  label: string;
  blurb: string;
  inputs: GoalInput[];
  watch: string[];
  rules: Rule[];
};

export type Rule = {
  key: string;
  /** Fires when this returns true for the supplied inputs. */
  when: (v: Reader) => boolean;
  action: string;
  /** Plain-language statement of the rule that fired. */
  rationale: string | ((v: Reader) => string);
  horizon: Horizon;
  impact: Weight;
  effort: Weight;
  assumptions?: { text: string; test: string; effort: Weight }[];
};

export type Recommendation = {
  ruleKey: string;
  text: string;
  rationale: string;
  horizon: Horizon;
  impact: Weight;
  effort: Weight;
};

export type AssumptionItem = {
  ruleKey: string;
  text: string;
  test: string;
  effort: Weight;
};

export type Playbook = {
  goal: GoalDef;
  actions: Recommendation[];
  assumptions: AssumptionItem[];
  watch: string[];
  missingInputs: string[];
};

/* ------------------------------------------------------------------ */
/* Input reader                                                        */
/* ------------------------------------------------------------------ */

export class Reader {
  constructor(private readonly v: PlaybookInputs) {}

  /** Numeric value, or `fallback` when blank / not a number. */
  n(key: string, fallback = Number.NaN): number {
    const raw = this.v[key];
    if (raw === null || raw === undefined || raw === "") return fallback;
    const num = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(num) ? num : fallback;
  }

  /** True when a numeric input was supplied. */
  has(key: string): boolean {
    return Number.isFinite(this.n(key));
  }

  s(key: string): string {
    const raw = this.v[key];
    return raw === null || raw === undefined ? "" : String(raw);
  }

  is(key: string, value: string): boolean {
    return this.s(key) === value;
  }

  /** Gap between a target and the current value (positive = short of target). */
  gap(currentKey: string, targetKey: string): number {
    return this.n(targetKey, Number.NaN) - this.n(currentKey, Number.NaN);
  }
}

const HORIZON_LABEL: Record<Horizon, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
};

export const horizonLabel = (h: Horizon) => HORIZON_LABEL[h];

const WEIGHT_LABEL: Record<Weight, string> = { low: "Low", med: "Medium", high: "High" };
export const weightLabel = (w: Weight) => WEIGHT_LABEL[w];

const IMPACT_SCORE: Record<Weight, number> = { high: 3, med: 2, low: 1 };
const EFFORT_SCORE: Record<Weight, number> = { low: 3, med: 2, high: 1 };
const HORIZON_SCORE: Record<Horizon, number> = { week: 3, month: 2, quarter: 1 };

/* ------------------------------------------------------------------ */
/* Goal catalogue                                                      */
/* ------------------------------------------------------------------ */

const pctInput = (key: string, label: string, hint?: string, prefillMetric?: string): GoalInput => ({
  key,
  label,
  kind: "number",
  unit: "%",
  min: 0,
  max: 100,
  ...(hint ? { hint } : {}),
  ...(prefillMetric ? { prefillMetric } : {}),
});

export const GOALS: GoalDef[] = [
  /* ---------------------------------------------------------------- */
  {
    key: "otd",
    label: "Improve on-time delivery",
    blurb: "Close the gap between promised and actual delivery dates without simply adding cost.",
    inputs: [
      pctInput("otd_current", "Current OTD", "Last full month, measured against the customer's original request date.", "otd"),
      pctInput("otd_target", "Target OTD"),
      pctInput("schedule_adherence", "Schedule adherence", "How much of the released schedule was actually completed as planned."),
      { key: "lead_time_days", label: "Quoted lead time", kind: "number", unit: "days" },
      { key: "actual_lead_time_days", label: "Actual lead time", kind: "number", unit: "days" },
      {
        key: "main_miss_reason",
        label: "Biggest miss reason",
        kind: "choice",
        options: [
          { value: "material", label: "Material / supplier late" },
          { value: "capacity", label: "Not enough capacity" },
          { value: "quality", label: "Rework and quality escapes" },
          { value: "planning", label: "Planning and sequencing" },
          { value: "unknown", label: "Not known" },
        ],
      },
      { key: "wip_orders", label: "Open orders in WIP", kind: "number", hint: "Work released to the floor but not shipped." },
    ],
    watch: ["OTD to original request date", "Schedule adherence", "Average days late on the misses"],
    rules: [
      {
        key: "otd_no_measure",
        when: (v) => !v.has("otd_current"),
        action: "Start measuring OTD daily against the customer's original request date",
        rationale: "No current OTD figure was entered — you cannot recover a number you are not measuring.",
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Promise dates in the system are the dates the customer actually agreed", test: "Sample 10 recent orders and compare the order acknowledgement to the system date", effort: "low" },
        ],
      },
      {
        key: "otd_reason_unknown",
        when: (v) => v.is("main_miss_reason", "unknown") || v.s("main_miss_reason") === "",
        action: "Code every late order for two weeks with a single reason from a fixed list",
        rationale: "The dominant miss reason is not known, so any fix is a guess.",
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Late orders have one dominant cause rather than many small ones", test: "Pareto the two weeks of reason codes — a real dominant cause is 40%+ of misses", effort: "low" },
        ],
      },
      {
        key: "otd_stabilise_schedule",
        when: (v) => v.gap("otd_current", "otd_target") > 10 && v.n("schedule_adherence", 100) < 85,
        action: "Freeze the schedule for the next 5 days and run a daily schedule-adherence review",
        rationale: (v) =>
          `OTD gap of ${v.gap("otd_current", "otd_target").toFixed(0)} points with schedule adherence at ${v.n("schedule_adherence").toFixed(0)}% — stabilise the schedule before adding capacity.`,
        horizon: "week",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The schedule is achievable if it is left alone", test: "Run one week frozen and measure adherence against the same load", effort: "med" },
          { text: "Late changes come from inside the plant, not from customers", test: "Log every schedule change for a week with its origin", effort: "low" },
        ],
      },
      {
        key: "otd_supplier",
        when: (v) => v.is("main_miss_reason", "material"),
        action: "Put the top 5 late suppliers on a weekly confirmed-delivery call and re-plan around their real dates",
        rationale: "Material shortage is the biggest miss reason — supplier promise dates drive your OTD.",
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Supplier lateness is concentrated in a handful of suppliers", test: "Rank supplier OTD for the last quarter by number of late lines", effort: "low" },
          { text: "Your own purchase orders are placed with enough lead time", test: "Compare PO placement date to supplier quoted lead time on 20 late lines", effort: "low" },
        ],
      },
      {
        key: "otd_capacity",
        when: (v) => v.is("main_miss_reason", "capacity"),
        action: "Identify the single constraint operation and protect it — no setups, no shortages, no unplanned maintenance",
        rationale: "Capacity was named as the biggest miss reason; capacity problems are almost always one constraint, not the whole plant.",
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "One operation genuinely constrains the flow", test: "Compare queue length and utilisation across operations for two weeks", effort: "med" },
          { text: "The constraint is capacity, not availability", test: "Split the constraint's lost time into breakdown, setup and starvation", effort: "med" },
        ],
      },
      {
        key: "otd_quality",
        when: (v) => v.is("main_miss_reason", "quality"),
        action: "Open a problem-solving case on the top rework driver and add a containment check before the constraint",
        rationale: "Rework was named as the biggest miss reason — rework consumes the capacity you are trying to protect.",
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Rework is concentrated on a few parts or operations", test: "Pareto rework hours by part number for the last quarter", effort: "low" },
        ],
      },
      {
        key: "otd_planning",
        when: (v) => v.is("main_miss_reason", "planning"),
        action: "Set a weekly load-versus-capacity review and stop releasing work that has no capacity slot",
        rationale: "Planning was named as the biggest miss reason — releasing more than the plant can absorb turns into lateness.",
        horizon: "month",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Capacity per work centre is known well enough to plan against", test: "Compare planned hours to actual hours on three work centres for a month", effort: "med" },
        ],
      },
      {
        key: "otd_leadtime_gap",
        when: (v) => v.has("lead_time_days") && v.has("actual_lead_time_days") && v.n("actual_lead_time_days") > v.n("lead_time_days") * 1.2,
        action: "Requote lead time to reality on new orders while the recovery runs",
        rationale: (v) =>
          `Actual lead time (${v.n("actual_lead_time_days").toFixed(0)} days) is more than 20% above the quoted ${v.n("lead_time_days").toFixed(0)} days — you are promising something the process does not do.`,
        horizon: "week",
        impact: "med",
        effort: "low",
        assumptions: [
          { text: "Customers will accept a longer but reliable date", test: "Test the longer date on the next 5 quotes and record the win rate", effort: "low" },
        ],
      },
      {
        key: "otd_wip",
        when: (v) => v.has("wip_orders") && v.has("lead_time_days") && v.n("wip_orders") > 0 && v.n("actual_lead_time_days", v.n("lead_time_days")) > v.n("lead_time_days"),
        action: "Cap work in progress — release new work only when an order ships",
        rationale: "Lead time is running over quote with open work on the floor; more WIP lengthens every queue.",
        horizon: "month",
        impact: "med",
        effort: "med",
        assumptions: [
          { text: "The floor has more work released than it can flow", test: "Track WIP and shipments daily for two weeks and compare the ratio", effort: "low" },
        ],
      },
      {
        key: "otd_close",
        when: (v) => v.has("otd_current") && v.gap("otd_current", "otd_target") > 0 && v.gap("otd_current", "otd_target") <= 5,
        action: "Run a daily miss review on the exceptions only — you are within striking distance",
        rationale: (v) => `Only ${v.gap("otd_current", "otd_target").toFixed(0)} points from target — this is an exception problem, not a system rebuild.`,
        horizon: "week",
        impact: "med",
        effort: "low",
      },
      {
        key: "otd_at_target",
        when: (v) => v.has("otd_current") && v.has("otd_target") && v.gap("otd_current", "otd_target") <= 0,
        action: "Hold the gain — standardise what changed and raise the target",
        rationale: "Current OTD is already at or above target.",
        horizon: "quarter",
        impact: "med",
        effort: "low",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    key: "copq",
    label: "Cut scrap and cost of poor quality",
    blurb: "Take cost out by stopping the defects, rework and escapes you are already paying for.",
    inputs: [
      pctInput("scrap_rate", "Scrap rate", "Scrap value as a share of production value."),
      pctInput("scrap_target", "Target scrap rate"),
      { key: "rework_hours", label: "Rework hours per month", kind: "number", unit: "hrs" },
      { key: "copq_cost", label: "Known cost of poor quality per month", kind: "number", unit: "currency" },
      { key: "escapes", label: "Customer escapes last quarter", kind: "number", hint: "Defects the customer found." },
      {
        key: "detection_point",
        label: "Where defects are usually found",
        kind: "choice",
        options: [
          { value: "at_source", label: "At the operation that made them" },
          { value: "final", label: "Final inspection" },
          { value: "customer", label: "At the customer" },
          { value: "unknown", label: "Not known" },
        ],
      },
      { key: "top_driver_share", label: "Share of cost from the top driver", kind: "number", unit: "%", hint: "How much of the total sits on the single biggest cause." },
    ],
    watch: ["Scrap rate", "Rework hours", "Customer escapes", "Cost of poor quality per month"],
    rules: [
      {
        key: "copq_no_cost",
        when: (v) => !v.has("copq_cost"),
        action: "Put a monthly number on the cost of poor quality — scrap value plus rework hours plus sort and return cost",
        rationale: "No cost of poor quality figure was entered; without a number the problem stays invisible in the P&L.",
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Scrap and rework are recorded consistently enough to add up", test: "Reconcile one month of recorded scrap against stock and the ledger", effort: "med" },
        ],
      },
      {
        key: "copq_customer_detection",
        when: (v) => v.is("detection_point", "customer") || v.n("escapes", 0) > 0,
        action: "Contain first: add a temporary 100% check before despatch on the affected parts, then work back to the source",
        rationale: "Defects are reaching the customer — protect the customer while the root cause is found.",
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "The escapes share a common part family or process", test: "Map the last 10 escapes to part, operation and shift", effort: "low" },
          { text: "The check can actually detect the defect", test: "Seed 5 known-bad samples through the check and count how many are caught", effort: "low" },
        ],
      },
      {
        key: "copq_final_inspection",
        when: (v) => v.is("detection_point", "final"),
        action: "Move detection upstream — add an in-process check at the operation that creates the defect",
        rationale: "Defects are being caught at final inspection, so you are paying full processing cost on parts you then scrap.",
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The defect is created at one identifiable operation", test: "Run a check sheet at the three candidate operations for a week", effort: "med" },
        ],
      },
      {
        key: "copq_pareto",
        when: (v) => !v.has("top_driver_share") || v.n("top_driver_share") < 40,
        action: "Pareto the cost of poor quality by part and operation before starting any fix",
        rationale: "No single dominant driver is identified, so effort would be spread too thin to move the number.",
        horizon: "week",
        impact: "med",
        effort: "low",
        assumptions: [
          { text: "Three months of data is enough to see the pattern", test: "Compare the Pareto for the last month against the last quarter", effort: "low" },
        ],
      },
      {
        key: "copq_top_driver",
        when: (v) => v.n("top_driver_share", 0) >= 40,
        action: "Open a structured problem-solving case (8D or A3) on the top driver and assign a single owner",
        rationale: (v) => `The top driver carries ${v.n("top_driver_share").toFixed(0)}% of the cost — one case can move most of the number.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The top driver is a process problem, not a design or specification problem", test: "Check whether the same defect appears across all machines and shifts", effort: "med" },
        ],
      },
      {
        key: "copq_rework_heavy",
        when: (v) => v.n("rework_hours", 0) >= 100,
        action: "Treat rework hours as lost capacity — put them on the daily board next to output",
        rationale: (v) => `${v.n("rework_hours").toFixed(0)} rework hours a month is capacity you already paid for.`,
        horizon: "week",
        impact: "med",
        effort: "low",
        assumptions: [
          { text: "Rework hours are booked separately from production hours", test: "Check whether operators have a distinct rework booking code", effort: "low" },
        ],
      },
      {
        key: "copq_gap",
        when: (v) => v.has("scrap_rate") && v.has("scrap_target") && v.n("scrap_rate") > v.n("scrap_target") * 2,
        action: "Set a stepped scrap target — halve the gap first rather than jumping straight to the end goal",
        rationale: (v) => `Scrap at ${v.n("scrap_rate").toFixed(1)}% is more than double the ${v.n("scrap_target").toFixed(1)}% target; a stepped target keeps the team engaged.`,
        horizon: "quarter",
        impact: "med",
        effort: "low",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    key: "cash",
    label: "Free up cash",
    blurb: "Release cash trapped in inventory, work in progress and overdue invoices before borrowing more.",
    inputs: [
      { key: "inventory_value", label: "Inventory value", kind: "number", unit: "currency" },
      { key: "inventory_turns", label: "Inventory turns per year", kind: "number" },
      { key: "dso_days", label: "Debtor days (DSO)", kind: "number", unit: "days" },
      { key: "dpo_days", label: "Creditor days (DPO)", kind: "number", unit: "days" },
      { key: "wip_value", label: "Work in progress value", kind: "number", unit: "currency" },
      { key: "overdue_receivables", label: "Overdue receivables", kind: "number", unit: "currency" },
      { key: "cash_runway_weeks", label: "Cash runway", kind: "number", unit: "weeks", hint: "Weeks of cover at the current burn." },
    ],
    watch: ["13-week cash forecast", "Debtor days", "Inventory turns", "Overdue receivables"],
    rules: [
      {
        key: "cash_runway_critical",
        when: (v) => v.has("cash_runway_weeks") && v.n("cash_runway_weeks") < 8,
        action: "Stand up a 13-week rolling cash forecast reviewed every Monday",
        rationale: (v) => `Runway of ${v.n("cash_runway_weeks").toFixed(0)} weeks is inside the window where a surprise becomes an emergency.`,
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Committed spend is fully visible, including open purchase orders", test: "Reconcile the open PO book against the forecast for the next 4 weeks", effort: "med" },
        ],
      },
      {
        key: "cash_overdue",
        when: (v) => v.n("overdue_receivables", 0) > 0,
        action: "Call the top 10 overdue accounts personally this week and agree a dated payment plan for each",
        rationale: "There is money already earned and unpaid — this is the cheapest cash in the business.",
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "The overdue invoices are undisputed", test: "Check each of the top 10 for open queries or missing paperwork", effort: "low" },
        ],
      },
      {
        key: "cash_dso",
        when: (v) => v.n("dso_days", 0) > 45,
        action: "Tighten the invoice cycle — invoice on despatch, not at month end, and chase at day 3 past due",
        rationale: (v) => `Debtor days at ${v.n("dso_days").toFixed(0)} means you are funding customers for over six weeks.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The delay is in your invoicing, not in the customer's terms", test: "Measure days from despatch to invoice sent on 20 recent orders", effort: "low" },
        ],
      },
      {
        key: "cash_turns",
        when: (v) => v.has("inventory_turns") && v.n("inventory_turns") < 6,
        action: "Segment inventory into fast, slow and dead, and stop reordering anything in the dead bucket",
        rationale: (v) => `${v.n("inventory_turns").toFixed(1)} turns a year means the average item sits over two months.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Slow-moving stock is not there to protect a real service commitment", test: "Check the slow bucket against contracted spares or safety-stock agreements", effort: "med" },
        ],
      },
      {
        key: "cash_wip",
        when: (v) => v.has("wip_value") && v.has("inventory_value") && v.n("wip_value") > v.n("inventory_value") * 0.3,
        action: "Cap work in progress and finish what is started before releasing more",
        rationale: "Work in progress is a large share of total inventory — cash is sitting on the floor half-finished.",
        horizon: "month",
        impact: "med",
        effort: "med",
        assumptions: [
          { text: "WIP is high because of release policy, not long process times", test: "Compare touch time to total elapsed time on 5 typical orders", effort: "med" },
        ],
      },
      {
        key: "cash_terms",
        when: (v) => v.has("dso_days") && v.has("dpo_days") && v.n("dso_days") > v.n("dpo_days"),
        action: "Renegotiate payment terms so you are not paying suppliers faster than customers pay you",
        rationale: (v) => `You collect in ${v.n("dso_days").toFixed(0)} days and pay in ${v.n("dpo_days").toFixed(0)} — the gap is funded from your own cash.`,
        horizon: "quarter",
        impact: "med",
        effort: "med",
        assumptions: [
          { text: "Suppliers will extend terms without raising price", test: "Test the ask with two suppliers and compare the quoted price impact", effort: "low" },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    key: "throughput",
    label: "Lift throughput",
    blurb: "Get more good parts out of the plant you already have, before spending on capacity.",
    inputs: [
      pctInput("oee", "OEE", "Availability × performance × quality on the constraint.", "oee"),
      pctInput("availability", "Availability"),
      pctInput("performance", "Performance"),
      pctInput("quality_rate", "Quality rate"),
      { key: "changeover_minutes", label: "Average changeover time", kind: "number", unit: "min" },
      { key: "changeovers_per_week", label: "Changeovers per week", kind: "number" },
      { key: "demand_vs_capacity", label: "Demand as a share of capacity", kind: "number", unit: "%" },
    ],
    watch: ["Constraint OEE", "Output per shift", "Changeover minutes lost per week"],
    rules: [
      {
        key: "tp_no_constraint",
        when: (v) => !v.has("oee"),
        action: "Measure OEE on the constraint operation only, for two weeks, by shift",
        rationale: "No OEE figure was entered — plant-wide averages hide the operation that actually limits output.",
        horizon: "week",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The operation you believe is the constraint really is", test: "Compare queue in front of each operation over two weeks", effort: "med" },
        ],
      },
      {
        key: "tp_availability",
        when: (v) => v.has("availability") && v.n("availability") < 85 && v.n("availability") <= Math.min(v.n("performance", 100), v.n("quality_rate", 100)),
        action: "Attack downtime first — log every stop over 5 minutes with a reason and run a weekly Pareto",
        rationale: (v) => `Availability (${v.n("availability").toFixed(0)}%) is the weakest of the three OEE factors.`,
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Downtime is dominated by a few repeat causes", test: "Two weeks of stop reasons — a real pattern shows 3 causes over half the time", effort: "low" },
        ],
      },
      {
        key: "tp_performance",
        when: (v) => v.has("performance") && v.n("performance") < 85 && v.n("performance") < v.n("availability", 100) && v.n("performance") <= v.n("quality_rate", 100),
        action: "Check cycle times against standard on the constraint and remove the minor stops and speed losses",
        rationale: (v) => `Performance (${v.n("performance").toFixed(0)}%) is the weakest OEE factor — the machine runs, but slowly.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The standard cycle time is realistic and current", test: "Time 10 cycles on the constraint and compare to the routing", effort: "low" },
        ],
      },
      {
        key: "tp_quality",
        when: (v) => v.has("quality_rate") && v.n("quality_rate") < 95,
        action: "Fix quality at the constraint first — a scrapped part there costs the whole plant's capacity",
        rationale: (v) => `Quality rate of ${v.n("quality_rate").toFixed(0)}% at the constraint destroys throughput you cannot get back.`,
        horizon: "month",
        impact: "high",
        effort: "med",
      },
      {
        key: "tp_changeover",
        when: (v) => v.n("changeover_minutes", 0) * v.n("changeovers_per_week", 0) >= 300,
        action: "Run a SMED workshop on the constraint changeover — split internal and external work first",
        rationale: (v) =>
          `${(v.n("changeover_minutes") * v.n("changeovers_per_week")).toFixed(0)} minutes a week are lost to changeovers — over five hours of constraint capacity.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Batch sizes are driven by changeover time, not by customer order size", test: "Compare batch size to average order quantity on the top 10 parts", effort: "low" },
        ],
      },
      {
        key: "tp_demand_low",
        when: (v) => v.has("demand_vs_capacity") && v.n("demand_vs_capacity") < 80,
        action: "Do not add capacity — the gap is demand, so move the effort to the commercial pipeline",
        rationale: (v) => `Demand is only ${v.n("demand_vs_capacity").toFixed(0)}% of capacity; throughput is not the binding constraint.`,
        horizon: "quarter",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "The capacity figure reflects real, staffed capacity", test: "Recalculate capacity using actual manning and planned shifts", effort: "med" },
        ],
      },
      {
        key: "tp_demand_over",
        when: (v) => v.n("demand_vs_capacity", 0) > 100,
        action: "Decide explicitly what not to make — sequence by margin and strategic customer, not by order date",
        rationale: (v) => `Demand is ${v.n("demand_vs_capacity").toFixed(0)}% of capacity; something will be late, so choose which.`,
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Margin by part is accurate enough to sequence on", test: "Recost the top 10 parts by volume against actual routing times", effort: "med" },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    key: "quotes",
    label: "Win more quotes",
    blurb: "Improve the conversion of the pipeline you already have before chasing new leads.",
    inputs: [
      pctInput("win_rate", "Quote win rate"),
      pctInput("win_rate_target", "Target win rate"),
      { key: "quote_turnaround_days", label: "Quote turnaround", kind: "number", unit: "days" },
      { key: "quotes_per_month", label: "Quotes issued per month", kind: "number" },
      { key: "avg_quote_value", label: "Average quote value", kind: "number", unit: "currency" },
      {
        key: "top_loss_reason",
        label: "Most common loss reason",
        kind: "choice",
        options: [
          { value: "price", label: "Price" },
          { value: "lead_time", label: "Lead time" },
          { value: "capability", label: "Capability or capacity" },
          { value: "no_response", label: "No response / went quiet" },
          { value: "unknown", label: "Not known" },
        ],
      },
      pctInput("followup_rate", "Quotes followed up within a week"),
    ],
    watch: ["Win rate", "Quote turnaround days", "Pipeline value by stage"],
    rules: [
      {
        key: "q_loss_unknown",
        when: (v) => v.is("top_loss_reason", "unknown") || v.s("top_loss_reason") === "",
        action: "Ask the reason on every loss for one month — one question, recorded in the opportunity",
        rationale: "The main loss reason is not known, so pricing or lead-time changes would be guesswork.",
        horizon: "month",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Customers will tell you why you lost", test: "Ask on the next 10 losses and count how many give a usable answer", effort: "low" },
        ],
      },
      {
        key: "q_turnaround",
        when: (v) => v.n("quote_turnaround_days", 0) > 5,
        action: "Set a 48-hour quote service level for repeat parts and a standing cost model for the rest",
        rationale: (v) => `A ${v.n("quote_turnaround_days").toFixed(0)}-day turnaround loses deals to whoever answered first.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Slow quotes are losing you work rather than filtering it", test: "Compare win rate on quotes returned within 2 days against the rest", effort: "low" },
        ],
      },
      {
        key: "q_followup",
        when: (v) => v.has("followup_rate") && v.n("followup_rate") < 70,
        action: "Put a 7-day follow-up task on every open quote and review the list weekly",
        rationale: (v) => `Only ${v.n("followup_rate").toFixed(0)}% of quotes are followed up within a week — quotes that go quiet are usually lost by default.`,
        horizon: "week",
        impact: "high",
        effort: "low",
      },
      {
        key: "q_no_response",
        when: (v) => v.is("top_loss_reason", "no_response"),
        action: "Qualify harder before quoting — confirm budget, timing and decision maker on every enquiry",
        rationale: "Most losses go quiet rather than saying no, which points at qualification rather than price.",
        horizon: "month",
        impact: "med",
        effort: "low",
        assumptions: [
          { text: "The enquiries are real projects, not price checks", test: "Score the last 20 enquiries against a three-question qualification test", effort: "low" },
        ],
      },
      {
        key: "q_price",
        when: (v) => v.is("top_loss_reason", "price"),
        action: "Recost the 10 highest-volume quoted parts against actual routing times before discounting anything",
        rationale: "Price is the named loss reason — check whether the cost model is wrong before cutting margin.",
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "Quoted times match actual times", test: "Compare quoted hours to booked hours on 10 recent jobs", effort: "med" },
          { text: "The customer is comparing like for like", test: "Check the scope and tolerances on two lost quotes against the competitor's offer", effort: "low" },
        ],
      },
      {
        key: "q_lead_time",
        when: (v) => v.is("top_loss_reason", "lead_time"),
        action: "Offer a priority lane at a premium instead of quoting the standard lead time on every enquiry",
        rationale: "Lead time is the named loss reason — some customers will pay for speed rather than walk away.",
        horizon: "quarter",
        impact: "med",
        effort: "med",
        assumptions: [
          { text: "A priority lane will not wreck the rest of the schedule", test: "Simulate two priority orders a week against current load", effort: "med" },
        ],
      },
      {
        key: "q_volume",
        when: (v) => v.has("win_rate") && v.has("win_rate_target") && v.gap("win_rate", "win_rate_target") > 0 && v.n("quotes_per_month", 0) < 10,
        action: "Fix the top of the funnel too — at this quote volume, conversion alone will not close the gap",
        rationale: (v) => `${v.n("quotes_per_month").toFixed(0)} quotes a month leaves too little to convert against a ${v.gap("win_rate", "win_rate_target").toFixed(0)}-point gap.`,
        horizon: "quarter",
        impact: "med",
        effort: "med",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    key: "downtime",
    label: "Reduce unplanned downtime",
    blurb: "Move from firefighting breakdowns to planned, owned maintenance.",
    inputs: [
      { key: "downtime_hours", label: "Unplanned downtime per month", kind: "number", unit: "hrs" },
      { key: "mtbf_hours", label: "Mean time between failures", kind: "number", unit: "hrs" },
      { key: "mttr_hours", label: "Mean time to repair", kind: "number", unit: "hrs" },
      pctInput("pm_compliance", "Planned maintenance compliance", "Share of PM tasks completed on schedule."),
      pctInput("spares_availability", "Critical spares availability"),
      { key: "top_asset_share", label: "Share of downtime on the worst asset", kind: "number", unit: "%" },
    ],
    watch: ["Unplanned downtime hours", "PM compliance", "Mean time to repair"],
    rules: [
      {
        key: "dt_pm_compliance",
        when: (v) => v.has("pm_compliance") && v.n("pm_compliance") < 80,
        action: "Protect PM time in the schedule and review compliance weekly with the production manager, not just maintenance",
        rationale: (v) => `PM compliance at ${v.n("pm_compliance").toFixed(0)}% means planned work is being dropped for production — which creates the breakdowns.`,
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "The PM schedule is right-sized, not padded", test: "Review the PM task list on the worst asset against manufacturer guidance and failure history", effort: "med" },
        ],
      },
      {
        key: "dt_concentrated",
        when: (v) => v.n("top_asset_share", 0) >= 40,
        action: "Run a criticality and failure review on the worst asset and put a dedicated plan against it",
        rationale: (v) => `${v.n("top_asset_share").toFixed(0)}% of downtime sits on one asset — fix that one before anything else.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The failures on that asset share a common mechanism", test: "Classify its last 20 failures by mode", effort: "low" },
        ],
      },
      {
        key: "dt_unknown_split",
        when: (v) => !v.has("top_asset_share"),
        action: "Log downtime by asset and reason for four weeks before choosing a target",
        rationale: "The downtime split by asset is unknown, so effort would be spread across the whole plant.",
        horizon: "week",
        impact: "med",
        effort: "low",
      },
      {
        key: "dt_mttr",
        when: (v) => v.has("mttr_hours") && v.n("mttr_hours") > 4,
        action: "Shorten repair time — pre-kit spares, write a first-response guide and train operators on the first 15 minutes",
        rationale: (v) => `A ${v.n("mttr_hours").toFixed(1)}-hour repair time means every failure costs most of a shift.`,
        horizon: "month",
        impact: "med",
        effort: "med",
        assumptions: [
          { text: "Repair time is dominated by waiting, not by the repair itself", test: "Split the last 10 repairs into waiting, diagnosis and fixing", effort: "low" },
        ],
      },
      {
        key: "dt_spares",
        when: (v) => v.has("spares_availability") && v.n("spares_availability") < 90,
        action: "Define and stock the critical spares list for the top three assets",
        rationale: (v) => `Critical spares availability of ${v.n("spares_availability").toFixed(0)}% turns short failures into long ones.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The critical spares list reflects real failure modes", test: "Check the last year of failures against the current spares list", effort: "low" },
        ],
      },
      {
        key: "dt_am",
        when: (v) => v.has("downtime_hours") && v.n("downtime_hours") > 20 && v.n("pm_compliance", 100) >= 80,
        action: "Introduce operator autonomous maintenance — daily clean, check and tighten on the top assets",
        rationale: "Downtime is high even with planned maintenance being done, which points at day-to-day asset condition.",
        horizon: "quarter",
        impact: "med",
        effort: "med",
        assumptions: [
          { text: "Operators have the time and standard work to do the checks", test: "Time the proposed checks on one shift and confirm they fit", effort: "low" },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    key: "capability",
    label: "Close a capability gap",
    blurb: "Make sure the skills, coverage and qualifications exist for the work you have committed to.",
    inputs: [
      { key: "critical_roles", label: "Critical roles", kind: "number", hint: "Roles where a single absence stops the work." },
      { key: "single_points", label: "Roles with only one qualified person", kind: "number" },
      pctInput("coverage", "Skill coverage against requirement"),
      pctInput("cert_current", "Certifications in date"),
      { key: "attrition_pct", label: "Annual attrition", kind: "number", unit: "%" },
      { key: "open_roles", label: "Open vacancies", kind: "number" },
      { key: "training_days", label: "Training days per person per year", kind: "number", unit: "days" },
    ],
    watch: ["Skill coverage", "Single points of failure", "Certifications in date"],
    rules: [
      {
        key: "cap_spof",
        when: (v) => v.n("single_points", 0) > 0,
        action: "Name a second person for every single-point role and put a dated training plan against each",
        rationale: (v) => `${v.n("single_points").toFixed(0)} role(s) depend on one person — one absence stops the work.`,
        horizon: "month",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "A second person can realistically be trained in the time available", test: "Confirm the qualification route and hours for one role with the process owner", effort: "low" },
        ],
      },
      {
        key: "cap_certs",
        when: (v) => v.has("cert_current") && v.n("cert_current") < 95,
        action: "Clear the expired and expiring certifications this month and set a 90-day renewal alert",
        rationale: (v) => `${(100 - v.n("cert_current")).toFixed(0)}% of certifications are not in date — that is a compliance and customer-audit risk, not just a training gap.`,
        horizon: "week",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "The certification records are complete and current", test: "Spot-check 10 records against the certificates on file", effort: "low" },
        ],
      },
      {
        key: "cap_coverage",
        when: (v) => v.has("coverage") && v.n("coverage") < 80,
        action: "Build a skills matrix against the actual role requirements and target the three biggest gaps",
        rationale: (v) => `Coverage at ${v.n("coverage").toFixed(0)}% means committed work depends on people who are not fully qualified for it.`,
        horizon: "quarter",
        impact: "high",
        effort: "med",
        assumptions: [
          { text: "The role requirements reflect what the work actually needs", test: "Review two role definitions with the people doing the job", effort: "low" },
        ],
      },
      {
        key: "cap_attrition",
        when: (v) => v.has("attrition_pct") && v.n("attrition_pct") > 15,
        action: "Run stay interviews with the critical-role holders before another one leaves",
        rationale: (v) => `Attrition at ${v.n("attrition_pct").toFixed(0)}% will erode capability faster than training can rebuild it.`,
        horizon: "month",
        impact: "high",
        effort: "low",
        assumptions: [
          { text: "Leavers are going for reasons you can influence", test: "Group the last year of leavers by stated reason", effort: "low" },
        ],
      },
      {
        key: "cap_vacancies",
        when: (v) => v.n("open_roles", 0) > 0 && v.n("coverage", 100) < 90,
        action: "Decide for each vacancy whether to recruit, train internally or redesign the work — and record the decision",
        rationale: "Open vacancies plus a coverage gap means the current plan assumes people you do not have.",
        horizon: "month",
        impact: "med",
        effort: "low",
      },
      {
        key: "cap_training_time",
        when: (v) => v.has("training_days") && v.n("training_days") < 3,
        action: "Book protected training time into the schedule — capability does not improve in the gaps",
        rationale: (v) => `${v.n("training_days").toFixed(1)} training days per person per year is not enough to close a coverage gap.`,
        horizon: "quarter",
        impact: "med",
        effort: "med",
      },
    ],
  },
];

export const goalByKey = (key: string): GoalDef | undefined => GOALS.find((g) => g.key === key);

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

function score(r: Recommendation): number {
  return IMPACT_SCORE[r.impact] * 3 + EFFORT_SCORE[r.effort] * 2 + HORIZON_SCORE[r.horizon];
}

export function buildPlaybook(goalKey: string, inputs: PlaybookInputs): Playbook | null {
  const goal = goalByKey(goalKey);
  if (!goal) return null;
  const reader = new Reader(inputs);

  const actions: Recommendation[] = [];
  const assumptions: AssumptionItem[] = [];

  for (const rule of goal.rules) {
    let fires = false;
    try {
      fires = rule.when(reader);
    } catch {
      fires = false;
    }
    if (!fires) continue;
    actions.push({
      ruleKey: rule.key,
      text: rule.action,
      rationale: typeof rule.rationale === "function" ? rule.rationale(reader) : rule.rationale,
      horizon: rule.horizon,
      impact: rule.impact,
      effort: rule.effort,
    });
    for (const a of rule.assumptions ?? []) {
      if (assumptions.some((existing) => existing.text === a.text)) continue;
      assumptions.push({ ruleKey: rule.key, text: a.text, test: a.test, effort: a.effort });
    }
  }

  actions.sort((a, b) => score(b) - score(a));

  const missingInputs = goal.inputs
    .filter((i) => {
      const raw = inputs[i.key];
      return raw === null || raw === undefined || raw === "";
    })
    .map((i) => i.label);

  return { goal, actions, assumptions, watch: goal.watch, missingInputs };
}
