import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Plus, Trash2 } from "lucide-react";
import { useCppMutations, useCppRows } from "./use-cpp";
import {
  BLOCKER_TYPES,
  SUPPORT_FUNCTIONS,
  responseState,
  type CppBlocker,
  type CppTask,
  type CppVisit,
} from "./types";

const NONE = "__none";

export function BlockerLog({ visit, readOnly }: { visit: CppVisit; readOnly: boolean }) {
  const q = useCppRows<CppBlocker>("cpp_blockers", visit.id, "raised_at", false);
  const tasksQ = useCppRows<CppTask>("cpp_tasks", visit.id, "sort_order");
  const { create, update, remove } = useCppMutations("cpp_blockers", visit.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    task_id: NONE,
    blocker_type: "material",
    support_function: "materials",
    description: "",
    target_response_minutes: 30,
  });

  const blockers = q.data ?? [];
  const tasks = tasksQ.data ?? [];

  const summary = SUPPORT_FUNCTIONS.map((f) => {
    const rows = blockers.filter((b) => b.support_function === f.key && b.responded_at);
    const avg = rows.length
      ? Math.round(
          rows.reduce((s, b) => s + (new Date(b.responded_at as string).getTime() - new Date(b.raised_at).getTime()) / 60000, 0) /
            rows.length,
        )
      : null;
    const breached = blockers.filter(
      (b) =>
        b.support_function === f.key &&
        (b.responded_at
          ? (new Date(b.responded_at).getTime() - new Date(b.raised_at).getTime()) / 60000 > b.target_response_minutes
          : (Date.now() - new Date(b.raised_at).getTime()) / 60000 > b.target_response_minutes && !b.cleared_at),
    ).length;
    return { ...f, avg, breached };
  });

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" /> Dockside support and escalation timelines
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Planning, engineering and quality sit at the bay during open-and-inspect. Each blocker carries a target
            response time so support clears critical path jobs before the shift schedule is hit.
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Blocker
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <div key={s.key} className="rounded-md border bg-muted/30 p-3">
            <div className="text-xl font-bold">{s.avg === null ? "—" : `${s.avg}m`}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{s.label} avg response</div>
            {s.breached > 0 && <div className="text-xs text-red-600 mt-1">{s.breached} past target</div>}
          </div>
        ))}
      </div>

      {open && !readOnly && (
        <div className="rounded-md border bg-muted/30 p-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Task card</Label>
            <Select value={form.task_id} onValueChange={(v) => setForm({ ...form, task_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not linked</SelectItem>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Blocker type</Label>
            <Select value={form.blocker_type} onValueChange={(v) => setForm({ ...form, blocker_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCKER_TYPES.map((b) => (
                  <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Support function</Label>
            <Select value={form.support_function} onValueChange={(v) => setForm({ ...form, support_function: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORT_FUNCTIONS.map((f) => (
                  <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target response (minutes)</Label>
            <Input
              type="number"
              value={form.target_response_minutes}
              onChange={(e) => setForm({ ...form, target_response_minutes: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() =>
                create.mutate(
                  {
                    task_id: form.task_id === NONE ? null : form.task_id,
                    blocker_type: form.blocker_type,
                    support_function: form.support_function,
                    target_response_minutes: form.target_response_minutes,
                    description: form.description || null,
                  },
                  { onSuccess: () => setOpen(false) },
                )
              }
            >
              Raise blocker
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {blockers.length === 0 && <p className="text-sm text-muted-foreground">No blockers raised.</p>}
        {blockers.map((b) => {
          const state = responseState(b);
          const task = tasks.find((t) => t.id === b.task_id);
          return (
            <div key={b.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">{BLOCKER_TYPES.find((x) => x.key === b.blocker_type)?.label ?? b.blocker_type}</Badge>
                <Badge variant="secondary">{SUPPORT_FUNCTIONS.find((x) => x.key === b.support_function)?.label}</Badge>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${state.className}`}>{state.label}</span>
                {task && (
                  <span className={task.on_critical_path ? "font-medium text-red-600" : "text-muted-foreground"}>
                    {task.title}
                    {task.on_critical_path ? " (critical path)" : ""}
                  </span>
                )}
                {!readOnly && (
                  <div className="ml-auto flex gap-2">
                    {!b.responded_at && (
                      <Button size="sm" variant="outline" onClick={() => update.mutate({ id: b.id, patch: { responded_at: new Date().toISOString() } })}>
                        Responded
                      </Button>
                    )}
                    {!b.cleared_at && (
                      <Button size="sm" onClick={() => update.mutate({ id: b.id, patch: { cleared_at: new Date().toISOString(), responded_at: b.responded_at ?? new Date().toISOString() } })}>
                        Clear
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Raised {new Date(b.raised_at).toLocaleString()} · target {b.target_response_minutes} min
              </div>
              {b.description && <p className="mt-1 text-sm">{b.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
