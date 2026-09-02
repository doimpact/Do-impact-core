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
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { assertWrote } from "@/lib/write-guard";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

type LL = {
  id: string; cycle_id: string;
  material: string; form: string | null; spec: string | null; heat_lot: string | null;
  supplier: string | null; po_number: string | null; part_numbers: string | null; program: string | null;
  qty_ordered: number | null; uom: string | null; unit_cost: number | null;
  order_date: string | null; promised_date: string | null; expected_date: string | null;
  need_by_date: string | null; received_date: string | null;
  status: "quoted"|"ordered"|"in_transit"|"received"|"partial"|"late"|"cancelled";
  risk: "green"|"yellow"|"red"|null;
  owner_id: string | null; notes: string | null;
};

const STATUSES = ["quoted","ordered","in_transit","received","partial","late","cancelled"] as const;
const RISK_DOT: Record<string, string> = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500" };
const STATUS_COLOR: Record<string, string> = {
  quoted: "bg-slate-200 text-slate-800", ordered: "bg-blue-100 text-blue-800",
  in_transit: "bg-indigo-100 text-indigo-800", received: "bg-emerald-100 text-emerald-800",
  partial: "bg-amber-100 text-amber-800", late: "bg-red-100 text-red-800", cancelled: "bg-muted text-muted-foreground",
};

function weeksBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (7 * 86400000));
}
function computeRisk(r: LL): "green"|"yellow"|"red"|null {
  if (r.status === "received" || r.status === "cancelled") return "green";
  if (!r.need_by_date || !r.expected_date) return r.risk;
  const days = (new Date(r.need_by_date).getTime() - new Date(r.expected_date).getTime()) / 86400000;
  if (days < 0) return "red";
  if (days < 14) return "yellow";
  return "green";
}

