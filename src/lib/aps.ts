/**
 * 0–12 week shop floor scheduling (APS) — shared types and scheduling logic.
 *
 * Horizon zones are derived from a work order's scheduled start date, never
 * stored, so the plan re-zones itself as time rolls forward.
 */

export type ApsValueStream = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  owner_id: string | null;
  sort_order: number;
  archived_at: string | null;
};

export type ApsWorkCenter = {
  id: string;
  value_stream_id: string;
  name: string;
  code: string | null;
  capacity_hours_per_shift: number;
  shifts_per_day: number;
  days_per_week: number;
  efficiency_pct: number;
  staging_slots: number;
  notes: string | null;
  archived_at: string | null;
  sort_order: number;
};

export type ApsTooling = {
  id: string;
  value_stream_id: string | null;
  name: string;
  code: string | null;
  qty_available: number;
  status: string;
  notes: string | null;
  archived_at: string | null;
};

export type ApsWorkOrder = {
  id: string;
  value_stream_id: string;
  work_center_id: string | null;
  wo_number: string;
  part_number: string;
  description: string | null;
  qty: number;
  due_date: string;
  scheduled_start: string;
  setup_minutes: number;
  run_minutes_per_unit: number;
  family: string | null;
  required_skill: string | null;
  tooling_id: string | null;
  priority: number;
  expedite: boolean;
  status: string;
  sequence: number;
  source: string | null;
  kit_ready: boolean;
  released_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
};

export type ApsComponent = {
  id: string;
  work_order_id: string;
  part_number: string;
  description: string | null;
  qty_required: number;
  qty_on_hand: number;
  qty_allocated: number;
  lot_serial: string | null;
  inbound_po: string | null;
  inbound_date: string | null;
  long_lead: boolean;
};

export type ApsScenario = {
  id: string;
  value_stream_id: string;
  name: string;
  notes: string | null;
  status: string;
  archived_at: string | null;
};

export type ApsScenarioChange = {
  id: string;
  scenario_id: string;
  work_order_id: string | null;
  work_center_id: string | null;
  change_type: string;
  payload: Record<string, unknown>;
  note: string | null;
  created_at: string;
};

export type ApsDowntime = {
  id: string;
  work_center_id: string;
  start_date: string;
  end_date: string;
  hours: number | null;
  planned: boolean;
  reason: string | null;
};

export type Zone = "frozen" | "firm" | "flexible" | "outside";

export const ZONES: { key: Exclude<Zone, "outside">; label: string; weeks: string; logic: string; flexibility: string; accent: string }[] = [
  {
    key: "frozen",
    label: "Frozen",
    weeks: "0–2 weeks",
    logic: "Dynamic dispatching — hourly/daily execution and real-time sequencing.",
    flexibility: "Locked. Changes need a supervisor override with a logged reason.",
    accent: "border-sky-500/60 bg-sky-500/5",
  },
  {
    key: "firm",
    label: "Firm",
    weeks: "2–4 weeks",
    logic: "Finite capacity scheduling — releases, tooling, labour and kitting.",
    flexibility: "Restricted. Re-sequencing allowed, volume locked.",
    accent: "border-amber-500/60 bg-amber-500/5",
  },
  {
    key: "flexible",
    label: "Flexible",
    weeks: "4–12 weeks",
    logic: "S&OE alignment and pegging — levelling and shortage detection.",
    flexibility: "High. Dynamic levelling against updated demand and supply.",
    accent: "border-emerald-500/60 bg-emerald-500/5",
  },
];

const DAY_MS = 86400000;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekOffset(dateStr: string, from: Date = startOfToday()): number {
  const d = new Date(`${dateStr}T00:00:00`);
  return Math.floor((d.getTime() - from.getTime()) / (7 * DAY_MS));
}

export function zoneFor(dateStr: string, from: Date = startOfToday()): Zone {
  const w = weekOffset(dateStr, from);
  if (w < 2) return "frozen";
  if (w < 4) return "firm";
  if (w < 12) return "flexible";
  return "outside";
}

export function addDays(base: Date, days: number): string {
  const d = new Date(base.getTime() + days * DAY_MS);
  return d.toISOString().slice(0, 10);
}

export function workOrderHours(wo: Pick<ApsWorkOrder, "setup_minutes" | "run_minutes_per_unit" | "qty">): number {
  return (wo.setup_minutes + wo.run_minutes_per_unit * wo.qty) / 60;
}

