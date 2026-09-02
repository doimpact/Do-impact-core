import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listA3s, upsertA3, deleteA3 } from "@/lib/oms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/oms/quality")({
  head: () => ({ meta: [{ title: "Quality — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: A3Page,
});

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-neutral-100 text-neutral-500",
};

function A3Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listA3s);
  const upsertFn = useServerFn(upsertA3);
  const delFn = useServerFn(deleteA3);

  const q = useQuery({ queryKey: ["a3s"], queryFn: () => listFn() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["a3s"] });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; title: string; status: "draft" | "active" | "completed" | "archived"; problemStatement: string; background: string; currentCondition: string; goal: string; rootCause: string; countermeasures: string; actionPlan: string; followup: string } | null>(null);

  const save = useMutation({
    mutationFn: (v: typeof editing) => upsertFn({ data: v! }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); setEditing(null); invalidate(); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: invalidate });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality — A3 Problem Solving</h1>
          <p className="text-muted-foreground mt-1">Structured problem-solving using the A3 methodology.</p>
        </div>
        <Button onClick={() => { setEditing({ title: "", status: "draft", problemStatement: "", background: "", currentCondition: "", goal: "", rootCause: "", countermeasures: "", actionPlan: "", followup: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New A3
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {q.data?.a3s.map((a) => (
          <div key={a.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[a.status] ?? ""}`}>{a.status.toUpperCase()}</span>
                <div className="font-semibold mt-2">{a.title}</div>
                {a.problem_statement && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.problem_statement}</div>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => { setEditing({
                  id: a.id, title: a.title, status: a.status as never,
                  problemStatement: a.problem_statement ?? "", background: a.background ?? "",
                  currentCondition: a.current_condition ?? "", goal: a.goal ?? "",
                  rootCause: a.root_cause ?? "", countermeasures: a.countermeasures ?? "",
                  actionPlan: a.action_plan ?? "", followup: a.followup ?? "",
                }); setOpen(true); }}>Edit</Button>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {q.data?.a3s.length === 0 && <div className="text-sm text-muted-foreground">No A3 reports yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit A3" : "New A3"}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-3">
              <Input placeholder="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
              <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as never })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              {([
                ["problemStatement", "Problem statement"],
                ["background", "Background"],
                ["currentCondition", "Current condition"],
                ["goal", "Goal / Target condition"],
                ["rootCause", "Root cause analysis"],
                ["countermeasures", "Countermeasures"],
                ["actionPlan", "Action plan"],
                ["followup", "Follow-up / Verification"],
              ] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <Textarea rows={2} value={editing[k]} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={save.isPending}>Save A3</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
