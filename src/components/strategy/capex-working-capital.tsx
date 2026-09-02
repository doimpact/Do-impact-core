import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

type WCItem = {
  id: string;
  category: "raw" | "wip" | "fg" | "ar" | "ap" | "other";
  title: string;
  description: string | null;
  current_value: number;
  target_value: number;
  realized_value: number;
  currency: string;
  owner_id: string | null;
  action: string | null;
  due_date: string | null;
  realized_date: string | null;
  status: "identified" | "in_progress" | "realized" | "blocked";
  archived_at: string | null;
};
type WCKpi = {
  id: string;
  month: string;
  dio: number | null; dso: number | null; dpo: number | null;
  inventory_total: number | null; ar_total: number | null; ap_total: number | null;
};

const CATS = [
  { key: "raw", label: "Raw materials" },
  { key: "wip", label: "Work-in-progress" },
  { key: "fg", label: "Finished goods" },
  { key: "ar", label: "Accounts receivable" },
  { key: "ap", label: "Accounts payable" },
  { key: "other", label: "Other" },
] as const;
const STATUS = [
  { key: "identified", label: "Identified", cls: "bg-slate-100 text-slate-700" },
  { key: "in_progress", label: "In progress", cls: "bg-blue-100 text-blue-700" },
  { key: "realized", label: "Realized", cls: "bg-emerald-100 text-emerald-700" },
  { key: "blocked", label: "Blocked", cls: "bg-rose-100 text-rose-700" },
] as const;

function fmt(n: number, ccy = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n); }
  catch { return `${n.toFixed(0)}`; }
}

export function CapexWorkingCapital() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WCItem | null>(null);
  const [kpiOpen, setKpiOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["working_capital_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("working_capital_items" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WCItem[];
    },
  });
  const { data: kpis = [] } = useQuery({
    queryKey: ["working_capital_kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("working_capital_kpis" as never).select("*").order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WCKpi[];
    },
  });

  const totals = useMemo(() => {
    const active = items.filter(i => !i.archived_at);
    const identified = active.reduce((s, i) => s + Number(i.current_value) - Number(i.target_value), 0);
    const realized = active.reduce((s, i) => s + Number(i.realized_value || 0), 0);
    const inflight = active.filter(i => i.status === "in_progress").reduce((s, i) => s + (Number(i.current_value) - Number(i.target_value)), 0);
    return { identified, realized, inflight, count: active.length };
  }, [items]);

  const latestKpi = kpis[0];

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("working_capital_items" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["working_capital_items"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Working capital & inventory monetization</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Release cash tied up in raw materials, WIP, and receivables. Track identified opportunities from action → realized cash.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setKpiOpen(true)}>Log monthly KPIs</Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Add opportunity</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Cash identified" value={fmt(totals.identified)} accent="emerald" />
        <MiniStat label="Realized to date" value={fmt(totals.realized)} accent="emerald" />
        <MiniStat label="In-flight value" value={fmt(totals.inflight)} accent="blue" />
        <MiniStat label="Opportunities" value={String(totals.count)} />
      </div>

      {latestKpi && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 md:grid-cols-6">
          <KpiTile label={`DIO (${new Date(latestKpi.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })})`} value={latestKpi.dio != null ? `${latestKpi.dio} d` : "—"} />
          <KpiTile label="DSO" value={latestKpi.dso != null ? `${latestKpi.dso} d` : "—"} />
          <KpiTile label="DPO" value={latestKpi.dpo != null ? `${latestKpi.dpo} d` : "—"} />
          <KpiTile label="Inventory" value={latestKpi.inventory_total != null ? fmt(Number(latestKpi.inventory_total)) : "—"} />
          <KpiTile label="AR" value={latestKpi.ar_total != null ? fmt(Number(latestKpi.ar_total)) : "—"} />
          <KpiTile label="AP" value={latestKpi.ap_total != null ? fmt(Number(latestKpi.ap_total)) : "—"} />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Current</th>
              <th className="px-3 py-2 text-right">Target</th>
              <th className="px-3 py-2 text-right">Cash to release</th>
              <th className="px-3 py-2 text-right">Realized</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No working-capital opportunities yet.</td></tr>
            )}
            {items.map(i => {
              const cashOut = Number(i.current_value) - Number(i.target_value);
              const s = STATUS.find(x => x.key === i.status)!;
              return (
                <tr key={i.id} className={cn("border-t border-border hover:bg-muted/30", i.archived_at && "opacity-60")}>
                  <td className="px-3 py-2 text-xs">{CATS.find(c => c.key === i.category)?.label}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{i.title}</div>
                    {i.action && <div className="text-xs text-muted-foreground line-clamp-1">{i.action}</div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(i.current_value), i.currency)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(i.target_value), i.currency)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{fmt(cashOut, i.currency)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(i.realized_value), i.currency)}</td>
                  <td className="px-3 py-2 text-xs"><OwnerCell id={i.owner_id} /></td>
                  <td className="px-3 py-2 text-xs">{i.due_date ?? "—"}</td>
                  <td className="px-3 py-2"><span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase", s.cls)}>{s.label}</span></td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(i); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { confirmThen("Delete?", () => { remove.mutate(i.id); }) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ItemDialog open={open} onOpenChange={setOpen} editing={editing} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["working_capital_items"] }); }} />
      <KpiDialog open={kpiOpen} onOpenChange={setKpiOpen} onSaved={() => { setKpiOpen(false); qc.invalidateQueries({ queryKey: ["working_capital_kpis"] }); }} />
    </div>
  );
}

