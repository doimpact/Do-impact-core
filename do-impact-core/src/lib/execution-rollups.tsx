import { ActionRow, isOverdue, todayISO } from "@/lib/execution-actions";

export type Rollup = { total: number; done: number; open: number; overdue: number; pct: number };

/** Computed completion rollup for a set of actions (done ÷ total). */
export function rollup(rows: ActionRow[], today = todayISO()): Rollup {
  const total = rows.length;
  const done = rows.filter((r) => r.status === "done").length;
  const overdue = rows.filter((r) => isOverdue(r, today)).length;
  return {
    total,
    done,
    open: total - done,
    overdue,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

/** Group rows by a key and roll each group up, sorted by size then name. */
export function groupRollups(
  rows: ActionRow[],
  keyFn: (r: ActionRow) => string,
  today = todayISO(),
): { key: string; rows: ActionRow[]; roll: Rollup }[] {
  const map = new Map<string, ActionRow[]>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return Array.from(map, ([key, v]) => ({ key, rows: v, roll: rollup(v, today) })).sort(
    (a, b) => b.roll.total - a.roll.total || a.key.localeCompare(b.key),
  );
}

/** Small horizontal completion bar. */
export function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={`h-2 rounded bg-muted overflow-hidden ${className}`}>
      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
