import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useDemoNow } from "@/lib/demo-date";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronLeft, ChevronRight, Play, CheckCircle2, Users, Factory, Package, DollarSign, ClipboardCheck, Presentation, Sparkles, Truck, Layers, Archive, ArchiveRestore } from "lucide-react";
import { SiopLongLead } from "@/components/oms/siop-long-lead";
import { SiopOsp } from "@/components/oms/siop-osp";
import { SiopApsRollup } from "@/components/oms/siop-aps-rollup";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { assertWrote } from "@/lib/write-guard";
import { confirmThen } from "@/components/confirm-dialog";
import { useSandbox } from "@/hooks/use-sandbox";
import { useMyAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/_authenticated/oms/siop")({
  head: () => ({ meta: [{ title: "SIOP — DO.Impact" }] }),
  component: SiopPage,
});

type Cycle = { id: string; cycle_month: string; title: string; status: string; current_step: number; notes: string | null };
type MonthlyMap = Record<string, Record<string, number>>;
type Demand = { id: string; cycle_id: string; product_line: string; workscope: string | null; segment: string | null; firm_units: number; pipeline_units: number; weighted_units: number; revenue_estimate: number; notes: string | null; monthly_values: MonthlyMap };
type Capacity = { id: string; cycle_id: string; resource_type: string; resource_name: string; available_capacity: number; required_capacity: number; unit: string | null; status: string; mitigation: string | null; notes: string | null; monthly_values: MonthlyMap; archived_at?: string | null };
type Scenario = { id: string; cycle_id: string; option_label: string; description: string | null; revenue_impact: number; cost_impact: number; ebitda_impact: number; tat_impact: string | null; risk_level: string; recommended: boolean; selected: boolean; notes: string | null };
type Decision = { id: string; cycle_id: string; step: number; decision: string; rationale: string | null; owner_id: string | null; due_date: string | null; status: string; category: string | null };
type Kpi = { id: string; cycle_id: string; kpi_name: string; category: string | null; plan_value: number | null; actual_value: number | null; variance: number | null; status: string; notes: string | null };

