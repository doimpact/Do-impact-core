import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import {
  MRO_BENCHMARK_WRENCH,
  MRO_DRIVERS,
  MRO_MATURITY,
  MRO_MATURITY_LABEL,
  MRO_MATURITY_TONE,
  MRO_MODULES,
  mroDriverTarget,
  mroDriverValue,
  mroTotals,
  type MroDriverEntry,
  type MroMaturity,
  type MroModuleEntry,
} from "@/lib/problem-tools";
import { STEP_STATUSES, STEP_STATUS_LABEL, STEP_STATUS_TONE, type StepStatus } from "@/lib/problem-plan";
import { useMroActionMut, useMroActions, type MroAssessment } from "@/hooks/use-problem-tools";

const DRIVER_BARS = ["bg-rose-500", "bg-amber-500", "bg-violet-500", "bg-sky-500", "bg-slate-500"];

export function MroWorkspace({
  assessment,
  onPatch,
}: {
  assessment: MroAssessment;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const drivers = (assessment.drivers ?? {}) as Record<string, MroDriverEntry>;
  const modules = (assessment.modules ?? {}) as Record<string, MroModuleEntry>;
  const totals = mroTotals(drivers);

  const actionQ = useMroActions(assessment.id);
  const action = useMroActionMut(assessment.id);
  const actions = actionQ.data ?? [];

  const patchDriver = (key: string, patch: MroDriverEntry) =>
    onPatch({ drivers: { ...drivers, [key]: { ...(drivers[key] ?? {}), ...patch } } });
  const patchModule = (key: string, patch: MroModuleEntry) =>
    onPatch({ modules: { ...modules, [key]: { ...(modules[key] ?? {}), ...patch } } });

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Aircraft type</p>
              <Input
                defaultValue={assessment.aircraft_type ?? ""}
                placeholder="e.g. A320neo"
                onBlur={(e) => onPatch({ aircraft_type: e.target.value || null })}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Check / work scope</p>
              <Input
                defaultValue={assessment.check_type ?? ""}
                placeholder="e.g. C-check, line maintenance"
                onBlur={(e) => onPatch({ check_type: e.target.value || null })}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Owner</p>
              <OwnerSelect value={assessment.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
            </div>
            <div className="flex items-end gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/oms/daily">
                  Daily <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/oms/shopfloor">
                  Flow <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1 — wrench time breakdown */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">1 · Wrench-time breakdown</h2>
          <p className="text-sm text-muted-foreground">
            Industry benchmark: ~{MRO_BENCHMARK_WRENCH}% wrench-on-task, ~{100 - MRO_BENCHMARK_WRENCH}% non-value-added.
            Enter what your hangar actually looks like and where you intend to get to.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex h-8 w-full overflow-hidden rounded-md">
              <div
                className="flex items-center justify-center bg-emerald-500 text-[11px] font-semibold text-white"
                style={{ width: `${Math.max(totals.wrench, 0)}%` }}
              >
                {totals.wrench > 12 ? `Wrench ${totals.wrench}%` : ""}
              </div>
              {MRO_DRIVERS.map((d, i) => {
                const v = mroDriverValue(drivers[d.key], d);
                return (
                  <div
                    key={d.key}
                    title={`${d.name} — ${v}%`}
                    className={`flex items-center justify-center text-[11px] font-semibold text-white ${DRIVER_BARS[i]}`}
                    style={{ width: `${Math.max(v, 0)}%` }}
                  >
                    {v >= 8 ? `${v}%` : ""}
                  </div>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Wrench time now" value={`${totals.wrench}%`} />
              <Stat label="Waste now" value={`${totals.waste}%`} />
              <Stat label="Wrench time at target" value={`${totals.targetWrench}%`} />
              <Stat label="Recoverable" value={`${totals.recovered > 0 ? "+" : ""}${totals.recovered} pts`} accent />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {MRO_DRIVERS.map((d, i) => {
            const e = drivers[d.key] ?? {};
            return (
              <Card key={d.key}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${DRIVER_BARS[i]}`}>
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">{d.name}</h3>
                        <p className="text-xs text-muted-foreground">{d.waste}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Benchmark {d.benchmark}% of lost time</Badge>
                  </div>

                  <dl className="grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-muted-foreground">Root cause</dt>
                      <dd>{d.rootCause}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">Impact</dt>
                      <dd>{d.impact}</dd>
                    </div>
                  </dl>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <NumField
                      label="Your current %"
                      value={mroDriverValue(e, d)}
                      onCommit={(v) => patchDriver(d.key, { current: v })}
                    />
                    <NumField
                      label="Target %"
                      value={mroDriverTarget(e, d)}
                      onCommit={(v) => patchDriver(d.key, { target: v })}
                    />
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Owner</p>
                      <OwnerSelect value={e.owner_id ?? null} onChange={(v) => patchDriver(d.key, { owner_id: v })} />
                    </div>
                    <div className="sm:col-span-1">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Evidence</p>
                      <Input
                        defaultValue={e.evidence ?? ""}
                        placeholder="How you measured it"
                        onBlur={(ev) => patchDriver(d.key, { evidence: ev.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 2 — blueprint */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">2 · Application blueprint</h2>
          <p className="text-sm text-muted-foreground">
            Five modules that attack the drivers above. Score where you are today and who owns closing the gap.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MRO_MODULES.map((m) => {
            const mat = (modules[m.key]?.maturity ?? "none") as MroMaturity;
            return (
              <Badge key={m.key} variant="secondary" className={MRO_MATURITY_TONE[mat]}>
                {m.index}. {MRO_MATURITY_LABEL[mat]}
              </Badge>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {MRO_MODULES.map((m) => {
            const e = modules[m.key] ?? {};
            const mat = (e.maturity ?? "none") as MroMaturity;
            return (
              <Card key={m.key} className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight">
                      Module {m.index} — {m.name}
                    </h3>
                    <Badge variant="secondary" className={MRO_MATURITY_TONE[mat]}>
                      {MRO_MATURITY_LABEL[mat]}
                    </Badge>
                  </div>
                  <p className="rounded-md border border-dashed border-border p-2 text-xs">
                    <span className="font-medium">Rule: </span>
                    {m.rule}
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    {m.capabilities.map((c) => (
                      <li key={c.label}>
                        <span className="font-medium">{c.label} — </span>
                        <span className="text-muted-foreground">{c.detail}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1">
                    {m.drivers.map((dk) => (
                      <span key={dk} className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {MRO_DRIVERS.find((d) => d.key === dk)?.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto grid gap-2 pt-1 sm:grid-cols-3">
                    <Select value={mat} onValueChange={(v) => patchModule(m.key, { maturity: v as MroMaturity })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MRO_MATURITY.map((x) => (
                          <SelectItem key={x} value={x}>
                            {MRO_MATURITY_LABEL[x]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <OwnerSelect value={e.owner_id ?? null} onChange={(v) => patchModule(m.key, { owner_id: v })} />
                    <Input
                      type="date"
                      defaultValue={e.target_date ?? ""}
                      onBlur={(ev) => patchModule(m.key, { target_date: ev.target.value || null })}
                    />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Where you are today, what is missing"
                    defaultValue={e.notes ?? ""}
                    onBlur={(ev) => patchModule(m.key, { notes: ev.target.value })}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3 — countermeasures */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">3 · Countermeasures</h2>
            <p className="text-sm text-muted-foreground">Committed actions coming out of this assessment.</p>
          </div>
          <Button
            size="sm"
            onClick={() =>
              action.create.mutate({
                assessment_id: assessment.id,
                title: "New countermeasure",
                sort_order: actions.length,
              })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add action
          </Button>
        </div>

        {actions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No countermeasures yet.
          </p>
        ) : (
          <div className="space-y-2">
            {actions.map((a) => (
              <Card key={a.id}>
                <CardContent className="grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center">
                  <Input
                    defaultValue={a.title}
                    onBlur={(e) => e.target.value !== a.title && action.update.mutate({ id: a.id, patch: { title: e.target.value } })}
                  />
                  <Select
                    value={a.driver_key ?? "none"}
                    onValueChange={(v) => action.update.mutate({ id: a.id, patch: { driver_key: v === "none" ? null : v } })}
                  >
                    <SelectTrigger className="sm:w-56">
                      <SelectValue placeholder="Driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific driver</SelectItem>
                      {MRO_DRIVERS.map((d) => (
                        <SelectItem key={d.key} value={d.key}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <OwnerSelect value={a.owner_id} onChange={(v) => action.update.mutate({ id: a.id, patch: { owner_id: v } })} />
                  <Input
                    type="date"
                    className="sm:w-40"
                    defaultValue={a.due_date ?? ""}
                    onBlur={(e) => action.update.mutate({ id: a.id, patch: { due_date: e.target.value || null } })}
                  />
                  <div className="flex items-center gap-2">
                    <Select
                      value={a.status}
                      onValueChange={(v) => action.update.mutate({ id: a.id, patch: { status: v as StepStatus } })}
                    >
                      <SelectTrigger className={`w-36 ${STEP_STATUS_TONE[a.status as StepStatus]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEP_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STEP_STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => action.remove.mutate(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${accent ? "text-[color:var(--color-accent)]" : ""}`}>{value}</p>
    </div>
  );
}

function NumField({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <Input
        type="number"
        min={0}
        max={100}
        step={0.5}
        defaultValue={value}
        key={value}
        onBlur={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v) && v !== value) onCommit(Math.min(100, Math.max(0, v)));
        }}
      />
    </div>
  );
}
