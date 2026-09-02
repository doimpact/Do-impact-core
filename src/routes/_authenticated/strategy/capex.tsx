import { createFileRoute } from "@tanstack/react-router";
import { NumberFormatMenu } from "@/components/number-format-menu";
import { useNumberFormat } from "@/lib/number-format";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assertWrote } from "@/lib/write-guard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Archive, ArchiveRestore, Trash2, Pencil, Check } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { CapexValueRealization } from "@/components/strategy/capex-value-realization";
import { CapexCashFlow } from "@/components/strategy/capex-cash-flow";
import { CapexWorkingCapital } from "@/components/strategy/capex-working-capital";
import { CapexPartMargins } from "@/components/strategy/capex-part-margins";
import { CapexCopq } from "@/components/strategy/capex-copq";
import { cn } from "@/lib/utils";
import { npv as npvFn, irr as irrFn, paybackMonth, formatPct, formatUSD as fmtUSD } from "@/lib/finance";
import { confirmThen } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/strategy/capex")({
  head: () => ({ meta: [{ title: "Turnaround Finance — DO.Impact" }] }),
  component: CapexPage,
});

type StrategicObjective =
  | "operational_efficiency" | "capacity_scaling" | "supply_chain_resilience"
  | "sustainability_compliance" | "safety_quality" | "other";
type Stage = "request" | "approval" | "procurement" | "installation" | "validation" | "closed";
type Status = "not_started" | "in_progress" | "on_hold" | "at_risk" | "blocked" | "done";
type Health = "green" | "yellow" | "red";

