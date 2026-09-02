import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Timer, Trash2 } from "lucide-react";
import { useCppMutations, useCppRows } from "./use-cpp";
import type { CppPulseCheck, CppVisit } from "./types";

export function PulseLog({ visit, readOnly }: { visit: CppVisit; readOnly: boolean }) {
  const q = useCppRows<CppPulseCheck>("cpp_pulse_checks", visit.id, "check_at", false);
  const { create, remove } = useCppMutations("cpp_pulse_checks", visit.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ planned_hours: 0, earned_hours: 0, stopped: false, note: "" });

  const checks = q.data ?? [];
  const planned = checks.reduce((s, c) => s + Number(c.planned_hours || 0), 0);
  const earned = checks.reduce((s, c) => s + Number(c.earned_hours || 0), 0);
  const variance = earned - planned;
  const tone =
    variance >= 0 ? "text-emerald-600" : variance > -planned * 0.05 ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4" /> Bay-side pulse (every 2 hours)
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Check planned versus earned hours at the aircraft every two hours. Anything stopped more than 15 minutes for
            tools, materials or an open engineering query gets escalated immediately as a blocker.
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Pulse check
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Planned hours logged" value={planned.toFixed(1)} />
        <Stat label="Earned hours logged" value={earned.toFixed(1)} />
        <Stat label="Cumulative variance" value={`${variance >= 0 ? "+" : ""}${variance.toFixed(1)} h`} className={tone} />
      </div>

      {open && !readOnly && (
        <div className="rounded-md border bg-muted/30 p-4 grid gap-3 sm:grid-cols-2">
          <Field label="Planned hours this window">
            <Input
              type="number"
              step="0.5"
              value={form.planned_hours}
              onChange={(e) => setForm({ ...form, planned_hours: Number(e.target.value) })}
            />
          </Field>
          <Field label="Earned hours this window">
            <Input
              type="number"
              step="0.5"
              value={form.earned_hours}
              onChange={(e) => setForm({ ...form, earned_hours: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2 flex items-center gap-2">
            <Switch
              id="stopped"
              checked={form.stopped}
              onCheckedChange={(v) => setForm({ ...form, stopped: v })}
            />
            <Label htmlFor="stopped" className="text-sm">
              A task was stopped more than 15 minutes
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Field label="Note">
              <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                create.mutate(
                  {
                    planned_hours: form.planned_hours,
                    earned_hours: form.earned_hours,
                    stopped_over_15min: form.stopped,
                    note: form.note || null,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm({ planned_hours: 0, earned_hours: 0, stopped: false, note: "" });
                    },
                  },
                )
              }
            >
              Log check
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {checks.length === 0 && <p className="text-sm text-muted-foreground">No pulse checks logged yet.</p>}
        {checks.map((c) => {
          const v = Number(c.earned_hours) - Number(c.planned_hours);
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="text-muted-foreground w-40 shrink-0">
                {new Date(c.check_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span>
                {Number(c.earned_hours).toFixed(1)} / {Number(c.planned_hours).toFixed(1)} h
              </span>
              <span className={v >= 0 ? "text-emerald-600" : "text-red-600"}>
                {v >= 0 ? "+" : ""}
                {v.toFixed(1)}
              </span>
              {c.stopped_over_15min && <Badge variant="destructive">Stopped &gt; 15 min</Badge>}
              {c.note && <span className="text-muted-foreground truncate">{c.note}</span>}
              {!readOnly && (
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
