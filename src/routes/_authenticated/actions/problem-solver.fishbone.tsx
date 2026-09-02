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
import { Plus, Pencil, GitBranch, CheckCircle2, Archive, Trash2, MoreHorizontal, Eye, RotateCcw, X } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/fishbone")({
  head: () => ({
    meta: [
      { title: "Fishbone / Ishikawa — DO.Impact" },
      { name: "description", content: "Map cause-and-effect under the 6M categories. Group suspects, test each branch and pin the true root cause." },
      { property: "og:title", content: "Fishbone / Ishikawa — DO.Impact" },
      { property: "og:description", content: "Structured Ishikawa diagrams with Man, Method, Machine, Material, Measurement and Environment categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FishbonePage,
});

type FishboneStatus = "draft" | "active" | "completed" | "archived";

type FishboneCategory = "man" | "method" | "machine" | "material" | "measurement" | "environment";

type FishboneCategories = Partial<Record<FishboneCategory, string[]>>;

type Fishbone = {
  id: string;
  title: string;
  owner_id: string | null;
  status: FishboneStatus;
  problem_statement: string | null;
  categories: FishboneCategories;
  updated_at: string;
  created_by: string | null;
};

const STATUS_META: Record<FishboneStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-200 text-neutral-700" },
  active: { label: "Active", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", className: "bg-neutral-100 text-neutral-500" },
};

const CATEGORY_META: Record<FishboneCategory, { label: string; hint: string }> = {
  man: { label: "Man", hint: "People, skills, training, fatigue, supervision" },
  method: { label: "Method", hint: "Process, procedure, work instruction, sequence" },
  machine: { label: "Machine", hint: "Equipment, tooling, maintenance, calibration" },
  material: { label: "Material", hint: "Raw material, supplier, storage, handling" },
  measurement: { label: "Measurement", hint: "Gauges, inspection, data accuracy, sampling" },
  environment: { label: "Environment", hint: "Temperature, humidity, cleanliness, layout" },
};

const CATEGORY_KEYS: FishboneCategory[] = ["man", "method", "machine", "material", "measurement", "environment"];

function FishbonePage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | FishboneStatus>("all");
  const [selected, setSelected] = useState<Fishbone | null>(null);
  const [editing, setEditing] = useState<Fishbone | "new" | null>(null);

  const listQ = useQuery({
    queryKey: ["fishbone"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishbone_reports")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Fishbone[];
    },
  });

  const rows = Array.isArray(listQ.data) ? listQ.data : [];
  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );
  const counts = useMemo(() => {
    const c: Record<FishboneStatus, number> = { draft: 0, active: 0, completed: 0, archived: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["fishbone"] });

  const updateStatus = async (r: Fishbone, status: FishboneStatus) => {
    const { error } = await supabase.from("fishbone_reports").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    invalidate();
    setSelected(null);
  };

  const remove = async (r: Fishbone) => {
    if (!(await confirmDialog(`Delete Fishbone "${r.title}"? This cannot be undone.`))) return;
    const { error } = await supabase.from("fishbone_reports").delete().eq("id", r.id);
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
            <GitBranch className="h-6 w-6" /> Fishbone / Ishikawa
          </h1>
          <p className="text-sm text-muted-foreground">
            Group potential causes under the 6M categories so the team can test the right suspects.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" /> New Fishbone
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(STATUS_META) as FishboneStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-lg border p-3 text-left transition ${
              statusFilter === s
                ? "border-primary bg-primary/5"
                : "border-neutral-200 bg-card hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{STATUS_META[s].label}</div>
            <div className="mt-1 text-2xl font-bold">{counts[s]}</div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No Fishbone diagrams yet. Click <span className="font-medium">New Fishbone</span> to start one.
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
                        <div className="line-clamp-1 max-w-[520px] text-xs text-muted-foreground">{r.problem_statement}</div>
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
  report: Fishbone;
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
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Fishbone Diagram</div>
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
          {CATEGORY_KEYS.map((k) => {
            const causes = report.categories[k] ?? [];
            return (
              <div key={k} className="rounded-lg border border-neutral-200 bg-card p-3">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500">{CATEGORY_META[k].label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{CATEGORY_META[k].hint}</div>
                {causes.length === 0 ? (
                  <div className="mt-2 italic text-muted-foreground">Empty</div>
                ) : (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {causes.map((cause, i) => <li key={i}>{cause}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
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
  initial: Fishbone | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    status: (initial?.status ?? "draft") as FishboneStatus,
    owner_id: initial?.owner_id ?? null as string | null,
    problem_statement: initial?.problem_statement ?? "",
    categories: { ...initial?.categories } as FishboneCategories,
  });
  const [saving, setSaving] = useState(false);

  const ensureCategory = (k: FishboneCategory) => {
    if (!form.categories[k]) setForm((f) => ({ ...f, categories: { ...f.categories, [k]: [] } }));
  };

  const addCause = (k: FishboneCategory) => {
    ensureCategory(k);
    const cause = window.prompt(`Add cause to ${CATEGORY_META[k].label}`);
    if (!cause?.trim()) return;
    setForm((f) => ({ ...f, categories: { ...f.categories, [k]: [...(f.categories[k] ?? []), cause.trim()] } }));
  };

  const removeCause = (k: FishboneCategory, idx: number) => {
    setForm((f) => ({
      ...f,
      categories: { ...f.categories, [k]: (f.categories[k] ?? []).filter((_, i) => i !== idx) },
    }));
  };

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      const { data: userData } = await getCurrentUser();
      if (initial) {
        const { error } = await supabase.from("fishbone_reports").update(form).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fishbone_reports")
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
          <DialogTitle>{initial ? "Edit Fishbone" : "New Fishbone"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
            <div>
              <label className="text-xs font-medium">Title</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => update("status", v as FishboneStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as FishboneStatus[]).map((s) => (
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
              placeholder="What is the defect or effect we are explaining?"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CATEGORY_KEYS.map((k) => (
              <div key={k} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">{CATEGORY_META[k].label}</div>
                    <div className="text-[11px] text-muted-foreground">{CATEGORY_META[k].hint}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addCause(k)}>Add</Button>
                </div>
                <div className="mt-2 space-y-1">
                  {(form.categories[k] ?? []).map((cause, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1 text-sm">
                      <span className="line-clamp-2">{cause}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => removeCause(k, i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(form.categories[k] ?? []).length === 0 && (
                    <div className="text-xs text-muted-foreground italic">No causes added yet.</div>
                  )}
                </div>
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

function OwnerBadge({ ownerId }: { ownerId: string | null }) {
  const { data: profiles = [] } = useProfiles();
  const owner = ownerId ? profiles.find((p) => p.id === ownerId) : undefined;
  return <span className="text-muted-foreground">👤 {ownerLabel(owner)}</span>;
}
