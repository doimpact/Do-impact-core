import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2, ArrowUpRight } from "lucide-react";
import { IBP_GAP_KINDS, IBP_STEPS } from "@/lib/problem-tools";
import { STEP_STATUSES, STEP_STATUS_LABEL, STEP_STATUS_TONE, type StepStatus } from "@/lib/problem-plan";
import { useIbpGapMut, useIbpGaps, useIbpStepMut, useIbpSteps, type IbpCycle } from "@/hooks/use-problem-tools";

export function IbpCycleBoard({
  cycle,
  onPatch,
}: {
  cycle: IbpCycle;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const stepQ = useIbpSteps(cycle.id);
  const gapQ = useIbpGaps(cycle.id);
  const step = useIbpStepMut(cycle.id);
  const gap = useIbpGapMut(cycle.id);

  const steps = stepQ.data ?? [];
  const gaps = gapQ.data ?? [];
  const byKey = new Map(steps.map((s) => [s.step_key, s]));

  const seed = () =>
    IBP_STEPS.forEach((s, i) =>
      step.create.mutate({ cycle_id: cycle.id, step_key: s.key, sort_order: i }),
    );

  return (
    <div className="space-y-4">
      <Card><CardContent className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Cycle month</p>
            <Input type="month" defaultValue={(cycle.cycle_month ?? "").slice(0, 7)} onBlur={(e) => onPatch({ cycle_month: e.target.value ? `${e.target.value}-01` : null })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Rolling horizon (months)</p>
            <Input type="number" defaultValue={cycle.horizon_months} onBlur={(e) => onPatch({ horizon_months: Number(e.target.value) || 24 })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Process owner</p>
            <OwnerSelect value={cycle.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
          </div>
          <div className="flex items-end">
            <Button asChild variant="outline" className="w-full">
              <Link to="/oms/siop">Open SIOP data <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        <Textarea rows={2} placeholder="Cycle notes — what makes this month's plan different?" defaultValue={cycle.notes ?? ""} onBlur={(e) => onPatch({ notes: e.target.value || null })} />
        <p className="text-xs text-muted-foreground">
          IBP is SIOP lifted to a {cycle.horizon_months}-month, financially reconciled cadence. Volumes and capacity live in the SIOP module;
          this board runs the five-meeting cycle and holds the decisions.
        </p>
      </CardContent></Card>

      <Card><CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">The five-meeting cycle</h2>
          {steps.length === 0 && <Button size="sm" onClick={seed}>Load cycle template</Button>}
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          {IBP_STEPS.map((def, i) => {
            const s = byKey.get(def.key);
            return (
              <div key={def.key} className="flex flex-col rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                  <p className="text-sm font-medium leading-tight">{def.name}</p>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{def.hint}</p>
                {s ? (
                  <div className="mt-3 space-y-2">
                    <Select value={s.status} onValueChange={(v) => step.update.mutate({ id: s.id, patch: { status: v } })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STEP_STATUSES.map((st) => <SelectItem key={st} value={st}>{STEP_STATUS_LABEL[st as StepStatus]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <OwnerSelect value={s.owner_id} onChange={(v) => step.update.mutate({ id: s.id, patch: { owner_id: v } })} />
                    <Input type="date" className="h-8" defaultValue={s.meeting_date ?? ""} onBlur={(e) => step.update.mutate({ id: s.id, patch: { meeting_date: e.target.value || null } })} />
                    <Textarea rows={3} placeholder="Decisions" defaultValue={s.decisions ?? ""} onBlur={(e) => step.update.mutate({ id: s.id, patch: { decisions: e.target.value || null } })} />
                    <Textarea rows={2} placeholder="Assumptions & risks" defaultValue={s.assumptions ?? ""} onBlur={(e) => step.update.mutate({ id: s.id, patch: { assumptions: e.target.value || null } })} />
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => step.create.mutate({ cycle_id: cycle.id, step_key: def.key, sort_order: i })}>Add</Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent></Card>

      <Card><CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Gaps, long-lead items & decisions</h2>
          <Button size="sm" variant="outline" onClick={() => gap.create.mutate({ cycle_id: cycle.id, kind: "gap", label: "New gap", sort_order: gaps.length })}>
            <Plus className="mr-1.5 h-4 w-4" /> Add row
          </Button>
        </div>
        {gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Log the gaps the cycle exposes — a titanium forging with a 40-week lead time has to be committed long before the order lands.
          </p>
        ) : (
          <div className="space-y-2">
            {gaps.map((g) => {
              const delta = (g.supply_val ?? 0) - (g.demand_val ?? 0);
              return (
                <div key={g.id} className="space-y-2 rounded-lg border border-border p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={g.kind} onValueChange={(v) => gap.update.mutate({ id: g.id, patch: { kind: v } })}>
                      <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {IBP_GAP_KINDS.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="h-8 min-w-[180px] flex-1" defaultValue={g.label} onBlur={(e) => gap.update.mutate({ id: g.id, patch: { label: e.target.value } })} />
                    <Input type="month" className="h-8 w-[140px]" defaultValue={(g.month ?? "").slice(0, 7)} onBlur={(e) => gap.update.mutate({ id: g.id, patch: { month: e.target.value ? `${e.target.value}-01` : null } })} />
                    <Badge variant="secondary" className={STEP_STATUS_TONE[g.status]}>{STEP_STATUS_LABEL[g.status]}</Badge>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => gap.remove.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <NumCell label="Demand" v={g.demand_val} on={(v) => gap.update.mutate({ id: g.id, patch: { demand_val: v } })} />
                    <NumCell label="Supply" v={g.supply_val} on={(v) => gap.update.mutate({ id: g.id, patch: { supply_val: v } })} />
                    <NumCell label="Financial impact" v={g.financial_val} on={(v) => gap.update.mutate({ id: g.id, patch: { financial_val: v } })} />
                    <NumCell label="Lead time (wks)" v={g.lead_time_weeks} on={(v) => gap.update.mutate({ id: g.id, patch: { lead_time_weeks: v } })} />
                    <div className="rounded-lg border border-border p-2">
                      <p className="text-[11px] text-muted-foreground">Balance</p>
                      <p className={`text-sm font-semibold ${delta < 0 ? "text-red-600" : "text-emerald-600"}`}>{delta > 0 ? "+" : ""}{delta}</p>
                    </div>
                    <div className="space-y-1">
                      <OwnerSelect value={g.owner_id} onChange={(v) => gap.update.mutate({ id: g.id, patch: { owner_id: v } })} />
                      <Select value={g.status} onValueChange={(v) => gap.update.mutate({ id: g.id, patch: { status: v } })}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STEP_STATUSES.map((st) => <SelectItem key={st} value={st}>{STEP_STATUS_LABEL[st as StepStatus]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea rows={2} placeholder="Risk / decision taken" defaultValue={g.notes ?? ""} onBlur={(e) => gap.update.mutate({ id: g.id, patch: { notes: e.target.value || null } })} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

function NumCell({ label, v, on }: { label: string; v: number | null; on: (v: number | null) => void }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Input type="number" className="mt-1 h-8" defaultValue={v ?? ""} onBlur={(e) => on(e.target.value === "" ? null : Number(e.target.value))} />
    </div>
  );
}