export function weeklyCapacityHours(wc: ApsWorkCenter): number {
  return wc.capacity_hours_per_shift * wc.shifts_per_day * wc.days_per_week * (wc.efficiency_pct / 100);
}

export type PriorityRule = "edd" | "spt" | "cr";

export const PRIORITY_RULES: { key: PriorityRule; label: string; hint: string }[] = [
  { key: "edd", label: "Earliest Due Date", hint: "Sequence by promise date" },
  { key: "spt", label: "Shortest Processing Time", hint: "Flush short jobs to cut queue" },
  { key: "cr", label: "Critical Ratio", hint: "Time remaining ÷ work remaining" },
];

export function criticalRatio(wo: ApsWorkOrder, from: Date = startOfToday()): number {
  const daysLeft = (new Date(`${wo.due_date}T00:00:00`).getTime() - from.getTime()) / DAY_MS;
  const workDays = Math.max(workOrderHours(wo) / 8, 0.1);
  return daysLeft / workDays;
}

/** Order a queue by rule, keeping expedites first and optionally grouping setup families. */
export function sequenceOrders(
  orders: ApsWorkOrder[],
  rule: PriorityRule,
  familyGrouping: boolean,
  from: Date = startOfToday(),
): ApsWorkOrder[] {
  const score = (wo: ApsWorkOrder) => {
    if (rule === "spt") return workOrderHours(wo);
    if (rule === "cr") return criticalRatio(wo, from);
    return new Date(`${wo.due_date}T00:00:00`).getTime();
  };
  const base = [...orders].sort((a, b) => {
    if (a.expedite !== b.expedite) return a.expedite ? -1 : 1;
    return score(a) - score(b);
  });
  if (!familyGrouping) return base;

  // Cluster like setups while preserving the priority order of first appearance.
  const seen: string[] = [];
  const buckets = new Map<string, ApsWorkOrder[]>();
  for (const wo of base) {
    const key = wo.family ?? "—";
    if (!buckets.has(key)) {
      buckets.set(key, []);
      seen.push(key);
    }
    buckets.get(key)!.push(wo);
  }
  return seen.flatMap((k) => buckets.get(k)!);
}

export type KitStatus = { ready: boolean; short: ApsComponent[]; longLead: ApsComponent[] };

export function kitStatus(components: ApsComponent[]): KitStatus {
  const short = components.filter((c) => c.qty_on_hand - c.qty_allocated < c.qty_required);
  return {
    ready: components.length > 0 && short.length === 0,
    short,
    longLead: short.filter((c) => c.long_lead),
  };
}

export type ApsMetrics = {
  scheduleAdherence: number | null;
  otd: number | null;
  queueRatio: number | null;
  setupToRun: number | null;
  lateRisk: number;
};

export function computeMetrics(
  orders: ApsWorkOrder[],
  operations: { status: string; completed_on_time: boolean | null; queue_minutes: number; run_minutes: number; setup_minutes: number }[],
  from: Date = startOfToday(),
): ApsMetrics {
  const doneOps = operations.filter((o) => o.status === "done");
  const onSeq = doneOps.filter((o) => o.completed_on_time === true).length;
  const completed = orders.filter((o) => o.completed_at);
  const onTime = completed.filter((o) => new Date(o.completed_at!) <= new Date(`${o.due_date}T23:59:59`)).length;
  const queue = operations.reduce((s, o) => s + o.queue_minutes, 0);
  const run = operations.reduce((s, o) => s + o.run_minutes, 0);
  const setup = operations.reduce((s, o) => s + o.setup_minutes, 0);
  const openOrders = orders.filter((o) => !o.completed_at);
  const lateRisk = openOrders.filter(
    (o) => new Date(`${o.due_date}T00:00:00`).getTime() < from.getTime() + workOrderHours(o) / 8 * DAY_MS,
  ).length;

  return {
    scheduleAdherence: doneOps.length ? (onSeq / doneOps.length) * 100 : null,
    otd: completed.length ? (onTime / completed.length) * 100 : null,
    queueRatio: run + queue > 0 ? (queue / (run + queue)) * 100 : null,
    setupToRun: run > 0 ? (setup / run) * 100 : null,
    lateRisk,
  };
}
