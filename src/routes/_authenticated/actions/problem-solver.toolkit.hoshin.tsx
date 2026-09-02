import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ToolShell } from "@/components/actions/tools/tool-shell";
import { HoshinReviewBoard } from "@/components/actions/tools/hoshin-review";
import { useHoshinReviewMut, useHoshinReviews } from "@/hooks/use-problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/toolkit/hoshin")({
  head: () => ({
    meta: [
      { title: "Hoshin Kanri review — DO.Impact" },
      { name: "description", content: "Audit the strategy cascade: breakthroughs, annual objectives, priorities, metrics, owners and catchball." },
      { property: "og:title", content: "Hoshin Kanri review — DO.Impact" },
      { property: "og:description", content: "Coaching layer over the X-Matrix that flags orphan goals, missing owners and missing targets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HoshinPage,
});

function HoshinPage() {
  const [showArchived, setShowArchived] = useState(false);
  const q = useHoshinReviews(showArchived);
  const mut = useHoshinReviewMut();
  const [sel, setSel] = useState<string | null>(null);
  const rows = q.data ?? [];
  const current = rows.find((r) => r.id === (sel ?? rows[0]?.id)) ?? null;

  return (
    <ToolShell
      toolId="hoshin"
      records={rows.map((r) => ({ id: r.id, title: r.title, archived_at: r.archived_at }))}
      value={current?.id ?? null}
      onSelect={setSel}
      onCreate={async (title) => setSel(await mut.create.mutateAsync({ title }))}
      onDelete={async (id) => await mut.remove.mutateAsync(id)}
      onArchiveChange={async (id, archived) => await mut.setArchived.mutateAsync({ id, archived })}
      showArchived={showArchived}
      onShowArchivedChange={setShowArchived}
    >
      {current && <HoshinReviewBoard review={current} onPatch={(patch) => mut.update.mutate({ id: current.id, patch })} />}
    </ToolShell>
  );
}
