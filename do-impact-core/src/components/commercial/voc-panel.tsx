import { getCurrentUser } from "@/lib/auth-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ThumbsUp, AlertTriangle, MessageSquare, TrendingUp, Tag, ListChecks, Trophy, CheckSquare, SlidersHorizontal, X, Archive, Building2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { RowActions } from "@/components/commercial/row-actions";
import { assertWrote } from "@/lib/write-guard";

type Note = {
  id: string;
  account_id: string | null;
  kind: "works_well" | "can_improve";
  position: number;
  content: string;
  archived_at: string | null;
};

type Account = { id: string; name: string };
type Interaction = { id: string; account_id: string | null; occurred_at: string | null; type: string | null; subject: string | null; body_text: string | null; accounts: { name: string } | null };
type Opportunity = { id: string; account_id: string | null; name: string | null; stage: string | null; updated_at: string | null; accounts: { name: string } | null };
type VocMetric = { id: string; account_id: string | null; period: string; nps: number | null; csat: number | null; note: string | null; archived_at: string | null };
type VocTask = { id: string; account_id: string | null; title: string; owner_id: string | null; due_date: string | null; status: string; position: number; archived_at: string | null };

/** Scope values: every item, company-wide only, or one customer's id. */
const ALL = "__all__";
const COMPANY = "__company__";

/** The account a NEW item should be linked to for the current scope. */
const scopeAccount = (scope: string) => (scope === ALL || scope === COMPANY ? null : scope);

/** Apply the scope to a Supabase query on a nullable account_id column. */
function applyScope<T>(q: T, scope: string): T {
  const query = q as any;
  if (scope === ALL) return query;
  if (scope === COMPANY) return query.is("account_id", null);
  return query.eq("account_id", scope);
}

const TILES = [
  { key: "voc.tile.nps", label: "NPS / CSAT" },
  { key: "voc.tile.themes", label: "Top themes" },
  { key: "voc.tile.winrate", label: "Win rate (90d)" },
  { key: "voc.tile.followups", label: "Open follow-ups" },
] as const;

const db = supabase as unknown as { from: (t: string) => any };

const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

