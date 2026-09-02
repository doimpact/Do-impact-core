// Business Continuity Management — shared types, vocabulary, scoring and form field specs.

export type Criticality = "critical" | "high" | "medium" | "low";

export const CRITICALITY: { key: Criticality; label: string; className: string }[] = [
  { key: "critical", label: "Critical", className: "bg-red-600 text-white" },
  { key: "high", label: "High", className: "bg-orange-500 text-white" },
  { key: "medium", label: "Medium", className: "bg-amber-400 text-amber-950" },
  { key: "low", label: "Low", className: "bg-emerald-500 text-white" },
];

export function criticalityMeta(key: string) {
  return CRITICALITY.find((c) => c.key === key) ?? CRITICALITY[1]!;
}

export const LIKELIHOOD_SCALE = [
  { n: 1, label: "Rare" },
  { n: 2, label: "Unlikely" },
  { n: 3, label: "Possible" },
  { n: 4, label: "Likely" },
  { n: 5, label: "Almost certain" },
];

export const IMPACT_SCALE = [
  { n: 1, label: "Minimal" },
  { n: 2, label: "Minor" },
  { n: 3, label: "Significant" },
  { n: 4, label: "Major" },
  { n: 5, label: "Severe / critical" },
];

export type RiskBand = { key: "low" | "moderate" | "high" | "critical"; label: string; className: string; action: string };

export function bcmRiskBand(score: number): RiskBand {
  if (score >= 17)
    return {
      key: "critical",
      label: "Critical",
      className: "bg-red-600 text-white",
      action: "Requires a defined mitigation plan, a recovery strategy and executive visibility.",
    };
  if (score >= 10)
    return {
      key: "high",
      label: "High",
      className: "bg-orange-500 text-white",
      action: "Requires a defined mitigation and recovery action with an owner and a due date.",
    };
  if (score >= 5)
    return {
      key: "moderate",
      label: "Moderate",
      className: "bg-amber-400 text-amber-950",
      action: "Manage through planned controls and periodic review.",
    };
  return { key: "low", label: "Low", className: "bg-emerald-500 text-white", action: "Accept and monitor." };
}

export const RISK_CATEGORIES: { key: string; label: string }[] = [
  { key: "facility", label: "Facility" },
  { key: "utilities", label: "Utilities" },
  { key: "equipment", label: "Equipment" },
  { key: "supply_chain", label: "Supply chain" },
  { key: "people", label: "People" },
  { key: "technology", label: "Technology / cyber" },
  { key: "quality", label: "Quality" },
];

export const RISK_STATUSES: { key: string; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "mitigated", label: "Mitigated" },
  { key: "closed", label: "Closed" },
];

export const ASSET_KINDS: { key: AssetKind; label: string; singular: string; hint: string }[] = [
  {
    key: "equipment",
    label: "Critical equipment",
    singular: "equipment item",
    hint: "Machines whose failure stops or severely limits a critical process.",
  },
  {
    key: "supplier",
    label: "Critical suppliers",
    singular: "supplier",
    hint: "Suppliers whose failure interrupts production or customer delivery.",
  },
  {
    key: "skill",
    label: "Critical skills & personnel",
    singular: "skill / role",
    hint: "Skills held by too few people. Every one needs a named backup.",
  },
  {
    key: "it_system",
    label: "Critical IT systems",
    singular: "IT system",
    hint: "Systems with an RTO/RPO, a tested backup and a manual fallback.",
  },
];

export type AssetKind = "equipment" | "supplier" | "skill" | "it_system";

export const ACTIVATION_LEVELS: { n: number; label: string; hint: string; className: string }[] = [
  { n: 0, label: "Level 0 — Normal", hint: "No significant disruption.", className: "bg-emerald-500 text-white" },
  {
    n: 1,
    label: "Level 1 — Department disruption",
    hint: "Example: single machine failure. Handled by the department.",
    className: "bg-sky-500 text-white",
  },
  {
    n: 2,
    label: "Level 2 — Site disruption",
    hint: "Example: major utility failure. Site leadership coordinates the response.",
    className: "bg-amber-400 text-amber-950",
  },
  {
    n: 3,
    label: "Level 3 — Major disruption",
    hint: "Major fire, cyberattack, extended outage or facility damage. Continuity team activated.",
    className: "bg-orange-500 text-white",
  },
  {
    n: 4,
    label: "Level 4 — Crisis",
    hint: "Threat to life, company survival, major customers or significant regulatory consequences.",
    className: "bg-red-600 text-white",
  },
];

