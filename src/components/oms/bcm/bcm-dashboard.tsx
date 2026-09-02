import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ASSET_KINDS,
  BCM_CYCLE,
  BCM_RULES,
  activationMeta,
  bcmRiskBand,
  isOverdueAction,
  type BcmAction,
  type BcmAsset,
  type BcmExercise,
  type BcmIncident,
  type BcmProcess,
  type BcmRisk,
} from "@/lib/bcm";

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warn" | "bad" | "good";
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "bad" && "text-red-600 dark:text-red-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function BcmDashboard({
  processes,
  risks,
  assets,
  incidents,
  exercises,
  actions,
}: {
  processes: BcmProcess[];
  risks: BcmRisk[];
  assets: BcmAsset[];
  incidents: BcmIncident[];
  exercises: BcmExercise[];
  actions: BcmAction[];
}) {
  const critical = processes.filter((p) => p.criticality === "critical" || p.criticality === "high");
  const biaDone = processes.filter((p) => p.bia_complete).length;
  const biaPct = processes.length ? Math.round((biaDone / processes.length) * 100) : 0;
  const plansDone = processes.filter((p) => p.recovery_plan_complete).length;
  const highRisks = risks.filter((r) => r.risk_score >= 10);
  const openActions = actions.filter((a) => a.status !== "done");
  const overdue = actions.filter(isOverdueAction);
  const openIncidents = incidents.filter((i) => i.status !== "closed");
  const recovered = incidents.filter((i) => i.recovery_hours !== null);
  const avgRecovery = recovered.length
    ? Math.round((recovered.reduce((s, i) => s + (i.recovery_hours ?? 0), 0) / recovered.length) * 10) / 10
    : null;
  const currentLevel = openIncidents.length ? Math.max(...openIncidents.map((i) => i.activation_level)) : 0;
  const levelMeta = activationMeta(currentLevel);

  const noOwner = processes.filter((p) => !p.process_owner?.trim()).length;

  return (
    <div className="space-y-6">
      <div className={cn("flex flex-wrap items-center gap-3 rounded-xl border-l-4 p-4", currentLevel === 0 ? "border-emerald-500 bg-emerald-500/5" : "border-orange-500 bg-orange-500/5")}>
        <Badge className={levelMeta.className}>{levelMeta.label}</Badge>
        <span className="text-sm text-muted-foreground">{levelMeta.hint}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Critical processes" value={String(critical.length)} sub={`${processes.length} processes mapped`} />
        <Stat label="BIA completion" value={`${biaPct}%`} sub={`${biaDone} of ${processes.length} complete`} tone={biaPct < 100 ? "warn" : "good"} />
        <Stat label="Recovery plans documented" value={`${plansDone} / ${processes.length}`} tone={plansDone < processes.length ? "warn" : "good"} />
        <Stat label="Processes without an owner" value={String(noOwner)} tone={noOwner ? "bad" : "good"} />
        <Stat label="High / critical risks" value={String(highRisks.length)} tone={highRisks.length ? "warn" : "good"} />
        <Stat label="Open corrective actions" value={String(openActions.length)} sub={`${overdue.length} overdue`} tone={overdue.length ? "bad" : "default"} />
        <Stat label="Exercises completed" value={String(exercises.length)} tone={exercises.length ? "good" : "warn"} />
        <Stat
          label="Average recovery time"
          value={avgRecovery === null ? "—" : `${avgRecovery} h`}
          sub={`${incidents.length} activation${incidents.length === 1 ? "" : "s"} logged`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ASSET_KINDS.map((k) => {
          const rows = assets.filter((a) => a.asset_kind === k.key);
          const covered = rows.filter((a) => a.has_backup_strategy).length;
          return (
            <div key={k.key} className="rounded-lg border p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold">
                {covered} <span className="text-base font-medium text-muted-foreground">/ {rows.length}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">with a backup strategy</div>
            </div>
          );
        })}
      </div>

      {highRisks.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="text-sm font-semibold">Top risks</div>
          <ul className="mt-2 space-y-1.5">
            {highRisks.slice(0, 6).map((r) => {
              const band = bcmRiskBand(r.risk_score);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge className={band.className}>{r.risk_score}</Badge>
                  <span className="flex-1">{r.risk}</span>
                  <span className="text-xs text-muted-foreground">{r.owner_name || "Unassigned"}</span>
                  {r.due_date && <span className="text-xs text-muted-foreground">{r.due_date}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="text-sm font-semibold">The BCM operating cycle</div>
          <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
            {BCM_CYCLE.map((s, i) => (
              <li key={s}>
                <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span> {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4">
          <div className="text-sm font-semibold">Five non-negotiable rules</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {BCM_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <p className="mt-3 text-sm">
            Protect people → stabilize → continue critical operations → communicate → recover → learn → improve.
          </p>
        </div>
      </div>
    </div>
  );
}
