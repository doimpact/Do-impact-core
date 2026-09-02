import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { JOURNEY_STAGES, ROOT_CAUSES, ROOT_CAUSE_LABEL, frictionScore } from "@/lib/problem-tools";
import { STEP_STATUSES, STEP_STATUS_LABEL, STEP_STATUS_TONE, type StepStatus } from "@/lib/problem-plan";
import {
  useJourneyPainMut,
  useJourneyPains,
  useJourneyStageMut,
  useJourneyStages,
  type JourneyMap,
} from "@/hooks/use-problem-tools";

const W = 900;
const H = 200;

export function JourneyMapBoard({
  map,
  onPatch,
}: {
  map: JourneyMap;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const stageQ = useJourneyStages(map.id);
  const painQ = useJourneyPains(map.id);
  const stage = useJourneyStageMut(map.id);
  const pain = useJourneyPainMut(map.id);

  const stages = stageQ.data ?? [];
  const pains = painQ.data ?? [];
  const byKey = new Map(stages.map((s) => [s.stage_key, s]));

  const seed = () => JOURNEY_STAGES.forEach((s) => stage.create.mutate({ map_id: map.id, stage_key: s.key, sentiment: 0 }));

  const points = useMemo(
    () =>
      JOURNEY_STAGES.map((def, i) => {
        const s = byKey.get(def.key);
        const x = (W / (JOURNEY_STAGES.length - 1)) * i;
        const y = H / 2 - ((s?.sentiment ?? 0) / 5) * (H / 2 - 20);
        return { x, y, key: def.key, name: def.name, sentiment: s?.sentiment ?? 0 };
      }),
    [stages],
  );

  const byCause = ROOT_CAUSES.map((rc) => ({
    ...rc,
    score: pains.filter((p) => p.root_cause === rc.key).reduce((a, p) => a + frictionScore(p), 0),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const maxCause = byCause[0]?.score ?? 1;

  return (
    <div className="space-y-4">
      <Card><CardContent className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Segment / persona</p>
            <Input defaultValue={map.segment ?? ""} placeholder="e.g. CNC machinists, 2nd shift" onBlur={(e) => onPatch({ segment: e.target.value || null })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Owner</p>
            <OwnerSelect value={map.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
          </div>
          <div className="flex items-end gap-2">
            <Button asChild variant="outline" className="flex-1"><Link to="/people/engagement">Engagement <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" className="flex-1"><Link to="/people/matrix">Skill matrix <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link></Button>
          </div>
        </div>
        <Textarea rows={2} placeholder="Why this map exists — e.g. 40% of leavers go in the first 12 months" defaultValue={map.notes ?? ""} onBlur={(e) => onPatch({ notes: e.target.value || null })} />
      </CardContent></Card>

      <Card><CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Sentiment across the lifecycle</h2>
          {stages.length === 0 && <Button size="sm" onClick={seed}>Load 8-stage template</Button>}
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full min-w-[720px]">
            <line x1={0} y1={H / 2} x2={W} y2={H / 2} className="stroke-border" strokeDasharray="4 4" />
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              className="stroke-sky-500"
              strokeWidth={2.5}
            />
            {points.map((p) => (
              <g key={p.key}>
                <circle cx={p.x} cy={p.y} r={6} className={p.sentiment < 0 ? "fill-rose-500" : p.sentiment > 0 ? "fill-emerald-500" : "fill-muted-foreground"} />
                <text x={p.x} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">{p.name}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY_STAGES.map((def) => {
            const s = byKey.get(def.key);
            return (
              <div key={def.key} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{def.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{def.hint}</p>
                {s ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        step={1}
                        defaultValue={s.sentiment}
                        className="flex-1 accent-sky-500"
                        onMouseUp={(e) => stage.update.mutate({ id: s.id, patch: { sentiment: Number((e.target as HTMLInputElement).value) } })}
                        onTouchEnd={(e) => stage.update.mutate({ id: s.id, patch: { sentiment: Number((e.target as HTMLInputElement).value) } })}
                      />
                      <span className="w-6 text-right text-xs tabular-nums">{s.sentiment}</span>
                    </div>
                    <Textarea rows={2} placeholder="Moments that matter" defaultValue={s.moments ?? ""} onBlur={(e) => stage.update.mutate({ id: s.id, patch: { moments: e.target.value || null } })} />
                    <Button size="sm" variant="outline" className="w-full" onClick={() => pain.create.mutate({ map_id: map.id, stage_key: def.key, label: "New pain point", severity: 3, frequency: 3, sort_order: pains.length })}>
                      <Plus className="mr-1.5 h-4 w-4" /> Pain point
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => stage.create.mutate({ map_id: map.id, stage_key: def.key, sentiment: 0 })}>Add stage</Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent></Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="space-y-3 p-4">
          <h2 className="font-semibold">Pain points & countermeasures</h2>
          {pains.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add pain points per stage. Severity × frequency ranks where to act first.</p>
          ) : [...pains].sort((a, b) => frictionScore(b) - frictionScore(a)).map((p) => (
            <div key={p.id} className="space-y-2 rounded-lg border border-border p-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{JOURNEY_STAGES.find((s) => s.key === p.stage_key)?.name ?? p.stage_key}</Badge>
                <Input className="h-8 min-w-[180px] flex-1" defaultValue={p.label} onBlur={(e) => pain.update.mutate({ id: p.id, patch: { label: e.target.value } })} />
                <Badge className="bg-rose-600 text-white">friction {frictionScore(p)}</Badge>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => pain.remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Slider label="Severity" v={p.severity} on={(v) => pain.update.mutate({ id: p.id, patch: { severity: v } })} />
                <Slider label="Frequency" v={p.frequency} on={(v) => pain.update.mutate({ id: p.id, patch: { frequency: v } })} />
                <Select value={p.root_cause ?? ""} onValueChange={(v) => pain.update.mutate({ id: p.id, patch: { root_cause: v } })}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Root cause" /></SelectTrigger>
                  <SelectContent>
                    {ROOT_CAUSES.map((r) => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={p.status} onValueChange={(v) => pain.update.mutate({ id: p.id, patch: { status: v } })}>
                  <SelectTrigger className={`h-8 ${STEP_STATUS_TONE[p.status]}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STEP_STATUSES.map((st) => <SelectItem key={st} value={st}>{STEP_STATUS_LABEL[st as StepStatus]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Textarea rows={2} className="min-w-[220px] flex-1" placeholder="Countermeasure" defaultValue={p.countermeasure ?? ""} onBlur={(e) => pain.update.mutate({ id: p.id, patch: { countermeasure: e.target.value || null } })} />
                <div className="w-[180px]"><OwnerSelect value={p.owner_id} onChange={(v) => pain.update.mutate({ id: p.id, patch: { owner_id: v } })} /></div>
              </div>
            </div>
          ))}
        </CardContent></Card>

        <Card><CardContent className="space-y-3 p-4">
          <h2 className="font-semibold">Where the friction really is</h2>
          <p className="text-xs text-muted-foreground">Total friction by root cause — turnover usually traces back here, not to pay.</p>
          {byCause.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tag pain points with a root cause to see the pattern.</p>
          ) : byCause.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-xs">
                <span>{ROOT_CAUSE_LABEL[c.key]}</span>
                <span className="text-muted-foreground">{c.score}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${(c.score / maxCause) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}

function Slider({ label, v, on }: { label: string; v: number; on: (v: number) => void }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>{label}</span><span>{v}</span></div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        defaultValue={v}
        className="mt-1 w-full accent-rose-500"
        onMouseUp={(e) => on(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => on(Number((e.target as HTMLInputElement).value))}
      />
    </div>
  );
}
