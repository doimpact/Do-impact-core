// Single source of truth for the Framework Guide copy.
// Used by the in-app guide (src/components/about/FrameworkGuide.tsx) and by the
// static tour PDF generator (scripts/generate-tour-pdf.mjs).

import type { PillarKey } from "@/lib/nav-registry";

export const PILLAR_TEXT: Record<PillarKey, { tagline: string; intro: string }> = {
  strategy: {
    tagline: "The steering wheel",
    intro:
      "Set direction and translate it into a governed portfolio of change — vision, value drivers, roadmap, Hoshin, restructuring, consolidation, waterfall bridges and turnaround finance.",
  },
  commercial: {
    tagline: "Top-line engine",
    intro:
      "Manage accounts, stakeholders, opportunities and contracts, and reconcile pipeline against the annual booking plan.",
  },
  oms: {
    tagline: "Engine room",
    intro:
      "Run daily operations safely and compliantly — SQDP daily management with friction leading indicators and closed-loop escalation, Short Interval Control, KPIs, SIOP, 0–12 week scheduling, shop-floor flow with the operator Floor View, value stream mapping, industrialization (NPI & new equipment), End-of-Life exit gates, Part 145 & SMS compliance, calendar and standard work.",
  },
  people: {
    tagline: "Enablers",
    intro:
      "Build and track the capability that sustains everything — employees, skills with the skill matrix and gap analysis, roles, development and certifications, leadership, change & engagement and the org chart.",
  },
  actions: {
    tagline: "One list, one timeline",
    intro:
      "Where problems get solved and work gets tracked — the Problem Solver hub for A3, 8D, 5 Whys, Fishbone, DMAIC, the structured toolkit, Aviation MRO and the Problem Flow workspace, the shop-floor calculators, plus the Execution portal that aggregates every action created anywhere in the suite.",
  },
};


