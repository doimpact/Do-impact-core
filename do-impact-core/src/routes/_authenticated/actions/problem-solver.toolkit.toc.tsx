import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/actions/tools/tool-shell";
import { TocTemplate } from "@/components/actions/tools/toc-template";
import { useTocAnalyses, useTocAnalysisMut } from "@/hooks/use-problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/toolkit/toc")({
  head: () => ({
    meta: [
      { title: "Theory of Constraints — DO.Impact" },
      { name: "description", content: "Find the one bottleneck that sets throughput, then work the five focusing steps with owners, buffers and cash-to-cash impact." },
      { property: "og:title", content: "Theory of Constraints — DO.Impact" },
      { property: "og:description", content: "Five focusing steps, drum-buffer-rope and policy constraints in one working template." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TocPage,
});

function TocPage() {
  const [showArchived, setShowArchived] = useState(false);
  const q = useTocAnalyses(showArchived);
  const mut = useTocAnalysisMut();
  const [sel, setSel] = useState<string | null>(null);
  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === (sel ?? rows[0]?.id)) ?? null;

  return (
    <ToolShell
      toolId="toc"
      records={rows.map((r) => ({ id: r.id, title: r.title, archived_at: r.archived_at }))}
      value={current?.id ?? null}
      onSelect={setSel}
      onCreate={async (title) => setSel(await mut.create.mutateAsync({ title }))}
      onDelete={async (id) => await mut.remove.mutateAsync(id)}
      onArchiveChange={async (id, archived) => await mut.setArchived.mutateAsync({ id, archived })}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
    >
      {current && <TocTemplate analysis={current} onPatch={(patch) => mut.update.mutate({ id: current.id, patch })} />}
    </ToolShell>
  );
}
