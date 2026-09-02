// Pure math helpers for Value Stream Map — no side effects.

export type VsmState = "current" | "future";

export type VsmStep = {
  id: string;
  position: number;
  name: string;
  cycle_time_sec: number | null;
  changeover_sec: number | null;
  uptime_pct: number | null;
  operators: number | null;
  shifts: number | null;
  working_time_per_shift_min: number | null;
  first_pass_yield_pct: number | null;
  batch_size: number | null;
  scrap_pct: number | null;
  notes: string | null;
  state: VsmState;
};

export type VsmInventory = {
  id: string;
  after_step_position: number;
  quantity: number | null;
  notes: string | null;
  state: VsmState;
};

export type VsmMap = {
  id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  product_family: string | null;
  customer: string | null;
  demand_per_period: number | null;
  period_label: string | null;
  available_time_sec: number | null;
  shifts: number | null;
  working_time_per_shift_min: number | null;
  notes: string | null;
  sort_order: number;
  archived_at: string | null;
};

/** Available time per period (seconds): prefer shifts × minutes/shift when set. */
export function availableTimeSec(map: Pick<VsmMap, "available_time_sec" | "shifts" | "working_time_per_shift_min">): number | null {
  if (map.shifts && map.working_time_per_shift_min) return map.shifts * map.working_time_per_shift_min * 60;
  return map.available_time_sec ?? null;
}

export function taktSeconds(map: Pick<VsmMap, "available_time_sec" | "demand_per_period" | "shifts" | "working_time_per_shift_min">): number | null {
  const avail = availableTimeSec(map);
  if (!avail || !map.demand_per_period) return null;
  return avail / map.demand_per_period;
}

export function valueAddedSeconds(steps: VsmStep[]): number {
  return steps.reduce((s, x) => s + (x.cycle_time_sec ?? 0), 0);
}

/**
 * Lead time in seconds =
 *   Σ cycle_time
 * + Σ (inventory_qty / demand_per_period) × available_time_sec
 */
export function leadTimeSeconds(
  steps: VsmStep[],
  inv: VsmInventory[],
  map: Pick<VsmMap, "demand_per_period" | "available_time_sec" | "shifts" | "working_time_per_shift_min">,
): number {
  const va = valueAddedSeconds(steps);
  const avail = availableTimeSec(map);
  if (!map.demand_per_period || !avail) return va;
  const invSec = inv.reduce(
    (s, i) => s + ((i.quantity ?? 0) / map.demand_per_period!) * avail,
    0,
  );
  return va + invSec;
}

export function processCycleEfficiency(
  steps: VsmStep[],
  inv: VsmInventory[],
  map: Pick<VsmMap, "demand_per_period" | "available_time_sec" | "shifts" | "working_time_per_shift_min">,
): number | null {
  const lt = leadTimeSeconds(steps, inv, map);
  if (lt <= 0) return null;
  return valueAddedSeconds(steps) / lt;
}

/** Rolled throughput yield: prefer explicit FPY; fall back to (1 - scrap%). */
export function rolledThroughputYield(steps: VsmStep[]): number {
  return steps.reduce((y, s) => {
    const fpy = s.first_pass_yield_pct != null ? s.first_pass_yield_pct / 100 : 1 - (s.scrap_pct ?? 0) / 100;
    return y * Math.max(0, Math.min(1, fpy));
  }, 1);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !isFinite(seconds)) return "—";
  const s = Math.max(0, seconds);
  if (s < 60) return `${s.toFixed(0)}s`;
  if (s < 3600) return `${(s / 60).toFixed(1)}m`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}

export function formatPct(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}
