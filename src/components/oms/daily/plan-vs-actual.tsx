import { useMemo, useState } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import type { Category, CategoryTarget, Mark } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function PlanVsActual({
  anchor, days, boardId, categories, targets, marks, onSetValue, onSetUnit,
}: {
  anchor: Date;
  days: number[];
  boardId: string;
  categories: Category[];
  targets: CategoryTarget[];
  marks: Mark[];
  onSetValue: (v: { boardId: string; categoryKey: string; valueDate: string; planValue?: number | null; actualValue?: number | null }) => void;
  onSetUnit?: (categoryId: string, unit: string) => void;
}) {
  const preferred = useMemo(
    () => categories.find(c => /deliver/i.test(`${c.label} ${c.key}`)) ?? categories[0],
    [categories],
  );
  const [catKey, setCatKey] = useState<string | null>(null);
  const cat = categories.find(c => c.key === catKey) ?? preferred;

  const byDate = useMemo(() => {
    const m = new Map<string, CategoryTarget>();
    for (const t of targets) {
      if (t.board_id === boardId && cat && t.category_key === cat.key) m.set(t.value_date, t);
    }
    return m;
  }, [targets, boardId, cat]);

  const redSet = useMemo(() => new Set(
    marks.filter(m => m.board_id === boardId && m.status === "red" && cat && m.category === cat.key).map(m => m.mark_date),
  ), [marks, boardId, cat]);

  const today = isoDay(new Date());

  const rows = useMemo(() => {
    let cumPlan = 0;
    let cumActual = 0;
    return days.map(d => {
      const date = isoDay(new Date(anchor.getFullYear(), anchor.getMonth(), d));
      const row = byDate.get(date);
      const plan = row?.plan_value ?? null;
      const actual = row?.actual_value ?? null;
      cumPlan += plan ?? 0;
      const hasActual = actual != null;
      if (hasActual) cumActual += actual;
      return {
        day: d,
        date,
        plan,
        actual,
        cumPlan: cumPlan || null,
        cumActual: date <= today && (hasActual || cumActual > 0) ? cumActual : null,
        behind: plan != null && actual != null && actual < plan,
        red: redSet.has(date),
      };
    });
  }, [days, anchor, byDate, redSet, today]);

  const mtd = useMemo(() => {
    const upto = rows.filter(r => r.date <= today);
    const plan = upto.reduce((s, r) => s + (r.plan ?? 0), 0);
    const actual = upto.reduce((s, r) => s + (r.actual ?? 0), 0);
    return { plan, actual, gap: actual - plan, pct: plan ? Math.round((actual / plan) * 100) : null };
  }, [rows, today]);

  if (!cat) {
    return (
      <div className="rounded-lg border bg-card p-3 mb-3 text-xs text-muted-foreground">
        Add a category to track plan vs actual.
      </div>
    );
  }

  const unit = cat.unit || "";

  return (
    <div className="rounded-lg border bg-card p-3 mb-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-sm font-semibold">Plan vs actual — {cat.label}</h3>
          <p className="text-[11px] text-muted-foreground">
            Month to date: {mtd.actual.toLocaleString()} {unit} actual vs {mtd.plan.toLocaleString()} {unit} plan
            {" · "}
            <span className={mtd.gap < 0 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
              {mtd.gap >= 0 ? "+" : ""}{mtd.gap.toLocaleString()} {unit}
            </span>
            {mtd.pct == null ? "" : ` · ${mtd.pct}% attainment`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded border bg-background px-2 text-xs"
            value={cat.key}
            onChange={(e) => setCatKey(e.target.value)}
          >
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {onSetUnit && (
            <Input
              className="h-8 w-24 text-xs"
              placeholder="Unit"
              defaultValue={cat.unit ?? ""}
              key={`unit-${cat.id}-${cat.unit ?? ""}`}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next === (cat.unit ?? "")) return;
                onSetUnit(cat.id, next);
              }}
            />
          )}
        </div>
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={rows.length > 20 ? 1 : 0} />
            <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {rows.filter(r => r.red).map(r => (
              <ReferenceLine key={r.date} yAxisId="l" x={r.day} stroke="var(--destructive)" strokeOpacity={0.35} strokeWidth={6} />
            ))}
            <Bar yAxisId="l" dataKey="plan" name="Plan" fill="var(--muted-foreground)" fillOpacity={0.35} radius={[3, 3, 0, 0]} />
            <Bar yAxisId="l" dataKey="actual" name="Actual" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="cumPlan" name="Cumulative plan" stroke="var(--muted-foreground)" strokeDasharray="4 4" dot={false} />
            <Line yAxisId="r" type="monotone" dataKey="cumActual" name="Cumulative actual" stroke="var(--primary)" strokeWidth={2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="text-[11px] border-collapse">
          <thead>
            <tr className="bg-muted/40">
              <th className="sticky left-0 bg-muted/40 text-left px-2 py-1 font-medium min-w-[80px]">Day</th>
              {rows.map(r => (
                <th key={r.day} className={`px-1 py-1 font-normal text-center border-l ${r.red ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                  {r.day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["plan", "actual"] as const).map(kind => (
              <tr key={kind} className="border-b">
                <td className="sticky left-0 bg-card px-2 py-1 font-medium capitalize">{kind}</td>
                {rows.map(r => (
                  <td key={r.day} className="p-0.5 border-l">
                    <Input
                      className={`h-6 w-11 px-1 text-center text-[11px] tabular-nums ${kind === "actual" && r.behind ? "text-red-600" : ""}`}
                      inputMode="decimal"
                      defaultValue={(kind === "plan" ? r.plan : r.actual) ?? ""}
                      key={`${cat.key}-${kind}-${r.date}-${(kind === "plan" ? r.plan : r.actual) ?? ""}`}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const next = raw === "" ? null : Number(raw);
                        if (raw !== "" && Number.isNaN(next)) return;
                        const cur = kind === "plan" ? r.plan : r.actual;
                        if ((cur ?? null) === (next ?? null)) return;
                        onSetValue({
                          boardId,
                          categoryKey: cat.key,
                          valueDate: r.date,
                          ...(kind === "plan" ? { planValue: next } : { actualValue: next }),
                        });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Red bands mark days where the {cat.label} row on this board is red.
      </p>
    </div>
  );
}
