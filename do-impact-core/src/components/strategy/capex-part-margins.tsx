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
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

type Part = {
  id: string;
  part_number: string;
  description: string | null;
  customer: string | null;
  annual_qty: number;
  price: number;
  material_cost: number;
  labor_cost: number;
  overhead: number;
  scrap_pct: number;
  nre_recovery: number;
  currency: string;
  archived_at: string | null;
};

function fmt(n: number, ccy = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n); }
  catch { return `${n.toFixed(0)}`; }
}
function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }

function computeMargin(p: Part) {
  const scrapMult = 1 + Number(p.scrap_pct || 0) / 100;
  const unitCost = (Number(p.material_cost) + Number(p.labor_cost) + Number(p.overhead)) * scrapMult - Number(p.nre_recovery || 0);
  const unitMargin = Number(p.price) - unitCost;
  const marginPct = Number(p.price) > 0 ? unitMargin / Number(p.price) : 0;
  const annualMargin = unitMargin * Number(p.annual_qty);
  const flag: "negative" | "thin" | "healthy" = marginPct < 0 ? "negative" : marginPct < 0.1 ? "thin" : "healthy";
  return { unitCost, unitMargin, marginPct, annualMargin, flag };
}

export function CapexPartMargins() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [flagFilter, setFlagFilter] = useState<"all" | "negative" | "thin" | "healthy">("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: parts = [] } = useQuery({
    queryKey: ["part_margins"],
    queryFn: async () => {
      const { data, error } = await supabase.from("part_margins" as never).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Part[];
    },
  });

  const enriched = useMemo(() => parts.map(p => ({ ...p, ...computeMargin(p) })), [parts]);
  const customers = useMemo(() => Array.from(new Set(enriched.map(p => p.customer).filter(Boolean))) as string[], [enriched]);

  const filtered = useMemo(() => enriched.filter(p => {
    if (flagFilter !== "all" && p.flag !== flagFilter) return false;
    if (customerFilter !== "all" && p.customer !== customerFilter) return false;
    if (search && !`${p.part_number} ${p.description ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [enriched, flagFilter, customerFilter, search]);

  const totals = useMemo(() => {
    const negative = enriched.filter(p => p.flag === "negative");
    const leakage = negative.reduce((s, p) => s + p.annualMargin, 0);
    const totalMargin = enriched.reduce((s, p) => s + p.annualMargin, 0);
    const totalRevenue = enriched.reduce((s, p) => s + Number(p.price) * Number(p.annual_qty), 0);
    return {
      parts: enriched.length,
      negativePct: enriched.length ? negative.length / enriched.length : 0,
      leakage,
      totalMargin,
      totalRevenue,
    };
  }, [enriched]);

  const bottom20 = useMemo(() => enriched.filter(p => p.flag === "negative").sort((a, b) => a.annualMargin - b.annualMargin).slice(0, 20), [enriched]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("part_margins" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["part_margins"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Part-level margin analysis</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Aerospace shops often lose money on 10–20% of part numbers due to outdated quotes, high scrap, or unrecovered NRE. Surface negative-margin parts here.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Add part</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MiniStat label="Parts tracked" value={String(totals.parts)} />
        <MiniStat label="% negative-margin" value={pct(totals.negativePct)} accent={totals.negativePct > 0.1 ? "rose" : "emerald"} />
        <MiniStat label="Annual margin leakage" value={fmt(totals.leakage)} accent="rose" />
        <MiniStat label="Total annual revenue" value={fmt(totals.totalRevenue)} />
        <MiniStat label="Total annual margin" value={fmt(totals.totalMargin)} accent={totals.totalMargin < 0 ? "rose" : "emerald"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Search part…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
        <Select value={flagFilter} onValueChange={v => setFlagFilter(v as typeof flagFilter)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All parts</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="thin">Thin (&lt;10%)</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Customer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            {customers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Part #</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2 text-right">Qty/yr</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Unit cost</th>
              <th className="px-3 py-2 text-right">Unit margin</th>
              <th className="px-3 py-2 text-right">Margin %</th>
              <th className="px-3 py-2 text-right">Annual margin</th>
              <th className="px-3 py-2 text-center">Flag</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">No parts logged.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className={cn("border-t border-border hover:bg-muted/30", p.flag === "negative" && "bg-rose-50/30 dark:bg-rose-950/10")}>
                <td className="px-3 py-2">
                  <button className="font-mono font-medium hover:underline" onClick={() => { setEditing(p); setOpen(true); }}>{p.part_number}</button>
                  {p.description && <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>}
                </td>
                <td className="px-3 py-2 text-xs">{p.customer || "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(p.annual_qty).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(p.price), p.currency)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(p.unitCost, p.currency)}</td>
                <td className={cn("px-3 py-2 text-right tabular-nums", p.unitMargin < 0 ? "text-rose-600" : "text-emerald-600")}>{fmt(p.unitMargin, p.currency)}</td>
                <td className={cn("px-3 py-2 text-right tabular-nums", p.marginPct < 0 ? "text-rose-600" : "")}>{pct(p.marginPct)}</td>
                <td className={cn("px-3 py-2 text-right tabular-nums font-medium", p.annualMargin < 0 ? "text-rose-600" : "text-emerald-600")}>{fmt(p.annualMargin, p.currency)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                    p.flag === "negative" ? "bg-rose-500 text-white" :
                    p.flag === "thin" ? "bg-amber-400 text-amber-950" : "bg-emerald-500 text-white")}>{p.flag}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { confirmThen("Delete?", () => { remove.mutate(p.id); }) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bottom20.length > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50/40 p-4 dark:border-rose-800 dark:bg-rose-950/20">
          <h3 className="mb-2 text-sm font-semibold text-rose-800 dark:text-rose-300">Bottom 20 · negative-margin parts</h3>
          <ol className="space-y-1 text-sm">
            {bottom20.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between border-b border-rose-200/50 py-1 last:border-b-0 dark:border-rose-900/40">
                <span><span className="mr-2 text-xs text-muted-foreground">#{i + 1}</span><span className="font-mono">{p.part_number}</span> <span className="text-xs text-muted-foreground">{p.customer}</span></span>
                <span className="text-rose-600 font-medium tabular-nums">{fmt(p.annualMargin, p.currency)} / yr</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <PartDialog open={open} onOpenChange={setOpen} editing={editing} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["part_margins"] }); }} />
    </div>
  );
}

function PartDialog({ open, onOpenChange, editing, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; editing: Part | null; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Part>>({});
  useMemo(() => { if (open) setForm(editing ?? { currency: "USD", annual_qty: 0, price: 0, material_cost: 0, labor_cost: 0, overhead: 0, scrap_pct: 0, nre_recovery: 0 }); }, [open, editing]);
  const set = <K extends keyof Part>(k: K, v: Part[K]) => setForm(f => ({ ...f, [k]: v }));

  const preview = useMemo(() => computeMargin(form as Part), [form]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.part_number) throw new Error("Part number required");
      const payload = { ...form,
        annual_qty: Number(form.annual_qty ?? 0), price: Number(form.price ?? 0),
        material_cost: Number(form.material_cost ?? 0), labor_cost: Number(form.labor_cost ?? 0),
        overhead: Number(form.overhead ?? 0), scrap_pct: Number(form.scrap_pct ?? 0), nre_recovery: Number(form.nre_recovery ?? 0),
      };
      if (editing) {
        const { error } = await supabase.from("part_margins" as never).update(payload as never).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("part_margins" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(editing ? "Updated" : "Added"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Edit part" : "Add part"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Part number"><Input value={form.part_number ?? ""} onChange={e => set("part_number", e.target.value)} /></Field>
          <Field label="Customer"><Input value={form.customer ?? ""} onChange={e => set("customer", e.target.value)} /></Field>
          <Field label="Currency"><Input value={form.currency ?? "USD"} onChange={e => set("currency", e.target.value)} /></Field>
          <Field label="Description" full>
            <Textarea rows={2} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </Field>
          <Field label="Annual qty"><Input type="number" value={form.annual_qty ?? ""} onChange={e => set("annual_qty", Number(e.target.value) as Part["annual_qty"])} /></Field>
          <Field label="Price / unit"><Input type="number" value={form.price ?? ""} onChange={e => set("price", Number(e.target.value) as Part["price"])} /></Field>
          <Field label="Scrap %"><Input type="number" value={form.scrap_pct ?? ""} onChange={e => set("scrap_pct", Number(e.target.value) as Part["scrap_pct"])} /></Field>
          <Field label="Material cost"><Input type="number" value={form.material_cost ?? ""} onChange={e => set("material_cost", Number(e.target.value) as Part["material_cost"])} /></Field>
          <Field label="Labor cost"><Input type="number" value={form.labor_cost ?? ""} onChange={e => set("labor_cost", Number(e.target.value) as Part["labor_cost"])} /></Field>
          <Field label="Overhead"><Input type="number" value={form.overhead ?? ""} onChange={e => set("overhead", Number(e.target.value) as Part["overhead"])} /></Field>
          <Field label="NRE recovery / unit"><Input type="number" value={form.nre_recovery ?? ""} onChange={e => set("nre_recovery", Number(e.target.value) as Part["nre_recovery"])} /></Field>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <div className="grid grid-cols-4 gap-2">
            <div><div className="text-muted-foreground">Unit cost</div><div className="font-semibold tabular-nums">{fmt(preview.unitCost, form.currency ?? "USD")}</div></div>
            <div><div className="text-muted-foreground">Unit margin</div><div className={cn("font-semibold tabular-nums", preview.unitMargin < 0 ? "text-rose-600" : "text-emerald-600")}>{fmt(preview.unitMargin, form.currency ?? "USD")}</div></div>
            <div><div className="text-muted-foreground">Margin %</div><div className={cn("font-semibold tabular-nums", preview.marginPct < 0 ? "text-rose-600" : "")}>{pct(preview.marginPct)}</div></div>
            <div><div className="text-muted-foreground">Annual margin</div><div className={cn("font-semibold tabular-nums", preview.annualMargin < 0 ? "text-rose-600" : "text-emerald-600")}>{fmt(preview.annualMargin, form.currency ?? "USD")}</div></div>
          </div>
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
    <div className={cn("space-y-1", full && "col-span-3")}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "rose" }) {
  const tint = accent === "rose" ? "border-l-rose-500" : accent === "emerald" ? "border-l-emerald-500" : "border-l-primary";
  return (
    <div className={cn("rounded-lg border border-l-4 border-border bg-card p-3", tint)}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
