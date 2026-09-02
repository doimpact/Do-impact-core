import { useMemo, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

type Theme = { id: string; title: string; color: string | null };
type Objective = { id: string; title: string; theme_id: string | null; horizon_year: number; owner_id: string | null; archived_at?: string | null };
type Benefit = { objective_id: string; year: number; month: number; value: number; actual?: number | null };

const UNASSIGNED_COLOR = "#9ca3af";
const money = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
const compact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export function ValueDelivered({
  objectives,
  themes,
  benefits,
  startYear,
}: {
  objectives: Objective[];
  themes: Theme[];
  benefits: Benefit[];
  startYear: number;
}) {
  const [groupBy, setGroupBy] = useState<"theme" | "year">("theme");
  const [scope, setScope] = useState<"all" | 1 | 2 | 3>("all");

  const activeObjectives = objectives.filter((o) => !o.archived_at);
  const objMap = useMemo(() => new Map(activeObjectives.map((o) => [o.id, o])), [activeObjectives]);

  const scoped = benefits.filter((b) => {
    const o = objMap.get(b.objective_id);
    if (!o) return false;
    if (scope !== "all" && o.horizon_year !== scope) return false;
    return true;
  });

  // Build 36 month buckets
  const monthly = useMemo(() => {
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 0; i < 36; i++) {
      const y = startYear + Math.floor(i / 12);
      const m = (i % 12) + 1;
      const row: Record<string, number | string> = { label: new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }), _y: y, _m: m, __plan: 0 };
      rows.push(row);
    }
    for (const b of scoped) {
      const idx = (Number(b.year) - startYear) * 12 + (Number(b.month) - 1);
      if (!Number.isFinite(idx) || idx < 0 || idx >= 36 || !rows[idx]) continue;
      const o = objMap.get(b.objective_id);
      if (!o) continue;
      const key = groupBy === "theme"
        ? (themes.find((t) => t.id === o.theme_id)?.id ?? "__none")
        : `y${o.horizon_year}`;
      rows[idx][key] = (Number(rows[idx][key] ?? 0)) + Number(b.actual || 0);
      rows[idx].__plan = (Number(rows[idx].__plan ?? 0)) + Number(b.value || 0);
    }
    return rows;
  }, [scoped, objMap, themes, groupBy, startYear]);

  const seriesKeys = groupBy === "theme"
    ? [...themes.map((t) => ({ key: t.id, label: t.title, color: t.color ?? UNASSIGNED_COLOR })), { key: "__none", label: "Unassigned", color: UNASSIGNED_COLOR }]
    : ([1, 2, 3] as const).map((y) => ({ key: `y${y}`, label: `Year ${y} (${startYear + y - 1})`, color: ["#6366f1", "#0ea5e9", "#14b8a6"][y - 1] }));

  const total = scoped.reduce((s, b) => s + Number(b.actual || 0), 0);
  const totalPlan = scoped.reduce((s, b) => s + Number(b.value || 0), 0);
  const byYear = ([1, 2, 3] as const).map((y) => ({
    year: y,
    label: startYear + y - 1,
    total: scoped.filter((b) => {
      const o = objMap.get(b.objective_id);
      return o?.horizon_year === y;
    }).reduce((s, b) => s + Number(b.actual || 0), 0),
  }));

  // Per-objective totals sorted desc
  const perObjective = useMemo(() => {
    const totals = new Map<string, number>();
    for (const b of scoped) totals.set(b.objective_id, (totals.get(b.objective_id) ?? 0) + Number(b.actual || 0));
    return activeObjectives
      .filter((o) => (scope === "all" ? true : o.horizon_year === scope))
      .map((o) => ({
        obj: o,
        theme: themes.find((t) => t.id === o.theme_id) ?? null,
        total: totals.get(o.id) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [scoped, activeObjectives, themes, scope]);

  const maxObj = perObjective[0]?.total ?? 0;

  return (
    <section className="rounded-xl border bg-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" /> Value delivered — 3-year roadmap
          </h2>
          <p className="text-xs text-muted-foreground">Realized monthly benefits from objectives, aggregated across the horizon.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex overflow-hidden rounded-md border">
            {(["all", 1, 2, 3] as const).map((s) => (
              <button key={String(s)} onClick={() => setScope(s)}
                className={`px-2.5 py-1 ${scope === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {s === "all" ? "All years" : `Y${s}`}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-md border">
            {(["theme", "year"] as const).map((g) => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-2.5 py-1 ${groupBy === g ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                By {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Actual {scope !== "all" ? `(Y${scope})` : ""} <span className="text-muted-foreground/70">/ Plan {money(totalPlan)}</span></div>
          <div className="mt-1 text-2xl font-bold">{money(total)}</div>
        </div>
        {byYear.map((y, i) => (
          <div key={y.year} className="rounded-lg border p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Year {y.year} · {y.label}</div>
            <div className="mt-1 text-xl font-semibold" style={{ color: ["#6366f1", "#0ea5e9", "#14b8a6"][i] }}>{money(y.total)}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthly} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} width={56} tickFormatter={compact} />
            <Tooltip
              formatter={(v: number, name: string) => [money(Number(v)), name]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {seriesKeys.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={`${s.label} (actual)`} stackId="v" fill={s.color} />
            ))}
            <Line type="monotone" dataKey="__plan" name="Plan" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 2.5, fill: "#f59e0b" }} activeDot={{ r: 4 }} isAnimationActive={false} />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Per-objective breakdown */}
      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">By objective</div>
        {perObjective.length === 0 ? (
          <div className="rounded border border-dashed p-4 text-center text-xs text-muted-foreground">
            No benefit values entered yet. Open an objective and click the <b>$</b> icon to enter monthly values.
          </div>
        ) : (
          <div className="space-y-1.5">
            {perObjective.map(({ obj, theme, total: t }) => {
              const pct = maxObj > 0 ? (t / maxObj) * 100 : 0;
              const color = theme?.color ?? UNASSIGNED_COLOR;
              return (
                <div key={obj.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />
                      <span className="truncate font-medium">{obj.title}</span>
                      <span className="shrink-0 text-[10px] uppercase text-muted-foreground">Y{obj.horizon_year}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums">{money(t)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
