import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  EQUIP_CRITICALITY,
  mttr,
  pmCompliance,
  tagMeta,
  workMix,
  type AmpmAbnormality,
  type AmpmAction,
  type AmpmAmCheck,
  type AmpmBreakdown,
  type AmpmEquipment,
  type AmpmPmTask,
  type AmpmSpare,
  type AmpmWorkOrder,
} from "@/lib/ampm";

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-semibold",
            tone === "good" && "text-emerald-600",
            tone === "warn" && "text-amber-600",
            tone === "bad" && "text-destructive",
          )}
        >
          {value}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function AmpmDashboard({
  equipment,
  checks,
  abnormalities,
  tasks,
  orders,
  breakdowns,
  spares,
  actions,
}: {
  equipment: AmpmEquipment[];
  checks: AmpmAmCheck[];
  abnormalities: AmpmAbnormality[];
  tasks: AmpmPmTask[];
  orders: AmpmWorkOrder[];
  breakdowns: AmpmBreakdown[];
  spares: AmpmSpare[];
  actions: AmpmAction[];
}) {
  const compliance = pmCompliance(tasks);
  const mix = workMix(orders);
  const repair = mttr(breakdowns);
  const downtime = breakdowns.reduce((n, b) => n + (b.downtime_hours ?? 0), 0);
  const openTags = abnormalities.filter((a) => a.status !== "closed" && a.status !== "verified");
  const redTags = openTags.filter((a) => a.tag_colour === "red");
  const belowMin = spares.filter((s) => (s.current_quantity ?? 0) < (s.min_quantity ?? 0));
  const openActions = actions.filter((a) => a.status !== "done");
  const overdueActions = openActions.filter((a) => a.due_date && new Date(a.due_date) < new Date());
  const criticalNoOwner = equipment.filter((e) => e.criticality === "A" && !e.maintenance_owner);
  const chronic = breakdowns.filter((b) => b.repeat_failure || b.classification === "chronic");

  const last30 = checks.filter((c) => new Date(c.check_date) >= new Date(Date.now() - 30 * 864e5));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="PM compliance"
          value={`${compliance.pct}%`}
          hint={`${compliance.overdue} overdue of ${compliance.due} scheduled`}
          tone={compliance.pct >= 90 ? "good" : compliance.pct >= 75 ? "warn" : "bad"}
        />
        <Kpi
          label="Planned vs emergency"
          value={`${mix.plannedPct}% planned`}
          hint={`${mix.emergencyPct}% emergency of ${mix.totalHours.toFixed(0)} labour hours`}
          tone={mix.plannedPct >= 80 ? "good" : mix.plannedPct >= 60 ? "warn" : "bad"}
        />
        <Kpi
          label="Open tags"
          value={String(openTags.length)}
          hint={`${redTags.length} red — immediate attention`}
          tone={redTags.length === 0 ? "good" : "bad"}
        />
        <Kpi
          label="Breakdown downtime"
          value={`${downtime.toFixed(1)} h`}
          hint={`${breakdowns.length} failures · MTTR ${repair ? `${repair.toFixed(1)} h` : "—"}`}
          tone={breakdowns.length === 0 ? "good" : "warn"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Equipment by criticality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {EQUIP_CRITICALITY.map((c) => {
              const n = equipment.filter((e) => e.criticality === c.key).length;
              return (
                <div key={c.key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Badge className={c.className}>{c.key}</Badge>
                    <span className="text-muted-foreground">{c.label.split(" — ")[1]}</span>
                  </span>
                  <span className="font-medium">{n}</span>
                </div>
              );
            })}
            {criticalNoOwner.length > 0 && (
              <p className="pt-1 text-xs text-destructive">
                {criticalNoOwner.length} critical asset(s) have no maintenance owner.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Autonomous maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Operator checks (30 days)</span>
              <span className="font-medium">{last30.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Checks with abnormality</span>
              <span className="font-medium">{last30.filter((c) => c.abnormality_found).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assets at AM level 3+</span>
              <span className="font-medium">
                {equipment.filter((e) => (e.am_level ?? 1) >= 3).length}/{equipment.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {(["red", "yellow", "green"] as const).map((k) => {
                const t = tagMeta(k);
                const n = openTags.filter((a) => a.tag_colour === k).length;
                return (
                  <Badge key={k} className={t.className}>
                    {t.label} {n}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risks needing attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chronic / repeat failures</span>
              <span className={cn("font-medium", chronic.length > 0 && "text-destructive")}>{chronic.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Spares below minimum</span>
              <span className={cn("font-medium", belowMin.length > 0 && "text-destructive")}>{belowMin.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Open actions</span>
              <span className="font-medium">{openActions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overdue actions</span>
              <span className={cn("font-medium", overdueActions.length > 0 && "text-destructive")}>
                {overdueActions.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">The loop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {["CLEAN", "INSPECT", "DETECT", "PLAN", "MAINTAIN", "VERIFY", "IMPROVE"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-md bg-muted px-2.5 py-1">{s}</span>
                {i < 6 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Operators own basic care and early detection (AM). Maintenance owns planned technical maintenance and
            reliability (PM). Engineering eliminates chronic problems and improves the equipment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
