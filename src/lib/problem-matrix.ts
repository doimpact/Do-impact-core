// Data for the About page "Start with the problem, not the tool" matrix.
// Columns mirror the four pillars plus a cross-cutting Reporting & Actions column.

export type ColumnKey = "strategy" | "commercial" | "oms" | "people" | "reporting";

export type MatrixModule = {
  id: string;
  column: ColumnKey;
  label: string;
  to: string;
  blurb: string;
};

export const COLUMNS: { key: ColumnKey; label: string; badge: string; tone: string; tagline: string }[] = [
  {
    key: "strategy",
    label: "Strategy",
    badge: "S",
    tone: "var(--color-pillar-strategy)",
    tagline:
      "Set direction and translate it into a governed portfolio of change — vision, value drivers, roadmap, Hoshin, A3, restructuring, waterfall bridges and turnaround finance.",
  },
  {
    key: "commercial",
    label: "Commercial",
    badge: "C",
    tone: "var(--color-pillar-commercial)",
    tagline:
      "Manage accounts, stakeholders, opportunities and contracts, and reconcile pipeline against the annual booking plan.",
  },
  {
    key: "oms",
    label: "Operations",
    badge: "O",
    tone: "var(--color-pillar-oms)",
    tagline:
      "Run daily operations safely and compliantly — SQDP, KPIs, SIOP, shop-floor flow, NPI, compliance, calendar and standard work.",
  },
  {
    key: "people",
    label: "People",
    badge: "P",
    tone: "var(--color-pillar-people)",
    tagline:
      "Build and track the capability that sustains everything — employees, skills, roles, gaps, certifications, development, leadership and the org chart.",
  },
  {
    key: "reporting",
    label: "Reporting & Actions",
    badge: "R",
    tone: "var(--color-accent)",
    tagline:
      "Aggregate everything into board-ready reporting, a weekly leadership cadence and one filterable action timeline.",
  },
];

