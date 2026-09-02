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
import { Plus, Pencil, Target, CheckCircle2, Archive, Trash2, MoreHorizontal, Eye, RotateCcw, Lock } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/dmaic")({
  head: () => ({
    meta: [
      { title: "DMAIC — DO.Impact" },
      { name: "description", content: "Data-driven Six Sigma improvement: Define, Measure, Analyse, Improve, Control. Gated phase progression so you cannot improve before you measure." },
      { property: "og:title", content: "DMAIC — DO.Impact" },
      { property: "og:description", content: "Five-phase improvement workspace with phase gating and owner assignment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DmaicPage,
});

type DmaicStatus = "draft" | "active" | "completed" | "archived";
type DmaicPhase = "define" | "measure" | "analyze" | "improve" | "control";

type Dmaic = {
  id: string;
  title: string;
  owner_id: string | null;
  status: DmaicStatus;
  phase: DmaicPhase;
  problem_statement: string | null;
  goal: string | null;
  measure_summary: string | null;
  analyze_summary: string | null;
  improve_summary: string | null;
  control_summary: string | null;
  metrics: string | null;
  updated_at: string;
  created_by: string | null;
};

const STATUS_META: Record<DmaicStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-200 text-neutral-700" },
  active: { label: "Active", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", className: "bg-neutral-100 text-neutral-500" },
};

const PHASE_META: Record<DmaicPhase, { label: string; step: number; hint: string }> = {
  define: { label: "Define", step: 1, hint: "Problem statement, goal, scope and customer impact." },
  measure: { label: "Measure", step: 2, hint: "Baseline data, process capability and measurement system." },
  analyze: { label: "Analyse", step: 3, hint: "Root causes, statistical tests and hypothesis confirmation." },
  improve: { label: "Improve", step: 4, hint: "Selected solutions, trials, risk assessment and implementation plan." },
  control: { label: "Control", step: 5, hint: "Standard work, monitoring plan and response rules." },
};

const PHASES: DmaicPhase[] = ["define", "measure", "analyze", "improve", "control"];

function phaseIsLocked(phase: DmaicPhase, measure_summary: string | null): boolean {
  // Rule: never attempt Phase 4 (Improve) until Phase 2 (Measure) is complete.
  if ((phase === "improve" || phase === "control") && !measure_summary?.trim()) return true;
  return false;
}

function phaseProgress(phase: DmaicPhase, measure_summary: string | null): number {
  if (phase === "define") return 20;
  if (phase === "measure" && !measure_summary?.trim()) return 40;
  if (phase === "measure") return 60;
  if (phase === "analyze") return 80;
  if (phase === "improve" || phase === "control") return 100;
  return 0;
}

function DmaicPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | DmaicStatus>("all");
  const [selected, setSelected] = useState<Dmaic | null>(null);
  const [editing, setEditing] = useState<Dmaic | "new" | null>(null);

  const listQ = useQuery({
    queryKey: ["dmaic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dmaic_projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Dmaic[];
    },
  });

  const rows = Array.isArray(listQ.data) ? listQ.data : [];
  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );
  const counts = useMemo(() => {
    const c: Record<DmaicStatus, number> = { draft: 0, active: 0, completed: 0, archived: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["dmaic"] });

  const updateStatus = async (r: Dmaic, status: DmaicStatus) => {
    const { error } = await supabase.from("dmaic_projects").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    invalidate();
    setSelected(null);
  };

  const remove = async (r: Dmaic) => {
    if (!(await confirmDialog(`Delete DMAIC "${r.title}"? This cannot be undone.`))) return;
    const { error } = await supabase.from("dmaic_projects").delete().eq("id", r.id);
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
            <Target className="h-6 w-6" /> DMAIC
          </h1>
          <p className="text-sm text-muted-foreground">
            Five-phase data-driven improvement. The Improve phase is locked until Measure is complete.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" /> New DMAIC
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(STATUS_META) as DmaicStatus[]).map((s) => (
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
            No DMAIC projects yet. Click <span className="font-medium">New DMAIC</span> to start one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Phase</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Progress</th>
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
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded bg-muted px-2 py-0.5">{PHASE_META[r.phase].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${STATUS_META[r.status].className}`}>
                      {STATUS_META[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar pct={phaseProgress(r.phase, r.measure_summary)} />
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

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground">{pct}%</span>
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
  report: Dmaic;
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
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">DMAIC Project</div>
          <DialogTitle className="text-xl">{report.title}</DialogTitle>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 ${STATUS_META[report.status].className}`}>
              {STATUS_META[report.status].label}
            </span>
            <span className="rounded bg-muted px-2 py-0.5">{PHASE_META[report.phase].label}</span>
            <OwnerBadge ownerId={report.owner_id} />
          </div>
        </DialogHeader>

        {phaseIsLocked(report.phase, report.measure_summary) && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Lock className="h-4 w-4" />
            Phase 4 (Improve) is locked until Phase 2 (Measure) has a summary.
          </div>
        )}

        {report.problem_statement && (
          <div className="rounded-lg bg-neutral-900 p-4 text-neutral-50">
            <div className="text-[11px] uppercase tracking-wider text-neutral-400">Problem Statement</div>
            <p className="mt-1 text-sm">{report.problem_statement}</p>
          </div>
        )}

        <div className="space-y-3">
          {PHASES.map((p) => {
            const meta = PHASE_META[p];
            const val = report[`${p}_summary` as keyof Dmaic] as string | null ?? report[p as keyof Dmaic] as string | null;
            const locked = (p === "improve" || p === "control") && phaseIsLocked(report.phase, report.measure_summary);
            return (
              <div key={p} className="rounded-lg border border-neutral-200 bg-card p-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{meta.step}</span>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500">{meta.label}</span>
                  {locked && <Lock className="h-3 w-3 text-amber-600" />}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{meta.hint}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {val ? String(val) : <span className="italic text-muted-foreground">Empty</span>}
                </div>
              </div>
            );
          })}
        </div>

        {report.metrics && (
          <div className="rounded-lg border border-neutral-200 bg-card p-3">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500">Metrics</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">{report.metrics}</div>
          </div>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex gap-2">
            {report.status !== "completed" && (
              <Button variant="outline" onClick={onComplete} disabled={phaseIsLocked(report.phase, report.measure_summary)}>
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
  initial: Dmaic | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    status: (initial?.status ?? "draft") as DmaicStatus,
    phase: (initial?.phase ?? "define") as DmaicPhase,
    owner_id: initial?.owner_id ?? null as string | null,
    problem_statement: initial?.problem_statement ?? "",
    goal: initial?.goal ?? "",
    measure_summary: initial?.measure_summary ?? "",
    analyze_summary: initial?.analyze_summary ?? "",
    improve_summary: initial?.improve_summary ?? "",
    control_summary: initial?.control_summary ?? "",
    metrics: initial?.metrics ?? "",
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    if (phaseIsLocked(form.phase, form.measure_summary)) {
      return toast.error("Phase 4 (Improve) is locked until Phase 2 (Measure) has a summary.");
    }
    setSaving(true);
    try {
      const { data: userData } = await getCurrentUser();
      if (initial) {
        const { error } = await supabase.from("dmaic_projects").update(form).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dmaic_projects")
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
          <DialogTitle>{initial ? "Edit DMAIC" : "New DMAIC"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <label className="text-xs font-medium">Title</label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => update("status", v as DmaicStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as DmaicStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Phase</label>
              <Select value={form.phase} onValueChange={(v) => update("phase", v as DmaicPhase)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p} value={p} disabled={phaseIsLocked(p, form.measure_summary)}>
                      {PHASE_META[p].label}
                      {phaseIsLocked(p, form.measure_summary) && " 🔒"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {phaseIsLocked(form.phase, form.measure_summary) && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              <Lock className="h-3.5 w-3.5" />
              Improve / Control are locked until Measure summary is filled.
            </div>
          )}
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
              placeholder="What is the defect, variation or gap we must close?"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Goal</label>
            <Textarea
              rows={2}
              value={form.goal}
              onChange={(e) => update("goal", e.target.value)}
              placeholder="Measurable target and deadline."
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {PHASES.map((p) => {
              const meta = PHASE_META[p];
              const key = p === "define" ? "problem_statement" : p === "measure" ? "measure_summary" : p === "analyze" ? "analyze_summary" : p === "improve" ? "improve_summary" : "control_summary";
              return (
                <div key={p}>
                  <label className="text-xs font-medium">{meta.label} — {meta.hint}</label>
                  <Textarea
                    rows={4}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => update(key as keyof typeof form, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
          <div>
            <label className="text-xs font-medium">Metrics</label>
            <Textarea
              rows={2}
              value={form.metrics}
              onChange={(e) => update("metrics", e.target.value)}
              placeholder="Baseline, target, actual and control-chart references."
            />
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
