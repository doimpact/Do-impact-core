import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PHASE_BY_KEY, detectLoops, type CldLink, type CldNode } from "@/lib/problem-tools";
import { PhaseHeader, SectionCard, type PhaseProps } from "./phase-common";

export function Phase3({
  phases,
  patch,
  nodes,
  links,
}: PhaseProps & { nodes: CldNode[]; links: CldLink[] }) {
  const c = phases.constraint ?? {};
  const lev = phases.leverage ?? {};
  const loops = detectLoops(nodes, links);
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? "?";
  const selectedLink = links.find((l) => l.id === lev.link_id);

  return (
    <div className="space-y-4">
      <PhaseHeader def={PHASE_BY_KEY.p3} phases={phases} patch={patch} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="The constraint" hint="Physical (a machine, a skill, cash) or policy (a rule, a metric, an incentive). Policy constraints are the common case.">
          <Select value={c.kind ?? "physical"} onValueChange={(v) => patch({ constraint: { ...c, kind: v as "physical" | "policy" } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical constraint</SelectItem>
              <SelectItem value="policy">Policy constraint</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Name the constraint"
            defaultValue={c.name ?? ""}
            onBlur={(e) => patch({ constraint: { ...c, name: e.target.value } })}
          />
          <Textarea
            rows={4}
            placeholder="Evidence — load data, queue length, decision logs, incentive wording…"
            defaultValue={c.evidence ?? ""}
            onBlur={(e) => patch({ constraint: { ...c, evidence: e.target.value } })}
          />
        </SectionCard>

        <SectionCard title="The leverage point" hint="One link, not ten. The place the system hurts is almost never where the fix belongs.">
          <Select
            value={lev.link_id ?? "__none"}
            onValueChange={(v) => patch({ leverage: { ...lev, link_id: v === "__none" ? null : v } })}
          >
            <SelectTrigger><SelectValue placeholder="Pick a causal link from the map" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Not selected yet</SelectItem>
              {links.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {label(l.from)} →{l.polarity}{l.delay ? " ‖" : ""} {label(l.to)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedLink && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
              <strong>{label(selectedLink.from)}</strong> → <strong>{label(selectedLink.to)}</strong>{" "}
              <Badge variant="outline" className="ml-1">{selectedLink.polarity === "S" ? "same direction" : "opposite"}</Badge>
              {selectedLink.delay && <Badge variant="outline" className="ml-1">delayed</Badge>}
            </div>
          )}
          <Textarea
            rows={3}
            placeholder="Intervention — what changes at this link?"
            defaultValue={lev.intervention ?? ""}
            onBlur={(e) => patch({ leverage: { ...lev, intervention: e.target.value } })}
          />
          <Textarea
            rows={3}
            placeholder="Which loop does this break, or which delay does it shorten?"
            defaultValue={lev.rationale ?? ""}
            onBlur={(e) => patch({ leverage: { ...lev, rationale: e.target.value } })}
          />
        </SectionCard>
      </div>

      <SectionCard title="Loops in play" hint="Reinforcing loops accelerate the drift; balancing loops resist your fix.">
        {loops.length === 0 ? (
          <p className="text-sm text-muted-foreground">No closed loop detected yet — go back to Phase 2 and close the arrows.</p>
        ) : (
          <div className="space-y-1.5">
            {loops.map((lp, i) => (
              <div key={lp.key} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className={lp.type === "R" ? "bg-rose-600 text-white" : "bg-sky-600 text-white"}>
                  {lp.type}{i + 1}
                </Badge>
                <span className="text-muted-foreground">{lp.nodes.map(label).join(" → ")} →</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
