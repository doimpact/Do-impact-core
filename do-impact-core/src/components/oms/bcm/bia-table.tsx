import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CRITICALITY, PROCESS_FIELDS, criticalityMeta, type BcmProcess } from "@/lib/bcm";
import { RecordDialog, normalise } from "./record-dialog";
import { useCreateBcm, useDeleteBcm, useUpdateBcm } from "./use-bcm";

function hrs(v: number | null) {
  return v === null || v === undefined ? "—" : `${v} h`;
}

export function BiaTable({ processes }: { processes: BcmProcess[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BcmProcess | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const create = useCreateBcm("bcm_processes");
  const update = useUpdateBcm("bcm_processes");
  const del = useDeleteBcm("bcm_processes");

  const rows = filter === "all" ? processes : processes.filter((p) => p.criticality === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Business Impact Analysis</h3>
          <p className="text-sm text-muted-foreground">
            One row per critical process. Without an owner, an MTD and an RTO, a recovery plan is a wish.
          </p>
        </div>
        <Button className="no-print" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add process
        </Button>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {[{ key: "all", label: "All" }, ...CRITICALITY.map((c) => ({ key: c.key as string, label: c.label }))].map((f) => (
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
          No processes recorded yet. Start with the handful of processes the business cannot survive without.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Process</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Criticality</th>
                <th className="p-3">MTD</th>
                <th className="p-3">RTO</th>
                <th className="p-3">RPO</th>
                <th className="p-3">Single point of failure</th>
                <th className="p-3">BIA</th>
                <th className="p-3 no-print" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const meta = criticalityMeta(p.criticality);
                return (
                  <tr key={p.id} className="border-t align-top">
                    <td className="p-3">
                      <button className="text-left font-medium hover:underline" onClick={() => { setEdit(p); setOpen(true); }}>
                        {p.process}
                      </button>
                      {p.department && <div className="text-xs text-muted-foreground">{p.department}</div>}
                    </td>
                    <td className="p-3">{p.process_owner || <span className="text-destructive">Unassigned</span>}</td>
                    <td className="p-3">
                      <Badge className={meta.className}>{meta.label}</Badge>
                    </td>
                    <td className="p-3">{hrs(p.mtd_hours)}</td>
                    <td className="p-3">{hrs(p.rto_hours)}</td>
                    <td className="p-3">{hrs(p.rpo_hours)}</td>
                    <td className="max-w-[16rem] p-3 text-muted-foreground">{p.single_point_of_failure || "—"}</td>
                    <td className="p-3">
                      <Badge variant={p.bia_complete ? "default" : "outline"}>{p.bia_complete ? "Complete" : "Draft"}</Badge>
                    </td>
                    <td className="p-3 no-print">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del.mutate(p.id)}>
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
        title={edit ? "Edit critical process" : "Add critical process"}
        description="Full BIA template — customers, resources, recovery objectives, dependencies and backups."
        fields={PROCESS_FIELDS}
        initial={edit ? ({ ...edit } as Record<string, unknown>) : { criticality: "high", bia_complete: false, recovery_plan_complete: false }}
        onSubmit={async (v) => {
          const patch = normalise(PROCESS_FIELDS, v);
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync(patch);
        }}
      />
    </div>
  );
}
