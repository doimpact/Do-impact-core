import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { OwnerSelect, ownerLabel, useProfiles } from "@/components/owner-select";
import { ArrowLeft, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { ProblemFlow } from "@/components/actions/problem-flow";
import { ProblemStepPanel } from "@/components/actions/problem-step-panel";
import {
  useAddSteps,
  useDeletePlan,
  useDeleteStep,
  useProblemPlan,
  useProblemSteps,
  useStepActions,
  useStepActionMutations,
  useUpdatePlan,
  useUpdateStep,
} from "@/hooks/use-problem-plans";
import {
  COLUMN_TONE,
  MODULES_BY_COLUMN,
  PLAN_STATUS_LABEL,
  planProgress,
  type PlanStatus,
  type ProblemStep,
} from "@/lib/problem-plan";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/flows/$id")({
  head: () => ({
    meta: [
      { title: "Problem flow — DO.Impact" },
      { name: "description", content: "Drive a defined problem through its selected sub-processes with owners, status and progress." },
      { property: "og:title", content: "Problem flow — DO.Impact" },
      { property: "og:description", content: "A live process flow with owners and progress for a defined business problem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProblemFlowPage,
});

function ProblemFlowPage() {
  const { id } = Route.useParams();
  const planQ = useProblemPlan(id);
  const stepsQ = useProblemSteps(id);
  const actionsQ = useStepActions(id);
  const updatePlan = useUpdatePlan(id);
  const updateStep = useUpdateStep(id);
  const deleteStep = useDeleteStep(id);
  const addSteps = useAddSteps(id);
  const deletePlan = useDeletePlan();
  const stepActions = useStepActionMutations(id);
  const { data: profiles = [] } = useProfiles();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<string[]>([]);

  const plan = planQ.data;
  const steps = stepsQ.data ?? [];
  const actions = actionsQ.data ?? [];
  const active = steps.find((s) => s.id === activeId) ?? null;
  const prog = planProgress(steps);
  const owner = profiles.find((p) => p.id === plan?.owner_id);
  const existing = new Set(steps.map((s) => s.module_id));

  if (planQ.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!plan) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">This problem no longer exists.</p>
        <Button asChild variant="outline"><Link to="/actions/problem-solver/flows">Back to Problem Solver</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/actions/problem-solver/flows"><ArrowLeft className="mr-1.5 h-4 w-4" /> All problems</Link>
      </Button>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[240px] flex-1">
              <h1 className="text-2xl font-semibold">{plan.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{plan.statement}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={plan.status} onValueChange={(v) => updatePlan.mutate({ status: v as PlanStatus })}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLAN_STATUS_LABEL) as PlanStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{PLAN_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add step</Button>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  if (!(await confirmDialog("Delete this problem and its whole flow?"))) return;
                  await deletePlan.mutateAsync(plan.id);
                  window.history.back();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Overall progress" value={`${prog.pct}%`} />
            <Stat label="Steps complete" value={`${prog.done}/${prog.total}`} />
            <Stat
              label="Blocked"
              value={String(prog.blocked)}
              tone={prog.blocked > 0 ? "text-red-600" : undefined}
              icon={prog.blocked > 0 ? <AlertTriangle className="h-4 w-4" /> : undefined}
            />
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Owner / target</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1"><OwnerSelect value={plan.owner_id} onChange={(v) => updatePlan.mutate({ owner_id: v })} /></div>
              </div>
              <Input
                type="date"
                className="mt-2"
                value={plan.target_date ?? ""}
                onChange={(e) => updatePlan.mutate({ target_date: e.target.value || null })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Led by {ownerLabel(owner)}</p>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog.pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Process flow</h2>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No steps yet — add the sub-processes that should be involved.</p>
        ) : (
          <ProblemFlow steps={steps} actions={actions} activeStepId={activeId} onSelect={(s: ProblemStep) => setActiveId(s.id)} />
        )}
      </div>

      <ProblemStepPanel
        step={active}
        actions={actions.filter((a) => a.step_id === active?.id)}
        onClose={() => setActiveId(null)}
        onPatch={(patch) => active && updateStep.mutate({ id: active.id, patch })}
        onDeleteStep={async () => {
          if (!active) return;
          await deleteStep.mutateAsync(active.id);
          setActiveId(null);
        }}
        onCreateAction={(a) => active && stepActions.create.mutate({ ...a, step_id: active.id })}
        onPatchAction={(actionId, patch) => stepActions.update.mutate({ id: actionId, patch })}
        onDeleteAction={(actionId) => stepActions.remove.mutate(actionId)}
      />

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) setPending([]); }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Add sub-processes to the flow</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODULES_BY_COLUMN.map((col) => (
              <div key={col.key} className="rounded-lg border border-border p-3">
                <Badge variant="secondary" className={COLUMN_TONE[col.key]}>{col.label}</Badge>
                <div className="mt-2 space-y-1.5">
                  {col.modules.map((m) => (
                    <label key={m.id} className={`flex items-start gap-2 text-sm ${existing.has(m.id) ? "opacity-40" : "cursor-pointer"}`}>
                      <Checkbox
                        className="mt-0.5"
                        disabled={existing.has(m.id)}
                        checked={pending.includes(m.id)}
                        onCheckedChange={() =>
                          setPending((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))
                        }
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={pending.length === 0}
              onClick={async () => {
                const base = steps.length;
                await addSteps.mutateAsync(
                  pending.map((moduleId, i) => {
                    const m = MODULES_BY_COLUMN.flatMap((c) => c.modules).find((x) => x.id === moduleId)!;
                    return { module_id: moduleId, label: m.label, why: m.blurb, sort_order: base + i };
                  }),
                );
                setPending([]);
                setAddOpen(false);
              }}
            >
              Add {pending.length || ""} step{pending.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-xl font-semibold ${tone ?? ""}`}>{icon}{value}</p>
    </div>
  );
}