export const MODULES: MatrixModule[] = [
  // Strategy
  { id: "waterfall", column: "strategy", label: "Strategy Deployment (Waterfall)", to: "/strategy/waterfall", blurb: "Bridge editor with true-delta bars, monthly granularity, NPV & IRR per bridge and compare-all rollup; promote levers into workstreams." },
  { id: "vision", column: "strategy", label: "Vision & Roadmap", to: "/strategy", blurb: "Vision, mission, value-driver tree, strategic themes and the 3-year roadmap with 36-month plan-vs-actual benefits." },
  { id: "hoshin", column: "strategy", label: "Hoshin Kanri", to: "/strategy/hoshin", blurb: "Full X-matrix — breakthroughs, annual objectives, improvement priorities and metrics with correlation and ownership." },
  { id: "restructuring", column: "strategy", label: "Restructuring", to: "/strategy/restructuring", blurb: "Multi-project governance: SteerCo, PMO and workstream teams, phase-gated roadmap, risk framework and scope control." },
  { id: "consolidation", column: "strategy", label: "Consolidation", to: "/strategy/consolidation", blurb: "Two-site → one-site planner: baseline P&L, 5-phase roadmap, transition-cost tracker and cashflow with NPV, IRR and payback." },
  { id: "capex", column: "strategy", label: "Turnaround Finance (CAPEX)", to: "/strategy/capex", blurb: "4-gate CAPEX tracker with Value Realization scorecard, NPV/IRR, 13-week cash, working capital, part margins and COPQ." },
  { id: "a3", column: "strategy", label: "A3", to: "/actions/problem-solver/a3", blurb: "A3 problem-solving templates — background, current condition, goal, root cause, countermeasures and follow-up." },
  { id: "progress", column: "strategy", label: "Initiative Progress", to: "/strategy/initiatives", blurb: "L1–L4 workstreams on a Kanban board, auto-synced from roadmap objectives and promoted waterfall levers." },

  // Commercial
  { id: "com-overview", column: "commercial", label: "Overview", to: "/commercial", blurb: "Commercial hub — accounts, pipeline health and weekly review shortcuts." },
  { id: "accounts", column: "commercial", label: "Accounts", to: "/commercial/accounts", blurb: "Customer accounts with criticality, notes and Excel import/export." },
  { id: "stakeholders", column: "commercial", label: "Stakeholders", to: "/commercial/stakeholders", blurb: "Stakeholder register with influence matrix and criticality rollup." },
  { id: "voc", column: "commercial", label: "Voice of Customer", to: "/commercial/voc", blurb: "Works-well / to-improve boards, NPS and CSAT tiles, win rate and owned follow-up tasks." },
  { id: "opportunities", column: "commercial", label: "Opportunities", to: "/commercial/opportunities", blurb: "Pipeline with stage, value, gross margin, probability and close date." },
  { id: "contracts", column: "commercial", label: "Contracts", to: "/commercial/contracts", blurb: "Contract coverage linked to accounts and opportunities." },
  { id: "plan", column: "commercial", label: "Plan vs pipeline", to: "/commercial/plan", blurb: "Plan against pipeline with multi-stream booked backlog per year and monthly breakdown charts." },
  { id: "com-review", column: "commercial", label: "Weekly review", to: "/commercial/review", blurb: "Pipeline movement, red accounts and priority actions." },

  // Operations
  { id: "oms-framework", column: "oms", label: "Framework", to: "/oms", blurb: "Operations overview and pillar status board with R/Y/G cycling." },
  { id: "daily", column: "oms", label: "Daily (SQDP)", to: "/oms/daily", blurb: "Full-month SQDP calendar across multiple boards; a 3C is triggered on any red cell." },
  { id: "kpis", column: "oms", label: "KPIs", to: "/oms/kpis", blurb: "KPI library with starred/key filter, archive and target-vs-actual trend." },
  { id: "siop", column: "oms", label: "SIOP", to: "/oms/siop", blurb: "24-month demand, capacity and supply planning with long-lead materials and OSP tracking." },
  { id: "shopfloor", column: "oms", label: "Shop Floor Flow", to: "/oms/shopfloor", blurb: "Gated process relay with WIP, takt and gate performance." },
  { id: "vsm", column: "oms", label: "Value Stream Map", to: "/oms/vsm", blurb: "Current vs future state mapping with process boxes, inventory triangles and VA/NVA timeline." },
  { id: "npi", column: "oms", label: "Industrialization", to: "/oms/industrialization", blurb: "AS9145 five-gate New Product Introduction plus a New Equipment stage-gate framework from PO to handover (FAT, IQ, SAT/OQ, PQ, ramp-up)." },
  { id: "eol", column: "oms", label: "End-of-Life", to: "/oms/end-of-life", blurb: "Life Cycle Gate 8 phase-out: 8A–8E gate checklist, readiness matrix, last-time-buy modelling, asset disposition and customer migration." },

  { id: "compliance", column: "oms", label: "Compliance", to: "/oms/compliance", blurb: "Part 145 audit-ready checklist across 6 pillars with snapshots and reset for the next audit." },
  { id: "calendar", column: "oms", label: "Calendar", to: "/oms/risk", blurb: "Audit and events calendar — regulatory, customer and internal reviews plus key operational events." },
  { id: "standard-work", column: "oms", label: "Standard Work", to: "/oms/risk", blurb: "Editable weekly leader cadence — now a tab inside the Calendar." },

  // People
  { id: "ppl-overview", column: "people", label: "Overview", to: "/people", blurb: "Headcount, coverage and open capability gaps." },
  { id: "employees", column: "people", label: "Employees", to: "/people/employees", blurb: "Employee master data with roles and skill assignments." },
  { id: "skills", column: "people", label: "Skills", to: "/people/skills", blurb: "Skills catalog imported from the SkySkills library." },
  { id: "roles", column: "people", label: "Roles", to: "/people/roles", blurb: "Job roles with the skills each role requires." },
  { id: "matrix", column: "people", label: "Skill matrix", to: "/people/matrix", blurb: "Proficiency per employee per skill." },
  { id: "gaps", column: "people", label: "Gaps", to: "/people/gaps", blurb: "Coverage and gap analysis from role requirements versus current proficiency." },
  { id: "certifications", column: "people", label: "Certifications", to: "/people/certifications", blurb: "Certifications register with expiry tracking." },
  { id: "development", column: "people", label: "Development", to: "/people/development", blurb: "Individual development plans and targeted upskilling." },
  { id: "leadership", column: "people", label: "Leadership", to: "/people/leadership", blurb: "Leadership pipeline, succession and readiness." },
  { id: "org-chart", column: "people", label: "Org chart", to: "/people/org-chart", blurb: "Hierarchical org chart with drag-and-drop restructuring." },

  // Reporting & Actions
  { id: "board", column: "reporting", label: "Board-Ready Report", to: "/report/board", blurb: "Board PDF and editable PowerPoint with toggleable sections and a custom waterfall editor; only starred KPIs." },
  { id: "gantt", column: "reporting", label: "Zoomable Gantt", to: "/actions", blurb: "Every action across Strategy, Progress, Operations, Turnaround Finance and Daily Management, with module and owner swimlanes." },
  { id: "slt", column: "reporting", label: "Weekly SLT Meeting", to: "/meeting/weekly", blurb: "Full-screen, step-through leadership agenda — safety, KPIs, escalations, pipeline, initiatives and actions." },
  { id: "action-tracker", column: "reporting", label: "Action Tracker", to: "/actions", blurb: "One filterable list of every action created anywhere in the suite, with owner and due date." },
];

