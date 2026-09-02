// Catalogue + shared logic for the Problem Solver toolkit
// (TOC, Causal Loop Diagrams, IBP, Hoshin Kanri, Employee Journey Mapping,
//  5 Whys, Fishbone, DMAIC).

export type ToolId = "toc" | "cld" | "ibp" | "hoshin" | "journey" | "mro" | "five-whys" | "fishbone" | "dmaic";


export type ToolDef = {
  id: ToolId;
  name: string;
  short: string;
  problem: string;
  mechanism: string;
  example: string;
  to: string;
  tone: string;
  bar: string;
  links: { label: string; to: string }[];
};

export const TOOLS: ToolDef[] = [
  {
    id: "toc",
    name: "Theory of Constraints",
    short: "TOC",
    problem: "Low margins, long lead times and poor throughput.",
    mechanism: "Identifies and maximises the single system bottleneck through the Five Focusing Steps.",
    example:
      "Shifting focus away from localised department efficiency to optimise overall cash-to-cash cycle time.",
    to: "/actions/problem-solver/toolkit/toc",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    bar: "bg-amber-500",
    links: [
      { label: "Shop floor flow", to: "/oms/shopfloor" },
      { label: "Value stream map", to: "/oms/vsm" },
      { label: "Working capital", to: "/strategy/capex" },
    ],
  },
  {
    id: "cld",
    name: "Systems Thinking",
    short: "Causal loops",
    problem: "Attrition loops and recurring quality spills.",
    mechanism: "Maps non-linear feedback loops and time delays across departments.",
    example:
      "Breaking the death spiral where schedule pressure causes quality spills, which cause rework, creating even worse schedule pressure.",
    to: "/actions/problem-solver/toolkit/cld",
    tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
    bar: "bg-violet-500",
    links: [
      { label: "Quality", to: "/oms/quality" },
      { label: "A3", to: "/actions/problem-solver/a3" },
      { label: "Engagement", to: "/people/engagement" },
    ],
  },
  {
    id: "ibp",
    name: "Integrated Business Planning",
    short: "IBP",
    problem: "Bad planning and unpredictable sales pipelines.",
    mechanism: "Unifies financial, commercial and operational forecasting into a single rolling model.",
    example:
      "Syncing long-bid sales pipelines directly with 18-month raw material lead times and equipment capacity.",
    to: "/actions/problem-solver/toolkit/ibp",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    bar: "bg-emerald-500",
    links: [
      { label: "SIOP", to: "/oms/siop" },
      { label: "Plan vs pipeline", to: "/commercial/plan" },
      { label: "Opportunities", to: "/commercial/opportunities" },
    ],
  },
  {
    id: "hoshin",
    name: "Hoshin Kanri",
    short: "X-Matrix",
    problem: "Executive misalignment and failed strategy execution.",
    mechanism: "Cascades 3-to-5-year strategic goals down into actionable shop-floor targets.",
    example:
      "Directly linking a corporate goal of 12% margin expansion to specific scrap reduction targets and pricing yields.",
    to: "/actions/problem-solver/toolkit/hoshin",
    tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200",
    bar: "bg-indigo-500",
    links: [
      { label: "Hoshin X-Matrix", to: "/strategy/hoshin" },
      { label: "Vision & roadmap", to: "/strategy" },
      { label: "KPIs", to: "/oms/kpis" },
    ],
  },
  {
    id: "journey",
    name: "Employee Journey Mapping",
    short: "Journey",
    problem: "High attrition and skilled labour loss.",
    mechanism: "Analyses human friction and operational pain points across the entire employee lifecycle.",
    example:
      "Diagnosing the root causes of machinist and engineer turnover beyond compensation — software friction, poor shift handoffs.",
    to: "/actions/problem-solver/toolkit/journey",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
    bar: "bg-sky-500",
    links: [
      { label: "Employees", to: "/people/employees" },
      { label: "Skill gaps", to: "/people/gaps" },
      { label: "Change & engagement", to: "/people/engagement" },
    ],
  },
  {
    id: "mro",
    name: "Aviation MRO",
    short: "MRO",
    problem: "Only ~40% of hangar labour is wrench-on-task.",
    mechanism:
      "Quantifies the five drivers of non-value-added time in a maintenance hangar and scores the readiness of the five countermeasure modules.",
    example:
      "Recovering turnaround time on a C-check by killing parts-search motion, RFI latency and paper sign-off friction.",
    to: "/actions/problem-solver/mro",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
    bar: "bg-rose-500",
    links: [
      { label: "Daily (SQDP)", to: "/oms/daily" },
      { label: "Shop floor flow", to: "/oms/shopfloor" },
      { label: "Value stream map", to: "/oms/vsm" },
    ],
  },
  {
    id: "five-whys",
    name: "5 Whys",
    short: "5 Whys",
    problem: "A symptom keeps coming back because the real cause is never named.",
    mechanism:
      "Drills down from a problem statement through five consecutive why questions until the root cause is revealed.",

    example:
      "Why did the machine stop? → overload → why? → not lubricated → why? → pump not pumping → why? → filter not cleaned → why? → no maintenance schedule.",
    to: "/actions/problem-solver/five-whys",
    tone: "bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-200",
    bar: "bg-lime-600",
    links: [
      { label: "A3", to: "/actions/problem-solver/a3" },
      { label: "8D", to: "/actions/problem-solver/eight-d" },
      { label: "Quality", to: "/oms/quality" },
    ],
  },
  {
    id: "fishbone",
    name: "Fishbone / Ishikawa",
    short: "Fishbone",
    problem: "Many possible causes and no way to group them.",
    mechanism:
      "Organises potential causes under the classic 6M categories (Man, Method, Machine, Material, Measurement, Mother Nature) so the team can test each branch.",
    example:
      "Mapping all the causes of a recurring surface-finish defect in a machining cell so the team can run targeted trials.",
    to: "/actions/problem-solver/fishbone",
    tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200",
    bar: "bg-cyan-600",
    links: [
      { label: "A3", to: "/actions/problem-solver/a3" },
      { label: "8D", to: "/actions/problem-solver/eight-d" },
      { label: "Quality", to: "/oms/quality" },
    ],
  },
  {
    id: "dmaic",
    name: "DMAIC",
    short: "DMAIC",
    problem: "High-impact variation where data is available but the path is unclear.",
    mechanism:
      "Five-phase data-driven cycle: Define the problem, Measure the current state, Analyse root causes, Improve with controlled trials, Control with standard work.",
    example:
      "Reducing first-pass yield variation on a complex assembly by measuring process capability, then locking the winning parameters.",
    to: "/actions/problem-solver/dmaic",
    tone: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-200",
    bar: "bg-fuchsia-600",
    links: [
      { label: "SIOP", to: "/oms/siop" },
      { label: "Quality", to: "/oms/quality" },
      { label: "KPIs", to: "/oms/kpis" },
    ],
  },
];


