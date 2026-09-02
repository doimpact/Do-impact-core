import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/actions/tools/tool-shell";
import { MroWorkspace } from "@/components/actions/tools/mro-workspace";
import { useMroAssessmentMut, useMroAssessments } from "@/hooks/use-problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/mro")({
  head: () => ({
    meta: [
      { title: "Aviation MRO wrench-time — DO.Impact" },
      {
        name: "description",
        content:
          "Assess the five drivers of non-value-added time in a maintenance hangar and score your readiness across the five-module MRO application blueprint.",
      },
      { property: "og:title", content: "Aviation MRO wrench-time — DO.Impact" },
      {
        property: "og:description",
        content: "Hangar waste diagnostic: parts search, RFI latency, zone crowding, non-routine lag and sign-off friction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MroPage,
});

function MroPage() {
  const [showArchived, setShowArchived] = useState(false);
  const q = useMroAssessments(showArchived);
  const mut = useMroAssessmentMut();
  const [sel, setSel] = useState<string | null>(null);
  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === (sel ?? rows[0]?.id)) ?? null;

  return (
    <ToolShell
      toolId="mro"
      records={rows.map((r) => ({ id: r.id, title: r.title, archived_at: r.archived_at }))}
      value={current?.id ?? null}
      onSelect={setSel}
      onCreate={async (title) => setSel(await mut.create.mutateAsync({ title }))}
      onDelete={async (id) => await mut.remove.mutateAsync(id)}
      onArchiveChange={async (id, archived) => await mut.setArchived.mutateAsync({ id, archived })}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
    >
      {current && <MroWorkspace assessment={current} onPatch={(patch) => mut.update.mutate({ id: current.id, patch })} />}
    </ToolShell>
  );
}
