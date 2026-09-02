export type NpiProject = {
  id: string;
  part_number: string;
  part_name: string | null;
  customer: string | null;
  program: string | null;
  platform: string | null;
  owner_id: string | null;
  program_manager_id: string | null;
  sponsor_id: string | null;
  current_gate: 1 | 2 | 3 | 4 | 5;
  status: "planning" | "on_track" | "at_risk" | "delayed" | "on_hold" | "complete";
  health: "green" | "yellow" | "red" | null;
  contract_award_date: string | null;
  pdr_cdr_date: string | null;
  prr_date: string | null;
  fai_date: string | null;
  eis_date: string | null;
  target_eis_date: string | null;
  bid_unit_hours: number | null;
  bid_unit_cost: number | null;
  material_class: string | null;
  description: string | null;
  notes: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  project_id: string;
  gate: 1 | 2 | 3 | 4 | 5;
  sort_order: number;
  label: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  evidence_url: string | null;
  notes: string | null;
};

export type NpiRisk = {
  id: string;
  project_id: string;
  title: string;
  category: "technical" | "schedule" | "supply_chain" | "quality" | "cost" | null;
  likelihood: number | null;
  impact: number | null;
  mitigation: string | null;
  owner_id: string | null;
  status: "open" | "mitigated" | "closed";
  due_date: string | null;
};

export const GATE_LABELS: Record<number, { short: string; full: string; milestone: string }> = {
  1: { short: "Planning", full: "Planning & Program Definition", milestone: "Contract Award & Kickoff" },
  2: { short: "Product Design", full: "Product Design & Development", milestone: "PDR / CDR" },
  3: { short: "Process Design", full: "Process Design & Development", milestone: "PRR" },
  4: { short: "Validation", full: "Product & Process Validation", milestone: "FAI (AS9102) / PPAP" },
  5: { short: "Ramp", full: "Ramp, Delivery & Continuous Improvement", milestone: "EIS / Full-Rate" },
};

export const GATE_COLORS: Record<number, string> = {
  1: "bg-slate-500 text-white",
  2: "bg-blue-500 text-white",
  3: "bg-indigo-500 text-white",
  4: "bg-amber-500 text-white",
  5: "bg-emerald-500 text-white",
};

export const HEALTH_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export const STATUS_LABELS: Record<string, string> = {
  planning: "Planning", on_track: "On track", at_risk: "At risk",
  delayed: "Delayed", on_hold: "On hold", complete: "Complete",
};