export const TOOL_BY_ID: Record<ToolId, ToolDef> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t]),
) as Record<ToolId, ToolDef>;

export const TOOLS_CATALOGUE: ToolDef[] = TOOLS.filter((t) => t.id !== "mro");

/** Structured methods shown alongside the tools on the Problem Solver hub. */
export type MethodCard = Omit<ToolDef, "id"> & { id: string; key: string };

export const PROBLEM_METHODS: MethodCard[] = [
  {
    id: "flow",
    key: "nav.actions.problem-solver",
    name: "Problem Flow",
    short: "Flow",
    problem: "Cross-functional problems with no owner and no visible sequence.",
    mechanism:
      "Defines the problem, picks the sub-processes involved and drives a visual flow with owners and progress tracking.",
    example: "Driving a late-delivery problem across planning, procurement and final assembly with one owner per step.",
    to: "/actions/problem-solver/flows",
    tone: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
    bar: "bg-slate-500",
    links: [
      { label: "Timeline (Gantt)", to: "/actions" },
      { label: "Daily (SQDP)", to: "/oms/daily" },
    ],
  },
  {
    id: "a3",
    key: "nav.actions.a3",
    name: "A3",
    short: "A3",
    problem: "Recurring issues fixed by opinion instead of evidence.",
    mechanism:
      "One-page structured report: background, current condition, goal, root cause, countermeasures and follow-up.",
    example: "Closing a repeat dimensional non-conformance with a measured current state and verified countermeasures.",
    to: "/actions/problem-solver/a3",
    tone: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200",
    bar: "bg-teal-500",
    links: [
      { label: "Quality", to: "/oms/quality" },
      { label: "Daily (SQDP)", to: "/oms/daily" },
    ],
  },
  {
    id: "eight-d",
    key: "nav.actions.eight-d",
    name: "8D",
    short: "8D",
    problem: "High-severity customer escapes needing containment and proof of prevention.",
    mechanism:
      "Eight Disciplines: emergency response, containment, dual root cause (occurrence and escape) and systemic prevention.",
    example: "Containing a shipped escape within 24 hours while proving the detection gap is permanently closed.",
    to: "/actions/problem-solver/eight-d",
    tone: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200",
    bar: "bg-orange-500",
    links: [
      { label: "Quality", to: "/oms/quality" },
      { label: "Compliance", to: "/oms/compliance" },
    ],
  },
];

/** Ordered card list for the Problem Solver hub: methods first, then the tools. */
export const PROBLEM_SOLVER_CARDS: MethodCard[] = [
  ...PROBLEM_METHODS,
  { ...TOOL_BY_ID.mro, key: "nav.actions.mro" },
  ...TOOLS_CATALOGUE.map((t) => ({ ...t, key: toolNavKey(t.id) })),
];

function toolNavKey(id: ToolId): string {
  if (id === "five-whys" || id === "fishbone" || id === "dmaic") return `nav.actions.${id}`;
  return "nav.actions.toolkit";
}



/** Symptom → tool routing used by the chooser matrix. */
export type Strength = "strong" | "support";
export type Symptom = { label: string; detail: string; fit: Partial<Record<ToolId, Strength>> };

