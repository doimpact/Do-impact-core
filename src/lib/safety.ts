// Site safety programme — shared types, vocabulary and risk maths.

export type SafetyStatus = "open" | "in_progress" | "verifying" | "closed";

export type SafetyReport = {
  id: string;
  ref: string | null;
  source: string;
  walk_id: string | null;
  report_type: string;
  occurred_at: string;
  location: string | null;
  department: string | null;
  reporter_name: string | null;
  anonymous: boolean;
  description: string;
  immediate_action: string | null;
  potential_consequence: string | null;
  photo_path: string | null;
  severity: number;
  likelihood: number;
  risk_score: number;
  immediate_control: string | null;
  permanent_action: string | null;
  control_level: string | null;
  owner_id: string | null;
  due_date: string | null;
  status: SafetyStatus;
  verified_by: string | null;
  effectiveness: string | null;
  closed_at: string | null;
  created_at: string;
};

export type SafetyWalk = {
  id: string;
  walk_type: string;
  walk_date: string;
  area: string | null;
  department: string | null;
  led_by: string | null;
  participants: string | null;
  good_practices: string | null;
  notes: string | null;
  created_at: string;
};

export const REPORT_TYPES: { key: string; label: string }[] = [
  { key: "unsafe_condition", label: "Unsafe condition" },
  { key: "unsafe_behaviour", label: "Unsafe behaviour" },
  { key: "near_miss", label: "Near miss" },
  { key: "injury", label: "Injury / illness" },
  { key: "environmental", label: "Environmental concern" },
  { key: "equipment", label: "Equipment safety issue" },
  { key: "fire_life_safety", label: "Fire / life-safety issue" },
  { key: "ergonomic", label: "Ergonomic concern" },
  { key: "chemical", label: "Chemical exposure concern" },
  { key: "suggestion", label: "Safety improvement suggestion" },
];

export const SOURCES: { key: string; label: string }[] = [
  { key: "report", label: "Employee report" },
  { key: "safety_walk", label: "Safety walk" },
  { key: "incident", label: "Incident investigation" },
  { key: "audit", label: "Audit / inspection" },
];

export const CONTROL_LEVELS: { key: string; label: string; hint: string }[] = [
  { key: "elimination", label: "1 · Elimination", hint: "Remove the hazard entirely." },
  { key: "substitution", label: "2 · Substitution", hint: "Replace with something less hazardous." },
  { key: "engineering", label: "3 · Engineering", hint: "Guards, interlocks, ventilation, barriers." },
  { key: "administrative", label: "4 · Administrative", hint: "Procedures, training, scheduling, signage." },
  { key: "ppe", label: "5 · PPE", hint: "Last line of defence only." },
];

export const STATUSES: { key: SafetyStatus; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "verifying", label: "Verifying" },
  { key: "closed", label: "Closed" },
];

export const WALK_TYPES: { key: string; label: string; hint: string }[] = [
  { key: "daily", label: "Daily supervisor walk", hint: "5–15 min — immediate hazards, guarding, PPE, housekeeping." },
  { key: "weekly", label: "Weekly department walk", hint: "30–60 min — conditions, practices, previous actions, near misses." },
  { key: "monthly", label: "Monthly leadership walk", hint: "Cross-functional — look for system weaknesses, not blame." },
];

export const SEVERITY_SCALE = [
  { n: 1, label: "Minor injury / negligible impact" },
  { n: 2, label: "First-aid level injury" },
  { n: 3, label: "Recordable injury / significant damage" },
  { n: 4, label: "Serious injury / permanent disability potential" },
  { n: 5, label: "Fatality / catastrophic event potential" },
];

export const LIKELIHOOD_SCALE = [
  { n: 1, label: "Rare" },
  { n: 2, label: "Unlikely" },
  { n: 3, label: "Possible" },
  { n: 4, label: "Likely" },
  { n: 5, label: "Almost certain" },
];

export type RiskBand = { key: "low" | "moderate" | "high" | "critical"; label: string; className: string; action: string };

export function riskBand(score: number): RiskBand {
  if (score >= 17)
    return {
      key: "critical",
      label: "Critical",
      className: "bg-red-600 text-white",
      action: "Stop or restrict work until the risk is adequately controlled.",
    };
  if (score >= 10)
    return {
      key: "high",
      label: "High",
      className: "bg-orange-500 text-white",
      action: "Prompt corrective action and management attention.",
    };
  if (score >= 5)
    return {
      key: "moderate",
      label: "Moderate",
      className: "bg-amber-400 text-amber-950",
      action: "Correct within a defined timeframe.",
    };
  return { key: "low", label: "Low", className: "bg-emerald-500 text-white", action: "Manage through normal controls." };
}

export function typeLabel(key: string) {
  return REPORT_TYPES.find((t) => t.key === key)?.label ?? key;
}

export function sourceLabel(key: string) {
  return SOURCES.find((s) => s.key === key)?.label ?? key;
}

export function statusLabel(key: string) {
  return STATUSES.find((s) => s.key === key)?.label ?? key;
}

export function isOverdue(r: SafetyReport) {
  return r.status !== "closed" && !!r.due_date && r.due_date < new Date().toISOString().slice(0, 10);
}

/** Framework rule: no closure without an owner, a due date and a recorded verification. */
export function closureBlockers(r: {
  owner_id: string | null;
  due_date: string | null;
  verified_by: string | null;
}): string[] {
  const out: string[] = [];
  if (!r.owner_id) out.push("an accountable owner");
  if (!r.due_date) out.push("a due date");
  if (!r.verified_by?.trim()) out.push("a recorded verification of effectiveness");
  return out;
}
