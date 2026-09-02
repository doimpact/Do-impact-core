import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Workflow, Search, ArrowRight, AlertTriangle } from "lucide-react";
import { ProblemPlanDialog } from "@/components/actions/problem-plan-dialog";
import { useAllProblemSteps, useCreateProblemPlan, useProblemPlans } from "@/hooks/use-problem-plans";
import { useProfiles, ownerLabel } from "@/components/owner-select";
import { PLAN_STATUS_LABEL, planProgress, COLUMN_TONE, columnFor } from "@/lib/problem-plan";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/flows/")({
  head: () => ({
    meta: [
      { title: "Problem Solver — DO.Impact" },
      { name: "description", content: "Define a problem, choose the sub-processes involved and drive the resulting process flow with owners and progress." },
      { property: "og:title", content: "Problem Solver — DO.Impact" },
      { property: "og:description", content: "Turn a problem statement into a visible, owned process flow across the DO.Impact suite." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProblemSolverList,
});

function ProblemSolverList() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const plansQ = useProblemPlans();
  const stepsQ = useAllProblemSteps();
  const create = useCreateProblemPlan();
  const { data: profiles = [] } = useProfiles();
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const plans = plansQ.data ?? [];
  const steps = stepsQ.data ?? [];
  const filtered = plans.filter((p) =>
    !q.trim() || (p.title + " " + (p.statement ?? "")).toLowerCase().includes(q.toLowerCase().trim()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Workflow className="h-6 w-6" /> Problem Solver</h1>
          <p className="text-sm text-muted-foreground">
            Start with the problem, not the tool. Define the problem, pick the sub-processes involved, then drive the flow.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New problem</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems…" className="pl-9" />
      </div>

      {plansQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Workflow className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No problems defined yet</p>
              <p className="text-sm text-muted-foreground">Define a problem and select which sub-processes should be involved.</p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New problem</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => {
            const mySteps = steps.filter((s) => s.plan_id === p.id);
            const prog = planProgress(mySteps);
            const owner = p.owner_id ? profileMap.get(p.owner_id) : undefined;
            return (
              <Link key={p.id} to="/actions/problem-solver/flows/$id" params={{ id: p.id }} className="block">
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold leading-tight">{p.title}</h2>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.statement}</p>
                      </div>
                      <Badge variant="secondary">{PLAN_STATUS_LABEL[p.status]}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {mySteps.slice(0, 8).map((s) => {
                        const col = columnFor(s.module_id);
                        return (
                          <span key={s.id} className={`rounded px-1.5 py-0.5 text-[10px] ${col ? COLUMN_TONE[col] : "bg-muted"}`}>
                            {s.label}
                          </span>
                        );
                      })}
                      {mySteps.length > 8 && <span className="text-[10px] text-muted-foreground">+{mySteps.length - 8} more</span>}
                    </div>

                    <div className="space-y-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog.pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{prog.done}/{prog.total} steps done · {prog.pct}%</span>
                        <span className="flex items-center gap-2">
                          {prog.blocked > 0 && (
                            <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="h-3 w-3" />{prog.blocked}</span>
                          )}
                          {ownerLabel(owner)}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <ProblemPlanDialog
        open={open}
        onOpenChange={setOpen}
        submitting={create.isPending}
        onSubmit={async (input) => {
          const id = await create.mutateAsync(input);
          setOpen(false);
          navigate({ to: "/actions/problem-solver/flows/$id", params: { id } });
        }}
      />
    </div>
  );
}