type Capex = {
  id: string;
  owner_id: string | null;
  number: string | null;
  title: string;
  description: string | null;
  strategic_objective: StrategicObjective | null;
  linked_theme_id: string | null;
  linked_objective_id: string | null;
  category: string | null;
  business_unit: string | null;
  total_cost: number;
  currency: string;
  expected_annual_savings: number;
  expected_annual_revenue: number;
  payback_months: number | null;
  irr_pct: number | null;
  npv: number | null;
  discount_rate_pct: number | null;
  risk_summary: string | null;
  score_strategic_fit: number;
  score_throughput: number;
  score_quality_defect: number;
  score_safety: number;
  score_sustainability: number;
  score_financial: number;
  total_score: number;
  stage: Stage;
  status: Status;
  health: Health;
  progress: number;
  approved_at: string | null;
  procurement_start: string | null;
  install_start: string | null;
  validation_start: string | null;
  closed_at: string | null;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  committed_cost: number;
  actual_cost: number;
  audit_due_date: string | null;
  audit_completed_at: string | null;
  audit_realized_savings: number | null;
  audit_benefit_realization_pct: number | null;
  audit_notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type Milestone = {
  id: string;
  capex_id: string;
  gate: Stage;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
};

const OBJECTIVES: { key: StrategicObjective; label: string }[] = [
  { key: "operational_efficiency", label: "Operational efficiency & cost" },
  { key: "capacity_scaling", label: "Capacity scaling for new programs" },
  { key: "supply_chain_resilience", label: "Supply chain resilience" },
  { key: "sustainability_compliance", label: "Sustainability & compliance" },
  { key: "safety_quality", label: "Safety & quality" },
  { key: "other", label: "Other" },
];

const STAGES: { key: Stage; label: string; weight: number }[] = [
  { key: "request", label: "Gate 1 · Request", weight: 0.1 },
  { key: "approval", label: "Gate 2 · Approval", weight: 0.3 },
  { key: "procurement", label: "Gate 3 · Procurement", weight: 0.5 },
  { key: "installation", label: "Gate 3 · Installation", weight: 0.7 },
  { key: "validation", label: "Gate 3 · Validation", weight: 0.9 },
  { key: "closed", label: "Gate 4 · Closed", weight: 1.0 },
];

const STATUSES: { key: Status; label: string }[] = [
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "on_hold", label: "On hold" },
  { key: "at_risk", label: "At risk" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const HEALTH_BG: Record<Health, string> = {
  green: "bg-green-500", yellow: "bg-amber-400", red: "bg-red-500",
};
const nextHealth: Record<Health, Health> = { green: "yellow", yellow: "red", red: "green" };

const SCORE_FIELDS: { key: keyof Capex; label: string; help: string }[] = [
  { key: "score_strategic_fit", label: "Strategic fit", help: "Alignment to Hoshin and long-term strategy." },
  { key: "score_throughput", label: "Throughput", help: "Cycle-time reduction, output uplift." },
  { key: "score_quality_defect", label: "Quality / defect", help: "Scrap, rework, escape rate." },
  { key: "score_safety", label: "Safety", help: "Ergonomics, LTIR reduction, hazard removal." },
  { key: "score_sustainability", label: "Sustainability", help: "Energy, waste, emissions, compliance." },
  { key: "score_financial", label: "Financial", help: "Payback, NPV, IRR." },
];

function fmtMoney(n: number, currency = "USD") {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${currency === "USD" ? "$" : ""}${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency === "USD" ? "$" : ""}${(n / 1_000).toFixed(0)}K`;
  return `${currency === "USD" ? "$" : ""}${n.toFixed(0)}`;
}

function stageWeight(s: Stage) { return STAGES.find(x => x.key === s)?.weight ?? 0; }
function stageLabel(s: Stage) { return STAGES.find(x => x.key === s)?.label ?? s; }
function objectiveLabel(o: StrategicObjective | null) { return o ? OBJECTIVES.find(x => x.key === o)?.label ?? o : "—"; }

type StrategicLink = { kind: "theme" | "objective"; id: string; title: string };

function useStrategicLinkOptions() {
  return useQuery({
    queryKey: ["capex_strategic_link_options"],
    queryFn: async (): Promise<StrategicLink[]> => {
      const [themes, objectives] = await Promise.all([
        supabase.from("strategic_themes").select("id,title").is("archived_at", null).order("title"),
        supabase.from("strategic_objectives").select("id,title").is("archived_at", null).order("title"),
      ]);
      if (themes.error) throw themes.error;
      if (objectives.error) throw objectives.error;
      return [
        ...(themes.data ?? []).map(t => ({ kind: "theme" as const, id: t.id, title: t.title })),
        ...(objectives.data ?? []).map(o => ({ kind: "objective" as const, id: o.id, title: o.title })),
      ];
    },
  });
}

function linkValue(r: { linked_theme_id: string | null; linked_objective_id: string | null }) {
  if (r.linked_theme_id) return `theme:${r.linked_theme_id}`;
  if (r.linked_objective_id) return `objective:${r.linked_objective_id}`;
  return "none";
}
function parseLinkValue(v: string): { linked_theme_id: string | null; linked_objective_id: string | null } {
  if (v.startsWith("theme:")) return { linked_theme_id: v.slice(6), linked_objective_id: null };
  if (v.startsWith("objective:")) return { linked_theme_id: null, linked_objective_id: v.slice(10) };
  return { linked_theme_id: null, linked_objective_id: null };
}


function CapexPage() {
  useNumberFormat(); // re-render when the money display setting changes
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [filterObj, setFilterObj] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<Stage | "all">("all");
  const [filterHealth, setFilterHealth] = useState<Health | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Capex | null>(null);

  const { data: profiles = [] } = useProfiles();
  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const { data: linkOptions = [] } = useStrategicLinkOptions();
  const linkById = useMemo(() => {
    const m = new Map<string, StrategicLink>();
    linkOptions.forEach(l => m.set(`${l.kind}:${l.id}`, l));
    return m;
  }, [linkOptions]);

  const { data: rows = [] } = useQuery({
    queryKey: ["capex_projects", showArchived],
    queryFn: async () => {
      let q = supabase.from("capex_projects" as never).select("*").order("created_at", { ascending: false });
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Capex[];
    },
  });

  const filtered = useMemo(() => rows.filter(r => {
    if (filterObj !== "all" && linkValue(r) !== filterObj) return false;
    if (filterStage !== "all" && r.stage !== filterStage) return false;
    if (filterHealth !== "all" && r.health !== filterHealth) return false;
    if (search && !(r.title.toLowerCase().includes(search.toLowerCase()) || (r.number ?? "").toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [rows, filterObj, filterStage, filterHealth, search]);

  const totals = useMemo(() => {
    const active = rows.filter(r => !r.archived_at);
    const totalCost = active.reduce((s, r) => s + Number(r.total_cost), 0);
    const committed = active.reduce((s, r) => s + Number(r.committed_cost), 0);
    const actual = active.reduce((s, r) => s + Number(r.actual_cost), 0);
    const weighted = active.reduce((s, r) => s + Number(r.total_cost) * stageWeight(r.stage), 0);
    const audited = active.filter(r => r.audit_benefit_realization_pct != null);
    const avgBenefit = audited.length ? audited.reduce((s, r) => s + Number(r.audit_benefit_realization_pct ?? 0), 0) / audited.length : null;
    return { count: active.length, totalCost, committed, actual, weighted, avgBenefit };
  }, [rows]);

  const update = useMutation({
    mutationFn: async (patch: Partial<Capex> & { id: string }) => {
      const { id, ...rest } = patch;
      const { data, error } = await supabase.from("capex_projects" as never).update(rest as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capex_projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("capex_projects" as never).delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["capex_projects"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r: Capex) => { setEditing(r); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Turnaround Finance</h1>
          <NumberFormatMenu variant="inline" />
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Turnaround finance framework — 13-week cash flow, working-capital release, part-level margins, and Cost of Poor Quality.
        </p>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="projects">CAPEX</TabsTrigger>
          <TabsTrigger value="realization">Value realization</TabsTrigger>
          <TabsTrigger value="cashflow">13-week cash flow</TabsTrigger>
          <TabsTrigger value="working">Working capital</TabsTrigger>
          <TabsTrigger value="margins">Part margins</TabsTrigger>
          <TabsTrigger value="copq">COPQ</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={showArchived} onCheckedChange={setShowArchived} /> Show archived
            </label>
            <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> New CAPEX</Button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Projects" value={String(totals.count)} />
            <Stat label="Total requested" value={fmtMoney(totals.totalCost)} />
            <Stat label="Committed" value={fmtMoney(totals.committed)} />
            <Stat label="Actual spend" value={fmtMoney(totals.actual)} />
            <Stat label="Weighted portfolio" value={fmtMoney(totals.weighted)} hint="Cost × stage weight" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search title or number…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
            <Select value={filterObj} onValueChange={setFilterObj}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Strategic link" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All strategic links</SelectItem>
                {linkOptions.filter(l => l.kind === "theme").length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Strategic themes</div>
                )}
                {linkOptions.filter(l => l.kind === "theme").map(l => (
                  <SelectItem key={`theme:${l.id}`} value={`theme:${l.id}`}>{l.title}</SelectItem>
                ))}
                {linkOptions.filter(l => l.kind === "objective").length > 0 && (
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">3-year objectives</div>
                )}
                {linkOptions.filter(l => l.kind === "objective").map(l => (
                  <SelectItem key={`objective:${l.id}`} value={`objective:${l.id}`}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={v => setFilterStage(v as Stage | "all")}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterHealth} onValueChange={v => setFilterHealth(v as Health | "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Health" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All health</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="red">Red</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Number</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Strategic link</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Progress</th>
                  <th className="px-3 py-2 text-center">Health</th>
                  <th className="px-3 py-2 text-center">Score</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">No Turnaround Finance projects yet. Click "New Turnaround Finance" to add one.</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} className={cn("border-t border-border hover:bg-muted/30", r.archived_at && "opacity-60")}>
                    <td className="px-3 py-2 font-mono text-xs">{r.number}</td>
                    <td className="px-3 py-2">
                      <button className="text-left font-medium hover:underline" onClick={() => openEdit(r)}>{r.title}</button>
                      {r.description && <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {(() => {
                        const link = linkById.get(linkValue(r));
                        if (link) return <><span className="mr-1 rounded bg-muted px-1 py-0.5 text-[9px] uppercase text-muted-foreground">{link.kind === "theme" ? "Theme" : "Obj"}</span>{link.title}</>;
                        return objectiveLabel(r.strategic_objective);
                      })()}
                    </td>
                    <td className="px-3 py-2 text-xs">{r.category || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(Number(r.total_cost), r.currency)}</td>
                    <td className="px-3 py-2 text-xs">{stageLabel(r.stage)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${r.progress}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{r.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        className={cn("h-4 w-4 rounded-full ring-2 ring-border transition-transform hover:scale-110", HEALTH_BG[r.health])}
                        onClick={() => update.mutate({ id: r.id, health: nextHealth[r.health] })}
                        aria-label="Cycle health"
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs tabular-nums">{r.total_score}/30</td>
                    <td className="px-3 py-2 text-xs">{ownerLabel(profileById.get(r.owner_id ?? ""))}</td>
                    <td className="px-3 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(r)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          {r.archived_at ? (
                            <DropdownMenuItem onClick={() => update.mutate({ id: r.id, archived_at: null })}>
                              <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => update.mutate({ id: r.id, archived_at: new Date().toISOString() })}>
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => { confirmThen(`Delete ${r.number ?? r.title}?`, () => { remove.mutate(r.id); }) }}
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
          </div>
        </TabsContent>

        <TabsContent value="realization" className="pt-4">
          <CapexValueRealization capexOptions={rows.map(r => ({ id: r.id, number: r.number, title: r.title }))} />
        </TabsContent>
        <TabsContent value="cashflow" className="pt-4"><CapexCashFlow /></TabsContent>
        <TabsContent value="working" className="pt-4"><CapexWorkingCapital /></TabsContent>
        <TabsContent value="margins" className="pt-4"><CapexPartMargins /></TabsContent>
        <TabsContent value="copq" className="pt-4">
          <CapexCopq capexOptions={rows.map(r => ({ id: r.id, number: r.number, title: r.title }))} />
        </TabsContent>
      </Tabs>

      <CapexDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => { setDialogOpen(false); qc.invalidateQueries({ queryKey: ["capex_projects"] }); }}
      />
    </div>
  );
}


function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ------------------------ Dialog ------------------------

type FormState = Partial<Capex>;

const EMPTY: FormState = {
  title: "",
  description: "",
  strategic_objective: null,
  linked_theme_id: null,
  linked_objective_id: null,
  category: "",
  business_unit: "",
  total_cost: 0,
  currency: "USD",
  expected_annual_savings: 0,
  expected_annual_revenue: 0,
  payback_months: null,
  irr_pct: null,
  npv: null,
  discount_rate_pct: 10,
  risk_summary: "",
  score_strategic_fit: 0,
  score_throughput: 0,
  score_quality_defect: 0,
  score_safety: 0,
  score_sustainability: 0,
  score_financial: 0,
  stage: "request",
  status: "not_started",
  health: "green",
  progress: 0,
  committed_cost: 0,
  actual_cost: 0,
  owner_id: null,
};

function CapexDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Capex | null;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tab, setTab] = useState("gate1");
  const { data: linkOptions = [] } = useStrategicLinkOptions();

  // Reset when opening
  useMemo(() => {
    if (open) {
      setForm(editing ? { ...editing } : { ...EMPTY });
      setTab("gate1");
    }
  }, [open, editing]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.title.trim()) throw new Error("Title is required");
      const payload = { ...form };
      // total_score is a generated column — never send it
      delete (payload as Record<string, unknown>).total_score;
      // Numeric normalization
      const numFields: (keyof Capex)[] = ["total_cost","expected_annual_savings","expected_annual_revenue","committed_cost","actual_cost","progress"];
      numFields.forEach(k => { (payload as Record<string, unknown>)[k] = Number(payload[k as keyof FormState] ?? 0); });
      if (editing) {
        const { data, error } = await supabase.from("capex_projects" as never).update(payload as never).eq("id", editing.id).select("id");
        if (error) throw error;
        assertWrote(data, "edit");
      } else {
        const { error } = await supabase.from("capex_projects" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Created"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalScore = SCORE_FIELDS.reduce((s, f) => s + Number(form[f.key] ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `${editing.number} — ${editing.title || "Turnaround Finance"}` : "New Turnaround Finance project"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gate1">Gate 1 · Business case</TabsTrigger>
            <TabsTrigger value="gate2">Gate 2 · Scoring</TabsTrigger>
            <TabsTrigger value="gate3">Gate 3 · Execution</TabsTrigger>
            <TabsTrigger value="gate4">Gate 4 · Audit</TabsTrigger>
          </TabsList>

          {/* Gate 1 */}
          <TabsContent value="gate1" className="space-y-3 pt-3">
            <Field label="Title">
              <Input value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="e.g. 5-axis CNC machining center" />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={form.description ?? ""} onChange={e => set("description", e.target.value)} placeholder="Scope, rationale, expected benefits…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Strategic link">
                <Select
                  value={linkValue({ linked_theme_id: form.linked_theme_id ?? null, linked_objective_id: form.linked_objective_id ?? null })}
                  onValueChange={v => { const p = parseLinkValue(v); setForm(f => ({ ...f, ...p })); }}
                >
                  <SelectTrigger><SelectValue placeholder="Select theme or objective" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {linkOptions.filter(l => l.kind === "theme").length > 0 && (
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Strategic themes</div>
                    )}
                    {linkOptions.filter(l => l.kind === "theme").map(l => (
                      <SelectItem key={`theme:${l.id}`} value={`theme:${l.id}`}>{l.title}</SelectItem>
                    ))}
                    {linkOptions.filter(l => l.kind === "objective").length > 0 && (
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">3-year objectives</div>
                    )}
                    {linkOptions.filter(l => l.kind === "objective").map(l => (
                      <SelectItem key={`objective:${l.id}`} value={`objective:${l.id}`}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Owner">
                <OwnerSelect value={form.owner_id ?? null} onChange={v => set("owner_id", v)} />
              </Field>
              <Field label="Category">
                <Input value={form.category ?? ""} onChange={e => set("category", e.target.value)} placeholder="Machinery, Facility, Tooling, IT/OT…" />
              </Field>
              <Field label="Business unit">
                <Input value={form.business_unit ?? ""} onChange={e => set("business_unit", e.target.value)} />
              </Field>
              <Field label="Total cost">
                <Input type="number" value={String(form.total_cost ?? 0)} onChange={e => set("total_cost", Number(e.target.value))} />
              </Field>
              <Field label="Currency">
                <Input value={form.currency ?? "USD"} onChange={e => set("currency", e.target.value)} />
              </Field>
              <Field label="Expected annual savings">
                <Input type="number" value={String(form.expected_annual_savings ?? 0)} onChange={e => set("expected_annual_savings", Number(e.target.value))} />
              </Field>
              <Field label="Expected annual revenue">
                <Input type="number" value={String(form.expected_annual_revenue ?? 0)} onChange={e => set("expected_annual_revenue", Number(e.target.value))} />
              </Field>
              <Field label="Payback (months)">
                <Input type="number" value={form.payback_months == null ? "" : String(form.payback_months)} onChange={e => set("payback_months", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="IRR (%)">
                <Input type="number" value={form.irr_pct == null ? "" : String(form.irr_pct)} onChange={e => set("irr_pct", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="NPV (manual override)">
                <Input type="number" value={form.npv == null ? "" : String(form.npv)} onChange={e => set("npv", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="Discount rate (% / yr)">
                <Input type="number" step="0.1" value={form.discount_rate_pct == null ? "10" : String(form.discount_rate_pct)} onChange={e => set("discount_rate_pct", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="Horizon (years)">
                <div className="text-xs text-muted-foreground pt-2">Model uses 10 years for computed NPV/IRR.</div>
              </Field>
            </div>
            <ComputedCapexKpis form={form} />
            <Field label="Risk summary">
              <Textarea rows={3} value={form.risk_summary ?? ""} onChange={e => set("risk_summary", e.target.value)} placeholder="Key risks and mitigations." />
            </Field>
          </TabsContent>

          {/* Gate 2 */}
          <TabsContent value="gate2" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">Score each dimension 0–5. Total drives portfolio prioritization.</p>
            <div className="space-y-3">
              {SCORE_FIELDS.map(f => (
                <div key={String(f.key)} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.help}</p>
                    </div>
                    <span className="tabular-nums text-sm font-semibold">{Number(form[f.key] ?? 0)}/5</span>
                  </div>
                  <Slider
                    className="mt-3"
                    min={0} max={5} step={1}
                    value={[Number(form[f.key] ?? 0)]}
                    onValueChange={(v) => set(f.key as keyof FormState, v[0] as never)}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-sm font-medium">Total score</span>
                <span className="text-lg font-semibold tabular-nums">{totalScore}/30</span>
              </div>
            </div>
          </TabsContent>

          {/* Gate 3 */}
          <TabsContent value="gate3" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stage">
                <Select value={form.stage ?? "request"} onValueChange={v => set("stage", v as Stage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status ?? "not_started"} onValueChange={v => set("status", v as Status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Health">
                <Select value={form.health ?? "green"} onValueChange={v => set("health", v as Health)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Progress (${form.progress ?? 0}%)`}>
                <Slider min={0} max={100} step={5} value={[Number(form.progress ?? 0)]} onValueChange={v => set("progress", v[0])} />
              </Field>
              <Field label="Planned start"><Input type="date" value={form.planned_start ?? ""} onChange={e => set("planned_start", e.target.value || null)} /></Field>
              <Field label="Planned end"><Input type="date" value={form.planned_end ?? ""} onChange={e => set("planned_end", e.target.value || null)} /></Field>
              <Field label="Actual start"><Input type="date" value={form.actual_start ?? ""} onChange={e => set("actual_start", e.target.value || null)} /></Field>
              <Field label="Actual end"><Input type="date" value={form.actual_end ?? ""} onChange={e => set("actual_end", e.target.value || null)} /></Field>
              <Field label="Approved on"><Input type="date" value={form.approved_at ?? ""} onChange={e => set("approved_at", e.target.value || null)} /></Field>
              <Field label="Procurement start"><Input type="date" value={form.procurement_start ?? ""} onChange={e => set("procurement_start", e.target.value || null)} /></Field>
              <Field label="Install start"><Input type="date" value={form.install_start ?? ""} onChange={e => set("install_start", e.target.value || null)} /></Field>
              <Field label="Validation start"><Input type="date" value={form.validation_start ?? ""} onChange={e => set("validation_start", e.target.value || null)} /></Field>
              <Field label="Closed on"><Input type="date" value={form.closed_at ?? ""} onChange={e => set("closed_at", e.target.value || null)} /></Field>
              <div />
              <Field label="Committed cost"><Input type="number" value={String(form.committed_cost ?? 0)} onChange={e => set("committed_cost", Number(e.target.value))} /></Field>
              <Field label="Actual cost"><Input type="number" value={String(form.actual_cost ?? 0)} onChange={e => set("actual_cost", Number(e.target.value))} /></Field>
            </div>
            {editing && <MilestoneEditor capexId={editing.id} />}
            {!editing && <p className="text-xs text-muted-foreground">Save the project first to add milestones.</p>}
          </TabsContent>

          {/* Gate 4 */}
          <TabsContent value="gate4" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">Post-implementation audit — review 12–24 months after validation to verify realized benefits.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Audit due date"><Input type="date" value={form.audit_due_date ?? ""} onChange={e => set("audit_due_date", e.target.value || null)} /></Field>
              <Field label="Audit completed on"><Input type="date" value={form.audit_completed_at ?? ""} onChange={e => set("audit_completed_at", e.target.value || null)} /></Field>
              <Field label="Realized annual savings"><Input type="number" value={form.audit_realized_savings == null ? "" : String(form.audit_realized_savings)} onChange={e => set("audit_realized_savings", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="Benefit realization (%)"><Input type="number" value={form.audit_benefit_realization_pct == null ? "" : String(form.audit_benefit_realization_pct)} onChange={e => set("audit_benefit_realization_pct", e.target.value === "" ? null : Number(e.target.value))} /></Field>
            </div>
            <Field label="Audit notes">
              <Textarea rows={4} value={form.audit_notes ?? ""} onChange={e => set("audit_notes", e.target.value)} placeholder="Findings, lessons learned, adjustments for future Turnaround Finance estimation." />
            </Field>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Save changes" : "Create Turnaround Finance"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ------------------------ Milestones ------------------------

function MilestoneEditor({ capexId }: { capexId: string }) {
  const qc = useQueryClient();
  const { data: milestones = [] } = useQuery({
    queryKey: ["capex_milestones", capexId],
    queryFn: async () => {
      const { data, error } = await supabase.from("capex_milestones" as never)
        .select("*").eq("capex_id", capexId).order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as Milestone[];
    },
  });

  const [title, setTitle] = useState("");
  const [gate, setGate] = useState<Stage>("approval");
  const [due, setDue] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("capex_milestones" as never).insert({
        capex_id: capexId, title, gate, due_date: due || null,
        sort_order: milestones.length,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); setDue(""); qc.invalidateQueries({ queryKey: ["capex_milestones", capexId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upd = useMutation({
    mutationFn: async (patch: Partial<Milestone> & { id: string }) => {
      const { id, ...rest } = patch;
      const { data, error } = await supabase.from("capex_milestones" as never).update(rest as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capex_milestones", capexId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("capex_milestones" as never).delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capex_milestones", capexId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 rounded-lg border border-border p-3">
      <p className="mb-2 text-sm font-medium">Milestones</p>
      <div className="space-y-2">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-2 rounded border border-border bg-background p-2">
            <button
              className={cn("flex h-5 w-5 items-center justify-center rounded border", m.completed_at ? "border-green-500 bg-green-500 text-white" : "border-border")}
              onClick={() => upd.mutate({ id: m.id, completed_at: m.completed_at ? null : new Date().toISOString().slice(0,10) })}
              aria-label="Toggle complete"
            >
              {m.completed_at && <Check className="h-3 w-3" />}
            </button>
            <span className={cn("flex-1 text-sm", m.completed_at && "line-through text-muted-foreground")}>{m.title}</span>
            <span className="text-xs text-muted-foreground">{stageLabel(m.gate)}</span>
            {m.due_date && <span className="text-xs tabular-nums text-muted-foreground">{m.due_date}</span>}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => del.mutate(m.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {milestones.length === 0 && <p className="text-xs text-muted-foreground">No milestones yet.</p>}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_150px_140px_auto] gap-2">
        <Input placeholder="Milestone title" value={title} onChange={e => setTitle(e.target.value)} />
        <Select value={gate} onValueChange={v => setGate(v as Stage)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={due} onChange={e => setDue(e.target.value)} />
        <Button onClick={() => add.mutate()} disabled={add.isPending}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function ComputedCapexKpis({ form }: { form: FormState }) {
  const invest = Number(form.total_cost ?? 0);
  const annual = Number(form.expected_annual_savings ?? 0) + Number(form.expected_annual_revenue ?? 0);
  const rate = Number(form.discount_rate_pct ?? 10);
  const years = 10;
  const months = years * 12;
  const monthly = annual / 12;
  const cf: number[] = [-invest];
  for (let i = 1; i <= months; i++) cf.push(monthly);
  const computedNpv = npvFn(cf, rate);
  const computedIrr = irrFn(cf);
  const pb = paybackMonth(cf);
  const pbLabel = pb == null ? "Not reached (10y)" : `${Math.floor(pb / 12)}y ${pb % 12}m`;
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Model — 10-yr DCF from investment &amp; annual benefits</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground">Computed NPV</p>
          <p className={cn("text-base font-semibold tabular-nums", computedNpv >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{fmtUSD(computedNpv)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Computed IRR</p>
          <p className={cn("text-base font-semibold tabular-nums", (computedIrr ?? 0) >= rate ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{formatPct(computedIrr)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Payback</p>
          <p className="text-base font-semibold tabular-nums">{pbLabel}</p>
        </div>
      </div>
    </div>
  );
}
