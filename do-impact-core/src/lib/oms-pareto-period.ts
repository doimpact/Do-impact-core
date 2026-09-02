export type ParetoPeriod =
  | "month"
  | "14d"
  | "30d"
  | "90d"
  | "6m"
  | "12m"
  | "ytd";

export const PARETO_PERIODS: { value: ParetoPeriod; label: string }[] = [
  { value: "month", label: "Current month" },
  { value: "14d", label: "Last 2 weeks" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "ytd", label: "Year to date" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Range for the Why-red Pareto.
 * `anchor` is the month currently shown in the grid; `today` anchors rolling windows.
 */
export function paretoRange(period: ParetoPeriod, anchor: Date, today: Date): { from: string; to: string } {
  if (period === "month") {
    return {
      from: iso(new Date(anchor.getFullYear(), anchor.getMonth(), 1)),
      to: iso(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
    };
  }
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  switch (period) {
    case "14d": start.setDate(end.getDate() - 13); break;
    case "30d": start.setDate(end.getDate() - 29); break;
    case "90d": start.setDate(end.getDate() - 89); break;
    case "6m": start.setMonth(end.getMonth() - 6); start.setDate(start.getDate() + 1); break;
    case "12m": start.setMonth(end.getMonth() - 12); start.setDate(start.getDate() + 1); break;
    case "ytd": start.setMonth(0); start.setDate(1); break;
  }
  return { from: iso(start), to: iso(end) };
}

export function formatRangeLabel(from: string, to: string) {
  const f = new Date(`${from}T00:00:00`);
  const t = new Date(`${to}T00:00:00`);
  const sameYear = f.getFullYear() === t.getFullYear();
  const left = f.toLocaleDateString("en-US", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  const right = t.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  return `${left} – ${right}`;
}
