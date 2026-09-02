// Single source of truth for the Weekly SLT Meeting flow.
// Step ids are persisted in user_preferences.meeting_steps / meeting_presets.

export type MeetingStepId =
  // opening
  | "safety" | "company_map"
  // strategy
  | "framework" | "hoshin" | "waterfall" | "value_delivered" | "progress"
  | "restructuring" | "consolidation" | "capex"
  // commercial
  | "commercial" | "accounts" | "opportunities" | "contracts" | "stakeholders" | "commercial_review"
  // operations
  | "sqdp" | "escalations" | "kpis" | "siop" | "shopfloor" | "scheduling"
  | "supplychain" | "npi" | "compliance" | "calendar"
  // execution
  | "actions" | "problem_solver" | "a3" | "eight_d" | "mro"
  // people
  | "people" | "development" | "leadership"
  // closing
  | "wrap";

export type MeetingGroup = "opening" | "strategy" | "commercial" | "operations" | "execution" | "people" | "closing";

export const GROUP_LABEL: Record<MeetingGroup, string> = {
  opening: "Opening",
  strategy: "Strategy",
  commercial: "Commercial",
  operations: "Operations",
  execution: "Execution",
  people: "People",
  closing: "Closing",
};

export type MeetingStep = {
  id: MeetingStepId;
  label: string;
  group: MeetingGroup;
  tone: string;
  /** nav-registry key this step maps to (used to respect Settings visibility). */
  navKey?: string;
  /** Always in the agenda, cannot be deselected. */
  pinned?: boolean;
};

export const MEETING_STEPS: MeetingStep[] = [
  { id: "safety", label: "Safety check-in", group: "opening", tone: "#dc2626", pinned: true },
  { id: "company_map", label: "Company Map", group: "opening", tone: "#0f766e" },

  { id: "framework", label: "Framework status (R/Y/G)", group: "strategy", tone: "#0284c7", navKey: "nav.oms.index" },
  { id: "hoshin", label: "Hoshin Kanri", group: "strategy", tone: "#1d4ed8", navKey: "nav.strategy.hoshin" },
  { id: "waterfall", label: "Waterfall", group: "strategy", tone: "#0369a1", navKey: "nav.strategy.waterfall" },
  { id: "value_delivered", label: "Value delivered", group: "strategy", tone: "#059669", navKey: "nav.strategy.initiatives" },
  { id: "progress", label: "Progress (objectives & workstreams)", group: "strategy", tone: "#7c3aed", navKey: "nav.strategy.initiatives" },
  { id: "restructuring", label: "Restructuring", group: "strategy", tone: "#b91c1c", navKey: "nav.strategy.restructuring" },
  { id: "consolidation", label: "Consolidation", group: "strategy", tone: "#9f1239", navKey: "nav.strategy.consolidation" },
  { id: "capex", label: "Turnaround finance (CapEx)", group: "strategy", tone: "#0f766e", navKey: "nav.strategy.capex" },

  { id: "commercial", label: "Commercial pipeline", group: "commercial", tone: "#16a34a", navKey: "nav.commercial.index" },
  { id: "accounts", label: "Accounts", group: "commercial", tone: "#15803d", navKey: "nav.commercial.accounts" },
  { id: "opportunities", label: "Opportunities", group: "commercial", tone: "#65a30d", navKey: "nav.commercial.opportunities" },
  { id: "contracts", label: "Contracts", group: "commercial", tone: "#4d7c0f", navKey: "nav.commercial.contracts" },
  { id: "stakeholders", label: "Stakeholders", group: "commercial", tone: "#0d9488", navKey: "nav.commercial.stakeholders" },
  { id: "commercial_review", label: "Weekly commercial review", group: "commercial", tone: "#047857", navKey: "nav.commercial.review" },

  { id: "sqdp", label: "SQDP health (7 days)", group: "operations", tone: "#f97316", navKey: "nav.oms.daily" },
  { id: "escalations", label: "Open 3C escalations", group: "operations", tone: "#ea580c", navKey: "nav.oms.daily" },
  { id: "kpis", label: "KPIs vs target", group: "operations", tone: "#0ea5e9", navKey: "nav.oms.kpis" },
  { id: "siop", label: "SIOP & long-lead", group: "operations", tone: "#4338ca", navKey: "nav.oms.siop" },
  { id: "shopfloor", label: "Shop floor flow", group: "operations", tone: "#c2410c", navKey: "nav.oms.shopfloor" },
  { id: "scheduling", label: "Scheduling (0–12 wk)", group: "operations", tone: "#b45309", navKey: "nav.oms.scheduling" },
  { id: "supplychain", label: "Supply chain", group: "operations", tone: "#7c2d12", navKey: "nav.oms.supplychain" },
  { id: "npi", label: "Industrialization (NPI)", group: "operations", tone: "#9333ea", navKey: "nav.oms.npi" },
  { id: "compliance", label: "Compliance readiness", group: "operations", tone: "#065f46", navKey: "nav.oms.compliance" },
  { id: "calendar", label: "Audits & events", group: "operations", tone: "#0f766e", navKey: "overview.report.calendar" },

  { id: "actions", label: "Actions due this week", group: "execution", tone: "#0891b2", navKey: "nav.actions.index" },
  { id: "problem_solver", label: "Problem Solver", group: "execution", tone: "#0e7490", navKey: "nav.actions.problem-solver" },
  { id: "a3", label: "A3 reports", group: "execution", tone: "#155e75", navKey: "nav.actions.a3" },
  { id: "eight_d", label: "8D reports", group: "execution", tone: "#1e40af", navKey: "nav.actions.eight-d" },
  { id: "mro", label: "Aviation MRO", group: "execution", tone: "#3730a3", navKey: "nav.actions.mro" },

  { id: "people", label: "People & capability", group: "people", tone: "#a855f7", navKey: "nav.people.index" },
  { id: "development", label: "Development plans", group: "people", tone: "#c026d3", navKey: "nav.people.development" },
  { id: "leadership", label: "Leadership & org", group: "people", tone: "#9333ea", navKey: "nav.people.leadership" },

  { id: "wrap", label: "Wrap-up & next steps", group: "closing", tone: "#059669", pinned: true },
];

