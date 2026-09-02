import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isOverdue, riskBand, typeLabel, type SafetyReport, type SafetyWalk } from "@/lib/safety";

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "danger" | "warn" | "good" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "danger" && "text-destructive",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function SafetyDashboard({ reports, walks }: { reports: SafetyReport[]; walks: SafetyWalk[] }) {
  const m = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = reports.filter((r) => new Date(r.occurred_at) >= monthStart);
    const open = reports.filter((r) => r.status !== "closed");
    const closed = reports.filter((r) => r.status === "closed");
    const closedOnTime = closed.filter((r) => r.due_date && r.closed_at && r.closed_at <= r.due_date).length;
    const closedWithDue = closed.filter((r) => r.due_date && r.closed_at).length;
    const days = closed
      .filter((r) => r.closed_at)
      .map((r) => (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000);

    const repeatMap = new Map<string, number>();
    for (const r of reports) {
      const key = `${r.department || "Unassigned"}|${r.report_type}`;
      repeatMap.set(key, (repeatMap.get(key) ?? 0) + 1);
    }

    return {
      monthReports: thisMonth.length,
      nearMiss: reports.filter((r) => r.report_type === "near_miss").length,
      injuries: reports.filter((r) => r.report_type === "injury").length,
      openHigh: open.filter((r) => r.risk_score >= 10).length,
      overdue: open.filter(isOverdue).length,
      pctOnTime: closedWithDue ? Math.round((closedOnTime / closedWithDue) * 100) : null,
      avgDays: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null,
      walksThisMonth: walks.filter((w) => new Date(w.walk_date + "T00:00:00") >= monthStart).length,
      topRisks: [...open].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5),
      repeats: [...repeatMap.entries()]
        .filter(([, n]) => n > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [reports, walks]);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lagging indicators</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Reports this month" value={m.monthReports} />
          <Stat label="Near misses" value={m.nearMiss} />
          <Stat label="Injuries / illness" value={m.injuries} tone={m.injuries ? "danger" : "good"} />
          <Stat label="Avg days to close" value={m.avgDays ?? "—"} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leading indicators</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Safety walks this month" value={m.walksThisMonth} />
          <Stat label="Open high / critical" value={m.openHigh} tone={m.openHigh ? "danger" : "good"} />
          <Stat label="Overdue actions" value={m.overdue} tone={m.overdue ? "warn" : "good"} />
          <Stat label="% closed on time" value={m.pctOnTime == null ? "—" : `${m.pctOnTime}%`} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3">
          <div className="text-sm font-semibold">Top 5 open risks</div>
          {m.topRisks.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing open. Keep reporting — silence is not the same as safety.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {m.topRisks.map((r) => {
                const band = riskBand(r.risk_score);
                return (
                  <li key={r.id} className="flex items-start gap-2">
                    <Badge className={cn("border-0 shrink-0", band.className)}>{r.risk_score}</Badge>
                    <span className="min-w-0 flex-1 truncate">{r.description}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{r.department || "—"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm font-semibold">Repeat findings</div>
          {m.repeats.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No repeats yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {m.repeats.map(([key, n]) => {
                const [dept, type] = key.split("|");
                return (
                  <li key={key} className="flex items-center justify-between gap-2">
                    <span className="truncate">{dept} — {typeLabel(type ?? "")}</span>
                    <Badge variant="secondary">{n}×</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
