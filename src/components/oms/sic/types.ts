export type SicShift = {
  id: string;
  company_id: string;
  line_id: string | null;
  line_name: string | null;
  shift_date: string;
  shift_label: string;
  start_time: string;
  interval_minutes: number;
  interval_count: number;
  target_per_interval: number;
  sqdcp: Record<string, { status: "green" | "red"; note?: string }> | null;
  notes: string | null;
  closed_at: string | null;
};

export type SicInterval = {
  id: string;
  shift_id: string;
  seq: number;
  start_at: string;
  end_at: string;
  planned_target: number;
  actual_output: number | null;
  note: string | null;
};

export type SicLossCode = {
  id: string;
  code: string;
  label: string;
  category: string;
  sort_order: number;
  active: boolean;
};

export type SicLossEntry = {
  id: string;
  shift_id: string;
  interval_id: string | null;
  loss_code_id: string | null;
  minutes: number;
  description: string | null;
};

export type SicAction = {
  id: string;
  shift_id: string;
  interval_id: string | null;
  problem: string;
  containment: string | null;
  owner_name: string | null;
  escalation_level: number;
  status: string;
  opened_at: string;
  resolved_at: string | null;
};

export const SQDCP: { key: string; label: string; hint: string }[] = [
  { key: "S", label: "Safety", hint: "Incidents, near-misses, unsafe conditions this shift" },
  { key: "Q", label: "Quality", hint: "Escapes, first-pass defects, concessions" },
  { key: "D", label: "Delivery", hint: "On-time to the hourly plan and to the customer date" },
  { key: "C", label: "Cost", hint: "Overtime, scrap, expedites incurred this shift" },
  { key: "P", label: "People", hint: "Manning, skills coverage, absence" },
];

/** Formats "06:00:00" or "06:00" as "06:00". */
export function hhmm(t: string): string {
  return t.slice(0, 5);
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = hhmm(time).split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * SIC escalation tier from the run of consecutive missed intervals.
 * L1 team leader / L2 value-stream manager / L3 plant leadership.
 */
export function escalationTier(consecutiveMisses: number, lostMinutes: number): 1 | 2 | 3 {
  if (consecutiveMisses >= 3 || lostMinutes >= 60) return 3;
  if (consecutiveMisses >= 2 || lostMinutes >= 30) return 2;
  return 1;
}

export function tierMeta(level: number) {
  if (level >= 3) return { label: "L3 — Plant leadership", className: "bg-red-100 text-red-800 border-red-300" };
  if (level === 2) return { label: "L2 — Value stream manager", className: "bg-amber-100 text-amber-900 border-amber-300" };
  return { label: "L1 — Team leader", className: "bg-sky-100 text-sky-900 border-sky-300" };
}
