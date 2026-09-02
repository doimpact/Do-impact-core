import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, Presentation, X } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/csar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/commercial/review")({
  head: () => ({ meta: [{ title: "Weekly review — DO.Impact" }] }),
  component: ReviewPage,
});

const STAGES = ["prospect", "proposal", "won", "lost"] as const;
type Stage = (typeof STAGES)[number];
const STAGE_LABEL: Record<Stage, string> = { prospect: "Prospect", proposal: "Proposal", won: "Won", lost: "Lost" };
const DEFAULT_PROB: Record<Stage, number> = { prospect: 15, proposal: 60, won: 100, lost: 0 };
const DAY = 24 * 60 * 60 * 1000;

function startOfISOWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}
function fmtDate(d: Date) { return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); }
function daysBetween(a: Date, b: Date) { return Math.floor((a.getTime() - b.getTime()) / DAY); }

function ReviewPage() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [queueIdx, setQueueIdx] = useState(0);

  const weekStart = useMemo(() => {
    const s = startOfISOWeek(new Date());
    s.setDate(s.getDate() + weekOffset * 7);
    return s;
  }, [weekOffset]);
  const weekEnd = useMemo(() => new Date(weekStart.getTime() + 7 * DAY), [weekStart]);
  const prevWeekStart = useMemo(() => new Date(weekStart.getTime() - 7 * DAY), [weekStart]);

  const { data: opps } = useQuery({
    queryKey: ["review-opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities")
        .select("*, accounts(name), contacts(name), owner:profiles!opportunities_owner_id_fkey(display_name)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: lastTouchByAccount } = useQuery({
    queryKey: ["review-last-touch"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interactions")
        .select("account_id, occurred_at, type, subject")
        .order("occurred_at", { ascending: false }).limit(500);
      if (error) throw error;
      const map: Record<string, { occurred_at: string; type: string; subject: string | null }> = {};
      for (const row of data ?? []) if (!map[row.account_id]) map[row.account_id] = row;
      return map;
    },
  });

  const owners = useMemo(() => {
    const seen = new Map<string, string>();
    (opps ?? []).forEach((o: any) => {
      if (o.owner_id) seen.set(o.owner_id, o.owner?.display_name ?? o.owner_id.slice(0, 8));
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [opps]);

  const scoped = useMemo(() => (opps ?? []).filter((o: any) => ownerFilter === "all" || o.owner_id === ownerFilter), [opps, ownerFilter]);

  const now = new Date();
  const enriched = useMemo(() => scoped.map((o: any) => {
    const updated = new Date(o.updated_at);
    const ageInStage = daysBetween(now, updated);
    const closeDate = o.expected_close_date ? new Date(o.expected_close_date) : null;
    const overdue = !!closeDate && closeDate < now && o.stage !== "won" && o.stage !== "lost";
    const touch = lastTouchByAccount?.[o.account_id];
    const lastTouchDays = touch ? daysBetween(now, new Date(touch.occurred_at)) : null;
    const stale = (lastTouchDays ?? 999) > 14 && (o.stage === "prospect" || o.stage === "proposal");
    const ageWarn = ageInStage > 30 && (o.stage === "prospect" || o.stage === "proposal");
    const closingSoon = !!closeDate && !overdue && daysBetween(closeDate, now) <= 14 && (o.stage === "prospect" || o.stage === "proposal");
    const atRisk = overdue || stale || ageWarn || closingSoon;
    const riskScore = (overdue ? 3 : 0) + (ageWarn ? 2 : 0) + (stale ? 2 : 0) + (closingSoon ? 1 : 0);
    return { ...o, _ageInStage: ageInStage, _closeDate: closeDate, _overdue: overdue, _lastTouchDays: lastTouchDays, _stale: stale, _ageWarn: ageWarn, _closingSoon: closingSoon, _atRisk: atRisk, _riskScore: riskScore, _touch: touch };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [scoped, lastTouchByAccount]);

  const kpi = useMemo(() => {
    const open = enriched.filter((o: any) => o.stage === "prospect" || o.stage === "proposal");
    const pipeline = open.reduce((n, o: any) => n + Number(o.value || 0), 0);
    const weighted = open.reduce((n, o: any) => n + Number(o.value || 0) * (o.probability / 100), 0);
    const wonThisWeek = enriched.filter((o: any) => o.stage === "won" && new Date(o.updated_at) >= weekStart && new Date(o.updated_at) < weekEnd);
    const wonAmt = wonThisWeek.reduce((n, o: any) => n + Number(o.value || 0), 0);
    const newThisWeek = enriched.filter((o: any) => new Date(o.created_at) >= weekStart && new Date(o.created_at) < weekEnd);
    const slipped = enriched.filter((o: any) => o._overdue).length;
    const wonPrev = enriched.filter((o: any) => o.stage === "won" && new Date(o.updated_at) >= prevWeekStart && new Date(o.updated_at) < weekStart);
    return { pipeline, weighted, wonCount: wonThisWeek.length, wonAmt, newCount: newThisWeek.length, slipped, wonDelta: wonThisWeek.length - wonPrev.length };
  }, [enriched, weekStart, weekEnd, prevWeekStart]);

  const byStage = useMemo(() => {
    const r: Record<Stage, any[]> = { prospect: [], proposal: [], won: [], lost: [] };
    for (const o of enriched) {
      if (o.stage === "won" || o.stage === "lost") {
        const u = new Date(o.updated_at);
        if (u >= weekStart && u < weekEnd) r[o.stage as Stage].push(o);
      } else r[o.stage as Stage].push(o);
    }
    r.prospect.sort((a, b) => b._riskScore - a._riskScore);
    r.proposal.sort((a, b) => b._riskScore - a._riskScore);
    return r;
  }, [enriched, weekStart, weekEnd]);

  const reviewQueue = useMemo(() =>
    enriched.filter((o: any) => o._atRisk).sort((a: any, b: any) => b._riskScore - a._riskScore || Number(b.value) - Number(a.value)),
    [enriched]
  );

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "j" || e.key === "ArrowRight") setQueueIdx((i) => Math.min(i + 1, Math.max(reviewQueue.length - 1, 0)));
      else if (e.key === "k" || e.key === "ArrowLeft") setQueueIdx((i) => Math.max(i - 1, 0));
      else if (e.key === "Escape") setPresenting(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, reviewQueue.length]);

  async function changeStage(id: string, stage: Stage) {
    const { error } = await supabase.from("opportunities").update({ stage, probability: DEFAULT_PROB[stage] }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Moved to ${STAGE_LABEL[stage]}`);
    qc.invalidateQueries({ queryKey: ["review-opps"] });
  }
  async function pushClose(id: string, days: number, current: string | null) {
    const base = current ? new Date(current) : new Date();
    base.setDate(base.getDate() + days);
    const iso = base.toISOString().slice(0, 10);
    const { error } = await supabase.from("opportunities").update({ expected_close_date: iso }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Close date → ${iso}`);
    qc.invalidateQueries({ queryKey: ["review-opps"] });
  }

  const kpis = [
    { label: "Open pipeline", value: formatMoney(kpi.pipeline) },
    { label: "Weighted", value: formatMoney(kpi.weighted) },
    { label: "Won this week", value: `${kpi.wonCount} · ${formatMoney(kpi.wonAmt)}`, delta: kpi.wonDelta },
    { label: "New this week", value: String(kpi.newCount) },
    { label: "Slipped close", value: String(kpi.slipped), warn: kpi.slipped > 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Weekly review</div>
          <h1 className="text-2xl font-semibold">Week of {fmtDate(weekStart)}</h1>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((n) => n - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>This week</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((n) => n + 1)}><ChevronRight className="w-4 h-4" /></Button>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              {owners.map((o) => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setQueueIdx(0); setPresenting(true); }} disabled={reviewQueue.length === 0}>
            <Presentation className="w-4 h-4 mr-1.5" /> Meeting mode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
              <div className={cn("mt-1 text-xl font-semibold tabular-nums", k.warn && "text-destructive")}>{k.value}</div>
              {typeof k.delta === "number" && (
                <div className={cn("text-[11px] mt-0.5", k.delta > 0 ? "text-primary" : k.delta < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {k.delta > 0 ? "+" : ""}{k.delta} vs last week
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {STAGES.map((s) => {
          const items = byStage[s];
          const total = items.reduce((n: number, o: any) => n + Number(o.value || 0), 0);
          const label = s === "won" ? "Won this week" : s === "lost" ? "Lost this week" : STAGE_LABEL[s];
          return (
            <div key={s} className="bg-muted/40 rounded-lg p-2 min-h-[280px] flex flex-col">
              <div className="px-2 py-1.5 flex items-center justify-between">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-widest">{label}</div>
                <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground px-2 pb-2 border-b tabular-nums">{formatMoney(total)}</div>
              <div className="space-y-2 mt-2 flex-1">
                {items.length === 0 && (<div className="text-[11px] text-muted-foreground px-2 py-4 text-center">—</div>)}
                {items.map((o: any) => (
                  <button key={o.id} onClick={() => setSelected(o)} className="w-full text-left">
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-3 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="text-[11px] font-medium text-primary truncate">{o.accounts?.name ?? "—"}</div>
                          {o._atRisk && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                        </div>
                        <div className="text-sm font-medium leading-snug line-clamp-2">{o.name}</div>
                        <div className="text-sm font-semibold tabular-nums">{formatMoney(Number(o.value), o.currency)}</div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {o.owner?.display_name?.slice(0, 12) ?? "—"} · {o._ageInStage}d
                          {o._closeDate && <> · {o._closeDate.toISOString().slice(5, 10)}</>}
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Review queue</div>
            <div className="text-sm font-semibold">{reviewQueue.length} at-risk opportunities</div>
          </div>
          <div className="text-[11px] text-muted-foreground">Overdue · stale · aging · closing ≤14d</div>
        </div>
        <CardContent className="p-0">
          {reviewQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nothing at risk this week.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2">Account / Opp</th>
                    <th className="text-left px-2 py-2">Owner</th>
                    <th className="text-left px-2 py-2">Stage</th>
                    <th className="text-right px-2 py-2">Amount</th>
                    <th className="text-left px-2 py-2">Close</th>
                    <th className="text-left px-2 py-2">Age</th>
                    <th className="text-left px-2 py-2">Last touch</th>
                    <th className="text-left px-4 py-2">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewQueue.map((o: any) => (
                    <tr key={o.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(o)}>
                      <td className="px-4 py-2">
                        <div className="font-medium">{o.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {o.accounts?.name ?? "—"}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs">{o.owner?.display_name ?? "—"}</td>
                      <td className="px-2 py-2"><Badge variant="secondary" className="text-[10px]">{STAGE_LABEL[o.stage as Stage]}</Badge></td>
                      <td className="px-2 py-2 text-right tabular-nums font-medium">{formatMoney(Number(o.value), o.currency)}</td>
                      <td className={cn("px-2 py-2 text-xs tabular-nums", o._overdue && "text-destructive font-medium")}>
                        {o._closeDate ? o._closeDate.toISOString().slice(0, 10) : "—"}
                      </td>
                      <td className="px-2 py-2 text-xs tabular-nums">{o._ageInStage}d</td>
                      <td className="px-2 py-2 text-xs tabular-nums">
                        {o._lastTouchDays === null ? <span className="text-muted-foreground">never</span> : `${o._lastTouchDays}d`}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {o._overdue && <Badge variant="destructive" className="text-[9px] font-mono uppercase">Overdue</Badge>}
                          {o._ageWarn && <Badge variant="outline" className="text-[9px] font-mono uppercase">Aging</Badge>}
                          {o._stale && <Badge variant="outline" className="text-[9px] font-mono uppercase">Stale</Badge>}
                          {o._closingSoon && <Badge variant="outline" className="text-[9px] font-mono uppercase">Closing</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{selected.accounts?.name ?? "—"}</div>
                <SheetTitle className="text-lg">{selected.name}</SheetTitle>
              </SheetHeader>
              <OppDetail opp={selected}
                onChangeStage={(s) => changeStage(selected.id, s)}
                onPushClose={(d) => pushClose(selected.id, d, selected.expected_close_date)} />
            </>
          )}
        </SheetContent>
      </Sheet>

      {presenting && reviewQueue[queueIdx] && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="border-b px-6 py-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Meeting mode · j/k or ← →</div>
              <div className="text-sm font-semibold">{queueIdx + 1} / {reviewQueue.length}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQueueIdx((i) => Math.max(i - 1, 0))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setQueueIdx((i) => Math.min(i + 1, reviewQueue.length - 1))}><ChevronRight className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setPresenting(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
            <PresentCard opp={reviewQueue[queueIdx]}
              onChangeStage={(s) => changeStage(reviewQueue[queueIdx].id, s)}
              onPushClose={(d) => pushClose(reviewQueue[queueIdx].id, d, reviewQueue[queueIdx].expected_close_date)} />
          </div>
        </div>
      )}
    </div>
  );
}

function OppDetail({ opp, onChangeStage, onPushClose }: { opp: any; onChangeStage: (s: Stage) => void; onPushClose: (days: number) => void }) {
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Kv label="Amount" value={formatMoney(Number(opp.value), opp.currency)} />
        <Kv label="Probability" value={`${opp.probability}%`} />
        <Kv label="Owner" value={opp.owner?.display_name ?? "—"} />
        <Kv label="Contact" value={opp.contacts?.name ?? "—"} />
        <Kv label="Close date" value={opp._closeDate ? opp._closeDate.toISOString().slice(0, 10) : "—"} warn={opp._overdue} />
        <Kv label="Age in stage" value={`${opp._ageInStage}d`} warn={opp._ageWarn} />
        <Kv label="Last touch" value={opp._lastTouchDays === null ? "never" : `${opp._lastTouchDays}d ago`} warn={opp._stale} />
        <Kv label="Stage" value={STAGE_LABEL[opp.stage as Stage]} />
      </div>
      {opp.notes && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Notes</div>
          <div className="text-sm whitespace-pre-wrap">{opp.notes}</div>
        </div>
      )}
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Move stage</div>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <Button key={s} size="sm" variant={s === opp.stage ? "default" : "outline"} onClick={() => onChangeStage(s)}>{STAGE_LABEL[s]}</Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Push close date</div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onPushClose(7)}>+1 wk</Button>
          <Button size="sm" variant="outline" onClick={() => onPushClose(14)}>+2 wk</Button>
          <Button size="sm" variant="outline" onClick={() => onPushClose(30)}>+1 mo</Button>
        </div>
      </div>
      <Link to="/commercial/accounts/$id" params={{ id: opp.account_id }} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <Building2 className="w-3.5 h-3.5" /> Open account
      </Link>
    </div>
  );
}

function PresentCard({ opp, onChangeStage, onPushClose }: { opp: any; onChangeStage: (s: Stage) => void; onPushClose: (days: number) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{opp.accounts?.name ?? "—"}</div>
        <h2 className="text-3xl font-semibold mt-1">{opp.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {opp._overdue && <Badge variant="destructive" className="font-mono uppercase">Overdue</Badge>}
          {opp._ageWarn && <Badge variant="outline" className="font-mono uppercase">Aging</Badge>}
          {opp._stale && <Badge variant="outline" className="font-mono uppercase">Stale</Badge>}
          {opp._closingSoon && <Badge variant="outline" className="font-mono uppercase">Closing ≤14d</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kv label="Amount" value={formatMoney(Number(opp.value), opp.currency)} big />
        <Kv label="Stage" value={STAGE_LABEL[opp.stage as Stage]} big />
        <Kv label="Close" value={opp._closeDate ? opp._closeDate.toISOString().slice(0, 10) : "—"} big warn={opp._overdue} />
        <Kv label="Owner" value={opp.owner?.display_name ?? "—"} big />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-2">Move</span>
        {STAGES.map((s) => (
          <Button key={s} size="sm" variant={s === opp.stage ? "default" : "outline"} onClick={() => onChangeStage(s)}>{STAGE_LABEL[s]}</Button>
        ))}
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-4 mr-2">Push</span>
        <Button size="sm" variant="outline" onClick={() => onPushClose(7)}>+1 wk</Button>
        <Button size="sm" variant="outline" onClick={() => onPushClose(14)}>+2 wk</Button>
        <Button size="sm" variant="outline" onClick={() => onPushClose(30)}>+1 mo</Button>
      </div>
    </div>
  );
}

function Kv({ label, value, warn, big }: { label: string; value: string; warn?: boolean; big?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("tabular-nums font-medium", big ? "text-lg" : "text-sm", warn && "text-destructive")}>{value}</div>
    </div>
  );
}
