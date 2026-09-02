import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeRichText } from "@/lib/sanitize-html";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Search, FileDown, Save, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { RichEditor } from "@/components/RichEditor";
import { INTERACTION_TYPES, INTERACTION_LABEL, STAGE_LABEL, STAGES, formatMoney, TIER_LABEL, TIER_BADGE_CLASS, type AccountTier, type InteractionType, type QuoteStatus } from "@/lib/csar";
import { format } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import { QuotePDF } from "@/components/QuotePDF";
import { StakeholderPanel } from "@/components/StakeholderPanel";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/commercial/accounts/$id")({
  head: () => ({ meta: [{ title: "Account — DO.Impact" }] }),
  component: AccountDetail,
});

function AccountDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: account } = useQuery({
    queryKey: ["account", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <Link to="/commercial/accounts" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> All accounts
        </Link>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <h1 className="text-2xl font-semibold">{account?.name ?? "…"}</h1>
          {account?.tier && (
            <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${TIER_BADGE_CLASS[account.tier as AccountTier]}`}>
              {TIER_LABEL[account.tier as AccountTier]}
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {account?.industry ?? "—"}{account?.website && ` · ${account.website}`}
        </div>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="contacts" className="gap-1.5"><Users className="w-4 h-4" /> Stakeholders</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {account && <Overview account={account} onSaved={() => qc.invalidateQueries({ queryKey: ["account", id] })} />}
        </TabsContent>
        <TabsContent value="contacts"><StakeholderPanel accountId={id} /></TabsContent>
        <TabsContent value="timeline"><Timeline accountId={id} /></TabsContent>
        <TabsContent value="quotes"><Quotes accountId={id} accountName={account?.name ?? ""} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview({ account, onSaved }: { account: any; onSaved: () => void }) {
  const [f, setF] = useState({
    name: account.name ?? "", industry: account.industry ?? "", website: account.website ?? "",
    address: account.address ?? "", notes: account.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    const { error } = await supabase.from("accounts").update(f).eq("id", account.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  }
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Industry"><Input value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} /></Field>
          <Field label="Website"><Input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
          <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        </div>
        <Field label="Notes"><Textarea rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}

function Timeline({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<InteractionType | "all">("all");

  const { data: items } = useQuery({
    queryKey: ["interactions", accountId, search, typeFilter],
    queryFn: async () => {
      let query = supabase.from("interactions")
        .select("id, type, subject, body, occurred_at, contact_id, contacts(name)")
        .eq("account_id", accountId).order("occurred_at", { ascending: false }).limit(200);
      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      if (search.trim()) {
        query = query.textSearch("search_vector", search.trim().split(/\s+/).join(" & "), { type: "websearch" });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const [type, setType] = useState<InteractionType>("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function post() {
    if (!subject.trim() && !body.trim()) return toast.error("Add a subject or note");
    setPosting(true);
    const { data: u } = await getCurrentUser();
    const { error } = await supabase.from("interactions").insert({
      account_id: accountId, type, subject: subject || null, body, author_id: u.user?.id ?? null,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setSubject(""); setBody("");
    qc.invalidateQueries({ queryKey: ["interactions", accountId] });
  }
  async function remove(id: string) {
    if (!(await confirmDialog("Delete this entry?"))) return;
    const { error } = await supabase.from("interactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["interactions", accountId] });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{INTERACTION_TYPES.map((t) => (<SelectItem key={t} value={t}>{INTERACTION_LABEL[t]}</SelectItem>))}</SelectContent>
            </Select>
            <Input placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 min-w-[200px]" />
          </div>
          <RichEditor value={body} onChange={setBody} placeholder="What happened?" />
          <div className="flex justify-end">
            <Button onClick={post} disabled={posting}>{posting ? "Logging…" : "Log entry"}</Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search this timeline…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as InteractionType | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {INTERACTION_TYPES.map((t) => (<SelectItem key={t} value={t}>{INTERACTION_LABEL[t]}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {(items ?? []).length === 0 && (<div className="text-sm text-muted-foreground text-center py-8">No interactions yet.</div>)}
        {(items ?? []).map((it) => (
          <Card key={it.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">{it.type}</Badge>
                  <span className="text-sm font-medium">{it.subject || "(no subject)"}</span>
                  {(it.contacts as unknown as { name: string } | null)?.name && (
                    <span className="text-xs text-muted-foreground">with {(it.contacts as unknown as { name: string }).name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(it.occurred_at), "MMM d, yyyy · HH:mm")}</span>
                  <button onClick={() => remove(it.id)} className="hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {it.body && (<div className="text-sm mt-2 text-foreground/90" dangerouslySetInnerHTML={{ __html: sanitizeRichText(it.body) }} />)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Quotes({ accountId, accountName }: { accountId: string; accountName: string }) {
  const qc = useQueryClient();
  const { data: quotes } = useQuery({
    queryKey: ["quotes", accountId],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*").eq("account_id", accountId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: primaryContact } = useQuery({
    queryKey: ["primary-contact", accountId],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("name, email").eq("account_id", accountId).eq("is_primary", true).maybeSingle();
      return data;
    },
  });
  const { data: account } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      const { data } = await supabase.from("accounts").select("*").eq("id", accountId).single();
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const empty = { title: "", amount: "0", currency: "USD", status: "draft" as QuoteStatus, expected_close_date: "", delivery_date: "", notes: "" };
  const [f, setF] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  function edit(q: any) {
    setEditingId(q.id);
    setF({
      title: q.title, amount: String(q.amount), currency: q.currency, status: q.status,
      expected_close_date: q.expected_close_date ?? "", delivery_date: q.delivery_date ?? "", notes: q.notes ?? "",
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: f.title, amount: Number(f.amount) || 0, currency: f.currency, status: f.status,
      expected_close_date: f.expected_close_date || null, delivery_date: f.delivery_date || null, notes: f.notes || null,
    };
    if (editingId) {
      const { error } = await supabase.from("quotes").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
    } else {
      const { data: u } = await getCurrentUser();
      const { error } = await supabase.from("quotes").insert({ ...payload, account_id: accountId, owner_id: u.user?.id ?? null });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setOpen(false); setEditingId(null); setF(empty);
    qc.invalidateQueries({ queryKey: ["quotes", accountId] });
  }

  async function exportPDF(q: any) {
    const { data: u } = await getCurrentUser();
    const { data: prof } = u.user ? await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle() : { data: null };
    const blob = await pdf(
      <QuotePDF quote={q} account={account ?? { name: accountName, address: null }} contact={primaryContact ?? null} preparedBy={prof?.display_name || u.user?.email || ""} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${q.number || "quote"}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <div className="text-sm text-muted-foreground">{quotes?.length ?? 0} quote(s)</div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setF(empty); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New quote</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingId ? "Edit quote" : "New quote"}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <Field label="Title *"><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Amount"><Input type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
                  <Field label="Currency"><Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} /></Field>
                  <Field label="Stage">
                    <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as QuoteStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map((s) => (<SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>))}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expected close"><Input type="date" value={f.expected_close_date} onChange={(e) => setF({ ...f, expected_close_date: e.target.value })} /></Field>
                  <Field label="Delivery / revenue date"><Input type="date" value={f.delivery_date} onChange={(e) => setF({ ...f, delivery_date: e.target.value })} /></Field>
                </div>
                <Field label="Notes"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
                <DialogFooter><Button type="submit">Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <ul className="divide-y">
          {(quotes ?? []).length === 0 && (<li className="p-6 text-sm text-muted-foreground text-center">No quotes yet.</li>)}
          {(quotes ?? []).map((q) => (
            <li key={q.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{q.title}</span>
                  <Badge variant="secondary">{STAGE_LABEL[q.status as QuoteStatus]}</Badge>
                  <span className="text-xs text-muted-foreground">{q.number}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatMoney(Number(q.amount), q.currency)}
                  {q.delivery_date && ` · delivery ${format(new Date(q.delivery_date), "MMM yyyy")}`}
                  {q.expected_close_date && ` · close ${format(new Date(q.expected_close_date), "MMM d")}`}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => exportPDF(q)}><FileDown className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => edit(q)}>Edit</Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
