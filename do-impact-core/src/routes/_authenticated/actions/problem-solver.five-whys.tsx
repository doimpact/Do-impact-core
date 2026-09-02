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
import { Plus, Pencil, FileText, CheckCircle2, Archive, Trash2, MoreHorizontal, Eye, RotateCcw, HelpCircle } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/five-whys")({
  head: () => ({
    meta: [
      { title: "5 Whys — DO.Impact" },
      { name: "description", content: "Drill from symptom to root cause with five consecutive why questions. Assign an owner, track status and link to A3 or 8D follow-up." },
      { property: "og:title", content: "5 Whys — DO.Impact" },
      { property: "og:description", content: "Fast root-cause drill-down: problem statement, five whys, root cause and corrective action." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FiveWhysPage,
});

type FiveWhys = {
  id: string;
  title: string;
  owner_id: string | null;
  status: "draft" | "active" | "completed" | "archived";
  problem_statement: string | null;
  why_1: string | null;
  why_2: string | null;
  why_3: string | null;
  why_4: string | null;
  why_5: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  updated_at: string;
  created_by: string | null;
};

const STATUS_META: Record<FiveWhys["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-200 text-neutral-700" },
  active: { label: "Active", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", className: "bg-neutral-100 text-neutral-500" },
};

const WHYS: { key: keyof FiveWhys; label: string; hint: string }[] = [
  { key: "why_1", label: "Why 1", hint: "Why did the problem happen the first time?" },
  { key: "why_2", label: "Why 2", hint: "Why was that the case?" },
  { key: "why_3", label: "Why 3", hint: "Keep drilling through the chain." },
  { key: "why_4", label: "Why 4", hint: "Look past people and blame; find process or system cause." },
  { key: "why_5", label: "Why 5", hint: "Stop when the answer points to a controllable system factor." },
];

function FiveWhysPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | FiveWhys["status"]>("all");
  const [selected, setSelected] = useState<FiveWhys | null>(null);
  const [editing, setEditing] = useState<FiveWhys | "new" | null>(null);

  const listQ = useQuery({
    queryKey: ["five_whys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("five_whys_reports")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FiveWhys[];
    },
  });

  const rows = Array.isArray(listQ.data) ? listQ.data : [];
  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );
  const counts = useMemo(() => {
    const c: Record<FiveWhys["status"], number> = { draft: 0, active: 0, completed: 0, archived: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["five_whys"] });

  const updateStatus = async (r: FiveWhys, status: FiveWhys["status"]) => {
    const { error } = await supabase.from("five_whys_reports").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    invalidate();
    setSelected(null);
  };

  const remove = async (r: FiveWhys) => {
    if (!(await confirmDialog(`Delete 5 Whys "${r.title}"? This cannot be undone.`))) return;
    const { error } = await supabase.from("five_whys_reports").delete().eq("id", r.id);
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
            <HelpCircle className="h-6 w-6" /> 5 Whys
          </h1>
          <p className="text-sm text-muted-foreground">
            Drill from symptom to system root cause in five questions. Fast, structured, and easy to share.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" /> New 5 Whys
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(STATUS_META) as FiveWhys["status"][]).map((s) => (
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
            No 5 Whys reports yet. Click <span className="font-medium">New 5 Whys</span> to start one.
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
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <button className="text-left" onClick={() => setSelected(r)}>
                      <div className="font-medium">{r.title}</div>
                      {r.problem_statement && (
                        <div className="line-clamp-1 max-w-[520px] text-xs text-muted-foreground">
                          {r.problem_statement}
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_META[r.status].className}`}>
                      {STATUS_META[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Actions for ${r.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setSelected(r)}>
                          <Eye className="mr-2 h-4 w-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditing(r)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {r.status === "archived" ? (
                          <DropdownMenuItem onSelect={() => updateStatus(r, "draft")}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => updateStatus(r, "archived")}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onSelect={() => { void remove(r); }}
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
        <ViewerDialog
          report={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null); }}
          onComplete={() => updateStatus(selected, "completed")}
          onArchive={() => updateStatus(selected, "archived")}
          onRestore={() => updateStatus(selected, "draft")}
          onDelete={() => remove(selected)}
        />
      )}
      {editing && (
        <EditorDialog
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ViewerDialog({
  report,
  onClose,
  onEdit,
  onComplete,
  onArchive,
  onRestore,
  onDelete,
}: {
  report: FiveWhys;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">5 Whys Report</div>
          <DialogTitle className="text-xl">{report.title}</DialogTitle>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 ${STATUS_META[report.status].className}`}>
              {STATUS_META[report.status].label}
            </span>
            <OwnerBadge ownerId={report.owner_id} />
          </div>
        </DialogHeader>
        {report.problem_statement && (
          <div className="rounded-lg bg-neutral-900 p-4 text-neutral-50">
            <div className="text-[11px] uppercase tracking-wider text-neutral-400">Problem Statement</div>
            <p className="mt-1 text-sm">{report.problem_statement}</p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {WHYS.map((w) => {
            const val = report[w.key] as string | null;
            return (
              <div key={String(w.key)} className="rounded-lg border border-neutral-200 bg-card p-3">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500">{w.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{w.hint}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {val || <span className="italic text-muted-foreground">Empty</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-card p-3">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500">Root Cause</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {report.root_cause || <span className="italic text-muted-foreground">Empty</span>}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-card p-3">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500">Corrective Action</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">
              {report.corrective_action || <span className="italic text-muted-foreground">Empty</span>}
            </div>
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex gap-2">
            {report.status !== "completed" && (
              <Button variant="outline" onClick={onComplete}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark completed
              </Button>
            )}
            {report.status !== "archived" ? (
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

function EditorDialog({
  initial,
  onCancel,
  onSaved,
}: {
  initial: FiveWhys | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    status: (initial?.status ?? "draft") as FiveWhys["status"],
    owner_id: initial?.owner_id ?? null as string | null,
    problem_statement: initial?.problem_statement ?? "",
    why_1: initial?.why_1 ?? "",
    why_2: initial?.why_2 ?? "",
    why_3: initial?.why_3 ?? "",
    why_4: initial?.why_4 ?? "",
    why_5: initial?.why_5 ?? "",
    root_cause: initial?.root_cause ?? "",
    corrective_action: initial?.corrective_action ?? "",
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
        const { error } = await supabase.from("five_whys_reports").update(form).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("five_whys_reports")
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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit 5 Whys" : "New 5 Whys"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
            <div>
              <label className="text-xs font-medium">Title</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => update("status", v as FiveWhys["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as FiveWhys["status"][]).map((s) => (
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
              placeholder="Describe the problem and its impact in one sentence."
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {WHYS.map((w) => (
              <div key={String(w.key)}>
                <label className="text-xs font-medium">{w.label}</label>
                <div className="text-[11px] text-muted-foreground">{w.hint}</div>
                <Textarea
                  rows={3}
                  value={form[w.key as keyof typeof form] as string}
                  onChange={(e) => update(w.key as keyof typeof form, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Root Cause</label>
              <Textarea
                rows={3}
                value={form.root_cause}
                onChange={(e) => update("root_cause", e.target.value)}
                placeholder="The controllable system cause the chain points to."
              />
            </div>
            <div>
              <label className="text-xs font-medium">Corrective Action</label>
              <Textarea
                rows={3}
                value={form.corrective_action}
                onChange={(e) => update("corrective_action", e.target.value)}
                placeholder="What will be done to prevent recurrence."
              />
            </div>
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

function OwnerBadge({ ownerId }: { ownerId: string | null }) {
  const { data: profiles = [] } = useProfiles();
  const owner = ownerId ? profiles.find((p) => p.id === ownerId) : undefined;
  return <span className="text-muted-foreground">👤 {ownerLabel(owner)}</span>;
}