export const ALL_STEP_IDS = MEETING_STEPS.map((s) => s.id);

export function stepById(id: string): MeetingStep | undefined {
  return MEETING_STEPS.find((s) => s.id === id);
}

/** Default agenda: everything the user has not switched off in Settings. */
export function defaultAgenda(hiddenKeys: string[]): MeetingStepId[] {
  const hidden = new Set(hiddenKeys);
  return MEETING_STEPS.filter((s) => s.pinned || !s.navKey || !hidden.has(s.navKey)).map((s) => s.id);
}

/** Keeps the canonical flow order and always includes the pinned steps. */
export function orderAgenda(ids: string[]): MeetingStepId[] {
  const set = new Set(ids);
  return MEETING_STEPS.filter((s) => s.pinned || set.has(s.id)).map((s) => s.id);
}

/**
 * Steps introduced after agendas were first saved. A saved agenda predating a
 * step cannot express an opinion about it, so it is merged in rather than
 * treated as deselected.
 */
export const STEPS_ADDED_LATER: MeetingStepId[] = ["company_map"];

/** Steps from STEPS_ADDED_LATER that a saved list does not contain yet (and are not hidden). */
export function missingLaterSteps(saved: string[], hiddenKeys: string[]): MeetingStepId[] {
  const hidden = new Set(hiddenKeys);
  const set = new Set(saved);
  return STEPS_ADDED_LATER.filter((id) => {
    if (set.has(id)) return false;
    const step = stepById(id);
    if (!step) return false;
    return !(step.navKey && hidden.has(step.navKey));
  });
}

/** Saved selection + steps that did not exist when it was saved, in canonical order. */
export function mergeLaterSteps(saved: string[], hiddenKeys: string[]): MeetingStepId[] {
  return orderAgenda([...saved, ...missingLaterSteps(saved, hiddenKeys)]);
}

/** Resolve the agenda to run: saved selection + steps that did not exist when it was saved. */
export function resolveAgenda(saved: string[] | null | undefined, hiddenKeys: string[]): MeetingStepId[] {
  if (!saved) return defaultAgenda(hiddenKeys);
  return mergeLaterSteps(saved, hiddenKeys);
}
