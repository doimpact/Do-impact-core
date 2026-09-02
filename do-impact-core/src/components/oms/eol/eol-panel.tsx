import { getCurrentUser } from "@/lib/auth-session";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { Plus, Sunset, Presentation, Archive, Recycle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { assertWrote } from "@/lib/write-guard";
import { RowActions } from "@/components/commercial/row-actions";
import { EolProgramDialog } from "./eol-program-dialog";
import { EolReviewMeeting } from "./eol-review-meeting";
import type { EolProgram, EolChecklistItem, EolPhase } from "./types";
import { PHASE_LABELS, PHASE_COLORS, HEALTH_COLORS, EOL_STATUS_LABELS, VALUE_DRIVERS, money } from "./types";

const PHASES: EolPhase[] = [1, 2, 3, 4, 5];

const CHILD_TABLES = [
  "eol_gate_checklist",
  "eol_readiness",
  "eol_ltb_items",
  "eol_asset_disposition",
  "eol_customer_migration",
] as const;

export function EolPanel() {
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState({ phase: "all", health: "all", status: "all", q: "" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const programsQ = useQuery({
    queryKey: ["eol_programs", showArchived],
    queryFn: async () => {
      let q = supabase.from("eol_programs").select("*").order("created_at", { ascending: false });
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as EolProgram[];
    },
  });

  const checklistQ = useQuery({
    queryKey: ["eol_checklist_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("eol_gate_checklist").select("program_id,phase,completed");
      if (error) throw error;
      return (data ?? []) as unknown as Pick<EolChecklistItem, "program_id" | "phase" | "completed">[];
    },
  });

  const { data: profiles = [] } = useProfiles();
  const programs = programsQ.data ?? [];

  const counts = useMemo(() => {
    const m = new Map<string, { total: number; done: number; phaseTotal: number; phaseDone: number }>();
    for (const p of programs) m.set(p.id, { total: 0, done: 0, phaseTotal: 0, phaseDone: 0 });
    for (const it of checklistQ.data ?? []) {
      const s = m.get(it.program_id); if (!s) continue;
      s.total++; if (it.completed) s.done++;
      const prog = programs.find((p) => p.id === it.program_id);
      if (prog && it.phase === prog.phase) { s.phaseTotal++; if (it.completed) s.phaseDone++; }
    }
    return m;
  }, [programs, checklistQ.data]);

  const openProgram = openId ? programs.find((p) => p.id === openId) ?? null : null;

  const filtered = useMemo(() => programs.filter((p) => {
    if (filters.phase !== "all" && String(p.phase) !== filters.phase) return false;
    if (filters.health !== "all" && (p.health ?? "none") !== filters.health) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.q && !`${p.product_name} ${p.platform ?? ""} ${p.family ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  }), [programs, filters]);

  const create = useMutation({
    mutationFn: async (v: Partial<EolProgram> & { product_name: string }) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase.from("eol_programs")
        .insert({ ...v, created_by: u.user?.id ?? null } as never).select().single();
      if (error) throw error;
      return data as unknown as EolProgram;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["eol_programs"] });
      qc.invalidateQueries({ queryKey: ["eol_checklist_all"] });
      setCreating(false);
      setOpenId(p.id);
      toast.success("EOL programme created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await supabase.from("eol_programs")
        .update({ archived_at: archived ? new Date().toISOString() : null } as never)
        .eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["eol_programs"] });
      toast.success(v.archived ? "Programme archived" : "Programme restored");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeProgram = useMutation({
    mutationFn: async (id: string) => {
      for (const t of CHILD_TABLES) {
        const { error } = await supabase.from(t).delete().eq("program_id", id);
        if (error) throw error;
      }
      const { data, error } = await supabase.from("eol_programs").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["eol_programs"] });
      qc.invalidateQueries({ queryKey: ["eol_checklist_all"] });
      if (openId === id) setOpenId(null);
      toast.success("Programme deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Sunset className="h-6 w-6" /> End-of-Life (LCG 8)</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Run product sunset as an active value-recovery process, not an admin checklist: Trigger &amp; Strategy →
            Customer Migration → Ramp-Down → Asset Recovery → Closeout, starting 18–36 months before Final Time Ship.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMeetingOpen(true)} disabled={filtered.length === 0}>
            <Presentation className="mr-1 h-4 w-4" /> Review meeting
          </Button>
          <Button onClick={() => setCreating(true)}><Plus className="mr-1 h-4 w-4" /> New EOL programme</Button>
        </div>
      </header>

      <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-5">
        <Input placeholder="Search product / platform / family" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <Select value={filters.phase} onValueChange={(v) => setFilters({ ...filters, phase: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            {PHASES.map((g) => <SelectItem key={g} value={String(g)}>{PHASE_LABELS[g].code} — {PHASE_LABELS[g].short}</SelectItem>)}
          </SelectContent>
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
            {Object.entries(EOL_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-xs hover:bg-muted/50">
          <Checkbox className="h-5 w-5" aria-label="Show archived programmes" checked={showArchived} onCheckedChange={(v) => setShowArchived(v === true)} />
          <Archive className="h-3 w-3" /> Archived
        </label>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="board">Phase board</TabsTrigger>
          <TabsTrigger value="framework">Framework</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="pt-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No EOL programmes yet. Create one to seed the 5-phase gate checklist and readiness matrix.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProgramCard
                  key={p.id}
                  p={p}
                  c={counts.get(p.id)}
                  owner={ownerLabel(profiles.find((x) => x.id === p.program_owner_id))}
                  onOpen={() => setOpenId(p.id)}
                  onArchiveToggle={(next) => setArchived.mutate({ id: p.id, archived: next })}
                  onDelete={() => removeProgram.mutate(p.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="board" className="pt-3">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            {PHASES.map((g) => (
              <div key={g} className="rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 border-b p-2">
                  <Badge className={PHASE_COLORS[g]}>{PHASE_LABELS[g].code}</Badge>
                  <span className="truncate text-xs font-semibold">{PHASE_LABELS[g].short}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{filtered.filter((p) => p.phase === g).length}</span>
                </div>
                <div className="min-h-[120px] space-y-2 p-2">
                  {filtered.filter((p) => p.phase === g).map((p) => (
                    <button key={p.id} onClick={() => setOpenId(p.id)} className="w-full rounded-md border bg-card p-2 text-left hover:border-primary">
                      <div className="flex items-center gap-1.5">
                        {p.health && <span className={cn("h-2 w-2 rounded-full", HEALTH_COLORS[p.health])} />}
                        <span className="truncate text-sm font-medium">{p.product_name}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{p.platform ?? p.family ?? ""}</div>
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
                  <th className="p-2 text-left">Phase</th>
                  <th className="p-2 text-left">Timing</th>
                  <th className="p-2 text-left">What happens</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map((g) => (
                  <tr key={g} className="border-t align-top">
                    <td className="p-2"><Badge className={PHASE_COLORS[g]}>{PHASE_LABELS[g].code} — {PHASE_LABELS[g].short}</Badge></td>
                    <td className="whitespace-nowrap p-2 text-muted-foreground">{PHASE_LABELS[g].window}</td>
                    <td className="p-2">{PHASE_LABELS[g].blurb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {VALUE_DRIVERS.map((d) => (
              <div key={d.title} className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center gap-2 font-semibold"><Recycle className="h-4 w-4 text-primary" />{d.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-semibold">Gate 8 KPI targets</div>
            <ul className="mt-2 grid gap-1 text-muted-foreground md:grid-cols-2">
              <li>Inventory obsolescence ratio — under 0.5% of lifetime revenue</li>
              <li>LTB demand variance — within ±5% over 3–5 years</li>
              <li>Factory floor velocity — under 30 days from FTS to line cleared</li>
              <li>Aftermarket margin retention — at or above original production margin</li>
              <li>Customer migration rate — above 90% of the installed base</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {openProgram && <EolProgramDialog program={openProgram} onClose={() => setOpenId(null)} />}
      {creating && <CreateDialog onCreate={(v) => create.mutate(v)} onClose={() => setCreating(false)} />}
      {meetingOpen && <EolReviewMeeting programs={filtered} onClose={() => setMeetingOpen(false)} />}
    </div>
  );
}

function ProgramCard({ p, c, owner, onOpen, onArchiveToggle, onDelete }: {
  p: EolProgram;
  c?: { total: number; done: number; phaseTotal: number; phaseDone: number };
  owner: string;
  onOpen: () => void;
  onArchiveToggle: (next: boolean) => void;
  onDelete: () => void;
}) {
  const total = c?.total ?? 0;
  const done = c?.done ?? 0;
  const overall = total ? Math.round((done / total) * 100) : 0;
  const phasePct = c?.phaseTotal ? Math.round((c.phaseDone / c.phaseTotal) * 100) : 0;
  const days = p.fts_date ? Math.round((new Date(p.fts_date).getTime() - Date.now()) / 86400000) : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={cn("min-w-0 cursor-pointer rounded-lg border bg-card p-4 text-left transition hover:border-primary", p.archived_at && "opacity-60")}
    >
      <div className="flex items-start gap-2">
        <Badge className={PHASE_COLORS[p.phase]}>{PHASE_LABELS[p.phase].code}</Badge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-semibold">{p.product_name}</div>
            {p.health && <span className={cn("h-2.5 w-2.5 flex-none rounded-full", HEALTH_COLORS[p.health])} />}
          </div>
          <div className="truncate text-xs text-muted-foreground">{[p.platform, p.family].filter(Boolean).join(" · ")}</div>
        </div>
        {p.archived_at && <Badge variant="outline" className="text-xs">Archived</Badge>}
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions
            label={p.product_name}
            archived={!!p.archived_at}
            onOpen={onOpen}
            onArchiveToggle={onArchiveToggle}
            onDelete={onDelete}
            deleteDescription="This permanently removes the programme with its gate checklist, readiness matrix, LTB items, asset disposition register and customer migration list. This cannot be undone."
            size="sm"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div>
          <div className="flex justify-between text-muted-foreground"><span>Current phase ({PHASE_LABELS[p.phase].short})</span><span>{phasePct}%</span></div>
          <Progress value={phasePct} className="h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-muted-foreground"><span>Overall</span><span>{done}/{total}</span></div>
          <Progress value={overall} className="h-1.5" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{EOL_STATUS_LABELS[p.status] ?? p.status}</span>
        <span>· Reserve {money(p.reserve_budget, p.currency)}</span>
        <span>· Owner: {owner}</span>
        {days !== null && (
          <span className={cn(days < 0 && "font-medium")}>
            · FTS {days < 0 ? `${-days}d ago` : `in ${days}d`}
          </span>
        )}
      </div>
    </div>
  );
}

function CreateDialog({ onCreate, onClose }: { onCreate: (v: Partial<EolProgram> & { product_name: string }) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<EolProgram>>({
    product_name: "", platform: "", family: "", phase: 1, status: "planning", currency: "USD",
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New EOL programme</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Product / part *</Label><Input value={form.product_name ?? ""} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Platform</Label><Input value={form.platform ?? ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></div>
            <div><Label className="text-xs">Product family</Label><Input value={form.family ?? ""} onChange={(e) => setForm({ ...form, family: e.target.value })} /></div>
            <div><Label className="text-xs">Lifetime revenue</Label><Input type="number" value={form.lifetime_revenue ?? ""} onChange={(e) => setForm({ ...form, lifetime_revenue: e.target.value === "" ? null : Number(e.target.value) })} /></div>
            <div><Label className="text-xs">EOL reserve budget</Label><Input type="number" value={form.reserve_budget ?? ""} onChange={(e) => setForm({ ...form, reserve_budget: e.target.value === "" ? null : Number(e.target.value) })} /></div>
          </div>
          <div><Label className="text-xs">Programme owner</Label><OwnerSelect value={form.program_owner_id ?? null} onChange={(v) => setForm({ ...form, program_owner_id: v })} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Starting phase</Label>
              <Select value={String(form.phase ?? 1)} onValueChange={(v) => setForm({ ...form, phase: Number(v) as EolPhase })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PHASES.map((g) => <SelectItem key={g} value={String(g)}>{PHASE_LABELS[g].code} — {PHASE_LABELS[g].short}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Final Time Ship (FTS)</Label><Input type="date" value={form.fts_date ?? ""} onChange={(e) => setForm({ ...form, fts_date: e.target.value || null })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!form.product_name) return toast.error("Product name required");
            onCreate({ ...form, product_name: form.product_name });
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
