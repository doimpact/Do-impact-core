import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flag, Plus, RefreshCw, Trash2, Pencil } from "lucide-react";
import { useCppMutations, useCppRows } from "./use-cpp";
import { TASK_STATUSES, type CppTask, type CppVisit } from "./types";

const NONE = "__none";

type Form = {
  title: string;
  work_area: string;
  planned_hours: number;
  earned_hours: number;
  status: string;
  owner_name: string;
  predecessor_id: string;
  on_critical_path: boolean;
  red_tagged: boolean;
  non_routine_type: string;
  reevaluation_note: string;
};

const empty: Form = {
  title: "",
  work_area: "",
  planned_hours: 0,
  earned_hours: 0,
  status: "not_started",
  owner_name: "",
  predecessor_id: NONE,
  on_critical_path: false,
  red_tagged: false,
  non_routine_type: NONE,
  reevaluation_note: "",
};

export function TaskBoard({ visit, readOnly }: { visit: CppVisit; readOnly: boolean }) {
  const q = useCppRows<CppTask>("cpp_tasks", visit.id, "sort_order");
  const { create, update, remove } = useCppMutations("cpp_tasks", visit.id);
  const [editing, setEditing] = useState<CppTask | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const tasks = q.data ?? [];
  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const rank = (t: CppTask) => (t.on_critical_path && t.red_tagged ? 0 : t.on_critical_path ? 1 : 2);
        return rank(a) - rank(b) || a.sort_order - b.sort_order;
      }),
    [tasks],
  );

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }
  function openEdit(t: CppTask) {
    setEditing(t);
    setForm({
      title: t.title,
      work_area: t.work_area ?? "",
      planned_hours: Number(t.planned_hours),
      earned_hours: Number(t.earned_hours),
      status: t.status,
      owner_name: t.owner_name ?? "",
      predecessor_id: t.predecessor_id ?? NONE,
      on_critical_path: t.on_critical_path,
      red_tagged: t.red_tagged,
      non_routine_type: t.non_routine_type ?? NONE,
      reevaluation_note: t.reevaluation_note ?? "",
    });
    setOpen(true);
  }

  function save() {
    const payload = {
      title: form.title.trim() || "Untitled card",
      work_area: form.work_area || null,
      planned_hours: form.planned_hours,
      earned_hours: form.earned_hours,
      status: form.status,
      owner_name: form.owner_name || null,
      predecessor_id: form.predecessor_id === NONE ? null : form.predecessor_id,
      on_critical_path: form.on_critical_path,
      red_tagged: form.red_tagged,
      non_routine_type: form.non_routine_type === NONE ? null : form.non_routine_type,
      reevaluation_note: form.reevaluation_note || null,
    };
    if (editing) update.mutate({ id: editing.id, patch: payload }, { onSuccess: () => setOpen(false) });
    else create.mutate({ ...payload, sort_order: tasks.length }, { onSuccess: () => setOpen(false) });
  }

  function reevaluate() {
    const stamp = new Date().toISOString();
    tasks
      .filter((t) => t.on_critical_path || t.non_routine_type)
      .forEach((t) => update.mutate({ id: t.id, patch: { reevaluated_at: stamp } }));
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Flag className="h-4 w-4" /> Critical path and red-tagged cards
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            The critical path is the continuous sequence that dictates redelivery. After open-and-inspect, re-evaluate it
            against heavy non-routines and long-lead parts, then red-tag those cards so the floor works them first.
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reevaluate}>
              <RefreshCw className="h-4 w-4 mr-1" /> Re-evaluate
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Card
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {sorted.length === 0 && <p className="text-sm text-muted-foreground">No task cards yet.</p>}
        {sorted.map((t) => {
          const pct = Number(t.planned_hours) > 0 ? Math.min(100, (Number(t.earned_hours) / Number(t.planned_hours)) * 100) : 0;
          return (
            <div
              key={t.id}
              className={`rounded-md border p-3 ${
                t.red_tagged ? "border-red-500/60 bg-red-500/5" : t.on_critical_path ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t.title}</span>
                {t.on_critical_path && <Badge variant="secondary">Critical path</Badge>}
                {t.red_tagged && <Badge variant="destructive">Red tag</Badge>}
                {t.non_routine_type && <Badge variant="outline">{t.non_routine_type.replace("_", " ")}</Badge>}
                <Badge variant="outline">{TASK_STATUSES.find((s) => s.key === t.status)?.label ?? t.status}</Badge>
                {!readOnly && (
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {t.work_area && <span>{t.work_area}</span>}
                {t.owner_name && <span>Owner: {t.owner_name}</span>}
                <span>
                  {Number(t.earned_hours).toFixed(1)} / {Number(t.planned_hours).toFixed(1)} earned hours
                </span>
                {t.predecessor_id && <span>After: {tasks.find((x) => x.id === t.predecessor_id)?.title ?? "—"}</span>}
                {t.reevaluated_at && <span>Re-evaluated {new Date(t.reevaluated_at).toLocaleDateString()}</span>}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${t.red_tagged ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {t.reevaluation_note && <p className="mt-2 text-xs text-muted-foreground">{t.reevaluation_note}</p>}
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit card" : "New task card"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Work area</Label>
              <Input value={form.work_area} onChange={(e) => setForm({ ...form, work_area: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Owner</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Planned hours</Label>
              <Input
                type="number"
                step="0.5"
                value={form.planned_hours}
                onChange={(e) => setForm({ ...form, planned_hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Earned hours</Label>
              <Input
                type="number"
                step="0.5"
                value={form.earned_hours}
                onChange={(e) => setForm({ ...form, earned_hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Predecessor card</Label>
              <Select value={form.predecessor_id} onValueChange={(v) => setForm({ ...form, predecessor_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {tasks.filter((t) => t.id !== editing?.id).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Non-routine</Label>
              <Select value={form.non_routine_type} onValueChange={(v) => setForm({ ...form, non_routine_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Routine</SelectItem>
                  <SelectItem value="structural_repair">Major structural repair</SelectItem>
                  <SelectItem value="long_lead_part">Long-lead part</SelectItem>
                  <SelectItem value="other">Other non-routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="cp"
                type="checkbox"
                checked={form.on_critical_path}
                onChange={(e) => setForm({ ...form, on_critical_path: e.target.checked })}
              />
              <Label htmlFor="cp" className="text-sm">On critical path</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="rt"
                type="checkbox"
                checked={form.red_tagged}
                onChange={(e) => setForm({ ...form, red_tagged: e.target.checked })}
              />
              <Label htmlFor="rt" className="text-sm">Red-tagged</Label>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">Re-evaluation note</Label>
              <Textarea
                rows={2}
                value={form.reevaluation_note}
                onChange={(e) => setForm({ ...form, reevaluation_note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
