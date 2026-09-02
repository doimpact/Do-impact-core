// Shared types & helpers for the Problem Solver module under /actions.
import { COLUMNS, MODULES, MODULE_BY_ID, PROBLEMS, type ColumnKey, type MatrixModule } from "@/lib/problem-matrix";

export type StepStatus = "not_started" | "in_progress" | "blocked" | "done";
export type PlanStatus = "draft" | "active" | "on_hold" | "complete";

export type ProblemPlan = {
  id: string;
  title: string;
  statement: string | null;
  source_problem_id: string | null;
  owner_id: string | null;
  status: PlanStatus;
  target_date: string | null;
  created_at: string;
};

export type ProblemStep = {
  id: string;
  plan_id: string;
  module_id: string;
  label: string;
  why: string | null;
  owner_id: string | null;
  status: StepStatus;
  progress_pct: number;
  due_date: string | null;
  notes: string | null;
  sort_order: number;
};

export type StepAction = {
  id: string;
  step_id: string;
  plan_id: string;
  title: string;
  owner_id: string | null;
  due_date: string | null;
  status: StepStatus;
};

export const STEP_STATUSES: StepStatus[] = ["not_started", "in_progress", "blocked", "done"];

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const STEP_STATUS_TONE: Record<StepStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  blocked: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
};

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "Draft",
  active: "Active",
  on_hold: "On hold",
  complete: "Complete",
};

export function nextStatus(s: StepStatus): StepStatus {
  const i = STEP_STATUSES.indexOf(s);
  return STEP_STATUSES[(i + 1) % STEP_STATUSES.length];
}

/** Default % for a status when the user has not set one explicitly. */
export function defaultPctFor(s: StepStatus): number {
  return s === "done" ? 100 : s === "in_progress" ? 50 : 0;
}

export function planProgress(steps: ProblemStep[]) {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const blocked = steps.filter((s) => s.status === "blocked").length;
  const pct = total === 0 ? 0 : Math.round(steps.reduce((a, s) => a + (s.progress_pct ?? 0), 0) / total);
  return { total, done, blocked, pct };
}

export function moduleFor(id: string): MatrixModule | undefined {
  return MODULE_BY_ID[id];
}

export function columnFor(id: string): ColumnKey | null {
  return MODULE_BY_ID[id]?.column ?? null;
}

export const COLUMN_LABEL: Record<ColumnKey, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.key, c.label]),
) as Record<ColumnKey, string>;

export const COLUMN_TONE: Record<ColumnKey, string> = {
  strategy: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  commercial: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  oms: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  people: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  reporting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200",
};

export const COLUMN_BAR: Record<ColumnKey, string> = {
  strategy: "bg-violet-500",
  commercial: "bg-emerald-500",
  oms: "bg-amber-500",
  people: "bg-sky-500",
  reporting: "bg-indigo-500",
};

export const MODULES_BY_COLUMN: { key: ColumnKey; label: string; modules: MatrixModule[] }[] = COLUMNS.map((c) => ({
  key: c.key,
  label: c.label,
  modules: MODULES.filter((m) => m.column === c.key),
}));

export { PROBLEMS, MODULES };