function monthKeys(cycleMonth: string, count = 24): string[] {
  const d = new Date(cycleMonth);
  if (isNaN(d.getTime())) return [];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1));
    out.push(`${m.getUTCFullYear()}-${String(m.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
function monthLabel(k: string) {
  const [y, m] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}
function sumMonthly(m: MonthlyMap | undefined | null, key: string): number {
  if (!m) return 0;
  return Object.values(m).reduce((s, row) => s + Number(row?.[key] ?? 0), 0);
}

const STEPS = [
  { n: 1, label: "Demand Review", icon: Users, color: "#3b82f6", desc: "Unconstrained baseline of market demand across all workscopes" },
  { n: 2, label: "Capacity & Supply", icon: Factory, color: "#8b5cf6", desc: "Evaluate labor, facility, tooling and material constraints" },
  { n: 3, label: "Pre-S&OP Alignment", icon: Package, color: "#f59e0b", desc: "Trade-off scenarios and financialized reconciliation" },
  { n: 4, label: "Executive S&OP", icon: Presentation, color: "#ef4444", desc: "Executive sign-off, capital allocation, strategic trade-offs" },
  { n: 5, label: "Execution & Control", icon: ClipboardCheck, color: "#22c55e", desc: "Translate plan to S&OE — weekly/daily execution" },
  { n: 6, label: "Long-Lead Materials", icon: Layers, color: "#0ea5e9", desc: "Ti, Inco, composites, forgings — POs, promised vs need-by" },
  { n: 7, label: "OSP & Sub-tier", icon: Truck, color: "#a855f7", desc: "Heat treat, coating, machining outside — turnaround velocity" },
] as const;

const STATUS_COLOR: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
function fmtM(n: number | null | undefined) {
  if (n == null) return "—";
  return `$${(n / 1_000_000).toFixed(2)}M`;
}

function MonthlyGrid({
  cycleMonth, fields, values, onChange, months = 24,
}: {
  cycleMonth: string;
  fields: { key: string; label: string }[];
  values: MonthlyMap;
  onChange: (next: MonthlyMap) => void;
  months?: number;
}) {
  const keys = monthKeys(cycleMonth, months);
  const totals = fields.map((f) => keys.reduce((s, k) => s + Number(values?.[k]?.[f.key] ?? 0), 0));
  return (
    <div className="border rounded-md overflow-auto max-h-[320px]">
      <table className="text-xs w-full border-collapse">
        <thead className="bg-muted sticky top-0 z-10">
          <tr>
            <th className="p-1.5 text-left sticky left-0 bg-muted z-20">Month</th>
            {fields.map((f) => <th key={f.key} className="p-1.5 text-right min-w-[100px]">{f.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-t">
              <td className="p-1 sticky left-0 bg-background font-medium whitespace-nowrap">{monthLabel(k)}</td>
              {fields.map((f) => (
                <td key={f.key} className="p-0.5">
                  <Input
                    type="number"
                    className="h-7 text-right text-xs"
                    value={values?.[k]?.[f.key] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const next: MonthlyMap = { ...(values ?? {}) };
                      const row = { ...(next[k] ?? {}) };
                      if (v === "") delete row[f.key]; else row[f.key] = Number(v);
                      if (Object.keys(row).length) next[k] = row; else delete next[k];
                      onChange(next);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t bg-muted/60 font-semibold">
            <td className="p-1.5 sticky left-0 bg-muted/60">Total</td>
            {totals.map((t, i) => <td key={i} className="p-1.5 text-right">{fmt(t)}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}


function SiopPage() {
  const qc = useQueryClient();
  const { isSandbox } = useSandbox();
  const { canWrite } = useMyAccess();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewedStep, setViewedStep] = useState(1);
  const [meetingMode, setMeetingMode] = useState(false);

  const cyclesQ = useQuery({
    queryKey: ["siop_cycles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_cycles" as any).select("*").order("cycle_month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Cycle[];
    },
  });

  const cycles = cyclesQ.data ?? [];
  const cycle = cycles.find((c) => c.id === selectedId) ?? cycles[0] ?? null;
  const currentId = cycle?.id ?? null;

  useEffect(() => {
    setViewedStep(cycle?.current_step ?? 1);
  }, [cycle?.id, cycle?.current_step]);

  const demoNow = useDemoNow();
  const [newOpen, setNewOpen] = useState(false);
  const [newMonth, setNewMonth] = useState(() => demoNow.toISOString().slice(0, 7));
  const [newTitle, setNewTitle] = useState("");

  const createCycle = useMutation({
    mutationFn: async (v: { cycle_month: string; title: string }) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase.from("siop_cycles" as any).insert({
        cycle_month: `${v.cycle_month}-01`, title: v.title, created_by: u.user?.id, owner_id: u.user?.id,
      }).select("id").single();
      if (error) throw error;
      return (data as any).id as string;
    },
    onSuccess: (id) => { setSelectedId(id); setNewOpen(false); setNewTitle(""); qc.invalidateQueries({ queryKey: ["siop_cycles"] }); toast.success("Cycle created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const advanceStep = useMutation({
    mutationFn: async (v: { id: string; step: number }) => {
      const { data, error } = await supabase.from("siop_cycles" as any).update({ current_step: v.step }).eq("id", v.id).select("id");
      if (error) throw error;
      assertWrote(data, "update SIOP progress");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_cycles"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const viewStep = (step: number) => {
    setViewedStep(step);
    if (cycle && canWrite && !isSandbox && step !== cycle.current_step) {
      advanceStep.mutate({ id: cycle.id, step });
    }
  };

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("siop_cycles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { setSelectedId(null); qc.invalidateQueries({ queryKey: ["siop_cycles"] }); toast.success("Deleted"); },
  });

  if (cyclesQ.isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap" data-tour="siop-cycle-list">
        <div>
          <h1 className="text-3xl font-bold">Sales & Operations Planning (SIOP)</h1>
          <p className="text-muted-foreground mt-1">MRO 5-step S&OP lifecycle — drive monthly cadence and executive alignment.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select value={cycle?.id ?? ""} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full min-w-0 sm:w-[240px]"><SelectValue placeholder="Select cycle" /></SelectTrigger>
            <SelectContent>
              {cycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {new Date(c.cycle_month).toLocaleDateString("en-US", { year: "numeric", month: "short" })} — {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New cycle</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New SIOP cycle</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Cycle month</Label><Input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} /></div>
                <div><Label>Title</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Q3 planning cycle" /></div>
              </div>
              <DialogFooter>
                <Button onClick={() => newTitle && createCycle.mutate({ cycle_month: newMonth, title: newTitle })}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {cycle && (
            <Button variant="outline" size="sm" onClick={() => setMeetingMode(true)}><Play className="h-4 w-4 mr-1" /> Meeting mode</Button>
          )}
        </div>
      </div>

      {!cycle ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">No SIOP cycles yet. Create one to begin the monthly cadence.</p>
          <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create first cycle</Button>
        </div>
      ) : (
        <>
          <div data-tour="siop-steps">
            <StepBar currentStep={viewedStep} onAdvance={viewStep} />
          </div>

          <Tabs value={String(viewedStep)} onValueChange={(v) => viewStep(Number(v))} className="mt-6">
            <TabsList className="grid grid-cols-7 w-full">
              {STEPS.map((s) => (
                <TabsTrigger key={s.n} value={String(s.n)}>
                  <span className="hidden md:inline">{s.n}. {s.label}</span>
                  <span className="md:hidden">Step {s.n}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="1"><div data-tour="siop-demand-grid"><Step1Demand cycle={cycle} /></div></TabsContent>
            <TabsContent value="2"><div data-tour="siop-capacity-grid"><Step2Capacity cycle={cycle} /></div></TabsContent>
            <TabsContent value="3"><Step3Scenarios cycleId={cycle.id} /></TabsContent>
            <TabsContent value="4"><Step4Executive cycleId={cycle.id} /></TabsContent>
            <TabsContent value="5"><Step5Execution cycleId={cycle.id} /></TabsContent>
            <TabsContent value="6"><div data-tour="siop-long-lead"><SiopLongLead cycleId={cycle.id} /></div></TabsContent>
            <TabsContent value="7"><SiopOsp cycleId={cycle.id} /></TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { confirmThen("Delete this cycle and all data?", () => { deleteCycle.mutate(cycle.id); }) }}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete cycle
            </Button>
          </div>
        </>
      )}

      {cycle && meetingMode && (
        <MeetingMode cycle={{ ...cycle, current_step: viewedStep }} onClose={() => setMeetingMode(false)} onAdvance={viewStep} />
      )}
    </>
  );
}

function StepBar({ currentStep, onAdvance }: { currentStep: number; onAdvance: (s: number) => void }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = currentStep > s.n;
          const active = currentStep === s.n;
          return (
            <div key={s.n} className="flex items-center gap-2 flex-shrink-0">
              <button
                data-tour={`siop-step-${s.n}`}
                onClick={() => onAdvance(s.n)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${active ? "ring-2 ring-offset-2" : "opacity-80 hover:opacity-100"}`}
                style={{ backgroundColor: active || done ? `${s.color}20` : "transparent", borderColor: s.color, borderWidth: 1, borderStyle: "solid" }}
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: s.color }}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Step {s.n}</div>
                  <div className="text-sm font-semibold">{s.label}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground mt-3">{STEPS[currentStep - 1]?.desc}</p>
    </div>
  );
}

