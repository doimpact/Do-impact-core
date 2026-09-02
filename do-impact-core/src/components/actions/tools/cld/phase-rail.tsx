import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLD_PHASES, phaseProgress, type CldPhases, type PhaseKey } from "@/lib/problem-tools";

export function PhaseRail({
  phases,
  ctx,
  active,
  lockedP4,
  onSelect,
}: {
  phases: CldPhases;
  ctx: { nodes: number; links: number };
  active: PhaseKey;
  lockedP4: boolean;
  onSelect: (k: PhaseKey) => void;
}) {
  const overall = Math.round(
    CLD_PHASES.reduce((sum, d) => sum + phaseProgress(d, phases, ctx).pct, 0) / CLD_PHASES.length,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">Overall progress</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overall}%` }} />
        </div>
        <span className="text-xs font-semibold tabular-nums">{overall}%</span>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {CLD_PHASES.map((d) => {
          const pr = phaseProgress(d, phases, ctx);
          const locked = d.key === "p4" && lockedP4;
          const status = phases.meta?.[d.key]?.status ?? "not_started";
          const isActive = active === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => !locked && onSelect(d.key)}
              disabled={locked}
              title={locked ? "Golden Rule: complete Phase 2 (mapping) before designing interventions." : d.intent}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                locked && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    pr.pct === 100
                      ? "bg-emerald-600 text-white"
                      : status === "in_progress" || pr.pct > 0
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {locked ? <Lock className="h-3 w-3" /> : pr.pct === 100 ? <Check className="h-3.5 w-3.5" /> : d.index}
                </span>
                <span className="text-xs font-semibold leading-tight">{d.name}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{d.timeline}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", pr.pct === 100 ? "bg-emerald-600" : "bg-primary")}
                  style={{ width: `${pr.pct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                {pr.done}/{pr.total} artifacts · {pr.pct}%
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PhaseChecklist({
  phases,
  ctx,
  phaseKey,
}: {
  phases: CldPhases;
  ctx: { nodes: number; links: number };
  phaseKey: PhaseKey;
}) {
  const def = CLD_PHASES.find((p) => p.key === phaseKey)!;
  return (
    <div className="space-y-1.5 rounded-lg border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">Required artifacts</p>
      {def.checklist.map((c) => {
        const ok = c.done(phases, ctx);
        return (
          <div key={c.key} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                ok ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40",
              )}
            >
              {ok && <Check className="h-3 w-3" />}
            </span>
            <span className={ok ? "text-muted-foreground line-through" : ""}>{c.label}</span>
          </div>
        );
      })}
    </div>
  );
}