export function activationMeta(n: number) {
  return ACTIVATION_LEVELS.find((l) => l.n === n) ?? ACTIVATION_LEVELS[0]!;
}

export const EXERCISE_TYPES: { key: string; label: string; hint: string }[] = [
  { key: "tabletop", label: "Tabletop", hint: "Discuss a scenario without disrupting operations." },
  { key: "functional", label: "Functional exercise", hint: "Test one capability — e.g. restore a critical IT system." },
  { key: "simulation", label: "Simulation", hint: "Test multiple departments together against a live scenario." },
];

export const INCIDENT_STATUSES: { key: string; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "recovering", label: "Recovering" },
  { key: "closed", label: "Closed" },
];

export const ACTION_STATUSES: { key: string; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

/* ---------------------------------- rows ---------------------------------- */

export type BcmProcess = {
  id: string;
  department: string | null;
  process: string;
  process_owner: string | null;
  customers_affected: string | null;
  employees_required: string | null;
  equipment_required: string | null;
  it_systems: string | null;
  utilities: string | null;
  materials: string | null;
  critical_suppliers: string | null;
  minimum_operating_level: string | null;
  mtd_hours: number | null;
  rto_hours: number | null;
  rpo_hours: number | null;
  business_impact: string | null;
  quality_regulatory_impact: string | null;
  dependencies: string | null;
  single_point_of_failure: string | null;
  current_backup: string | null;
  additional_actions: string | null;
  criticality: Criticality;
  bia_complete: boolean;
  recovery_plan_complete: boolean;
  created_at: string;
};

export type BcmRisk = {
  id: string;
  ref: string | null;
  risk: string;
  category: string;
  department: string | null;
  cause: string | null;
  consequence: string | null;
  affected_process: string | null;
  likelihood: number;
  impact: number;
  risk_score: number;
  existing_controls: string | null;
  preventive_action: string | null;
  recovery_action: string | null;
  owner_name: string | null;
  due_date: string | null;
  status: string;
  residual_risk: string | null;
  created_at: string;
};

export type BcmAsset = {
  id: string;
  asset_kind: AssetKind;
  name: string;
  department: string | null;
  process: string | null;
  criticality: Criticality;
  has_backup_strategy: boolean;
  recovery_strategy: string | null;
  recovery_time_hours: number | null;
  rpo_hours: number | null;
  last_tested: string | null;
  notes: string | null;
  details: Record<string, string>;
  created_at: string;
};

export type BcmIncident = {
  id: string;
  ref: string | null;
  title: string;
  occurred_at: string;
  activation_level: number;
  incident_commander: string | null;
  location: string | null;
  description: string | null;
  safety_impact: string | null;
  facility_impact: string | null;
  equipment_impact: string | null;
  it_impact: string | null;
  production_impact: string | null;
  supply_chain_impact: string | null;
  customer_impact: string | null;
  environmental_impact: string | null;
  immediate_actions: string | null;
  decisions: string | null;
  communications: string | null;
  recovery_actions: string | null;
  final_resolution: string | null;
  lessons_learned: string | null;
  status: string;
  recovery_hours: number | null;
  closed_at: string | null;
  created_at: string;
};

export type BcmExercise = {
  id: string;
  title: string;
  exercise_type: string;
  exercise_date: string;
  scenario: string | null;
  objectives: string | null;
  participants: string | null;
  expected_actions: string | null;
  actual_actions: string | null;
  what_worked: string | null;
  what_failed: string | null;
  lessons_learned: string | null;
  next_exercise: string | null;
  created_at: string;
};

export type BcmAction = {
  id: string;
  source_kind: string;
  risk_id: string | null;
  incident_id: string | null;
  exercise_id: string | null;
  action: string;
  owner_name: string | null;
  due_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

/* ------------------------------- form fields ------------------------------ */

export type FieldSpec = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "number" | "date" | "datetime" | "select" | "switch";
  options?: { key: string | number; label: string }[];
  hint?: string;
  required?: boolean;
  full?: boolean;
  detail?: boolean; // stored inside the jsonb details column
};

export const PROCESS_FIELDS: FieldSpec[] = [
  { name: "process", label: "Process", kind: "text", required: true, full: true },
  { name: "department", label: "Department", kind: "text" },
  { name: "process_owner", label: "Process owner", kind: "text" },
  {
    name: "criticality",
    label: "Criticality",
    kind: "select",
    options: CRITICALITY.map((c) => ({ key: c.key, label: c.label })),
  },
  { name: "customers_affected", label: "Customers affected", kind: "text" },
  { name: "minimum_operating_level", label: "Minimum operating level", kind: "text" },
  { name: "mtd_hours", label: "Maximum tolerable downtime (hours)", kind: "number" },
  { name: "rto_hours", label: "RTO — recovery time objective (hours)", kind: "number" },
  { name: "rpo_hours", label: "RPO — max data loss (hours)", kind: "number", hint: "IT/data processes only." },
  { name: "employees_required", label: "Employees required", kind: "text" },
  { name: "equipment_required", label: "Equipment required", kind: "text" },
  { name: "it_systems", label: "IT systems", kind: "text" },
  { name: "utilities", label: "Utilities", kind: "text" },
  { name: "materials", label: "Materials", kind: "text" },
  { name: "critical_suppliers", label: "Critical suppliers", kind: "text" },
  { name: "business_impact", label: "Business impact", kind: "textarea", full: true },
  { name: "quality_regulatory_impact", label: "Quality / regulatory impact", kind: "textarea", full: true },
  { name: "dependencies", label: "Dependencies", kind: "textarea", full: true },
  { name: "single_point_of_failure", label: "Single point of failure", kind: "textarea", full: true },
  { name: "current_backup", label: "Current backup / alternative", kind: "textarea", full: true },
  { name: "additional_actions", label: "Additional actions required", kind: "textarea", full: true },
  { name: "bia_complete", label: "BIA complete", kind: "switch" },
  { name: "recovery_plan_complete", label: "Recovery plan documented", kind: "switch" },
];

export const RISK_FIELDS: FieldSpec[] = [
  { name: "risk", label: "Risk", kind: "text", required: true, full: true },
  { name: "category", label: "Category", kind: "select", options: RISK_CATEGORIES.map((c) => ({ key: c.key, label: c.label })) },
  { name: "department", label: "Department", kind: "text" },
  { name: "affected_process", label: "Affected process", kind: "text" },
  { name: "status", label: "Status", kind: "select", options: RISK_STATUSES.map((s) => ({ key: s.key, label: s.label })) },
  { name: "cause", label: "Cause", kind: "textarea", full: true },
  { name: "consequence", label: "Potential consequence", kind: "textarea", full: true },
  { name: "existing_controls", label: "Existing controls", kind: "textarea", full: true },
  { name: "preventive_action", label: "Preventive action", kind: "textarea", full: true },
  { name: "recovery_action", label: "Recovery action", kind: "textarea", full: true },
  { name: "owner_name", label: "Owner", kind: "text" },
  { name: "due_date", label: "Due date", kind: "date" },
  { name: "residual_risk", label: "Residual risk after actions", kind: "text", full: true },
];

const COMMON_ASSET_FIELDS: FieldSpec[] = [
  { name: "department", label: "Department", kind: "text" },
  { name: "process", label: "Process supported", kind: "text" },
  {
    name: "criticality",
    label: "Criticality",
    kind: "select",
    options: CRITICALITY.map((c) => ({ key: c.key, label: c.label })),
  },
  { name: "recovery_time_hours", label: "Expected recovery time (hours)", kind: "number" },
];

export function assetFields(kind: AssetKind): FieldSpec[] {
  const head: FieldSpec = {
    name: "name",
    label:
      kind === "equipment" ? "Equipment" : kind === "supplier" ? "Supplier" : kind === "skill" ? "Skill / role" : "IT system",
    kind: "text",
    required: true,
    full: true,
  };
  const tail: FieldSpec[] = [
    { name: "recovery_strategy", label: "Recovery strategy", kind: "textarea", full: true },
    { name: "has_backup_strategy", label: "Backup / alternative in place", kind: "switch" },
    { name: "last_tested", label: "Last tested / verified", kind: "date" },
    { name: "notes", label: "Notes", kind: "textarea", full: true },
  ];

  const specific: Record<AssetKind, FieldSpec[]> = {
    equipment: [
      { name: "failure_consequence", label: "Failure consequence", kind: "textarea", full: true, detail: true },
      { name: "critical_spares", label: "Critical spare parts", kind: "text", detail: true },
      { name: "spare_location", label: "Spare location", kind: "text", detail: true },
      { name: "service_provider", label: "Service provider", kind: "text", detail: true },
      { name: "service_contact", label: "Service contact", kind: "text", detail: true },
      { name: "alternate_equipment", label: "Alternate equipment", kind: "text", detail: true },
      { name: "alternate_process", label: "Alternate process", kind: "text", detail: true },
      { name: "required_utilities", label: "Required utilities", kind: "text", detail: true },
      { name: "required_personnel", label: "Required personnel", kind: "text", detail: true },
      { name: "last_pm", label: "Last PM", kind: "date", detail: true },
      { name: "next_pm", label: "Next PM", kind: "date", detail: true },
    ],
    supplier: [
      { name: "material_service", label: "Material / service", kind: "text", detail: true },
      { name: "part_number", label: "Part number", kind: "text", detail: true },
      { name: "single_source", label: "Single source?", kind: "text", detail: true },
      { name: "alternate_supplier", label: "Alternate supplier", kind: "text", detail: true },
      { name: "alternate_material", label: "Alternate material", kind: "text", detail: true },
      { name: "lead_time", label: "Lead time", kind: "text", detail: true },
      { name: "minimum_inventory", label: "Minimum inventory", kind: "text", detail: true },
      { name: "current_inventory", label: "Current inventory", kind: "text", detail: true },
      { name: "emergency_contact", label: "Emergency contact", kind: "text", detail: true },
      { name: "transportation_backup", label: "Transportation backup", kind: "text", detail: true },
      { name: "quality_approval", label: "Quality approval required?", kind: "text", detail: true },
    ],
    skill: [
      { name: "primary_employee", label: "Primary employee", kind: "text", detail: true },
      { name: "backup_employee", label: "Backup employee", kind: "text", detail: true },
      { name: "second_backup", label: "Second backup", kind: "text", detail: true },
      { name: "training_required", label: "Training required", kind: "text", detail: true },
      { name: "current_qualification", label: "Current qualification", kind: "text", detail: true },
      { name: "cross_training_required", label: "Cross-training required", kind: "text", detail: true },
      { name: "minimum_staffing", label: "Minimum staffing", kind: "text", detail: true },
      { name: "external_resource", label: "External resource", kind: "text", detail: true },
    ],
    it_system: [
      { name: "system_owner", label: "System owner", kind: "text", detail: true },
      { name: "hosting", label: "Hosting / location", kind: "text", detail: true },
      { name: "backup_method", label: "Backup method & frequency", kind: "text", detail: true },
      { name: "backup_location", label: "Backup location", kind: "text", detail: true },
      { name: "manual_fallback", label: "Manual fallback procedure", kind: "textarea", full: true, detail: true },
      { name: "support_contact", label: "Support contact", kind: "text", detail: true },
    ],
  };

  const rpo: FieldSpec[] =
    kind === "it_system" ? [{ name: "rpo_hours", label: "RPO — max data loss (hours)", kind: "number" }] : [];

  return [head, ...COMMON_ASSET_FIELDS, ...rpo, ...specific[kind], ...tail];
}

export const INCIDENT_FIELDS: FieldSpec[] = [
  { name: "title", label: "Event", kind: "text", required: true, full: true },
  { name: "occurred_at", label: "Date / time", kind: "datetime" },
  {
    name: "activation_level",
    label: "Activation level",
    kind: "select",
    options: ACTIVATION_LEVELS.map((l) => ({ key: l.n, label: l.label })),
  },
  { name: "incident_commander", label: "Incident commander", kind: "text" },
  { name: "location", label: "Location", kind: "text" },
  { name: "status", label: "Status", kind: "select", options: INCIDENT_STATUSES.map((s) => ({ key: s.key, label: s.label })) },
  { name: "recovery_hours", label: "Recovery time (hours)", kind: "number" },
  { name: "description", label: "Description", kind: "textarea", full: true },
  { name: "safety_impact", label: "Safety impact", kind: "textarea", full: true },
  { name: "facility_impact", label: "Facility impact", kind: "textarea", full: true },
  { name: "equipment_impact", label: "Equipment impact", kind: "textarea", full: true },
  { name: "it_impact", label: "IT impact", kind: "textarea", full: true },
  { name: "production_impact", label: "Production impact", kind: "textarea", full: true },
  { name: "supply_chain_impact", label: "Supply chain impact", kind: "textarea", full: true },
  { name: "customer_impact", label: "Customer impact", kind: "textarea", full: true },
  { name: "environmental_impact", label: "Environmental impact", kind: "textarea", full: true },
  { name: "immediate_actions", label: "Immediate actions", kind: "textarea", full: true },
  { name: "decisions", label: "Decisions taken (decision log)", kind: "textarea", full: true },
  { name: "communications", label: "Communications issued", kind: "textarea", full: true },
  { name: "recovery_actions", label: "Recovery actions", kind: "textarea", full: true },
  { name: "final_resolution", label: "Final resolution", kind: "textarea", full: true },
  { name: "lessons_learned", label: "Lessons learned", kind: "textarea", full: true },
];

export const EXERCISE_FIELDS: FieldSpec[] = [
  { name: "title", label: "Exercise", kind: "text", required: true, full: true },
  {
    name: "exercise_type",
    label: "Type",
    kind: "select",
    options: EXERCISE_TYPES.map((t) => ({ key: t.key, label: t.label })),
  },
  { name: "exercise_date", label: "Date", kind: "date" },
  { name: "participants", label: "Participants", kind: "text" },
  { name: "next_exercise", label: "Next exercise", kind: "date" },
  { name: "scenario", label: "Scenario", kind: "textarea", full: true },
  { name: "objectives", label: "Objectives", kind: "textarea", full: true },
  { name: "expected_actions", label: "Expected actions", kind: "textarea", full: true },
  { name: "actual_actions", label: "Actual actions", kind: "textarea", full: true },
  { name: "what_worked", label: "What worked", kind: "textarea", full: true },
  { name: "what_failed", label: "What failed", kind: "textarea", full: true },
  { name: "lessons_learned", label: "Lessons learned", kind: "textarea", full: true },
];

export const ACTION_FIELDS: FieldSpec[] = [
  { name: "action", label: "Corrective action", kind: "text", required: true, full: true },
  { name: "owner_name", label: "Owner", kind: "text" },
  { name: "due_date", label: "Due date", kind: "date" },
  { name: "status", label: "Status", kind: "select", options: ACTION_STATUSES.map((s) => ({ key: s.key, label: s.label })) },
  { name: "notes", label: "Notes", kind: "textarea", full: true },
];

export function isOverdueAction(a: { status: string; due_date: string | null }) {
  return a.status !== "done" && !!a.due_date && a.due_date < new Date().toISOString().slice(0, 10);
}

export const BCM_CYCLE = [
  "Identify risks",
  "Analyze business impact",
  "Identify critical processes",
  "Establish recovery priorities",
  "Develop controls and backups",
  "Train people",
  "Test the plan",
  "Correct gaps",
  "Respond to disruption",
  "Recover critical operations",
  "Return to normal",
  "Learn and improve",
];

export const BCM_RULES = [
  "Safety always comes before production.",
  "Every critical business process must have an identified owner.",
  "Every critical process must have a documented recovery strategy.",
  "Critical recovery plans must be tested, not just written.",
  "Every significant disruption or exercise must produce lessons learned and corrective actions.",
];
