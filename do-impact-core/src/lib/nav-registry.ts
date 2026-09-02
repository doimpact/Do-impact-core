// Single source of truth for user-toggleable nav & overview entries.
// Stable keys are stored in user_preferences.hidden_keys.

export type PillarKey = "strategy" | "commercial" | "oms" | "people" | "actions";

export const PILLARS: { key: PillarKey; navKey: string; label: string; to: string; match?: string }[] = [
  { key: "strategy", navKey: "nav.pillar.strategy", label: "Strategy", to: "/strategy", match: "/strategy" },
  { key: "commercial", navKey: "nav.pillar.commercial", label: "Commercial", to: "/commercial", match: "/commercial" },
  { key: "oms", navKey: "nav.pillar.oms", label: "Operations", to: "/oms", match: "/oms" },
  { key: "people", navKey: "nav.pillar.people", label: "People", to: "/people", match: "/people" },
  { key: "actions", navKey: "nav.pillar.actions", label: "Execution", to: "/actions", match: "/actions" },
];

export const SUB_NAV: Record<PillarKey, { key: string; label: string; to: string }[]> = {
  strategy: [
    { key: "nav.strategy.waterfall", label: "Strategy Deployment (Waterfall)", to: "/strategy/waterfall" },
    { key: "nav.strategy.index", label: "Goals & Strategy Map", to: "/strategy" },
    { key: "nav.strategy.hoshin", label: "Hoshin Planning (X-Matrix)", to: "/strategy/hoshin" },
    { key: "nav.strategy.initiatives", label: "Initiative Progress", to: "/strategy/initiatives" },
    { key: "nav.strategy.restructuring", label: "Restructuring", to: "/strategy/restructuring" },
    { key: "nav.strategy.consolidation", label: "Plant Consolidation", to: "/strategy/consolidation" },
    { key: "nav.strategy.capex", label: "Turnaround Finance (CAPEX)", to: "/strategy/capex" },
  ],
  commercial: [
    { key: "nav.commercial.index", label: "Overview", to: "/commercial" },
    { key: "nav.commercial.accounts", label: "Accounts", to: "/commercial/accounts" },
    { key: "nav.commercial.stakeholders", label: "Stakeholders", to: "/commercial/stakeholders" },
    { key: "nav.commercial.opportunities", label: "Opportunities", to: "/commercial/opportunities" },
    { key: "nav.commercial.contracts", label: "Contracts", to: "/commercial/contracts" },
    { key: "nav.commercial.plan", label: "Plan vs Pipeline", to: "/commercial/plan" },
    { key: "nav.commercial.review", label: "Weekly review", to: "/commercial/review" },
  ],
  oms: [
    { key: "nav.oms.index", label: "How the System Works", to: "/oms" },
    { key: "nav.oms.daily", label: "Daily Management (SQDP)", to: "/oms/daily" },
    { key: "nav.oms.shopfloor", label: "Shop Floor", to: "/oms/shopfloor" },
    { key: "nav.oms.scheduling", label: "Scheduling (0–12 Weeks)", to: "/oms/scheduling" },
    { key: "nav.oms.supplychain", label: "Supply Chain", to: "/oms/supply-chain" },
    { key: "nav.oms.siop", label: "Sales & Ops Planning (SIOP)", to: "/oms/siop" },
    { key: "nav.oms.npi", label: "New Product Introduction (NPI)", to: "/oms/industrialization" },
    { key: "nav.oms.eol", label: "End-of-Life", to: "/oms/end-of-life" },
    { key: "nav.oms.compliance", label: "Compliance", to: "/oms/compliance" },
  ],
  people: [
    { key: "nav.people.index", label: "Overview", to: "/people" },
    { key: "nav.people.employees", label: "Employees", to: "/people/employees" },
    { key: "nav.people.skills", label: "Skills", to: "/people/skills" },
    { key: "nav.people.roles", label: "Roles", to: "/people/roles" },
    { key: "nav.people.development", label: "Development", to: "/people/development" },
    { key: "nav.people.leadership", label: "Leadership", to: "/people/leadership" },
    { key: "nav.people.orgchart", label: "Org chart", to: "/people/org-chart" },
  ],
  actions: [
    { key: "nav.actions.index", label: "Timeline (Gantt)", to: "/actions" },
    { key: "nav.actions.problem-solver", label: "Problem Solver", to: "/actions/problem-solver" },
    { key: "nav.actions.a3", label: "A3", to: "/actions/problem-solver/a3" },
    { key: "nav.actions.eight-d", label: "8D", to: "/actions/problem-solver/eight-d" },
    { key: "nav.actions.five-whys", label: "5 Whys", to: "/actions/problem-solver/five-whys" },
    { key: "nav.actions.fishbone", label: "Fishbone", to: "/actions/problem-solver/fishbone" },
    { key: "nav.actions.dmaic", label: "DMAIC", to: "/actions/problem-solver/dmaic" },
    { key: "nav.actions.mro", label: "Aviation MRO Checklist", to: "/actions/problem-solver/mro" },
    { key: "nav.actions.calculators", label: "Calculators", to: "/actions/calculators" },
    { key: "nav.actions.calc.oee", label: "OEE calculator", to: "/actions/calculators/oee" },
    { key: "nav.actions.calc.takt", label: "Takt time calculator", to: "/actions/calculators/takt" },
    { key: "nav.actions.calc.copq", label: "Cost of poor quality calculator", to: "/actions/calculators/copq" },
    { key: "nav.actions.calc.downtime", label: "Downtime cost calculator", to: "/actions/calculators/downtime" },
    { key: "nav.actions.calc.changeover", label: "Changeover / SMED calculator", to: "/actions/calculators/changeover" },
  ],

};

