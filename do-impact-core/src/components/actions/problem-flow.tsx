import { Badge } from "@/components/ui/badge";
import { ownerLabel, useProfiles } from "@/components/owner-select";
import { ChevronRight, AlertTriangle, Check, ListChecks } from "lucide-react";
import {
  COLUMN_BAR,
  COLUMN_TONE,
  STEP_STATUS_LABEL,
  STEP_STATUS_TONE,
  columnFor,
  type ProblemStep,
  type StepAction,
} from "@/lib/problem-plan";

export function ProblemFlow({
  steps,
  actions,
  activeStepId,
  onSelect,
}: {
  steps: ProblemStep[];
  actions: StepAction[];
  activeStepId: string | null;
  onSelect: (step: ProblemStep) => void;
}) {
  const { data: profiles = [] } = useProfiles();
  const firstOpen = steps.find((s) => s.status !== "done");

  return (
    <div className="flex flex-wrap items-stretch gap-y-4">
      {steps.map((s, i) => {
        const col = columnFor(s.module_id);
        const owner = profiles.find((p) => p.id === s.owner_id);
        const stepActions = actions.filter((a) => a.step_id === s.id);
        const isCurrent = firstOpen?.id === s.id;
        const ahead = firstOpen ? i > steps.findIndex((x) => x.id === firstOpen.id) : false;
        return (
          <div key={s.id} className="flex items-stretch">
            <button
              type="button"
              onClick={() => onSelect(s)}
              className={`w-[230px] rounded-xl border p-3 text-left transition-all hover:shadow-md ${
                activeStepId === s.id ? "border-primary ring-2 ring-primary/30" : "border-border"
              } ${ahead ? "opacity-70" : ""} ${isCurrent ? "shadow-sm ring-1 ring-primary/40" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${col ? COLUMN_BAR[col] : "bg-muted-foreground"}`}>
                    {s.status === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {col && <Badge variant="secondary" className={`${COLUMN_TONE[col]} text-[10px]`}>{col.toUpperCase()}</Badge>}
                </span>
                {s.status === "blocked" && <AlertTriangle className="h-4 w-4 text-red-600" />}
              </div>

              <p className="mt-2 text-sm font-semibold leading-tight">{s.label}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.why}</p>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${col ? COLUMN_BAR[col] : "bg-primary"}`} style={{ width: `${s.progress_pct}%` }} />
              </div>

              <div className="mt-2 flex items-center justify-between gap-1 text-[11px]">
                <span className={`rounded px-1.5 py-0.5 ${STEP_STATUS_TONE[s.status]}`}>{STEP_STATUS_LABEL[s.status]}</span>
                <span className="truncate text-muted-foreground">{ownerLabel(owner)}</span>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{stepActions.length}</span>
                <span>{s.due_date ?? "no date"}</span>
              </div>
            </button>

            {i < steps.length - 1 && (
              <div className="flex w-6 items-center justify-center">
                <ChevronRight className={`h-5 w-5 ${ahead ? "text-muted-foreground/30" : "text-muted-foreground"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
