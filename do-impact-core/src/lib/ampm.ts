// Autonomous Maintenance / Preventive Maintenance — shared types, vocabulary and form field specs.
// AM = operators own basic equipment care and early detection.
// PM = maintenance owns planned technical maintenance and equipment reliability.
// Engineering = eliminates chronic problems and improves equipment.

import type { FieldSpec } from "./bcm";

export type { FieldSpec };

/* -------------------------------- taxonomy -------------------------------- */

export type EquipCriticality = "A" | "B" | "C" | "D";

export const EQUIP_CRITICALITY: { key: EquipCriticality; label: string; hint: string; className: string }[] = [
  {
    key: "A",
    label: "A — Critical",
    hint: "Failure significantly affects safety, major customers, production, quality or business continuity.",
    className: "bg-red-600 text-white",
  },
  {
    key: "B",
    label: "B — High",
    hint: "Failure significantly reduces production capability but alternatives exist.",
    className: "bg-orange-500 text-white",
  },
  { key: "C", label: "C — Medium", hint: "Failure causes manageable disruption.", className: "bg-amber-400 text-amber-950" },
  { key: "D", label: "D — Low", hint: "Failure has limited operational impact.", className: "bg-emerald-500 text-white" },
];

export function equipCriticalityMeta(key: string) {
  return EQUIP_CRITICALITY.find((c) => c.key === key) ?? EQUIP_CRITICALITY[1]!;
}

export const CONDITION_RATINGS: { key: string; label: string; hint: string; className: string }[] = [
  { key: "green", label: "Green", hint: "Good condition.", className: "bg-emerald-500 text-white" },
  { key: "yellow", label: "Yellow", hint: "Degraded — monitor.", className: "bg-amber-400 text-amber-950" },
  { key: "red", label: "Red", hint: "High risk — corrective action required.", className: "bg-red-600 text-white" },
];

export function conditionMeta(key: string) {
  return CONDITION_RATINGS.find((c) => c.key === key) ?? CONDITION_RATINGS[0]!;
}

export const AM_LEVELS: { n: number; label: string; hint: string }[] = [
  { n: 1, label: "L1 — Basic condition", hint: "Clean, remove contamination, spot leaks, loose parts, damaged guards, noise, heat, buildup." },
  { n: 2, label: "L2 — Inspection", hint: "Belts, chains, bearings, sensors, gauges, hydraulics, pneumatics, coolant, lubrication, fasteners." },
  { n: 3, label: "L3 — Basic care", hint: "Where authorised: lubrication, basic tightening, cleaning filters, approved fluids, basic adjustments." },
  { n: 4, label: "L4 — Early detection", hint: "Recognise changes from normal: noise, vibration, temperature, pressure, cycle time, quality, energy, leakage, wear." },
  { n: 5, label: "L5 — Standardised care", hint: "AM performed consistently to documented standards." },
];

export const TAG_COLOURS: { key: string; label: string; hint: string; className: string }[] = [
  { key: "red", label: "RED", hint: "Immediate attention — potential safety issue or major failure.", className: "bg-red-600 text-white" },
  { key: "yellow", label: "YELLOW", hint: "Requires planned maintenance.", className: "bg-amber-400 text-amber-950" },
  { key: "green", label: "GREEN", hint: "Monitor — minor issue.", className: "bg-emerald-500 text-white" },
];

export function tagMeta(key: string) {
  return TAG_COLOURS.find((t) => t.key === key) ?? TAG_COLOURS[1]!;
}

export const ABNORMALITY_STATUSES = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "repaired", label: "Repaired" },
  { key: "verified", label: "Verified" },
  { key: "closed", label: "Closed" },
];

export const PM_FREQUENCIES: { key: string; label: string; hint: string }[] = [
  { key: "shift", label: "Shift", hint: "Operator checks, visual inspection, fluid levels." },
  { key: "daily", label: "Daily", hint: "Basic cleaning and condition checks." },
  { key: "weekly", label: "Weekly", hint: "Detailed inspection, lubrication where required, basic adjustments." },
  { key: "monthly", label: "Monthly", hint: "Mechanical/electrical inspection, safety devices, belts, sensors, filters." },
  { key: "quarterly", label: "Quarterly", hint: "Detailed mechanical inspection, alignment, electrical checks, condition monitoring." },
  { key: "semiannual", label: "Semiannual", hint: "Major inspections, component replacement, calibration." },
  { key: "annual", label: "Annual", hint: "Overhaul where required, OEM/service inspections." },
];