export const SYMPTOMS: Symptom[] = [
  {
    label: "Margin erosion & long lead times",
    detail: "Throughput is capped somewhere, but every department reports good efficiency.",
    fit: { toc: "strong", ibp: "support", hoshin: "support", dmaic: "support" },
  },
  {
    label: "Recurring quality spills & rework",
    detail: "The same escape keeps coming back after every corrective action.",
    fit: { cld: "strong", toc: "support", "five-whys": "support", fishbone: "strong", dmaic: "support" },
  },
  {
    label: "Unreliable forecast & lumpy pipeline",
    detail: "Sales bids, material lead times and the financial plan tell three different stories.",
    fit: { ibp: "strong", toc: "support", hoshin: "support", dmaic: "support" },
  },
  {
    label: "Strategy not landing on the floor",
    detail: "Executives are aligned on paper; shop-floor targets don't reflect the goals.",
    fit: { hoshin: "strong", cld: "support" },
  },
  {
    label: "Attrition & skilled labour loss",
    detail: "Machinists and engineers leave faster than they can be trained.",
    fit: { journey: "strong", cld: "strong" },
  },
  {
    label: "Firefighting culture, no capacity to improve",
    detail: "Everyone is busy; improvement work never starts.",
    fit: { cld: "strong", toc: "support", journey: "support", "five-whys": "support" },
  },
  {
    label: "Cash tied up in WIP and inventory",
    detail: "Cash-to-cash cycle is long and inventory keeps growing.",
    fit: { toc: "strong", ibp: "strong" },
  },
  {
    label: "Technicians waiting on parts, tools and engineering answers",
    detail: "Labour is booked but the aircraft sits; wrench time is well under half the shift.",
    fit: { mro: "strong", toc: "support", cld: "support", fishbone: "support" },
  },
  {
    label: "Turnaround time slips after teardown",
    detail: "Non-routine findings, estimates and customer approvals drag the check past its release gate.",
    fit: { mro: "strong", ibp: "support" },
  },
  {
    label: "We know the defect but keep guessing the real cause",
    detail: "Every corrective action treats the symptom; the failure returns within days.",
    fit: { "five-whys": "strong", fishbone: "strong", dmaic: "support" },
  },
  {
    label: "Process data shows variation with no clear driver",
    detail: "Yield, cycle time or dimensional variation is visible but the team debates what to change.",
    fit: { dmaic: "strong", fishbone: "support", "five-whys": "support" },
  },
];


/** Compact decision guide rendered as a branch diagram on the toolkit page. */
export const DECISION_GUIDE: { question: string; answer: string; tool: ToolId }[] = [
  { question: "Is the pain FLOW?", answer: "Work queues, lead time, throughput, cash-to-cash", tool: "toc" },
  { question: "Is the pain FEEDBACK?", answer: "The problem keeps returning or gets worse when you push", tool: "cld" },
  { question: "Is the pain PLAN?", answer: "Demand, supply and money don't reconcile over the horizon", tool: "ibp" },
  { question: "Is the pain ALIGNMENT?", answer: "Goals exist but nobody owns a measurable target", tool: "hoshin" },
  { question: "Is the pain PEOPLE?", answer: "You lose the skills faster than you build them", tool: "journey" },
  { question: "Is the pain WRENCH TIME?", answer: "Labour is present but not on task — hangar waste and TAT slippage", tool: "mro" },
  { question: "Is the pain CAUSE?", answer: "One clear failure keeps recurring; drill down to the root", tool: "five-whys" },
  { question: "Is the pain CAUSES?", answer: "Many suspects and you need to test categories", tool: "fishbone" },
  { question: "Is the pain VARIATION?", answer: "Data shows stable but off-target process performance", tool: "dmaic" },
];

export const DECISION_GUIDE_CATALOGUE = DECISION_GUIDE.filter((d) => d.tool !== "mro");


// ---------------- Theory of Constraints ----------------

export const TOC_STEPS: { step: number; title: string; hint: string }[] = [
  { step: 1, title: "Identify the constraint", hint: "Find the single resource, policy or market limiting throughput. Load vs capacity, queue length and starvation tell you where it is." },
  { step: 2, title: "Exploit the constraint", hint: "Get maximum output from it with no capital: no setups over lunch, no unplanned downtime, no scrap or rework going through it." },
  { step: 3, title: "Subordinate everything else", hint: "Every other resource works to the drum. Release material by rope, protect with a time buffer, stop optimising local efficiencies." },
  { step: 4, title: "Elevate the constraint", hint: "Only now spend money — add a machine, a shift, outsourced capacity or a second source." },
  { step: 5, title: "Repeat — do not let inertia set in", hint: "Once broken, the constraint moves. Re-baseline the system and go back to step 1." },
];

export const POLICY_CONSTRAINT_CHECKS: string[] = [
  "Batch sizes set by accounting rather than flow",
  "Local efficiency / utilisation targets on non-constraints",
  "Absorption-based costing driving overproduction",
  "Inspection queued after the constraint instead of before",
  "Purchase MOQs and long-lead policies driving WIP",
  "Overtime approval rules slowing constraint recovery",
];

