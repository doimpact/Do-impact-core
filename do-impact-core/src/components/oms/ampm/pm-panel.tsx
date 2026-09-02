import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PM_FREQUENCIES,
  PM_TASK_FIELDS,
  PM_TYPES,
  WORK_KINDS,
  WORK_ORDER_FIELDS,
  WORK_RESULTS,
  pmCompliance,
  type AmpmEquipment,
  type AmpmPmTask,
  type AmpmWorkOrder,
  type FieldSpec,
} from "@/lib/ampm";
import { RecordDialog, normalise } from "@/components/oms/bcm/record-dialog";
import { useCreateAmpm, useDeleteAmpm, useUpdateAmpm } from "./use-ampm";

function label(list: { key: string; label: string }[], key: string) {
  return list.find((l) => l.key === key)?.label ?? key;
}

export function PmPanel({
  equipment,
  tasks,
  orders,
}: {
  equipment: AmpmEquipment[];
  tasks: AmpmPmTask[];
  orders: AmpmWorkOrder[];
}) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [woOpen, setWoOpen] = useState(false);
  const [editTask, setEditTask] = useState<AmpmPmTask | null>(null);
  const [editWo, setEditWo] = useState<AmpmWorkOrder | null>(null);

  const createTask = useCreateAmpm("ampm_pm_tasks");
  const updateTask = useUpdateAmpm("ampm_pm_tasks");
  const delTask = useDeleteAmpm("ampm_pm_tasks");
  const createWo = useCreateAmpm("ampm_work_orders");
  const updateWo = useUpdateAmpm("ampm_work_orders");
  const delWo = useDeleteAmpm("ampm_work_orders");

  const nameOf = useMemo(() => {
    const m = new Map(equipment.map((e) => [e.id, e.name]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [equipment]);

  const equipOptions = useMemo(() => equipment.map((e) => ({ key: e.id, label: e.name })), [equipment]);

  const taskFields: FieldSpec[] = useMemo(
    () => [{ name: "equipment_id", label: "Equipment", kind: "select", options: equipOptions }, ...PM_TASK_FIELDS],
    [equipOptions],
  );
  const woFields: FieldSpec[] = useMemo(
    () => [{ name: "equipment_id", label: "Equipment", kind: "select", options: equipOptions }, ...WORK_ORDER_FIELDS],
    [equipOptions],
  );

  const compliance = pmCompliance(tasks);
  const now = new Date();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">PM schedule</h3>
            <p className="text-sm text-muted-foreground">
              Planned technical maintenance owned by maintenance. PM compliance {compliance.pct}% · {compliance.overdue} overdue
              of {compliance.due} scheduled.
            </p>
          </div>
          <Button className="no-print" onClick={() => { setEditTask(null); setTaskOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add PM task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No PM tasks defined yet. Start with every A and B asset.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Task</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Last</th>
                  <th className="p-3">Next due</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Hrs</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue = t.next_due && new Date(t.next_due) < now && t.status === "active";
                  return (
                    <tr key={t.id} className="border-t align-top">
                      <td className="max-w-[20rem] p-3">
                        <button className="text-left font-medium hover:underline" onClick={() => { setEditTask(t); setTaskOpen(true); }}>
                          {t.task}
                        </button>
                        {t.downtime_required && <div className="text-xs text-muted-foreground">Downtime required</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{nameOf(t.equipment_id)}</td>
                      <td className="p-3 text-muted-foreground">{label(PM_TYPES, t.pm_type)}</td>
                      <td className="p-3 text-muted-foreground">{label(PM_FREQUENCIES, t.frequency)}</td>
                      <td className="p-3 text-muted-foreground">{t.last_completed || "—"}</td>
                      <td className={cn("p-3", overdue && "font-semibold text-destructive")}>{t.next_due || "—"}</td>
                      <td className="p-3">{t.owner_name || <span className="text-destructive">Unassigned</span>}</td>
                      <td className="p-3 text-muted-foreground">{t.estimated_hours ?? "—"}</td>
                      <td className="p-3 no-print">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => delTask.mutate(t.id)}>
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
            <h3 className="text-lg font-semibold">Work orders</h3>
            <p className="text-sm text-muted-foreground">
              Findings, parts, hours and verification. Planned versus emergency hours is the honest measure of control.
            </p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => { setEditWo(null); setWoOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add work order
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No work orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">WO</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Scheduled</th>
                  <th className="p-3">Actual</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Result</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t align-top">
                    <td className="p-3">
                      <button className="text-left font-medium hover:underline" onClick={() => { setEditWo(o); setWoOpen(true); }}>
                        {o.wo_ref || "Work order"}
                      </button>
                      {o.findings && <div className="max-w-[18rem] text-xs text-muted-foreground">{o.findings}</div>}
                    </td>
                    <td className="p-3 text-muted-foreground">{nameOf(o.equipment_id)}</td>
                    <td className="p-3 text-muted-foreground">{label(WORK_KINDS, o.work_kind)}</td>
                    <td className="p-3 text-muted-foreground">{o.scheduled_date || "—"}</td>
                    <td className="p-3 text-muted-foreground">{o.actual_date || "—"}</td>
                    <td className="p-3 text-muted-foreground">{o.technician || "—"}</td>
                    <td className="p-3 text-muted-foreground">{o.labour_hours ?? "—"}</td>
                    <td className="p-3">
                      <Badge
                        className={cn(
                          o.result === "fail" && "bg-red-600 text-white",
                          o.result === "conditional" && "bg-amber-400 text-amber-950",
                          o.result === "pass" && "bg-emerald-500 text-white",
                        )}
                      >
                        {label(WORK_RESULTS, o.result)}
                      </Badge>
                    </td>
                    <td className="p-3 no-print">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => delWo.mutate(o.id)}>
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
        open={taskOpen}
        onOpenChange={setTaskOpen}
        title={editTask ? "Edit PM task" : "Add PM task"}
        description="Type, frequency, owner, parts, downtime and safety requirements."
        fields={taskFields}
        initial={
          editTask
            ? ({ ...editTask } as Record<string, unknown>)
            : { pm_type: "inspection", frequency: "monthly", status: "active", downtime_required: false }
        }
        onSubmit={async (v) => {
          const patch = normalise(taskFields, v);
          if (editTask) await updateTask.mutateAsync({ id: editTask.id, patch });
          else await createTask.mutateAsync(patch);
        }}
      />

      <RecordDialog
        open={woOpen}
        onOpenChange={setWoOpen}
        title={editWo ? "Edit work order" : "Add work order"}
        description="Record what was found, what was replaced and whether the asset is safe to return to production."
        fields={woFields}
        initial={
          editWo
            ? ({ ...editWo } as Record<string, unknown>)
            : { work_kind: "planned", result: "pass", status: "open", supervisor_verified: false }
        }
        onSubmit={async (v) => {
          const patch = normalise(woFields, v);
          if (editWo) await updateWo.mutateAsync({ id: editWo.id, patch });
          else await createWo.mutateAsync(patch);
        }}
      />
    </div>
  );
}
