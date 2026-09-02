import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { money, type ScRow } from "@/lib/supply-chain";

export function Panel({
  title, hint, children, className,
}: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`space-y-3 rounded-lg border p-4 ${className ?? ""}`}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

const CHART_COLORS = [
  "var(--chart-1, hsl(217 91% 60%))",
  "var(--chart-2, hsl(38 92% 50%))",
  "var(--chart-3, hsl(160 84% 39%))",
  "var(--chart-4, hsl(280 65% 60%))",
  "var(--chart-5, hsl(0 84% 60%))",
  "var(--chart-6, hsl(199 89% 48%))",
];

/* ---------------- Risk heat map ---------------- */

export type RiskPoint = { likelihood: number; impact: number; label: string };

function cellTone(v: number) {
  if (v >= 15) return "bg-red-500/25 text-red-700 dark:text-red-300";
  if (v >= 8) return "bg-amber-500/25 text-amber-700 dark:text-amber-300";
  return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
}

export function RiskHeatMap({
  risks, onSelect,
}: { risks: RiskPoint[]; onSelect?: (band: "high" | "medium" | "low") => void }) {
  const grid = useMemo(() => {
    const m = new Map<string, RiskPoint[]>();
    for (const r of risks) {
      const l = Math.min(5, Math.max(1, Math.round(r.likelihood || 0)));
      const i = Math.min(5, Math.max(1, Math.round(r.impact || 0)));
      const key = `${l}-${i}`;
      m.set(key, [...(m.get(key) ?? []), r]);
    }
    return m;
  }, [risks]);

  if (risks.length === 0) return <Empty>Add risks with a likelihood and impact to build the heat map.</Empty>;

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-center">
        <span className="rotate-180 text-[10px] uppercase tracking-wide text-muted-foreground [writing-mode:vertical-rl]">
          Impact
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1">
          {[5, 4, 3, 2, 1].flatMap((impact) => [
            <div key={`h-${impact}`} className="flex w-5 items-center justify-end pr-1 text-[10px] text-muted-foreground">
              {impact}
            </div>,
            ...[1, 2, 3, 4, 5].map((likelihood) => {
              const items = grid.get(`${likelihood}-${impact}`) ?? [];
              const v = likelihood * impact;
              const band: "high" | "medium" | "low" = v >= 15 ? "high" : v >= 8 ? "medium" : "low";
              return (
                <button
                  key={`${likelihood}-${impact}`}
                  type="button"
                  title={items.length ? items.map((i) => i.label).join("\n") : `Likelihood ${likelihood} × impact ${impact}`}
                  onClick={() => onSelect?.(band)}
                  className={`aspect-square rounded-md text-sm font-semibold tabular-nums transition hover:ring-2 hover:ring-ring ${cellTone(v)} ${items.length ? "" : "opacity-40"}`}
                >
                  {items.length || ""}
                </button>
              );
            }),
          ])}

          <div />
          {[1, 2, 3, 4, 5].map((l) => (
            <div key={`l-${l}`} className="pt-1 text-center text-[10px] text-muted-foreground">{l}</div>
          ))}
        </div>
        <div className="mt-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">Likelihood</div>
      </div>
    </div>
  );
}

/* ---------------- Spend donut ---------------- */

export function SpendDonut({ data }: { data: { label: string; total: number }[] }) {
  if (data.length === 0) return <Empty>No spend recorded yet.</Empty>;
  const total = data.reduce((a, d) => a + d.total, 0);
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="h-52 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="label" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => money(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1 text-xs">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {total ? Math.round((d.total / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Segment mix ---------------- */

export function SegmentMix({ data }: { data: { label: string; count: number; spend: number }[] }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  if (total === 0) return <Empty>Assign suppliers to a segment to see the mix.</Empty>;
  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full">
        {data.map((d, i) => (
          <div
            key={d.label}
            title={`${d.label}: ${d.count}`}
            style={{ width: `${(d.count / total) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
          />
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="tabular-nums">{d.count}</span>
            <span className="tabular-nums text-muted-foreground">{money(d.spend)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Score trend ---------------- */

export function ScoreTrend({ data }: { data: { month: string; score: number }[] }) {
  if (data.length === 0) return <Empty>Score at least one month to see the trend.</Empty>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <ReferenceArea y1={0} y2={60} fill="hsl(0 84% 60%)" fillOpacity={0.06} />
          <ReferenceArea y1={60} y2={75} fill="hsl(38 92% 50%)" fillOpacity={0.08} />
          <ReferenceArea y1={75} y2={100} fill="hsl(160 84% 39%)" fillOpacity={0.08} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => `${v}`} />
          <Line type="monotone" dataKey="score" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Simple horizontal bars ---------------- */

export function BarList({ data, format }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  if (data.length === 0) return <Empty>Nothing to show yet.</Empty>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className="w-36 shrink-0 truncate text-sm">{d.label}</span>
          <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-20 shrink-0 text-right text-xs tabular-nums">{format ? format(d.value) : d.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Escalation status ---------------- */

export function EscalationStrip({ data }: { data: { level: string; open: number; recovering: number; closed: number }[] }) {
  if (data.length === 0) return <Empty>No escalations logged.</Empty>;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="level" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="open" stackId="a" fill="hsl(0 84% 60%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="recovering" stackId="a" fill="hsl(38 92% 50%)" />
          <Bar dataKey="closed" stackId="a" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Category spend vs supplier count ---------------- */

export function CategoryScatter({ data }: { data: { label: string; suppliers: number; spend: number }[] }) {
  if (data.length === 0) return <Empty>Add categories and suppliers to compare concentration.</Empty>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" dataKey="suppliers" name="Suppliers" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="number" dataKey="spend" name="Spend" tick={{ fontSize: 11 }} tickFormatter={(v) => money(v)} width={72} />
          <ZAxis type="number" dataKey="spend" range={[80, 500]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v: number, n: string) => (n === "Spend" ? money(v) : v)}
            labelFormatter={() => ""}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as { label: string; suppliers: number; spend: number } | undefined;
              if (!p) return null;
              return (
                <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
                  <div className="font-medium">{p.label}</div>
                  <div>{p.suppliers} supplier{p.suppliers === 1 ? "" : "s"} · {money(p.spend)}</div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export type { ScRow };