export const PM_TYPES = [
  { key: "inspection", label: "Inspection" },
  { key: "cleaning", label: "Cleaning" },
  { key: "lubrication", label: "Lubrication" },
  { key: "adjustment", label: "Adjustment" },
  { key: "replacement", label: "Replacement" },
  { key: "calibration", label: "Calibration" },
  { key: "testing", label: "Testing" },
  { key: "predictive", label: "Predictive / condition monitoring" },
];

export const WORK_KINDS = [
  { key: "planned", label: "Planned PM" },
  { key: "emergency", label: "Emergency / breakdown" },
  { key: "improvement", label: "Reliability improvement" },
];

export const WORK_RESULTS = [
  { key: "pass", label: "Pass" },
  { key: "conditional", label: "Conditional" },
  { key: "fail", label: "Fail" },
];

export const WORK_STATUSES = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "complete", label: "Complete" },
  { key: "overdue", label: "Overdue" },
];

export const FAILURE_CLASSES: { key: string; label: string; hint: string; className: string }[] = [
  { key: "safety", label: "Safety", hint: "Potential injury or unsafe condition.", className: "bg-red-600 text-white" },
  { key: "quality", label: "Quality", hint: "Potentially affects product quality.", className: "bg-orange-500 text-white" },
  { key: "functional", label: "Functional", hint: "Equipment cannot perform its required function.", className: "bg-amber-400 text-amber-950" },
  { key: "minor", label: "Minor", hint: "Equipment runs but the condition is degraded.", className: "bg-sky-500 text-white" },
  { key: "repeat", label: "Repeat", hint: "The same failure has occurred repeatedly.", className: "bg-purple-600 text-white" },
  { key: "chronic", label: "Chronic", hint: "Recurring failure requiring engineering attention.", className: "bg-fuchsia-600 text-white" },
];

export function failureClassMeta(key: string) {
  return FAILURE_CLASSES.find((c) => c.key === key) ?? FAILURE_CLASSES[2]!;
}

export const SPARE_CRITICALITY = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export const ACTION_PRIORITIES: { n: number; label: string; hint: string }[] = [
  { n: 1, label: "P1 — Critical", hint: "Safety, major production or catastrophic equipment risk." },
  { n: 2, label: "P2 — High", hint: "Significant reliability or production risk." },
  { n: 3, label: "P3 — Medium", hint: "Important but manageable." },
  { n: 4, label: "P4 — Low", hint: "Improvement or minor work." },
];

export const AMPM_ACTION_STATUSES = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

/** The standard 15-point operator daily check. */
export const AM_CHECK_ITEMS: { key: string; label: string }[] = [
  { key: "clean", label: "Equipment clean" },
  { key: "oil", label: "No oil leaks" },
  { key: "coolant", label: "No coolant leaks" },
  { key: "air", label: "No air leaks" },
  { key: "guards", label: "Guards secure" },
  { key: "estop", label: "Emergency stop accessible" },
  { key: "sensors", label: "Sensors appear normal" },
  { key: "gauges", label: "Gauges within normal range" },
  { key: "lube", label: "Lubrication level acceptable" },
  { key: "noise", label: "No unusual noise" },
  { key: "vibration", label: "No unusual vibration" },
  { key: "heat", label: "No unusual heat" },
  { key: "loose", label: "No loose components" },
  { key: "area", label: "Work area clear" },
  { key: "reported", label: "Abnormalities reported" },
];

/* ---------------------------------- rows ---------------------------------- */

export type AmpmEquipment = {
  id: string;
  equipment_code: string | null;
  name: string;
  department: string | null;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  process: string | null;
  criticality: EquipCriticality;
  installation_date: string | null;
  primary_operator: string | null;
  maintenance_owner: string | null;
  failure_modes: string | null;
  am_level: number;
  am_program: string | null;
  pm_program: string | null;
  critical_spares: string | null;
  service_provider: string | null;
  backup_equipment: string | null;
  last_pm: string | null;
  next_pm: string | null;
  condition_rating: string;
  availability_pct: number | null;
  notes: string | null;
  created_at: string;
};

export type AmpmAmCheck = {
  id: string;
  equipment_id: string | null;
  check_date: string;
  shift: string | null;
  operator_name: string | null;
  items: Record<string, boolean>;
  items_passed: number | null;
  items_total: number | null;
  abnormality_found: boolean;
  abnormality: string | null;
  action_taken: string | null;
  notification_ref: string | null;
  created_at: string;
};

