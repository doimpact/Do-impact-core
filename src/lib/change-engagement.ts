// Data for the "Change & Engagement" guide (People pillar) and the compact
// per-pillar engagement panels. Reference content only — no persistence.

export type TierKey = "board" | "exec" | "middle" | "frontline";

export type Tier = {
  key: TierKey;
  label: string;
  short: string;
  tone: string;
  /** 0-1 position along the change curve at announcement (Day 1). */
  curvePos: number;
  curveStage: string;
  need: string;
  focus: string;
  cadence: string;
  channels: string[];
  modules: { label: string; to: string }[];
};

export const TIERS: Tier[] = [
  {
    key: "board",
    label: "Board & Governance",
    short: "Board",
    tone: "var(--color-pillar-strategy)",
    curvePos: 0.92,
    curveStage: "Internalisation",
    need: "Risk mitigation, capital allocation, long-term enterprise value and ROI.",
    focus:
      "Scenario modelling, a realistic productivity-dip timeline, and milestone tracking against the value case. No surprises between packs.",
    cadence: "Monthly transformation committee",
    channels: ["Transformation committee packs", "Monthly risk matrix", "Milestone & value tracking"],
    modules: [
      { label: "Board-ready report", to: "/report/board" },
      { label: "Strategy Deployment (Waterfall)", to: "/strategy/waterfall" },
      { label: "Restructuring governance", to: "/strategy/restructuring" },
      { label: "Turnaround Finance (CAPEX)", to: "/strategy/capex" },
    ],
  },
  {
    key: "exec",
    label: "CEO & Executive Leadership",
    short: "Executive",
    tone: "var(--color-pillar-commercial)",
    curvePos: 0.75,
    curveStage: "Commitment",
    need: "Cross-functional alignment, a strategic narrative, and honest resource trade-offs.",
    focus:
      "A unified \u201cOne Voice\u201d narrative. Clarity on priorities — and explicit permission on what to stop doing.",
    cadence: "Weekly war room",
    channels: ["Weekly war-room sync", "Joint site visits", "Executive Q&A", "One-page narrative"],
    modules: [
      { label: "Weekly SLT meeting", to: "/meeting/weekly" },
      { label: "Hoshin Kanri", to: "/strategy/hoshin" },
      { label: "Progress (workstreams)", to: "/strategy/initiatives" },
      { label: "Timeline (Gantt)", to: "/actions" },
    ],
  },
  {
    key: "middle",
    label: "Middle & Plant Management",
    short: "Middle mgmt",
    tone: "var(--color-pillar-oms)",
    curvePos: 0.4,
    curveStage: "Testing",
    need: "Operational continuity, translating strategy into line metrics, and managing team anxiety.",
    focus:
      "Practical line-of-sight goals, peer support, and tools to coach floor teams through uncertainty without losing the day's output.",
    cadence: "Bi-weekly transformation huddle",
    channels: ["Transformation huddles", "Change-coaching toolkit", "Escalation pathway", "Peer circles"],
    modules: [
      { label: "Daily (SQDP)", to: "/oms/daily" },
      { label: "Standard work", to: "/oms/risk" },
      { label: "KPIs", to: "/oms/kpis" },
      { label: "Development plans", to: "/people/development" },
    ],
  },
  {
    key: "frontline",
    label: "Shop Floor / Frontline",
    short: "Frontline",
    tone: "var(--color-pillar-people)",
    curvePos: 0.06,
    curveStage: "Shock & denial",
    need: "Job security, daily workflow impact, personal safety — WIIFM (\u201cWhat's in it for me?\u201d).",
    focus:
      "Clear, jargon-free facts. Honest bad news delivered early. Active participation in designing the new workflow.",
    cadence: "Every shift",
    channels: ["5-minute shift stand-ups", "Gemba walks", "Visual KPI boards", "Dropbox / pulse checks"],
    modules: [
      { label: "SQDP board", to: "/oms/daily" },
      { label: "Shop floor flow", to: "/oms/shopfloor" },
      { label: "Value stream map", to: "/oms/vsm" },
      { label: "Skill matrix", to: "/people/matrix" },
    ],
  },
];

export const TIER_BY_KEY = Object.fromEntries(TIERS.map((t) => [t.key, t])) as Record<TierKey, Tier>;

export type PracticeGroup = {
  id: string;
  audience: string;
  title: string;
  tone: string;
  practices: { title: string; body: string }[];
};