function OwnerCell({ id }: { id: string | null }) {
  const { data: profiles = [] } = useProfiles();
  const map = new Map(profiles.map(p => [p.id, p]));
  return <>{ownerLabel(map.get(id ?? ""))}</>;
}

function ItemDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; editing: WCItem | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<WCItem>>({});
  useMemo(() => { if (open) setForm(editing ?? { category: "wip", status: "identified", currency: "USD" }); }, [open, editing]);
  const set = <K extends keyof WCItem>(k: K, v: WCItem[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title) throw new Error("Title required");
      const payload = { ...form,
        current_value: Number(form.current_value ?? 0),
        target_value: Number(form.target_value ?? 0),
        realized_value: Number(form.realized_value ?? 0),
      };
      if (editing) {
        const { error } = await supabase.from("working_capital_items" as never).update(payload as never).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("working_capital_items" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Added"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Edit opportunity" : "Add working-capital opportunity"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category ?? "wip"} onValueChange={v => set("category", v as WCItem["category"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status ?? "identified"} onValueChange={v => set("status", v as WCItem["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Title" full>
            <Input value={form.title ?? ""} onChange={e => set("title", e.target.value)} placeholder="e.g. Reduce slow-moving raw stock" />
          </Field>
          <Field label="Current $ tied up"><Input type="number" value={form.current_value ?? ""} onChange={e => set("current_value", Number(e.target.value) as WCItem["current_value"])} /></Field>
          <Field label="Target $"><Input type="number" value={form.target_value ?? ""} onChange={e => set("target_value", Number(e.target.value) as WCItem["target_value"])} /></Field>
          <Field label="Realized $"><Input type="number" value={form.realized_value ?? ""} onChange={e => set("realized_value", Number(e.target.value) as WCItem["realized_value"])} /></Field>
          <Field label="Currency"><Input value={form.currency ?? "USD"} onChange={e => set("currency", e.target.value)} /></Field>
          <Field label="Owner"><OwnerSelect value={form.owner_id ?? null} onChange={v => set("owner_id", v)} /></Field>
          <Field label="Due date"><Input type="date" value={form.due_date ?? ""} onChange={e => set("due_date", e.target.value)} /></Field>
          <Field label="Action" full>
            <Textarea rows={2} value={form.action ?? ""} onChange={e => set("action", e.target.value)} placeholder="Specific action to release the cash" />
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

function KpiDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<WCKpi>>({ month: new Date().toISOString().slice(0, 10).slice(0, 7) + "-01" });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("working_capital_kpis" as never).upsert(form as never, { onConflict: "company_id,month" } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = <K extends keyof WCKpi>(k: K, v: WCKpi[K]) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Monthly working-capital KPIs</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Month" full><Input type="date" value={form.month ?? ""} onChange={e => set("month", e.target.value)} /></Field>
          <Field label="DIO (days)"><Input type="number" value={form.dio ?? ""} onChange={e => set("dio", Number(e.target.value) as WCKpi["dio"])} /></Field>
          <Field label="DSO (days)"><Input type="number" value={form.dso ?? ""} onChange={e => set("dso", Number(e.target.value) as WCKpi["dso"])} /></Field>
          <Field label="DPO (days)"><Input type="number" value={form.dpo ?? ""} onChange={e => set("dpo", Number(e.target.value) as WCKpi["dpo"])} /></Field>
          <Field label="Inventory total $"><Input type="number" value={form.inventory_total ?? ""} onChange={e => set("inventory_total", Number(e.target.value) as WCKpi["inventory_total"])} /></Field>
          <Field label="AR total $"><Input type="number" value={form.ar_total ?? ""} onChange={e => set("ar_total", Number(e.target.value) as WCKpi["ar_total"])} /></Field>
          <Field label="AP total $"><Input type="number" value={form.ap_total ?? ""} onChange={e => set("ap_total", Number(e.target.value) as WCKpi["ap_total"])} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
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

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "blue" | "rose" }) {
  const tint = accent === "emerald" ? "border-l-emerald-500" : accent === "blue" ? "border-l-blue-500" : accent === "rose" ? "border-l-rose-500" : "border-l-primary";
  return (
    <div className={cn("rounded-lg border border-l-4 border-border bg-card p-3", tint)}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background px-2 py-1">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