export type AmpmAbnormality = {
  id: string;
  equipment_id: string | null;
  found_on: string;
  tag_colour: string;
  description: string;
  found_by: string | null;
  can_run_safely: boolean;
  maintenance_assessment: string | null;
  corrective_action: string | null;
  owner_name: string | null;
  due_date: string | null;
  status: string;
  verified_by: string | null;
  closed_at: string | null;
  created_at: string;
};

export type AmpmPmTask = {
  id: string;
  equipment_id: string | null;
  task: string;
  pm_type: string;
  frequency: string;
  last_completed: string | null;
  next_due: string | null;
  owner_name: string | null;
  estimated_hours: number | null;
  required_parts: string | null;
  downtime_required: boolean;
  safety_requirements: string | null;
  status: string;
  created_at: string;
};

export type AmpmWorkOrder = {
  id: string;
  equipment_id: string | null;
  pm_task_id: string | null;
  wo_ref: string | null;
  work_kind: string;
  scheduled_date: string | null;
  actual_date: string | null;
  technician: string | null;
  labour_hours: number | null;
  parts_replaced: string | null;
  findings: string | null;
  additional_repairs: string | null;
  result: string;
  next_pm_due: string | null;
  supervisor_verified: boolean;
  status: string;
  created_at: string;
};

export type AmpmBreakdown = {
  id: string;
  equipment_id: string | null;
  occurred_at: string;
  reported_by: string | null;
  failure_mode: string | null;
  immediate_cause: string | null;
  classification: string;
  downtime_hours: number | null;
  response_hours: number | null;
  repair_hours: number | null;
  parts_used: string | null;
  temporary_fix: boolean;
  permanent_fix: boolean;
  repeat_failure: boolean;
  root_cause_required: boolean;
  root_cause: string | null;
  corrective_action: string | null;
  owner_name: string | null;
  due_date: string | null;
  verification: string | null;
  status: string;
  created_at: string;
};

export type AmpmSpare = {
  id: string;
  equipment_id: string | null;
  part_name: string;
  part_number: string | null;
  description: string | null;
  criticality: string;
  min_quantity: number | null;
  current_quantity: number | null;
  supplier: string | null;
  lead_time_days: number | null;
  storage_location: string | null;
  alternate_part: string | null;
  last_used: string | null;
  created_at: string;
};

export type AmpmLubrication = {
  id: string;
  equipment_id: string | null;
  point_location: string;
  lubricant: string | null;
  grade: string | null;
  quantity: string | null;
  frequency: string;
  application_method: string | null;
  responsible: string | null;
  last_done: string | null;
  notes: string | null;
  created_at: string;
};

export type AmpmAction = {
  id: string;
  source_kind: string;
  equipment_id: string | null;
  breakdown_id: string | null;
  abnormality_id: string | null;
  action: string;
  owner_name: string | null;
  due_date: string | null;
  priority: number;
  status: string;
  notes: string | null;
  created_at: string;
};

/* ---------------------------------- KPIs ---------------------------------- */

export function pmCompliance(tasks: AmpmPmTask[], today = new Date()) {
  const active = tasks.filter((t) => t.status === "active");
  const due = active.filter((t) => t.next_due);
  const overdue = due.filter((t) => new Date(t.next_due as string) < today);
  const pct = due.length === 0 ? 100 : Math.round(((due.length - overdue.length) / due.length) * 100);
  return { due: due.length, overdue: overdue.length, pct };
}

export function mtbf(breakdowns: AmpmBreakdown[], operatingHours: number) {
  if (breakdowns.length === 0) return null;
  return operatingHours / breakdowns.length;
}

export function mttr(breakdowns: AmpmBreakdown[]) {
  const withRepair = breakdowns.filter((b) => typeof b.repair_hours === "number");
  if (withRepair.length === 0) return null;
  return withRepair.reduce((n, b) => n + (b.repair_hours ?? 0), 0) / withRepair.length;
}

export function workMix(orders: AmpmWorkOrder[]) {
  const hours = (k: string) =>
    orders.filter((o) => o.work_kind === k).reduce((n, o) => n + (o.labour_hours ?? 0), 0);
  const emergency = hours("emergency");
  const planned = hours("planned") + hours("improvement");
  const total = emergency + planned;
  return {
    emergencyPct: total === 0 ? 0 : Math.round((emergency / total) * 100),
    plannedPct: total === 0 ? 0 : Math.round((planned / total) * 100),
    totalHours: total,
  };
}

/* ------------------------------- form fields ------------------------------ */

