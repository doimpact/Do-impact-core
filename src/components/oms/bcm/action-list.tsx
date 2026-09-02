import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACTION_FIELDS, isOverdueAction, type BcmAction } from "@/lib/bcm";
import { RecordDialog, normalise } from "./record-dialog";
import { useCreateBcm, useDeleteBcm, useUpdateBcm } from "./use-bcm";

export function ActionList({
  actions,
  sourceKind,
  sourceId,
  compact = false,
}: {
  actions: BcmAction[];
  sourceKind: "risk" | "incident" | "exercise";
  sourceId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BcmAction | null>(null);
  const create = useCreateBcm("bcm_actions");
  const update = useUpdateBcm("bcm_actions");
  const del = useDeleteBcm("bcm_actions");

  const idColumn = sourceKind === "risk" ? "risk_id" : sourceKind === "incident" ? "incident_id" : "exercise_id";
  const mine = actions.filter((a) => (a as unknown as Record<string, string | null>)[idColumn] === sourceId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Corrective actions ({mine.length})
        </div>
        <Button size="sm" variant="ghost" className="no-print" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add action
        </Button>
      </div>

      {mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {compact ? "No actions yet." : "No corrective actions yet — every gap needs an owner and a due date."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {mine.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
              <button className="flex-1 text-left hover:underline" onClick={() => { setEdit(a); setOpen(true); }}>
                {a.action}
              </button>
              {a.owner_name && <span className="text-xs text-muted-foreground">{a.owner_name}</span>}
              {a.due_date && (
                <Badge variant={isOverdueAction(a) ? "destructive" : "secondary"} className="text-[11px]">
                  {a.due_date}
                </Badge>
              )}
              <Badge variant={a.status === "done" ? "default" : "outline"} className="text-[11px]">
                {a.status.replace("_", " ")}
              </Badge>
              <Button size="icon" variant="ghost" className="no-print h-7 w-7" onClick={() => del.mutate(a.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={edit ? "Edit corrective action" : "Add corrective action"}
        fields={ACTION_FIELDS}
        initial={edit ? ({ ...edit } as Record<string, unknown>) : { status: "open" }}
        onSubmit={async (v) => {
          const patch = normalise(ACTION_FIELDS, v);
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync({ ...patch, source_kind: sourceKind, [idColumn]: sourceId });
        }}
      />
    </div>
  );
}
