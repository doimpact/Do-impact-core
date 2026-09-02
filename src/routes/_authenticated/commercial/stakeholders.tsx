import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState, Fragment } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, Star, Users, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VocPanel } from "@/components/commercial/voc-panel";
import { cn } from "@/lib/utils";
import { ImportStakeholdersDialog } from "@/components/commercial/import-stakeholders-dialog";
import { AddStakeholderDialog } from "@/components/commercial/add-stakeholder-dialog";
import { RowActions } from "@/components/commercial/row-actions";
import { toast } from "sonner";


const INFLUENCE = ["low", "medium", "high"] as const;
const STRENGTH = ["weak", "neutral", "strong", "champion"] as const;
type Influence = typeof INFLUENCE[number];
type Strength = typeof STRENGTH[number];


export const Route = createFileRoute("/_authenticated/commercial/stakeholders")({
  head: () => ({
    meta: [
      { title: "Stakeholders & Voice of Customer — DO.Impact" },
      { name: "description", content: "Every contact across your accounts, plus the Voice of Customer board with NPS, themes and follow-ups." },
      { property: "og:title", content: "Stakeholders & Voice of Customer — DO.Impact" },
      { property: "og:description", content: "Filterable stakeholder list with influence matrix, and the Voice of Customer dashboard in the same place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StakeholdersPage,
});

type Contact = {
  id: string; name: string; title: string | null; email: string | null; phone: string | null;
  decision_role: string | null; influence: string | null; relationship_strength: string | null;
  is_primary: boolean; account_id: string; accounts: { id: string; name: string } | null;
  relationship_owner_id: string | null; owner: { display_name: string | null } | null;
  archived_at: string | null;
};

type SortKey = "name" | "account" | "title" | "influence" | "relationship_strength";
const ANY = "__any__";

function StakeholdersPage() {
  return (
    <Tabs defaultValue="stakeholders" className="space-y-4">
      <TabsList>
        <TabsTrigger value="stakeholders" className="gap-1.5"><Users className="h-4 w-4" /> Stakeholders</TabsTrigger>
        <TabsTrigger value="voc" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Voice of Customer</TabsTrigger>
      </TabsList>
      <TabsContent value="stakeholders">
        <StakeholdersList />
      </TabsContent>
      <TabsContent value="voc">
        <VocPanel />
      </TabsContent>
    </Tabs>
  );
}

function StakeholdersList() {
  const qc = useQueryClient();
  const { data: contacts } = useQuery({
    queryKey: ["stakeholders-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts")
        .select("id, name, title, email, phone, decision_role, influence, relationship_strength, is_primary, account_id, archived_at, accounts(id, name), relationship_owner_id, owner:profiles!contacts_relationship_owner_id_fkey(display_name)")
        .order("name");
      if (error) throw error;
      return (data as unknown as Contact[]) ?? [];
    },
  });

  const [q, setQ] = useState("");
  const [accountId, setAccountId] = useState<string>(ANY);
  const [role, setRole] = useState<string>(ANY);
  const [influence, setInfluence] = useState<string>(ANY);
  const [strength, setStrength] = useState<string>(ANY);
  const [owner, setOwner] = useState<string>(ANY);
  const [primaryOnly, setPrimaryOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<Contact | null>(null);


  const archive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("contacts")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.archived ? "Stakeholder archived" : "Stakeholder restored");
      qc.invalidateQueries({ queryKey: ["stakeholders-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stakeholder deleted");
      qc.invalidateQueries({ queryKey: ["stakeholders-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const options = useMemo(() => {
    const accounts = new Map<string, string>();
    const roles = new Set<string>();
    const inf = new Set<string>();
    const str = new Set<string>();
    const owners = new Map<string, string>();
    for (const c of contacts ?? []) {
      if (c.accounts) accounts.set(c.accounts.id, c.accounts.name);
      if (c.decision_role) roles.add(c.decision_role);
      if (c.influence) inf.add(c.influence);
      if (c.relationship_strength) str.add(c.relationship_strength);
      if (c.relationship_owner_id) owners.set(c.relationship_owner_id, c.owner?.display_name || "Unnamed");
    }
    return {
      accounts: [...accounts.entries()].sort((a, b) => a[1].localeCompare(b[1])),
      roles: [...roles].sort(),
      influences: [...inf].sort(),
      strengths: [...str].sort(),
      owners: [...owners.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    };
  }, [contacts]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = (contacts ?? []).filter((c) => {
      if (!showArchived && c.archived_at) return false;
      if (accountId !== ANY && c.account_id !== accountId) return false;
      if (role !== ANY && c.decision_role !== role) return false;
      if (influence !== ANY && c.influence !== influence) return false;
      if (strength !== ANY && c.relationship_strength !== strength) return false;
      if (owner !== ANY && c.relationship_owner_id !== owner) return false;
      if (primaryOnly && !c.is_primary) return false;
      if (term) {
        const hay = [c.name, c.title, c.email, c.accounts?.name].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const av = sortKey === "account" ? a.accounts?.name ?? "" : sortKey === "title" ? a.title ?? "" : sortKey === "influence" ? a.influence ?? "" : sortKey === "relationship_strength" ? a.relationship_strength ?? "" : a.name;
      const bv = sortKey === "account" ? b.accounts?.name ?? "" : sortKey === "title" ? b.title ?? "" : sortKey === "influence" ? b.influence ?? "" : sortKey === "relationship_strength" ? b.relationship_strength ?? "" : b.name;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  }, [contacts, q, accountId, role, influence, strength, owner, primaryOnly, showArchived, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }
  function resetFilters() {
    setQ(""); setAccountId(ANY); setRole(ANY); setInfluence(ANY); setStrength(ANY); setOwner(ANY); setPrimaryOnly(false); setShowArchived(false);
  }

  const activeCount = (contacts ?? []).filter((c) => !c.archived_at).length;
  const archivedCount = (contacts ?? []).filter((c) => c.archived_at).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Stakeholders</h1>
          <p className="text-sm text-muted-foreground">All contacts across every account, in one filterable list.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddStakeholderDialog />
          <ImportStakeholdersDialog />
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {filtered.length} / {activeCount} active
            {archivedCount > 0 && ` · ${archivedCount} archived`}
          </div>
        </div>
      </header>

      <Card>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, title, email, account…" className="pl-9" />
            </div>
            <FilterSelect label="Account" value={accountId} onChange={setAccountId} options={options.accounts} />
            <FilterSelect label="Decision role" value={role} onChange={setRole} options={options.roles.map((r) => [r, r] as [string, string])} />
            <FilterSelect label="Influence" value={influence} onChange={setInfluence} options={options.influences.map((r) => [r, r] as [string, string])} />
            <FilterSelect label="Relationship" value={strength} onChange={setStrength} options={options.strengths.map((r) => [r, r] as [string, string])} />
            <FilterSelect label="Owner" value={owner} onChange={setOwner} options={options.owners} />
            <div className="flex items-center gap-3">
              <Switch id="primary-only" checked={primaryOnly} onCheckedChange={setPrimaryOnly} />
              <Label htmlFor="primary-only" className="text-sm">Primary contacts only</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
              <Label htmlFor="show-archived" className="text-sm">Show archived</Label>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={resetFilters} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Reset filters</button>
          </div>
        </div>
      </Card>

      <InfluenceMatrix contacts={filtered} showArchived={showArchived} />

      <Card>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr className="text-left">
                <SortHeader label="Name" k="name" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Title" k="title" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Account" k="account" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <SortHeader label="Influence" k="influence" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Relationship" k="relationship_strength" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium w-12">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">No stakeholders match these filters.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className={cn("border-b last:border-0 hover:bg-muted/40", c.archived_at && "opacity-60 bg-muted/20")}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {c.is_primary && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                      <Link to="/commercial/accounts/$id" params={{ id: c.account_id }} className="font-medium hover:underline">{c.name}</Link>
                      {c.archived_at && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.title || "—"}</td>
                  <td className="px-3 py-2">
                    {c.accounts ? (<Link to="/commercial/accounts/$id" params={{ id: c.account_id }} className="hover:underline">{c.accounts.name}</Link>) : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground truncate max-w-[220px]">
                    {c.email ? <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a> : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-3 py-2">{c.decision_role ? <Badge variant="outline">{c.decision_role}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2">{c.influence ? <Badge variant="secondary">{c.influence}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2">{c.relationship_strength ? <Badge variant="secondary">{c.relationship_strength}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.owner?.display_name || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <RowActions
                      label={c.name}
                      archived={!!c.archived_at}
                      onEdit={() => setEditing(c)}
                      onArchiveToggle={(next) => archive.mutate({ id: c.id, archived: next })}
                      onDelete={() => remove.mutate(c.id)}
                      deleteDescription="This stakeholder and their touchpoints will be permanently removed."
                      size="sm"
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <AddStakeholderDialog record={editing} open onOpenChange={(v) => { if (!v) setEditing(null); }} />
      )}
    </div>

  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>All {label.toLowerCase()}</SelectItem>
        {options.map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}

function SortHeader({ label, k, active, dir, onSort }: {
  label: string; k: SortKey; active: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void;
}) {
  const isActive = active === k;
  return (
    <th className="px-3 py-2 font-medium">
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", isActive ? "text-foreground" : "text-muted-foreground")}>
        {label}
        <ArrowUpDown className={cn("w-3 h-3", isActive ? "opacity-100" : "opacity-40")} />
        {isActive && <span className="text-[9px] font-mono">{dir}</span>}
      </button>
    </th>
  );
}

function InfluenceMatrix({ contacts, showArchived }: { contacts: Contact[]; showArchived: boolean }) {
  const cells = useMemo(() => {
    const map = new Map<string, Contact[]>();
    for (const c of contacts) {
      if (!c.influence || !c.relationship_strength) continue;
      const key = `${c.influence}|${c.relationship_strength}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [contacts]);

  const accountRollup = useMemo(() => {
    const infWeight: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const strWeight: Record<string, number> = { weak: -1, neutral: 0, strong: 1, champion: 2 };
    const byAcct = new Map<string, { id: string; name: string; count: number; infScore: number; strScore: number; highCount: number; championCount: number }>();
    for (const c of contacts) {
      if (!c.accounts) continue;
      const cur = byAcct.get(c.accounts.id) ?? { id: c.accounts.id, name: c.accounts.name, count: 0, infScore: 0, strScore: 0, highCount: 0, championCount: 0 };
      cur.count += 1;
      cur.infScore += infWeight[c.influence ?? ""] ?? 0;
      cur.strScore += strWeight[c.relationship_strength ?? ""] ?? 0;
      if (c.influence === "high") cur.highCount += 1;
      if (c.relationship_strength === "champion") cur.championCount += 1;
      byAcct.set(c.accounts.id, cur);
    }
    return [...byAcct.values()]
      .map((a) => ({ ...a, avgInf: a.count ? a.infScore / a.count : 0, avgStr: a.count ? a.strScore / a.count : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  const uncategorized = contacts.filter((c) => !c.influence || !c.relationship_strength).length;
  const maxCell = Math.max(1, ...[...cells.values()].map((v) => v.length));

  function cellTone(inf: Influence, str: Strength) {
    if (inf === "high" && (str === "strong" || str === "champion")) return "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
    if (inf === "high" && str === "weak") return "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300";
    if (inf === "high") return "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300";
    if (inf === "medium" && str === "weak") return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
    if (inf === "medium" && (str === "strong" || str === "champion")) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
    return "bg-muted/40 border-border text-muted-foreground";
  }

  function acctDot(avgInf: number, avgStr: number) {
    if (avgInf >= 2.3 && avgStr >= 1) return "bg-emerald-500";
    if (avgInf >= 2.3 && avgStr <= 0) return "bg-red-500";
    if (avgInf >= 2) return "bg-amber-500";
    if (avgStr >= 1) return "bg-sky-500";
    return "bg-muted-foreground/50";
  }

  return (
    <Card>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest">Influence × Relationship map</h2>
            <p className="text-xs text-muted-foreground">Stakeholders positioned by influence (rows) and relationship strength (columns). Filtered set: {contacts.length}.</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> champion</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> at risk</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> blocker</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[560px] grid gap-2" style={{ gridTemplateColumns: `120px repeat(${STRENGTH.length}, minmax(0, 1fr))` }}>
            <div />
            {STRENGTH.map((s) => (
              <div key={s} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">{s}</div>
            ))}
            {[...INFLUENCE].slice().reverse().map((inf) => (
              <Fragment key={`row-${inf}`}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center">{inf} influence</div>

                {STRENGTH.map((str) => {
                  const items = cells.get(`${inf}|${str}`) ?? [];
                  const intensity = items.length / maxCell;
                  return (
                    <div key={`${inf}-${str}`} className={cn("relative rounded border p-2 min-h-[72px] transition-colors", cellTone(inf, str))} style={{ opacity: 0.55 + intensity * 0.45 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold leading-none">{items.length}</span>
                        {items.length > 0 && <span className="text-[9px] font-mono uppercase tracking-widest opacity-70">{new Set(items.map((i) => i.account_id)).size} acct</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {items.slice(0, 4).map((i) => (
                          <Link key={i.id} to="/commercial/accounts/$id" params={{ id: i.account_id }} className={cn("text-[10px] px-1.5 py-0.5 rounded bg-background/60 border hover:bg-background truncate max-w-[110px]", i.archived_at && "opacity-60 line-through")} title={`${i.name}${i.accounts ? ` — ${i.accounts.name}` : ""}`}>
                            {i.name.split(" ")[0]}
                          </Link>
                        ))}
                        {items.length > 4 && <span className="text-[10px] opacity-70">+{items.length - 4}</span>}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>

        {uncategorized > 0 && (
          <p className="text-[11px] text-muted-foreground">{uncategorized} stakeholder{uncategorized === 1 ? "" : "s"} not shown — missing influence or relationship values.</p>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Accounts by criticality</h3>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">avg influence · avg relationship</span>
          </div>
          {accountRollup.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts in current filter.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {accountRollup.slice(0, 12).map((a) => (
                <Link key={a.id} to="/commercial/accounts/$id" params={{ id: a.id }} className="flex items-center gap-3 rounded border p-2 hover:bg-muted/40">
                  <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", acctDot(a.avgInf, a.avgStr))} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {a.count} stakeholder{a.count === 1 ? "" : "s"} · {a.highCount} high-inf · {a.championCount} champion
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-muted-foreground">
                    <div>{a.avgInf.toFixed(1)}</div>
                    <div>{a.avgStr >= 0 ? "+" : ""}{a.avgStr.toFixed(1)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
