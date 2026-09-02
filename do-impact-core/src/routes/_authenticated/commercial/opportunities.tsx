import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfiles } from "@/components/owner-select";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, ChevronsUpDown, Plus, Search, Trash2, KanbanSquare, Building2, List as ListIcon, Archive } from "lucide-react";
import { RowActions } from "@/components/commercial/row-actions";

import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/csar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/commercial/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — DO.Impact" }] }),
  component: OpportunitiesPage,
});

const STAGES = ["prospect", "proposal", "won", "lost"] as const;
type Stage = (typeof STAGES)[number];
const STAGE_LABEL: Record<Stage, string> = { prospect: "Prospect", proposal: "Proposal", won: "Won", lost: "Lost" };
const DEFAULT_PROB: Record<Stage, number> = { prospect: 15, proposal: 60, won: 100, lost: 0 };

type MonthlyRow = { id?: string; year: number; month: number; amount: string };
type FormState = {
  account_id: string; name: string; stage: Stage; value: string; currency: string; probability: number;
  gross_margin_pct: string;
  expected_close_date: string; source: string; notes: string; owner_id: string; contact_id: string;
  monthly: MonthlyRow[];
};
const EMPTY_FORM: FormState = {
  account_id: "", name: "", stage: "prospect", value: "0", currency: "USD", probability: 15,
  gross_margin_pct: "",
  expected_close_date: "", source: "", notes: "", owner_id: "", contact_id: "", monthly: [],
};

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function OpportunitiesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: opps, isLoading } = useQuery({
    queryKey: ["opportunities", showArchived],
    queryFn: async () => {
      let query = supabase.from("opportunities")
        .select("*, accounts(name), contacts(name), owner:profiles!opportunities_owner_id_fkey(display_name)")
        .order("expected_close_date", { ascending: true, nullsFirst: false });
      if (!showArchived) query = query.eq("archived", false);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = (opps ?? []).filter((o: any) => {
    const s = q.toLowerCase();
    return !s || o.name.toLowerCase().includes(s) || (o.accounts?.name ?? "").toLowerCase().includes(s);
  });

  async function changeStage(id: string, stage: Stage) {
    const { error } = await supabase.from("opportunities").update({ stage, probability: DEFAULT_PROB[stage] }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  }
  async function setArchived(id: string, archived: boolean) {
    const { error } = await supabase.from("opportunities").update({ archived }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(archived ? "Opportunity archived" : "Opportunity restored");
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  }
  async function deleteOpp(id: string) {
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Opportunity deleted");
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  }

  const weighted = (opps ?? []).reduce(
    (n: number, o: any) => (o.stage === "lost" ? n : n + Number(o.value || 0) * (o.probability / 100)), 0
  );

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = filtered.filter((o: any) => o.stage === s);
    return acc;
  }, {} as Record<Stage, any[]>);

  const byAccount = filtered.reduce((acc: Record<string, { name: string; items: any[] }>, o: any) => {
    const key = o.account_id ?? "unknown";
    acc[key] ??= { name: o.accounts?.name ?? "—", items: [] };
    acc[key].items.push(o);
    return acc;
  }, {});
  const accountGroups = Object.entries(byAccount).sort((a, b) => a[1].name.localeCompare(b[1].name));

  const rowActions = (o: any) => (
    <>
      <Select value={o.stage} onValueChange={(v) => changeStage(o.id, v as Stage)}>
        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{STAGES.map((s) => (<SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>))}</SelectContent>
      </Select>
      <RowActions
        label={o.name}
        archived={!!o.archived}
        onEdit={() => setEditing(o)}
        onArchiveToggle={(next) => setArchived(o.id, next)}
        onDelete={() => deleteOpp(o.id)}
        deleteDescription="This opportunity will be permanently removed."
      />
    </>
  );


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Opportunities</h1>
          <p className="text-sm text-muted-foreground">Pipeline — {opps?.length ?? 0} open · weighted value {formatMoney(weighted)}</p>
        </div>
        <OpportunityDialog mode="create" trigger={<Button><Plus className="w-4 h-4 mr-1" /> New opportunity</Button>} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search opportunities or accounts…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Button type="button" variant={showArchived ? "default" : "outline"} size="sm" onClick={() => setShowArchived((v) => !v)}>
          <Archive className="w-4 h-4 mr-1.5" />
          {showArchived ? "Showing archived" : "Show archived"}
        </Button>
      </div>

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board"><KanbanSquare className="w-4 h-4 mr-1.5" /> Board</TabsTrigger>
          <TabsTrigger value="account"><Building2 className="w-4 h-4 mr-1.5" /> By account</TabsTrigger>
          <TabsTrigger value="list"><ListIcon className="w-4 h-4 mr-1.5" /> List</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {STAGES.map((s) => {
              const items = byStage[s] ?? [];
              const total = items.reduce((n, o) => n + Number(o.value || 0), 0);
              return (
                <div key={s} className="bg-muted/40 rounded-lg p-2 min-h-[320px] flex flex-col">
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide">{STAGE_LABEL[s]}</div>
                    <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground px-2 pb-2 border-b">{formatMoney(total)}</div>
                  <div className="space-y-2 mt-2 flex-1">
                    {items.map((o: any) => (
                      <Card key={o.id}>
                        <CardContent className="p-3 space-y-1.5">
                          <Link to="/commercial/accounts/$id" params={{ id: o.account_id }} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                            <Building2 className="w-3 h-3" />{o.accounts?.name ?? "—"}
                          </Link>
                          <div className="text-sm font-medium leading-snug">{o.name}</div>
                          <div className="text-sm font-semibold">{formatMoney(Number(o.value), o.currency)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {o.probability}%
                            {o.gross_margin_pct != null && <> · GM {Number(o.gross_margin_pct).toFixed(1)}%</>}
                            {" · "}{o.owner?.display_name ?? "no owner"}
                            {o.contacts?.name && <> · {o.contacts.name}</>}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <Select value={o.stage} onValueChange={(v) => changeStage(o.id, v as Stage)}>
                              <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue /></SelectTrigger>
                              <SelectContent>{STAGES.map((ss) => (<SelectItem key={ss} value={ss}>{STAGE_LABEL[ss]}</SelectItem>))}</SelectContent>
                            </Select>
                            <RowActions
                              label={o.name}
                              archived={!!o.archived}
                              onEdit={() => setEditing(o)}
                              onArchiveToggle={(next) => setArchived(o.id, next)}
                              onDelete={() => deleteOpp(o.id)}
                              deleteDescription="This opportunity will be permanently removed."
                              size="sm"
                            />

                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {items.length === 0 && (<div className="text-[11px] text-muted-foreground px-2 py-4 text-center">No opportunities</div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-4">
            {accountGroups.map(([accountId, group]) => {
              const total = group.items.reduce((n, o) => n + Number(o.value || 0), 0);
              const weightedG = group.items.reduce((n, o) => (o.stage === "lost" ? n : n + Number(o.value || 0) * (o.probability / 100)), 0);
              return (
                <Card key={accountId}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30 rounded-t-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Link to="/commercial/accounts/$id" params={{ id: accountId }} className="font-semibold truncate hover:underline">{group.name}</Link>
                      <Badge variant="secondary" className="ml-1">{group.items.length}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      <div>Total {formatMoney(total)}</div>
                      <div>Weighted {formatMoney(weightedG)}</div>
                    </div>
                  </div>
                  <ul className="divide-y">
                    {group.items.map((o: any) => (
                      <li key={o.id} className="p-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{o.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {STAGE_LABEL[o.stage as Stage]} · {o.probability}%
                            {o.expected_close_date && <> · close {o.expected_close_date}</>}
                            <> · owner {o.owner?.display_name ?? "—"}</>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold w-24 text-right">{formatMoney(Number(o.value), o.currency)}</div>
                          {rowActions(o)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {filtered.map((o: any) => (
                  <li key={o.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <Link to="/commercial/accounts/$id" params={{ id: o.account_id }} className="inline-flex items-center gap-1 hover:underline">
                          <Building2 className="w-3 h-3" />{o.accounts?.name ?? "—"}
                        </Link>
                        {o.expected_close_date && <> · close {o.expected_close_date}</>}
                        {o.source && <> · {o.source}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{o.probability}%</Badge>
                      {o.gross_margin_pct != null && <Badge variant="outline">GM {Number(o.gross_margin_pct).toFixed(1)}%</Badge>}
                      <div className="text-sm font-semibold w-24 text-right">{formatMoney(Number(o.value), o.currency)}</div>
                      {rowActions(o)}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editing && (
        <OpportunityDialog mode="edit" record={editing} open onOpenChange={(v) => { if (!v) setEditing(null); }} />
      )}
    </div>
  );
}

function OwnerCombobox({ value, onChange, members }: {
  value: string; onChange: (id: string) => void; members: { id: string; display_name: string | null }[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const selected = members?.find((m) => m.id === value);
  const label = selected?.display_name ?? (selected ? selected.id.slice(0, 8) : "");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          <span className={cn(!label && "text-muted-foreground")}>{label || "Type an owner name…"}</span>
          <ChevronsUpDown className="w-4 h-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search owner…" />
          <CommandList>
            <CommandEmpty>No teammate found.</CommandEmpty>
            <CommandGroup>
              {(members ?? []).map((m) => {
                const name = m.display_name ?? m.id.slice(0, 8);
                return (
                  <CommandItem key={m.id} value={name} onSelect={() => { onChange(m.id); setOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4", value === m.id ? "opacity-100" : "opacity-0")} />
                    {name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function OpportunityDialog({ mode, record, trigger, open: openProp, onOpenChange }: {
  mode: "create" | "edit"; record?: any; trigger?: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp! : internalOpen;
  const setOpen = (v: boolean) => { isControlled ? onOpenChange?.(v) : setInternalOpen(v); };

  const initial: FormState = useMemo(() => {
    if (mode === "edit" && record) {
      return {
        account_id: record.account_id ?? "", name: record.name ?? "",
        stage: (record.stage as Stage) ?? "prospect", value: String(record.value ?? "0"),
        currency: record.currency ?? "USD", probability: Number(record.probability ?? 0),
        gross_margin_pct: record.gross_margin_pct != null ? String(record.gross_margin_pct) : "",
        expected_close_date: record.expected_close_date ?? "", source: record.source ?? "",
        notes: record.notes ?? "", owner_id: record.owner_id ?? "", contact_id: record.contact_id ?? "",
        monthly: [],
      };
    }
    return EMPTY_FORM;
  }, [mode, record]);

  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial); }, [initial, open]);

  const { data: accounts } = useQuery({
    queryKey: ["accounts-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("id, name, archived_at").order("name");
      if (error) throw error;

      return data;
    },
  });
  const { data: members } = useProfiles();

  const { data: contacts } = useQuery({
    queryKey: ["contacts-min", form.account_id],
    enabled: !!form.account_id,
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts")
        .select("id, name, email").eq("account_id", form.account_id).order("is_primary", { ascending: false }).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: monthlyExisting } = useQuery({
    queryKey: ["opp-monthly", record?.id],
    enabled: mode === "edit" && !!record?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunity_monthly_values")
        .select("id, year, month, amount").eq("opportunity_id", record.id).order("year").order("month");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (mode === "edit" && monthlyExisting) {
      setForm((f) => ({ ...f, monthly: monthlyExisting.map((r) => ({ id: r.id, year: r.year, month: r.month, amount: String(r.amount) })) }));
    }
  }, [monthlyExisting, mode]);

  useEffect(() => {
    if (!form.contact_id) return;
    if (contacts && !contacts.some((c) => c.id === form.contact_id)) {
      setForm((f) => ({ ...f, contact_id: "" }));
    }
  }, [contacts, form.contact_id]);

  useEffect(() => {
    if (mode !== "create" || !open || form.owner_id) return;
    getCurrentUser().then(({ data }) => {
      if (data.user?.id) setForm((f) => (f.owner_id ? f : { ...f, owner_id: data.user!.id }));
    });
  }, [open, mode, form.owner_id]);

  function setStage(stage: Stage) { setForm((f) => ({ ...f, stage, probability: DEFAULT_PROB[stage] })); }

  const monthlyTotal = form.monthly.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const usesMonthly = form.monthly.length > 0;

  function addMonthlyRow() {
    const now = new Date();
    const last = form.monthly[form.monthly.length - 1];
    let y = last?.year ?? now.getFullYear();
    let m = (last?.month ?? now.getMonth()) + 1;
    if (m > 12) { m = 1; y += 1; }
    setForm((f) => ({ ...f, monthly: [...f.monthly, { year: y, month: m, amount: "0" }] }));
  }
  function updateMonthlyRow(i: number, patch: Partial<MonthlyRow>) {
    setForm((f) => ({ ...f, monthly: f.monthly.map((r, idx) => idx === i ? { ...r, ...patch } : r) }));
  }
  function removeMonthlyRow(i: number) {
    setForm((f) => ({ ...f, monthly: f.monthly.filter((_, idx) => idx !== i) }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.account_id) return toast.error("Pick an account");
    if (!form.owner_id) return toast.error("Pick an owner");
    setSaving(true);
    const effectiveValue = usesMonthly ? monthlyTotal : (Number(form.value) || 0);
    const payload = {
      account_id: form.account_id, name: form.name, stage: form.stage,
      value: effectiveValue, currency: form.currency || "USD",
      probability: Math.max(0, Math.min(100, Number(form.probability) || 0)),
      gross_margin_pct: form.gross_margin_pct === "" ? null : Math.max(-100, Math.min(100, Number(form.gross_margin_pct))),
      expected_close_date: form.expected_close_date || null,
      source: form.source || null, notes: form.notes || null,
      owner_id: form.owner_id, contact_id: form.contact_id || null,
    };
    const { data: saved, error } = mode === "edit"
      ? await supabase.from("opportunities").update(payload).eq("id", record.id).select("id").single()
      : await supabase.from("opportunities").insert(payload).select("id").single();
    if (error || !saved) { setSaving(false); return toast.error(error?.message ?? "Save failed"); }

    const oppId = saved.id;
    // Sync monthly rows: delete removed, upsert others
    if (mode === "edit") {
      const keepIds = form.monthly.map((r) => r.id).filter(Boolean) as string[];
      const existingIds = (monthlyExisting ?? []).map((r) => r.id);
      const toDelete = existingIds.filter((id) => !keepIds.includes(id));
      if (toDelete.length) await supabase.from("opportunity_monthly_values").delete().in("id", toDelete);
    }
    if (form.monthly.length) {
      const rows = form.monthly.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        opportunity_id: oppId,
        year: Number(r.year), month: Number(r.month), amount: Number(r.amount) || 0,
      }));
      const { error: mErr } = await supabase.from("opportunity_monthly_values").upsert(rows, { onConflict: "opportunity_id,year,month" });
      if (mErr) { setSaving(false); return toast.error(mErr.message); }
    }

    setSaving(false);
    toast.success(mode === "edit" ? "Opportunity updated" : "Opportunity created");
    setOpen(false);
    if (mode === "create") setForm(EMPTY_FORM);
    qc.invalidateQueries({ queryKey: ["opportunities"] });
    qc.invalidateQueries({ queryKey: ["opps-for-plan"] });
    qc.invalidateQueries({ queryKey: ["opp-monthly"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{mode === "edit" ? "Edit opportunity" : "New opportunity"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Account *</Label>
            <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v, contact_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>{(accounts ?? []).filter((a) => !a.archived_at || a.id === form.account_id).map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setStage(v as Stage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => (<SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Probability %</Label>
              <Input type="number" min={0} max={100} value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Value{usesMonthly && <span className="text-muted-foreground font-normal"> (from monthly)</span>}</Label>
              <Input type="number" step="0.01" value={usesMonthly ? String(monthlyTotal) : form.value}
                disabled={usesMonthly}
                onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gross margin %</Label>
              <Input type="number" step="0.1" min={-100} max={100} placeholder="e.g. 32" value={form.gross_margin_pct}
                onChange={(e) => setForm({ ...form, gross_margin_pct: e.target.value })} />
            </div>
            <div>
              <Label>Gross margin value</Label>
              <Input readOnly disabled value={
                form.gross_margin_pct === "" ? "—" :
                formatMoney((usesMonthly ? monthlyTotal : Number(form.value) || 0) * (Number(form.gross_margin_pct) / 100), form.currency)
              } />
            </div>
          </div>


          <div className="rounded-md border p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Monthly breakdown</Label>
                <div className="text-[11px] text-muted-foreground">Optional — split the value across specific months. If set, overrides the fixed value.</div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addMonthlyRow}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add month
              </Button>
            </div>
            {form.monthly.length > 0 && (
              <div className="space-y-1.5">
                {form.monthly.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={String(r.month)} onValueChange={(v) => updateMonthlyRow(i, { month: Number(v) })}>
                      <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTHS_SHORT.map((m, idx) => (<SelectItem key={idx} value={String(idx + 1)}>{m}</SelectItem>))}</SelectContent>
                    </Select>
                    <Input type="number" className="h-8 w-24 text-xs" value={r.year}
                      onChange={(e) => updateMonthlyRow(i, { year: Number(e.target.value) })} />
                    <Input type="number" step="0.01" className="h-8 flex-1 text-xs" placeholder="Amount" value={r.amount}
                      onChange={(e) => updateMonthlyRow(i, { amount: e.target.value })} />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMonthlyRow(i)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="text-xs text-right text-muted-foreground pt-1 border-t">
                  Total: <span className="font-semibold text-foreground">{formatMoney(monthlyTotal, form.currency)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Expected close</Label><Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} /></div>
            <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
          </div>
          <div>
            <Label>Owner *</Label>
            <OwnerCombobox value={form.owner_id} onChange={(id) => setForm({ ...form, owner_id: id })} members={members} />
          </div>
          <div>
            <Label>Contact person</Label>
            <Select value={form.contact_id || "__none__"} onValueChange={(v) => setForm({ ...form, contact_id: v === "__none__" ? "" : v })} disabled={!form.account_id}>
              <SelectTrigger><SelectValue placeholder={form.account_id ? "Select a contact" : "Pick an account first"} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No contact</SelectItem>
                {(contacts ?? []).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}{c.email ? ` · ${c.email}` : ""}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
