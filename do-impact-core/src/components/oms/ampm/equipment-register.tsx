import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AM_LEVELS,
  EQUIPMENT_FIELDS,
  EQUIP_CRITICALITY,
  conditionMeta,
  equipCriticalityMeta,
  type AmpmEquipment,
} from "@/lib/ampm";
import { RecordDialog, normalise } from "@/components/oms/bcm/record-dialog";
import { useCreateAmpm, useDeleteAmpm, useUpdateAmpm } from "./use-ampm";

export function EquipmentRegister({ equipment }: { equipment: AmpmEquipment[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AmpmEquipment | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const create = useCreateAmpm("ampm_equipment");
  const update = useUpdateAmpm("ampm_equipment");
  const del = useDeleteAmpm("ampm_equipment");

  const rows = filter === "all" ? equipment : equipment.filter((e) => e.criticality === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Equipment register</h3>
          <p className="text-sm text-muted-foreground">
            Criticality drives PM frequency, spares, monitoring and response priority. Everything downstream depends on
            this list being right.
          </p>
        </div>
        <Button className="no-print" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add equipment
        </Button>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {[{ key: "all", label: "All" }, ...EQUIP_CRITICALITY.map((c) => ({ key: c.key as string, label: c.label }))].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              filter === f.key ? "border-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No equipment registered yet. Start with the assets that stop the plant when they stop.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Location</th>
                <th className="p-3">Criticality</th>
                <th className="p-3">AM level</th>
                <th className="p-3">Condition</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Maintenance</th>
                <th className="p-3">Next PM</th>
                <th className="p-3 no-print" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const crit = equipCriticalityMeta(e.criticality);
                const cond = conditionMeta(e.condition_rating);
                const level = AM_LEVELS.find((l) => l.n === e.am_level);
                return (
                  <tr key={e.id} className="border-t align-top">
                    <td className="p-3">
                      <button className="text-left font-medium hover:underline" onClick={() => { setEdit(e); setOpen(true); }}>
                        {e.name}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {[e.equipment_code, e.manufacturer, e.model].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{[e.department, e.location].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="p-3"><Badge className={crit.className}>{crit.label}</Badge></td>
                    <td className="p-3 text-muted-foreground">{level ? level.label : "—"}</td>
                    <td className="p-3"><Badge className={cond.className}>{cond.label}</Badge></td>
                    <td className="p-3">{e.primary_operator || <span className="text-destructive">Unassigned</span>}</td>
                    <td className="p-3">{e.maintenance_owner || <span className="text-destructive">Unassigned</span>}</td>
                    <td className="p-3 text-muted-foreground">{e.next_pm || "—"}</td>
                    <td className="p-3 no-print">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del.mutate(e.id)}>
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

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={edit ? "Edit equipment" : "Add equipment"}
        description="Master record — identity, criticality, ownership, AM/PM programme, spares and condition."
        fields={EQUIPMENT_FIELDS}
        initial={edit ? ({ ...edit } as Record<string, unknown>) : { criticality: "B", condition_rating: "green", am_level: 1 }}
        onSubmit={async (v) => {
          const patch = normalise(EQUIPMENT_FIELDS, v);
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync(patch);
        }}
      />
    </div>
  );
}
