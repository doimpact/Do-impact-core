import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import { Plus, Trash2, ArrowUpRight } from "lucide-react";
import { PHASE_BY_KEY, type DelayItem, type Indicator } from "@/lib/problem-tools";
import { PhaseHeader, SectionCard, uid, type PhaseProps } from "./phase-common";

export function Phase5({ phases, patch }: PhaseProps) {
  const indicators = phases.indicators ?? [];
  const delays = phases.delays ?? [];
  const maxMonths = Math.max(12, ...delays.map((d) => d.months || 0));

  const row = (kind: "lead" | "lag") =>
    indicators
      .filter((i) => i.kind === kind)
      .map((ind) => (
        <div key={ind.id} className="grid gap-2 rounded-lg border border-border p-2 lg:grid-cols-5">
          <Input
            defaultValue={ind.name}
            placeholder="Metric"
            onBlur={(e) => patch({ indicators: indicators.map((x) => (x.id === ind.id ? { ...x, name: e.target.value } : x)) })}
          />
          <Input
            defaultValue={ind.target ?? ""}
            placeholder="Target"
            onBlur={(e) => patch({ indicators: indicators.map((x) => (x.id === ind.id ? { ...x, target: e.target.value } : x)) })}
          />
          <Input
            defaultValue={ind.current ?? ""}
            placeholder="Current"
            onBlur={(e) => patch({ indicators: indicators.map((x) => (x.id === ind.id ? { ...x, current: e.target.value } : x)) })}
          />
          <OwnerSelect
            value={ind.owner_id ?? null}
            onChange={(v) => patch({ indicators: indicators.map((x) => (x.id === ind.id ? { ...x, owner_id: v } : x)) })}
          />
          <div className="flex items-center gap-2">
            <Select
              value={ind.cadence ?? "monthly"}
              onValueChange={(v) => patch({ indicators: indicators.map((x) => (x.id === ind.id ? { ...x, cadence: v } : x)) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => patch({ indicators: indicators.filter((x) => x.id !== ind.id) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ));

  const add = (kind: "lead" | "lag") =>
    patch({ indicators: [...indicators, { id: uid("ind"), name: "", kind, cadence: "monthly" } as Indicator] });

  return (
    <div className="space-y-4">
      <PhaseHeader def={PHASE_BY_KEY.p5} phases={phases} patch={patch} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Lead indicators" hint="These move first. If they don't move, the intervention isn't landing — regardless of the lag metrics.">
          <div className="space-y-2">{row("lead")}</div>
          <Button size="sm" variant="outline" onClick={() => add("lead")}><Plus className="mr-1.5 h-4 w-4" /> Lead indicator</Button>
        </SectionCard>

        <SectionCard title="Lag indicators" hint="The financial outcome. Expect it to move months after the lead metrics do.">
          <div className="space-y-2">{row("lag")}</div>
          <Button size="sm" variant="outline" onClick={() => add("lag")}><Plus className="mr-1.5 h-4 w-4" /> Lag indicator</Button>
        </SectionCard>
      </div>

      <SectionCard title="Delay register" hint="Name the lag between each intervention and its visible result, so nobody kills a working fix too early.">
        <div className="space-y-2">
          {delays.map((d) => (
            <div key={d.id} className="space-y-1.5 rounded-lg border border-border p-2">
              <div className="grid gap-2 lg:grid-cols-[2fr_120px_2fr_auto]">
                <Input
                  defaultValue={d.intervention}
                  placeholder="Intervention"
                  onBlur={(e) => patch({ delays: delays.map((x) => (x.id === d.id ? { ...x, intervention: e.target.value } : x)) })}
                />
                <Input
                  type="number"
                  min={0}
                  defaultValue={d.months}
                  placeholder="Months"
                  onBlur={(e) => patch({ delays: delays.map((x) => (x.id === d.id ? { ...x, months: Number(e.target.value) || 0 } : x)) })}
                />
                <Input
                  defaultValue={d.shows_up_in}
                  placeholder="Shows up in…"
                  onBlur={(e) => patch({ delays: delays.map((x) => (x.id === d.id ? { ...x, shows_up_in: e.target.value } : x)) })}
                />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => patch({ delays: delays.filter((x) => x.id !== d.id) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, ((d.months || 0) / maxMonths) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">{d.months || 0} months</span>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => patch({ delays: [...delays, { id: uid("dl"), intervention: "", months: 6, shows_up_in: "" } as DelayItem] })}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Delay
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Deploy through the operating system" hint="Injections become annual priorities and A3s — they don't live in this tool.">
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/strategy/hoshin">Hoshin Kanri X-Matrix <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/actions/problem-solver/a3">A3 problem solving <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
