export type EightDStatus = "draft" | "open" | "containment" | "verification" | "closed" | "archived";
export type EightDSeverity = "low" | "medium" | "high" | "critical";

export type EightD = {
  id: string;
  company_id: string;
  title: string;
  reference: string | null;
  owner_id: string | null;
  created_by: string | null;
  status: EightDStatus;
  severity: EightDSeverity;
  source_escalation_id: string | null;
  emergency_response: boolean;
  d0_rationale: string | null;
  d0_emergency_action: string | null;
  d1_team: string | null;
  d1_champion: string | null;
  d2_who: string | null;
  d2_what: string | null;
  d2_where: string | null;
  d2_when: string | null;
  d2_why: string | null;
  d2_how: string | null;
  d2_how_many: string | null;
  d3_containment: string | null;
  d3_escape_verified: boolean;
  d3_containment_cost: number | null;
  d4_cause_occurrence: string | null;
  d4_cause_escape: string | null;
  d4_verification: string | null;
  d5_actions: string | null;
  d5_risk_assessment: string | null;
  d5_trial_result: string | null;
  d6_implementation: string | null;
  d6_owner: string | null;
  d6_target_date: string | null;
  d6_validation_period: string | null;
  d6_containment_removed_on: string | null;
  d7_prevention: string | null;
  d8_recognition: string | null;
  d8_closed_on: string | null;
  completed_disciplines: string[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export const EIGHT_D_STATUS_META: Record<EightDStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-200 text-neutral-700" },
  open: { label: "Open", className: "bg-sky-100 text-sky-800" },
  containment: { label: "Containment", className: "bg-amber-100 text-amber-800" },
  verification: { label: "Verification", className: "bg-indigo-100 text-indigo-800" },
  closed: { label: "Closed", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", className: "bg-neutral-100 text-neutral-500" },
};

export const EIGHT_D_SEVERITY_META: Record<EightDSeverity, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-neutral-100 text-neutral-600" },
  medium: { label: "Medium", className: "bg-sky-100 text-sky-800" },
  high: { label: "High", className: "bg-amber-100 text-amber-800" },
  critical: { label: "Critical", className: "bg-red-100 text-red-800" },
};

export type EightDField = {
  key: keyof EightD;
  label: string;
  kind?: "text" | "boolean" | "number" | "date";
  rows?: number;
  placeholder?: string;
};

export type Discipline = {
  code: string;
  title: string;
  description: string;
  fields: EightDField[];
};

export const DISCIPLINES: Discipline[] = [
  {
    code: "D0",
    title: "Preparation and Emergency Response",
    description:
      "Assess if the issue requires a full 8D investigation. If there is an immediate airworthiness or safety risk, apply an Emergency Response Action to halt the hazard immediately.",
    fields: [
      { key: "emergency_response", label: "Immediate airworthiness / safety risk", kind: "boolean" },
      { key: "d0_rationale", label: "Why an 8D is required", rows: 3, placeholder: "Severity, recurrence, customer or regulatory exposure." },
      { key: "d0_emergency_action", label: "Emergency Response Action taken", rows: 3, placeholder: "What was halted, quarantined or grounded, by whom and when." },
    ],
  },
  {
    code: "D1",
    title: "Form the Cross-Functional Team",
    description:
      "Assemble a team with direct process knowledge. Include bay leads, touch-labor technicians, quality specialists, engineering, and logistics support.",
    fields: [
      { key: "d1_champion", label: "Champion / sponsor", rows: 2 },
      { key: "d1_team", label: "Team members and roles", rows: 4, placeholder: "Bay lead, technicians, quality, engineering, logistics…" },
    ],
  },
  {
    code: "D2",
    title: "Define the Problem (5W2H)",
    description:
      "Detail the failure using Who, What, Where, When, Why, How, and How Many. Focus strictly on observable facts without assuming root causes.",
    fields: [
      { key: "d2_who", label: "Who", rows: 2 },
      { key: "d2_what", label: "What", rows: 2 },
      { key: "d2_where", label: "Where", rows: 2 },
      { key: "d2_when", label: "When", rows: 2 },
      { key: "d2_why", label: "Why (as reported, not root cause)", rows: 2 },
      { key: "d2_how", label: "How", rows: 2 },
      { key: "d2_how_many", label: "How many", rows: 2 },
    ],
  },
  {
    code: "D3",
    title: "Interim Containment Actions (ICA)",
    description:
      "Put an immediate firewall in place to isolate defects and protect customer schedules. Validate that containment stops all defect escapes, and track the cost of containment.",
    fields: [
      { key: "d3_containment", label: "Containment / firewall in place", rows: 4 },
      { key: "d3_escape_verified", label: "Containment verified to stop all escapes", kind: "boolean" },
      { key: "d3_containment_cost", label: "Cost of containment", kind: "number" },
    ],
  },
  {
    code: "D4",
    title: "Identify and Verify Root Causes",
    description:
      "Determine both the Root Cause of Occurrence (why the defect happened) and the Root Cause of Escape (why inspection missed it). Use tools like 5-Why analysis and Fishbone diagrams, and verify causes by testing hypotheses.",
    fields: [
      { key: "d4_cause_occurrence", label: "Root Cause of Occurrence", rows: 4 },
      { key: "d4_cause_escape", label: "Root Cause of Escape", rows: 4 },
      { key: "d4_verification", label: "Verification (how the cause was proven)", rows: 3 },
    ],
  },
  {
    code: "D5",
    title: "Select and Verify Permanent Corrective Actions",
    description:
      "Choose solutions that permanently eliminate the root cause. Run risk assessments to ensure changes do not create new risks, and test actions on a small scale.",
    fields: [
      { key: "d5_actions", label: "Selected permanent corrective actions", rows: 4 },
      { key: "d5_risk_assessment", label: "Risk assessment of the change", rows: 3 },
      { key: "d5_trial_result", label: "Small-scale trial result", rows: 3 },
    ],
  },
  {
    code: "D6",
    title: "Implement and Validate Corrective Actions",
    description:
      "Deploy corrective actions with assigned owners and timelines. Monitor performance data over an extended evaluation period before dismantling temporary containment.",
    fields: [
      { key: "d6_implementation", label: "Implementation and monitoring data", rows: 4 },
      { key: "d6_owner", label: "Action owner", rows: 2 },
      { key: "d6_target_date", label: "Target date", kind: "date" },
      { key: "d6_validation_period", label: "Validation period", rows: 2, placeholder: "e.g. 30 days / 5 consecutive lots" },
      { key: "d6_containment_removed_on", label: "Containment removed on", kind: "date" },
    ],
  },
  {
    code: "D7",
    title: "Prevent Systemic Recurrence",
    description:
      "Update standard operating procedures, work instructions, and quality management systems across all lines to prevent identical issues on future projects or bays.",
    fields: [{ key: "d7_prevention", label: "SOP / work instruction / QMS updates", rows: 5 }],
  },
  {
    code: "D8",
    title: "Recognize Team and Close Project",
    description:
      "Formalize project completion, archive findings in continuous improvement databases, and recognize the team's efforts.",
    fields: [
      { key: "d8_recognition", label: "Closure summary and team recognition", rows: 4 },
      { key: "d8_closed_on", label: "Closed on", kind: "date" },
    ],
  },
];

/** D6 may only be completed once D4 records a verified root cause of occurrence and escape. */
export function isDisciplineLocked(code: string, r: Partial<EightD>): string | null {
  if (code !== "D6") return null;
  const ok = Boolean(r.d4_cause_occurrence?.trim() && r.d4_cause_escape?.trim() && r.d4_verification?.trim());
  return ok ? null : "D4 must record a verified Root Cause of Occurrence and Root Cause of Escape first.";
}

export function disciplineHasContent(d: Discipline, r: Partial<EightD>): boolean {
  return d.fields.some((f) => {
    const v = r[f.key];
    if (f.kind === "boolean") return v === true;
    return typeof v === "number" ? true : Boolean(v && String(v).trim());
  });
}

export function completionPct(r: Partial<EightD>): number {
  const done = (r.completed_disciplines ?? []).length;
  return Math.round((done / DISCIPLINES.length) * 100);
}
