// APQP (Advanced Product Quality Planning, AIAG) framework definitions.
// Static content for the 5 phases, PPAP elements, statuses and the process guide.

export type ApqpStatus = "active" | "on_hold" | "complete" | "archived";
export type ApqpItemStatus = "not_started" | "in_progress" | "complete" | "na";

export const ITEM_STATUSES: { value: ApqpItemStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
  { value: "na", label: "N/A" },
];

export const PROJECT_STATUSES: { value: ApqpStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "complete", label: "Complete" },
  { value: "archived", label: "Archived" },
];

export interface ApqpPhase {
  phase: number;
  name: string;
  short: string;
  purpose: string;
  exit: string;
}

export const APQP_PHASES: ApqpPhase[] = [
  {
    phase: 1,
    name: "Plan & Define Program",
    short: "Plan",
    purpose:
      "Understand what the customer actually needs before anyone designs anything. Capture Voice of Customer, business case, assumptions, and set reliability and quality goals.",
    exit: "Goals, preliminary BOM, flow chart and special-characteristics list approved with management support.",
  },
  {
    phase: 2,
    name: "Product Design & Development",
    short: "Design",
    purpose:
      "Turn requirements into a verified design. DFMEA, design reviews, drawings and specs, DVP&R and prototype builds with a prototype control plan.",
    exit: "Design verified — drawings released, DVP&R complete, prototypes built and tested.",
  },
  {
    phase: 3,
    name: "Process Design & Development",
    short: "Process",
    purpose:
      "Design the manufacturing process that will deliver the design at rate. Process flow, PFMEA, pre-launch control plan, work instructions, MSA plan and packaging.",
    exit: "Process flow frozen, PFMEA and control plan issued, operators instructed, MSA and packaging planned.",
  },
  {
    phase: 4,
    name: "Product & Process Validation",
    short: "Validate",
    purpose:
      "Prove the process with a production trial run at rate, then submit the PPAP package — all 18 elements ending with the Part Submission Warrant.",
    exit: "Trial run passed, MSA and capability studies meet requirements, PSW approved by the customer.",
  },
  {
    phase: 5,
    name: "Feedback & Continuous Improvement",
    short: "Improve",
    purpose:
      "Run at rate and get better. Monitor SPC/Cpk, reduce variation, close the customer feedback loop and capture lessons learned into Problem Solver.",
    exit: "Stable, capable process with variation-reduction actions and lessons learned captured.",
  },
];

export const APQP_VS_AS9145 = [
  {
    topic: "Origin",
    apqp: "AIAG — automotive industry standard",
    as9145: "Aerospace standard (IAQG), built on APQP concepts",
  },
  {
    topic: "Structure",
    apqp: "5 phases with concurrent engineering",
    as9145: "5 gates aligned to customer milestones",
  },
  {
    topic: "Part approval",
    apqp: "PPAP — 18-element submission with PSW",
    as9145: "FAI (AS9102 First Article Inspection)",
  },
  {
    topic: "When to use",
    apqp: "Automotive and general industrial customers, or any customer that asks for PPAP",
    as9145: "Aerospace and defense customers, or any customer that asks for AS9145/AS9102",
  },
];

export const PPAP_LEVELS = [
  { level: 1, label: "Level 1", desc: "Part Submission Warrant (PSW) only" },
  { level: 2, label: "Level 2", desc: "PSW + product samples + limited supporting data" },
  { level: 3, label: "Level 3", desc: "PSW + product samples + complete supporting data (the default)" },
  { level: 4, label: "Level 4", desc: "PSW + other requirements defined by the customer" },
  { level: 5, label: "Level 5", desc: "PSW + samples + complete data available for review at your site" },
];

export interface ApqpProject {
  id: string;
  company_id: string;
  title: string;
  customer: string | null;
  account_id: string | null;
  part_number: string | null;
  part_name: string | null;
  program: string | null;
  current_phase: number;
  target_ppap_date: string | null;
  owner: string | null;
  status: ApqpStatus;
  pfmea_study_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface ApqpPhaseItem {
  id: string;
  company_id: string;
  project_id: string;
  phase: number;
  sort_order: number;
  label: string;
  status: ApqpItemStatus;
  evidence: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
