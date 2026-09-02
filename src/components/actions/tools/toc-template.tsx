import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import { Plus, Target, Trash2 } from "lucide-react";
import {
  POLICY_CONSTRAINT_CHECKS,
  TOC_STEPS,
  tocProgress,
} from "@/lib/problem-tools";
import { STEP_STATUS_LABEL, STEP_STATUS_TONE, STEP_STATUSES, type StepStatus } from "@/lib/problem-plan";
import {
  useTocCandidateMut,
  useTocCandidates,
  useTocStepMut,
  useTocSteps,
  type TocAnalysis,
} from "@/hooks/use-problem-tools";

export function TocTemplate({
  analysis,
  onPatch,
}: {
  analysis: TocAnalysis;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const candQ = useTocCandidates(analysis.id);
  const stepQ = useTocSteps(analysis.id);
  const cand = useTocCandidateMut(analysis.id);
  const step = useTocStepMut(analysis.id);

  const candidates = candQ.data ?? [];
  const steps = stepQ.data ?? [];
  const prog = tocProgress(steps);
  const policies = analysis.policy_constraints ?? [];

  const seed = () =>
    TOC_STEPS.forEach((s, i) =>
      step.create.mutate({
        analysis_id: analysis.id,
        step: s.step,
        title: s.title,
        description: s.hint,
        sort_order: i,
      }),
    );

  return (
    <div className="space-y-4">
      {/* Throughput accounting */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <Field label="System / value stream in scope">
              <Textarea
                rows={2}
                defaultValue={analysis.system_scope ?? ""}
                onBlur={(e) => onPatch({ system_scope: e.target.value || null })}
                placeholder="Where does this system start and end? e.g. PO receipt → machining → NDT → despatch"
              />
            </Field>
            <Field label="Current constraint">
              <Input
                defaultValue={analysis.constraint_name ?? ""}
                onBlur={(e) => onPatch({ constraint_name: e.target.value || null })}
                placeholder="e.g. 5-axis cell #2"
              />
              <div className="mt-2"><OwnerSelect value={analysis.owner_id} onChange={(v) => onPatch({ owner_id: v })} /></div>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Num label="Throughput" value={analysis.throughput} onSave={(v) => onPatch({ throughput: v })} />
            <Num label="Inventory / WIP" value={analysis.inventory} onSave={(v) => onPatch({ inventory: v })} />
            <Num label="Operating expense" value={analysis.operating_expense} onSave={(v) => onPatch({ operating_expense: v })} />
            <Num label="C2C baseline (days)" value={analysis.c2c_baseline} onSave={(v) => onPatch({ c2c_baseline: v })} />
            <Num label="C2C current (days)" value={analysis.c2c_current} onSave={(v) => onPatch({ c2c_current: v })} />
            <Num label="C2C target (days)" value={analysis.c2c_target} onSave={(v) => onPatch({ c2c_target: v })} />
          </div>

          <C2cBar a={analysis} />
        </CardContent>
      </Card>

      {/* Candidate constraints */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4" /> Step 1 — candidate constraints</h2>
            <Button size="sm" variant="outline" onClick={() => cand.create.mutate({ analysis_id: analysis.id, name: "New resource", sort_order: candidates.length })}>
              <Plus className="mr-1.5 h-4 w-4" /> Add resource
            </Button>
          </div>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">List the resources competing to be the bottleneck, then mark the one that actually is.</p>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                  <Input className="w-[200px]" defaultValue={c.name} onBlur={(e) => cand.update.mutate({ id: c.id, patch: { name: e.target.value } })} />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-[90px]"
                      defaultValue={c.load_pct ?? ""}
                      placeholder="load %"
                      onBlur={(e) => cand.update.mutate({ id: c.id, patch: { load_pct: e.target.value === "" ? null : Number(e.target.value) } })}
                    />
                    <span className="text-xs text-muted-foreground">% load</span>
                  </div>
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${(c.load_pct ?? 0) >= 95 ? "bg-red-500" : (c.load_pct ?? 0) >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, c.load_pct ?? 0)}%` }} />
                  </div>
                  <Input className="min-w-[160px] flex-1" defaultValue={c.capacity_note ?? ""} placeholder="capacity note" onBlur={(e) => cand.update.mutate({ id: c.id, patch: { capacity_note: e.target.value || null } })} />
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox
                      checked={c.is_constraint}
                      onCheckedChange={(v) => {
                        cand.update.mutate({ id: c.id, patch: { is_constraint: !!v } });
                        if (v) onPatch({ constraint_name: c.name });
                      }}
                    />
                    constraint
                  </label>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => cand.remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Five focusing steps */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Five Focusing Steps</h2>
            <div className="flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${prog.pct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{prog.done}/{prog.total} done · {prog.pct}%</span>
              {steps.length === 0 && <Button size="sm" onClick={seed}>Load template</Button>}
              <Button size="sm" variant="outline" onClick={() => step.create.mutate({ analysis_id: analysis.id, step: 2, title: "New countermeasure", sort_order: steps.length })}>
                <Plus className="mr-1.5 h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">{s.step}</span>
                  <Input className="min-w-[200px] flex-1" defaultValue={s.title} onBlur={(e) => step.update.mutate({ id: s.id, patch: { title: e.target.value } })} />
                  <Select value={s.status} onValueChange={(v) => step.update.mutate({ id: s.id, patch: { status: v } })}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STEP_STATUSES.map((st) => <SelectItem key={st} value={st}>{STEP_STATUS_LABEL[st as StepStatus]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="w-[170px]"><OwnerSelect value={s.owner_id} onChange={(v) => step.update.mutate({ id: s.id, patch: { owner_id: v } })} /></div>
                  <Input type="date" className="w-[150px]" defaultValue={s.due_date ?? ""} onBlur={(e) => step.update.mutate({ id: s.id, patch: { due_date: e.target.value || null } })} />
                  <Badge variant="secondary" className={STEP_STATUS_TONE[s.status]}>{STEP_STATUS_LABEL[s.status]}</Badge>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => step.remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Textarea
                  rows={2}
                  className="mt-2"
                  defaultValue={s.description ?? ""}
                  onBlur={(e) => step.update.mutate({ id: s.id, patch: { description: e.target.value || null } })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buffer / DBR / policy */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="space-y-3 p-4">
          <h2 className="font-semibold">Drum – Buffer – Rope</h2>
          <Field label="Drum & rope (release rule)">
            <Textarea rows={3} defaultValue={analysis.dbr_notes ?? ""} onBlur={(e) => onPatch({ dbr_notes: e.target.value || null })} placeholder="What sets the drumbeat, and how is material released to it?" />
          </Field>
          <Field label="Buffer status">
            <Textarea rows={3} defaultValue={analysis.buffer_notes ?? ""} onBlur={(e) => onPatch({ buffer_notes: e.target.value || null })} placeholder="Time buffer ahead of the constraint, current penetration, who reacts on red." />
          </Field>
        </CardContent></Card>

        <Card><CardContent className="space-y-3 p-4">
          <h2 className="font-semibold">Policy constraint checklist</h2>
          <p className="text-xs text-muted-foreground">Most constraints are policies, not machines. Tick what applies here.</p>
          <div className="space-y-1.5">
            {POLICY_CONSTRAINT_CHECKS.map((p) => (
              <label key={p} className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={policies.includes(p)}
                  onCheckedChange={(v) =>
                    onPatch({ policy_constraints: v ? [...policies, p] : policies.filter((x) => x !== p) })
                  }
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function C2cBar({ a }: { a: TocAnalysis }) {
  const base = a.c2c_baseline ?? 0;
  const cur = a.c2c_current ?? base;
  const target = a.c2c_target ?? 0;
  if (!base) return null;
  const pct = base === target ? 0 : Math.max(0, Math.min(100, Math.round(((base - cur) / (base - target || 1)) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Cash-to-cash reduction toward target</span>
        <span>{pct}% · {cur} days (from {base}, target {target})</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Num({ label, value, onSave }: { label: string; value: number | null; onSave: (v: number | null) => void }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <Input
        type="number"
        className="mt-1 h-8"
        defaultValue={value ?? ""}
        onBlur={(e) => onSave(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}
