import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { assertWrote } from "@/lib/write-guard";
import { RowActions } from "@/components/commercial/row-actions";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfiles } from "@/components/owner-select";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Plus, Search, Upload, Users } from "lucide-react";

import { toast } from "sonner";
import { TIERS, TIER_LABEL, TIER_DESCRIPTION, TIER_BADGE_CLASS, type AccountTier } from "@/lib/csar";
import { ImportDialog, type ImportColumn } from "@/components/ImportDialog";

const ACCOUNT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name", required: true, example: "Acme Aerospace" },
  { key: "industry", example: "Aerospace" },
  { key: "website", example: "acme.com" },
  { key: "address", example: "1 Main St, Seattle" },
  { key: "tier", example: "tier_1" },
  { key: "notes", example: "" },
];

function normalizeTier(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).trim().toLowerCase().replace(/[\s-]/g, "_");
  if (["tier_1", "1", "t1"].includes(s)) return "tier_1";
  if (["tier_2", "2", "t2"].includes(s)) return "tier_2";
  if (["tier_3", "3", "t3"].includes(s)) return "tier_3";
  return "__invalid__";
}

export const Route = createFileRoute("/_authenticated/commercial/accounts/")({
  head: () => ({ meta: [{ title: "Accounts — DO.Impact" }] }),
  component: AccountsPage,
});

type AccountForm = { name: string; industry: string; website: string; address: string; notes: string; owner_id: string; tier: string };
const EMPTY: AccountForm = { name: "", industry: "", website: "", address: "", notes: "", owner_id: "", tier: "" };

function AccountsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | AccountTier | "untiered">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts")
        .select("id, name, industry, website, address, notes, owner_id, tier, archived_at, updated_at, owner:profiles!accounts_owner_id_fkey(display_name), contacts(count)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (accounts ?? []).filter((a) => {
    if (!showArchived && a.archived_at) return false;
    const matchesQ = a.name.toLowerCase().includes(q.toLowerCase()) || (a.industry ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesTier = tierFilter === "all" || (tierFilter === "untiered" ? !a.tier : a.tier === tierFilter);
    return matchesQ && matchesTier;
  });

  
  const archivedCount = (accounts ?? []).filter((a) => a.archived_at).length;

  async function setArchived(a: any, archived: boolean) {
    const { data, error } = await supabase.from("accounts")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", a.id)
      .select("id");
    if (error) return toast.error(error.message);
    try { assertWrote(data, archived ? "archive" : "restore"); } catch (e: any) { return toast.error(e.message); }
    toast.success(archived ? "Account archived" : "Account restored");
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["accounts-min"] });
  }

  async function remove(a: any) {
    const { error } = await supabase.from("accounts").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Account deleted");
    qc.invalidateQueries({ queryKey: ["accounts"] });
    qc.invalidateQueries({ queryKey: ["accounts-min"] });
  }


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-muted-foreground">Companies you sell to.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportDialog
            trigger={<Button variant="outline" className="gap-1.5"><Upload className="w-4 h-4" /> Import Excel</Button>}
            title="Import accounts from Excel"
            entity="accounts"
            templateName="accounts-template.xlsx"
            columns={ACCOUNT_IMPORT_COLUMNS}
            parseRow={(raw) => {
              const errors: string[] = [];
              const name = String(raw.name ?? "").trim();
              if (!name) errors.push("name is required");
              const tier = normalizeTier(raw.tier);
              if (tier === "__invalid__") errors.push("tier must be tier_1/tier_2/tier_3");
              const dupWarn = (accounts ?? []).some((a) => a.name.toLowerCase() === name.toLowerCase())
                ? "duplicate of existing account" : undefined;
              return {
                data: errors.length ? null : {
                  name,
                  industry: String(raw.industry ?? "") || null,
                  website: String(raw.website ?? "") || null,
                  address: String(raw.address ?? "") || null,
                  tier: tier === "__invalid__" ? null : tier,
                  notes: String(raw.notes ?? "") || null,
                },
                errors, warning: dupWarn,
              };
            }}
            onImport={async (rows) => {
              const { data: u } = await getCurrentUser();
              if (!u.user) throw new Error("Not signed in");
              const withOwner = rows.map((r) => ({ ...r, owner_id: u.user!.id }));
              let inserted = 0;
              for (let i = 0; i < withOwner.length; i += 100) {
                const batch = withOwner.slice(i, i + 100);
                const { error, count } = await supabase.from("accounts").insert(batch, { count: "exact" });
                if (error) throw error;
                inserted += count ?? batch.length;
              }
              qc.invalidateQueries({ queryKey: ["accounts"] });
              return { inserted, failed: 0 };
            }}
          />
          <AccountDialog mode="create" trigger={<Button><Plus className="w-4 h-4 mr-1" /> New account</Button>} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or industry…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", ...TIERS, "untiered"] as const).map((t) => {
            const active = tierFilter === t;
            const label = t === "all" ? "All" : t === "untiered" ? "Untiered" : `${TIER_LABEL[t]} — ${TIER_DESCRIPTION[t]}`;
            return (
              <Button key={t} type="button" size="sm" variant={active ? "default" : "outline"} onClick={() => setTierFilter(t)}>{label}</Button>
            );
          })}
          <Button
            type="button"
            size="sm"
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? `Showing archived (${archivedCount})` : `Show archived (${archivedCount})`}
          </Button>
        </div>

      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {accounts?.length === 0 ? "No accounts yet. Create your first one." : "No matches."}
            </div>
          )}
          <ul className="divide-y">
            {filtered.map((a) => (
              <li key={a.id} className={`flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors ${a.archived_at ? "opacity-60 bg-muted/20" : ""}`}>
                <Link to="/commercial/accounts/$id" params={{ id: a.id }} className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      <span className="truncate">{a.name}</span>
                      {a.tier && (
                        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${TIER_BADGE_CLASS[a.tier as AccountTier]}`}>
                          {TIER_LABEL[a.tier as AccountTier]}
                        </span>
                      )}
                      {a.archived_at && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Archived</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.industry || "—"} {a.website && `· ${a.website}`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0">
                    <div>Owner: {(a as any).owner?.display_name ?? "—"}</div>
                    <div>Updated {new Date(a.updated_at).toLocaleDateString()}</div>
                  </div>
                </Link>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link to="/commercial/accounts/$id" params={{ id: a.id }}>
                    <Users className="w-4 h-4" /> Stakeholders ({(a as any).contacts?.[0]?.count ?? 0})
                  </Link>
                </Button>
                <RowActions
                  label={a.name}
                  archived={!!a.archived_at}
                  onOpen={() => navigate({ to: "/commercial/accounts/$id", params: { id: a.id } })}
                  onEdit={() => setEditing(a)}
                  onArchiveToggle={(next) => setArchived(a, next)}
                  onDelete={() => remove(a)}
                  deleteDescription={`"${a.name}" and everything under it will be permanently removed.`}
                />
              </li>
            ))}

          </ul>
        </CardContent>
      </Card>

      {editing && (
        <AccountDialog mode="edit" record={editing} open onOpenChange={(v) => { if (!v) setEditing(null); }} />
      )}
    </div>
  );
}

function AccountDialog({ mode, record, trigger, open: openProp, onOpenChange }: {
  mode: "create" | "edit"; record?: any; trigger?: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp! : internalOpen;
  const setOpen = (v: boolean) => { isControlled ? onOpenChange?.(v) : setInternalOpen(v); };

  const initial: AccountForm = useMemo(() => {
    if (mode === "edit" && record) {
      return {
        name: record.name ?? "", industry: record.industry ?? "", website: record.website ?? "",
        address: record.address ?? "", notes: record.notes ?? "", owner_id: record.owner_id ?? "", tier: record.tier ?? "",
      };
    }
    return EMPTY;
  }, [mode, record]);

  const [form, setForm] = useState<AccountForm>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial); }, [initial, open]);

  const { data: members } = useProfiles();


  useEffect(() => {
    if (mode !== "create" || !open || form.owner_id) return;
    getCurrentUser().then(({ data }) => {
      if (data.user?.id) setForm((f) => (f.owner_id ? f : { ...f, owner_id: data.user!.id }));
    });
  }, [open, mode, form.owner_id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.owner_id) return toast.error("Pick an owner.");
    setSaving(true);
    const payload = {
      name: form.name, industry: form.industry || null, website: form.website || null,
      address: form.address || null, notes: form.notes || null, owner_id: form.owner_id, tier: form.tier || null,
    };
    const { error } = mode === "edit"
      ? await supabase.from("accounts").update(payload).eq("id", record.id)
      : await supabase.from("accounts").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(mode === "edit" ? "Account updated" : "Account created");
    setOpen(false);
    if (mode === "create") setForm(EMPTY);
    qc.invalidateQueries({ queryKey: ["accounts"] });
    if (mode === "edit") qc.invalidateQueries({ queryKey: ["account", record.id] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "edit" ? "Edit account" : "New account"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div>
            <Label>Owner *</Label>
            <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
              <SelectContent>
                {(members ?? []).map((m) => (<SelectItem key={m.id} value={m.id}>{m.display_name ?? m.id.slice(0, 8)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tier</Label>
            <Select value={form.tier || "none"} onValueChange={(v) => setForm({ ...form, tier: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Untiered" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Untiered</SelectItem>
                {TIERS.map((t) => (<SelectItem key={t} value={t}>{TIER_LABEL[t]} — {TIER_DESCRIPTION[t]}</SelectItem>))}
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