export const PRACTICE_GROUPS: PracticeGroup[] = [
  {
    id: "frontline",
    audience: "Frontline & shop floor",
    title: "Respect, realism and the Gemba",
    tone: "var(--color-pillar-people)",
    practices: [
      {
        title: "Radical honesty on tough decisions",
        body:
          "Uncertainty degrades performance far worse than painful certainty. Where closures or reductions are required, communicate the timeline, the rationale and the support — outplacement, retraining, severance — immediately. Spinning a closure as an \u201coptimisation initiative\u201d destroys trust instantly, and it destroys it across every remaining plant, not just the affected one.",
      },
      {
        title: "Co-design new technology — avoid \u201cdone to\u201d syndrome",
        body:
          "When deploying automation, robotics or MES software, involve operators in the pilot phase. Kaizen events and workflow mapping with frontline teams turn resistance into ownership. Where operators help design the cell or the interface, adoption rates roughly double.",
      },
      {
        title: "Gemba presence over corporate town halls",
        body:
          "Shop floor teams view polished corporate presentations with scepticism. The most effective engagement happens where the work happens. Leaders walk the floor, ask open operational questions, and listen without immediate defensiveness.",
      },
    ],
  },
  {
    id: "middle",
    audience: "Middle management",
    title: "Unlocking the pivot point",
    tone: "var(--color-pillar-oms)",
    practices: [
      {
        title: "Engage them early as co-architects",
        body:
          "Plant managers and shift supervisors carry the highest burnout risk in a turnaround: they absorb team anxiety while remaining accountable for daily output. They should never learn about a major strategic shift at the same time as the shop floor or the public. Bring them into execution planning early so they own the solution they will have to defend.",
      },
      {
        title: "Equip them with leadership tools",
        body:
          "Give managers pragmatic Q&A toolkits, a clear escalation pathway for floor feedback, and explicit permission to acknowledge operational friction during the shift rather than paper over it.",
      },
    ],
  },
  {
    id: "board",
    audience: "CEO & Board",
    title: "Managing the J-curve",
    tone: "var(--color-pillar-strategy)",
    practices: [
      {
        title: "Plan for the productivity dip",
        body:
          "Major technology shifts and footprint consolidations almost always cause a temporary drop in productivity before the gains materialise. Aligning the board on the size and length of that window in advance prevents panic and premature course-correction.",
      },
      {
        title: "Establish a single source of truth",
        body:
          "A Transformation Management Office monitors operational KPIs, rollout milestones and frontline sentiment in parallel — one set of numbers, one narrative, one cadence.",
      },
    ],
  },
];

/** 7x7 rule — a key message needs ~7 repetitions across ~7 channels. */
export const SEVEN_CHANNELS = [
  "Shift handover",
  "Visual board",
  "Video message",
  "Town hall",
  "Q&A portal",
  "One-on-one",
  "Digital message",
];

export const FEEDBACK_LOOPS = [
  { label: "Anonymous dropbox", detail: "Physical on the floor and digital, read daily." },
  { label: "Shift pulse check", detail: "Two questions at handover — confidence and clarity." },
  { label: "Floor delegate forum", detail: "Elected representatives meet leadership fortnightly." },
  { label: "Rumour response", detail: "Every rumour answered publicly within 24–48 hours." },
];

/** Compact per-pillar engagement guidance. */
export type PillarEngagementKey = "strategy" | "commercial" | "oms" | "people";

export const PILLAR_ENGAGEMENT: Record<
  PillarEngagementKey,
  { intro: string; rows: { tier: TierKey; message: string; channel: string }[] }
> = {
  strategy: {
    intro:
      "The strategy tier is furthest ahead on the change curve. Translate the plan down without assuming anyone else has had your six months of thinking time.",
    rows: [
      { tier: "board", message: "Scenario range, value-bridge confidence and the size of the expected productivity dip.", channel: "Monthly committee pack" },
      { tier: "exec", message: "One narrative, ranked priorities and an explicit stop-doing list.", channel: "Weekly war room" },
      { tier: "middle", message: "Which roadmap objective their line owns, and what changes in their week.", channel: "Bi-weekly huddle" },
      { tier: "frontline", message: "What the plan means for this cell, in plain language, including the hard parts.", channel: "Shift stand-up + Gemba" },
    ],
  },
  commercial: {
    intro:
      "Commercial change lands on the floor as changed mix, changed rates and changed promises. Say who the customer is and why the change matters to them.",
    rows: [
      { tier: "board", message: "Pipeline coverage against plan and the revenue at risk during the transition.", channel: "Monthly committee pack" },
      { tier: "exec", message: "Customer commitments that constrain the transformation timeline.", channel: "Weekly war room" },
      { tier: "middle", message: "Volume and mix shifts arriving in the next two months, with staffing consequences.", channel: "Bi-weekly huddle" },
      { tier: "frontline", message: "Which customer depends on this gate being held, and what good looks like today.", channel: "Visual board + stand-up" },
    ],
  },
  oms: {
    intro:
      "Operations is where the change becomes visible daily. Keep the boards honest — a red cell that is discussed builds far more trust than a green cell that is managed.",
    rows: [
      { tier: "board", message: "Operational stability through the change window — safety, quality, OEE trend.", channel: "Monthly risk matrix" },
      { tier: "exec", message: "Escalations that need cross-functional trade-offs this week.", channel: "Weekly SLT meeting" },
      { tier: "middle", message: "Line-of-sight from strategy to the SQDP metric they own, plus coaching prompts.", channel: "Bi-weekly huddle" },
      { tier: "frontline", message: "Today's board, honest red status, and a 3C they helped write.", channel: "5-minute stand-up" },
    ],
  },
  people: {
    intro:
      "People is the answer to \u201cwhat happens to me?\u201d. Pair every structural change with a visible path — retrain, redeploy or exit with support.",
    rows: [
      { tier: "board", message: "Retention risk in critical skills and the cost of the people plan.", channel: "Monthly committee pack" },
      { tier: "exec", message: "Capability gaps that will throttle the transformation, and hiring trade-offs.", channel: "Weekly war room" },
      { tier: "middle", message: "Coaching toolkit, burnout watch and how to run the anxiety conversation.", channel: "Change-coaching toolkit" },
      { tier: "frontline", message: "Your skills path: what you will be trained on, by when, and by whom.", channel: "One-on-one + skill matrix" },
    ],
  },
};