export function SiopLongLead({ cycleId }: { cycleId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LL | null>(null);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({ q: "", supplier: "", status: "all", risk: "all", material: "" });

  const rowsQ = useQuery({
    queryKey: ["siop_ll", cycleId],
    queryFn: async () => {
      const { data, error } = await supabase.from("siop_long_lead_materials")
        .select("*").eq("cycle_id", cycleId).order("expected_date", { nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as LL[];
    },
  });
  const rows = rowsQ.data ?? [];

  const suppliers = useMemo(() => Array.from(new Set(rows.map((r) => r.supplier).filter(Boolean))) as string[], [rows]);
  const materials = useMemo(() => Array.from(new Set(rows.map((r) => r.material).filter(Boolean))) as string[], [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (filters.supplier && r.supplier !== filters.supplier) return false;
    if (filters.material && r.material !== filters.material) return false;
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.risk !== "all" && (computeRisk(r) ?? "none") !== filters.risk) return false;
    if (filters.q && !`${r.material} ${r.supplier ?? ""} ${r.po_number ?? ""} ${r.part_numbers ?? ""} ${r.program ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  }), [rows, filters]);

  const openCommitted = rows.filter((r) => r.status !== "received" && r.status !== "cancelled")
    .reduce((s, r) => s + (r.qty_ordered ?? 0) * (r.unit_cost ?? 0), 0);
  const atRisk = rows.filter((r) => computeRisk(r) === "red").length;
  const late = rows.filter((r) => r.status === "late").length;
  const lts = rows.map((r) => weeksBetween(r.order_date, r.promised_date)).filter((n): n is number => n != null);
  const avgLt = lts.length ? Math.round(lts.reduce((a, b) => a + b, 0) / lts.length) : null;

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("siop_long_lead_materials").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siop_ll", cycleId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Open $ committed" value={`$${(openCommitted/1000).toFixed(0)}k`} />
        <Kpi label="At risk" value={String(atRisk)} tone={atRisk > 0 ? "red" : "neutral"} />
        <Kpi label="Late" value={String(late)} tone={late > 0 ? "red" : "neutral"} />
        <Kpi label="Avg lead time" value={avgLt != null ? `${avgLt} wk` : "—"} />
      </div>

      <div className="rounded-lg border p-3 grid gap-2 md:grid-cols-6">
        <Input placeholder="Search PO / part / program" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <Select value={filters.material || "all"} onValueChange={(v) => setFilters({ ...filters, material: v === "all" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All materials</SelectItem>{materials.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.supplier || "all"} onValueChange={(v) => setFilters({ ...filters, supplier: v === "all" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Supplier" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All suppliers</SelectItem>{suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.risk} onValueChange={(v) => setFilters({ ...filters, risk: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk</SelectItem>
            <SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> Add PO</Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No long-lead materials tracked for this cycle yet.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs">
              <tr>
                <th className="p-2 text-left">Material / spec</th>
                <th className="p-2 text-left">Supplier</th>
                <th className="p-2 text-left">PO / Program</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">$</th>
                <th className="p-2">Order</th>
                <th className="p-2">Promised</th>
                <th className="p-2">Expected</th>
                <th className="p-2">Need by</th>
                <th className="p-2">Status</th>
                <th className="p-2">Risk</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const risk = computeRisk(r);
                const slip = r.expected_date && r.need_by_date
                  ? Math.round((new Date(r.expected_date).getTime() - new Date(r.need_by_date).getTime()) / 86400000) : null;
                return (
                  <tr key={r.id} className={cn("border-t hover:bg-muted/30 cursor-pointer", risk === "red" && "bg-red-500/5")} onClick={() => setEditing(r)}>
                    <td className="p-2">
                      <div className="font-medium">{r.material}{r.form ? ` · ${r.form}` : ""}</div>
                      <div className="text-xs text-muted-foreground">{r.spec}{r.heat_lot ? ` · ${r.heat_lot}` : ""}</div>
                    </td>
                    <td className="p-2 text-xs">{r.supplier ?? "—"}</td>
                    <td className="p-2 text-xs">
                      <div>{r.po_number ?? "—"}</div>
                      <div className="text-muted-foreground">{r.program ?? ""} {r.part_numbers ? `· ${r.part_numbers}` : ""}</div>
                    </td>
                    <td className="p-2 text-right text-xs tabular-nums">{r.qty_ordered ?? "—"} {r.uom ?? ""}</td>
                    <td className="p-2 text-right text-xs tabular-nums">{r.unit_cost != null && r.qty_ordered != null ? `$${(r.qty_ordered * r.unit_cost).toLocaleString()}` : "—"}</td>
                    <td className="p-2 text-xs">{r.order_date ?? "—"}</td>
                    <td className="p-2 text-xs">{r.promised_date ?? "—"}</td>
                    <td className="p-2 text-xs">
                      {r.expected_date ?? "—"}
                      {slip != null && slip > 0 && <div className="text-red-500 text-[10px]">+{slip}d</div>}
                    </td>
                    <td className="p-2 text-xs">{r.need_by_date ?? "—"}</td>
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

      {(creating || editing) && (
        <LLDialog
          cycleId={cycleId}
          row={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
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

function LLDialog({ cycleId, row, onClose }: { cycleId: string; row: LL | null; onClose: () => void }) {
  const qc = useQueryClient();
  const empty: Partial<LL> = { cycle_id: cycleId, material: "", status: "ordered", risk: null };
  const [form, setForm] = useState<Partial<LL>>(row ?? empty);
  const save = useMutation({
    mutationFn: async () => {
      if (!form.material) throw new Error("Material required");
      if (row) {
        const { id, created_at, updated_at, ...patch } = { ...form } as LL & { created_at?: string; updated_at?: string };
        const { data, error } = await supabase.from("siop_long_lead_materials").update(patch).eq("id", row.id).select("id");
        if (error) throw error;
        assertWrote(data, "edit");
      } else {
        const { error } = await supabase.from("siop_long_lead_materials").insert({ ...form, cycle_id: cycleId, material: form.material! });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["siop_ll", cycleId] }); onClose(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const F = <K extends keyof LL>(k: K, label: string, extra?: React.ReactNode) => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label>{extra}</div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{row ? "Edit long-lead material" : "New long-lead material"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 md:grid-cols-3">
          {(() => {
            const PRESETS = ["Ti-6Al-4V","Ti-3Al-2.5V","Inco 625","Inco 718","Hastelloy X","A286","17-4 PH","15-5 PH","Composite prepreg"];
            const isOther = !!form.material && !PRESETS.includes(form.material);
            const selectValue = !form.material ? "" : isOther ? "__other" : form.material;
            return (
              <div className="space-y-1 md:col-span-1">
                <Label className="text-xs">Material *</Label>
                <Select value={selectValue} onValueChange={(v) => setForm({ ...form, material: v === "__other" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    <SelectItem value="__other">Other…</SelectItem>
                  </SelectContent>
                </Select>
                {(isOther || selectValue === "__other") && (
                  <Input autoFocus placeholder="Specify material" value={form.material ?? ""} onChange={(e) => setForm({ ...form, material: e.target.value })} />
                )}
              </div>
            );
          })()}
          {F("form","Form", <Select value={form.form ?? "none"} onValueChange={(v) => setForm({ ...form, form: v === "none" ? null : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {["bar","plate","sheet","tube","forging","casting","billet","composite prepreg","other"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>)}
          {F("spec","Spec", <Input value={form.spec ?? ""} onChange={(e) => setForm({ ...form, spec: e.target.value })} placeholder="AMS 4928…" />)}
          {F("supplier","Supplier", <Input value={form.supplier ?? ""} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />)}
          {F("po_number","PO #", <Input value={form.po_number ?? ""} onChange={(e) => setForm({ ...form, po_number: e.target.value })} />)}
          {F("heat_lot","Heat / lot", <Input value={form.heat_lot ?? ""} onChange={(e) => setForm({ ...form, heat_lot: e.target.value })} />)}
          {F("program","Program", <Input value={form.program ?? ""} onChange={(e) => setForm({ ...form, program: e.target.value })} />)}
          {F("part_numbers","Part numbers fed", <Input value={form.part_numbers ?? ""} onChange={(e) => setForm({ ...form, part_numbers: e.target.value })} />)}
          {F("qty_ordered","Qty ordered", <Input type="number" step="0.01" value={form.qty_ordered ?? ""} onChange={(e) => setForm({ ...form, qty_ordered: e.target.value ? Number(e.target.value) : null })} />)}
          {F("uom","UoM", <Select value={form.uom ?? "none"} onValueChange={(v) => setForm({ ...form, uom: v === "none" ? null : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="none">—</SelectItem>{["lb","kg","pcs","ft","in","m"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>)}
          {F("unit_cost","Unit cost $", <Input type="number" step="0.01" value={form.unit_cost ?? ""} onChange={(e) => setForm({ ...form, unit_cost: e.target.value ? Number(e.target.value) : null })} />)}
          {F("order_date","Order date", <Input type="date" value={form.order_date ?? ""} onChange={(e) => setForm({ ...form, order_date: e.target.value || null })} />)}
          {F("promised_date","Promised", <Input type="date" value={form.promised_date ?? ""} onChange={(e) => setForm({ ...form, promised_date: e.target.value || null })} />)}
          {F("expected_date","Expected", <Input type="date" value={form.expected_date ?? ""} onChange={(e) => setForm({ ...form, expected_date: e.target.value || null })} />)}
          {F("need_by_date","Need by", <Input type="date" value={form.need_by_date ?? ""} onChange={(e) => setForm({ ...form, need_by_date: e.target.value || null })} />)}
          {F("received_date","Received", <Input type="date" value={form.received_date ?? ""} onChange={(e) => setForm({ ...form, received_date: e.target.value || null })} />)}
          {F("status","Status", <Select value={form.status ?? "ordered"} onValueChange={(v) => setForm({ ...form, status: v as LL["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
          </Select>)}
          {F("risk","Risk override", <Select value={form.risk ?? "auto"} onValueChange={(v) => setForm({ ...form, risk: v === "auto" ? null : v as LL["risk"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="green">Green</SelectItem><SelectItem value="yellow">Yellow</SelectItem><SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>)}
          {F("owner_id","Owner", <OwnerSelect value={form.owner_id ?? null} onChange={(v) => setForm({ ...form, owner_id: v })} />)}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Notes</Label>
          <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
