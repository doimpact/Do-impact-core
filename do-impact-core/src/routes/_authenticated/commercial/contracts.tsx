import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/csar";
import { ReviewsTab } from "@/components/commercial/contract-review/reviews-tab";
import { RegistersTab } from "@/components/commercial/contract-review/registers-tab";
import { ContractReviewProcessGuide } from "@/components/commercial/contract-review/process-guide";

export const Route = createFileRoute("/_authenticated/commercial/contracts")({
  head: () => ({ meta: [{ title: "Contracts — DO.Impact" }] }),
  component: ContractsPage,
});

const STATUSES = ["draft", "active", "expired", "terminated", "renewed"] as const;
type ContractStatus = (typeof STATUSES)[number];
const STATUS_LABEL: Record<ContractStatus, string> = { draft: "Draft", active: "Active", expired: "Expired", terminated: "Terminated", renewed: "Renewed" };
const STATUS_VARIANT: Record<ContractStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary", active: "default", expired: "outline", terminated: "destructive", renewed: "default",
};

function ContractsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <p className="text-sm text-muted-foreground">Signed agreements, plus the bid and contract review that got you there.</p>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="flex flex-wrap h-auto" data-tour="contracts-tabs">
          <TabsTrigger value="contracts" data-tour="contracts-tab-contracts">Contracts</TabsTrigger>
          <TabsTrigger value="review" data-tour="contracts-tab-review">Bid &amp; contract review</TabsTrigger>
          <TabsTrigger value="registers" data-tour="contracts-tab-registers">Registers</TabsTrigger>
          <TabsTrigger value="process" data-tour="contracts-tab-process">Process &amp; governance</TabsTrigger>
        </TabsList>
        <TabsContent value="contracts" className="mt-4"><div data-tour="contracts-list"><ContractsList /></div></TabsContent>
        <TabsContent value="review" className="mt-4"><div data-tour="contracts-review"><ReviewsTab /></div></TabsContent>
        <TabsContent value="registers" className="mt-4"><div data-tour="contracts-registers"><RegistersTab /></div></TabsContent>
        <TabsContent value="process" className="mt-4"><ContractReviewProcessGuide /></TabsContent>
      </Tabs>
    </div>
  );
}

function ContractsList() {
  const [q, setQ] = useState("");
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*, accounts(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (contracts ?? []).filter((c: any) => {
    const s = q.toLowerCase();
    return !s || c.title.toLowerCase().includes(s) || (c.contract_number ?? "").toLowerCase().includes(s) || (c.accounts?.name ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Signed and in-flight customer agreements.</p>
        <NewContractDialog />
      </div>


      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by title, number or account…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">{contracts?.length === 0 ? "No contracts yet." : "No matches."}</div>
          )}
          <ul className="divide-y">
            {filtered.map((c: any) => (
              <li key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.title}</span>
                    <Badge variant={STATUS_VARIANT[c.status as ContractStatus]}>{STATUS_LABEL[c.status as ContractStatus]}</Badge>
                    {c.contract_number && <span className="text-xs text-muted-foreground">#{c.contract_number}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <Link to="/commercial/accounts/$id" params={{ id: c.account_id }} className="hover:underline">{c.accounts?.name ?? "—"}</Link>
                    {c.start_date && <> · {c.start_date}</>}
                    {c.end_date && <> → {c.end_date}</>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">{formatMoney(Number(c.value), c.currency)}</div>
                  {c.document_url && (
                    <a href={c.document_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function NewContractDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_id: "", title: "", contract_number: "", status: "draft" as ContractStatus,
    value: "0", currency: "USD", start_date: "", end_date: "", signed_date: "", document_url: "", notes: "",
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.account_id) return toast.error("Pick an account");
    setSaving(true);
    const { data: u } = await getCurrentUser();
    const { error } = await supabase.from("contracts").insert({
      account_id: form.account_id, title: form.title, contract_number: form.contract_number || null,
      status: form.status, value: Number(form.value) || 0, currency: form.currency || "USD",
      start_date: form.start_date || null, end_date: form.end_date || null, signed_date: form.signed_date || null,
      document_url: form.document_url || null, notes: form.notes || null, owner_id: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Contract created");
    setOpen(false);
    setForm({ account_id: "", title: "", contract_number: "", status: "draft", value: "0", currency: "USD", start_date: "", end_date: "", signed_date: "", document_url: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["contracts"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> New contract</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New contract</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label>Account *</Label>
            <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>{(accounts ?? []).map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contract #</Label><Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => (<SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Value</Label><Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Start</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>End</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div><Label>Signed</Label><Input type="date" value={form.signed_date} onChange={(e) => setForm({ ...form, signed_date: e.target.value })} /></div>
          </div>
          <div><Label>Document URL</Label><Input placeholder="https://…" value={form.document_url} onChange={(e) => setForm({ ...form, document_url: e.target.value })} /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
