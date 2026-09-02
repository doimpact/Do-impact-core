import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LUBRICATION_FIELDS,
  PM_FREQUENCIES,
  SPARE_CRITICALITY,
  SPARE_FIELDS,
  type AmpmEquipment,
  type AmpmLubrication,
  type AmpmSpare,
  type FieldSpec,
} from "@/lib/ampm";
import { RecordDialog, normalise } from "@/components/oms/bcm/record-dialog";
import { useCreateAmpm, useDeleteAmpm, useUpdateAmpm } from "./use-ampm";

export function SparesPanel({
  equipment,
  spares,
  lubrication,
}: {
  equipment: AmpmEquipment[];
  spares: AmpmSpare[];
  lubrication: AmpmLubrication[];
}) {
  const [spareOpen, setSpareOpen] = useState(false);
  const [lubeOpen, setLubeOpen] = useState(false);
  const [editSpare, setEditSpare] = useState<AmpmSpare | null>(null);
  const [editLube, setEditLube] = useState<AmpmLubrication | null>(null);

  const createSpare = useCreateAmpm("ampm_spares");
  const updateSpare = useUpdateAmpm("ampm_spares");
  const delSpare = useDeleteAmpm("ampm_spares");
  const createLube = useCreateAmpm("ampm_lubrication");
  const updateLube = useUpdateAmpm("ampm_lubrication");
  const delLube = useDeleteAmpm("ampm_lubrication");

  const nameOf = useMemo(() => {
    const m = new Map(equipment.map((e) => [e.id, e.name]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [equipment]);

  const equipOptions = useMemo(() => equipment.map((e) => ({ key: e.id, label: e.name })), [equipment]);
  const spareFields: FieldSpec[] = useMemo(
    () => [{ name: "equipment_id", label: "Equipment", kind: "select", options: equipOptions }, ...SPARE_FIELDS],
    [equipOptions],
  );
  const lubeFields: FieldSpec[] = useMemo(
    () => [{ name: "equipment_id", label: "Equipment", kind: "select", options: equipOptions }, ...LUBRICATION_FIELDS],
    [equipOptions],
  );

  const below = spares.filter((s) => (s.current_quantity ?? 0) < (s.min_quantity ?? 0));

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Critical spare parts</h3>
            <p className="text-sm text-muted-foreground">
              {spares.length} parts · {below.length} below minimum. A critical spare on a long lead time is a downtime plan
              waiting to happen.
            </p>
          </div>
          <Button className="no-print" onClick={() => { setEditSpare(null); setSpareOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add spare
          </Button>
        </div>

        {spares.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No spares recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Part</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Criticality</th>
                  <th className="p-3">Min</th>
                  <th className="p-3">On hand</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Lead time</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {spares.map((s) => {
                  const low = (s.current_quantity ?? 0) < (s.min_quantity ?? 0);
                  return (
                    <tr key={s.id} className="border-t align-top">
                      <td className="p-3">
                        <button className="text-left font-medium hover:underline" onClick={() => { setEditSpare(s); setSpareOpen(true); }}>
                          {s.part_name}
                        </button>
                        {s.part_number && <div className="text-xs text-muted-foreground">{s.part_number}</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{nameOf(s.equipment_id)}</td>
                      <td className="p-3">
                        <Badge
                          className={cn(
                            s.criticality === "critical" && "bg-red-600 text-white",
                            s.criticality === "high" && "bg-orange-500 text-white",
                          )}
                          variant={s.criticality === "critical" || s.criticality === "high" ? "default" : "outline"}
                        >
                          {SPARE_CRITICALITY.find((c) => c.key === s.criticality)?.label ?? s.criticality}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{s.min_quantity ?? "—"}</td>
                      <td className={cn("p-3", low && "font-semibold text-destructive")}>{s.current_quantity ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{s.supplier || "—"}</td>
                      <td className="p-3 text-muted-foreground">{s.lead_time_days ? `${s.lead_time_days} d` : "—"}</td>
                      <td className="p-3 text-muted-foreground">{s.storage_location || "—"}</td>
                      <td className="p-3 no-print">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => delSpare.mutate(s.id)}>
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
            <h3 className="text-lg font-semibold">Lubrication programme</h3>
            <p className="text-sm text-muted-foreground">
              Wrong lubricant, wrong quantity and missed points are the classic silent failure causes.
            </p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => { setEditLube(null); setLubeOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add point
          </Button>
        </div>

        {lubrication.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No lubrication points recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Point</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Lubricant</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Responsible</th>
                  <th className="p-3">Last done</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {lubrication.map((l) => (
                  <tr key={l.id} className="border-t align-top">
                    <td className="p-3">
                      <button className="text-left font-medium hover:underline" onClick={() => { setEditLube(l); setLubeOpen(true); }}>
                        {l.point_location}
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground">{nameOf(l.equipment_id)}</td>
                    <td className="p-3 text-muted-foreground">{l.lubricant || "—"}</td>
                    <td className="p-3 text-muted-foreground">{l.grade || "—"}</td>
                    <td className="p-3 text-muted-foreground">{l.quantity || "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {PM_FREQUENCIES.find((f) => f.key === l.frequency)?.label ?? l.frequency}
                    </td>
                    <td className="p-3 text-muted-foreground">{l.responsible || "—"}</td>
                    <td className="p-3 text-muted-foreground">{l.last_done || "—"}</td>
                    <td className="p-3 no-print">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => delLube.mutate(l.id)}>
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
        open={spareOpen}
        onOpenChange={setSpareOpen}
        title={editSpare ? "Edit spare part" : "Add spare part"}
        fields={spareFields}
        initial={editSpare ? ({ ...editSpare } as Record<string, unknown>) : { criticality: "high" }}
        onSubmit={async (v) => {
          const patch = normalise(spareFields, v);
          if (editSpare) await updateSpare.mutateAsync({ id: editSpare.id, patch });
          else await createSpare.mutateAsync(patch);
        }}
      />

      <RecordDialog
        open={lubeOpen}
        onOpenChange={setLubeOpen}
        title={editLube ? "Edit lubrication point" : "Add lubrication point"}
        fields={lubeFields}
        initial={editLube ? ({ ...editLube } as Record<string, unknown>) : { frequency: "weekly" }}
        onSubmit={async (v) => {
          const patch = normalise(lubeFields, v);
          if (editLube) await updateLube.mutateAsync({ id: editLube.id, patch });
          else await createLube.mutateAsync(patch);
        }}
      />
    </div>
  );
}