const CRIT_OPTIONS = EQUIP_CRITICALITY.map((c) => ({ key: c.key as string, label: c.label }));
const COND_OPTIONS = CONDITION_RATINGS.map((c) => ({ key: c.key, label: c.label }));
const FREQ_OPTIONS = PM_FREQUENCIES.map((f) => ({ key: f.key, label: f.label }));

export const EQUIPMENT_FIELDS: FieldSpec[] = [
  { name: "name", label: "Equipment name", kind: "text", required: true, full: true },
  { name: "equipment_code", label: "Equipment ID", kind: "text" },
  { name: "department", label: "Department", kind: "text" },
  { name: "location", label: "Location", kind: "text" },
  { name: "process", label: "Process", kind: "text" },
  { name: "manufacturer", label: "Manufacturer", kind: "text" },
  { name: "model", label: "Model", kind: "text" },
  { name: "serial_number", label: "Serial number", kind: "text" },
  { name: "criticality", label: "Criticality", kind: "select", options: CRIT_OPTIONS, hint: "Criticality drives PM frequency, spares, monitoring and response priority." },
  { name: "condition_rating", label: "Condition", kind: "select", options: COND_OPTIONS },
  { name: "am_level", label: "AM level", kind: "select", options: AM_LEVELS.map((l) => ({ key: l.n, label: l.label })) },
  { name: "installation_date", label: "Installation date", kind: "date" },
  { name: "primary_operator", label: "Primary operator", kind: "text" },
  { name: "maintenance_owner", label: "Maintenance owner", kind: "text" },
  { name: "service_provider", label: "Service provider", kind: "text" },
  { name: "backup_equipment", label: "Backup equipment", kind: "text" },
  { name: "last_pm", label: "Last PM", kind: "date" },
  { name: "next_pm", label: "Next PM", kind: "date" },
  { name: "availability_pct", label: "Availability %", kind: "number" },
  { name: "failure_modes", label: "Key failure modes", kind: "textarea" },
  { name: "am_program", label: "AM programme", kind: "textarea" },
  { name: "pm_program", label: "PM programme", kind: "textarea" },
  { name: "critical_spares", label: "Critical spare parts", kind: "textarea" },
  { name: "notes", label: "Notes", kind: "textarea" },
];

export const ABNORMALITY_FIELDS: FieldSpec[] = [
  { name: "description", label: "Abnormality", kind: "text", required: true, full: true },
  { name: "tag_colour", label: "Tag", kind: "select", options: TAG_COLOURS.map((t) => ({ key: t.key, label: `${t.label} — ${t.hint}` })) },
  { name: "found_on", label: "Found on", kind: "date" },
  { name: "found_by", label: "Found by", kind: "text" },
  { name: "can_run_safely", label: "Production can continue safely", kind: "switch" },
  { name: "maintenance_assessment", label: "Maintenance assessment", kind: "textarea" },
  { name: "corrective_action", label: "Corrective action", kind: "textarea" },
  { name: "owner_name", label: "Owner", kind: "text" },
  { name: "due_date", label: "Due date", kind: "date" },
  { name: "status", label: "Status", kind: "select", options: ABNORMALITY_STATUSES },
  { name: "verified_by", label: "Closure verified by", kind: "text" },
];

export const PM_TASK_FIELDS: FieldSpec[] = [
  { name: "task", label: "PM task", kind: "text", required: true, full: true },
  { name: "pm_type", label: "PM type", kind: "select", options: PM_TYPES },
  { name: "frequency", label: "Frequency", kind: "select", options: FREQ_OPTIONS },
  { name: "last_completed", label: "Last completed", kind: "date" },
  { name: "next_due", label: "Next due", kind: "date" },
  { name: "owner_name", label: "Owner", kind: "text" },
  { name: "estimated_hours", label: "Estimated hours", kind: "number" },
  { name: "downtime_required", label: "Downtime required", kind: "switch" },
  { name: "status", label: "Status", kind: "select", options: [{ key: "active", label: "Active" }, { key: "paused", label: "Paused" }, { key: "retired", label: "Retired" }] },
  { name: "required_parts", label: "Required parts", kind: "textarea" },
  { name: "safety_requirements", label: "Safety requirements", kind: "textarea" },
];

