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

type Copq = {
  id: string;
  month: string;
  category: "scrap" | "rework" | "warranty" | "customer_return" | "concession" | "sorting" | "other";
  part_number: string | null;
  description: string | null;
  quantity: number;
  cost: number;
  currency: string;
  root_cause: string | null;
  corrective_action: string | null;
  owner_id: string | null;
  status: "open" | "in_progress" | "closed";
  capex_project_id: string | null;
};

const CATS = [
  { key: "scrap", label: "Scrap", cls: "bg-rose-100 text-rose-700" },
  { key: "rework", label: "Rework", cls: "bg-amber-100 text-amber-800" },
  { key: "warranty", label: "Warranty", cls: "bg-orange-100 text-orange-700" },
  { key: "customer_return", label: "Customer return", cls: "bg-red-100 text-red-700" },
  { key: "concession", label: "Concession", cls: "bg-yellow-100 text-yellow-800" },
  { key: "sorting", label: "Sorting", cls: "bg-purple-100 text-purple-700" },
  { key: "other", label: "Other", cls: "bg-slate-100 text-slate-700" },
] as const;

function fmt(n: number, ccy = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n); }
  catch { return `${n.toFixed(0)}`; }
}
function monthKey(d: string) { return d.slice(0, 7); }

export function CapexCopq({ capexOptions }: { capexOptions: { id: string; number: string | null; title: string }[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Copq | null>(null);
  const [catFilter, setCatFilter] = useState<string>("all");

  const { data: rows = [] } = useQuery({
    queryKey: ["copq_entries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("copq_entries" as never).select("*").order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Copq[];
    },
  });

  const filtered = useMemo(() => rows.filter(r => catFilter === "all" || r.category === catFilter), [rows, catFilter]);

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const thisYear = String(now.getFullYear());
  const totals = useMemo(() => {
    const mtd = rows.filter(r => monthKey(r.month) === thisMonth).reduce((s, r) => s + Number(r.cost), 0);
    const ytd = rows.filter(r => r.month.startsWith(thisYear)).reduce((s, r) => s + Number(r.cost), 0);
    const open = rows.filter(r => r.status !== "closed").length;
    return { mtd, ytd, open };
  }, [rows, thisMonth, thisYear]);

  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + Number(r.cost));
    return CATS.map(c => ({ ...c, value: map.get(c.key) ?? 0 })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const maxCat = Math.max(...byCat.map(c => c.value), 1);

  const capexById = new Map(capexOptions.map(c => [c.id, c]));

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("copq_entries" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["copq_entries"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Cost of Poor Quality (COPQ)</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Track the financial bleed from scrap, rework, warranty, and customer returns. Link entries to Turnaround Finance investments meant to eliminate the cause.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Log entry</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <MiniStat label="COPQ · MTD" value={fmt(totals.mtd)} accent="rose" />
        <MiniStat label="COPQ · YTD" value={fmt(totals.ytd)} accent="rose" />
        <MiniStat label="Open items" value={String(totals.open)} accent="amber" />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Breakdown by category</div>
        <div className="space-y-1.5">
          {byCat.map(c => (
            <div key={c.key} className="flex items-center gap-2 text-xs">
              <div className="w-32 truncate">{c.label}</div>
              <div className="flex-1 rounded-full bg-muted">
                <div className={cn("h-2 rounded-full", c.cls.replace("bg-", "bg-").split(" ")[0])} style={{ width: `${(c.value / maxCat) * 100}%` }} />
              </div>
              <div className="w-24 text-right tabular-nums">{fmt(c.value)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Part / description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2">Root cause</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Linked Turnaround Finance</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No COPQ entries logged.</td></tr>
            )}
            {filtered.map(r => {
              const c = CATS.find(x => x.key === r.category)!;
              const cap = r.capex_project_id ? capexById.get(r.capex_project_id) : null;
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 text-xs">{r.month.slice(0, 7)}</td>
                  <td className="px-3 py-2"><span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase", c.cls)}>{c.label}</span></td>
                  <td className="px-3 py-2">
                    {r.part_number && <span className="font-mono text-xs">{r.part_number}</span>}
                    {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(r.quantity).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-rose-600 dark:text-rose-400">{fmt(Number(r.cost), r.currency)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground line-clamp-1 max-w-[220px]">{r.root_cause ?? "—"}</td>
                  <td className="px-3 py-2 text-xs"><OwnerCell id={r.owner_id} /></td>
                  <td className="px-3 py-2 text-xs">{cap ? `${cap.number ?? ""} ${cap.title}` : "—"}</td>
                  <td className="px-3 py-2 text-xs capitalize">{r.status.replace("_", " ")}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { confirmThen("Delete?", () => { remove.mutate(r.id); }) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CopqDialog open={open} onOpenChange={setOpen} editing={editing} capexOptions={capexOptions} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["copq_entries"] }); }} />
    </div>
  );
}

function OwnerCell({ id }: { id: string | null }) {
  const { data: profiles = [] } = useProfiles();
  const map = new Map(profiles.map(p => [p.id, p]));
  return <>{ownerLabel(map.get(id ?? ""))}</>;
}

function CopqDialog({ open, onOpenChange, editing, capexOptions, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Copq | null;
  capexOptions: { id: string; number: string | null; title: string }[]; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Copq>>({});
  useMemo(() => {
    if (open) setForm(editing ?? { month: new Date().toISOString().slice(0, 7) + "-01", category: "scrap", status: "open", currency: "USD" });
  }, [open, editing]);
  const set = <K extends keyof Copq>(k: K, v: Copq[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.month || !form.category) throw new Error("Month and category required");
      const payload = { ...form, quantity: Number(form.quantity ?? 0), cost: Number(form.cost ?? 0),
        capex_project_id: form.capex_project_id || null };
      if (editing) {
        const { error } = await supabase.from("copq_entries" as never).update(payload as never).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("copq_entries" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Added"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Edit COPQ entry" : "Log COPQ entry"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Month"><Input type="date" value={form.month ?? ""} onChange={e => set("month", e.target.value)} /></Field>
          <Field label="Category">
            <Select value={form.category ?? "scrap"} onValueChange={v => set("category", v as Copq["category"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Part number"><Input value={form.part_number ?? ""} onChange={e => set("part_number", e.target.value)} /></Field>
          <Field label="Status">
            <Select value={form.status ?? "open"} onValueChange={v => set("status", v as Copq["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" full>
            <Textarea rows={2} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </Field>
          <Field label="Quantity"><Input type="number" value={form.quantity ?? ""} onChange={e => set("quantity", Number(e.target.value) as Copq["quantity"])} /></Field>
          <Field label="Cost"><Input type="number" value={form.cost ?? ""} onChange={e => set("cost", Number(e.target.value) as Copq["cost"])} /></Field>
          <Field label="Root cause" full>
            <Textarea rows={2} value={form.root_cause ?? ""} onChange={e => set("root_cause", e.target.value)} />
          </Field>
          <Field label="Corrective action" full>
            <Textarea rows={2} value={form.corrective_action ?? ""} onChange={e => set("corrective_action", e.target.value)} />
          </Field>
          <Field label="Owner"><OwnerSelect value={form.owner_id ?? null} onChange={v => set("owner_id", v)} /></Field>
          <Field label="Linked Turnaround Finance (optional)">
            <Select value={form.capex_project_id ?? "none"} onValueChange={v => set("capex_project_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {capexOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.number ? `${c.number} · ` : ""}{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
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

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: "rose" | "amber" }) {
  const tint = accent === "rose" ? "border-l-rose-500" : accent === "amber" ? "border-l-amber-500" : "border-l-primary";
  return (
    <div className={cn("rounded-lg border border-l-4 border-border bg-card p-3", tint)}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
