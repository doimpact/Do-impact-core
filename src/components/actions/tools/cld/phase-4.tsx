import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import { Plus, Trash2 } from "lucide-react";
import { PHASE_BY_KEY, type Injection, type PhaseStatus, type PreMortem } from "@/lib/problem-tools";
import { PhaseHeader, SectionCard, STATUS_LABEL, uid, type PhaseProps } from "./phase-common";

export function Phase4({ phases, patch }: PhaseProps) {
  const cloud = phases.cloud ?? {};
  const injections = phases.injections ?? [];
  const premortem = phases.premortem ?? [];
  const assumptions = cloud.assumptions ?? [];
  const setCloud = (p: Record<string, unknown>) => patch({ cloud: { ...cloud, ...p } });

  return (
    <div className="space-y-4">
      <PhaseHeader def={PHASE_BY_KEY.p4} phases={phases} patch={patch} />

      <SectionCard
        title="Evaporating Cloud"
        hint="Two valid needs pull in opposite directions. Break an assumption on one arrow instead of splitting the difference."
      >
        <div className="grid items-center gap-3 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="lg:row-span-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">A — Objective</p>
            <Textarea
              rows={4}
              placeholder="The shared goal both sides agree on"
              defaultValue={cloud.objective ?? ""}
              onBlur={(e) => setCloud({ objective: e.target.value })}
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">B — Need</p>
            <Textarea rows={2} placeholder="First legitimate need" defaultValue={cloud.need_b ?? ""} onBlur={(e) => setCloud({ need_b: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">D — Want</p>
            <Textarea rows={2} placeholder="What B forces us to do" defaultValue={cloud.want_d ?? ""} onBlur={(e) => setCloud({ want_d: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">C — Need</p>
            <Textarea rows={2} placeholder="Second legitimate need" defaultValue={cloud.need_c ?? ""} onBlur={(e) => setCloud({ need_c: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-600">D′ — Conflicting want</p>
            <Textarea rows={2} placeholder="What C forces us to do instead" defaultValue={cloud.want_dp ?? ""} onBlur={(e) => setCloud({ want_dp: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Assumptions holding the conflict in place</p>
          {assumptions.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                defaultValue={a}
                placeholder="We assume that…"
                onBlur={(e) => setCloud({ assumptions: assumptions.map((x, j) => (j === i ? e.target.value : x)) })}
              />
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setCloud({ assumptions: assumptions.filter((_, j) => j !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setCloud({ assumptions: [...assumptions, ""] })}>
            <Plus className="mr-1.5 h-4 w-4" /> Assumption
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Injections — countermeasures that satisfy both needs" hint="An injection invalidates an assumption; a compromise just shares the pain.">
        <div className="space-y-2">
          {injections.map((inj) => (
            <div key={inj.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
              <Input
                className="min-w-[240px] flex-1"
                defaultValue={inj.label}
                placeholder="Countermeasure"
                onBlur={(e) => patch({ injections: injections.map((x) => (x.id === inj.id ? { ...x, label: e.target.value } : x)) })}
              />
              <div className="w-48">
                <OwnerSelect value={inj.owner_id ?? null} onChange={(v) => patch({ injections: injections.map((x) => (x.id === inj.id ? { ...x, owner_id: v } : x)) })} />
              </div>
              <Input
                type="date"
                className="w-40"
                defaultValue={inj.due_date ?? ""}
                onBlur={(e) => patch({ injections: injections.map((x) => (x.id === inj.id ? { ...x, due_date: e.target.value || null } : x)) })}
              />
              <Select
                value={inj.status ?? "not_started"}
                onValueChange={(v) => patch({ injections: injections.map((x) => (x.id === inj.id ? { ...x, status: v as PhaseStatus } : x)) })}
              >
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as PhaseStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => patch({ injections: injections.filter((x) => x.id !== inj.id) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => patch({ injections: [...injections, { id: uid("inj"), label: "", status: "not_started" } as Injection] })}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Injection
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Pre-mortem" hint="Run each countermeasure back through the loops: what does it break 6–12 months from now?">
        <div className="space-y-2">
          {premortem.map((pm) => (
            <div key={pm.id} className="grid gap-2 rounded-lg border border-border p-2 lg:grid-cols-4">
              <Select
                value={pm.injection_id ?? "__none"}
                onValueChange={(v) => patch({ premortem: premortem.map((x) => (x.id === pm.id ? { ...x, injection_id: v === "__none" ? null : v } : x)) })}
              >
                <SelectTrigger><SelectValue placeholder="Injection" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unlinked</SelectItem>
                  {injections.map((i) => <SelectItem key={i.id} value={i.id}>{i.label || "Untitled"}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                defaultValue={pm.effect}
                placeholder="Predicted side effect"
                onBlur={(e) => patch({ premortem: premortem.map((x) => (x.id === pm.id ? { ...x, effect: e.target.value } : x)) })}
              />
              <Input
                defaultValue={pm.loop}
                placeholder="Which loop it feeds"
                onBlur={(e) => patch({ premortem: premortem.map((x) => (x.id === pm.id ? { ...x, loop: e.target.value } : x)) })}
              />
              <div className="flex items-center gap-2">
                <Input
                  defaultValue={pm.mitigation}
                  placeholder="Mitigation"
                  onBlur={(e) => patch({ premortem: premortem.map((x) => (x.id === pm.id ? { ...x, mitigation: e.target.value } : x)) })}
                />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => patch({ premortem: premortem.filter((x) => x.id !== pm.id) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              patch({ premortem: [...premortem, { id: uid("pm"), injection_id: null, effect: "", loop: "", mitigation: "" } as PreMortem] })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" /> Pre-mortem entry
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
