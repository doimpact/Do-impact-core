/** Shared definition of a "key" KPI (starred on the KPIs page). */
export function filterKeyKpis<T extends { is_key?: boolean | null }>(kpis: T[]): T[] {
  return kpis.filter((k) => !!k.is_key);
}

export const NO_KEY_KPIS_HINT =
  "No key KPIs pinned yet — star a KPI on the KPIs page to feature it here.";