export const OVERVIEW_CARDS: { key: string; label: string }[] = [
  { key: "overview.report.board", label: "Board Report card" },
  { key: "overview.report.owner", label: "Owner Dashboard card" },

  { key: "overview.report.weekly", label: "Weekly SLT Meeting card" },
  { key: "overview.report.kpis", label: "KPIs card" },
  { key: "overview.report.calendar", label: "Calendar (audit & events) card" },
  { key: "overview.report.teamroom", label: "Exec Team Room card (Intelligence add-on)" },
  { key: "overview.report.network", label: "Enterprise Network card (Intelligence add-on)" },

  { key: "overview.report.actions", label: "Timeline (Gantt) card" },
  { key: "overview.report.businesshealth", label: "Business Health report card" },
  { key: "overview.report.industrialstrategy", label: "Industrial Strategy report card" },
  { key: "overview.tour.button", label: "Take the 50-second tour button" },
  { key: "overview.tour.pdf", label: "Download tour PDF button" },
];

// Pages that are reachable from inside a pillar but are not top-level sub-menu
// entries. They still get a stable key so users can hide them in Settings and
// so they show up in the in-app search index.
export const EXTRA_MODULES: Record<PillarKey, { key: string; label: string; to: string }[]> = {
  strategy: [],
  commercial: [
    { key: "nav.commercial.voc", label: "Voice of the Customer (VoC)", to: "/commercial/voc" },
  ],
  oms: [
    { key: "nav.oms.kpis", label: "KPIs", to: "/oms/kpis" },
    { key: "nav.oms.sic", label: "SIC board", to: "/oms/sic" },
    { key: "nav.oms.vsm", label: "Value Stream Map", to: "/oms/vsm" },
    { key: "nav.oms.quality", label: "Quality", to: "/oms/quality" },
    { key: "nav.oms.risk", label: "Risk", to: "/oms/risk" },
    { key: "nav.oms.standardwork", label: "Standard Work", to: "/oms/standard-work" },
    { key: "nav.oms.criticalpath", label: "Critical Path Pulse", to: "/oms/critical-path" },
  ],
  people: [
    { key: "nav.people.matrix", label: "Skills matrix", to: "/people/matrix" },
    { key: "nav.people.gaps", label: "Skill gaps", to: "/people/gaps" },
    { key: "nav.people.certifications", label: "Certifications", to: "/people/certifications" },
    { key: "nav.people.engagement", label: "Engagement", to: "/people/engagement" },
    { key: "nav.people.import", label: "Import people", to: "/people/import" },
  ],
  actions: [
    { key: "nav.actions.playbook", label: "Decision Playbook", to: "/actions/playbook" },
    { key: "nav.actions.flows", label: "Problem flows", to: "/actions/problem-solver/flows" },
    { key: "nav.actions.toolkit", label: "Improvement toolkit", to: "/actions/problem-solver/toolkit" },
    { key: "nav.actions.toolkit.toc", label: "Theory of Constraints", to: "/actions/problem-solver/toolkit/toc" },
    { key: "nav.actions.toolkit.cld", label: "Systems thinking (CLD)", to: "/actions/problem-solver/toolkit/cld" },
    { key: "nav.actions.toolkit.ibp", label: "Integrated Business Planning", to: "/actions/problem-solver/toolkit/ibp" },
    { key: "nav.actions.toolkit.hoshin", label: "Hoshin toolkit", to: "/actions/problem-solver/toolkit/hoshin" },
    { key: "nav.actions.toolkit.journey", label: "Employee journey", to: "/actions/problem-solver/toolkit/journey" },
  ],
};

// Tab-level sections that live inside the Compliance page.
export const COMPLIANCE_SECTIONS: { key: string; tab: string; label: string }[] = [
  { key: "nav.oms.compliance.part145", tab: "part145", label: "Part 145 Repair Station" },
  { key: "nav.oms.compliance.sms", tab: "sms", label: "Safety Management System (SMS)" },
  { key: "nav.oms.compliance.safety", tab: "safety", label: "Safety" },
  { key: "nav.oms.compliance.bcm", tab: "bcm", label: "Business Continuity" },
  { key: "nav.oms.compliance.ampm", tab: "ampm", label: "Autonomous & Preventive Maintenance (AM/PM)" },
];


// Match sub-nav keys to a parent pillar to filter overview chips.
export function subNavKeyForPath(to: string): string | null {
  for (const pillar of Object.keys(SUB_NAV) as PillarKey[]) {
    const found = SUB_NAV[pillar].find((s) => s.to === to);
    if (found) return found.key;
  }
  return null;
}

// Shared pillar color tokens (defined in src/styles.css). Single source of truth
// for pillar-tinted navigation, breadcrumbs and page accents.
export const PILLAR_TONE: Record<PillarKey, string> = {
  strategy: "var(--pillar-strategy)",
  commercial: "var(--pillar-commercial)",
  oms: "var(--pillar-oms)",
  people: "var(--pillar-people)",
  actions: "var(--accent)",
};

export const PILLAR_TONE_BY_MATCH: Record<string, string> = {
  "/strategy": PILLAR_TONE.strategy,
  "/commercial": PILLAR_TONE.commercial,
  "/oms": PILLAR_TONE.oms,
  "/people": PILLAR_TONE.people,
  "/actions": PILLAR_TONE.actions,
};

export function tint(tone: string, pct: number) {
  return `color-mix(in oklab, ${tone} ${pct}%, transparent)`;
}
