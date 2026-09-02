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
import { Plus, Rocket, Presentation, Archive, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NpiProjectDialog } from "./npi-project-dialog";
import { NpiReviewMeeting } from "./npi-review-meeting";
import type { NpiProject, ChecklistItem } from "./npi-types";
import { GATE_LABELS, GATE_COLORS, HEALTH_COLORS, STATUS_LABELS } from "./npi-types";

export function NpiPanel() {
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState({ customer: "", gate: "all", health: "all", status: "all", owner: "all", q: "" });
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const projectsQ = useQuery({
    queryKey: ["npi_projects", showArchived],
    queryFn: async () => {
      let q = supabase.from("npi_projects").select("*").order("created_at", { ascending: false });
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as NpiProject[];
    },
  });

  const checklistQ = useQuery({
    queryKey: ["npi_checklist_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("npi_gate_checklist").select("project_id,gate,completed");
      if (error) throw error;
      return (data ?? []) as Pick<ChecklistItem, "project_id" | "gate" | "completed">[];
    },
  });

  const { data: profiles = [] } = useProfiles();
  const projects = projectsQ.data ?? [];
  // Look the open project up live so mutations inside the dialog re-render it.
  const openProject = openProjectId ? projects.find((p) => p.id === openProjectId) ?? null : null;
  const checklistByProject = useMemo(() => {
    const m = new Map<string, { total: number; done: number; gateTotal: number; gateDone: number }>();
    for (const p of projects) m.set(p.id, { total: 0, done: 0, gateTotal: 0, gateDone: 0 });
    for (const it of checklistQ.data ?? []) {
      const s = m.get(it.project_id); if (!s) continue;
      s.total++; if (it.completed) s.done++;
      const proj = projects.find((p) => p.id === it.project_id);
      if (proj && it.gate === proj.current_gate) { s.gateTotal++; if (it.completed) s.gateDone++; }
    }
    return m;
  }, [projects, checklistQ.data]);

  const customers = useMemo(() => Array.from(new Set(projects.map((p) => p.customer).filter(Boolean))) as string[], [projects]);

  const filtered = useMemo(() => projects.filter((p) => {
    if (filters.customer && p.customer !== filters.customer) return false;
    if (filters.gate !== "all" && String(p.current_gate) !== filters.gate) return false;
    if (filters.health !== "all" && (p.health ?? "none") !== filters.health) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.owner !== "all" && p.owner_id !== filters.owner) return false;
    if (filters.q && !`${p.part_number} ${p.part_name ?? ""} ${p.customer ?? ""} ${p.program ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  }), [projects, filters]);

  const create = useMutation({
    mutationFn: async (v: Partial<NpiProject> & { part_number: string }) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase.from("npi_projects").insert({
        ...v, part_number: v.part_number, created_by: u.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data as NpiProject;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["npi_projects"] });
      qc.invalidateQueries({ queryKey: ["npi_checklist_all"] });
      setCreating(false);
      setOpenProjectId(p.id);
      toast.success("NPI project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Rocket className="h-6 w-6" /> New Product Introduction</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Aerospace AS9145 5-gate framework aligned to customer milestones (Contract → PDR/CDR → PRR → FAI → EIS).
            Track gate readiness, risks, and progress across every NPI program.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMeetingOpen(true)} disabled={filtered.length === 0}>
            <Presentation className="h-4 w-4 mr-1" /> Review meeting
          </Button>
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New NPI</Button>
        </div>
      </header>

      <div className="rounded-lg border p-3 grid gap-2 md:grid-cols-6">
        <Input placeholder="Search part / customer" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <Select value={filters.customer || "all"} onValueChange={(v) => setFilters({ ...filters, customer: v === "all" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All customers</SelectItem>{customers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.gate} onValueChange={(v) => setFilters({ ...filters, gate: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All gates</SelectItem>{[1,2,3,4,5].map((g) => <SelectItem key={g} value={String(g)}>Gate {g}</SelectItem>)}</SelectContent>
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
            {Object.entries(STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            <Archive className="h-3 w-3" /> Archived
          </label>
        </div>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="board">Gate Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="matrix">Alignment matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="pt-3">
          {filtered.length === 0 ? (
            <EmptyState onCreate={() => setCreating(true)} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard key={p.id} p={p} counts={checklistByProject.get(p.id)} onOpen={() => setOpenProjectId(p.id)} owner={ownerLabel(profiles.find((x) => x.id === p.owner_id))} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="board" className="pt-3">
          <div className="grid gap-3 md:grid-cols-5">
            {[1,2,3,4,5].map((g) => (
              <div key={g} className="rounded-lg border bg-muted/30">
                <div className="p-2 border-b flex items-center gap-2">
                  <Badge className={GATE_COLORS[g]}>G{g}</Badge>
                  <span className="text-sm font-semibold">{GATE_LABELS[g].short}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{filtered.filter((p) => p.current_gate === g).length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {filtered.filter((p) => p.current_gate === g).map((p) => (
                    <button key={p.id} onClick={() => setOpenProjectId(p.id)} className="w-full text-left rounded-md border bg-card p-2 hover:border-primary">
                      <div className="flex items-center gap-1.5">
                        {p.health && <span className={cn("h-2 w-2 rounded-full", HEALTH_COLORS[p.health])} />}
                        <span className="text-sm font-medium truncate">{p.part_number}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{p.customer}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="pt-3">
          <TimelineView projects={filtered} onOpen={(p) => setOpenProjectId(p.id)} />
        </TabsContent>

        <TabsContent value="matrix" className="pt-3">
          <AlignmentMatrix />
        </TabsContent>
      </Tabs>

      {openProject && <NpiProjectDialog project={openProject} onClose={() => setOpenProjectId(null)} />}
      {creating && <CreateDialog onCreate={(v) => create.mutate(v)} onClose={() => setCreating(false)} />}
      {meetingOpen && <NpiReviewMeeting projects={filtered} onClose={() => setMeetingOpen(false)} />}
    </div>
  );
}

function ProjectCard({ p, counts, onOpen, owner }: { p: NpiProject; counts?: { total: number; done: number; gateTotal: number; gateDone: number }; onOpen: () => void; owner: string }) {
  const total = counts?.total ?? 0;
  const done = counts?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const gatePct = counts?.gateTotal ? Math.round((counts.gateDone / counts.gateTotal) * 100) : 0;
  const daysToEis = p.target_eis_date ? Math.round((new Date(p.target_eis_date).getTime() - Date.now()) / 86400000) : null;
  return (
    <button onClick={onOpen} className="text-left rounded-lg border bg-card p-4 hover:border-primary transition">
      <div className="flex items-start gap-2">
        <Badge className={GATE_COLORS[p.current_gate]}>G{p.current_gate}</Badge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate">{p.part_number}</div>
            {p.health && <span className={cn("h-2.5 w-2.5 rounded-full flex-none", HEALTH_COLORS[p.health])} />}
          </div>
          <div className="text-xs text-muted-foreground truncate">{p.customer}{p.program ? ` · ${p.program}` : ""}</div>
        </div>
        {p.archived_at && <Badge variant="outline" className="text-xs">Archived</Badge>}
      </div>
      <div className="mt-3 space-y-2 text-xs">
        <div>
          <div className="flex justify-between text-muted-foreground"><span>Current gate ({GATE_LABELS[p.current_gate].short})</span><span>{gatePct}%</span></div>
          <Progress value={gatePct} className="h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-muted-foreground"><span>Overall</span><span>{done}/{total}</span></div>
          <Progress value={pct} className="h-1.5" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{STATUS_LABELS[p.status]}</span>
        <span>· Owner: {owner}</span>
        {daysToEis !== null && (
          <span className={cn(daysToEis < 0 && "text-destructive font-medium")}>
            · EIS {daysToEis < 0 ? `${-daysToEis}d late` : `in ${daysToEis}d`}
          </span>
        )}
      </div>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <Rocket className="h-10 w-10 mx-auto text-muted-foreground" />
      <h3 className="mt-3 font-semibold">No NPI projects yet</h3>
      <p className="text-sm text-muted-foreground mt-1">Create your first program to start tracking AS9145 gate readiness.</p>
      <Button className="mt-4" onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> New NPI</Button>
    </div>
  );
}

function CreateDialog({ onCreate, onClose }: { onCreate: (v: Partial<NpiProject> & { part_number: string }) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<NpiProject>>({
    part_number: "", part_name: "", customer: "", program: "", current_gate: 1, status: "planning",
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New NPI project</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Part number *</Label><Input value={form.part_number ?? ""} onChange={(e) => setForm({ ...form, part_number: e.target.value })} /></div>
          <div><Label className="text-xs">Part name</Label><Input value={form.part_name ?? ""} onChange={(e) => setForm({ ...form, part_name: e.target.value })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Customer</Label><Input value={form.customer ?? ""} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></div>
            <div><Label className="text-xs">Program</Label><Input value={form.program ?? ""} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
          </div>
          <div><Label className="text-xs">Owner</Label><OwnerSelect value={form.owner_id ?? null} onChange={(v) => setForm({ ...form, owner_id: v })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Starting gate</Label>
              <Select value={String(form.current_gate ?? 1)} onValueChange={(v) => setForm({ ...form, current_gate: Number(v) as 1|2|3|4|5 })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map((g) => <SelectItem key={g} value={String(g)}>Gate {g} — {GATE_LABELS[g].short}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Target EIS date</Label><Input type="date" value={form.target_eis_date ?? ""} onChange={(e) => setForm({ ...form, target_eis_date: e.target.value || null })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!form.part_number) return toast.error("Part number required");
            onCreate({ ...form, part_number: form.part_number });
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimelineView({ projects, onOpen }: { projects: NpiProject[]; onOpen: (p: NpiProject) => void }) {
  const dates = projects.flatMap((p) => [p.contract_award_date, p.pdr_cdr_date, p.prr_date, p.fai_date, p.eis_date, p.target_eis_date].filter(Boolean) as string[]);
  if (dates.length === 0) return <p className="text-sm text-muted-foreground italic p-6 text-center">No milestone dates entered yet.</p>;
  const min = new Date(Math.min(...dates.map((d) => new Date(d).getTime())));
  const max = new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
  const span = Math.max(1, max.getTime() - min.getTime());
  const pos = (d: string | null) => d ? ((new Date(d).getTime() - min.getTime()) / span) * 100 : null;

  const MS: [keyof NpiProject, string, string][] = [
    ["contract_award_date", "CA", "bg-slate-500"],
    ["pdr_cdr_date", "PDR", "bg-blue-500"],
    ["prr_date", "PRR", "bg-indigo-500"],
    ["fai_date", "FAI", "bg-amber-500"],
    ["eis_date", "EIS", "bg-emerald-500"],
  ];

  return (
    <div className="rounded-lg border overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[200px_1fr] border-b bg-muted/40 text-xs font-semibold">
          <div className="p-2">Project</div>
          <div className="p-2 flex justify-between text-muted-foreground">
            <span>{min.toISOString().slice(0, 10)}</span><span>{max.toISOString().slice(0, 10)}</span>
          </div>
        </div>
        {projects.map((p) => (
          <div key={p.id} className="grid grid-cols-[200px_1fr] border-b items-center">
            <button onClick={() => onOpen(p)} className="p-2 text-left hover:bg-muted/40">
              <div className="text-sm font-medium truncate">{p.part_number}</div>
              <div className="text-xs text-muted-foreground truncate">{p.customer}</div>
            </button>
            <div className="relative h-10">
              {MS.map(([key, label, color]) => {
                const v = p[key] as string | null;
                const l = pos(v);
                if (l === null) return null;
                return (
                  <div key={label} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${l}%` }}>
                    <div className={cn("h-3 w-3 rounded-full", color)} title={`${label}: ${v}`} />
                    <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlignmentMatrix() {
  const rows = [
    { gate: 1, focus: "Feasibility & Flowdown", milestone: "Contract Award / ITD", deliverable: "Integrated NPI Schedule" },
    { gate: 2, focus: "Design Lock & Risk", milestone: "PDR / CDR", deliverable: "Released Drawings & DFMEA" },
    { gate: 3, focus: "Manufacturing Setup", milestone: "PRR", deliverable: "PFMEA, Tooling, Control Plan" },
    { gate: 4, focus: "Rate & Capability Proving", milestone: "FAI / AS9102 / PPAP", deliverable: "Customer Approved FAIR" },
    { gate: 5, focus: "Steady-State Handoff", milestone: "EIS / Rate Production", deliverable: "Cpk ≥ 1.33 & Handoff Sign-off" },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs">
            <tr><th className="p-2 text-left">Gate</th><th className="p-2 text-left">Primary focus</th><th className="p-2 text-left">Customer milestone</th><th className="p-2 text-left">Core deliverable</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.gate} className="border-t">
                <td className="p-2"><Badge className={GATE_COLORS[r.gate]}>Gate {r.gate} — {GATE_LABELS[r.gate].short}</Badge></td>
                <td className="p-2">{r.focus}</td>
                <td className="p-2 text-muted-foreground">{r.milestone}</td>
                <td className="p-2">{r.deliverable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border p-4 bg-amber-500/5 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-none mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">The 10× Cost Rule in Aerospace NPI</div>
          <p className="text-muted-foreground mt-1">
            Catching an issue at Gate 2 costs <b>1×</b>. Gate 3: <b>10×</b>. Gate 4 (FAI): <b>100×</b>.
            Shipping a bad part to a customer assembly line (Gate 5): <b>1,000×</b> plus potential line-down penalties and containment audits.
          </p>
        </div>
      </div>
    </div>
  );
}