// ============ STEP 1: DEMAND ============
function Step1Demand({ cycle }: { cycle: Cycle }) {
  const cycleId = cycle.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["siop_demand", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_demand" as any).select("*").eq("cycle_id", cycleId).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Demand[];
    },
  });
  const rows = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Demand>>({ product_line: "", workscope: "", segment: "", firm_units: 0, pipeline_units: 0, weighted_units: 0, revenue_estimate: 0 });
  const [editId, setEditId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const mv = (form.monthly_values ?? {}) as MonthlyMap;
      const hasMonthly = Object.keys(mv).length > 0;
      const payload: any = { ...form };
      if (hasMonthly) {
        payload.firm_units = sumMonthly(mv, "firm");
        payload.pipeline_units = sumMonthly(mv, "pipeline");
        payload.weighted_units = sumMonthly(mv, "weighted");
        payload.revenue_estimate = sumMonthly(mv, "revenue");
      }
      if (editId) {
        const { error } = await supabase.from("siop_demand" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("siop_demand" as any).insert({ ...payload, cycle_id: cycleId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_demand", cycleId] }); setOpen(false); setEditId(null); setForm({ product_line: "", firm_units: 0, pipeline_units: 0, weighted_units: 0, revenue_estimate: 0, monthly_values: {} }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("siop_demand" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_demand", cycleId] }),
  });

  const totals = rows.reduce((a, r) => ({
    firm: a.firm + Number(r.firm_units || 0),
    pipeline: a.pipeline + Number(r.pipeline_units || 0),
    weighted: a.weighted + Number(r.weighted_units || 0),
    revenue: a.revenue + Number(r.revenue_estimate || 0),
  }), { firm: 0, pipeline: 0, weighted: 0, revenue: 0 });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Firm units" value={fmt(totals.firm)} color="#3b82f6" />
        <Stat label="Pipeline units" value={fmt(totals.pipeline)} color="#8b5cf6" />
        <Stat label="Weighted units" value={fmt(totals.weighted)} color="#f59e0b" />
        <Stat label="Revenue estimate" value={fmtM(totals.revenue)} color="#22c55e" />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">12–24 month rolling demand by product line / workscope. Include firm inductions, weighted pipeline, and expected unscheduled maintenance spikes.</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ product_line: "", firm_units: 0, pipeline_units: 0, weighted_units: 0, revenue_estimate: 0, monthly_values: {} }); } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add demand line</Button></DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} demand line</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Product line / workscope</Label><Input value={form.product_line ?? ""} onChange={(e) => setForm({ ...form, product_line: e.target.value })} placeholder="e.g. CFM56 engine overhaul" /></div>
              <div><Label>Workscope detail</Label><Input value={form.workscope ?? ""} onChange={(e) => setForm({ ...form, workscope: e.target.value })} placeholder="Heavy / Light / OH" /></div>
              <div><Label>Segment</Label><Input value={form.segment ?? ""} onChange={(e) => setForm({ ...form, segment: e.target.value })} placeholder="Airline / Lessor / OEM" /></div>
              <div className="col-span-2">
                <Label className="mb-2 block">Monthly plan (24 months from cycle start — totals below auto-sum)</Label>
                <MonthlyGrid
                  cycleMonth={cycle.cycle_month}
                  fields={[
                    { key: "firm", label: "Firm" },
                    { key: "pipeline", label: "Pipeline" },
                    { key: "weighted", label: "Weighted" },
                    { key: "revenue", label: "Revenue ($)" },
                  ]}
                  values={(form.monthly_values as MonthlyMap) ?? {}}
                  onChange={(next) => setForm({ ...form, monthly_values: next })}
                />
              </div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted"><tr>
            <th className="p-2 text-left">Product line</th><th className="p-2 text-left">Workscope</th><th className="p-2 text-left">Segment</th>
            <th className="p-2 text-right">Firm</th><th className="p-2 text-right">Pipeline</th><th className="p-2 text-right">Weighted</th><th className="p-2 text-right">Revenue</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => { setForm(r); setEditId(r.id); setOpen(true); }}>
                <td className="p-2 font-medium">{r.product_line}</td><td className="p-2">{r.workscope}</td><td className="p-2">{r.segment}</td>
                <td className="p-2 text-right">{fmt(r.firm_units)}</td><td className="p-2 text-right">{fmt(r.pipeline_units)}</td><td className="p-2 text-right">{fmt(r.weighted_units)}</td>
                <td className="p-2 text-right">{fmtM(r.revenue_estimate)}</td>
                <td className="p-2"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); del.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No demand lines yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ STEP 2: CAPACITY ============
