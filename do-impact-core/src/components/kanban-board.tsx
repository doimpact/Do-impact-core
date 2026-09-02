import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Check, RotateCcw, Archive, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createTask, updateTask, closeTask, reopenTask, archiveTask, deleteTask } from "@/lib/oms.functions";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { confirmThen } from "@/components/confirm-dialog";

type Task = {
  id: string; title: string; description: string | null;
  status: "backlog" | "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "med" | "high" | "urgent";
  due_date: string | null; close_reason: string | null; closed_at: string | null;
  assignee_id: string | null; pillar_id: string; sub_pillar_id: string | null; position: number;
};

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const PRI_COLOR: Record<Task["priority"], string> = {
  low: "bg-slate-100 text-slate-700",
  med: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-800",
};

export function KanbanBoard({ pillarId, tasks }: { pillarId: string; tasks: Task[] }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createTask);
  const updateFn = useServerFn(updateTask);
  const closeFn = useServerFn(closeTask);
  const reopenFn = useServerFn(reopenTask);
  const archiveFn = useServerFn(archiveTask);
  const deleteFn = useServerFn(deleteTask);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("med");
  const [due, setDue] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks", pillarId] });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { pillarId, title, description: desc || null, priority, dueDate: due || null, assigneeId } }),
    onSuccess: () => { toast.success("Task added"); setOpen(false); setTitle(""); setDesc(""); setDue(""); setAssigneeId(null); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const moveMut = useMutation({
    mutationFn: (v: { id: string; status: Task["status"] }) => updateFn({ data: v }),
    onSuccess: invalidate,
  });
  const closeMut = useMutation({ mutationFn: (id: string) => closeFn({ data: { id, reason: "done" } }), onSuccess: invalidate });
  const reopenMut = useMutation({ mutationFn: (id: string) => reopenFn({ data: { id } }), onSuccess: invalidate });
  const archiveMut = useMutation({ mutationFn: (id: string) => archiveFn({ data: { id } }), onSuccess: () => { toast.success("Archived"); invalidate(); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => deleteFn({ data: { id } }), onSuccess: () => { toast.success("Deleted"); invalidate(); } });

  const grouped = useMemo(() => {
    const m = new Map<Task["status"], Task[]>();
    COLUMNS.forEach((c) => m.set(c.key, []));
    for (const t of tasks) {
      const key = t.status === "backlog" ? "todo" : t.status;
      m.get(key)?.push(t);
    }
    return m;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Actions</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); if (title.trim()) createMut.mutate(); }}
              className="space-y-3"
            >
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
              <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="med">Med</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Owner</label>
                <OwnerSelect value={assigneeId} onChange={setAssigneeId} />
              </div>
              <Button type="submit" disabled={createMut.isPending} className="w-full">Add task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {COLUMNS.map((c) => {
          const items = grouped.get(c.key) ?? [];
          return (
            <div key={c.key} className="rounded-lg border bg-muted/30 p-3 min-h-[200px]">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{c.label}</div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="rounded-md border bg-background p-2 shadow-sm">
                    <div className="flex items-start justify-between gap-1">
                      <div className="text-sm font-medium flex-1">{t.title}</div>
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(t)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => { confirmThen(`Delete "${t.title}"?`, () => { deleteMut.mutate(t.id); }) }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {t.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>}
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${PRI_COLOR[t.priority]}`}>
                        {t.priority.toUpperCase()}
                      </span>
                      {t.due_date && <span className="text-[10px] text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</span>}
                      <TaskOwner assigneeId={t.assignee_id} />
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Select value={t.status} onValueChange={(v) => moveMut.mutate({ id: t.id, status: v as Task["status"] })}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((col) => <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {t.close_reason ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => reopenMut.mutate(t.id)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => archiveMut.mutate(t.id)}><Archive className="h-3.5 w-3.5" /></Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => closeMut.mutate(t.id)}><Check className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => archiveMut.mutate(t.id)}><Archive className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <EditTaskDialog
          task={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); invalidate(); }}
        />
      )}
    </div>
  );
}

function TaskOwner({ assigneeId }: { assigneeId: string | null }) {
  const { data: profiles = [] } = useProfiles();
  if (!assigneeId) return null;
  const owner = profiles.find((p) => p.id === assigneeId);
  return <span className="text-[10px] text-muted-foreground">👤 {ownerLabel(owner)}</span>;
}

function EditTaskDialog({ task, onClose, onSaved }: { task: Task; onClose: () => void; onSaved: () => void }) {
  const updateFn = useServerFn(updateTask);
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description ?? "");
  const [priority, setPriority] = useState<Task["priority"]>(task.priority);
  const [due, setDue] = useState(task.due_date ?? "");
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [assigneeId, setAssigneeId] = useState<string | null>(task.assignee_id ?? null);

  const saveMut = useMutation({
    mutationFn: () => updateFn({ data: { id: task.id, title, description: desc || null, priority, dueDate: due || null, status, assigneeId } }),
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
          <div className="grid grid-cols-3 gap-2">
            <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="med">Med</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLUMNS.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Owner</label>
            <OwnerSelect value={assigneeId} onChange={setAssigneeId} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

