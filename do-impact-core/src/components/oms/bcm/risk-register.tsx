import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  IMPACT_SCALE,
  LIKELIHOOD_SCALE,
  RISK_CATEGORIES,
  RISK_FIELDS,
  bcmRiskBand,
  type BcmAction,
  type BcmRisk,
} from "@/lib/bcm";
import { RecordDialog, normalise } from "./record-dialog";
import { ActionList } from "./action-list";
import { useCreateBcm, useDeleteBcm, useUpdateBcm } from "./use-bcm";

function ScorePicker({
  likelihood,
  impact,
  onChange,
}: {
  likelihood: number;
  impact: number;
  onChange: (v: { likelihood: number; impact: number }) => void;
}) {
  const band = bcmRiskBand(likelihood * impact);
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Likelihood</Label>
          <div className="flex flex-wrap gap-1">
            {LIKELIHOOD_SCALE.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => onChange({ likelihood: s.n, impact })}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  likelihood === s.n ? "border-primary bg-primary/10 font-semibold" : "text-muted-foreground",
                )}
              >
                {s.n} · {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Business impact</Label>
          <div className="flex flex-wrap gap-1">
            {IMPACT_SCALE.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => onChange({ likelihood, impact: s.n })}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs",
                  impact === s.n ? "border-primary bg-primary/10 font-semibold" : "text-muted-foreground",
                )}
              >
                {s.n} · {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={band.className}>
          {likelihood} × {impact} = {likelihood * impact} · {band.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{band.action}</span>
      </div>
    </div>
  );
}

export function RiskRegister({ risks, actions }: { risks: BcmRisk[]; actions: BcmAction[] }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<BcmRisk | null>(null);
  const [score, setScore] = useState({ likelihood: 3, impact: 3 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cat, setCat] = useState("all");
  const create = useCreateBcm("bcm_risks");
  const update = useUpdateBcm("bcm_risks");
  const del = useDeleteBcm("bcm_risks");

  const rows = cat === "all" ? risks : risks.filter((r) => r.category === cat);

  function openNew() {
    setEdit(null);
    setScore({ likelihood: 3, impact: 3 });
    setOpen(true);
  }
  function openEdit(r: BcmRisk) {
    setEdit(r);
    setScore({ likelihood: r.likelihood, impact: r.impact });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Continuity risk register</h3>
          <p className="text-sm text-muted-foreground">
            Risk = likelihood × business impact. High and critical risks need a mitigation and a recovery action.
          </p>
        </div>
        <Button className="no-print" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add risk
        </Button>
      </div>

      <div className="no-print flex flex-wrap gap-2">
        {[{ key: "all", label: "All" }, ...RISK_CATEGORIES].map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              cat === c.key ? "border-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No risks recorded yet. Start with the top ten things that could stop the plant.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const band = bcmRiskBand(r.risk_score);
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="rounded-lg border">
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <Badge className={band.className}>{r.risk_score}</Badge>
                  <button className="flex-1 text-left font-medium hover:underline" onClick={() => setExpanded(isOpen ? null : r.id)}>
                    {r.risk}
                  </button>
                  <Badge variant="outline" className="text-[11px]">
                    {RISK_CATEGORIES.find((c) => c.key === r.category)?.label ?? r.category}
                  </Badge>
                  {r.owner_name && <span className="text-xs text-muted-foreground">{r.owner_name}</span>}
                  {r.due_date && <span className="text-xs text-muted-foreground">{r.due_date}</span>}
                  <Badge variant="secondary" className="text-[11px]">{r.status.replace("_", " ")}</Badge>
                  <Button size="sm" variant="outline" className="no-print" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button size="icon" variant="ghost" className="no-print h-8 w-8" onClick={() => del.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {isOpen && (
                  <div className="space-y-3 border-t p-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Cause" value={r.cause} />
                      <Field label="Potential consequence" value={r.consequence} />
                      <Field label="Affected process" value={r.affected_process} />
                      <Field label="Existing controls" value={r.existing_controls} />
                      <Field label="Preventive action" value={r.preventive_action} />
                      <Field label="Recovery action" value={r.recovery_action} />
                      <Field label="Residual risk" value={r.residual_risk} />
                    </div>
                    <ActionList actions={actions} sourceKind="risk" sourceId={r.id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        title={edit ? "Edit continuity risk" : "Add continuity risk"}
        fields={RISK_FIELDS}
        initial={edit ? ({ ...edit } as Record<string, unknown>) : { category: "facility", status: "open" }}
        extra={<ScorePicker likelihood={score.likelihood} impact={score.impact} onChange={setScore} />}
        onSubmit={async (v) => {
          const patch = { ...normalise(RISK_FIELDS, v), likelihood: score.likelihood, impact: score.impact };
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync(patch);
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}
