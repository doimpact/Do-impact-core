/**
 * Guards against silent no-op writes.
 *
 * `supabase.update()/delete()` without `.select()` resolves without error even
 * when zero rows matched. Pair the call with `.select(...)` and run the result
 * through this helper so the user gets a clear message instead of a UI that
 * never changes.
 *
 * Open-source edition: no telemetry, no funnel tracking — a blocked write is
 * only surfaced to the operator.
 */
export function assertWrote<T>(rows: T[] | null | undefined, action = "update"): T[] {
  if (!rows || rows.length === 0) {
    throw new Error(
      `Nothing was changed — this workspace is read-only or you don't have permission to ${action} this record.`,
    );
  }
  return rows;
}
