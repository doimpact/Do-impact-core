/**
 * Rolls the detailed 0–12 week Scheduling (APS) picture up into the monthly
 * SIOP "Capacity & Supply" horizon.
 *
 * Available hours  = theoretical work-center capacity for the days of the
 *                    month that fall inside the 12-week horizon, minus planned
 *                    downtime prorated across the days it spans.
 * Required hours   = work-order hours (setup + run x qty) landing in that
 *                    month, attributed to the routed work center. Operations
 *                    override the work-order level routing when present.
 */

import {
  type ApsDowntime,
  type ApsWorkCenter,
  type ApsWorkOrder,
  startOfToday,
  weeklyCapacityHours,
  workOrderHours,
} from "@/lib/aps";

export type ApsOperationLite = {
  id: string;
  work_order_id: string;
  work_center_id: string | null;
  setup_minutes: number;
  run_minutes: number;
};

export type RolledWorkCenter = {
  work_center_id: string;
  name: string;
  value_stream_id: string;
  monthly_values: Record<string, { available: number; required: number }>;
  available: number;
  required: number;
  gap: number;
  status: "green" | "yellow" | "red";
};

const DAY_MS = 86400000;

export const APS_HORIZON_WEEKS = 12;

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseDate(s: string): Date | null {
  const d = new Date(`${s.slice(0, 10)}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function statusFor(available: number, required: number): "green" | "yellow" | "red" {
  const gap = available - required;
  if (gap >= 0) return "green";
  return Math.abs(gap) / (required || 1) < 0.1 ? "yellow" : "red";
}

/** Month keys covered by the rolling 12-week horizon starting today. */
export function horizonMonthKeys(from: Date = startOfToday(), weeks = APS_HORIZON_WEEKS): string[] {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const keys: string[] = [];
  for (let i = 0; i <= weeks * 7; i++) {
    const k = monthKey(new Date(start.getTime() + i * DAY_MS));
    if (!keys.includes(k)) keys.push(k);
  }
  return keys;
}

export function rollupWorkCenters(input: {
  workCenters: ApsWorkCenter[];
  orders: ApsWorkOrder[];
  operations?: ApsOperationLite[];
  downtime: ApsDowntime[];
  from?: Date;
  weeks?: number;
}): RolledWorkCenter[] {
  const from = input.from ?? startOfToday();
  const weeks = input.weeks ?? APS_HORIZON_WEEKS;
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(start.getTime() + weeks * 7 * DAY_MS);

  const centers = input.workCenters.filter((w) => !w.archived_at);
  const acc = new Map<string, Record<string, { available: number; required: number }>>();
  const bump = (wcId: string, key: string, field: "available" | "required", value: number) => {
    if (!value) return;
    let row = acc.get(wcId);
    if (!row) {
      row = {};
      acc.set(wcId, row);
    }
    const cell = row[key] ?? { available: 0, required: 0 };
    cell[field] += value;
    row[key] = cell;
  };

  // Available: daily capacity for each working day inside the horizon.
  for (const wc of centers) {
    const perWeek = weeklyCapacityHours(wc);
    const perDay = wc.days_per_week > 0 ? perWeek / wc.days_per_week : 0;
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
      const d = new Date(t);
      const dow = d.getUTCDay(); // 0 = Sunday
      const isWorkingDay = wc.days_per_week >= 7 || (dow >= 1 && dow <= Math.min(wc.days_per_week, 6));
      if (!isWorkingDay) continue;
      bump(wc.id, monthKey(d), "available", perDay);
    }
  }

  // Downtime: prorate the logged hours over the days the outage spans.
  const centerIds = new Set(centers.map((c) => c.id));
  for (const dt of input.downtime) {
    if (!centerIds.has(dt.work_center_id)) continue;
    const s = parseDate(dt.start_date);
    const e = parseDate(dt.end_date ?? dt.start_date) ?? s;
    if (!s || !e) continue;
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1);
    const perDay = Number(dt.hours ?? 0) / days;
    if (!perDay) continue;
    for (let i = 0; i < days; i++) {
      const d = new Date(s.getTime() + i * DAY_MS);
      if (d < start || d >= end) continue;
      bump(dt.work_center_id, monthKey(d), "available", -perDay);
    }
  }

  // Required: work-order load, using operations routing when available.
  const opsByOrder = new Map<string, ApsOperationLite[]>();
  for (const op of input.operations ?? []) {
    const list = opsByOrder.get(op.work_order_id) ?? [];
    list.push(op);
    opsByOrder.set(op.work_order_id, list);
  }

  for (const wo of input.orders) {
    if (wo.archived_at || wo.status === "cancelled" || wo.completed_at) continue;
    const d = parseDate(wo.scheduled_start || wo.due_date);
    if (!d || d < start || d >= end) continue;
    const key = monthKey(d);
    const ops = opsByOrder.get(wo.id) ?? [];
    const routed = ops.filter((o) => o.work_center_id && centerIds.has(o.work_center_id));
    if (routed.length) {
      for (const op of routed) {
        const hours = (Number(op.setup_minutes) + Number(op.run_minutes) * (wo.qty || 1)) / 60;
        bump(op.work_center_id!, key, "required", hours);
      }
      continue;
    }
    if (wo.work_center_id && centerIds.has(wo.work_center_id)) {
      bump(wo.work_center_id, key, "required", workOrderHours(wo));
    }
  }

  const round = (n: number) => Math.round(n * 10) / 10;

  return centers
    .map((wc) => {
      const raw = acc.get(wc.id) ?? {};
      const monthly_values: Record<string, { available: number; required: number }> = {};
      let available = 0;
      let required = 0;
      for (const [k, v] of Object.entries(raw)) {
        const a = round(Math.max(0, v.available));
        const r = round(v.required);
        monthly_values[k] = { available: a, required: r };
        available += a;
        required += r;
      }
      available = round(available);
      required = round(required);
      return {
        work_center_id: wc.id,
        name: wc.name,
        value_stream_id: wc.value_stream_id,
        monthly_values,
        available,
        required,
        gap: round(available - required),
        status: statusFor(available, required),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