const RESOURCE_TYPES = [
  { key: "labor", label: "Technician & certification" },
  { key: "facility", label: "Facility & bays" },
  { key: "tooling", label: "Tooling & test cells" },
  { key: "material", label: "Material & rotables" },
];
function Step2Capacity({ cycle }: { cycle: Cycle }) {
  const cycleId = cycle.id;
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const q = useQuery({
    queryKey: ["siop_capacity", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_capacity" as any).select("*").eq("cycle_id", cycleId).order("resource_type");
      if (error) throw error;
      return (data ?? []) as unknown as Capacity[];
    },
  });
  const allRows = (q.data ?? []).filter((r) => (r as any).source !== "aps");
  const rows = allRows.filter((r) => (showArchived ? !!r.archived_at : !r.archived_at));
  const archivedCount = allRows.filter((r) => !!r.archived_at).length;

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm: Partial<Capacity> = { resource_type: "labor", resource_name: "", available_capacity: 0, required_capacity: 0, unit: "hrs", status: "green", monthly_values: {} };
  const [form, setForm] = useState<Partial<Capacity>>(emptyForm);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.resource_name?.trim()) throw new Error("Resource name is required");
      const mv = (form.monthly_values ?? {}) as MonthlyMap;
      const hasMonthly = Object.keys(mv).length > 0;
      const available = hasMonthly ? sumMonthly(mv, "available") : Number(form.available_capacity || 0);
      const required = hasMonthly ? sumMonthly(mv, "required") : Number(form.required_capacity || 0);
      const gap = available - required;
      const status = form.status ?? (gap >= 0 ? "green" : Math.abs(gap) / (required || 1) < 0.1 ? "yellow" : "red");
      const payload: any = { ...form, available_capacity: available, required_capacity: required, status };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (editId) {
        const { data, error } = await supabase.from("siop_capacity" as any).update(payload).eq("id", editId).select("id");
        if (error) throw error;
        assertWrote(data, "edit");
      } else {
        const { error } = await supabase.from("siop_capacity" as any).insert({ ...payload, cycle_id: cycleId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_capacity", cycleId] }); setOpen(false); setEditId(null); setForm(emptyForm); toast.success("Resource saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const archive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await supabase.from("siop_capacity" as any)
        .update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "archive");
    },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["siop_capacity", cycleId] }); toast.success(v.archived ? "Resource archived" : "Resource restored"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("siop_capacity" as any).delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_capacity", cycleId] }); toast.success("Resource deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <SiopApsRollup cycleId={cycleId} />
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">Certifying staff, bays, test cells, rotables, OEM lead-time exposure. Flag bottlenecks R/Y/G.</p>

        <div className="flex items-center gap-2">
          <Button size="sm" variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived((v) => !v)}>
            <Archive className="h-4 w-4 mr-1" /> {showArchived ? "Show active" : `Archived (${archivedCount})`}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add resource</Button></DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} resource</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.resource_type} onValueChange={(v) => setForm({ ...form, resource_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RESOURCE_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Name</Label><Input value={form.resource_name ?? ""} onChange={(e) => setForm({ ...form, resource_name: e.target.value })} placeholder="e.g. A&P certified mechanics" /></div>
                <div><Label>Unit</Label><Input value={form.unit ?? ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="hrs / heads / bays" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="mb-2 block">Monthly capacity (24 months — Available vs Required auto-sums into the totals)</Label>
                  <MonthlyGrid
                    cycleMonth={cycle.cycle_month}
                    fields={[
                      { key: "available", label: `Available${form.unit ? ` (${form.unit})` : ""}` },
                      { key: "required", label: `Required${form.unit ? ` (${form.unit})` : ""}` },
                    ]}
                    values={(form.monthly_values as MonthlyMap) ?? {}}
                    onChange={(next) => setForm({ ...form, monthly_values: next })}
                  />
                </div>
                <div className="col-span-2"><Label>Mitigation plan</Label><Textarea value={form.mitigation ?? ""} onChange={(e) => setForm({ ...form, mitigation: e.target.value })} /></div>
              </div>
              <DialogFooter className="gap-2">
                {editId && (
                  <Button variant="outline" onClick={() => { archive.mutate({ id: editId, archived: !form.archived_at }); setOpen(false); }}>
                    <Archive className="h-4 w-4 mr-1" /> {form.archived_at ? "Restore" : "Archive"}
                  </Button>
                )}
                {editId && (
                  <Button variant="destructive" onClick={() => confirmThen("Delete this resource?", () => { del.mutate(editId); setOpen(false); })}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                )}
                <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {RESOURCE_TYPES.map((t) => {
        const group = rows.filter((r) => r.resource_type === t.key);
        return (
          <div key={t.key} className="rounded-lg border">
            <div className="px-3 py-2 bg-muted font-semibold text-sm">{t.label} <span className="text-muted-foreground font-normal">({group.length})</span></div>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr>
                <th className="p-2 text-left">Resource</th><th className="p-2 text-right">Available</th><th className="p-2 text-right">Required</th><th className="p-2 text-right">Gap</th><th className="p-2">Status</th><th className="p-2 text-left">Mitigation</th><th></th>
              </tr></thead>
              <tbody>
                {group.map((r) => {
                  const gap = Number(r.available_capacity) - Number(r.required_capacity);
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => { setForm(r); setEditId(r.id); setOpen(true); }}>
                      <td className="p-2 font-medium">{r.resource_name}</td>
                      <td className="p-2 text-right">{fmt(r.available_capacity)} {r.unit}</td>
                      <td className="p-2 text-right">{fmt(r.required_capacity)} {r.unit}</td>
                      <td className={`p-2 text-right font-semibold ${gap < 0 ? "text-red-600" : "text-green-600"}`}>{gap >= 0 ? "+" : ""}{fmt(gap)}</td>
                      <td className="p-2 text-center"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[r.status] }} /></td>
                      <td className="p-2 text-muted-foreground text-xs">{r.mitigation}</td>
                      <td className="p-2 whitespace-nowrap text-right">
                        <Button variant="ghost" size="sm" title={r.archived_at ? "Restore" : "Archive"} onClick={(e) => { e.stopPropagation(); archive.mutate({ id: r.id, archived: !r.archived_at }); }}>
                          {r.archived_at ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete" onClick={(e) => { e.stopPropagation(); confirmThen("Delete this resource?", () => { del.mutate(r.id); }); }}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  );
                })}
                {group.length === 0 && <tr><td colSpan={7} className="p-3 text-center text-muted-foreground text-xs">{showArchived ? "No archived resources." : "No resources logged."}</td></tr>}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}


// ============ STEP 3: SCENARIOS ============
function Step3Scenarios({ cycleId }: { cycleId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["siop_scenarios", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_scenarios" as any).select("*").eq("cycle_id", cycleId).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Scenario[];
    },
  });
  const rows = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Scenario>>({ option_label: "", description: "", revenue_impact: 0, cost_impact: 0, ebitda_impact: 0, risk_level: "medium", recommended: false, selected: false });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) { const { error } = await supabase.from("siop_scenarios" as any).update(form).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("siop_scenarios" as any).insert({ ...form, cycle_id: cycleId }); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_scenarios", cycleId] }); setOpen(false); setEditId(null); setForm({ option_label: "", description: "", revenue_impact: 0, cost_impact: 0, ebitda_impact: 0, risk_level: "medium" }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("siop_scenarios" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_scenarios", cycleId] }),
  });
  const toggleSelected = useMutation({
    mutationFn: async (v: { id: string; selected: boolean }) => { const { error } = await supabase.from("siop_scenarios" as any).update({ selected: v.selected }).eq("id", v.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_scenarios", cycleId] }),
  });

  const seed = () => {
    const templates = [
      { option_label: "Option A — Subcontract low-margin piece-part repair", description: "Free up internal cell capacity for high-margin heavy checks.", revenue_impact: 0, cost_impact: 250000, ebitda_impact: -250000, risk_level: "low" },
      { option_label: "Option B — Smooth induction timing", description: "Re-slot peak inductions across weeks while holding TAT SLAs.", revenue_impact: -500000, cost_impact: -800000, ebitda_impact: 300000, risk_level: "medium" },
      { option_label: "Option C — Accelerate teardowns for USM", description: "Source internal Used Serviceable Material rather than new OEM parts.", revenue_impact: 300000, cost_impact: -1200000, ebitda_impact: 1500000, risk_level: "medium" },
    ];
    templates.forEach((t) => supabase.from("siop_scenarios" as any).insert({ ...t, cycle_id: cycleId }).then(() => qc.invalidateQueries({ queryKey: ["siop_scenarios", cycleId] })));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Reconciliation of demand vs supply. Model 2–3 financialized trade-off scenarios for exec decision.</p>
        <div className="flex gap-2">
          {rows.length === 0 && <Button variant="outline" size="sm" onClick={seed}><Sparkles className="h-4 w-4 mr-1" /> Load templates</Button>}
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add scenario</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} scenario</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Option label</Label><Input value={form.option_label ?? ""} onChange={(e) => setForm({ ...form, option_label: e.target.value })} /></div>
                <div className="col-span-2"><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Revenue impact ($)</Label><Input type="number" value={form.revenue_impact ?? 0} onChange={(e) => setForm({ ...form, revenue_impact: Number(e.target.value) })} /></div>
                <div><Label>Cost impact ($)</Label><Input type="number" value={form.cost_impact ?? 0} onChange={(e) => setForm({ ...form, cost_impact: Number(e.target.value) })} /></div>
                <div><Label>EBITDA impact ($)</Label><Input type="number" value={form.ebitda_impact ?? 0} onChange={(e) => setForm({ ...form, ebitda_impact: Number(e.target.value) })} /></div>
                <div><Label>TAT impact</Label><Input value={form.tat_impact ?? ""} onChange={(e) => setForm({ ...form, tat_impact: e.target.value })} placeholder="+2 days / neutral" /></div>
                <div>
                  <Label>Risk level</Label>
                  <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.recommended ?? false} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} /> Recommended</label>
                </div>
              </div>
              <DialogFooter><Button onClick={() => save.mutate()}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className={`rounded-lg border p-4 space-y-2 ${s.selected ? "ring-2 ring-primary bg-primary/5" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm">{s.option_label}</div>
              <div className="flex gap-1">
                {s.recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                <Badge variant={s.risk_level === "high" ? "destructive" : "outline"} className="text-xs">{s.risk_level}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{s.description}</p>
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <div><div className="text-muted-foreground">Rev</div><div className="font-semibold">{fmtM(s.revenue_impact)}</div></div>
              <div><div className="text-muted-foreground">Cost</div><div className="font-semibold">{fmtM(s.cost_impact)}</div></div>
              <div><div className="text-muted-foreground">EBITDA</div><div className={`font-semibold ${Number(s.ebitda_impact) >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtM(s.ebitda_impact)}</div></div>
            </div>
            {s.tat_impact && <div className="text-xs"><span className="text-muted-foreground">TAT:</span> {s.tat_impact}</div>}
            <div className="flex justify-between items-center pt-2 border-t">
              <Button size="sm" variant={s.selected ? "default" : "outline"} onClick={() => toggleSelected.mutate({ id: s.id, selected: !s.selected })}>
                {s.selected ? "✓ Selected" : "Select"}
              </Button>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setForm(s); setEditId(s.id); setOpen(true); }}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => del.mutate(s.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="col-span-full rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">No scenarios yet. Click "Load templates" to start with the 3 MRO defaults.</div>}
      </div>
    </div>
  );
}

