import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, CheckCircle2, ListTodo, Ban } from "lucide-react";
import {
  ActionRow,
  ActionModule,
  MODULE_HEX,
  addDaysISO,
  daysBetween,
  isOverdue,
  todayISO,
} from "@/lib/execution-actions";
import { ProgressBar, groupRollups, rollup } from "@/lib/execution-rollups";

export function OverviewTab({
  scoped,
  all,
  onDrill,
  onSelect,
}: {
  /** rows after module/owner/search filters, ignoring status + date range */
  scoped: ActionRow[];
  /** rows after all filters (used for the top-owner table) */
  all: ActionRow[];
  onDrill: (preset: "overdue" | "week" | "blocked" | "open" | "done") => void;
  onSelect: (r: ActionRow) => void;
}) {
  const today = todayISO();
  const in7 = addDaysISO(today, 7);

  const kpis = useMemo(() => {
    const open = scoped.filter((r) => r.status !== "done");
    return {
      total: open.length,
      overdue: open.filter((r) => isOverdue(r, today)).length,
      week: open.filter((r) => r.due_date && r.due_date >= today && r.due_date <= in7).length,
      blocked: open.filter((r) => r.status === "blocked").length,
      done30: scoped.filter((r) => r.done_date && daysBetween(r.done_date, today) <= 30 && r.done_date <= today).length,
    };
  }, [scoped, today, in7]);

  const overall = useMemo(() => rollup(scoped, today), [scoped, today]);
  const byModuleRoll = useMemo(() => groupRollups(scoped, (r) => r.module, today), [scoped, today]);
  const byOwnerRoll = useMemo(
    () => groupRollups(scoped, (r) => r.owner_name ?? "Unassigned", today).slice(0, 8),
    [scoped, today],
  );
  const byParentRoll = useMemo(
    () => groupRollups(scoped, (r) => r.parent ?? "No parent", today).slice(0, 8),
    [scoped, today],
  );

  // 12-week completed vs created trend
  const trend = useMemo(() => {
    const weeks: { label: string; start: string; end: string; done: number; due: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = addDaysISO(today, -i * 7);
      const start = addDaysISO(end, -6);
      weeks.push({ label: end.slice(5), start, end, done: 0, due: 0 });
    }
    for (const r of scoped) {
      for (const w of weeks) {
        if (r.done_date && r.done_date >= w.start && r.done_date <= w.end) w.done++;
        if (r.due_date && r.due_date >= w.start && r.due_date <= w.end) w.due++;
      }
    }
    return weeks;
  }, [scoped, today]);
  const trendMax = Math.max(1, ...trend.map((w) => Math.max(w.done, w.due)));

  // ageing of overdue
  const ageing = useMemo(() => {
    const buckets = [
      { label: "1–7d", min: 1, max: 7, n: 0 },
      { label: "8–30d", min: 8, max: 30, n: 0 },
      { label: "31–60d", min: 31, max: 60, n: 0 },
      { label: "61–90d", min: 61, max: 90, n: 0 },
      { label: "90d+", min: 91, max: 99999, n: 0 },
    ];
    for (const r of scoped) {
      if (!isOverdue(r, today)) continue;
      const d = daysBetween(r.due_date!, today);
      const b = buckets.find((x) => d >= x.min && d <= x.max);
      if (b) b.n++;
    }
    return buckets;
  }, [scoped, today]);
  const ageMax = Math.max(1, ...ageing.map((b) => b.n));

  const byModule = useMemo(() => {
    const map = new Map<ActionModule, { open: number; overdue: number }>();
    for (const r of scoped) {
      if (r.status === "done") continue;
      if (!map.has(r.module)) map.set(r.module, { open: 0, overdue: 0 });
      const m = map.get(r.module)!;
      m.open++;
      if (isOverdue(r, today)) m.overdue++;
    }
    return Array.from(map, ([module, v]) => ({ module, ...v })).sort((a, b) => b.open - a.open);
  }, [scoped, today]);
  const modMax = Math.max(1, ...byModule.map((m) => m.open));

  const riskOwners = useMemo(() => {
    const map = new Map<string, { name: string; overdue: number; open: number }>();
    for (const r of scoped) {
      if (r.status === "done") continue;
      const key = r.owner_id ?? "none";
      if (!map.has(key)) map.set(key, { name: r.owner_name ?? "Unassigned", overdue: 0, open: 0 });
      const o = map.get(key)!;
      o.open++;
      if (isOverdue(r, today)) o.overdue++;
    }
    return Array.from(map.values()).sort((a, b) => b.overdue - a.overdue || b.open - a.open).slice(0, 6);
  }, [scoped, today]);

  const nextUp = useMemo(
    () =>
      all
        .filter((r) => r.status !== "done" && r.due_date)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
        .slice(0, 8),
    [all],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Kpi icon={ListTodo} label="Open actions" value={kpis.total} onClick={() => onDrill("open")} />
        <Kpi icon={AlertTriangle} label="Overdue" value={kpis.overdue} tone="text-red-600" onClick={() => onDrill("overdue")} />
        <Kpi icon={CalendarClock} label="Due in 7 days" value={kpis.week} tone="text-amber-600" onClick={() => onDrill("week")} />
        <Kpi icon={Ban} label="Blocked" value={kpis.blocked} tone="text-red-600" onClick={() => onDrill("blocked")} />
        <Kpi icon={CheckCircle2} label="Closed (30d)" value={kpis.done30} tone="text-emerald-600" onClick={() => onDrill("done")} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Progress rollup</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-4">
          <div className="flex items-center gap-4">
            <Ring pct={overall.pct} />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div className="text-sm font-semibold text-foreground">{overall.done} of {overall.total} done</div>
              <div>{overall.open} still open</div>
              {overall.overdue > 0 && <div className="text-red-600">{overall.overdue} overdue</div>}
            </div>
          </div>
          <RollList title="By module" items={byModuleRoll} />
          <RollList title="By owner" items={byOwnerRoll} />
          <RollList title="By parent" items={byParentRoll} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Completion trend — last 12 weeks</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {trend.map((w) => (
                <div key={w.end} className="flex-1 flex flex-col items-center gap-1" title={`Week ending ${w.end}\nCompleted: ${w.done}\nDue: ${w.due}`}>
                  <div className="w-full flex items-end justify-center gap-0.5 h-32">
                    <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${(w.done / trendMax) * 100}%` }} />
                    <div className="w-1/2 rounded-t bg-muted-foreground/30" style={{ height: `${(w.due / trendMax) * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{w.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-emerald-500" /> Completed</span>
              <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-muted-foreground/30" /> Due</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overdue ageing</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ageing.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="w-14 text-xs text-muted-foreground shrink-0">{b.label}</span>
                <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(b.n / ageMax) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-xs tabular-nums">{b.n}</span>
              </div>
            ))}
            {ageing.every((b) => b.n === 0) && <p className="text-xs text-muted-foreground">Nothing overdue — good.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open by module</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {byModule.map((m) => (
              <div key={m.module} className="flex items-center gap-2">
                <span className="w-28 text-xs truncate shrink-0">{m.module}</span>
                <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
                  <div className="h-full" style={{ width: `${(m.open / modMax) * 100}%`, backgroundColor: MODULE_HEX[m.module] }} />
                </div>
                <span className="w-14 text-right text-[11px] tabular-nums text-muted-foreground">
                  {m.open}{m.overdue > 0 && <span className="text-red-600"> / {m.overdue}</span>}
                </span>
              </div>
            ))}
            {byModule.length === 0 && <p className="text-xs text-muted-foreground">No open actions.</p>}
            <p className="text-[10px] text-muted-foreground pt-1">open / overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Owners at risk</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {riskOwners.map((o) => (
              <div key={o.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{o.name}</span>
                <span className="text-xs tabular-nums">
                  <span className={o.overdue > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>{o.overdue}</span>
                  <span className="text-muted-foreground"> / {o.open}</span>
                </span>
              </div>
            ))}
            {riskOwners.length === 0 && <p className="text-xs text-muted-foreground">No open actions.</p>}
            <p className="text-[10px] text-muted-foreground pt-1">overdue / open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Next up</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {nextUp.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r)}
                className="w-full text-left flex items-center justify-between gap-2 text-sm hover:bg-muted/50 rounded px-1 py-0.5"
              >
                <span className="truncate">{r.title || "(untitled)"}</span>
                <span className={`text-[11px] shrink-0 tabular-nums ${isOverdue(r, today) ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{r.due_date}</span>
              </button>
            ))}
            {nextUp.length === 0 && <p className="text-xs text-muted-foreground">Nothing scheduled.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="hover:border-primary/50 transition-colors h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Icon className={`h-3.5 w-3.5 ${tone ?? ""}`} /> {label}
          </div>
          <div className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>{value}</div>
        </CardContent>
      </Card>
    </button>
  );
}

function Ring({ pct }: { pct: number }) {
  return (
    <div
      className="relative h-20 w-20 rounded-full shrink-0"
      style={{ background: `conic-gradient(hsl(var(--primary)) ${pct * 3.6}deg, hsl(var(--muted)) 0deg)` }}
    >
      <div className="absolute inset-[10px] rounded-full bg-background flex items-center justify-center text-sm font-semibold tabular-nums">
        {pct}%
      </div>
    </div>
  );
}

function RollList({
  title,
  items,
}: {
  title: string;
  items: { key: string; roll: { pct: number; done: number; total: number; overdue: number } }[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-2">
          <span className="w-24 text-[11px] truncate shrink-0" title={it.key}>{it.key}</span>
          <ProgressBar pct={it.roll.pct} className="flex-1" />
          <span className="w-16 text-right text-[10px] tabular-nums text-muted-foreground">
            {it.roll.pct}% · {it.roll.done}/{it.roll.total}
          </span>
        </div>
      ))}
      {items.length === 0 && <p className="text-[11px] text-muted-foreground">No actions.</p>}
    </div>
  );
}