export const WORK_ORDER_FIELDS: FieldSpec[] = [
  { name: "wo_ref", label: "Work order #", kind: "text" },
  { name: "work_kind", label: "Work type", kind: "select", options: WORK_KINDS },
  { name: "scheduled_date", label: "Scheduled date", kind: "date" },
  { name: "actual_date", label: "Actual date", kind: "date" },
  { name: "technician", label: "Technician", kind: "text" },
  { name: "labour_hours", label: "Labour hours", kind: "number" },
  { name: "result", label: "Equipment condition", kind: "select", options: WORK_RESULTS },
  { name: "status", label: "Status", kind: "select", options: WORK_STATUSES },
  { name: "next_pm_due", label: "Next PM due", kind: "date" },
  { name: "supervisor_verified", label: "Supervisor verified", kind: "switch" },
  { name: "findings", label: "Findings", kind: "textarea" },
  { name: "parts_replaced", label: "Parts replaced", kind: "textarea" },
  { name: "additional_repairs", label: "Additional repairs required", kind: "textarea" },
];

export const BREAKDOWN_FIELDS: FieldSpec[] = [
  { name: "failure_mode", label: "Failure mode", kind: "text", required: true, full: true },
  { name: "occurred_at", label: "Occurred at", kind: "datetime" },
  { name: "reported_by", label: "Reported by", kind: "text" },
  { name: "classification", label: "Classification", kind: "select", options: FAILURE_CLASSES.map((c) => ({ key: c.key, label: c.label })) },
  { name: "downtime_hours", label: "Downtime (h)", kind: "number" },
  { name: "response_hours", label: "Maintenance response (h)", kind: "number" },
  { name: "repair_hours", label: "Repair time (h)", kind: "number" },
  { name: "temporary_fix", label: "Temporary fix applied", kind: "switch" },
  { name: "permanent_fix", label: "Permanent fix applied", kind: "switch" },
  { name: "repeat_failure", label: "Repeat failure", kind: "switch" },
  { name: "root_cause_required", label: "Root-cause analysis required", kind: "switch" },
  { name: "owner_name", label: "Owner", kind: "text" },
  { name: "due_date", label: "Due date", kind: "date" },
  { name: "status", label: "Status", kind: "select", options: [{ key: "open", label: "Open" }, { key: "repaired", label: "Repaired" }, { key: "closed", label: "Closed" }] },
  { name: "immediate_cause", label: "Immediate cause", kind: "textarea" },
  { name: "root_cause", label: "Root cause", kind: "textarea" },
  { name: "parts_used", label: "Parts used", kind: "textarea" },
  { name: "corrective_action", label: "Corrective action", kind: "textarea" },
  { name: "verification", label: "Verification", kind: "textarea" },
];

export const SPARE_FIELDS: FieldSpec[] = [
  { name: "part_name", label: "Part", kind: "text", required: true, full: true },
  { name: "part_number", label: "Part number", kind: "text" },
  { name: "criticality", label: "Criticality", kind: "select", options: SPARE_CRITICALITY },
  { name: "min_quantity", label: "Minimum quantity", kind: "number" },
  { name: "current_quantity", label: "Current quantity", kind: "number" },
  { name: "supplier", label: "Supplier", kind: "text" },
  { name: "lead_time_days", label: "Lead time (days)", kind: "number" },
  { name: "storage_location", label: "Storage location", kind: "text" },
  { name: "alternate_part", label: "Alternate part", kind: "text" },
  { name: "last_used", label: "Last used", kind: "date" },
  { name: "description", label: "Description", kind: "textarea" },
];

export const LUBRICATION_FIELDS: FieldSpec[] = [
  { name: "point_location", label: "Lubrication point", kind: "text", required: true, full: true },
  { name: "lubricant", label: "Lubricant", kind: "text" },
  { name: "grade", label: "Grade", kind: "text" },
  { name: "quantity", label: "Quantity", kind: "text" },
  { name: "frequency", label: "Frequency", kind: "select", options: FREQ_OPTIONS },
  { name: "application_method", label: "Application method", kind: "text" },
  { name: "responsible", label: "Responsible person", kind: "text" },
  { name: "last_done", label: "Last done", kind: "date" },
  { name: "notes", label: "Notes", kind: "textarea" },
];

export const AMPM_ACTION_FIELDS: FieldSpec[] = [
  { name: "action", label: "Action", kind: "text", required: true, full: true },
  { name: "owner_name", label: "Owner", kind: "text" },
  { name: "due_date", label: "Due date", kind: "date" },
  { name: "priority", label: "Priority", kind: "select", options: ACTION_PRIORITIES.map((p) => ({ key: p.n, label: p.label })) },
  { name: "status", label: "Status", kind: "select", options: AMPM_ACTION_STATUSES },
  { name: "notes", label: "Notes", kind: "textarea" },
];
