import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import { confirmThen } from "@/components/confirm-dialog";
import { Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTROL_LEVELS,
  STATUSES,
  closureBlockers,
  riskBand,
  sourceLabel,
  typeLabel,
  type SafetyReport,
  type SafetyStatus,
} from "@/lib/safety";
import { RiskPicker } from "./risk-picker";
import { useDeleteReport, useSignedPhoto, useUpdateReport } from "./use-safety";

const NONE = "__none";

export function ReportDetail({ report, onClose }: { report: SafetyReport | null; onClose: () => void }) {
  const update = useUpdateReport();
  const del = useDeleteReport();
  const [form, setForm] = useState<SafetyReport | null>(report);
  const { data: photoUrl } = useSignedPhoto(report?.photo_path ?? null);

  useEffect(() => setForm(report), [report]);

  if (!report || !form) return null;
  const band = riskBand(form.severity * form.likelihood);

  const set = <K extends keyof SafetyReport>(k: K, v: SafetyReport[K]) => setForm({ ...form, [k]: v });

  function save() {
    if (!form) return;
    if (form.status === "closed") {
      const missing = closureBlockers(form);
      if (missing.length > 0) {
        toast.error(`Cannot close without ${missing.join(", ")}.`);
        return;
      }
    }
    update.mutate(
      {
        id: form.id,
        patch: {
          severity: form.severity,
          likelihood: form.likelihood,
          immediate_control: form.immediate_control,
          permanent_action: form.permanent_action,
          control_level: form.control_level,
          owner_id: form.owner_id,
          due_date: form.due_date || null,
          status: form.status,
          verified_by: form.verified_by,
          effectiveness: form.effectiveness,
          closed_at: form.status === "closed" ? form.closed_at || new Date().toISOString().slice(0, 10) : null,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Sheet open={!!report} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{report.ref ?? "—"}</span>
            {typeLabel(report.report_type)}
          </SheetTitle>
          <SheetDescription>
            {sourceLabel(report.source)} · {new Date(report.occurred_at).toLocaleString()} ·{" "}
            {report.location || "No location"} · {report.department || "No department"} ·{" "}
            {report.anonymous ? "Anonymous" : report.reporter_name || "Reporter not named"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <section className="rounded-lg border p-3 text-sm">
            <p className="whitespace-pre-wrap">{report.description}</p>
            {report.immediate_action && (
              <p className="mt-2 text-muted-foreground"><span className="font-medium text-foreground">Immediate action:</span> {report.immediate_action}</p>
            )}
            {report.potential_consequence && (
              <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Could have caused:</span> {report.potential_consequence}</p>
            )}
            {photoUrl && (
              <img src={photoUrl} alt="Reported hazard" loading="lazy" className="mt-3 max-h-64 rounded-md border object-contain" />
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4" /> Risk assessment
              <Badge className={cn("border-0", band.className)}>{band.label}</Badge>
            </div>
            <RiskPicker
              severity={form.severity}
              likelihood={form.likelihood}
              onChange={(r) => setForm({ ...form, severity: r.severity, likelihood: r.likelihood })}
            />
          </section>

          <section className="space-y-3">
            <div className="text-sm font-semibold">Corrective action</div>
            <div className="space-y-1.5">
              <Label>Immediate control</Label>
              <Textarea rows={2} value={form.immediate_control ?? ""} onChange={(e) => set("immediate_control", e.target.value)} maxLength={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>Permanent action</Label>
              <Textarea
                rows={2}
                value={form.permanent_action ?? ""}
                onChange={(e) => set("permanent_action", e.target.value)}
                placeholder="Install fixed pedestrian barrier between forklift aisle and walkway."
                maxLength={1000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hierarchy of controls</Label>
              <Select value={form.control_level ?? NONE} onValueChange={(v) => set("control_level", v === NONE ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select control level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not set</SelectItem>
                  {CONTROL_LEVELS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label} — {c.hint}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <OwnerSelect value={form.owner_id} onChange={(v) => set("owner_id", v)} />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as SafetyStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-sm font-semibold">Verification</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Verified by</Label>
                <Input value={form.verified_by ?? ""} onChange={(e) => set("verified_by", e.target.value)} placeholder="EHS manager" maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label>Closure date</Label>
                <Input type="date" value={form.closed_at ?? ""} onChange={(e) => set("closed_at", e.target.value || null)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Effectiveness</Label>
              <Textarea
                rows={2}
                value={form.effectiveness ?? ""}
                onChange={(e) => set("effectiveness", e.target.value)}
                placeholder="Observed the area during production after the control was installed — pedestrians stay behind the barrier."
                maxLength={1000}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              An action is not closed until effectiveness is verified. Closing requires an owner, a due date and a recorded verification.
            </p>
          </section>

          <div className="flex items-center justify-between gap-2 pb-6">
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() =>
                confirmThen("Delete this safety record? This cannot be undone.", () => {
                  del.mutate(report.id, { onSuccess: onClose });
                })
              }
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={save} disabled={update.isPending}>Save</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
