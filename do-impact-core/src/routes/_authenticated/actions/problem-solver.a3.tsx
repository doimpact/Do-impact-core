import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, FileText, CheckCircle2, Archive, Trash2, MoreHorizontal, Eye, RotateCcw } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/a3")({
  head: () => ({
    meta: [
      { title: "A3 Problem Solving — DO.Impact" },
      { name: "description", content: "Structured A3 problem-solving reports — background, current condition, goal, root cause, countermeasures, action plan and follow-up, with owner and status." },
      { property: "og:title", content: "A3 Problem Solving — DO.Impact" },
      { property: "og:description", content: "Structured A3 problem-solving reports — background, current condition, goal, root cause, countermeasures, action plan and follow-up, with owner and status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: A3Page,
});

type A3 = {
  id: string;
  title: string;
  owner_id: string | null;
  status: "draft" | "active" | "completed" | "archived";
  problem_statement: string | null;
  background: string | null;
  current_condition: string | null;
  goal: string | null;
  root_cause: string | null;
  countermeasures: string | null;
  action_plan: string | null;
  followup: string | null;
  updated_at: string;
  created_by: string | null;
};

const STATUS_META: Record<A3["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-200 text-neutral-700" },
  active: { label: "Active", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", className: "bg-neutral-100 text-neutral-500" },
};

const SECTIONS: { key: keyof A3; label: string; hint: string }[] = [
  { key: "background", label: "1. Background", hint: "Why this matters — strategic context." },
  { key: "current_condition", label: "2. Current Condition", hint: "Facts, data, what is happening today." },
  { key: "goal", label: "3. Goal / Target Condition", hint: "Measurable target and by when." },
  { key: "root_cause", label: "4. Root Cause Analysis", hint: "5 Whys, Ishikawa — underlying cause?" },
  { key: "countermeasures", label: "5. Countermeasures", hint: "Actions that address the root cause." },
  { key: "action_plan", label: "6. Implementation Plan", hint: "Who does what by when." },
  { key: "followup", label: "7. Follow-up & Confirmation", hint: "Verify results and sustain the gain." },
];

function A3Page() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | A3["status"]>("all");
  const [selected, setSelected] = useState<A3 | null>(null);
  const [editing, setEditing] = useState<A3 | "new" | null>(null);

  const a3sQ = useQuery({
    queryKey: ["a3s"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("a3_reports")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as A3[];
    },
  });

  const a3s = Array.isArray(a3sQ.data) ? a3sQ.data : [];
  const filtered = useMemo(
    () => (statusFilter === "all" ? a3s : a3s.filter((a) => a.status === statusFilter)),
    [a3s, statusFilter],
  );
  const counts = useMemo(() => {
    const c: Record<A3["status"], number> = { draft: 0, active: 0, completed: 0, archived: 0 };
    a3s.forEach((a) => c[a.status]++);
    return c;
  }, [a3s]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["a3s"] });

  const updateStatus = async (a: A3, status: A3["status"]) => {
    const { error } = await supabase.from("a3_reports").update({ status }).eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    invalidate();
    setSelected(null);
  };

  const remove = async (a: A3) => {
    if (!(await confirmDialog(`Delete A3 "${a.title}"? This cannot be undone.`))) return;
    const { error } = await supabase.from("a3_reports").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    invalidate();
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6" /> A3 Problem Solving
          </h1>
          <p className="text-sm text-muted-foreground">
            One-page structured problem solving. Draft, work, complete and archive each A3.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" /> New A3
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(STATUS_META) as A3["status"][]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-lg border p-3 text-left transition ${
              statusFilter === s
                ? "border-primary bg-primary/5"
                : "border-neutral-200 bg-card hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {STATUS_META[s].label}
            </div>
            <div className="mt-1 text-2xl font-bold">{counts[s]}</div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No A3s yet. Click <span className="font-medium">New A3</span> to draft your first one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Updated</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <button className="text-left" onClick={() => setSelected(a)}>
                      <div className="font-medium">{a.title}</div>
                      {a.problem_statement && (
                        <div className="line-clamp-1 max-w-[520px] text-xs text-muted-foreground">
                          {a.problem_statement}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_META[a.status].className}`}>
                      {STATUS_META[a.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(a.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Actions for ${a.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setSelected(a)}>
                          <Eye className="mr-2 h-4 w-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditing(a)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {a.status === "archived" ? (
                          <DropdownMenuItem onSelect={() => updateStatus(a, "draft")}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => updateStatus(a, "archived")}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onSelect={() => { void remove(a); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <A3ViewerDialog
          a3={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setEditing(selected);
            setSelected(null);
          }}
          onComplete={() => updateStatus(selected, "completed")}
          onArchive={() => updateStatus(selected, "archived")}
          onRestore={() => updateStatus(selected, "draft")}
          onDelete={() => remove(selected)}
        />
      )}
      {editing && (
        <A3EditorDialog
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function A3ViewerDialog({
  a3,
  onClose,
  onEdit,
  onComplete,
  onArchive,
  onRestore,
  onDelete,
}: {
  a3: A3;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">A3 Report</div>
          <DialogTitle className="text-xl">{a3.title}</DialogTitle>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 ${STATUS_META[a3.status].className}`}>
              {STATUS_META[a3.status].label}
            </span>
            <A3OwnerBadge ownerId={a3.owner_id} />
          </div>
        </DialogHeader>
        {a3.problem_statement && (
          <div className="rounded-lg bg-neutral-900 p-4 text-neutral-50">
            <div className="text-[11px] uppercase tracking-wider text-neutral-400">Problem Statement</div>
            <p className="mt-1 text-sm">{a3.problem_statement}</p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SECTIONS.map((s) => {
            const val = a3[s.key] as string | null;
            return (
              <div key={String(s.key)} className="rounded-lg border border-neutral-200 bg-card p-3">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500">{s.label}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">
                  {val || <span className="italic text-muted-foreground">Empty</span>}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex gap-2">
            {a3.status !== "completed" && (
              <Button variant="outline" onClick={onComplete}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark completed
              </Button>
            )}
            {a3.status !== "archived" ? (
              <Button variant="outline" onClick={onArchive}>
                <Archive className="mr-1 h-4 w-4" /> Archive
              </Button>
            ) : (
              <Button variant="outline" onClick={onRestore}>
                <RotateCcw className="mr-1 h-4 w-4" /> Restore
              </Button>
            )}
            <Button variant="ghost" className="text-red-600" onClick={onDelete}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={onEdit}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function A3EditorDialog({
  initial,
  onCancel,
  onSaved,
}: {
  initial: A3 | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    status: (initial?.status ?? "draft") as A3["status"],
    owner_id: initial?.owner_id ?? null as string | null,
    problem_statement: initial?.problem_statement ?? "",
    background: initial?.background ?? "",
    current_condition: initial?.current_condition ?? "",
    goal: initial?.goal ?? "",
    root_cause: initial?.root_cause ?? "",
    countermeasures: initial?.countermeasures ?? "",
    action_plan: initial?.action_plan ?? "",
    followup: initial?.followup ?? "",
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));


  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      const { data: userData } = await getCurrentUser();
      if (initial) {
        const { error } = await supabase.from("a3_reports").update(form).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("a3_reports")
          .insert({ ...form, created_by: userData.user?.id, owner_id: form.owner_id ?? userData.user?.id });
        if (error) throw error;
      }
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit A3" : "New A3"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
            <div>
              <label className="text-xs font-medium">Title</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => update("status", v as A3["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as A3["status"][]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Owner</label>
            <OwnerSelect value={form.owner_id} onChange={(v) => update("owner_id", v)} />
          </div>
          <div>
            <label className="text-xs font-medium">Problem statement</label>
            <Textarea
              rows={2}
              value={form.problem_statement}
              onChange={(e) => update("problem_statement", e.target.value)}
              placeholder="One sentence describing the problem and its impact."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {SECTIONS.map((s) => (
              <div key={String(s.key)}>
                <label className="text-xs font-medium">{s.label}</label>
                <div className="text-[11px] text-muted-foreground">{s.hint}</div>
                <Textarea
                  rows={4}
                  value={form[s.key as keyof typeof form] as string}
                  onChange={(e) => update(s.key as keyof typeof form, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={save} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function A3OwnerBadge({ ownerId }: { ownerId: string | null }) {
  const { data: profiles = [] } = useProfiles();
  const owner = ownerId ? profiles.find((p) => p.id === ownerId) : undefined;
  return <span className="text-muted-foreground">👤 {ownerLabel(owner)}</span>;
}
