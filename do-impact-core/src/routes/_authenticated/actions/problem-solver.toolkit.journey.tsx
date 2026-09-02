import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/actions/tools/tool-shell";
import { JourneyMapBoard } from "@/components/actions/tools/journey-map";
import { useJourneyMapMut, useJourneyMaps } from "@/hooks/use-problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/toolkit/journey")({
  head: () => ({
    meta: [
      { title: "Employee Journey Mapping — DO.Impact" },
      { name: "description", content: "Map the employee lifecycle from attract to exit, score friction by root cause and own the countermeasures." },
      { property: "og:title", content: "Employee Journey Mapping — DO.Impact" },
      { property: "og:description", content: "Eight-stage lifecycle map with sentiment curve and friction scoring for turnover problems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const [showArchived, setShowArchived] = useState(false);
  const q = useJourneyMaps(showArchived);
  const mut = useJourneyMapMut();
  const [sel, setSel] = useState<string | null>(null);
  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === (sel ?? rows[0]?.id)) ?? null;

  return (
    <ToolShell
      toolId="journey"
      records={rows.map((r) => ({ id: r.id, title: r.title, archived_at: r.archived_at }))}
      value={current?.id ?? null}
      onSelect={setSel}
      onCreate={async (title) => setSel(await mut.create.mutateAsync({ title }))}
      onDelete={async (id) => await mut.remove.mutateAsync(id)}
      onArchiveChange={async (id, archived) => await mut.setArchived.mutateAsync({ id, archived })}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
    >
      {current && <JourneyMapBoard map={current} onPatch={(patch) => mut.update.mutate({ id: current.id, patch })} />}
    </ToolShell>
  );
}
