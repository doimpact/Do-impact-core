import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AMPM_ACTION_FIELDS,
  AMPM_ACTION_STATUSES,
  ACTION_PRIORITIES,
  BREAKDOWN_FIELDS,
  failureClassMeta,
  mttr,
  type AmpmAction,
  type AmpmBreakdown,
  type AmpmEquipment,
  type FieldSpec,
} from "@/lib/ampm";
import { RecordDialog, normalise } from "@/components/oms/bcm/record-dialog";
import { useCreateAmpm, useDeleteAmpm, useUpdateAmpm } from "./use-ampm";

export function BreakdownsPanel({
  equipment,
  breakdowns,
  actions,
}: {
  equipment: AmpmEquipment[];
  breakdowns: AmpmBreakdown[];
  actions: AmpmAction[];
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AmpmBreakdown | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [editAction, setEditAction] = useState<AmpmAction | null>(null);

  const create = useCreateAmpm("ampm_breakdowns");
  const update = useUpdateAmpm("ampm_breakdowns");
  const del = useDeleteAmpm("ampm_breakdowns");
  const createAction = useCreateAmpm("ampm_actions");
  const updateAction = useUpdateAmpm("ampm_actions");
  const delAction = useDeleteAmpm("ampm_actions");

  const nameOf = useMemo(() => {
    const m = new Map(equipment.map((e) => [e.id, e.name]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [equipment]);

  const fields: FieldSpec[] = useMemo(
    () => [
      { name: "equipment_id", label: "Equipment", kind: "select", options: equipment.map((e) => ({ key: e.id, label: e.name })) },
      ...BREAKDOWN_FIELDS,
    ],
    [equipment],
  );

  const repairAvg = mttr(breakdowns);
  const downtime = breakdowns.reduce((n, b) => n + (b.downtime_hours ?? 0), 0);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Breakdowns & reliability</h3>
            <p className="text-sm text-muted-foreground">
              {breakdowns.length} failures · {downtime.toFixed(1)} h downtime · MTTR {repairAvg ? `${repairAvg.toFixed(1)} h` : "—"}.
              Repeat and chronic failures belong to engineering, not another repair.
            </p>
          </div>
          <Button className="no-print" onClick={() => { setEdit(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Log breakdown
          </Button>
        </div>

        {breakdowns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No breakdowns logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Failure</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">When</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Downtime</th>
                  <th className="p-3">Repair</th>
                  <th className="p-3">Fix</th>
                  <th className="p-3">Root cause</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {breakdowns.map((b) => {
                  const cls = failureClassMeta(b.classification);
                  return (
                    <tr key={b.id} className="border-t align-top">
                      <td className="max-w-[20rem] p-3">
                        <button className="text-left font-medium hover:underline" onClick={() => { setEdit(b); setOpen(true); }}>
                          {b.failure_mode || "Breakdown"}
                        </button>
                        {b.immediate_cause && <div className="text-xs text-muted-foreground">{b.immediate_cause}</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{nameOf(b.equipment_id)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(b.occurred_at).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge className={cls.className}>{cls.label}</Badge>
                        {b.repeat_failure && <Badge variant="outline" className="ml-1">Repeat</Badge>}
                      </td>
                      <td className="p-3 text-muted-foreground">{b.downtime_hours ?? "—"} h</td>
                      <td className="p-3 text-muted-foreground">{b.repair_hours ?? "—"} h</td>
                      <td className="p-3">
                        {b.permanent_fix ? (
                          <Badge className="bg-emerald-500 text-white">Permanent</Badge>
                        ) : b.temporary_fix ? (
                          <Badge className="bg-amber-400 text-amber-950">Temporary</Badge>
                        ) : (
                          <Badge variant="outline">Open</Badge>
                        )}
                      </td>
                      <td className="max-w-[18rem] p-3 text-muted-foreground">
                        {b.root_cause || (b.root_cause_required ? <span className="text-destructive">Required</span> : "—")}
                      </td>
                      <td className="p-3 no-print">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del.mutate(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Corrective & improvement actions</h3>
            <p className="text-sm text-muted-foreground">Every chronic loss needs an owner, a date and a verification.</p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => { setEditAction(null); setActionOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add action
          </Button>
        </div>

        {actions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No actions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id} className="border-t align-top">
                    <td className="max-w-[26rem] p-3">
                      <button className="text-left font-medium hover:underline" onClick={() => { setEditAction(a); setActionOpen(true); }}>
                        {a.action}
                      </button>
                      {a.notes && <div className="text-xs text-muted-foreground">{a.notes}</div>}
                    </td>
                    <td className="p-3">{a.owner_name || <span className="text-destructive">Unassigned</span>}</td>
                    <td className="p-3 text-muted-foreground">{a.due_date || "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {ACTION_PRIORITIES.find((p) => p.n === a.priority)?.label ?? a.priority}
                    </td>
                    <td className="p-3">
                      <Badge variant={a.status === "done" ? "default" : "outline"}>
                        {AMPM_ACTION_STATUSES.find((s) => s.key === a.status)?.label ?? a.status}
                      </Badge>
                    </td>
                    <td className="p-3 no-print">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => delAction.mutate(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={edit ? "Edit breakdown" : "Log breakdown"}
        description="Failure mode, response and repair time, classification, root cause and verification."
        fields={fields}
        initial={
          edit
            ? ({ ...edit } as Record<string, unknown>)
            : {
                classification: "functional",
                status: "open",
                occurred_at: new Date().toISOString().slice(0, 16),
                temporary_fix: false,
                permanent_fix: false,
                repeat_failure: false,
                root_cause_required: false,
              }
        }
        onSubmit={async (v) => {
          const patch = normalise(fields, v);
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync(patch);
        }}
      />

      <RecordDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        title={editAction ? "Edit action" : "Add action"}
        fields={AMPM_ACTION_FIELDS}
        initial={editAction ? ({ ...editAction } as Record<string, unknown>) : { priority: 3, status: "open" }}
        onSubmit={async (v) => {
          const patch = normalise(AMPM_ACTION_FIELDS, v);
          if (editAction) await updateAction.mutateAsync({ id: editAction.id, patch });
          else await createAction.mutateAsync({ ...patch, source_kind: "equipment" });
        }}
      />
    </div>
  );
}