/** Small "Company-wide" / customer-name label shown in the All items view. */
function ScopeBadge({ accountId, accounts, className = "" }: {
  accountId: string | null;
  accounts: Account[];
  className?: string;
}) {
  const name = accountId ? accounts.find((a) => a.id === accountId)?.name ?? "Unknown customer" : null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
        name ? "bg-sky-100 text-sky-800" : "bg-muted text-muted-foreground"
      } ${className}`}
    >
      {name ? <Building2 className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
      {name ?? "Company-wide"}
    </span>
  );
}

/** Picks the customer an item belongs to; null means company-wide. */
function AccountPicker({ value, onChange, accounts, className }: {
  value: string | null;
  onChange: (v: string | null) => void;
  accounts: Account[];
  className?: string;
}) {
  return (
    <Select value={value ?? COMPANY} onValueChange={(v) => onChange(v === COMPANY ? null : v)}>
      <SelectTrigger className={className}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={COMPANY}>Company-wide</SelectItem>
        {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/** Dialog used when creating/moving an item while no single customer is in scope. */
function LinkDialog({ open, onOpenChange, accounts, initial, title, description, confirmLabel, onConfirm }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: Account[];
  initial: string | null;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (accountId: string | null) => void;
}) {
  const [val, setVal] = useState<string | null>(initial);
  useEffect(() => { if (open) setVal(initial); }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs">Customer</Label>
          <AccountPicker value={val} onChange={setVal} accounts={accounts} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(val); onOpenChange(false); }}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function tasksQuery(scope: string) {
  return {
    queryKey: ["voc-tasks", scope] as const,
    queryFn: async () => {
      const q = applyScope(
        db.from("voc_tasks").select("id,account_id,title,owner_id,due_date,status,position,archived_at").order("position"),
        scope,
      );
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as VocTask[];
    },
  };
}


export function VocPanel() {
  const qc = useQueryClient();
  const [scope, setScope] = useState<string>(ALL);
  const [theme, setTheme] = useState<string | null>(null);
  const [npsOpen, setNpsOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { isEnabled, setEnabled } = useUserPreferences();

  /** Customer a new item defaults to (null = company-wide). */
  const defaultAccount = scopeAccount(scope);
  /** Only the "All items" view mixes scopes, so that is where labels help. */
  const showLabels = scope === ALL;

  const { data: accounts = [] } = useQuery({
    queryKey: ["voc-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });

  const { data: allNotes = [] } = useQuery({
    queryKey: ["voc-notes", scope],
    queryFn: async () => {
      const q = applyScope(
        db.from("voc_notes").select("id,account_id,kind,position,content,archived_at").order("position"),
        scope,
      );
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const notes = useMemo(
    () => (showArchived ? allNotes : allNotes.filter((n) => !n.archived_at)),
    [allNotes, showArchived],
  );

  const { data: interactions = [] } = useQuery({
    queryKey: ["voc-interactions", scope],
    // Interactions always belong to a customer, so the company-wide view has none.
    enabled: scope !== COMPANY,
    queryFn: async () => {
      let q = supabase.from("interactions")
        .select("id,account_id,occurred_at,type,subject,body_text,accounts(name)")
        .order("occurred_at", { ascending: false }).limit(8);
      if (scope !== ALL) q = q.eq("account_id", scope);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Interaction[];
    },
  });

  const { data: opps = [] } = useQuery({
    queryKey: ["voc-opps", scope],
    queryFn: async () => {
      let q = supabase.from("opportunities").select("id,account_id,name,stage,updated_at,accounts(name)");
      if (scope !== ALL && scope !== COMPANY) q = q.eq("account_id", scope);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Opportunity[];
    },
  });

  const { data: tasks = [] } = useQuery(tasksQuery(scope));

  const works = notes.filter((n) => n.kind === "works_well");
  const improve = notes.filter((n) => n.kind === "can_improve");

  const liveNotes = useMemo(() => allNotes.filter((n) => !n.archived_at), [allNotes]);
  const themes = useMemo(() => topThemes(liveNotes), [liveNotes]);
  const winRate = useMemo(() => computeWinRate(opps), [opps]);
  const openTasks = tasks.filter((t) => !t.archived_at && t.status !== "done").length;
  const archivedCount =
    allNotes.filter((n) => n.archived_at).length + tasks.filter((t) => t.archived_at).length;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["voc-notes", scope] });

  const goToTasks = () => {
    if (typeof document === "undefined") return;
    document.getElementById("voc-tasks")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.getElementById("voc-task-title")?.focus(), 400);
  };

  const visible = TILES.filter((t) => isEnabled(t.key));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Voice of Customer</h2>
          <p className="text-muted-foreground mt-1">
            Capture what customers value and what to improve — every item is either linked to a customer or kept company-wide.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex items-center gap-2 pb-2">
            <Switch id="voc-archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="voc-archived" className="text-xs text-muted-foreground cursor-pointer">
              Show archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
            </Label>
          </div>
          <div className="min-w-[240px]">
            <label className="text-xs text-muted-foreground mb-1 block">Scope</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All items</SelectItem>
                <SelectItem value={COMPANY}>Company-wide only</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>


      {/* Dashboard tiles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">Dashboard</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Customize
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="text-xs font-medium mb-2">Show tiles</div>
              <div className="space-y-2">
                {TILES.map((t) => (
                  <div key={t.key} className="flex items-center gap-2">
                    <Checkbox
                      id={t.key}
                      checked={isEnabled(t.key)}
                      onCheckedChange={(v) => setEnabled(t.key, v === true)}
                    />
                    <Label htmlFor={t.key} className="text-sm font-normal cursor-pointer">{t.label}</Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground italic">
            All tiles hidden — use Customize to bring them back.
          </div>
        ) : (
          <div className={`grid gap-4 md:grid-cols-2 ${visible.length >= 4 ? "lg:grid-cols-4" : visible.length === 3 ? "lg:grid-cols-3" : ""}`}>
            {isEnabled("voc.tile.nps") && (
              <TileNps
                scope={scope}
                accounts={accounts}
                open={npsOpen}
                setOpen={setNpsOpen}
                showArchived={showArchived}
              />
            )}

            {isEnabled("voc.tile.themes") && (
              <Tile icon={Tag} label="Top themes" value={themes.length ? `${themes.length}` : "—"}>
                {themes.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">Add bullets to surface themes.</div>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {themes.slice(0, 6).map((t) => (
                      <button
                        key={t.word}
                        onClick={() => setTheme(theme === t.word ? null : t.word)}
                        className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                          theme === t.word
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {t.word} ×{t.count}
                      </button>
                    ))}
                  </div>
                )}
              </Tile>
            )}

            {isEnabled("voc.tile.winrate") && (
              <Tile icon={Trophy} label="Win rate (90d)" value={winRate.label} onClick={() => setWinOpen(true)}>
                <div className="text-xs text-muted-foreground">
                  {winRate.won + winRate.lost === 0 ? "No closed deals in the last 90 days" : `${winRate.won} won · ${winRate.lost} lost`}
                </div>
              </Tile>
            )}

            {isEnabled("voc.tile.followups") && (
              <Tile icon={ListChecks} label="Open follow-ups" value={`${openTasks}`} onClick={goToTasks}>
                <div className="text-xs text-muted-foreground">
                  {openTasks === 0 ? "Click to add a follow-up." : "Click to jump to the task list."}
                </div>
              </Tile>
            )}
          </div>
        )}
      </div>

      {theme && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Filtering bullets by</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-primary-foreground">
            {theme}
            <button onClick={() => setTheme(null)} aria-label="Clear theme filter"><X className="h-3 w-3" /></button>
          </span>
        </div>
      )}

      {/* Core two-column notes */}
      <div className="grid gap-4 md:grid-cols-2">
        <NotesColumn
          title="Works well"
          tone="good"
          defaultAccount={defaultAccount}
          askOnAdd={showLabels}
          showLabels={showLabels}
          accounts={accounts}
          kind="works_well"
          notes={works}
          filter={theme}
          onChange={invalidate}
        />
        <NotesColumn
          title="Can be improved"
          tone="warn"
          defaultAccount={defaultAccount}
          askOnAdd={showLabels}
          showLabels={showLabels}
          accounts={accounts}
          kind="can_improve"
          notes={improve}
          filter={theme}
          onChange={invalidate}
        />
      </div>

      {/* Tasks / follow-ups */}
      <VocTasks
        scope={scope}
        defaultAccount={defaultAccount}
        showLabels={showLabels}
        accounts={accounts}
        showArchived={showArchived}
      />

      {/* Recent interactions */}
      <VocInteractions
        scope={scope}
        accounts={accounts}
        interactions={interactions}
        showLabels={showLabels}
        onChange={() => qc.invalidateQueries({ queryKey: ["voc-interactions"] })}
      />

      <WinRateDialog open={winOpen} onOpenChange={setWinOpen} opps={opps} />
    </div>
  );
}

function Tile({ icon: Icon, label, value, children, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const Wrapper: any = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { onClick, type: "button" } : {})}
      className={`rounded-lg border bg-card p-4 text-left w-full ${onClick ? "cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all" : ""}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="mt-2">{children}</div>
    </Wrapper>
  );
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(period: string) {
  return new Date(period).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function TileNps({ scope, accounts, open, setOpen, showArchived }: {
  scope: string;
  accounts: Account[];
  open: boolean;
  setOpen: (v: boolean) => void;
  showArchived: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<VocMetric | null>(null);
  const [period, setPeriod] = useState(monthKey());
  const [nps, setNps] = useState("");
  const [csat, setCsat] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState<string | null>(scopeAccount(scope));
  const showLabels = scope === ALL;

  const { data: allMetrics = [] } = useQuery({
    queryKey: ["voc-metrics", scope],
    queryFn: async () => {
      const q = applyScope(
        db.from("voc_metrics").select("id,account_id,period,nps,csat,note,archived_at").order("period", { ascending: false }),
        scope,
      );
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as VocMetric[];
    },
  });

  const metrics = useMemo(() => allMetrics.filter((m) => !m.archived_at), [allMetrics]);
  const shown = showArchived ? allMetrics : metrics;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["voc-metrics", scope] });

  const latest = metrics[0];
  const previous = metrics[1];
  const delta = latest?.nps != null && previous?.nps != null ? Number(latest.nps) - Number(previous.nps) : null;

  const saveMut = useMutation({
    mutationFn: async () => {
      const p = `${period}-01`;
      const npsVal = nps.trim() === "" ? null : Number(nps);
      const csatVal = csat.trim() === "" ? null : Number(csat);
      if (npsVal === null && csatVal === null) throw new Error("Enter an NPS or CSAT score");
      if (npsVal !== null && Number.isNaN(npsVal)) throw new Error("NPS must be a number");
      if (csatVal !== null && Number.isNaN(csatVal)) throw new Error("CSAT must be a number");

      const existing = editing ?? allMetrics.find((m) => m.period === p && m.account_id === target);
      if (existing) {
        const { data, error } = await db.from("voc_metrics")
          .update({ period: p, nps: npsVal, csat: csatVal, note: note.trim() || null, account_id: target })
          .eq("id", existing.id)
          .select("id");
        if (error) throw error;
        assertWrote(data, "update");
      } else {
        const { data, error } = await db.from("voc_metrics")
          .insert({ account_id: target, period: p, nps: npsVal, csat: csatVal, note: note.trim() || null })
          .select("id");
        if (error) throw error;
        assertWrote(data, "create");
      }
    },
    onSuccess: () => {
      toast.success("Score saved");
      setOpen(false);
      setEditing(null);
      setNote("");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Failed to save")),
  });

  const archiveMut = useMutation({
    mutationFn: async (v: { id: string; next: boolean }) => {
      const { data, error } = await db.from("voc_metrics")
        .update({ archived_at: v.next ? new Date().toISOString() : null })
        .eq("id", v.id)
        .select("id");
      if (error) throw error;
      assertWrote(data, "archive");
    },
    onSuccess: (_d, v) => { toast.success(v.next ? "Score archived" : "Score restored"); invalidate(); },
    onError: (e) => toast.error(errMsg(e, "Failed to archive")),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("voc_metrics").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => { toast.success("Score deleted"); invalidate(); },
    onError: (e) => toast.error(errMsg(e, "Failed to delete")),
  });

  const openDialog = () => {
    const p = monthKey();
    const acct = scopeAccount(scope);
    const existing = metrics.find((m) => m.period === `${p}-01` && m.account_id === acct);
    setEditing(existing ?? null);
    setTarget(existing ? existing.account_id : acct);
    setPeriod(p);
    setNps(existing?.nps != null ? String(existing.nps) : "");
    setCsat(existing?.csat != null ? String(existing.csat) : "");
    setNote(existing?.note ?? "");
    setOpen(true);
  };

  const editRow = (m: VocMetric) => {
    setEditing(m);
    setTarget(m.account_id);
    setPeriod(m.period.slice(0, 7));
    setNps(m.nps != null ? String(m.nps) : "");
    setCsat(m.csat != null ? String(m.csat) : "");
    setNote(m.note ?? "");
    setOpen(true);
  };

  return (
    <>
      <Tile
        icon={TrendingUp}
        label="NPS / CSAT"
        value={latest?.nps != null ? String(latest.nps) : latest?.csat != null ? String(latest.csat) : "—"}
        onClick={openDialog}
      >
        <div className="text-xs text-muted-foreground">
          {latest
            ? `${periodLabel(latest.period)}${delta != null ? ` · ${delta > 0 ? "+" : ""}${delta} vs prior` : ""}`
            : "Click to record this period's score."}
        </div>
      </Tile>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit score" : "Record NPS / CSAT"}</DialogTitle>
            <DialogDescription>
              Scores are saved per month, either for one customer or company-wide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Customer</Label>
                <AccountPicker value={target} onChange={setTarget} accounts={accounts} />
              </div>
              <div>
                <Label className="text-xs">Period</Label>
                <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">NPS (-100 to 100)</Label>
                <Input value={nps} onChange={(e) => setNps(e.target.value)} placeholder="e.g. 42" inputMode="numeric" />
              </div>
              <div>
                <Label className="text-xs">CSAT (%)</Label>
                <Input value={csat} onChange={(e) => setCsat(e.target.value)} placeholder="e.g. 87" inputMode="numeric" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What drove the score?" />
            </div>

            {shown.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium mb-1">History</div>
                <ul className="divide-y max-h-52 overflow-y-auto">
                  {shown.map((m) => (
                    <li key={m.id} className="py-1.5 flex items-center gap-2 text-sm">
                      <span className="w-24 shrink-0">{periodLabel(m.period)}</span>
                      <span className="flex-1 text-xs text-muted-foreground truncate">
                        {m.nps != null ? `NPS ${m.nps}` : ""}{m.nps != null && m.csat != null ? " · " : ""}
                        {m.csat != null ? `CSAT ${m.csat}%` : ""}
                        {m.note ? ` — ${m.note}` : ""}
                      </span>
                      {showLabels && <ScopeBadge accountId={m.account_id} accounts={accounts} />}
                      {m.archived_at && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <Archive className="h-3 w-3" /> Archived
                        </span>
                      )}
                      <RowActions
                        size="sm"
                        label={periodLabel(m.period)}
                        archived={!!m.archived_at}
                        onEdit={() => editRow(m)}
                        onArchiveToggle={(next) => archiveMut.mutate({ id: m.id, next })}
                        onDelete={() => deleteMut.mutate(m.id)}
                        deleteDescription="This score entry will be removed permanently."
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save score</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WinRateDialog({ open, onOpenChange, opps }: { open: boolean; onOpenChange: (v: boolean) => void; opps: Opportunity[] }) {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const rows = opps.filter((o) => {
    const t = o.updated_at ? new Date(o.updated_at).getTime() : 0;
    if (t < cutoff) return false;
    return ["won", "closed_won", "lost", "closed_lost"].includes(o.stage ?? "");
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Win rate breakdown (last 90 days)</DialogTitle>
          <DialogDescription>Closed opportunities that make up the win-rate figure.</DialogDescription>
        </DialogHeader>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-4">
            No opportunities were won or lost in the last 90 days.
          </div>
        ) : (
          <ul className="divide-y max-h-80 overflow-y-auto">
            {rows.map((o) => {
              const won = (o.stage ?? "").includes("won");
              return (
                <li key={o.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.name ?? "(untitled)"}</div>
                    <div className="text-xs text-muted-foreground truncate">{o.accounts?.name ?? "—"}</div>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${won ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    {won ? "Won" : "Lost"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotesColumn({ title, tone, defaultAccount, askOnAdd, showLabels, accounts, kind, notes, filter, onChange }: {
  title: string;
  tone: "good" | "warn";
  defaultAccount: string | null;
  askOnAdd: boolean;
  showLabels: boolean;
  accounts: Account[];
  kind: "works_well" | "can_improve";
  notes: Note[];
  filter: string | null;
  onChange: () => void;
}) {
  const [askOpen, setAskOpen] = useState(false);
  const live = notes.filter((n) => !n.archived_at);
  const addMut = useMutation({
    mutationFn: async (accountId: string | null) => {
      if (live.length >= 5) throw new Error("Max 5 bullets");
      const position = notes.length;
      const { data, error } = await db.from("voc_notes").insert({
        account_id: accountId, kind, position, content: "",
      }).select("id");
      if (error) throw error;
      assertWrote(data, "create");
    },
    onSuccess: onChange,
    onError: (e) => toast.error(errMsg(e, "Failed to add")),
  });

  const accent = tone === "good" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60";
  const chip = tone === "good" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
  const Icon = tone === "good" ? ThumbsUp : AlertTriangle;

  const shown = filter
    ? notes.filter((n) => n.content.toLowerCase().includes(filter.toLowerCase()))
    : notes;

  return (
    <div className={`rounded-lg border ${accent} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold ${chip}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          disabled={live.length >= 5 || addMut.isPending}
          onClick={() => (askOnAdd ? setAskOpen(true) : addMut.mutate(defaultAccount))}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      {shown.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-4 text-center">
          {filter ? "No bullets match this theme." : "No bullets yet. Click Add to capture 3–5 points."}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((n) => (
            <NoteRow key={n.id} note={n} accounts={accounts} showLabels={showLabels} onChange={onChange} />
          ))}
        </ul>
      )}
      {live.length >= 5 && (<div className="mt-2 text-[11px] text-muted-foreground">Max 5 bullets.</div>)}

      <LinkDialog
        open={askOpen}
        onOpenChange={setAskOpen}
        accounts={accounts}
        initial={defaultAccount}
        title="Add bullet"
        description="Is this feedback about one customer, or company-wide?"
        confirmLabel="Add bullet"
        onConfirm={(acct) => addMut.mutate(acct)}
      />
    </div>
  );
}

function NoteRow({ note, accounts, showLabels, onChange }: {
  note: Note;
  accounts: Account[];
  showLabels: boolean;
  onChange: () => void;
}) {
  const [val, setVal] = useState(note.content);
  const [linkOpen, setLinkOpen] = useState(false);
  useEffect(() => { setVal(note.content); }, [note.content]);

  const linkMut = useMutation({
    mutationFn: async (accountId: string | null) => {
      const { data, error } = await db.from("voc_notes").update({ account_id: accountId }).eq("id", note.id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: () => { toast.success("Link updated"); onChange(); },
    onError: (e) => toast.error(errMsg(e, "Failed to update link")),
  });


  const updateMut = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await db.from("voc_notes").update({ content }).eq("id", note.id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: onChange,
    onError: (e) => { setVal(note.content); toast.error(errMsg(e, "Failed to save")); },
  });
  const archiveMut = useMutation({
    mutationFn: async (next: boolean) => {
      const { data, error } = await db.from("voc_notes")
        .update({ archived_at: next ? new Date().toISOString() : null })
        .eq("id", note.id)
        .select("id");
      if (error) throw error;
      assertWrote(data, "archive");
    },
    onSuccess: (_d, next) => { toast.success(next ? "Bullet archived" : "Bullet restored"); onChange(); },
    onError: (e) => toast.error(errMsg(e, "Failed to archive")),
  });
  const deleteMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.from("voc_notes").delete().eq("id", note.id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => { toast.success("Bullet deleted"); onChange(); },
    onError: (e) => toast.error(errMsg(e, "Failed to delete")),
  });

  return (
    <li className={`flex items-start gap-2 group ${note.archived_at ? "opacity-60" : ""}`}>
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { if (val !== note.content) updateMut.mutate(val); }}
        rows={1}
        disabled={!!note.archived_at}
        placeholder="Type a bullet…"
        className="flex-1 resize-none bg-transparent text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-300 rounded px-1 py-0.5 disabled:cursor-not-allowed"
      />
      {showLabels && <ScopeBadge accountId={note.account_id} accounts={accounts} className="mt-1.5" />}
      {note.archived_at && (
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 shrink-0">
          <Archive className="h-3 w-3" /> Archived
        </span>
      )}
      <RowActions
        size="sm"
        label={note.content.trim() || "bullet"}
        archived={!!note.archived_at}
        onEdit={() => setLinkOpen(true)}
        onArchiveToggle={(next) => archiveMut.mutate(next)}
        onDelete={() => deleteMut.mutate()}
        deleteDescription="This bullet will be removed permanently."
      />
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        accounts={accounts}
        initial={note.account_id}
        title="Link bullet"
        description="Choose the customer this bullet is about, or keep it company-wide."
        confirmLabel="Save link"
        onConfirm={(acct) => linkMut.mutate(acct)}
      />
    </li>
  );
}

// --- Tasks / follow-ups ---

const TASK_STATUS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const;

function VocTasks({ scope, defaultAccount, showLabels, accounts, showArchived }: {
  scope: string;
  defaultAccount: string | null;
  showLabels: boolean;
  accounts: Account[];
  showArchived: boolean;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState<string | null>(defaultAccount);
  const [editing, setEditing] = useState<VocTask | null>(null);
  const { data: profiles = [] } = useProfiles();
  const pmap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  useEffect(() => { setNewAccount(defaultAccount); }, [defaultAccount]);

  const { data: allTasks = [] } = useQuery(tasksQuery(scope));
  const tasks = showArchived ? allTasks : allTasks.filter((t) => !t.archived_at);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["voc-tasks", scope] });

  const addMut = useMutation({
    mutationFn: async () => {
      const t = title.trim();
      if (!t) throw new Error("Enter a task title");
      const { data, error } = await db.from("voc_tasks").insert({
        account_id: newAccount, title: t, due_date: due || null, owner_id: ownerId, position: allTasks.length,
      }).select("id");
      if (error) throw error;
      assertWrote(data, "create");
    },
    onSuccess: () => { setTitle(""); setDue(""); setOwnerId(null); setNewAccount(defaultAccount); invalidate(); },
    onError: (e) => toast.error(errMsg(e, "Failed to add task")),
  });

  const patchMut = useMutation({
    mutationFn: async (v: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await db.from("voc_tasks").update(v.patch).eq("id", v.id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e, "Failed to update task")),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("voc_tasks").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => { toast.success("Task deleted"); invalidate(); },
    onError: (e) => toast.error(errMsg(e, "Failed to delete")),
  });

  return (
    <div id="voc-tasks" className="rounded-lg border p-4 scroll-mt-24">
      <div className="flex items-center gap-2 mb-3">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Tasks &amp; follow-ups</h2>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Input
          id="voc-task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addMut.mutate(); }}
          placeholder="New task…"
          className="flex-1 min-w-[200px]"
        />
        <div className="w-48"><AccountPicker value={newAccount} onChange={setNewAccount} accounts={accounts} /></div>
        <div className="w-48"><OwnerSelect value={ownerId} onChange={setOwnerId} placeholder="Owner" /></div>
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
        <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add task
        </Button>
      </div>
      {tasks.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-3">No tasks yet.</div>
      ) : (
        <ul className="divide-y">
          {tasks.map((t) => (
            <li key={t.id} className={`py-2 flex flex-wrap items-center gap-x-3 gap-y-2 ${t.archived_at ? "opacity-60" : ""}`}>
              <input
                type="checkbox"
                checked={t.status === "done"}
                disabled={!!t.archived_at}
                onChange={() => patchMut.mutate({ id: t.id, patch: { status: t.status === "done" ? "open" : "done" } })}
                className="h-4 w-4"
                aria-label={`Mark ${t.title} done`}
              />
              <div className={`min-w-0 flex-1 basis-full text-sm sm:basis-auto ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                {t.title}
                {t.status === "in_progress" && (
                  <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-800">In progress</span>
                )}
                {t.archived_at && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Archive className="h-3 w-3" /> Archived
                  </span>
                )}
                {showLabels && <ScopeBadge accountId={t.account_id} accounts={accounts} className="ml-2" />}
              </div>
              <div className="w-40 shrink-0">
                <OwnerSelect
                  value={t.owner_id}
                  onChange={(v) => patchMut.mutate({ id: t.id, patch: { owner_id: v } })}
                  placeholder={ownerLabel(t.owner_id ? pmap.get(t.owner_id) : undefined)}
                />
              </div>
              <div className="text-xs text-muted-foreground shrink-0 w-24 text-right">
                {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
              </div>
              <RowActions
                size="sm"
                label={t.title}
                archived={!!t.archived_at}
                onEdit={() => setEditing(t)}
                onArchiveToggle={(next) =>
                  patchMut.mutate(
                    { id: t.id, patch: { archived_at: next ? new Date().toISOString() : null } },
                    { onSuccess: () => toast.success(next ? "Task archived" : "Task restored") },
                  )
                }
                onDelete={() => deleteMut.mutate(t.id)}
                deleteDescription="This follow-up task will be removed permanently."
              />
            </li>
          ))}
        </ul>
      )}

      <TaskEditDialog
        task={editing}
        accounts={accounts}
        onClose={() => setEditing(null)}
        onSave={(patch) =>
          patchMut.mutate(
            { id: editing!.id, patch },
            { onSuccess: () => { toast.success("Task updated"); setEditing(null); } },
          )
        }
      />
    </div>
  );
}

function TaskEditDialog({ task, accounts, onClose, onSave }: {
  task: VocTask | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [status, setStatus] = useState("open");
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDue(task.due_date ?? "");
    setOwnerId(task.owner_id);
    setStatus(task.status);
    setAccount(task.account_id);
  }, [task]);


  return (
    <Dialog open={!!task} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit follow-up</DialogTitle>
          <DialogDescription>Update the task title, owner, due date or status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Owner</Label>
              <OwnerSelect value={ownerId} onChange={setOwnerId} placeholder="Owner" />
            </div>
            <div>
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Customer</Label>
              <AccountPicker value={account} onChange={setAccount} accounts={accounts} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              const t = title.trim();
              if (!t) { toast.error("Enter a task title"); return; }
              onSave({ title: t, due_date: due || null, owner_id: ownerId, status, account_id: account });
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- helpers ---
const STOP = new Set(["the","a","an","and","or","but","of","to","in","for","on","with","is","are","was","were","be","by","as","at","it","this","that","we","they","our","their","from","not","no","have","has","had","do","does","did","so","if","then","than","too","very","can","cannot","could","should","would","will","just","also","more","most","some","any","all","one","two","three","new","use","using","used"]);
function topThemes(notes: Note[]): { word: string; count: number }[] {
  const freq = new Map<string, number>();
  for (const n of notes) {
    for (const raw of n.content.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length < 4 || STOP.has(raw)) continue;
      freq.set(raw, (freq.get(raw) ?? 0) + 1);
    }
  }
  return [...freq.entries()].map(([word, count]) => ({ word, count }))
    .filter((e) => e.count > 1).sort((a, b) => b.count - a.count);
}

function computeWinRate(opps: Opportunity[]): { won: number; lost: number; label: string } {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  let won = 0, lost = 0;
  for (const o of opps) {
    const t = o.updated_at ? new Date(o.updated_at).getTime() : 0;
    if (t < cutoff) continue;
    if (o.stage === "won" || o.stage === "closed_won") won++;
    else if (o.stage === "lost" || o.stage === "closed_lost") lost++;
  }
  const total = won + lost;
  const label = total === 0 ? "—" : `${Math.round((won / total) * 100)}%`;
  return { won, lost, label };
}

// --- Recent interactions ---

const INTERACTION_TYPES = ["call", "email", "meeting", "note", "update"] as const;

function VocInteractions({ scope, accounts, interactions, showLabels, onChange }: {
  scope: string;
  accounts: Account[];
  interactions: Interaction[];
  showLabels: boolean;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(scopeAccount(scope));
  const [type, setType] = useState<string>("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => { setAccount(scopeAccount(scope)); }, [scope]);

  const logMut = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Pick the customer this interaction was with");
      if (!subject.trim() && !body.trim()) throw new Error("Add a subject or note");
      const { data: u } = await getCurrentUser();
      const { data, error } = await db.from("interactions").insert({
        account_id: account, type, subject: subject.trim() || null, body, author_id: u.user?.id ?? null,
      }).select("id");
      if (error) throw error;
      assertWrote(data, "create");
    },
    onSuccess: () => {
      toast.success("Interaction logged");
      setSubject(""); setBody(""); setOpen(false);
      onChange();
    },
    onError: (e) => toast.error(errMsg(e, "Failed to log interaction")),
  });

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Recent interactions</h2>
        </div>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Log interaction
        </Button>
      </div>

      {scope === COMPANY ? (
        <div className="text-xs text-muted-foreground italic py-3">
          Interactions always belong to a customer, so there are none in the company-wide view.
        </div>
      ) : interactions.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-3">No interactions logged yet.</div>
      ) : (
        <ul className="divide-y">
          {interactions.map((i) => (
            <li key={i.id} className="py-2 flex items-start gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-24 shrink-0">
                {i.occurred_at ? new Date(i.occurred_at).toLocaleDateString() : "—"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate">{i.subject || i.body_text || "(no subject)"}</div>
                <div className="text-xs text-muted-foreground capitalize">{i.type ?? "note"}</div>
              </div>
              {showLabels
                ? <ScopeBadge accountId={i.account_id} accounts={accounts} />
                : i.accounts?.name
                  ? <span className="text-xs text-muted-foreground shrink-0">{i.accounts.name}</span>
                  : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log interaction</DialogTitle>
            <DialogDescription>
              Interactions are always tied to a customer — pick who this conversation was with.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Customer</Label>
                <Select value={account ?? ""} onValueChange={(v) => setAccount(v)}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTERACTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What was discussed?" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Key points, decisions, follow-ups" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => logMut.mutate()} disabled={logMut.isPending}>Save interaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
