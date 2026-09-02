import { getCurrentUser } from "@/lib/auth-session";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { Plus, Factory, Presentation, Archive, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { assertWrote } from "@/lib/write-guard";
import { RowActions } from "@/components/commercial/row-actions";
import { EquipmentProjectDialog } from "./equipment-project-dialog";
import { EquipmentReviewMeeting } from "./equipment-review-meeting";
import type { EquipmentProject, EquipmentChecklistItem, EquipmentStage } from "./types";
import {
  STAGE_LABELS, STAGE_COLORS, HEALTH_COLORS, EQUIPMENT_STATUS_LABELS, CRITICAL_DRIVERS, money,
} from "./types";

const STAGES: EquipmentStage[] = [1, 2, 3, 4, 5, 6, 7];

export function EquipmentPanel() {
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState({ vendor: "", stage: "all", health: "all", status: "all", q: "" });
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const projectsQ = useQuery({
    queryKey: ["equipment_projects", showArchived],
    queryFn: async () => {
      let q = supabase.from("equipment_projects").select("*").order("created_at", { ascending: false });
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentProject[];
    },
  });

  const checklistQ = useQuery({
    queryKey: ["equipment_checklist_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_gate_checklist").select("project_id,stage,completed");
      if (error) throw error;
      return (data ?? []) as unknown as Pick<EquipmentChecklistItem, "project_id" | "stage" | "completed">[];
    },
  });

  const { data: profiles = [] } = useProfiles();
  const projects = projectsQ.data ?? [];

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; done: number; stageTotal: number; stageDone: number }>();
    for (const p of projects) m.set(p.id, { total: 0, done: 0, stageTotal: 0, stageDone: 0 });
    for (const it of checklistQ.data ?? []) {
      const s = m.get(it.project_id); if (!s) continue;
      s.total++; if (it.completed) s.done++;
      const proj = projects.find((p) => p.id === it.project_id);
      if (proj && it.stage === proj.stage) { s.stageTotal++; if (it.completed) s.stageDone++; }
    }
    return m;
  }, [projects, checklistQ.data]);

  const openProject = openProjectId ? projects.find((p) => p.id === openProjectId) ?? null : null;

  const vendors = useMemo(() => Array.from(new Set(projects.map((p) => p.vendor).filter(Boolean))) as string[], [projects]);

  const filtered = useMemo(() => projects.filter((p) => {
    if (filters.vendor && p.vendor !== filters.vendor) return false;
    if (filters.stage !== "all" && String(p.stage) !== filters.stage) return false;
    if (filters.health !== "all" && (p.health ?? "none") !== filters.health) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.q && !`${p.asset_name} ${p.vendor ?? ""} ${p.line_area ?? ""} ${p.po_number ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  }), [projects, filters]);

  const create = useMutation({
    mutationFn: async (v: Partial<EquipmentProject> & { asset_name: string }) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase.from("equipment_projects")
        .insert({ ...v, created_by: u.user?.id ?? null } as never).select().single();
      if (error) throw error;
      return data as unknown as EquipmentProject;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["equipment_projects"] });
      qc.invalidateQueries({ queryKey: ["equipment_checklist_all"] });
      setCreating(false);
      setOpenProjectId(p.id);
      toast.success("Equipment project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await supabase.from("equipment_projects")
        .update({ archived_at: archived ? new Date().toISOString() : null } as never)
        .eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["equipment_projects"] });
      toast.success(v.archived ? "Equipment project archived" : "Equipment project restored");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeProject = useMutation({
    mutationFn: async (id: string) => {
      for (const t of ["equipment_gate_checklist", "equipment_punch_items", "equipment_payment_milestones", "equipment_ramp_log"] as const) {
        const { error } = await supabase.from(t).delete().eq("project_id", id);
        if (error) throw error;
      }
      const { data, error } = await supabase.from("equipment_projects").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["equipment_projects"] });
      qc.invalidateQueries({ queryKey: ["equipment_checklist_all"] });
      if (openProjectId === id) setOpenProjectId(null);
      toast.success("Equipment project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });



  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Factory className="h-6 w-6" /> New Equipment</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Stage-gate capital equipment validation (GAMP 5 / ASTM E2500 style) from PO to steady-state handover:
            Design Freeze → FAT → IQ → SAT/OQ → PQ → Ramp &amp; OEE → Handover.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMeetingOpen(true)} disabled={filtered.length === 0}>
            <Presentation className="mr-1 h-4 w-4" /> Review meeting
          </Button>
          <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> New equipment</Button>
        </div>
      </header>

      <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-6">
        <Input placeholder="Search asset / PO / line" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <Select value={filters.vendor || "all"} onValueChange={(v) => setFilters({ ...filters, vendor: v === "all" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Vendor" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All vendors</SelectItem>{vendors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.stage} onValueChange={(v) => setFilters({ ...filters, stage: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All stages</SelectItem>{STAGES.map((g) => <SelectItem key={g} value={String(g)}>S{g} — {STAGE_LABELS[g].short}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.health} onValueChange={(v) => setFilters({ ...filters, health: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All health</SelectItem>
            <SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem>
            <SelectItem value="red">Red</SelectItem><SelectItem value="none">Not set</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {Object.entries(EQUIPMENT_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          <Archive className="h-3 w-3" /> Archived
        </label>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="board">Stage board</TabsTrigger>
          <TabsTrigger value="framework">Framework</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="pt-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <Factory className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No equipment projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add a machine once the PO is issued to start the stage-gate validation.</p>
              <Button className="mt-4" onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> New equipment</Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  c={counts.get(p.id)}
                  owner={ownerLabel(profiles.find((x) => x.id === p.owner_id))}
                  onOpen={() => setOpenProjectId(p.id)}
                  onArchiveToggle={(next) => setArchived.mutate({ id: p.id, archived: next })}
                  onDelete={() => removeProject.mutate(p.id)}
                />

              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="board" className="pt-3">
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
            {STAGES.map((g) => (
              <div key={g} className="rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 border-b p-2">
                  <Badge className={STAGE_COLORS[g]}>S{g}</Badge>
                  <span className="truncate text-xs font-semibold">{STAGE_LABELS[g].short}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{filtered.filter((p) => p.stage === g).length}</span>
                </div>
                <div className="min-h-[120px] space-y-2 p-2">
                  {filtered.filter((p) => p.stage === g).map((p) => (
                    <button key={p.id} onClick={() => setOpenProjectId(p.id)} className="w-full rounded-md border bg-card p-2 text-left hover:border-primary">
                      <div className="flex items-center gap-1.5">
                        {p.health && <span className={cn("h-2 w-2 rounded-full", HEALTH_COLORS[p.health])} />}
                        <span className="truncate text-sm font-medium">{p.asset_name}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{p.vendor}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="framework" className="space-y-4 pt-3">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs">
                <tr>
                  <th className="p-2 text-left">Stage</th>
                  <th className="p-2 text-left">Gate milestone</th>
                  <th className="p-2 text-left">What happens</th>
                </tr>
              </thead>
              <tbody>
                {STAGES.map((g) => (
                  <tr key={g} className="border-t align-top">
                    <td className="p-2"><Badge className={STAGE_COLORS[g]}>S{g} — {STAGE_LABELS[g].short}</Badge></td>
                    <td className="p-2 text-muted-foreground">{STAGE_LABELS[g].milestone}</td>
                    <td className="p-2">{STAGE_LABELS[g].blurb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {CRITICAL_DRIVERS.map((d) => (
              <div key={d.title} className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{d.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {openProject && <EquipmentProjectDialog project={openProject} onClose={() => setOpenProjectId(null)} />}
      {creating && <CreateDialog onCreate={(v) => create.mutate(v)} onClose={() => setCreating(false)} />}
      {meetingOpen && <EquipmentReviewMeeting projects={filtered} onClose={() => setMeetingOpen(false)} />}
    </div>
  );
}

function ProjectCard({ p, c, owner, onOpen, onArchiveToggle, onDelete }: {
  p: EquipmentProject;
  c?: { total: number; done: number; stageTotal: number; stageDone: number };
  owner: string;
  onOpen: () => void;
  onArchiveToggle: (next: boolean) => void;
  onDelete: () => void;
}) {
  const total = c?.total ?? 0;
  const done = c?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const stagePct = c?.stageTotal ? Math.round((c.stageDone / c.stageTotal) * 100) : 0;
  const days = p.target_handover_date ? Math.round((new Date(p.target_handover_date).getTime() - Date.now()) / 86400000) : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={cn(
        "cursor-pointer rounded-lg border bg-card p-4 text-left transition hover:border-primary",
        p.archived_at && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <Badge className={STAGE_COLORS[p.stage]}>S{p.stage}</Badge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-semibold">{p.asset_name}</div>
            {p.health && <span className={cn("h-2.5 w-2.5 flex-none rounded-full", HEALTH_COLORS[p.health])} />}
          </div>
          <div className="truncate text-xs text-muted-foreground">{p.vendor}{p.line_area ? ` · ${p.line_area}` : ""}</div>
        </div>
        {p.archived_at && <Badge variant="outline" className="text-xs">Archived</Badge>}
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions
            label={p.asset_name}
            archived={!!p.archived_at}
            onOpen={onOpen}
            onArchiveToggle={onArchiveToggle}
            onDelete={onDelete}
            deleteDescription="This permanently removes the project with its gate checklist, punch list, payment milestones and ramp log. This cannot be undone."
            size="sm"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div>
          <div className="flex justify-between text-muted-foreground"><span>Current stage ({STAGE_LABELS[p.stage].short})</span><span>{stagePct}%</span></div>
          <Progress value={stagePct} className="h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-muted-foreground"><span>Overall</span><span>{done}/{total}</span></div>
          <Progress value={pct} className="h-1.5" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{EQUIPMENT_STATUS_LABELS[p.status] ?? p.status}</span>
        <span>· {money(p.contract_value, p.currency)}</span>
        <span>· Owner: {owner}</span>
        {days !== null && (
          <span className={cn(days < 0 && "font-medium text-destructive")}>
            · Handover {days < 0 ? `${-days}d late` : `in ${days}d`}
          </span>
        )}
      </div>
    </div>

  );
}

function CreateDialog({ onCreate, onClose }: { onCreate: (v: Partial<EquipmentProject> & { asset_name: string }) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<EquipmentProject>>({
    asset_name: "", vendor: "", line_area: "", po_number: "", stage: 1, status: "planning", currency: "USD",
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New equipment project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Asset name *</Label><Input value={form.asset_name ?? ""} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Vendor / OEM</Label><Input value={form.vendor ?? ""} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
            <div><Label className="text-xs">Line / area</Label><Input value={form.line_area ?? ""} onChange={(e) => setForm({ ...form, line_area: e.target.value })} /></div>
            <div><Label className="text-xs">PO number</Label><Input value={form.po_number ?? ""} onChange={(e) => setForm({ ...form, po_number: e.target.value })} /></div>
            <div><Label className="text-xs">Contract value</Label><Input type="number" value={form.contract_value ?? ""} onChange={(e) => setForm({ ...form, contract_value: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          </div>
          <div><Label className="text-xs">Project owner</Label><OwnerSelect value={form.owner_id ?? null} onChange={(v) => setForm({ ...form, owner_id: v })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Starting stage</Label>
              <Select value={String(form.stage ?? 1)} onValueChange={(v) => setForm({ ...form, stage: Number(v) as EquipmentStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((g) => <SelectItem key={g} value={String(g)}>S{g} — {STAGE_LABELS[g].short}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Target handover date</Label><Input type="date" value={form.target_handover_date ?? ""} onChange={(e) => setForm({ ...form, target_handover_date: e.target.value || null })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!form.asset_name) return toast.error("Asset name required");
            onCreate({ ...form, asset_name: form.asset_name });
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
