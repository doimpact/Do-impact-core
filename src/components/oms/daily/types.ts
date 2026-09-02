import type { DmCategory, DmLoopState } from "@/lib/oms.functions";

export type Board = { id: string; name: string; archived_at: string | null; sort_order: number };

export type Category = {
  id: string;
  key: string;
  label: string;
  accent: string;
  icon: string;
  unit?: string | null;
  sort_order: number;
  archived_at: string | null;
};

export type CategoryTarget = {
  id: string;
  board_id: string;
  category_key: string;
  value_date: string;
  plan_value: number | null;
  actual_value: number | null;
};


export type Mark = {
  board_id: string;
  category: DmCategory;
  mark_date: string;
  status: "green" | "red";
  note: string | null;
  reason_code_id?: string | null;
};

export type ReasonCode = {
  id: string;
  label: string;
  category_key: string | null;
  color: string;
  sort_order: number;
  archived_at: string | null;
};

export type Escalation = {
  id: string;
  board_id: string;
  category: DmCategory;
  occurred_on: string;
  concern: string;
  cause: string | null;
  countermeasure: string | null;
  owner_id: string | null;
  due_date: string | null;
  status: string;
  escalated: boolean;
  loop_state: DmLoopState;
  recurrence_count: number;
  a3_report_id: string | null;
  standardised_at: string | null;
  metric_def_id: string | null;
  archived_at?: string | null;
};

export type MetricDef = {
  id: string;
  board_id: string;
  key: string;
  label: string;
  unit: string;
  target: number | null;
  red_trigger: number | null;
  direction: "higher_better" | "lower_better";
  active: boolean;
  sort_order: number;
  archived_at?: string | null;
};

export type MetricValue = {
  id: string;
  board_id: string;
  metric_def_id: string;
  value_date: string;
  value: number | null;
  plan_value?: number | null;
  note: string | null;
};

export const LOOP_STATES: { key: DmLoopState; label: string; className: string }[] = [
  { key: "contain", label: "Contain", className: "bg-red-100 text-red-800" },
  { key: "cause", label: "Cause found", className: "bg-amber-100 text-amber-800" },
  { key: "countermeasure", label: "Countermeasure in", className: "bg-sky-100 text-sky-800" },
  { key: "standardised", label: "Standardised", className: "bg-violet-100 text-violet-800" },
  { key: "closed", label: "Closed", className: "bg-emerald-100 text-emerald-800" },
];

/** True when the metric value breaches its red trigger. */
export function isMetricRed(def: MetricDef, value: number | null | undefined): boolean {
  if (value == null || def.red_trigger == null) return false;
  return def.direction === "higher_better" ? value < def.red_trigger : value > def.red_trigger;
}

export function isMetricOnTarget(def: MetricDef, value: number | null | undefined): boolean {
  if (value == null || def.target == null) return false;
  return def.direction === "higher_better" ? value >= def.target : value <= def.target;
}

export function daysBetween(fromIso: string, to = new Date()): number {
  const d = new Date(fromIso + "T00:00:00");
  return Math.max(0, Math.round((to.getTime() - d.getTime()) / 86400000));
}
