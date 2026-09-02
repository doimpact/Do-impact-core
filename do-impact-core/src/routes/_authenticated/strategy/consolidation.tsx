import { createFileRoute } from "@tanstack/react-router";
import { useNumberFormat } from "@/lib/number-format";
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, Copy, Save } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, CartesianGrid,
} from "recharts";
import { OwnerSelect } from "@/components/owner-select";
import { formatUSD, npv, irr, paybackMonth, formatPct } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/strategy/consolidation")({
  head: () => ({ meta: [{ title: "Consolidation — DO.Impact" }] }),
  component: ConsolidationPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type ProjectStatus = "planning" | "approved" | "in_progress" | "complete";
type TransitionCat = "direct_transfer" | "double_running" | "pmo";
type PhaseStatus = "not_started" | "in_progress" | "done";

type Project = {
  id: string;
  name: string;
  description: string | null;
  from_site_a: string | null;
  from_site_b: string | null;
  to_site: string | null;
  target_go_live: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  archived_at: string | null;
  discount_rate_pct?: number | null;
};


type TransitionCost = {
  id: string; project_id: string; category: TransitionCat; label: string;
  amount: number; note: string | null; sort_order: number;
};

type Phase = {
  id: string; project_id: string; sort_order: number; name: string;
  description: string | null; owner_id: string | null; status: PhaseStatus;
  start_date: string | null; end_date: string | null; notes: string | null;
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning", approved: "Approved", in_progress: "In progress", complete: "Complete",
};

const PHASE_LABEL: Record<PhaseStatus, string> = {
  not_started: "Not started", in_progress: "In progress", done: "Done",
};
const PHASE_COLOR: Record<PhaseStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const TRANSITION_GROUPS: { key: TransitionCat; title: string; blurb: string }[] = [
  { key: "direct_transfer", title: "Direct transfer costs", blurb: "Rigging, transport, facility prep, re-anchoring, re-certification, First Article Inspections, customer/regulatory sign-off." },
  { key: "double_running", title: "Double-running costs", blurb: "Overlapping leases, parallel headcount, safety-stock buffers, ramp-up scrap and productivity loss." },
  { key: "pmo", title: "Project team & transition expenses", blurb: "PMO, industrial engineers, external logistics, severance, retention bonuses." },
];

