/**
 * Problem-first copy for the 12 capability modules.
 * Mirrors the narrative used in the Remotion problem videos so the website,
 * landing pages and video scripts stay consistent.
 */

export type ProblemContent = {
  /** URL path of the matching module landing page. */
  path: string;
  /** Display label for the module. */
  label: string;
  /** One of the four pillars. */
  pillar: "Strategy" | "Commercial" | "Operations" | "People";
  /** The opening problem statement / hook. */
  hook: string;
  /** 2–3 specific costs or symptoms of the problem. */
  costs: string[];
  /** The turn: how DO.Impact changes the outcome. */
  close: string;
  /** 3 feature labels + hints that explain the solution. */
  how: { label: string; hint: string }[];
};

export const PROBLEM_CONTENT: ProblemContent[] = [
  {
    path: "/hoshin-kanri-software",
    label: "Vision & Strategy",
    pillar: "Strategy",
    hook: "Everyone works to a different strategy.",
    costs: [
      "Five priorities per department",
      "Nobody can name the top three",
      "The plan dies in the slide deck",
    ],
    close: "One line of sight, board to shop floor.",
    how: [
      { label: "X-matrix", hint: "Breakthrough goals linked to annual objectives and owners" },
      { label: "Catchball", hint: "Targets negotiated down and committed back up" },
      { label: "Daily metrics", hint: "Every KPI traces to a strategic objective" },
    ],
  },
  {
    path: "/contract-review-software",
    label: "Bid, CRM & Contract Review",
    pillar: "Commercial",
    hook: "You find out the contract was bad after you signed it.",
    costs: [
      "Margin quoted on a guess",
      "Capacity promised twice",
      "Penalty clauses nobody read",
    ],
    close: "Risk, margin and feasibility priced before the signature.",
    how: [
      { label: "Pipeline", hint: "Opportunities, owners and probability in one register" },
      { label: "Five gates", hint: "Technical, capacity, quality, commercial, legal sign-off" },
      { label: "RACI", hint: "Every clause has a name against it before you commit" },
    ],
  },
  {
    path: "/apqp-software",
    label: "APQP, AS9145 & NPI",
    pillar: "Commercial",
    hook: "Every launch is a scramble.",
    costs: [
      "Tooling late, PPAP later",
      "Design changes after the first article",
      "Production inherits the problems",
    ],
    close: "Five gates. Nothing passes half-finished.",
    how: [
      { label: "Gate reviews", hint: "Planning through production, with evidence attached" },
      { label: "PFMEA & control plan", hint: "Risk worked before the process is frozen" },
      { label: "Portfolio view", hint: "Every launch, every gate, one screen" },
    ],
  },
  {
    path: "/siop-software",
    label: "SIOP & Capacity",
    pillar: "Strategy",
    hook: "Sales promises what the plant can't build.",
    costs: [
      "Order book beyond capacity",
      "Overtime to cover the gap",
      "Customers told late",
    ],
    close: "Demand and capacity in the same conversation, monthly.",
    how: [
      { label: "Demand plan", hint: "Forecast, order book and pipeline consolidated" },
      { label: "Capacity check", hint: "Load against real machine and labour hours" },
      { label: "Scenarios", hint: "Test the shift pattern before you commit to it" },
    ],
  },
  {
    path: "/procurement-management-software",
    label: "Procurement Control",
    pillar: "Commercial",
    hook: "The line stops because a part didn't arrive.",
    costs: [
      "Supplier performance lives in email",
      "Single sources nobody flagged",
      "Expedite fees every month",
    ],
    close: "Supply risk visible weeks before it hits the line.",
    how: [
      { label: "Scorecards", hint: "OTIF, quality and responsiveness per supplier" },
      { label: "Risk register", hint: "Single sources and dependencies surfaced early" },
      { label: "Escalation", hint: "A route from buyer to boardroom with dates on it" },
    ],
  },
  {
    path: "/capacity-planning-software",
    label: "Capacity Scheduling",
    pillar: "Operations",
    hook: "The schedule is fiction by Tuesday.",
    costs: [
      "Planned on paper capacity",
      "Breakdowns rewrite the week",
      "Every date becomes a promise you break",
    ],
    close: "Commitments built on availability you can prove.",
    how: [
      { label: "Cell capacity", hint: "Availability, downtime and manning per work centre" },
      { label: "Gantt", hint: "Orders sequenced against the constraint, not the wish" },
      { label: "Reschedule", hint: "See the knock-on before you move the job" },
    ],
  },
  {
    path: "/shop-floor-management-software",
    label: "Daily Management",
    pillar: "Operations",
    hook: "Yesterday's problem is discovered next week.",
    costs: [
      "Meetings without data",
      "Issues raised, never owned",
      "The same miss, every shift",
    ],
    close: "Tiered meetings that escalate in hours, not weeks.",
    how: [
      { label: "SQDP board", hint: "Safety, quality, delivery, people — green or not, daily" },
      { label: "Short-interval control", hint: "Hour by hour, so a bad shift is caught at 10am" },
      { label: "Escalation", hint: "What T1 can't fix arrives at T2 with the facts" },
    ],
  },
  {
    path: "/maintenance-management-software",
    label: "Maintenance (AM/PM)",
    pillar: "Operations",
    hook: "The machine tells you it's broken. Too late.",
    costs: [
      "PM skipped when the plant is busy",
      "Breakdowns become the plan",
      "OEE losses nobody counted",
    ],
    close: "Care before failure, owned by the operator.",
    how: [
      { label: "AM routines", hint: "Operator checks with evidence, per shift" },
      { label: "PM plan", hint: "Compliance tracked, overdue tasks visible" },
      { label: "OEE loss tree", hint: "Where the hours actually go, by cause" },
    ],
  },
  {
    path: "/skills-matrix-software",
    label: "Skills Management",
    pillar: "People",
    hook: "One person leaves and the cell stops.",
    costs: [
      "Critical skills held by one operator",
      "Training is word of mouth",
      "Holidays become a capacity crisis",
    ],
    close: "Single points of failure named before they bite.",
    how: [
      { label: "Matrix", hint: "Proficiency by person, process and cell" },
      { label: "Gap analysis", hint: "Where cover is thin, ranked by risk" },
      { label: "Training plan", hint: "Who trains whom, by when, with sign-off" },
    ],
  },
  {
    path: "/problem-solving-software",
    label: "Structured Problem Solving",
    pillar: "People",
    hook: "The same problem comes back every quarter.",
    costs: [
      "Symptoms fixed, causes untouched",
      "No record of what was tried",
      "The fix leaves with the person",
    ],
    close: "Root cause, once — and it stays fixed.",
    how: [
      { label: "A3 & 8D", hint: "Structured cases with containment, cause and proof" },
      { label: "5-Why", hint: "Guided so the fifth why is not a guess" },
      { label: "Standard work", hint: "The countermeasure becomes how the job is done" },
    ],
  },
  {
    path: "/safety-management-software",
    label: "Safety & EHS",
    pillar: "Operations",
    hook: "Safety lives in a binder nobody opens.",
    costs: [
      "Near misses never written down",
      "Actions without owners",
      "The audit finds it first",
    ],
    close: "A safety management system inside the daily routine.",
    how: [
      { label: "Reporting", hint: "Thirty-second near-miss capture, anonymous if needed" },
      { label: "Risk scoring", hint: "Severity times likelihood, not who shouts loudest" },
      { label: "Hierarchy of controls", hint: "Engineering fixes before PPE" },
    ],
  },
  {
    path: "/business-continuity-software",
    label: "Business Continuity",
    pillar: "People",
    hook: "One outage and nobody knows who does what.",
    costs: [
      "Recovery plan two years old",
      "Key data on one laptop",
      "Customers hear about it before you call",
    ],
    close: "Critical processes, protected and rehearsed.",
    how: [
      { label: "Impact analysis", hint: "What must run, and how long you can survive without it" },
      { label: "Continuity plans", hint: "Actions, owners and recovery times written down" },
      { label: "Rehearsal", hint: "Tested, dated, and improved after every drill" },
    ],
  },
];