export const MODULE_BY_ID: Record<string, MatrixModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
);

export type Problem = {
  id: string;
  index: number;
  title: string;
  statement: string;
  /** Ordered flow of module ids — the sequence in which the modules are used. */
  flow: { id: string; why: string }[];
};

export const PROBLEMS: Problem[] = [
  {
    id: "footprint",
    index: 1,
    title: "Footprint & supply-chain shock",
    statement:
      "Navigating geopolitical realignments, supply chain vulnerabilities, or cost pressures that necessitate shuttering, transferring, or consolidating facilities without disrupting customer delivery or violating regulatory compliance.",
    flow: [
      { id: "waterfall", why: "Size the cost and margin gap, lever by lever" },
      { id: "consolidation", why: "Model Site A+B vs one site, with transition costs" },
      { id: "restructuring", why: "Stand up SteerCo, PMO and workstream governance" },
      { id: "capex", why: "Gate the spend and protect cash through the move" },
      { id: "stakeholders", why: "Map who must be informed and when" },
      { id: "accounts", why: "Flag the accounts most exposed to the transfer" },
      { id: "contracts", why: "Check delivery obligations before any line moves" },
      { id: "siop", why: "Build the pre-build and inventory bridge across the cutover" },
      { id: "vsm", why: "Design the receiving-site flow before transfer" },
      { id: "shopfloor", why: "Track WIP and gate performance during ramp-down/ramp-up" },
      { id: "compliance", why: "Keep the approval and audit evidence intact" },
      { id: "calendar", why: "Sequence regulatory and customer audits around the move" },
      { id: "employees", why: "Know who transfers, who stays, who leaves" },
      { id: "gaps", why: "Find the certified skills the receiving site lacks" },
      { id: "development", why: "Close those gaps before first article" },
      { id: "board", why: "Report the business case and progress to the board" },
      { id: "gantt", why: "One timeline for every workstream action" },
    ],
  },
  {
    id: "capital",
    index: 2,
    title: "Capital deployment for disruptive technology",
    statement:
      "Managing capital deployment for disruptive technologies (automated cell manufacturing, AI inspection, modern digital platforms) to ensure rapid time-to-value, cash preservation, and seamless operational adoption.",
    flow: [
      { id: "vision", why: "Anchor the investment to a value driver and a roadmap year" },
      { id: "capex", why: "Run the 4 gates with a value-realization scorecard" },
      { id: "waterfall", why: "Show the benefit bridge and NPV/IRR of the programme" },
      { id: "progress", why: "Break the programme into L1–L4 workstreams with owners" },
      { id: "plan", why: "Test whether the booking plan supports the payback" },
      { id: "opportunities", why: "Link new capability to the pipeline it unlocks" },
      { id: "npi", why: "Qualify the new process through the five AS9145 gates" },
      { id: "shopfloor", why: "Prove takt and gate performance on the new cell" },
      { id: "kpis", why: "Track adoption against target, not just install date" },
      { id: "standard-work", why: "Lock the new routine into the leader cadence" },
      { id: "skills", why: "Define the new competencies the technology demands" },
      { id: "matrix", why: "See who can actually run it today" },
      { id: "development", why: "Train ahead of go-live, not after" },
      { id: "board", why: "Report gate status and realized value" },
      { id: "action-tracker", why: "Keep every open commitment visible" },
    ],
  },
  {
    id: "sustainability",
    index: 3,
    title: "Sustainability & certification mandates",
    statement:
      "Adapting to stringent environmental regulations and customer decarbonization mandates by rapidly engineering, certifying, and commercializing sustainable product and service offerings.",
    flow: [
      { id: "hoshin", why: "Make decarbonization a breakthrough objective, not a side project" },
      { id: "vision", why: "Carry it into the roadmap with measurable annual benefits" },
      { id: "a3", why: "Solve the hard technical blockers with structured problem solving" },
      { id: "voc", why: "Capture what customers actually require and by when" },
      { id: "opportunities", why: "Convert the mandate into qualified pipeline" },
      { id: "npi", why: "Engineer and certify the new offering through the gates" },
      { id: "compliance", why: "Prove conformity and hold the audit evidence" },
      { id: "daily", why: "Watch quality and delivery while the process changes" },
      { id: "calendar", why: "Plan certification bodies and customer audits" },
      { id: "roles", why: "Define the roles the new certification requires" },
      { id: "certifications", why: "Track approvals and expiries per person" },
      { id: "matrix", why: "Confirm coverage before the audit date" },
      { id: "board", why: "Show regulatory readiness to the board" },
      { id: "slt", why: "Review progress weekly with the site leadership team" },
    ],
  },
];
