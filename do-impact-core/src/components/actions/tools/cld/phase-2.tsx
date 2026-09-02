import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { CldCanvas } from "@/components/actions/tools/cld-canvas";
import type { CldDiagram } from "@/hooks/use-problem-tools";
import { CRT_KIND_LABEL, PHASE_BY_KEY, type CrtNode } from "@/lib/problem-tools";
import { PhaseHeader, SectionCard, uid, type PhaseProps } from "./phase-common";

const FUNCTIONS = ["Sales", "Operations", "Finance", "HR", "Engineering", "Quality", "Supply Chain", "IT"];

export function Phase2({
  phases,
  patch,
  diagram,
  onDiagramPatch,
}: PhaseProps & { diagram: CldDiagram; onDiagramPatch: (p: Record<string, unknown>) => void }) {
  const people = phases.participants ?? [];
  const crt = phases.crt ?? [];
  const setCrt = (c: CrtNode[]) => patch({ crt: c });

  return (
    <div className="space-y-4">
      <PhaseHeader def={PHASE_BY_KEY.p2} phases={phases} patch={patch} />

      <SectionCard title="The room" hint="A systems map built by one function is a departmental map. Name who is in the room.">
        <div className="space-y-2">
          {people.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2">
              <Select
                value={p.fn}
                onValueChange={(v) => patch({ participants: people.map((x) => (x.id === p.id ? { ...x, fn: v } : x)) })}
              >
                <SelectTrigger className="w-44"><SelectValue placeholder="Function" /></SelectTrigger>
                <SelectContent>
                  {FUNCTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                className="max-w-xs"
                placeholder="Name"
                defaultValue={p.name}
                onBlur={(e) => patch({ participants: people.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) })}
              />
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => patch({ participants: people.filter((x) => x.id !== p.id) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => patch({ participants: [...people, { id: uid("pp"), fn: "Operations", name: "" }] })}>
            <Plus className="mr-1.5 h-4 w-4" /> Participant
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Causal loop diagram" hint="Draw the interdependencies, mark reinforcing (R) and balancing (B) loops, and flag the delays.">
        <CldCanvas diagram={diagram} onPatch={onDiagramPatch} />
      </SectionCard>

      <SectionCard
        title="Current Reality Tree"
        hint="List the undesirable effects, chain them upward, and flag the one or two core causes underneath them all."
      >
        <div className="space-y-2">
          {crt.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
              <Input
                className="min-w-[220px] flex-1"
                defaultValue={n.label}
                placeholder="Effect / cause"
                onBlur={(e) => setCrt(crt.map((x) => (x.id === n.id ? { ...x, label: e.target.value } : x)))}
              />
              <Select value={n.kind} onValueChange={(v) => setCrt(crt.map((x) => (x.id === n.id ? { ...x, kind: v as CrtNode["kind"] } : x)))}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CRT_KIND_LABEL) as CrtNode["kind"][]).map((k) => (
                    <SelectItem key={k} value={k}>{CRT_KIND_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={n.parent_id ?? "__none"}
                onValueChange={(v) => setCrt(crt.map((x) => (x.id === n.id ? { ...x, parent_id: v === "__none" ? null : v } : x)))}
              >
                <SelectTrigger className="w-56"><SelectValue placeholder="Caused by…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No parent cause</SelectItem>
                  {crt.filter((x) => x.id !== n.id).map((x) => (
                    <SelectItem key={x.id} value={x.id}>{x.label || "Untitled"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setCrt(crt.filter((x) => x.id !== n.id).map((x) => (x.parent_id === n.id ? { ...x, parent_id: null } : x)))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setCrt([...crt, { id: uid("crt"), label: "", kind: "ude", parent_id: null }])}>
            <Plus className="mr-1.5 h-4 w-4" /> Effect
          </Button>
        </div>

        {crt.length > 0 && <CrtTree nodes={crt} />}
      </SectionCard>
    </div>
  );
}

function CrtTree({ nodes }: { nodes: CrtNode[] }) {
  const roots = nodes.filter((n) => !n.parent_id);
  const render = (n: CrtNode, depth: number) => (
    <div key={n.id} style={{ marginLeft: depth * 20 }} className="space-y-1.5">
      <div
        className={
          "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm " +
          (n.kind === "core"
            ? "border-rose-500 bg-rose-500/10 font-medium"
            : n.kind === "ude"
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-border")
        }
      >
        {n.kind === "core" && <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
        {n.label || "Untitled"}
      </div>
      <div className="space-y-1.5">{nodes.filter((c) => c.parent_id === n.id).map((c) => render(c, depth + 1))}</div>
    </div>
  );
  return <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">{roots.map((r) => render(r, 0))}</div>;
}
