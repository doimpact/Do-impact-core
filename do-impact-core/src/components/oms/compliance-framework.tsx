import { getCurrentUser } from "@/lib/auth-session";
import { useMemo, useState, type ReactNode } from "react";
import type { Pillar, ChecklistItem } from "@/lib/compliance-part145";
import { useComplianceState, type ComplianceState } from "@/hooks/use-compliance-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, ChevronRight, Printer, RotateCcw, Search, Save, History, Trash2, Undo2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { confirmThen } from "@/components/confirm-dialog";

type FilterMode = "all" | "open" | "done";

type Snapshot = {
  id: string;
  label: string | null;
  created_at: string;
  created_by_email: string | null;
  auditor: string | null;
  audit_date: string | null;
  total_items: number;
  checked_items: number;
  percent: number;
  state: ComplianceState;
};

export function ComplianceFramework({
  framework,
  title,
  subtitle,
  pillars,
  totalItems,
  pillarWord = "Pillar",
  auditNoun = "internal audit",
  footer,
}: {
  framework: string;
  title: string;
  subtitle: string;
  pillars: Pillar[];
  totalItems: number;
  pillarWord?: string;
  auditNoun?: string;
  footer?: ReactNode;
}) {
  const { state, ready, userEmail, toggle, setNote, reset, replace } = useComplianceState(framework);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(pillars.map((p) => [p.id, true])),
  );
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [auditMode, setAuditMode] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [auditor, setAuditor] = useState("");
  const [auditDate, setAuditDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [versionsOpen, setVersionsOpen] = useState(false);

  const qc = useQueryClient();

  const snapshots = useQuery({
    queryKey: ["compliance_snapshots", framework],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_snapshots")
        .select("id,label,created_at,created_by_email,auditor,audit_date,total_items,checked_items,percent,state")
        .eq("framework", framework)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Snapshot[];
    },
  });

  const totalChecked = useMemo(
    () => pillars.reduce((n, p) => n + p.items.filter((i) => state[i.id]?.checked).length, 0),
    [state, pillars],
  );
  const overallPct = Math.round((totalChecked / totalItems) * 100);

  const saveSnapshot = useMutation({
    mutationFn: async () => {
      const { data: userData } = await getCurrentUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("compliance_snapshots").insert({
        framework,
        label: saveLabel.trim() || null,
        auditor: auditor.trim() || userEmail,
        audit_date: auditDate || null,
        total_items: totalItems,
        checked_items: totalChecked,
        percent: overallPct,
        state: state as never,
        created_by: uid,
        created_by_email: userEmail,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance_snapshots", framework] });
      toast.success("Internal audit saved");
      setSaveOpen(false);
      setSaveLabel("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSnapshot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compliance_snapshots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance_snapshots", framework] });
      toast.success("Audit record deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreSnapshot = (snap: Snapshot) => {
    replace(snap.state ?? {});
    toast.success(`Restored audit from ${new Date(snap.created_at).toLocaleString()}`);
    setVersionsOpen(false);
  };

  const matches = (item: ChecklistItem) => {
    const s = search.trim().toLowerCase();
    if (s && !`${item.title} ${item.description} ${item.ref ?? ""}`.toLowerCase().includes(s)) return false;
    const done = !!state[item.id]?.checked;
    if (filter === "open" && done) return false;
    if (filter === "done" && !done) return false;
    return true;
  };

  return (
    <div className={cn("space-y-6", auditMode && "text-[15px]")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 max-w-3xl text-muted-foreground">{subtitle}</p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
            <Switch id={`audit-mode-${framework}`} checked={auditMode} onCheckedChange={setAuditMode} />
            <Label htmlFor={`audit-mode-${framework}`} className="text-sm">Audit mode</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
            <Save className="mr-2 h-4 w-4" /> Save as internal audit
          </Button>
          <Sheet open={versionsOpen} onOpenChange={setVersionsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="mr-2 h-4 w-4" /> Internal audits{snapshots.data?.length ? ` (${snapshots.data.length})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Internal audits</SheetTitle>
                <SheetDescription>
                  Saved reviews of this checklist for audit traceability. Restore a record to reload its state into your working checklist.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {snapshots.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {snapshots.data && snapshots.data.length === 0 && (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No internal audits saved yet.
                  </div>
                )}
                {snapshots.data?.map((s) => (
                  <div key={s.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{s.label || "Untitled audit"}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.audit_date ? new Date(s.audit_date).toLocaleDateString() : new Date(s.created_at).toLocaleString()}
                          {s.auditor || s.created_by_email ? ` · ${s.auditor ?? s.created_by_email}` : ""}
                        </div>
                        <div className="mt-1 text-xs tabular-nums text-muted-foreground">
                          {s.checked_items}/{s.total_items} verified · {s.total_items - s.checked_items} open finding
                          {s.total_items - s.checked_items === 1 ? "" : "s"}
                        </div>
                      </div>
                      <Badge variant="outline" className="tabular-nums">{s.percent}%</Badge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => restoreSnapshot(s)}>
                        <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          confirmThen("Delete this audit record? This cannot be undone.", () => { deleteSnapshot.mutate(s.id); })
                        }}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              confirmThen(
                {
                  title: "Reset all checkboxes and notes to open?",
                  description: `Tip: save an ${auditNoun} first to keep this state in the audit history.`,
                  confirmLabel: "Reset",
                },
                () => { reset(); },
              );
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset to open
          </Button>

          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save internal audit</DialogTitle>
                <DialogDescription>
                  Stores the current checklist state, evidence notes, auditor and date so the review can be produced in an audit later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`snap-label-${framework}`}>Title</Label>
                  <Input
                    id={`snap-label-${framework}`}
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="e.g. SMS internal audit Q4 2026"
                    autoFocus
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`snap-auditor-${framework}`}>Auditor</Label>
                    <Input
                      id={`snap-auditor-${framework}`}
                      value={auditor}
                      onChange={(e) => setAuditor(e.target.value)}
                      placeholder={userEmail ?? "Name"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`snap-date-${framework}`}>Audit date</Label>
                    <Input
                      id={`snap-date-${framework}`}
                      type="date"
                      value={auditDate}
                      onChange={(e) => setAuditDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalChecked}/{totalItems} verified · {overallPct}% · {totalItems - totalChecked} open finding
                  {totalItems - totalChecked === 1 ? "" : "s"}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
                <Button onClick={() => saveSnapshot.mutate()} disabled={saveSnapshot.isPending}>
                  {saveSnapshot.isPending ? "Saving…" : "Save internal audit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overall progress */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Overall compliance</div>
            <div className="text-xs text-muted-foreground">
              {totalChecked} of {totalItems} items verified
            </div>
          </div>
          <div className="text-3xl font-bold tabular-nums" style={{ color: overallPct === 100 ? "var(--color-pillar-oms)" : undefined }}>
            {overallPct}%
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full transition-all" style={{ width: `${overallPct}%`, background: "var(--color-primary)" }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pillars.map((p) => {
            const done = p.items.filter((i) => state[i.id]?.checked).length;
            const pct = Math.round((done / p.items.length) * 100);
            return (
              <button
                key={p.id}
                onClick={() => {
                  setOpen((o) => ({ ...o, [p.id]: true }));
                  document.getElementById(`pillar-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-md border bg-background px-3 py-1.5 text-xs hover:border-primary"
              >
                <span className="font-semibold">{pillarWord === "Component" ? "C" : "P"}{p.n}</span>{" "}
                <span className="text-muted-foreground">{done}/{p.items.length}</span>{" "}
                <span className={cn("tabular-nums", pct === 100 ? "text-emerald-600" : "text-muted-foreground")}>· {pct}%</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-64 pl-8"
          />
        </div>
        <div className="flex rounded-md border">
          {(["all", "open", "done"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium capitalize",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {snapshots.data?.[0] && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Last internal audit:{" "}
            {snapshots.data[0].audit_date
              ? new Date(snapshots.data[0].audit_date).toLocaleDateString()
              : new Date(snapshots.data[0].created_at).toLocaleDateString()}{" "}
            · {snapshots.data[0].percent}%
          </div>
        )}
      </div>

      {/* Pillars */}
      {ready && pillars.map((p) => {
        const visible = p.items.filter(matches);
        const done = p.items.filter((i) => state[i.id]?.checked).length;
        const pct = Math.round((done / p.items.length) * 100);
        const isOpen = open[p.id];
        return (
          <section key={p.id} id={`pillar-${p.id}`} className="rounded-xl border bg-card">
            <button
              onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                {p.n}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{pillarWord} {p.n} · {p.title}</div>
                <div className="text-xs text-muted-foreground">{done} of {p.items.length} verified · {pct}%</div>
              </div>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </button>

            {(isOpen || filter !== "all" || search) && (
              <div className="divide-y border-t">
                {visible.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No items match.</div>
                )}
                {visible.map((item) => {
                  const st = state[item.id];
                  const checked = !!st?.checked;
                  return (
                    <div key={item.id} className={cn("flex gap-4 p-4", checked && "bg-emerald-500/5")}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggle(item.id, e.target.checked)}
                        className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-600"
                        aria-label={item.title}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={cn("font-medium", checked && "text-emerald-700 dark:text-emerald-400")}>
                            {item.title}
                          </div>
                          {item.ref && (
                            <Badge variant="outline" className="font-mono text-[10px]">{item.ref}</Badge>
                          )}
                          {checked && st?.checkedAt && (
                            <span className="text-[11px] text-muted-foreground">
                              Verified {new Date(st.checkedAt).toLocaleDateString()}{" "}
                              {st.checkedBy ? `· ${st.checkedBy}` : ""}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                        {!auditMode && (
                          <Textarea
                            value={st?.note ?? ""}
                            onChange={(e) => setNote(item.id, e.target.value)}
                            placeholder="Evidence, doc reference, or notes…"
                            className="no-print mt-2 min-h-[52px] text-sm"
                          />
                        )}
                        {auditMode && st?.note && (
                          <div className="mt-2 rounded-md border bg-background px-3 py-2 text-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence</div>
                            {st.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {footer}
    </div>
  );
}