function ConsolidationPage() {
  useNumberFormat(); // re-render when the money display setting changes
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("consolidation.projectId") : null
  );
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const projectsQ = useQuery({
    queryKey: ["consolidation_projects"],
    queryFn: async () => {
      const { data, error } = await sb.from("consolidation_projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });
  const projects = projectsQ.data ?? [];
  const visibleProjects = showArchived ? projects : projects.filter((p) => !p.archived_at);

  useEffect(() => {
    const active = projects.filter((p) => !p.archived_at);
    if (!active.length) return;
    if (!projectId || !projects.find((p) => p.id === projectId)) setProjectId(active[0].id);
  }, [projects, projectId]);

  useEffect(() => {
    if (projectId && typeof window !== "undefined") localStorage.setItem("consolidation.projectId", projectId);
  }, [projectId]);

  const project = projects.find((p) => p.id === projectId) ?? null;

  const createMut = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await sb.from("consolidation_projects").insert({ name }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => { setProjectId(id); qc.invalidateQueries({ queryKey: ["consolidation_projects"] }); toast.success("Project created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProjectMut = useMutation({
    mutationFn: async (patch: Partial<Project> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await sb.from("consolidation_projects").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consolidation_projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProjectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("consolidation_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setProjectId(null); qc.invalidateQueries({ queryKey: ["consolidation_projects"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Consolidation</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Two-site → one-site consolidation planning. Does your ongoing operational saving justify the one-time price
            tag of the move? Build the AS-IS vs TO-BE baseline, capture one-time transition costs, and execute the
            five-step transition without interrupting deliveries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={projectId ?? ""} onValueChange={(v) => setProjectId(v || null)}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select a project" /></SelectTrigger>
            <SelectContent>
              {visibleProjects.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No projects</div>}
              {visibleProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}{p.archived_at ? " (archived)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setNewOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New</Button>
          {project && (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              {project.archived_at ? (
                <Button size="sm" variant="outline" onClick={() => updateProjectMut.mutate({ id: project.id, archived_at: null })} className="gap-1.5">
                  <ArchiveRestore className="h-3.5 w-3.5" /> Unarchive
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => updateProjectMut.mutate({ id: project.id, archived_at: new Date().toISOString() })} className="gap-1.5">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => { confirmThen(`Delete "${project.name}" and all its data?`, () => { deleteProjectMut.mutate(project.id); }) }} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
        </div>
      </header>

      {!project ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No consolidation project yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Click <b>New</b> to create your first project — five roadmap phases are seeded automatically.</p>
        </div>
      ) : (
        <ProjectView project={project} onPatch={(patch) => updateProjectMut.mutate({ id: project.id, ...patch })} />
      )}

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} onCreate={(name) => createMut.mutate(name)} />
      {project && (
        <EditProjectDialog
          open={editOpen} onOpenChange={setEditOpen}
          project={project}
          onSave={(patch) => updateProjectMut.mutate({ id: project.id, ...patch })}
        />
      )}

      <FrameworkGuide />
    </div>
  );
}

/* ============ Project view ============ */

function ProjectView({ project, onPatch }: { project: Project; onPatch: (p: Partial<Project>) => void }) {
  return (
    <>
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="From site A"><Input value={project.from_site_a ?? ""} onChange={(e) => onPatch({ from_site_a: e.target.value })} /></Field>
          <Field label="From site B"><Input value={project.from_site_b ?? ""} onChange={(e) => onPatch({ from_site_b: e.target.value })} /></Field>
          <Field label="To site (consolidated)"><Input value={project.to_site ?? ""} onChange={(e) => onPatch({ to_site: e.target.value })} /></Field>
          <Field label="Target go-live"><Input type="date" value={project.target_go_live ?? ""} onChange={(e) => onPatch({ target_go_live: e.target.value || null })} /></Field>
          <Field label="Status">
            <Select value={project.status} onValueChange={(v) => onPatch({ status: v as ProjectStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Owner" className="md:col-span-2">
            <OwnerSelect value={project.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
          </Field>
          <Field label="Description" className="md:col-span-3">
            <Textarea rows={2} value={project.description ?? ""} onChange={(e) => onPatch({ description: e.target.value })} placeholder="Program summary, sponsor, scope…" />
          </Field>
        </div>
      </section>

      <Tabs defaultValue="pnl" className="w-full">
        <TabsList>
          <TabsTrigger value="pnl">Business case & P&L</TabsTrigger>
          <TabsTrigger value="transition-costs">Transition costs</TabsTrigger>
          <TabsTrigger value="monthly">Monthly cashflow</TabsTrigger>
          <TabsTrigger value="roadmap">5-phase roadmap</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="pt-4"><PnlComparisonTab projectId={project.id} discountRatePct={project.discount_rate_pct ?? 10} /></TabsContent>
        <TabsContent value="transition-costs" className="pt-4"><TransitionCostsTab projectId={project.id} /></TabsContent>
        <TabsContent value="monthly" className="pt-4"><MonthlyCashflowTab projectId={project.id} /></TabsContent>
        <TabsContent value="roadmap" className="pt-4"><RoadmapTab projectId={project.id} /></TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ============ Business case helpers ============ */


function useTransition(projectId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["consolidation_transition", projectId],
    queryFn: async () => {
      const { data, error } = await sb.from("consolidation_transition_costs").select("*").eq("project_id", projectId).order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as TransitionCost[];
    },
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["consolidation_transition", projectId] });
  const add = useMutation({
    mutationFn: async (category: TransitionCat) => {
      const { error } = await sb.from("consolidation_transition_costs").insert({ project_id: projectId, category, label: "New item", amount: 0 });
      if (error) throw error;
    },
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async (patch: Partial<TransitionCost> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await sb.from("consolidation_transition_costs").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("consolidation_transition_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });
  return { rows: q.data ?? [], add, update, del };
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "positive" | "negative" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400"
      )}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ============ Transition costs ============ */

function TransitionCostsTab({ projectId }: { projectId: string }) {
  const t = useTransition(projectId);
  const total = t.rows.reduce((a, r) => a + Number(r.amount || 0), 0);
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Total one-time transition cost</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatUSD(total)}</p>
      </div>
      {TRANSITION_GROUPS.map((g) => {
        const rows = t.rows.filter((r) => r.category === g.key);
        const subtotal = rows.reduce((a, r) => a + Number(r.amount || 0), 0);
        return (
          <section key={g.key} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="text-base font-semibold">{g.title}</h3>
                <p className="text-xs text-muted-foreground">{g.blurb}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums">{formatUSD(subtotal)}</span>
                <Button size="sm" variant="outline" onClick={() => t.add.mutate(g.key)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add item
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-left font-medium">Note</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No items yet.</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2"><Input value={r.label} onChange={(e) => t.update.mutate({ id: r.id, label: e.target.value })} className="h-8" /></td>
                      <td className="px-4 py-2"><Input type="number" step="1000" value={r.amount} onChange={(e) => t.update.mutate({ id: r.id, amount: Number(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="px-4 py-2"><Input value={r.note ?? ""} onChange={(e) => t.update.mutate({ id: r.id, note: e.target.value })} className="h-8" /></td>
                      <td className="px-4 py-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => t.del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ============ Roadmap ============ */

function RoadmapTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["consolidation_phases", projectId],
    queryFn: async () => {
      const { data, error } = await sb.from("consolidation_phases").select("*").eq("project_id", projectId).order("sort_order");
      if (error) throw error;
      return (data ?? []) as Phase[];
    },
  });
  const phases = q.data ?? [];

  const update = useMutation({
    mutationFn: async (patch: Partial<Phase> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await sb.from("consolidation_phases").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consolidation_phases", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {phases.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {p.sort_order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Input value={p.name} onChange={(e) => update.mutate({ id: p.id, name: e.target.value })} className="h-8 max-w-md font-medium" />
                <button
                  type="button"
                  onClick={() => {
                    const next: PhaseStatus = p.status === "not_started" ? "in_progress" : p.status === "in_progress" ? "done" : "not_started";
                    update.mutate({ id: p.id, status: next });
                  }}
                  className={cn("rounded-full px-2.5 py-1 text-xs font-medium", PHASE_COLOR[p.status])}
                >
                  {PHASE_LABEL[p.status]}
                </button>
              </div>
              {p.description && <p className="mt-1.5 text-xs text-muted-foreground">{p.description}</p>}
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Field label="Owner"><OwnerSelect value={p.owner_id} onChange={(v) => update.mutate({ id: p.id, owner_id: v })} /></Field>
                <Field label="Start"><Input type="date" value={p.start_date ?? ""} onChange={(e) => update.mutate({ id: p.id, start_date: e.target.value || null })} /></Field>
                <Field label="End"><Input type="date" value={p.end_date ?? ""} onChange={(e) => update.mutate({ id: p.id, end_date: e.target.value || null })} /></Field>
                <Field label="Notes" className="md:col-span-1">
                  <Input value={p.notes ?? ""} onChange={(e) => update.mutate({ id: p.id, notes: e.target.value })} placeholder="Highlights, blockers, decisions…" />
                </Field>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ Dialogs ============ */

function NewProjectDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  useEffect(() => { if (open) setName(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New consolidation project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Project name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Site A + B → HUB North" autoFocus /></Field>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Copy className="h-3 w-3" /> Five roadmap phases are seeded automatically.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => { onCreate(name.trim()); onOpenChange(false); }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditProjectDialog({ open, onOpenChange, project, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; project: Project; onSave: (p: Partial<Project>) => void;
}) {
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description ?? "");
  useEffect(() => { if (open) { setName(project.name); setDesc(project.description ?? ""); } }, [open, project]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Description"><Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave({ name: name.trim() || project.name, description: desc || null }); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ Framework guide ============ */

function FrameworkGuide() {
  return (
    <details className="rounded-xl border border-border bg-muted/30 p-5 text-sm">
      <summary className="cursor-pointer font-semibold">About this framework</summary>
      <div className="prose prose-sm mt-3 max-w-none dark:prose-invert space-y-3">
        <p>Restructuring a manufacturing footprint by moving two sites into one comes down to a straightforward equation: do your ongoing operational savings justify the one-time price tag of making the move?</p>
        <h4>1. Building the savings baseline</h4>
        <p>Snapshot AS-IS combined cost of running both sites, compare to TO-BE cost of the consolidated site. Split into <b>Fixed</b> (leases, site leadership, IT, EHS, QMS certifications) and <b>Variable</b> (labor, utilities, materials, purchasing leverage).</p>
        <h4>2. One-time transition costs</h4>
        <p><b>Direct transfer:</b> rigging, transport, facility prep, re-certification, FAI, sign-off. <b>Double-running:</b> overlapping leases, parallel headcount, safety stock, ramp-up scrap. <b>PMO & transition:</b> program office, industrial engineers, logistics, severance, retention bonuses.</p>
        <h4>3. Five-step transition</h4>
        <ol>
          <li>Baseline & Layout Design</li>
          <li>Financial Approval (payback typically 2–3 years)</li>
          <li>Buffer Build & Preparation</li>
          <li>Phased Relocation</li>
          <li>Decommissioning & Savings Realization</li>
        </ol>
      </div>
    </details>
  );
}

/* ============ Monthly cashflow ============ */

type MonthlyEntry = {
  id: string; project_id: string; month: string; kind: "saving" | "cost";
  category: string; label: string; amount: number; note: string | null; sort_order: number;
};

const COST_CATEGORIES = [
  { key: "direct_transfer", label: "Direct transfer" },
  { key: "double_running", label: "Double-running" },
  { key: "pmo", label: "PMO / transition" },
  { key: "other", label: "Other" },
];
const SAVING_CATEGORIES = [
  { key: "fixed", label: "Fixed savings" },
  { key: "variable", label: "Variable savings" },
  { key: "other", label: "Other" },
];

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}
function monthLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}
function firstOfMonth(offset: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().slice(0, 10);
}

function MonthlyCashflowTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [horizon, setHorizon] = useState<number>(24);

  const q = useQuery({
    queryKey: ["consolidation_monthly", projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from("consolidation_monthly_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("month").order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as MonthlyEntry[];
    },
  });
  const entries = q.data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["consolidation_monthly", projectId] });

  const add = useMutation({
    mutationFn: async (kind: "saving" | "cost") => {
      const { error } = await sb.from("consolidation_monthly_entries").insert({
        project_id: projectId, kind, month: firstOfMonth(0),
        category: kind === "cost" ? "direct_transfer" : "fixed",
        label: kind === "cost" ? "New cost item" : "New savings item",
        amount: 0,
      });
      if (error) throw error;
    },
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async (patch: Partial<MonthlyEntry> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await sb.from("consolidation_monthly_entries").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("consolidation_monthly_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });

  const chartData = useMemo(() => {
    // Build month buckets: start = min(entries.month, today), end = start + horizon
    const startBase = entries.length
      ? entries.reduce((min, e) => (e.month < min ? e.month : min), entries[0].month)
      : firstOfMonth(0);
    const start = new Date(startBase + "T00:00:00Z");
    start.setUTCDate(1);
    const buckets: Record<string, { month: string; savings: number; costs: number }> = {};
    for (let i = 0; i < horizon; i++) {
      const d = new Date(start);
      d.setUTCMonth(d.getUTCMonth() + i);
      const iso = d.toISOString().slice(0, 10);
      buckets[monthKey(iso)] = { month: iso, savings: 0, costs: 0 };
    }
    for (const e of entries) {
      const k = monthKey(e.month);
      if (!buckets[k]) continue;
      const amt = Number(e.amount || 0);
      if (e.kind === "saving") buckets[k].savings += amt;
      else buckets[k].costs += amt;
    }
    let cum = 0;
    return Object.values(buckets)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((b) => {
        const net = b.savings - b.costs;
        cum += net;
        return {
          label: monthLabel(b.month),
          savings: b.savings,
          costs: -b.costs, // plot below axis
          net,
          cumulative: cum,
        };
      });
  }, [entries, horizon]);

  const totals = useMemo(() => {
    const savings = entries.filter((e) => e.kind === "saving").reduce((a, e) => a + Number(e.amount || 0), 0);
    const costs = entries.filter((e) => e.kind === "cost").reduce((a, e) => a + Number(e.amount || 0), 0);
    const finalCum = chartData.length ? chartData[chartData.length - 1].cumulative : 0;
    const breakEvenIdx = chartData.findIndex((r) => r.cumulative >= 0 && chartData.some((rr, i) => i < chartData.indexOf(r) && rr.cumulative < 0));
    return { savings, costs, net: savings - costs, finalCum, breakEven: breakEvenIdx >= 0 ? chartData[breakEvenIdx].label : null };
  }, [entries, chartData]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Total monthly savings entered" value={formatUSD(totals.savings)} tone="positive" />
        <Tile label="Total monthly costs entered" value={formatUSD(totals.costs)} tone="negative" />
        <Tile label="Net over entered period" value={formatUSD(totals.net)} tone={totals.net >= 0 ? "positive" : "negative"} />
        <Tile label={`Cumulative at month ${horizon}`} value={formatUSD(totals.finalCum)} hint={totals.breakEven ? `Break-even ~ ${totals.breakEven}` : "Not yet break-even"} />
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Monthly profit & cumulative cashflow</h3>
            <p className="text-xs text-muted-foreground">Savings (green) minus costs (red) per month, with cumulative cashflow line.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Horizon</label>
            <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[12, 18, 24, 36, 48, 60].map((n) => <SelectItem key={n} value={String(n)}>{n} months</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} stackOffset="sign" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatUSD(v)} />
              <Tooltip formatter={(v: number, name: string) => [formatUSD(Math.abs(v)), name]} />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="savings" name="Savings" stackId="net" fill="hsl(142 71% 45%)" />
              <Bar dataKey="costs" name="Costs" stackId="net" fill="hsl(0 72% 55%)" />
              <Line type="monotone" dataKey="cumulative" name="Cumulative cashflow" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {(["cost", "saving"] as const).map((kind) => {
        const rows = entries.filter((e) => e.kind === kind);
        const cats = kind === "cost" ? COST_CATEGORIES : SAVING_CATEGORIES;
        const title = kind === "cost" ? "Monthly cost entries" : "Monthly savings entries";
        const subtotal = rows.reduce((a, r) => a + Number(r.amount || 0), 0);
        return (
          <section key={kind} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  Each row is a single-month entry. Add multiple rows to spread a bucket across months.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums">{formatUSD(subtotal)}</span>
                <Button size="sm" variant="outline" onClick={() => add.mutate(kind)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add {kind}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Month</th>
                    <th className="px-4 py-2 text-left font-medium">Category</th>
                    <th className="px-4 py-2 text-left font-medium">Label</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 text-left font-medium">Note</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-muted-foreground">No entries yet.</td></tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2">
                        <Input type="month" value={r.month.slice(0, 7)}
                          onChange={(e) => update.mutate({ id: r.id, month: `${e.target.value}-01` })}
                          className="h-8 w-36" />
                      </td>
                      <td className="px-4 py-2">
                        <Select value={r.category} onValueChange={(v) => update.mutate({ id: r.id, category: v })}>
                          <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>{cats.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <Input value={r.label} onChange={(e) => update.mutate({ id: r.id, label: e.target.value })} className="h-8" />
                      </td>
                      <td className="px-4 py-2">
                        <Input type="number" step="1000" value={r.amount}
                          onChange={(e) => update.mutate({ id: r.id, amount: Number(e.target.value) })}
                          className="h-8 w-32 text-right" />
                      </td>
                      <td className="px-4 py-2">
                        <Input value={r.note ?? ""} onChange={(e) => update.mutate({ id: r.id, note: e.target.value })} className="h-8" />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ============ Business case & P&L (Before vs After) ============ */

type PnlLine = "revenue" | "variable_cost" | "transition_cost" | "fixed_cost";
type PnlScenario = "before" | "after";
type PnlSite = "site_a" | "site_b" | null;
type PnlEntry = {
  id: string; project_id: string; scenario: PnlScenario;
  site: PnlSite; month: string; line: PnlLine; amount: number;
};

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

const BEFORE_LINES: { key: Exclude<PnlLine, "transition_cost">; label: string }[] = [
  { key: "revenue", label: "Sales" },
  { key: "variable_cost", label: "Variable cost" },
  { key: "fixed_cost", label: "Fixed cost" },
];
const AFTER_LINES: { key: PnlLine; label: string }[] = [
  { key: "revenue", label: "Sales" },
  { key: "variable_cost", label: "Variable cost" },
  { key: "transition_cost", label: "Transition cost" },
  { key: "fixed_cost", label: "Fixed cost" },
];

const cellKey = (sc: PnlScenario, site: PnlSite, month: string, line: PnlLine) =>
  `${sc}|${site ?? ""}|${month}|${line}`;

function PnlComparisonTab({ projectId, discountRatePct }: { projectId: string; discountRatePct: number }) {
  const qc = useQueryClient();
  const [start, setStart] = useState<string>(() => firstOfMonth(0).slice(0, 7));
  const [horizon, setHorizon] = useState<number>(12);
  const [dirty, setDirty] = useState<Record<string, number>>({});
  const [discRate, setDiscRate] = useState<number>(discountRatePct);
  useEffect(() => { setDiscRate(discountRatePct); }, [discountRatePct]);

  const rateMut = useMutation({
    mutationFn: async (v: number) => {
      const { error } = await sb.from("consolidation_projects").update({ discount_rate_pct: v }).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["consolidation_projects"] }); },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  const pnlQ = useQuery({
    queryKey: ["consolidation_pnl", projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from("consolidation_pnl_entries")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data ?? []) as PnlEntry[];
    },
  });
  const monthlyQ = useQuery({
    queryKey: ["consolidation_monthly", projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from("consolidation_monthly_entries")
        .select("month,amount,kind")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data ?? []) as { month: string; amount: number; kind: "saving" | "cost" }[];
    },
  });

  const entries = pnlQ.data ?? [];
  const transition = monthlyQ.data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["consolidation_pnl", projectId] });

  const server = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) m.set(cellKey(e.scenario, e.site, e.month.slice(0, 10), e.line), Number(e.amount || 0));
    return m;
  }, [entries]);

  const serverHas = (sc: PnlScenario, site: PnlSite, month: string, line: PnlLine) =>
    server.has(cellKey(sc, site, month, line));
  const getStored = (sc: PnlScenario, site: PnlSite, month: string, line: PnlLine): number | undefined => {
    const k = cellKey(sc, site, month, line);
    if (k in dirty) return dirty[k];
    if (server.has(k)) return server.get(k);
    return undefined;
  };
  const getVal = (sc: PnlScenario, site: PnlSite, month: string, line: PnlLine): number =>
    getStored(sc, site, month, line) ?? 0;

  const transitionByMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transition) {
      if (t.kind !== "cost") continue;
      const key = t.month.slice(0, 10);
      m.set(key, (m.get(key) ?? 0) + Number(t.amount || 0));
    }
    return m;
  }, [transition]);

  // Effective After-transition value: user-entered wins; else fallback to Transition-costs tab sum.
  const getAfterTransition = (month: string): number => {
    const explicit = getStored("after", null, month, "transition_cost");
    if (explicit !== undefined) return explicit;
    return transitionByMonth.get(month) ?? 0;
  };

  const setCell = (sc: PnlScenario, site: PnlSite, month: string, line: PnlLine, val: number) => {
    const k = cellKey(sc, site, month, line);
    setDirty((d) => ({ ...d, [k]: val }));
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const rows = Object.entries(dirty).map(([k, amount]) => {
        const [scenario, site, month, line] = k.split("|");
        return {
          project_id: projectId,
          scenario: scenario as PnlScenario,
          site: site ? (site as Exclude<PnlSite, null>) : null,
          month,
          line: line as PnlLine,
          amount,
        };
      });
      if (rows.length === 0) return;
      const { error } = await sb
        .from("consolidation_pnl_entries")
        .upsert(rows, { onConflict: "project_id,scenario,site,month,line" });
      if (error) throw error;
    },
    onSuccess: () => { setDirty({}); invalidate(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearScenario = useMutation({
    mutationFn: async (scenario: PnlScenario) => {
      const { error } = await sb
        .from("consolidation_pnl_entries")
        .delete()
        .eq("project_id", projectId)
        .eq("scenario", scenario);
      if (error) throw error;
    },
    onSuccess: (_data, scenario) => {
      setDirty((d) => {
        const out: Record<string, number> = {};
        for (const [k, v] of Object.entries(d)) if (!k.startsWith(`${scenario}|`)) out[k] = v;
        return out;
      });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyBeforeToAfter = () => {
    // Copy per-month combined Before (A+B) into After (single site).
    const next: Record<string, number> = { ...dirty };
    for (const m of months) {
      for (const line of ["revenue", "variable_cost", "fixed_cost"] as const) {
        const combined = getVal("before", "site_a", m, line) + getVal("before", "site_b", m, line);
        next[cellKey("after", null, m, line)] = combined;
      }
    }
    setDirty(next);
    toast.info("Copied — click Save to persist");
  };

  const months = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < horizon; i++) out.push(addMonths(start + "-01", i));
    return out;
  }, [start, horizon]);

  // Per-scenario period totals
  const beforeTotals = useMemo(() => {
    let rev = 0, vc = 0, fc = 0;
    for (const m of months) {
      rev += getVal("before", "site_a", m, "revenue") + getVal("before", "site_b", m, "revenue");
      vc += getVal("before", "site_a", m, "variable_cost") + getVal("before", "site_b", m, "variable_cost");
      fc += getVal("before", "site_a", m, "fixed_cost") + getVal("before", "site_b", m, "fixed_cost");
    }
    return { revenue: rev, variable: vc, fixed: fc, profit: rev - vc - fc };
  }, [months, dirty, server]); // eslint-disable-line react-hooks/exhaustive-deps

  const afterTotals = useMemo(() => {
    let rev = 0, vc = 0, tc = 0, fc = 0;
    for (const m of months) {
      rev += getVal("after", null, m, "revenue");
      vc += getVal("after", null, m, "variable_cost");
      tc += getAfterTransition(m);
      fc += getVal("after", null, m, "fixed_cost");
    }
    return { revenue: rev, variable: vc, transition: tc, fixed: fc, profit: rev - vc - tc - fc };
  }, [months, dirty, server, transitionByMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chart data
  const chartData = useMemo(() => {
    let cumBefore = 0, cumAfter = 0;
    let payback: string | null = null;
    return months.map((m) => {
      const bRev = getVal("before", "site_a", m, "revenue") + getVal("before", "site_b", m, "revenue");
      const bVar = getVal("before", "site_a", m, "variable_cost") + getVal("before", "site_b", m, "variable_cost");
      const bFix = getVal("before", "site_a", m, "fixed_cost") + getVal("before", "site_b", m, "fixed_cost");
      const bProfit = bRev - bVar - bFix;

      const aRev = getVal("after", null, m, "revenue");
      const aVar = getVal("after", null, m, "variable_cost");
      const aFix = getVal("after", null, m, "fixed_cost");
      const aTrans = getAfterTransition(m);
      const aProfit = aRev - aVar - aTrans - aFix;

      cumBefore += bProfit;
      cumAfter += aProfit;
      if (payback === null && cumAfter >= cumBefore && (cumAfter > 0 || cumBefore > 0)) payback = m;
      return {
        label: monthLabel(m),
        month: m,
        b_revenue: bRev, b_variable: -bVar, b_fixed: -bFix, b_profit: bProfit,
        a_revenue: aRev, a_variable: -aVar, a_fixed: -aFix, a_transition: -aTrans, a_profit: aProfit,
        cum_before: cumBefore, cum_after: cumAfter,
      };
    }).map((r) => ({ ...r, __payback: r.month === payback ? r.label : null }));
  }, [months, dirty, server, transitionByMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const yDomain = useMemo(() => {
    let max = 0;
    for (const r of chartData) {
      max = Math.max(
        max,
        Math.abs(r.b_revenue), Math.abs(r.b_variable) + Math.abs(r.b_fixed),
        Math.abs(r.a_revenue), Math.abs(r.a_variable) + Math.abs(r.a_fixed) + Math.abs(r.a_transition),
      );
    }
    if (max === 0) return undefined;
    const pad = max * 0.15;
    return [-max - pad, max + pad] as [number, number];
  }, [chartData]);

  const paybackLabel = chartData.find((r) => r.__payback)?.__payback ?? null;
  const dirtyCount = Object.keys(dirty).length;

  // Cashflow series for NPV/IRR
  const incrementalCF = useMemo(() => chartData.map((r) => r.a_profit - r.b_profit), [chartData]);
  const absoluteCF = useMemo(() => chartData.map((r) => r.a_profit), [chartData]);
  const incNpv = useMemo(() => npv(incrementalCF, discRate), [incrementalCF, discRate]);
  const incIrr = useMemo(() => irr(incrementalCF), [incrementalCF]);
  const incPayback = useMemo(() => paybackMonth(incrementalCF), [incrementalCF]);
  const absNpv = useMemo(() => npv(absoluteCF, discRate), [absoluteCF, discRate]);
  const absIrr = useMemo(() => irr(absoluteCF), [absoluteCF]);
  const absPayback = useMemo(() => paybackMonth(absoluteCF), [absoluteCF]);
  const paybackHint = (m: number | null) => m == null ? "Not within horizon" : `Month ${m + 1} (${chartData[m]?.label ?? ""})`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="text-xs text-muted-foreground">Start month</label>
          <Input type="month" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 h-9 w-40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Horizon</label>
          <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
            <SelectTrigger className="mt-1 h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[6, 12, 18, 24, 36].map((n) => <SelectItem key={n} value={String(n)}>{n} months</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Discount rate (% / yr)</label>
          <Input
            type="number" step="0.1" value={discRate}
            onChange={(e) => setDiscRate(Number(e.target.value))}
            onBlur={() => { if (discRate !== discountRatePct) rateMut.mutate(discRate); }}
            className="mt-1 h-9 w-28"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dirtyCount > 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={copyBeforeToAfter} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" /> Copy Before → After
          </Button>
          <Button size="sm" variant="outline" onClick={() => { confirmThen("Clear all Before entries?", () => { clearScenario.mutate("before"); }) }}>Clear Before</Button>
          <Button size="sm" variant="outline" onClick={() => { confirmThen("Clear all After entries?", () => { clearScenario.mutate("after"); }) }}>Clear After</Button>
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={dirtyCount === 0 || saveMut.isPending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </section>

      {/* KPI tiles */}
      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Before profit (period)" value={formatUSD(beforeTotals.profit)} tone={beforeTotals.profit >= 0 ? "positive" : "negative"} hint={`Sales ${formatUSD(beforeTotals.revenue)}`} />
        <Tile label="After profit (period)" value={formatUSD(afterTotals.profit)} tone={afterTotals.profit >= 0 ? "positive" : "negative"} hint={`Incl. transition ${formatUSD(afterTotals.transition)}`} />
        <Tile label="Δ Profit (After − Before)" value={formatUSD(afterTotals.profit - beforeTotals.profit)} tone={afterTotals.profit - beforeTotals.profit >= 0 ? "positive" : "negative"} />
        <Tile label="Transition cost (period)" value={formatUSD(afterTotals.transition)} tone="negative" hint={paybackLabel ? `Payback ~ ${paybackLabel}` : "Payback not yet reached"} />
      </div>

      {/* NPV / IRR tiles */}
      <div className="grid gap-3 md:grid-cols-6">
        <Tile label="Incremental NPV" value={formatUSD(incNpv)} tone={incNpv >= 0 ? "positive" : "negative"} hint={`After − Before @ ${discRate}%/yr`} />
        <Tile label="Incremental IRR" value={formatPct(incIrr)} tone={(incIrr ?? 0) >= discRate ? "positive" : "negative"} hint="Annualized" />
        <Tile label="Incremental payback" value={paybackHint(incPayback)} tone={incPayback == null ? "negative" : "positive"} />
        <Tile label="Absolute NPV (After)" value={formatUSD(absNpv)} tone={absNpv >= 0 ? "positive" : "negative"} hint={`Incl. transition @ ${discRate}%/yr`} />
        <Tile label="Absolute IRR (After)" value={formatPct(absIrr)} tone={(absIrr ?? 0) >= discRate ? "positive" : "negative"} hint="Annualized" />
        <Tile label="Absolute payback" value={paybackHint(absPayback)} tone={absPayback == null ? "negative" : "positive"} />
      </div>

      {/* Before grid — per site */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="text-base font-semibold">Before consolidation — Site A &amp; Site B</h3>
            <p className="text-xs text-muted-foreground">Enter monthly Sales / Variable / Fixed cost separately for each site. Combined profit rolls up below.</p>
          </div>
          <span className={cn("text-sm font-semibold tabular-nums", beforeTotals.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
            Combined profit {formatUSD(beforeTotals.profit)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">Site / Line</th>
                {months.map((m) => <th key={m} className="px-2 py-2 text-right font-medium">{monthLabel(m)}</th>)}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(["site_a", "site_b"] as const).map((site) => (
                <React.Fragment key={site}>
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={months.length + 2} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
                      {site === "site_a" ? "Site A" : "Site B"}
                    </td>
                  </tr>
                  {BEFORE_LINES.map((row) => {
                    const rowTotal = months.reduce((a, m) => a + getVal("before", site, m, row.key), 0);
                    return (
                      <tr key={site + row.key} className="border-t border-border">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 pl-6">{row.label}</td>
                        {months.map((m) => {
                          const k = cellKey("before", site, m, row.key);
                          const raw = k in dirty ? dirty[k] : (server.get(k) ?? "");
                          return (
                            <td key={m} className="px-1 py-1 text-right">
                              <Input
                                type="number" step="1000"
                                value={raw === 0 ? 0 : (raw as number | string)}
                                onChange={(e) => setCell("before", site, m, row.key, Number(e.target.value || 0))}
                                className={cn("h-8 w-24 text-right", k in dirty && "border-amber-400")}
                              />
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-medium tabular-nums">{formatUSD(rowTotal)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-border">
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 pl-6 font-semibold">Profit ({site === "site_a" ? "A" : "B"})</td>
                    {months.map((m) => {
                      const p = getVal("before", site, m, "revenue") - getVal("before", site, m, "variable_cost") - getVal("before", site, m, "fixed_cost");
                      return (
                        <td key={m} className={cn("px-2 py-2 text-right font-semibold tabular-nums", p >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {p ? formatUSD(p) : "—"}
                        </td>
                      );
                    })}
                    <td className={cn("px-3 py-2 text-right font-semibold tabular-nums")}>
                      {formatUSD(months.reduce((a, m) => a + (getVal("before", site, m, "revenue") - getVal("before", site, m, "variable_cost") - getVal("before", site, m, "fixed_cost")), 0))}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              <tr className="border-t-2 border-border bg-muted/40">
                <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 font-bold">Combined profit (A + B)</td>
                {months.map((m) => {
                  const pA = getVal("before", "site_a", m, "revenue") - getVal("before", "site_a", m, "variable_cost") - getVal("before", "site_a", m, "fixed_cost");
                  const pB = getVal("before", "site_b", m, "revenue") - getVal("before", "site_b", m, "variable_cost") - getVal("before", "site_b", m, "fixed_cost");
                  const p = pA + pB;
                  return (
                    <td key={m} className={cn("px-2 py-2 text-right font-bold tabular-nums", p >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {p ? formatUSD(p) : "—"}
                    </td>
                  );
                })}
                <td className={cn("px-3 py-2 text-right font-bold tabular-nums", beforeTotals.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatUSD(beforeTotals.profit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* After grid */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="text-base font-semibold">After consolidation — single site</h3>
            <p className="text-xs text-muted-foreground">
              <b>Transition cost</b> is the one-time move cost inside the P&amp;L. Blank cells default to the sum from the <em>Transition costs</em> tab; type a value to override.
            </p>
          </div>
          <span className={cn("text-sm font-semibold tabular-nums", afterTotals.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
            Profit {formatUSD(afterTotals.profit)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">Line</th>
                {months.map((m) => <th key={m} className="px-2 py-2 text-right font-medium">{monthLabel(m)}</th>)}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {AFTER_LINES.map((row) => {
                const isTransition = row.key === "transition_cost";
                const rowTotal = months.reduce(
                  (a, m) => a + (isTransition ? getAfterTransition(m) : getVal("after", null, m, row.key)),
                  0,
                );
                return (
                  <tr key={row.key} className="border-t border-border">
                    <td className={cn("sticky left-0 z-10 bg-card px-3 py-2 font-medium", isTransition && "text-purple-700 dark:text-purple-400")}>{row.label}</td>
                    {months.map((m) => {
                      const k = cellKey("after", null, m, row.key);
                      let displayVal: number | string = "";
                      if (k in dirty) displayVal = dirty[k];
                      else if (server.has(k)) displayVal = server.get(k) as number;
                      else if (isTransition) {
                        const fb = transitionByMonth.get(m) ?? 0;
                        displayVal = fb || "";
                      }
                      const isFallback = isTransition && !(k in dirty) && !serverHas("after", null, m, row.key) && (transitionByMonth.get(m) ?? 0) > 0;
                      return (
                        <td key={m} className="px-1 py-1 text-right">
                          <Input
                            type="number" step="1000"
                            value={displayVal}
                            onChange={(e) => setCell("after", null, m, row.key, Number(e.target.value || 0))}
                            className={cn(
                              "h-8 w-24 text-right",
                              k in dirty && "border-amber-400",
                              isFallback && "italic text-muted-foreground",
                            )}
                            title={isFallback ? "Prefill from Transition costs tab — type to override" : undefined}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-medium tabular-nums">{formatUSD(rowTotal)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border bg-muted/40">
                <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 font-bold">Profit</td>
                {months.map((m) => {
                  const p = getVal("after", null, m, "revenue")
                    - getVal("after", null, m, "variable_cost")
                    - getAfterTransition(m)
                    - getVal("after", null, m, "fixed_cost");
                  return (
                    <td key={m} className={cn("px-2 py-2 text-right font-bold tabular-nums", p >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {p ? formatUSD(p) : "—"}
                    </td>
                  );
                })}
                <td className={cn("px-3 py-2 text-right font-bold tabular-nums", afterTotals.profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatUSD(afterTotals.profit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-scenario comparison charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["before", "after"] as const).map((sc) => {
          const isAfter = sc === "after";
          const title = isAfter ? "After consolidation (single site incl. transition)" : "Before consolidation (Site A + Site B combined)";
          return (
            <section key={sc} className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">Sales (green), variable &amp; fixed cost (below), profit line{isAfter ? ", plus transition cost inside the P&L." : "."}</p>
              <div className="mt-3 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} stackOffset="sign" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatUSD(v)} domain={yDomain as [number, number]} />
                    <Tooltip formatter={(v: number, name: string) => [formatUSD(Math.abs(v)), name]} />
                    <Legend />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Bar dataKey={isAfter ? "a_revenue" : "b_revenue"} name="Sales" stackId="pos" fill="hsl(142 71% 45%)" />
                    <Bar dataKey={isAfter ? "a_variable" : "b_variable"} name="Variable cost" stackId="neg" fill="hsl(24 90% 55%)" />
                    <Bar dataKey={isAfter ? "a_fixed" : "b_fixed"} name="Fixed cost" stackId="neg" fill="hsl(0 72% 55%)" />
                    {isAfter && (
                      <Bar dataKey="a_transition" name="Transition cost" stackId="neg" fill="hsl(280 60% 55%)" />
                    )}
                    <Line type="monotone" dataKey={isAfter ? "a_profit" : "b_profit"} name="Profit" stroke="hsl(217 91% 55%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(217 91% 55%)", stroke: "white", strokeWidth: 1.5 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        })}
      </div>

      {/* Cumulative comparison */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-base font-semibold">Cumulative cashflow — Before vs After</h3>
        <p className="text-xs text-muted-foreground">After already includes transition cost inside its P&amp;L. Crossover marks the payback month.</p>
        <div className="mt-3 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatUSD(v)} />
              <Tooltip formatter={(v: number, name: string) => [formatUSD(v), name]} />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              {paybackLabel && <ReferenceLine x={paybackLabel} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Payback", fontSize: 11, fill: "hsl(var(--primary))" }} />}
              <Line type="monotone" dataKey="cum_before" name="Cumulative Before" stroke="hsl(0 72% 55%)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="cum_after" name="Cumulative After (net of transition)" stroke="hsl(142 71% 45%)" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