export const BLURBS: Record<string, string> = {
  // Strategy
  "/strategy": "Vision, mission, value-driver tree, strategic themes and the 3-year roadmap. Each yearly objective supports 36-month plan-vs-actual benefits plus leading and lagging KPIs. A second tab holds the Industrial Strategy Framework — 16 steps across 9 phases, from strategic cascade and ways to win through product/market portfolio, manufacturing model, capacity, footprint, technology, cost transformation, quality, organization & talent, capital allocation and the execution cockpit — with a presentation-ready report.",
  "/strategy/initiatives": "L1–L4 workstreams shown as a Kanban board. Auto-synced from roadmap objectives and from promoted waterfall levers, with actions and owners per card.",
  "/strategy/hoshin": "Full Hoshin Kanri X-matrix — long-term breakthroughs, annual objectives, improvement priorities and metrics with correlation mapping and ownership.",
  "/actions/problem-solver/a3": "A3 problem-solving templates — background, current condition, goal, root cause, countermeasures, action plan and follow-up, with owner and status.",
  "/strategy/restructuring": "Multi-project restructuring governance: Steering Committee, PMO and Workstream Execution Teams, phase-gated roadmap, risk framework, scope control and SteerCo Meeting mode.",
  "/strategy/waterfall": "Waterfall bridge editor with true-delta bars, monthly granularity, NPV & IRR per bridge, compare-all rollup, and the ability to promote value levers into workstreams with owners and actions.",
  "/strategy/consolidation": "Two-site → one-site consolidation planner: baseline P&L (Before Site A+B vs After with transition costs), 5-phase roadmap, transition-cost tracker and monthly cashflow with NPV, IRR and payback.",
  "/strategy/capex": "Turnaround Finance: 4-gate CAPEX tracker with Value Realization scorecard (Financial / Operational / Quality-Risk across Baseline, Closeout, Initial Audit and PIR), computed vs manual NPV/IRR, 13-week cash, working capital, part margins and COPQ.",
  // Commercial
  "/commercial": "Commercial hub landing page — quick view of accounts, pipeline health and the weekly review shortcuts.",
  "/commercial/accounts": "Customer accounts with criticality, notes and Excel import/export — add, edit, archive and delete throughout.",
  "/commercial/stakeholders": "Stakeholder register with influence matrix and criticality rollup, Excel import, and a Voice of the Customer tab alongside it. Full add / edit / archive / delete.",
  "/commercial/opportunities": "Pipeline of opportunities with stage, value, probability and close date, with the same add / edit / archive / delete behaviour as Accounts and Stakeholders.",
  "/commercial/contracts": "Contract register linked to accounts and opportunities.",

  "/commercial/plan": "Plan vs pipeline with multi-stream booked backlog per year and monthly breakdown charts.",
  "/commercial/review": "Weekly commercial review — pipeline movement, red accounts and priority actions.",
  "/commercial/voc": "Voice of the Customer — NPS and CSAT readings over time, works-well / to-improve notes and follow-up tasks. Every item is scoped either company-wide or to a specific account, with re-linking and scope badges, plus full add / edit / archive / delete.",
  // Operations
  "/oms": "Operations framework overview and pillar status board with R/Y/G cycling.",
  "/oms/daily": "Multi-board Daily Management (SQDP) with a consolidated rollup board. Full-month calendar, editable friction leading indicators (kit completeness, tool readiness, RFI aging) with targets and archiving, closed-loop 3C escalation into A3/DMAIC, and Gemba coaching walks.",
  "/oms/kpis": "A structured KPI system on the SQDCPME framework: a library of ~225 curated metrics with definition, purpose, formula, data source, scope and exclusions; hierarchy levels L1–L5, leading vs lagging typing and role-based starter packs (CEO, Plant Manager, Quality, Maintenance…). Filter by category, level, indicator type, pillar, owner, frequency or status, regroup the scorecard on the fly, and use the Framework tab for causal driver trees and the OEE loss tree.",
  "/oms/siop": "24-month Sales, Inventory & Operations Planning — demand review, capacity & supply, long-lead materials and OSP tracking.",
  "/oms/scheduling": "Advanced scheduling across the 0–12 week horizon with frozen, firm and flexible zones, a capacity engine per work centre, material kitting readiness and rollup into SIOP.",
  "/oms/supply-chain": "Supplier and material flow view — long-lead items, expedites, supplier performance and the risks feeding the schedule.",
  "/oms/shopfloor": "Shop-Floor Flow modelled as a 2–20 gate relay with WIP, takt and gate performance, plus a Floor View tab for the operator kiosk — and the jump-off point to Short Interval Control, the Critical Path Pulse and the Value Stream Map.",
  "/oms/sic": "Short Interval Control boards: SQDCP status, hour-by-hour target vs actual with running variance, coded loss capture with a live Pareto, and containment actions with auto-suggested L1/L2/L3 escalation. Shifts can be closed and reopened to lock the record.",
  "/oms/critical-path": "Critical Path Pulse — the jobs and gates that decide this week's output, with the blockers and owners against each one.",
  "/oms/vsm": "Value Stream Map — drag-and-drop current vs future state with process boxes, inventory triangles and a VA/NVA timeline.",
  "/oms/industrialization": "Two stage-gate frameworks: AS9145 five-gate New Product Introduction (checklists, Kanban, review meeting) and New Equipment — capital equipment validation from PO through Design Freeze, FAT, IQ, SAT/OQ, PQ, ramp-up with OEE tracking and handover to operations. Full CRUD on equipment and gate states.",
  "/oms/end-of-life": "End-of-Life (LCG 8) — a gated checklist for exiting legacy or loss-making programs cleanly: last-time-buy and inventory run-down, customer and supplier notification, tooling and IP disposition, documentation retention, final quality and regulatory obligations, and financial closeout. Programs are tracked with owners, gate status and evidence.",
  "/oms/compliance": "Audit-ready compliance: Part 145 checklist across 6 pillars with snapshots and reset for the next audit, plus a dedicated SMS module (ICAO Annex 19) with topic-by-topic requirements and saved internal audits.",
  "/oms/risk": "Audit and events calendar with a Standard Work tab — the editable weekly leader cadence, drag-and-drop between days and saveable as reusable templates. Regulatory, customer and internal reviews plus key operational events.",




  // People
  "/people": "People hub overview — headcount, coverage and open capability gaps, with quick links into the skill matrix, gaps and certifications.",
  "/people/employees": "Employee master data with roles and skill assignments.",
  "/people/skills": "Skills catalog imported from the SkySkills library, with the Skill matrix (proficiency per employee per skill) and Gaps (coverage versus role requirements) as sibling tabs.",
  "/people/roles": "Job roles with the skills each role requires.",
  "/people/matrix": "Skill matrix — proficiency per employee per skill (a tab under Skills).",
  "/people/gaps": "Coverage and gap analysis derived from role requirements versus current proficiency (a tab under Skills).",
  "/people/certifications": "Certifications register with expiry tracking (a tab under Development).",
  "/people/development": "Individual development plans and targeted upskilling, with Certifications as a sibling tab.",
  "/people/engagement": "Change & Engagement — cascaded engagement architecture, the Change Curve, the 7×7 communication rule and J-Curve performance-dip visualisation. Reachable from the People overview.",
  "/people/leadership": "Leadership pipeline, succession and readiness.",
  "/people/org-chart": "Hierarchical org chart with drag-and-drop restructuring.",
  "/people/import": "Bulk import of employees, skills and roles from Excel.",
  // Actions
  "/actions": "The Execution portal — every action created anywhere in the suite in one place, across six views: Overview (health and overdue rollup), Board, Gantt (zoomable, with module and owner swimlanes), Table, Workload by owner, and Timeline (a horizontal history of what has been done and what is coming). Filters by status, owner and due date can be saved as reusable views.",
  "/actions/problem-solver": "Problem Solver hub: choose the right method for the pain — A3, 8D, 5 Whys, Fishbone, DMAIC, the structured toolkit (TOC, Causal Loops, IBP, Hoshin Kanri, Employee Journey Mapping), Aviation MRO, or the Problem Flow workspace with owners, status and progress.",
  "/actions/problem-solver/eight-d": "Eight Disciplines for high-severity escapes — emergency response, containment, root cause of occurrence and escape, permanent corrective action and prevention of recurrence.",
  "/actions/problem-solver/five-whys": "Fast root-cause chain for single-issue failures — five linked why steps ending in a verified cause and a countermeasure with an owner.",
  "/actions/problem-solver/fishbone": "Ishikawa cause-and-effect analysis across Man, Machine, Method, Material, Measurement and Environment, with candidate causes promoted into actions.",
  "/actions/problem-solver/dmaic": "Six Sigma DMAIC for variation problems — Define, Measure, Analyse, Improve and Control with phase evidence and gate sign-off.",
  "/actions/problem-solver/mro": "Aviation MRO: the five drivers of Muda in a maintenance hangar mapped to the five countermeasure modules, with saved maturity assessments and follow-up actions.",
  "/actions/problem-solver/toolkit": "The structured toolkit — Theory of Constraints, Causal Loop Diagrams, Integrated Business Planning, Hoshin Kanri and Employee Journey Mapping, each with a guided workspace and phase discipline so later phases cannot be attempted before the groundwork is done.",
  "/actions/problem-solver/flows": "Problem Flow workspace — a five-phase route from symptom to countermeasure, sequencing the right tools, owners, status and progress in one plan.",
  "/actions/calculators": "Shop-floor calculators for quick, defensible numbers you can drop into an A3 or a business case.",
  "/actions/calculators/oee": "OEE calculator — availability, performance and quality from run time, output and scrap, with the loss split shown.",
  "/actions/calculators/takt": "Takt time calculator — available time versus customer demand, and the cycle time each station has to hit.",
  "/actions/calculators/copq": "Cost of poor quality calculator — scrap, rework, warranty, containment and sorting rolled into an annualised figure.",
  "/actions/calculators/downtime": "Downtime cost calculator — lost hours converted into lost margin, labour and expedite cost.",
  "/actions/calculators/changeover": "Changeover / SMED calculator — internal versus external time, the capacity released and the batch-size effect of a faster changeover.",


  
};

