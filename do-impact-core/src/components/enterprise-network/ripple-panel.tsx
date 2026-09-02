import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Save } from "lucide-react";
import {
  LINK_TYPES,
  fmtImpact,
  fmtWeeks,
  layerMeta,
  rippleNarrative,
  type EnLinkType,
  type EnNode,
  type EnScenario,
  type RippleResult,
} from "@/lib/enterprise-network";

export type RippleState = {
  sourceId: string | null;
  shockPct: number;
  direction: "increase" | "decrease";
  decay: number;
  maxHops: number;
  linkTypes: EnLinkType[];
};

export function RipplePanel({
  nodes,
  state,
  setState,
  results,
  scenarios,
  onSave,
  onLoad,
  onDelete,
  readOnly,
}: {
  nodes: EnNode[];
  state: RippleState;
  setState: (s: RippleState) => void;
  results: RippleResult[];
  scenarios: EnScenario[];
  onSave: () => void;
  onLoad: (s: EnScenario) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}) {
  const downstream = results.filter((r) => r.hops > 0);
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? "?";

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">What changes?</h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Starting point</Label>
            <Select value={state.sourceId ?? ""} onValueChange={(v) => setState({ ...state, sourceId: v })}>
              <SelectTrigger><SelectValue placeholder="Pick a node…" /></SelectTrigger>
              <SelectContent>
                {nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Direction</Label>
            <div className="flex gap-2">
              {(["increase", "decrease"] as const).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={state.direction === d ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setState({ ...state, direction: d })}
                >
                  {d === "increase" ? "Increase" : "Decrease"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Size of change — {state.shockPct}%</Label>
            <Slider value={[state.shockPct]} min={1} max={60} step={1} onValueChange={([v]) => setState({ ...state, shockPct: v ?? 10 })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Damping per hop — {Math.round(state.decay * 100)}%</Label>
            <Slider value={[state.decay]} min={0.5} max={1} step={0.05} onValueChange={([v]) => setState({ ...state, decay: v ?? 0.85 })} />
            <p className="text-[11px] text-muted-foreground">How much of the effect survives each step through the network.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Maximum hops — {state.maxHops}</Label>
            <Slider value={[state.maxHops]} min={1} max={8} step={1} onValueChange={([v]) => setState({ ...state, maxHops: v ?? 6 })} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Flows to follow</Label>
            <div className="flex flex-wrap gap-1.5">
              {LINK_TYPES.map((t) => {
                const on = state.linkTypes.includes(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() =>
                      setState({
                        ...state,
                        linkTypes: on ? state.linkTypes.filter((x) => x !== t.key) : [...state.linkTypes, t.key],
                      })
                    }
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${on ? "text-background" : "text-muted-foreground"}`}
                    style={on ? { backgroundColor: t.color, borderColor: t.color } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" size="sm" disabled={!state.sourceId || readOnly} onClick={onSave}>
            <Save className="mr-1.5 h-4 w-4" /> Save as scenario
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Saved scenarios</h3>
          {scenarios.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Save a simulation to compare it week to week.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {scenarios.map((s) => (
                <li key={s.id} className="flex items-center gap-1">
                  <button className="flex-1 truncate rounded px-1.5 py-1 text-left text-sm hover:bg-muted" onClick={() => onLoad(s)}>
                    {s.name}
                  </button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(s.id)} aria-label="Delete scenario">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-4">
        {!state.sourceId ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            <Play className="mr-2 h-4 w-4" /> Pick a starting point to run the ripple.
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">What happens</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {rippleNarrative(results, state.shockPct * (state.direction === "decrease" ? -1 : 1), state.direction)}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Stat label="Parts affected" value={String(downstream.length)} />
                <Stat label="Largest impact" value={downstream[0] ? fmtImpact(downstream[0].impact) : "—"} />
                <Stat
                  label="Full effect by"
                  value={downstream.length ? fmtWeeks(Math.max(...downstream.map((d) => d.weeks))) : "—"}
                />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-3 text-sm font-semibold">Ripple, strongest first</div>
              {downstream.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nothing downstream — this node does not feed anything with the flows selected.</p>
              ) : (
                <div className="max-h-[440px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="p-2 font-medium">Node</th>
                        <th className="p-2 font-medium">Layer</th>
                        <th className="p-2 text-right font-medium">Impact</th>
                        <th className="p-2 text-right font-medium">Lands in</th>
                        <th className="p-2 font-medium">Route</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downstream.map((r) => (
                        <tr key={r.nodeId} className="border-t border-border/60">
                          <td className="p-2 font-medium">{r.label}</td>
                          <td className="p-2">
                            <Badge variant="outline" style={{ borderColor: layerMeta(r.layer).ring, color: layerMeta(r.layer).ring }}>
                              {layerMeta(r.layer).short}
                            </Badge>
                          </td>
                          <td className={`p-2 text-right font-semibold tabular-nums ${r.impact >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {fmtImpact(r.impact)}
                          </td>
                          <td className="p-2 text-right tabular-nums text-muted-foreground">{fmtWeeks(r.weeks)}</td>
                          <td className="max-w-[280px] truncate p-2 text-xs text-muted-foreground">
                            {r.path.map(label).join(" → ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function ScenarioNameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Scenario name" />;
}
