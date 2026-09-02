import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getPillarByKey, listTasks, deletePillar, archivePillar } from "@/lib/oms.functions";
import { KanbanBoard } from "@/components/kanban-board";
import { PillarNotes } from "@/components/pillar-notes";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { PillarDialog } from "@/components/oms/PillarDialog";
import { confirmThen } from "@/components/confirm-dialog";


export const Route = createFileRoute("/_authenticated/oms/pillars/$pillarKey")({
  head: () => ({ meta: [{ title: "Pillars — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: PillarPage,
});

function PillarPage() {
  const { pillarKey } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const delFn = useServerFn(deletePillar);
  const archiveFn = useServerFn(archivePillar);
  const [editing, setEditing] = useState(false);

  const pillarQ = useQuery({
    queryKey: ["pillar", pillarKey],
    queryFn: () => getPillarByKey({ data: { key: pillarKey } }),
  });
  const pillarId = pillarQ.data?.id;
  const tasksQ = useQuery({
    queryKey: ["tasks", pillarId],
    queryFn: () => listTasks({ data: { pillarId: pillarId! } }),
    enabled: !!pillarId,
  });

  const archive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => archiveFn({ data: { id, archived } }),
    onSuccess: (_, vars) => {
      toast.success(vars.archived ? "Pillar archived" : "Pillar restored");
      qc.invalidateQueries({ queryKey: ["pillar", pillarKey] });
      qc.invalidateQueries({ queryKey: ["pillars"] });
      qc.invalidateQueries({ queryKey: ["task-counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Pillar deleted");
      qc.invalidateQueries({ queryKey: ["pillars"] });
      qc.invalidateQueries({ queryKey: ["task-counts"] });
      navigate({ to: "/oms" });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <>
      {pillarQ.data && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {pillarQ.data.name}
              {pillarQ.data.archived_at && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">(archived)</span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">{pillarQ.data.tagline}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Owner: {(pillarQ.data as { owner?: { display_name: string | null } | null }).owner?.display_name ?? "Unassigned"}
            </p>

          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" />Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!pillarQ.data) return;
                archive.mutate({ id: pillarQ.data.id, archived: !pillarQ.data.archived_at });
              }}
            >
              {pillarQ.data.archived_at ? <ArchiveRestore className="h-4 w-4 mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
              {pillarQ.data.archived_at ? "Restore" : "Archive"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (!pillarQ.data) return;
                const pillar = pillarQ.data;
                confirmThen(`Delete pillar "${pillar.name}"? This removes all its tasks, KPIs, and notes.`, () => {
                  del.mutate(pillar.id);
                });
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />Delete
            </Button>
          </div>
        </div>
      )}

      {pillarId && (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Board</h2>
            <KanbanBoard pillarId={pillarId} tasks={(tasksQ.data ?? []) as never} />
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">Retrospective</h2>
            <PillarNotes pillarId={pillarId} />
          </section>
        </div>
      )}
      <PillarDialog
        open={editing}
        onOpenChange={setEditing}
        pillar={pillarQ.data ? { id: pillarQ.data.id, key: pillarQ.data.key, name: pillarQ.data.name, tagline: pillarQ.data.tagline ?? null, owner_id: (pillarQ.data as { owner_id?: string | null }).owner_id ?? null } : null}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["pillar", pillarKey] });
          qc.invalidateQueries({ queryKey: ["pillars"] });
        }}
      />
    </>
  );
}
