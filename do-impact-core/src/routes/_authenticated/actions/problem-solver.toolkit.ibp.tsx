import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/actions/tools/tool-shell";
import { IbpCycleBoard } from "@/components/actions/tools/ibp-cycle";
import { useIbpCycleMut, useIbpCycles } from "@/hooks/use-problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/toolkit/ibp")({
  head: () => ({
    meta: [
      { title: "Integrated Business Planning — DO.Impact" },
      { name: "description", content: "Run the five-meeting IBP cycle on a rolling 24-month horizon, reconciling demand, supply and the financial plan." },
      { property: "og:title", content: "Integrated Business Planning — DO.Impact" },
      { property: "og:description", content: "IBP cycle board linked to the SIOP module, with gap and long-lead material tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IbpPage,
});

function IbpPage() {
  const [showArchived, setShowArchived] = useState(false);
  const q = useIbpCycles(showArchived);
  const mut = useIbpCycleMut();
  const [sel, setSel] = useState<string | null>(null);
  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === (sel ?? rows[0]?.id)) ?? null;

  return (
    <ToolShell
      toolId="ibp"
      records={rows.map((r) => ({ id: r.id, title: r.title, archived_at: r.archived_at }))}
      value={current?.id ?? null}
      onSelect={setSel}
      onCreate={async (title) => setSel(await mut.create.mutateAsync({ title }))}
      onDelete={async (id) => await mut.remove.mutateAsync(id)}
      onArchiveChange={async (id, archived) => await mut.setArchived.mutateAsync({ id, archived })}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
    >
      {current && <IbpCycleBoard cycle={current} onPatch={(patch) => mut.update.mutate({ id: current.id, patch })} />}
    </ToolShell>
  );
}