export const CROSS_CUTTING: { label: string; to: string; blurb: string }[] = [
  { label: "KPIs (SQDCPME)", to: "/oms/kpis", blurb: "A library of ~225 curated metrics with definition, purpose, formula, data source, scope and exclusions; hierarchy levels L1–L5, leading vs lagging typing and role-based starter packs. Star the ones that matter and they become the Key KPIs used in every report." },
  { label: "Calendar & Standard Work", to: "/oms/risk", blurb: "Audit and events calendar — regulatory, customer and internal reviews — with a Standard Work tab holding the editable weekly leader cadence, saveable as reusable templates." },

  { label: "Exec Team Room (Intelligence add-on)", to: "/report/team-room", blurb: "An AI senior leadership team — CEO chair plus Operations, Sales, HR, Finance, Safety, Quality, Lean and an Exec Assistant. Ask a question and the relevant directors answer in one transcript, grounded in a read-only briefing pack of your live company data (strategy, waterfall, SQDP, KPIs, pipeline, cash, skills, compliance, actions). It only covers the modules you have switched on in Settings, and it advises rather than changes data. Separately licensed add-on, activated per company." },
  { label: "Execution portal", to: "/actions", blurb: "Every action created across Strategy, Progress, Operations, Turnaround Finance, Daily Management and the Problem Solver, in six views — Overview, Board, Gantt, Table, Workload and Timeline — with saveable filter views." },
  { label: "Board Report", to: "/report/board", blurb: "Block-based, editable board report exported as PDF or PowerPoint. Toggleable sections (VDT, CapEx, SIOP, Waterfall, Hoshin, Compliance, NPI, VoC, People…), a Custom Waterfall editor, and only starred KPIs. The Waterfall section mirrors exactly what is active in the Waterfall view." },
  { label: "Industrial Strategy report", to: "/report/industrial-strategy", blurb: "A presentation-ready summary of the Industrial Strategy Framework — cascade, strategic choices, portfolio, manufacturing and capacity model, cost and quality strategy, capital allocation and the execution cockpit — exportable to PDF or PowerPoint." },
  { label: "Owner Dashboard", to: "/report/owner", blurb: "The one-page view for an owner or MD: cash, margin, order intake, delivery and people risk, with the handful of numbers that actually decide the month." },
  { label: "Business Health Review", to: "/report/business-health", blurb: "A structured health check across the whole operating model, scoring each area and pointing at the modules that fix the weak spots." },
  { label: "Weekly SLT Meeting", to: "/meeting/weekly", blurb: "Full-screen, step-through agenda for the weekly site leadership review — safety, KPIs, escalations, pipeline, initiatives and actions." },

  { label: "Enterprise Network (add-on)", to: "/report/enterprise-network", blurb: "Model the enterprise as a network of nodes, layers and dependencies — dependency matrix, ripple analysis and insight views for multi-site or multi-entity operations. Full CRUD on models. Separately licensed add-on." },
  { label: "Floor View (kiosk)", to: "/floor", blurb: "A touch-friendly kiosk screen for the shop floor. Operators log barriers and downtime in seconds — what stopped them, for how long — feeding SQDP and Short Interval Control without feeling micromanaged." },
  { label: "Product Tour walkthroughs", to: "/support", blurb: "Guided, scenario-based walkthroughs of the app (for example \"Winning new business while holding margin\" or \"Technology & digital transformation\") that step through the real screens in order, plus the animated Getting started tour and this PDF." },
  { label: "Sandbox / free trial", to: "/pricing", blurb: "Explore the full suite against the TitanScale Template data in a session-only sandbox — nothing is written to the database and AI features are disabled — before creating a real workspace." },
  { label: "Settings", to: "/settings", blurb: "Hide or show pillars, sub-navigation entries and overview cards to tailor the app to your operating model — and save any selection as a reusable preset. Also sets the global money format: currency, decimal places and k / M abbreviation used across every chart and report." },

  { label: "Company selector", to: "/select-company", blurb: "Run the same framework across multiple companies. All data is scoped by the active company; copy and rename companies as needed. The TitanScale Template company is a read-only aerospace showcase." },
  { label: "User & access administration", to: "/admin", blurb: "See every user and what company they can reach, set access level (no access / read / write / admin), grant or revoke access per module, invite users by email, and cap monthly AI credit usage per user." },
];
