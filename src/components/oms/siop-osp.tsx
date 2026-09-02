import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { OwnerSelect } from "@/components/owner-select";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { assertWrote } from "@/lib/write-guard";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

type OSP = {
  id: string; cycle_id: string;
  process: string; spec: string | null; supplier: string | null; nadcap_approved: boolean;
  part_number: string | null; program: string | null; lot_qty: number | null;
  ship_date: string | null; promised_return_date: string | null; expected_return_date: string | null; actual_return_date: string | null;
  tat_days_target: number | null;
  status: "at_supplier"|"shipping_back"|"returned"|"late"|"hold"|"scrap";
  risk: "green"|"yellow"|"red"|null;
  hold_reason: string | null; owner_id: string | null; cost: number | null; notes: string | null;
};

const PROCESSES = ["heat_treat","coating","plating","NDT","edm","machining","painting","welding","other"] as const;
const STATUSES = ["at_supplier","shipping_back","returned","late","hold","scrap"] as const;
const RISK_DOT: Record<string, string> = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500" };
const STATUS_COLOR: Record<string, string> = {
  at_supplier: "bg-blue-100 text-blue-800", shipping_back: "bg-indigo-100 text-indigo-800",
  returned: "bg-emerald-100 text-emerald-800", late: "bg-red-100 text-red-800",
  hold: "bg-amber-100 text-amber-800", scrap: "bg-destructive text-destructive-foreground",
};

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function tatActual(r: OSP): number | null { return daysBetween(r.ship_date, r.actual_return_date); }
function tatExpected(r: OSP): number | null { return daysBetween(r.ship_date, r.expected_return_date); }
function computeRisk(r: OSP): "green"|"yellow"|"red"|null {
  if (r.status === "returned") return "green";
  if (r.status === "late" || r.status === "hold") return "red";
  const tExp = tatExpected(r);
  if (tExp != null && r.tat_days_target != null) {
    if (tExp > r.tat_days_target * 1.2) return "red";
    if (tExp > r.tat_days_target) return "yellow";
    return "green";
  }
  return r.risk;
}

