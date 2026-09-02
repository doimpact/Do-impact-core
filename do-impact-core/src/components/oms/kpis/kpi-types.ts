export type KpiRow = {
  id: string;
  name: string;
  unit: string | null;
  target: number | null;
  higher_is_better: boolean;
  description: string | null;
  frequency: string;
  is_key?: boolean;
  owner_id?: string | null;
  amber_threshold?: number | null;
  green_threshold?: number | null;
  code?: string | null;
  library_key?: string | null;
  category?: string | null;
  hierarchy_level?: number | null;
  indicator_type?: string | null;
  formula?: string | null;
  purpose?: string | null;
  data_source?: string | null;
  scope?: string | null;
  exclusions?: string | null;
  reporting_level?: string | null;
  pillars: { id: string; key: string; name: string; variant: string | null; sort_order: number } | null;
  kpi_values: { id: string; period_start: string; actual: number | null; target: number | null }[];
};

export type GroupBy = "pillar" | "category" | "level" | "indicator" | "owner";

export type KpiFilters = {
  q: string;
  category: string;
  level: string;
  indicator: string;
  pillar: string;
  owner: string;
  frequency: string;
  status: string;
};

export const EMPTY_FILTERS: KpiFilters = {
  q: "",
  category: "all",
  level: "all",
  indicator: "all",
  pillar: "all",
  owner: "all",
  frequency: "all",
  status: "all",
};

export function statusFor(k: KpiRow, year: number): "on" | "off" | "none" {
  const rows = k.kpi_values.filter(
    (v) => new Date(v.period_start).getUTCFullYear() === year && v.actual != null,
  );
  if (rows.length === 0) return "none";
  const latest = [...rows].sort((a, b) => b.period_start.localeCompare(a.period_start))[0];
  const target = latest.target ?? k.target;
  if (target == null || latest.actual == null) return "none";
  const meets = k.higher_is_better ? latest.actual >= target : latest.actual <= target;
  return meets ? "on" : "off";
}
