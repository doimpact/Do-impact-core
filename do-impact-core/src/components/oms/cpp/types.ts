export type CppVisit = {
  id: string;
  company_id: string;
  aircraft_reg: string;
  aircraft_type: string | null;
  check_type: string | null;
  bay: string | null;
  induction_date: string | null;
  planned_redelivery: string | null;
  total_planned_hours: number;
  status: string;
  notes: string | null;
  archived_at: string | null;
};

export type CppTask = {
  id: string;
  visit_id: string;
  title: string;
  work_area: string | null;
  planned_hours: number;
  earned_hours: number;
  status: string;
  owner_name: string | null;
  predecessor_id: string | null;
  on_critical_path: boolean;
  red_tagged: boolean;
  non_routine_type: string | null;
  reevaluated_at: string | null;
  reevaluation_note: string | null;
  sort_order: number;
};

export type CppPulseCheck = {
  id: string;
  visit_id: string;
  check_at: string;
  window_hours: number;
  planned_hours: number;
  earned_hours: number;
  stopped_over_15min: boolean;
  note: string | null;
};

export type CppBlocker = {
  id: string;
  visit_id: string;
  task_id: string | null;
  blocker_type: string;
  support_function: string;
  description: string | null;
  raised_at: string;
  target_response_minutes: number;
  responded_at: string | null;
  cleared_at: string | null;
};

export type CppHandover = {
  id: string;
  visit_id: string;
  handover_date: string;
  shift_label: string;
  outgoing_lead: string | null;
  incoming_lead: string | null;
  cards_reviewed: string | null;
  blockers_carried: string | null;
  kit_readiness: string;
  kit_note: string | null;
  next_priorities: string | null;
};

export const TASK_STATUSES = [
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Complete" },
];

export const BLOCKER_TYPES = [
  { key: "tool", label: "Tool" },
  { key: "material", label: "Material / kit" },
  { key: "engineering", label: "Engineering query" },
  { key: "other", label: "Other" },
];

export const SUPPORT_FUNCTIONS = [
  { key: "planning", label: "Planning" },
  { key: "engineering", label: "Engineering" },
  { key: "quality", label: "Quality" },
  { key: "materials", label: "Materials" },
];

export const KIT_READINESS = [
  { key: "ready", label: "Fully kitted" },
  { key: "partial", label: "Partially kitted" },
  { key: "not_kitted", label: "Not kitted" },
];

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function daysUntil(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso + "T00:00:00").getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

/** Minutes elapsed since an ISO timestamp. */
export function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function responseState(b: CppBlocker): { label: string; className: string } {
  if (b.cleared_at) return { label: "Cleared", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40" };
  const elapsed = b.responded_at
    ? Math.round((new Date(b.responded_at).getTime() - new Date(b.raised_at).getTime()) / 60000)
    : minutesSince(b.raised_at);
  const pct = b.target_response_minutes > 0 ? elapsed / b.target_response_minutes : 0;
  if (pct > 1) return { label: `${elapsed}m — past target`, className: "bg-red-500/15 text-red-600 border-red-500/40" };
  if (pct > 0.7) return { label: `${elapsed}m — near target`, className: "bg-amber-500/15 text-amber-600 border-amber-500/40" };
  return { label: `${elapsed}m`, className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40" };
}

export type BurnPoint = { label: string; total: number; critical: number; idealTotal: number; idealCritical: number };

/**
 * Builds the dual burn-down series from pulse checks: remaining hours after each
 * check, for the whole aircraft and for the critical path only.
 */
export function buildBurnDown(
  visit: CppVisit,
  tasks: CppTask[],
  checks: CppPulseCheck[],
): { points: BurnPoint[]; verdict: { tone: "good" | "warn" | "bad"; text: string } } {
  const totalPlanned = visit.total_planned_hours || tasks.reduce((s, t) => s + Number(t.planned_hours || 0), 0);
  const cpPlanned = tasks.filter((t) => t.on_critical_path).reduce((s, t) => s + Number(t.planned_hours || 0), 0);
  const cpShare = totalPlanned > 0 ? cpPlanned / totalPlanned : 0;

  const ordered = [...checks].sort((a, b) => a.check_at.localeCompare(b.check_at));
  const steps = ordered.length || 1;
  let earned = 0;
  let cpEarned = 0;
  const cpEarnedActual = tasks.filter((t) => t.on_critical_path).reduce((s, t) => s + Number(t.earned_hours || 0), 0);
  const totalEarnedActual = tasks.reduce((s, t) => s + Number(t.earned_hours || 0), 0);
  const cpRatio = totalEarnedActual > 0 ? cpEarnedActual / totalEarnedActual : cpShare;

  const points: BurnPoint[] = [
    {
      label: "Start",
      total: round(totalPlanned),
      critical: round(cpPlanned),
      idealTotal: round(totalPlanned),
      idealCritical: round(cpPlanned),
    },
  ];

  ordered.forEach((c, i) => {
    earned += Number(c.earned_hours || 0);
    cpEarned += Number(c.earned_hours || 0) * cpRatio;
    points.push({
      label: new Date(c.check_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
      total: round(Math.max(0, totalPlanned - earned)),
      critical: round(Math.max(0, cpPlanned - cpEarned)),
      idealTotal: round(Math.max(0, totalPlanned * (1 - (i + 1) / steps))),
      idealCritical: round(Math.max(0, cpPlanned * (1 - (i + 1) / steps))),
    });
  });

  const verdict = readSlopes(points);
  return { points, verdict };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function readSlopes(points: BurnPoint[]): { tone: "good" | "warn" | "bad"; text: string } {
  if (points.length < 3) {
    return { tone: "warn", text: "Log at least two bay-side pulse checks to read the burn-down trend." };
  }
  const window = points.slice(-3);
  const totalDrop = window[0].total - window[window.length - 1].total;
  const cpDrop = window[0].critical - window[window.length - 1].critical;
  if (cpDrop <= 0.01 && totalDrop > 0.01) {
    return {
      tone: "bad",
      text: "Total backlog is falling but the critical path has flatlined — the redelivery date is slipping. Move labour onto red-tagged critical cards now.",
    };
  }
  if (cpDrop <= 0.01) {
    return { tone: "warn", text: "No critical path hours earned in the last checks. Confirm the bay is working the critical sequence." };
  }
  return { tone: "good", text: "Critical path is burning down alongside total hours — the delivery date is holding." };
}