// ============ STEP 4: EXECUTIVE ============
function Step4Executive({ cycleId }: { cycleId: string }) {
  const qc = useQueryClient();
  const scenariosQ = useQuery({
    queryKey: ["siop_scenarios", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_scenarios" as any).select("*").eq("cycle_id", cycleId);
      if (error) throw error;
      return (data ?? []) as unknown as Scenario[];
    },
  });
  const decisionsQ = useQuery({
    queryKey: ["siop_decisions", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_decisions" as any).select("*").eq("cycle_id", cycleId).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Decision[];
    },
  });
  const scenarios = scenariosQ.data ?? [];
  const decisions = decisionsQ.data ?? [];
  const selected = scenarios.filter((s) => s.selected);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Decision>>({ decision: "", category: "resource", status: "open" });

  const save = useMutation({
    mutationFn: async () => {
      if (editId) { const { error } = await supabase.from("siop_decisions" as any).update(form).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("siop_decisions" as any).insert({ ...form, cycle_id: cycleId, step: 4 }); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_decisions", cycleId] }); setOpen(false); setEditId(null); setForm({ decision: "", category: "resource", status: "open" }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("siop_decisions" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_decisions", cycleId] }),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-primary/5">
        <h3 className="font-semibold mb-2">Executive agenda</h3>
        <ol className="list-decimal ml-5 text-sm space-y-1 text-muted-foreground">
          <li>Financial performance vs. previous S&OP plan (Revenue, EBITDA, TAT).</li>
          <li>Critical capacity bottlenecks and material risks.</li>
          <li>Review and selection of proposed trade-off scenarios.</li>
          <li>Approval of resource adjustments (OT, contractor headcount, tooling capex).</li>
        </ol>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Selected scenarios for approval</h3>
        {selected.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">No scenarios selected in Step 3.</div>
        ) : (
          <div className="space-y-2">
            {selected.map((s) => (
              <div key={s.id} className="rounded-lg border p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{s.option_label}</div>
                  <div className="text-xs text-muted-foreground">{s.description}</div>
                </div>
                <div className="text-right text-xs">
                  <div className={`font-semibold ${Number(s.ebitda_impact) >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtM(s.ebitda_impact)} EBITDA</div>
                  <div className="text-muted-foreground">Risk: {s.risk_level}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Decisions & action items</h3>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add decision</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} decision</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Decision / action</Label><Textarea value={form.decision ?? ""} onChange={(e) => setForm({ ...form, decision: e.target.value })} /></div>
                <div><Label>Rationale</Label><Textarea value={form.rationale ?? ""} onChange={(e) => setForm({ ...form, rationale: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category ?? "resource"} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resource">Resource</SelectItem>
                        <SelectItem value="capex">Turnaround Finance</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="supply">Supply</SelectItem>
                        <SelectItem value="risk">Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Due date</Label><Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status ?? "open"} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={() => save.mutate()}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-2 text-left">Decision</th><th className="p-2">Category</th><th className="p-2">Due</th><th className="p-2">Status</th><th></th></tr></thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => { setForm(d); setEditId(d.id); setOpen(true); }}>
                  <td className="p-2"><div className="font-medium">{d.decision}</div>{d.rationale && <div className="text-xs text-muted-foreground">{d.rationale}</div>}</td>
                  <td className="p-2 text-center"><Badge variant="outline" className="text-xs">{d.category}</Badge></td>
                  <td className="p-2 text-center text-xs">{d.due_date ?? "—"}</td>
                  <td className="p-2 text-center"><Badge variant={d.status === "done" ? "default" : "outline"} className="text-xs">{d.status}</Badge></td>
                  <td className="p-2"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); del.mutate(d.id); }}><Trash2 className="h-3 w-3" /></Button></td>
                </tr>
              ))}
              {decisions.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No decisions logged.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ STEP 5: EXECUTION ============
function Step5Execution({ cycleId }: { cycleId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["siop_kpis", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_kpis" as any).select("*").eq("cycle_id", cycleId).order("category");
      if (error) throw error;
      return (data ?? []) as unknown as Kpi[];
    },
  });
  const rows = q.data ?? [];
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Kpi>>({ kpi_name: "", category: "financial", plan_value: 0, actual_value: 0, status: "green" });

  const save = useMutation({
    mutationFn: async () => {
      const variance = Number(form.actual_value ?? 0) - Number(form.plan_value ?? 0);
      const payload = { ...form, variance };
      if (editId) { const { error } = await supabase.from("siop_kpis" as any).update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("siop_kpis" as any).insert({ ...payload, cycle_id: cycleId }); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_kpis", cycleId] }); setOpen(false); setEditId(null); setForm({ kpi_name: "", category: "financial", plan_value: 0, actual_value: 0, status: "green" }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("siop_kpis" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_kpis", cycleId] }),
  });

  const seed = () => {
    const templates = [
      { kpi_name: "Revenue ($M)", category: "financial", plan_value: 0, actual_value: 0, status: "green" },
      { kpi_name: "EBITDA ($M)", category: "financial", plan_value: 0, actual_value: 0, status: "green" },
      { kpi_name: "TAT compliance (%)", category: "tat", plan_value: 95, actual_value: 0, status: "green" },
      { kpi_name: "Bay utilization (%)", category: "operational", plan_value: 85, actual_value: 0, status: "green" },
      { kpi_name: "OTD to customer (%)", category: "operational", plan_value: 95, actual_value: 0, status: "green" },
      { kpi_name: "USM sourcing rate (%)", category: "material", plan_value: 30, actual_value: 0, status: "green" },
    ];
    templates.forEach((t) => supabase.from("siop_kpis" as any).insert({ ...t, cycle_id: cycleId }).then(() => qc.invalidateQueries({ queryKey: ["siop_kpis", cycleId] })));
  };

  const horizons = [
    { horizon: "Strategic (12–24 mos)", focus: "Facility expansion, long-term OEM contracts, major tooling capex", freq: "Quarterly/Monthly", who: "Exec leadership, BD" },
    { horizon: "Tactical (3–12 mos)", focus: "Labor hiring/training, rotables purchasing, slotted inductions", freq: "Monthly (S&OP)", who: "Director of Ops, Supply Chain, Commercial" },
    { horizon: "Operational (0–3 mos)", focus: "Bay assignment, shift scheduling, expediting, TAT tracking", freq: "Weekly/Daily (S&OE)", who: "Production Control, Supervisors, Procurement" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border overflow-hidden">
        <div className="px-3 py-2 bg-muted font-semibold text-sm">Governance horizons</div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground"><tr><th className="p-2 text-left">Horizon</th><th className="p-2 text-left">Focus</th><th className="p-2 text-left">Frequency</th><th className="p-2 text-left">Responsible</th></tr></thead>
          <tbody>
            {horizons.map((h) => (
              <tr key={h.horizon} className="border-t"><td className="p-2 font-medium">{h.horizon}</td><td className="p-2 text-muted-foreground">{h.focus}</td><td className="p-2">{h.freq}</td><td className="p-2">{h.who}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Execution KPIs (S&OE)</h3>
          <div className="flex gap-2">
            {rows.length === 0 && <Button variant="outline" size="sm" onClick={seed}><Sparkles className="h-4 w-4 mr-1" /> Load templates</Button>}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add KPI</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} KPI</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>KPI name</Label><Input value={form.kpi_name ?? ""} onChange={(e) => setForm({ ...form, kpi_name: e.target.value })} /></div>
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category ?? "financial"} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">Financial</SelectItem><SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="tat">TAT</SelectItem><SelectItem value="material">Material</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Plan</Label><Input type="number" value={form.plan_value ?? 0} onChange={(e) => setForm({ ...form, plan_value: Number(e.target.value) })} /></div>
                    <div><Label>Actual</Label><Input type="number" value={form.actual_value ?? 0} onChange={(e) => setForm({ ...form, actual_value: Number(e.target.value) })} /></div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status ?? "green"} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button onClick={() => save.mutate()}>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-2 text-left">KPI</th><th className="p-2">Category</th><th className="p-2 text-right">Plan</th><th className="p-2 text-right">Actual</th><th className="p-2 text-right">Var</th><th className="p-2">Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => { setForm(k); setEditId(k.id); setOpen(true); }}>
                  <td className="p-2 font-medium">{k.kpi_name}</td>
                  <td className="p-2 text-center"><Badge variant="outline" className="text-xs">{k.category}</Badge></td>
                  <td className="p-2 text-right">{fmt(k.plan_value)}</td>
                  <td className="p-2 text-right">{fmt(k.actual_value)}</td>
                  <td className={`p-2 text-right font-semibold ${Number(k.variance) < 0 ? "text-red-600" : "text-green-600"}`}>{k.variance != null ? (Number(k.variance) >= 0 ? "+" : "") + fmt(k.variance) : "—"}</td>
                  <td className="p-2 text-center"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[k.status] }} /></td>
                  <td className="p-2"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); del.mutate(k.id); }}><Trash2 className="h-3 w-3" /></Button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No KPIs yet. Load templates or add manually.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// ============ MEETING MODE ============
function MeetingMode({ cycle, onClose, onAdvance }: { cycle: Cycle; onClose: () => void; onAdvance: (s: number) => void }) {
  const step = STEPS[cycle.current_step - 1];
  const Icon = step.icon;
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: step.color }}><Icon className="h-5 w-5" /></div>
          <div>
            <div className="text-xs text-muted-foreground">SIOP Meeting — {cycle.title}</div>
            <div className="font-bold">Step {cycle.current_step}: {step.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onAdvance(Math.max(1, cycle.current_step - 1))} disabled={cycle.current_step <= 1}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-sm font-medium">{cycle.current_step} / 5</div>
          <Button variant="outline" size="sm" onClick={() => onAdvance(Math.min(5, cycle.current_step + 1))} disabled={cycle.current_step >= 5}><ChevronRight className="h-4 w-4" /></Button>
          <Button size="sm" onClick={onClose}>Exit meeting</Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground mb-6">{step.desc}</p>
        {cycle.current_step === 1 && <Step1Demand cycle={cycle} />}
        {cycle.current_step === 2 && <Step2Capacity cycle={cycle} />}
        {cycle.current_step === 3 && <Step3Scenarios cycleId={cycle.id} />}
        {cycle.current_step === 4 && <Step4Executive cycleId={cycle.id} />}
        {cycle.current_step === 5 && <Step5Execution cycleId={cycle.id} />}
      </div>
    </div>
  );
}
