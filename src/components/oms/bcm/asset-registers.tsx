import { useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASSET_KINDS, assetFields, criticalityMeta, type AssetKind, type BcmAsset } from "@/lib/bcm";
import { RecordDialog, splitDetails } from "./record-dialog";
import { useCreateBcm, useDeleteBcm, useUpdateBcm } from "./use-bcm";

export function AssetRegisters({ assets }: { assets: BcmAsset[] }) {
  const [kind, setKind] = useState<AssetKind>("equipment");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BcmAsset | null>(null);
  const create = useCreateBcm("bcm_assets");
  const update = useUpdateBcm("bcm_assets");
  const del = useDeleteBcm("bcm_assets");

  const meta = ASSET_KINDS.find((k) => k.key === kind)!;
  const fields = assetFields(kind);
  const rows = assets.filter((a) => a.asset_kind === kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Continuity registers</h3>
          <p className="text-sm text-muted-foreground">
            Equipment, suppliers, skills and IT systems — each one needs a named backup or an accepted risk.
          </p>
        </div>
        <Button className="no-print" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add {meta.singular}
        </Button>
      </div>

      <div className="no-print flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
        {ASSET_KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              kind === k.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k.label}
            <span className="ml-2 text-xs text-muted-foreground">
              {assets.filter((a) => a.asset_kind === k.key).length}
            </span>
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{meta.hint}</p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing recorded in this register yet.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => {
            const cm = criticalityMeta(a.criticality);
            const details = a.details ?? {};
            return (
              <div key={a.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={cm.className}>{cm.label}</Badge>
                  <button className="flex-1 text-left font-medium hover:underline" onClick={() => { setEdit(a); setOpen(true); }}>
                    {a.name}
                  </button>
                  {a.has_backup_strategy ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Backup in place
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> No backup strategy
                    </span>
                  )}
                  {a.recovery_time_hours !== null && (
                    <Badge variant="outline" className="text-[11px]">Recovery {a.recovery_time_hours} h</Badge>
                  )}
                  {kind === "it_system" && a.rpo_hours !== null && (
                    <Badge variant="outline" className="text-[11px]">RPO {a.rpo_hours} h</Badge>
                  )}
                  {a.last_tested && <span className="text-xs text-muted-foreground">Tested {a.last_tested}</span>}
                  <Button size="icon" variant="ghost" className="no-print h-8 w-8" onClick={() => del.mutate(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {(a.department || a.process) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[a.department, a.process].filter(Boolean).join(" · ")}
                  </div>
                )}
                {a.recovery_strategy && <p className="mt-2 text-sm">{a.recovery_strategy}</p>}
                {Object.keys(details).length > 0 && (
                  <dl className="mt-3 grid gap-x-6 gap-y-1 border-t pt-2 text-sm sm:grid-cols-2">
                    {fields
                      .filter((f) => f.detail && details[f.name])
                      .map((f) => (
                        <div key={f.name} className="flex gap-2">
                          <dt className="text-muted-foreground">{f.label}:</dt>
                          <dd>{details[f.name]}</dd>
                        </div>
                      ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={edit ? `Edit ${meta.singular}` : `Add ${meta.singular}`}
        fields={fields}
        initial={
          edit
            ? ({ ...edit, ...(edit.details ?? {}) } as Record<string, unknown>)
            : { criticality: "high", has_backup_strategy: false }
        }
        onSubmit={async (v) => {
          const { cols, details } = splitDetails(fields, v);
          const patch = { ...cols, details, asset_kind: kind };
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync(patch);
        }}
      />
    </div>
  );
}
