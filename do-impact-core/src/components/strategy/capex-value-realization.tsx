import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

export type VRRow = {
  id: string;
  capex_project_id: string;
  category: "financial" | "operational" | "quality_risk" | "investment";
  metric_name: string;
  target_kpi: string | null;
  realized_result: string | null;
  financial_impact: number | null;
  currency: string | null;
  status: "exceeded" | "favorable" | "on_track" | "unfavorable" | "pending" | null;
  review_phase: "baseline" | "closeout" | "initial_audit" | "pir" | null;
  review_date: string | null;
  notes: string | null;
};

type CapexOption = { id: string; number: string | null; title: string };

const CATS: { key: VRRow["category"]; label: string; tint: string }[] = [
  { key: "investment", label: "Investment", tint: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300" },
  { key: "financial", label: "Financial", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { key: "operational", label: "Operational", tint: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "quality_risk", label: "Quality / Risk", tint: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
];
const STATUS: { key: NonNullable<VRRow["status"]>; label: string; cls: string }[] = [
  { key: "exceeded", label: "Exceeded", cls: "bg-emerald-500 text-white" },
  { key: "favorable", label: "Favorable", cls: "bg-emerald-400 text-emerald-950" },
  { key: "on_track", label: "On track", cls: "bg-blue-400 text-blue-950" },
  { key: "unfavorable", label: "Unfavorable", cls: "bg-rose-500 text-white" },
  { key: "pending", label: "Pending", cls: "bg-muted text-muted-foreground" },
];
const PHASE: { key: NonNullable<VRRow["review_phase"]>; label: string }[] = [
  { key: "baseline", label: "1 · Baseline" },
  { key: "closeout", label: "2 · Closeout" },
  { key: "initial_audit", label: "3 · Initial audit (M3–6)" },
  { key: "pir", label: "4 · PIR (M12–18)" },
];

function catLabel(k: string) { return CATS.find(c => c.key === k)?.label ?? k; }
function catTint(k: string) { return CATS.find(c => c.key === k)?.tint ?? ""; }
function statusMeta(k: string | null) { return STATUS.find(s => s.key === k) ?? null; }
function phaseLabel(k: string | null) { return PHASE.find(p => p.key === k)?.label ?? "—"; }
function fmtMoney(n: number | null, ccy = "USD") {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  try { return sign + new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n); }
  catch { return `${sign}${n.toFixed(0)} ${ccy}`; }
}

export function CapexValueRealization({ capexOptions }: { capexOptions: CapexOption[] }) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VRRow | null>(null);
  const [filterCapex, setFilterCapex] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");

  const { data: rows = [] } = useQuery({
    queryKey: ["capex_value_realization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capex_value_realization" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VRRow[];
    },
  });

  const capexById = useMemo(() => new Map(capexOptions.map(c => [c.id, c])), [capexOptions]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterCapex !== "all" && r.capex_project_id !== filterCapex) return false;
    if (filterCat !== "all" && r.category !== filterCat) return false;
    return true;
  }), [rows, filterCapex, filterCat]);

  const totals = useMemo(() => {
    const impact = filtered.reduce((s, r) => s + Number(r.financial_impact ?? 0), 0);
    const exceeded = filtered.filter(r => r.status === "exceeded").length;
    const favorable = filtered.filter(r => r.status === "favorable").length;
    const onTrack = filtered.filter(r => r.status === "on_track").length;
    const unfavorable = filtered.filter(r => r.status === "unfavorable").length;
    return { impact, exceeded, favorable, onTrack, unfavorable };
  }, [filtered]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("capex_value_realization" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["capex_value_realization"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r: VRRow) => { setEditing(r); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Value realization scorecard</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Demonstrated savings and outcomes per Turnaround Finance project — baseline vs. actual across financial, operational, and quality metrics through the post-implementation review rhythm.
          </p>
        </div>
        <Button onClick={openNew} disabled={capexOptions.length === 0}>
          <Plus className="mr-1 h-4 w-4" /> Add metric
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MiniStat label="Total realized impact" value={fmtMoney(totals.impact)} accent="emerald" />
        <MiniStat label="Exceeded" value={String(totals.exceeded)} accent="emerald" />
        <MiniStat label="Favorable" value={String(totals.favorable)} accent="emerald" />
        <MiniStat label="On track" value={String(totals.onTrack)} accent="blue" />
        <MiniStat label="Unfavorable" value={String(totals.unfavorable)} accent="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterCapex} onValueChange={setFilterCapex}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Turnaround Finance" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Turnaround Finance projects</SelectItem>
            {capexOptions.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.number ? `${c.number} · ` : ""}{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Turnaround Finance</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Metric</th>
              <th className="px-3 py-2">Target (business case)</th>
              <th className="px-3 py-2">Realized result</th>
              <th className="px-3 py-2 text-right">Financial impact</th>
              <th className="px-3 py-2">Phase</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                No value-realization entries yet. Click "Add metric" to log a baseline or realized outcome.
              </td></tr>
            )}
            {filtered.map(r => {
              const cap = capexById.get(r.capex_project_id);
              const s = statusMeta(r.status);
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 text-xs">
                    {cap ? (<><span className="font-mono">{cap.number ?? ""}</span> <span className="text-muted-foreground">{cap.title}</span></>) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", catTint(r.category))}>
                      {catLabel(r.category)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium">{r.metric_name}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.target_kpi || "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.realized_result || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className={cn(Number(r.financial_impact ?? 0) > 0 && "text-emerald-600 dark:text-emerald-400", Number(r.financial_impact ?? 0) < 0 && "text-rose-600 dark:text-rose-400")}>
                      {fmtMoney(r.financial_impact, r.currency ?? "USD")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{phaseLabel(r.review_phase)}</td>
                  <td className="px-3 py-2 text-center">
                    {s ? <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase", s.cls)}>{s.label}</span> : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { confirmThen("Delete this metric?", () => { remove.mutate(r.id); }) }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <VRDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        capexOptions={capexOptions}
        defaultCapexId={filterCapex !== "all" ? filterCapex : undefined}
        onSaved={() => { setDialogOpen(false); qc.invalidateQueries({ queryKey: ["capex_value_realization"] }); }}
      />
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: "emerald" | "blue" | "rose" }) {
  const tint = accent === "emerald" ? "border-l-emerald-500" : accent === "blue" ? "border-l-blue-500" : "border-l-rose-500";
  return (
    <div className={cn("rounded-lg border border-l-4 border-border bg-card p-3", tint)}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

type FormState = Partial<VRRow>;

function VRDialog({
  open, onOpenChange, editing, capexOptions, defaultCapexId, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: VRRow | null;
  capexOptions: CapexOption[];
  defaultCapexId?: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>({});

  useMemo(() => {
    if (open) {
      setForm(editing ? { ...editing } : {
        category: "financial",
        status: "pending",
        review_phase: "baseline",
        currency: "USD",
        capex_project_id: defaultCapexId ?? capexOptions[0]?.id,
      });
    }
  }, [open, editing, defaultCapexId, capexOptions]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.capex_project_id) throw new Error("Select a Turnaround Finance project");
      if (!form.metric_name) throw new Error("Metric name is required");
      const payload = {
        ...form,
        financial_impact: form.financial_impact != null && form.financial_impact !== ("" as unknown as number)
          ? Number(form.financial_impact) : null,
      };
      if (editing) {
        const { error } = await supabase.from("capex_value_realization" as never).update(payload as never).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("capex_value_realization" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Added"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit metric" : "Add value-realization metric"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Turnaround Finance project" full>
            <Select value={form.capex_project_id ?? ""} onValueChange={v => set("capex_project_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select Turnaround Finance project" /></SelectTrigger>
              <SelectContent>
                {capexOptions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.number ? `${c.number} · ` : ""}{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Category">
            <Select value={form.category ?? "financial"} onValueChange={v => set("category", v as VRRow["category"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Review phase">
            <Select value={form.review_phase ?? "baseline"} onValueChange={v => set("review_phase", v as VRRow["review_phase"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHASE.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Metric name" full>
            <Input value={form.metric_name ?? ""} onChange={e => set("metric_name", e.target.value)} placeholder="e.g. Throughput uplift, Payback period, Unplanned downtime…" />
          </Field>
          <Field label="Target KPI (business case)">
            <Input value={form.target_kpi ?? ""} onChange={e => set("target_kpi", e.target.value)} placeholder="e.g. +20% cell capacity" />
          </Field>
          <Field label="Realized result">
            <Input value={form.realized_result ?? ""} onChange={e => set("realized_result", e.target.value)} placeholder="e.g. +24% cell capacity" />
          </Field>
          <Field label="Financial impact (± amount)">
            <Input type="number" value={form.financial_impact ?? ""} onChange={e => set("financial_impact", e.target.value === "" ? null : (Number(e.target.value) as unknown as number))} placeholder="e.g. 350000" />
          </Field>
          <Field label="Currency">
            <Input value={form.currency ?? "USD"} onChange={e => set("currency", e.target.value)} />
          </Field>
          <Field label="Review date">
            <Input type="date" value={form.review_date ?? ""} onChange={e => set("review_date", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status ?? "pending"} onValueChange={v => set("status", v as VRRow["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes" full>
            <Textarea rows={3} value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} placeholder="Assumptions, calculation basis, source of realized numbers…" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1", full && "col-span-2")}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