export function SiopOsp({ cycleId }: { cycleId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<OSP | null>(null);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({ q: "", supplier: "", process: "all", status: "all", risk: "all" });

  const rowsQ = useQuery({
    queryKey: ["siop_osp", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_osp_jobs")
        .select("*").eq("cycle_id", cycleId).order("expected_return_date", { nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as OSP[];
    },
  });
  const rows = rowsQ.data ?? [];
  const suppliers = useMemo(() => Array.from(new Set(rows.map((r) => r.supplier).filter(Boolean))) as string[], [rows]);
  const filtered = useMemo(() => rows.filter((r) => {
    if (filters.supplier && r.supplier !== filters.supplier) return false;
    if (filters.process !== "all" && r.process !== filters.process) return false;
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.risk !== "all" && (computeRisk(r) ?? "none") !== filters.risk) return false;
    if (filters.q && !`${r.part_number ?? ""} ${r.supplier ?? ""} ${r.program ?? ""} ${r.spec ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  }), [rows, filters]);

  const atSupplier = rows.filter((r) => r.status === "at_supplier" || r.status === "shipping_back" || r.status === "hold").length;
  const late = rows.filter((r) => r.status === "late").length;
  const tats = rows.map((r) => tatActual(r)).filter((n): n is number => n != null);
  const avgTat = tats.length ? Math.round(tats.reduce((a, b) => a + b, 0) / tats.length) : null;
  const returned = rows.filter((r) => r.status === "returned");
  const onTime = returned.length ? Math.round(returned.filter((r) => {
    const a = tatActual(r); return a != null && r.tat_days_target != null && a <= r.tat_days_target;
  }).length / returned.length * 100) : null;

  const supplierAgg = useMemo(() => {
    const map = new Map<string, { open: number; returned: number; onTime: number; tatSum: number; tatN: number; targetSum: number; targetN: number }>();
    for (const r of rows) {
      if (!r.supplier) continue;
      let s = map.get(r.supplier);
      if (!s) { s = { open: 0, returned: 0, onTime: 0, tatSum: 0, tatN: 0, targetSum: 0, targetN: 0 }; map.set(r.supplier, s); }
      if (r.status !== "returned" && r.status !== "scrap") s.open++;
      if (r.status === "returned") {
        s.returned++;
        const a = tatActual(r);
        if (a != null) { s.tatSum += a; s.tatN++; if (r.tat_days_target != null && a <= r.tat_days_target) s.onTime++; }
      }
      if (r.tat_days_target != null) { s.targetSum += r.tat_days_target; s.targetN++; }
    }
    return Array.from(map.entries()).map(([supplier, s]) => ({
      supplier, open: s.open, returned: s.returned,
      avgTat: s.tatN ? Math.round(s.tatSum / s.tatN) : null,
      target: s.targetN ? Math.round(s.targetSum / s.targetN) : null,
      onTimePct: s.returned ? Math.round((s.onTime / s.returned) * 100) : null,
    })).sort((a, b) => (b.avgTat ?? 0) - (a.avgTat ?? 0));
  }, [rows]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("siop_osp_jobs").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_osp", cycleId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="At supplier" value={String(atSupplier)} />
        <Kpi label="Late" value={String(late)} tone={late > 0 ? "red" : "neutral"} />
        <Kpi label="Avg TAT (actual)" value={avgTat != null ? `${avgTat}d` : "—"} />
        <Kpi label="On-time %" value={onTime != null ? `${onTime}%` : "—"} tone={onTime != null && onTime < 80 ? "red" : "neutral"} />
      </div>

      <div className="rounded-lg border p-3 grid gap-2 md:grid-cols-6">
        <Input placeholder="Search part / program" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <Select value={filters.process} onValueChange={(v) => setFilters({ ...filters, process: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All processes</SelectItem>
            {PROCESSES.map((p) => <SelectItem key={p} value={p}>{p.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.supplier || "all"} onValueChange={(v) => setFilters({ ...filters, supplier: v === "all" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Supplier" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All suppliers</SelectItem>{suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.risk} onValueChange={(v) => setFilters({ ...filters, risk: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk</SelectItem>
            <SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> Add OSP job</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No OSP jobs tracked for this cycle yet.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs">
              <tr>
                <th className="p-2 text-left">Process / spec</th>
                <th className="p-2 text-left">Supplier</th>
                <th className="p-2 text-left">Part / Program</th>
                <th className="p-2 text-right">Lot</th>
                <th className="p-2">Ship</th>
                <th className="p-2">Promised back</th>
                <th className="p-2">Expected</th>
                <th className="p-2">Actual</th>
                <th className="p-2 text-right">TAT (target)</th>
                <th className="p-2">Status</th>
                <th className="p-2">Risk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const risk = computeRisk(r);
                const tA = tatActual(r); const tE = tatExpected(r);
                return (
                  <tr key={r.id} className={cn("border-t hover:bg-muted/30 cursor-pointer", risk === "red" && "bg-red-500/5")} onClick={() => setEditing(r)}>
                    <td className="p-2">
                      <div className="font-medium flex items-center gap-1">
                        {r.process.replace("_"," ")}
                        {r.nadcap_approved && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.spec}</div>
                    </td>
                    <td className="p-2 text-xs">{r.supplier ?? "—"}</td>
                    <td className="p-2 text-xs">
                      <div>{r.part_number ?? "—"}</div>
                      <div className="text-muted-foreground">{r.program ?? ""}</div>
                    </td>
                    <td className="p-2 text-right text-xs tabular-nums">{r.lot_qty ?? "—"}</td>
                    <td className="p-2 text-xs">{r.ship_date ?? "—"}</td>
                    <td className="p-2 text-xs">{r.promised_return_date ?? "—"}</td>
                    <td className="p-2 text-xs">{r.expected_return_date ?? "—"}</td>
                    <td className="p-2 text-xs">{r.actual_return_date ?? "—"}</td>
                    <td className="p-2 text-right text-xs tabular-nums">
                      {tA != null ? `${tA}d` : tE != null ? `${tE}d*` : "—"}
                      {r.tat_days_target != null && <span className="text-muted-foreground"> / {r.tat_days_target}</span>}
                    </td>
                    <td className="p-2"><Badge className={cn("text-xs", STATUS_COLOR[r.status])}>{r.status.replace("_"," ")}</Badge></td>
                    <td className="p-2 text-center">{risk && <span className={cn("inline-block h-3 w-3 rounded-full", RISK_DOT[risk])} />}</td>
                    <td className="p-2"><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); confirmThen("Delete?", () => { del.mutate(r.id); }) }}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {supplierAgg.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Supplier velocity</h3>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs">
                <tr>
                  <th className="p-2 text-left">Supplier</th>
                  <th className="p-2 text-right">Open jobs</th>
                  <th className="p-2 text-right">Returned</th>
                  <th className="p-2 text-right">Avg TAT</th>
                  <th className="p-2 text-right">Target</th>
                  <th className="p-2 text-right">On-time %</th>
                </tr>
              </thead>
              <tbody>
                {supplierAgg.map((s) => (
                  <tr key={s.supplier} className="border-t">
                    <td className="p-2 font-medium">{s.supplier}</td>
                    <td className="p-2 text-right tabular-nums">{s.open}</td>
                    <td className="p-2 text-right tabular-nums">{s.returned}</td>
                    <td className="p-2 text-right tabular-nums">{s.avgTat != null ? `${s.avgTat}d` : "—"}</td>
                    <td className="p-2 text-right tabular-nums text-muted-foreground">{s.target != null ? `${s.target}d` : "—"}</td>
                    <td className={cn("p-2 text-right tabular-nums", s.onTimePct != null && s.onTimePct < 80 && "text-red-500 font-semibold")}>
                      {s.onTimePct != null ? `${s.onTimePct}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <OspDialog cycleId={cycleId} row={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      )}
    </div>
  );
}

function Kpi({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "red" }) {
  return (
    <div className={cn("rounded-lg border p-3", tone === "red" && "border-red-500/40 bg-red-500/5")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function OspDialog({ cycleId, row, onClose }: { cycleId: string; row: OSP | null; onClose: () => void }) {
  const qc = useQueryClient();
  const empty: Partial<OSP> = { cycle_id: cycleId, process: "heat_treat", status: "at_supplier", nadcap_approved: false, risk: null };
  const [form, setForm] = useState<Partial<OSP>>(row ?? empty);
  const save = useMutation({
    mutationFn: async () => {
      if (!form.process) throw new Error("Process required");
      if (row) {
        const { id, created_at, updated_at, ...patch } = { ...form } as OSP & { created_at?: string; updated_at?: string };
        const { data, error } = await supabase.from("siop_osp_jobs").update(patch).eq("id", row.id).select("id");
        if (error) throw error;
        assertWrote(data, "edit");
      } else {
        const { error } = await supabase.from("siop_osp_jobs").insert({ ...form, cycle_id: cycleId, process: form.process! });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_osp", cycleId] }); onClose(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row ? "Edit OSP job" : "New OSP job"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1"><Label className="text-xs">Process *</Label>
            <Select value={form.process ?? "heat_treat"} onValueChange={(v) => setForm({ ...form, process: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROCESSES.map((p) => <SelectItem key={p} value={p}>{p.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Spec</Label><Input value={form.spec ?? ""} onChange={(e) => setForm({ ...form, spec: e.target.value })} placeholder="AMS 2750, Nadcap ref…" /></div>
          <div className="space-y-1"><Label className="text-xs">Supplier</Label><Input value={form.supplier ?? ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          <div className="space-y-1 flex items-center gap-2 pt-5">
            <input id="nadcap" type="checkbox" checked={!!form.nadcap_approved} onChange={(e) => setForm({ ...form, nadcap_approved: e.target.checked })} />
            <Label htmlFor="nadcap" className="text-xs">Nadcap approved</Label>
          </div>
          <div className="space-y-1"><Label className="text-xs">Part number</Label><Input value={form.part_number ?? ""} onChange={(e) => setForm({ ...form, part_number: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Program</Label><Input value={form.program ?? ""} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Lot qty</Label><Input type="number" value={form.lot_qty ?? ""} onChange={(e) => setForm({ ...form, lot_qty: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="space-y-1"><Label className="text-xs">Cost $</Label><Input type="number" step="0.01" value={form.cost ?? ""} onChange={(e) => setForm({ ...form, cost: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="space-y-1"><Label className="text-xs">TAT target (days)</Label><Input type="number" value={form.tat_days_target ?? ""} onChange={(e) => setForm({ ...form, tat_days_target: e.target.value ? Number(e.target.value) : null })} /></div>
          <div className="space-y-1"><Label className="text-xs">Ship date</Label><Input type="date" value={form.ship_date ?? ""} onChange={(e) => setForm({ ...form, ship_date: e.target.value || null })} /></div>
          <div className="space-y-1"><Label className="text-xs">Promised return</Label><Input type="date" value={form.promised_return_date ?? ""} onChange={(e) => setForm({ ...form, promised_return_date: e.target.value || null })} /></div>
          <div className="space-y-1"><Label className="text-xs">Expected return</Label><Input type="date" value={form.expected_return_date ?? ""} onChange={(e) => setForm({ ...form, expected_return_date: e.target.value || null })} /></div>
          <div className="space-y-1"><Label className="text-xs">Actual return</Label><Input type="date" value={form.actual_return_date ?? ""} onChange={(e) => setForm({ ...form, actual_return_date: e.target.value || null })} /></div>
          <div className="space-y-1"><Label className="text-xs">Status</Label>
            <Select value={form.status ?? "at_supplier"} onValueChange={(v) => setForm({ ...form, status: v as OSP["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Risk override</Label>
            <Select value={form.risk ?? "auto"} onValueChange={(v) => setForm({ ...form, risk: v === "auto" ? null : v as OSP["risk"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Owner</Label><OwnerSelect value={form.owner_id ?? null} onChange={(v) => setForm({ ...form, owner_id: v })} /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Hold reason</Label><Input value={form.hold_reason ?? ""} onChange={(e) => setForm({ ...form, hold_reason: e.target.value })} /></div>
        <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