export function tocProgress(steps: { status: string }[]) {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ---------------- Causal Loop Diagrams ----------------

export type CldNode = { id: string; label: string; x: number; y: number; leverage?: string };
export type CldLink = { id: string; from: string; to: string; polarity: "S" | "O"; delay?: boolean };
export type CldLoop = { key: string; nodes: string[]; type: "R" | "B" };

let seq = 0;
export function cldId(prefix: string) {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq}`;
}

/** Enumerate simple directed cycles and classify them reinforcing / balancing. */
export function detectLoops(nodes: CldNode[], links: CldLink[]): CldLoop[] {
  const out: CldLoop[] = [];
  const seen = new Set<string>();
  const adj = new Map<string, CldLink[]>();
  for (const l of links) {
    if (!adj.has(l.from)) adj.set(l.from, []);
    adj.get(l.from)!.push(l);
  }
  const ids = nodes.map((n) => n.id);

  const walk = (start: string, current: string, path: string[], negatives: number) => {
    if (path.length > 12) return;
    for (const l of adj.get(current) ?? []) {
      const neg = negatives + (l.polarity === "O" ? 1 : 0);
      if (l.to === start) {
        const key = canonical(path);
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ key, nodes: [...path], type: neg % 2 === 0 ? "R" : "B" });
        }
        continue;
      }
      if (path.includes(l.to)) continue;
      if (ids.indexOf(l.to) < ids.indexOf(start)) continue; // canonicalise on lowest index
      walk(start, l.to, [...path, l.to], neg);
    }
  };

  for (const id of ids) walk(id, id, [id], 0);
  return out;
}

function canonical(path: string[]) {
  const min = path.reduce((a, b) => (a < b ? a : b));
  const i = path.indexOf(min);
  return [...path.slice(i), ...path.slice(0, i)].join(">");
}

export type CldTemplate = { key: string; name: string; description: string; nodes: CldNode[]; links: CldLink[] };

const ring = (labels: string[], cx = 430, cy = 210, r = 155): CldNode[] =>
  labels.map((label, i) => {
    const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    return { id: `n${i}`, label, x: Math.round(cx + r * Math.cos(a)), y: Math.round(cy + r * Math.sin(a)) };
  });

const chain = (n: number, polarities: ("S" | "O")[], delays: number[] = []): CldLink[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `l${i}`,
    from: `n${i}`,
    to: `n${(i + 1) % n}`,
    polarity: polarities[i] ?? "S",
    delay: delays.includes(i),
  }));

export const CLD_TEMPLATES: CldTemplate[] = [
  {
    key: "blank",
    name: "Blank canvas",
    description: "Start from nothing and add your own variables.",
    nodes: [],
    links: [],
  },
  {
    key: "death-spiral",
    name: "Schedule pressure death spiral",
    description:
      "Schedule pressure drives corner-cutting, which creates quality spills and rework, which consumes capacity and increases schedule pressure again.",
    nodes: ring(["Schedule pressure", "Corner cutting / skipped checks", "Quality spills", "Rework & scrap", "Capacity consumed"]),
    links: chain(5, ["S", "S", "S", "S", "S"], [2]),
  },
  {
    key: "attrition",
    name: "Attrition loop",
    description:
      "Attrition raises workload on those who remain, which lowers engagement and raises attrition — with a hiring/training delay that makes recovery slow.",
    nodes: ring(["Attrition", "Workload on remaining staff", "Burnout / disengagement", "Intent to leave"]),
    links: chain(4, ["S", "S", "S", "S"], [3]),
  },
  {
    key: "firefighting",
    name: "Firefighting & capability erosion",
    description:
      "Time spent firefighting crowds out improvement and training, which erodes capability and generates more fires. Classic capability trap.",
    nodes: ring(["Firefighting effort", "Time for improvement & training", "Process capability", "New problems arising"]),
    links: [
      { id: "l0", from: "n0", to: "n1", polarity: "O" },
      { id: "l1", from: "n1", to: "n2", polarity: "S", delay: true },
      { id: "l2", from: "n2", to: "n3", polarity: "O" },
      { id: "l3", from: "n3", to: "n0", polarity: "S" },
    ],
  },
  {
    key: "capacity-bid",
    name: "Bid pressure vs capacity",
    description:
      "Winning more work than capacity supports lengthens lead times, damaging OTD and reputation, which drives discounting and more low-margin bids.",
    nodes: ring(["Bids won", "Load vs capacity", "Lead time", "On-time delivery", "Price discounting"]),
    links: [
      { id: "l0", from: "n0", to: "n1", polarity: "S" },
      { id: "l1", from: "n1", to: "n2", polarity: "S", delay: true },
      { id: "l2", from: "n2", to: "n3", polarity: "O" },
      { id: "l3", from: "n3", to: "n4", polarity: "O" },
      { id: "l4", from: "n4", to: "n0", polarity: "S" },
    ],
  },
];

// ---------------- Integrated Business Planning ----------------

export const IBP_STEPS: { key: string; name: string; hint: string }[] = [
  { key: "portfolio", name: "Product & portfolio review", hint: "NPI gates, qualifications, obsolescence and design changes that move volume or cost in the horizon." },
  { key: "demand", name: "Demand review", hint: "Unconstrained demand: pipeline by probability, contracted backlog, aftermarket and long-bid campaigns." },
  { key: "supply", name: "Supply review", hint: "Capacity, labour, tooling, outside processing and long-lead raw material against that demand." },
  { key: "reconciliation", name: "Reconciliation", hint: "Close the gaps between demand, supply and the financial plan; frame the scenarios and the trade-offs." },
  { key: "mbr", name: "Management business review", hint: "One number set. Executives decide, own and fund the chosen scenario." },
];

export const IBP_GAP_KINDS: { key: string; label: string }[] = [
  { key: "gap", label: "Demand / supply gap" },
  { key: "material", label: "Long-lead material" },
  { key: "capacity", label: "Capacity / equipment" },
  { key: "financial", label: "Financial gap" },
];

// ---------------- Hoshin cascade review ----------------

export const HOSHIN_CHECKS: { key: string; label: string; hint: string }[] = [
  { key: "breakthrough", label: "3–5 year breakthroughs are stated as measurable outcomes", hint: "e.g. 12% margin expansion by 2029, not 'improve profitability'." },
  { key: "annual", label: "Every breakthrough has annual objectives beneath it", hint: "No orphan breakthrough — this year's slice must exist." },
  { key: "priority", label: "Every annual objective has improvement priorities", hint: "The actual projects: scrap reduction, pricing yield, setup reduction." },
  { key: "metric", label: "Every priority has a metric with a baseline and a target", hint: "If it isn't measured weekly on the floor, it won't move." },
  { key: "owner", label: "Every row has a single named owner", hint: "Shared ownership is no ownership." },
  { key: "floor", label: "Each corporate goal is traceable to a shop-floor target", hint: "12% margin → scrap %, first-pass yield, quoted vs actual hours." },
  { key: "catchball", label: "Catchball happened both ways before the targets were fixed", hint: "Targets negotiated with the level that must deliver them." },
  { key: "cadence", label: "A monthly review cadence exists with countermeasures on misses", hint: "The X-matrix is reviewed, not framed." },
];

export type HoshinFinding = {
  key: string;
  state: "ok" | "gap" | "na";
  note?: string;
};

export type CatchballEntry = { id: string; date: string; level: string; note: string };

// ---------------- Employee Journey Mapping ----------------

export const JOURNEY_STAGES: { key: string; name: string; hint: string }[] = [
  { key: "attract", name: "Attract", hint: "Employer brand, local competition for machinists and engineers, referral strength." },
  { key: "hire", name: "Hire", hint: "Time to offer, clearance/ITAR checks, realistic job preview, offer decline reasons." },
  { key: "onboard", name: "Onboard", hint: "First 90 days: kit, systems access, buddy, first solo job signed off." },
  { key: "develop", name: "Develop", hint: "Skill matrix progression, certifications, cross-training, who owns the plan." },
  { key: "perform", name: "Perform", hint: "Daily friction: software, tooling, shift handoff, drawings, chasing material." },
  { key: "progress", name: "Progress", hint: "Visible next step, pay bands, lead/technical track, internal moves." },
  { key: "retain", name: "Retain", hint: "Recognition, flexibility, leadership behaviour, stay conversations." },
  { key: "exit", name: "Exit", hint: "Exit interview themes, regretted vs non-regretted, knowledge capture." },
];

export const ROOT_CAUSES: { key: string; label: string }[] = [
  { key: "software", label: "Software / system friction" },
  { key: "handoff", label: "Shift handoff & communication" },
  { key: "leadership", label: "Leadership & recognition" },
  { key: "pay", label: "Pay & benefits" },
  { key: "workload", label: "Workload & shift pattern" },
  { key: "growth", label: "Growth & progression" },
  { key: "tooling", label: "Tooling, material & environment" },
  { key: "onboarding", label: "Onboarding & training" },
];

export const ROOT_CAUSE_LABEL: Record<string, string> = Object.fromEntries(
  ROOT_CAUSES.map((r) => [r.key, r.label]),
);

export function frictionScore(p: { severity: number; frequency: number }) {
  return (p.severity ?? 0) * (p.frequency ?? 0);
}

// ---------------- Systemic problem-solving phases (CLD workflow) ----------------

export type PhaseKey = "p1" | "p2" | "p3" | "p4" | "p5";
export type PhaseStatus = "not_started" | "in_progress" | "done";

export type PhaseMeta = {
  owner_id?: string | null;
  status?: PhaseStatus;
  start_date?: string | null;
  due_date?: string | null;
  notes?: string | null;
};

export type ReferenceMode = {
  id: string;
  label: string;
  unit?: string;
  points: { month: string; value: number | null }[];
};
export type Participant = { id: string; fn: string; name: string };
export type CrtNode = {
  id: string;
  label: string;
  kind: "ude" | "intermediate" | "core";
  parent_id: string | null;
};
export type Injection = {
  id: string;
  label: string;
  owner_id?: string | null;
  due_date?: string | null;
  status?: PhaseStatus;
};
export type PreMortem = { id: string; injection_id: string | null; effect: string; loop: string; mitigation: string };
export type Indicator = {
  id: string;
  name: string;
  kind: "lead" | "lag";
  target?: string;
  current?: string;
  owner_id?: string | null;
  cadence?: string;
};
export type DelayItem = { id: string; intervention: string; months: number; shows_up_in: string };

export type CldPhases = {
  meta?: Partial<Record<PhaseKey, PhaseMeta>>;
  override_gate?: boolean;
  reference_modes?: ReferenceMode[];
  problem_statement?: string;
  statement_checks?: Record<string, boolean>;
  participants?: Participant[];
  crt?: CrtNode[];
  constraint?: { kind?: "physical" | "policy"; name?: string; evidence?: string; toc_id?: string | null };
  leverage?: { link_id?: string | null; intervention?: string; rationale?: string };
  cloud?: {
    objective?: string;
    need_b?: string;
    need_c?: string;
    want_d?: string;
    want_dp?: string;
    assumptions?: string[];
  };
  injections?: Injection[];
  premortem?: PreMortem[];
  indicators?: Indicator[];
  delays?: DelayItem[];
};

export const STATEMENT_CHECKS: { key: string; label: string }[] = [
  { key: "timeframe", label: "Names a timeframe (12–36 months), not a single quarter" },
  { key: "magnitude", label: "Quantifies the drift (from X to Y)" },
  { key: "behavior", label: "Describes system behaviour, not a guilty department" },
  { key: "counter", label: "Includes the counter-intuitive fact that makes it systemic" },
];

export const STATEMENT_EXAMPLES = {
  weak: "Sales isn't bringing in high-margin jobs.",
  strong:
    "Over the last 18 months, our gross margin has declined from 22% to 14% despite a 15% increase in total shop-floor volume.",
};

export type PhaseDef = {
  key: PhaseKey;
  index: number;
  name: string;
  timeline: string;
  intent: string;
  checklist: { key: string; label: string; done: (p: CldPhases, ctx: { nodes: number; links: number }) => boolean }[];
};

export const CLD_PHASES: PhaseDef[] = [
  {
    key: "p1",
    index: 1,
    name: "Define the Pattern over Time",
    timeline: "1–2 weeks",
    intent: "Stop looking at isolated events or single-quarter metrics. Plot behaviour over 12–36 months.",
    checklist: [
      {
        key: "modes",
        label: "At least one reference mode plotted over 12+ months",
        done: (p) => (p.reference_modes ?? []).some((m) => m.points.filter((x) => x.value != null).length >= 12),
      },
      {
        key: "statement",
        label: "Problem statement written as system behaviour",
        done: (p) => (p.problem_statement ?? "").trim().length > 30,
      },
      {
        key: "checks",
        label: "Statement passes the strong-statement checks",
        done: (p) => STATEMENT_CHECKS.every((c) => p.statement_checks?.[c.key]),
      },
    ],
  },
  {
    key: "p2",
    index: 2,
    name: "Map the Cross-Functional System",
    timeline: "2–3 weeks",
    intent: "Get Sales, Ops, Finance, HR and Engineering in one room and map how their operations interact.",
    checklist: [
      { key: "people", label: "Three or more functions represented", done: (p) => (p.participants ?? []).length >= 3 },
      { key: "cld", label: "Causal loop diagram has variables and links", done: (_p, c) => c.nodes >= 4 && c.links >= 4 },
      {
        key: "crt",
        label: "Current Reality Tree traces UDEs to a core cause",
        done: (p) => (p.crt ?? []).some((n) => n.kind === "core") && (p.crt ?? []).filter((n) => n.kind === "ude").length >= 2,
      },
    ],
  },
  {
    key: "p3",
    index: 3,
    name: "Identify the Leverage Point & Constraint",
    timeline: "1–2 weeks",
    intent: "Resist fixing everything. Find the single bottleneck and the single high-leverage link.",
    checklist: [
      { key: "constraint", label: "System constraint named (physical or policy)", done: (p) => !!p.constraint?.name },
      { key: "evidence", label: "Evidence recorded for the constraint", done: (p) => (p.constraint?.evidence ?? "").length > 10 },
      { key: "leverage", label: "Leverage point selected on the diagram", done: (p) => !!p.leverage?.link_id && !!p.leverage?.intervention },
    ],
  },
  {
    key: "p4",
    index: 4,
    name: "Resolve Trade-offs & Design Countermeasures",
    timeline: "2–3 weeks",
    intent: "Systemic problems persist because two valid needs are in conflict. Break the conflict, don't compromise.",
    checklist: [
      {
        key: "cloud",
        label: "Evaporating Cloud fully articulated",
        done: (p) => !!p.cloud?.objective && !!p.cloud?.need_b && !!p.cloud?.need_c && !!p.cloud?.want_d && !!p.cloud?.want_dp,
      },
      { key: "injections", label: "At least one injection with an owner", done: (p) => (p.injections ?? []).some((i) => !!i.owner_id) },
      { key: "premortem", label: "Pre-mortem run back through the loops", done: (p) => (p.premortem ?? []).length >= 1 },
    ],
  },
  {
    key: "p5",
    index: 5,
    name: "Deploy, Account for Delays & Monitor",
    timeline: "Ongoing execution",
    intent: "Execute via Hoshin Kanri / A3. Track lead metrics long before lag metrics move.",
    checklist: [
      { key: "lead", label: "At least two lead indicators defined", done: (p) => (p.indicators ?? []).filter((i) => i.kind === "lead").length >= 2 },
      { key: "lag", label: "At least one lag indicator defined", done: (p) => (p.indicators ?? []).some((i) => i.kind === "lag") },
      { key: "delays", label: "Operational buffer / delay register built", done: (p) => (p.delays ?? []).length >= 1 },
    ],
  },
];

export const PHASE_BY_KEY: Record<PhaseKey, PhaseDef> = Object.fromEntries(
  CLD_PHASES.map((p) => [p.key, p]),
) as Record<PhaseKey, PhaseDef>;

export function phaseProgress(def: PhaseDef, phases: CldPhases, ctx: { nodes: number; links: number }) {
  const done = def.checklist.filter((c) => c.done(phases, ctx)).length;
  return { done, total: def.checklist.length, pct: Math.round((done / def.checklist.length) * 100) };
}

/** The Golden Rule: no interventions (Phase 4) until the map (Phase 2) is complete. */
export function phase4Locked(phases: CldPhases, ctx: { nodes: number; links: number }) {
  if (phases.override_gate) return false;
  return phaseProgress(PHASE_BY_KEY.p2, phases, ctx).pct < 100 && phases.meta?.p2?.status !== "done";
}

export const CRT_KIND_LABEL: Record<CrtNode["kind"], string> = {
  ude: "Undesirable effect",
  intermediate: "Intermediate effect",
  core: "Core root cause",
};

// ---------------- Aviation MRO (hangar wrench time) ----------------

export type MroDriverDef = {
  key: string;
  name: string;
  waste: string;
  benchmark: number;
  rootCause: string;
  impact: string;
};

/** Benchmark: ~40% wrench-on-task, ~60% waste split across these five drivers. */
export const MRO_BENCHMARK_WRENCH = 40;

export const MRO_DRIVERS: MroDriverDef[] = [
  {
    key: "parts_tooling",
    name: "Material & tooling search",
    waste: "Motion & waiting",
    benchmark: 20,
    rootCause:
      "Technicians arrive at the aircraft only to find parts aren't staged, consumables are missing, or calibrated tooling is checked out or unlocated.",
    impact:
      "Hours spent walking across large hangar footprints or queuing at tool cribs, driving high motion waste.",
  },
  {
    key: "rfi_latency",
    name: "RFI & engineering query latency",
    waste: "Information blocker",
    benchmark: 15,
    rootCause:
      "When an unexpected defect or ambiguous manual instruction arises, work halts while a Request for Information moves through email, paperwork or legacy ticketing.",
    impact:
      "The aircraft sits idle in the bay while labour hours bleed into indirect time waiting for liaison engineering or OEM dispositions.",
  },
  {
    key: "zone_crowding",
    name: "Spatial zone crowding & task mis-sequencing",
    waste: "Interference",
    benchmark: 15,
    rootCause:
      "Static, batch-released job packages put multiple technicians into the same airframe zone (flight deck, main landing gear well) at once, or dispatch tasks before prerequisite structural work is complete.",
    impact: "Physical interference, increased safety risk and accidental damage requiring rework.",
  },
  {
    key: "non_routine",
    name: "Non-routine discovery & scope creep lag",
    waste: "Waiting & rework",
    benchmark: 10,
    rootCause:
      "Heavy checks uncover 30–50% unscheduled non-routine defects after teardown; manual defect logging, estimate building and customer approvals drag on for days.",
    impact: "Late parts ordering, disrupted master schedules and missed Turnaround Time (TAT) targets.",
  },
  {
    key: "signoff_friction",
    name: "Paper-to-digital sign-off & audit friction",
    waste: "Over-processing",
    benchmark: 10,
    rootCause:
      "Dual data entry (paper task cards plus legacy MRO software), waiting for physical supervisor stamp-offs and end-of-check record clearing.",
    impact: "Administrative bottlenecks right at the scheduled release gate.",
  },
];

export type MroModuleDef = {
  key: string;
  index: number;
  name: string;
  rule: string;
  capabilities: { label: string; detail: string }[];
  drivers: string[];
};

export const MRO_MODULES: MroModuleDef[] = [
  {
    key: "gatekeeper",
    index: 1,
    name: "Pre-Execution Gatekeeper (kit & tool readiness)",
    rule: "Never dispatch a job card to the shop floor unless all prerequisites are verified 100% ready.",
    capabilities: [
      { label: "Kit completeness", detail: "Integrates with inventory and ERP to track parts, hardware, consumables, calibrated tooling and AMM/SB revision status." },
      { label: "Automated staging", detail: "Triggers staging alerts to parts stores 2 hours prior to scheduled task initiation." },
    ],
    drivers: ["parts_tooling"],
  },
  {
    key: "dispatch",
    index: 2,
    name: "Dynamic spatial dispatch & work-package optimizer",
    rule: "Maximise wrenches-on-task by dispatching certified labour based on physical airframe geometry and critical path.",
    capabilities: [
      { label: "Zone matrix engine", detail: "Models physical access constraints (cockpit, fuel tanks) and caps maximum concurrent technician density per zone." },
      { label: "Skill & sign-off matching", detail: "Matches job cards to technician certifications — FAA/EASA authorisation, engine and airframe type ratings." },
      { label: "Dynamic re-sequencing", detail: "If a task hits a temporary blocker, the queue instantly re-sequences to the next highest-priority unblocked card." },
    ],
    drivers: ["zone_crowding"],
  },
  {
    key: "rfi",
    index: 3,
    name: "Mobile defect & rapid RFI workflow",
    rule: "Compress defect-to-quote-to-authorisation lead time from days to minutes.",
    capabilities: [
      { label: "Mobile defect capture", detail: "Technicians log non-routine findings at the aircraft on tablets, tagging photos/video, structural coordinates and required part numbers." },
      { label: "Instant customer portal", detail: "Pushes digital estimates to airline technical representatives for one-click approval." },
      { label: "Digital RFI routing", detail: "Routes technical queries to liaison engineering with SLA timers that escalate to Tier 2 daily management if unresolved within 60 minutes." },
    ],
    drivers: ["rfi_latency", "non_routine"],
  },
  {
    key: "pricing",
    index: 4,
    name: "Dynamic parts & non-routine pricing engine",
    rule: "Protect overhaul margins and capture value on unscheduled scope expansion.",
    capabilities: [
      { label: "Parametric estimator", detail: "Uses historical overhaul data to auto-generate labour and material estimates for newly discovered non-routines." },
      { label: "Dynamic margin engine", detail: "Adjusts parts markups and labour rates by lead-time urgency (routine stock vs AOG sourcing) and contract terms." },
    ],
    drivers: ["non_routine"],
  },
  {
    key: "tat",
    index: 5,
    name: "Real-time critical chain & TAT predictor",
    rule: "Provide proactive 48-hour forward visibility into critical path delays.",
    capabilities: [
      { label: "Buffer tracking", detail: "Live Gantt and buffer consumption along the aircraft's critical path." },
      { label: "EDT prediction", detail: "Automatically updates estimated departure time and highlights root-cause bottlenecks for Tier 2/3 accountability huddles." },
    ],
    drivers: ["signoff_friction", "zone_crowding", "non_routine"],
  },
];

export const MRO_MATURITY = ["none", "manual", "partial", "digital", "optimised"] as const;
export type MroMaturity = (typeof MRO_MATURITY)[number];
export const MRO_MATURITY_LABEL: Record<MroMaturity, string> = {
  none: "None",
  manual: "Manual",
  partial: "Partial",
  digital: "Digital",
  optimised: "Optimised",
};
export const MRO_MATURITY_TONE: Record<MroMaturity, string> = {
  none: "bg-muted text-muted-foreground",
  manual: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  digital: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  optimised: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
};

export type MroDriverEntry = { current?: number; target?: number; owner_id?: string | null; evidence?: string };
export type MroModuleEntry = { maturity?: MroMaturity; owner_id?: string | null; target_date?: string | null; notes?: string };

export function mroDriverValue(entry: MroDriverEntry | undefined, def: MroDriverDef) {
  return typeof entry?.current === "number" ? entry.current : def.benchmark;
}
export function mroDriverTarget(entry: MroDriverEntry | undefined, def: MroDriverDef) {
  return typeof entry?.target === "number" ? entry.target : mroDriverValue(entry, def);
}

/** Totals for the wrench-time bar: current waste, target waste and recovered time. */
export function mroTotals(drivers: Record<string, MroDriverEntry>) {
  const waste = MRO_DRIVERS.reduce((a, d) => a + mroDriverValue(drivers[d.key], d), 0);
  const targetWaste = MRO_DRIVERS.reduce((a, d) => a + mroDriverTarget(drivers[d.key], d), 0);
  return {
    waste: Math.round(waste * 10) / 10,
    targetWaste: Math.round(targetWaste * 10) / 10,
    wrench: Math.round((100 - waste) * 10) / 10,
    targetWrench: Math.round((100 - targetWaste) * 10) / 10,
    recovered: Math.round((waste - targetWaste) * 10) / 10,
  };
}
