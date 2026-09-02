import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Lock, Unlock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolShell } from "@/components/actions/tools/tool-shell";
import { PhaseRail, PhaseChecklist } from "@/components/actions/tools/cld/phase-rail";
import { Phase1 } from "@/components/actions/tools/cld/phase-1";
import { Phase2 } from "@/components/actions/tools/cld/phase-2";
import { Phase3 } from "@/components/actions/tools/cld/phase-3";
import { Phase4 } from "@/components/actions/tools/cld/phase-4";
import { Phase5 } from "@/components/actions/tools/cld/phase-5";
import { useCldDiagrams, useCldMut } from "@/hooks/use-problem-tools";
import { phase4Locked, type CldPhases, type PhaseKey } from "@/lib/problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/toolkit/cld")({
  head: () => ({
    meta: [
      { title: "Causal Loops — 5-Phase Systemic Problem Solving | DO.Impact" },
      {
        name: "description",
        content:
          "Run the five-phase systemic method: pattern over time, cross-functional map, leverage point, evaporating cloud countermeasures, and delay-aware deployment.",
      },
      { property: "og:title", content: "Causal Loops — 5-Phase Systemic Problem Solving | DO.Impact" },
      {
        property: "og:description",
        content: "Guided phase workflow with reference modes, causal loop canvas, current reality tree, and lead/lag monitoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CldPage,
});

function CldPage() {
  const [showArchived, setShowArchived] = useState(false);
  const q = useCldDiagrams(showArchived);
  const mut = useCldMut();
  const [sel, setSel] = useState<string | null>(null);
  const [phase, setPhase] = useState<PhaseKey>("p1");
  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === (sel ?? rows[0]?.id)) ?? null;

  const phases: CldPhases = (current?.phases ?? {}) as CldPhases;
  const nodes = current?.nodes ?? [];
  const links = current?.links ?? [];
  const ctx = { nodes: nodes.length, links: links.length };
  const locked = phase4Locked(phases, ctx);

  const patchPhases = (p: Partial<CldPhases>) => {
    if (!current) return;
    mut.update.mutate({ id: current.id, patch: { phases: { ...phases, ...p } } });
  };
  const patchDiagram = (p: Record<string, unknown>) => {
    if (!current) return;
    mut.update.mutate({ id: current.id, patch: p });
  };

  const shared = { phases, patch: patchPhases };

  return (
    <ToolShell
      toolId="cld"
      records={rows.map((r) => ({ id: r.id, title: r.title, archived_at: r.archived_at }))}
      value={current?.id ?? null}
      onSelect={setSel}
      onCreate={async (title) => setSel(await mut.create.mutateAsync({ title }))}
      onDelete={async (id) => await mut.remove.mutateAsync(id)}
      onArchiveChange={async (id, archived) => await mut.setArchived.mutateAsync({ id, archived })}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
    >
      {current && (
        <div className="space-y-4">
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex flex-wrap items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold">The Golden Rule of Systemic Problem Solving</p>
                <p className="text-sm text-muted-foreground">
                  Never attempt Phase 4 (interventions) until Phase 2 (mapping) is complete. The place where a system hurts is
                  almost never where the fix needs to be applied.
                </p>
              </div>
              <Button
                size="sm"
                variant={phases.override_gate ? "default" : "outline"}
                onClick={() => patchPhases({ override_gate: !phases.override_gate })}
              >
                {phases.override_gate ? <Unlock className="mr-1.5 h-4 w-4" /> : <Lock className="mr-1.5 h-4 w-4" />}
                {phases.override_gate ? "Gate overridden" : "Override gate"}
              </Button>
            </CardContent>
          </Card>

          <PhaseRail phases={phases} ctx={ctx} active={phase} lockedP4={locked} onSelect={setPhase} />

          {phases.problem_statement && phase !== "p1" && (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">Problem: </span>
              {phases.problem_statement}
            </p>
          )}

          <PhaseChecklist phases={phases} ctx={ctx} phaseKey={phase} />

          {phase === "p1" && <Phase1 {...shared} />}
          {phase === "p2" && <Phase2 {...shared} diagram={current} onDiagramPatch={patchDiagram} />}
          {phase === "p3" && <Phase3 {...shared} nodes={nodes} links={links} />}
          {phase === "p4" && !locked && <Phase4 {...shared} />}
          {phase === "p5" && <Phase5 {...shared} />}
        </div>
      )}
    </ToolShell>
  );
}
