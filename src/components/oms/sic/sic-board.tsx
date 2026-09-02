import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Plus, ShieldAlert, Timer, TrendingDown, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  SQDCP,
  escalationTier,
  hhmm,
  tierMeta,
  type SicAction,
  type SicInterval,
  type SicLossCode,
  type SicLossEntry,
  type SicShift,
} from "./types";

export function SicBoard({ shift }: { shift: SicShift }) {
  const qc = useQueryClient();
  const shiftId = shift.id;

  const intervalsQ = useQuery({
    queryKey: ["sic-intervals", shiftId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sic_intervals").select("*").eq("shift_id", shiftId).order("seq");
      if (error) throw error;
      return (data ?? []) as SicInterval[];
    },
  });
  const codesQ = useQuery({
    queryKey: ["sic-loss-codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sic_loss_codes").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []) as SicLossCode[];
    },
  });
  const lossQ = useQuery({
    queryKey: ["sic-losses", shiftId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sic_loss_entries").select("*").eq("shift_id", shiftId).order("created_at");
      if (error) throw error;
      return (data ?? []) as SicLossEntry[];
    },
  });
  const actionsQ = useQuery({
    queryKey: ["sic-actions", shiftId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sic_actions").select("*").eq("shift_id", shiftId).order("opened_at");
      if (error) throw error;
      return (data ?? []) as SicAction[];
    },
  });

  const intervals = intervalsQ.data ?? [];
  const codes = codesQ.data ?? [];
  const losses = lossQ.data ?? [];
  const actions = actionsQ.data ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sic-intervals", shiftId] });
    qc.invalidateQueries({ queryKey: ["sic-losses", shiftId] });
    qc.invalidateQueries({ queryKey: ["sic-actions", shiftId] });
    qc.invalidateQueries({ queryKey: ["sic-shifts"] });
  };

  const saveInterval = useMutation({
    mutationFn: async (v: { id: string; actual_output: number | null; note?: string | null }) => {
      const { error } = await supabase.from("sic_intervals").update(v).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const setSqdcp = useMutation({
    mutationFn: async (next: SicShift["sqdcp"]) => {
      const { error } = await supabase.from("sic_shifts").update({ sqdcp: next }).eq("id", shiftId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addLoss = useMutation({
    mutationFn: async (v: { loss_code_id: string; minutes: number; description: string; interval_id: string | null }) => {
      const { error } = await supabase.from("sic_loss_entries").insert({ ...v, shift_id: shiftId, company_id: shift.company_id });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Loss logged"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delLoss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sic_loss_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addAction = useMutation({
    mutationFn: async (v: { problem: string; containment: string; owner_name: string; escalation_level: number; interval_id: string | null }) => {
      const { error } = await supabase.from("sic_actions").insert({ ...v, shift_id: shiftId, company_id: shift.company_id });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Action added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateAction = useMutation({
    mutationFn: async (v: { id: string } & Partial<SicAction>) => {
      const { id, ...rest } = v;
      const { error } = await supabase.from("sic_actions").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const delAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sic_actions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- derived numbers -------------------------------------------------
  const filled = intervals.filter((i) => i.actual_output != null);
  const planToDate = filled.reduce((s, i) => s + Number(i.planned_target), 0);
  const actualToDate = filled.reduce((s, i) => s + Number(i.actual_output ?? 0), 0);
  const cumVariance = actualToDate - planToDate;
  const shiftPlan = intervals.reduce((s, i) => s + Number(i.planned_target), 0);

  let consecutiveMisses = 0;
  for (let i = filled.length - 1; i >= 0; i--) {
    if (Number(filled[i].actual_output ?? 0) < Number(filled[i].planned_target)) consecutiveMisses++;
    else break;
  }
  const lostMinutes = losses.reduce((s, l) => s + Number(l.minutes), 0);
  const tier = escalationTier(consecutiveMisses, lostMinutes);
  const meta = tierMeta(tier);

  const pareto = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of losses) {
      const c = codes.find((x) => x.id === l.loss_code_id);
      const key = c ? `${c.code} · ${c.label}` : "Uncoded";
      map.set(key, (map.get(key) ?? 0) + Number(l.minutes));
    }
    const rows = [...map.entries()].map(([label, minutes]) => ({ label, minutes })).sort((a, b) => b.minutes - a.minutes);
    const total = rows.reduce((s, r) => s + r.minutes, 0) || 1;
    let run = 0;
    return rows.map((r) => {
      run += r.minutes;
      return { ...r, pct: (r.minutes / total) * 100, cum: (run / total) * 100 };
    });
  }, [losses, codes]);

  const openActions = actions.filter((a) => a.status !== "closed");
  const locked = !!shift.closed_at;

  return (
    <div className="space-y-4">
      {/* Huddle banner */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${meta.className}`}>
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">{meta.label}</p>
            <p className="text-xs opacity-90">
              {consecutiveMisses === 0
                ? "On plan — run the 15-minute huddle, confirm containment on any open action."
                : `${consecutiveMisses} consecutive interval${consecutiveMisses > 1 ? "s" : ""} below target · ${lostMinutes} min lost. Contain now, defer root cause to A3.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <span>Plan to date {planToDate}</span>
          <span>Actual {actualToDate}</span>
          <span className={cumVariance < 0 ? "text-red-700" : "text-emerald-700"}>
            {cumVariance >= 0 ? "+" : ""}{cumVariance}
          </span>
          <span className="opacity-70">Shift plan {shiftPlan}</span>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Shift closed — the board is a read-only record.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Q1 — SQDCP */}
        <Quadrant n={1} title="Safety, Quality, Delivery, Cost, People" icon={<CheckCircle2 className="h-4 w-4" />}>
          <div className="space-y-2">
            {SQDCP.map((s) => {
              const cur = shift.sqdcp?.[s.key];
              const green = cur?.status !== "red";
              return (
                <div key={s.key} className="flex items-start gap-3 rounded-lg border border-border p-2.5">
                  <button
                    disabled={locked}
                    onClick={() =>
                      setSqdcp.mutate({
                        ...(shift.sqdcp ?? {}),
                        [s.key]: { status: green ? "red" : "green", note: cur?.note ?? "" },
                      })
                    }
                    className={`h-9 w-9 shrink-0 rounded-md text-sm font-bold text-white disabled:opacity-60 ${green ? "bg-emerald-600" : "bg-red-600"}`}
                    aria-label={`${s.label} status`}
                  >
                    {s.key}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.hint}</p>
                    <Input
                      disabled={locked}
                      className="mt-1.5 h-8 text-xs"
                      placeholder="Note / containment"
                      defaultValue={cur?.note ?? ""}
                      onBlur={(e) =>
                        setSqdcp.mutate({
                          ...(shift.sqdcp ?? {}),
                          [s.key]: { status: cur?.status ?? "green", note: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Quadrant>

        {/* Q2 — hour by hour */}
        <Quadrant n={2} title="Hour-by-hour production" icon={<Timer className="h-4 w-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="py-1.5">Interval</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Var</th>
                  <th>Reason / note</th>
                </tr>
              </thead>
              <tbody>
                {intervals.map((iv) => {
                  const actual = iv.actual_output;
                  const variance = actual == null ? null : Number(actual) - Number(iv.planned_target);
                  return (
                    <tr key={iv.id} className="border-t border-border">
                      <td className="py-1.5 whitespace-nowrap font-medium">{hhmm(iv.start_at)}–{hhmm(iv.end_at)}</td>
                      <td>{Number(iv.planned_target)}</td>
                      <td>
                        <Input
                          disabled={locked}
                          className="h-8 w-20"
                          type="number"
                          defaultValue={actual ?? ""}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            const val = raw === "" ? null : Number(raw);
                            if (val !== (actual == null ? null : Number(actual))) {
                              saveInterval.mutate({ id: iv.id, actual_output: val });
                            }
                          }}
                        />
                      </td>
                      <td>
                        {variance == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                              variance < 0 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {variance > 0 ? "+" : ""}{variance}
                          </span>
                        )}
                      </td>
                      <td>
                        <Input
                          disabled={locked}
                          className="h-8 min-w-40"
                          defaultValue={iv.note ?? ""}
                          placeholder="What happened?"
                          onBlur={(e) =>
                            e.target.value !== (iv.note ?? "") &&
                            saveInterval.mutate({ id: iv.id, actual_output: iv.actual_output, note: e.target.value })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Quadrant>

        {/* Q3 — losses */}
        <Quadrant n={3} title="Loss capture & Pareto" icon={<TrendingDown className="h-4 w-4" />}>
          <LossForm codes={codes} intervals={intervals} disabled={locked} onAdd={(v) => addLoss.mutate(v)} />
          <div className="mt-3 space-y-1.5">
            {pareto.length === 0 && <p className="text-sm text-muted-foreground">No losses logged yet.</p>}
            {pareto.map((r) => (
              <div key={r.label} className="text-xs">
                <div className="flex justify-between">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-muted-foreground">{r.minutes} min · {r.pct.toFixed(0)}% (cum {r.cum.toFixed(0)}%)</span>
                </div>
                <div className="mt-0.5 h-2 rounded bg-muted">
                  <div className="h-2 rounded bg-[color:var(--color-accent,theme(colors.primary.DEFAULT))]" style={{ width: `${r.pct}%`, backgroundColor: "currentColor" }} />
                </div>
              </div>
            ))}
          </div>
          {losses.length > 0 && (
            <div className="mt-3 space-y-1">
              {losses.map((l) => {
                const c = codes.find((x) => x.id === l.loss_code_id);
                return (
                  <div key={l.id} className="flex items-center justify-between rounded border border-border px-2 py-1 text-xs">
                    <span>
                      <Badge variant="outline" className="mr-2">{c?.code ?? "—"}</Badge>
                      {l.minutes} min {l.description ? `· ${l.description}` : ""}
                    </span>
                    {!locked && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => delLoss.mutate(l.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Quadrant>

        {/* Q4 — actions */}
        <Quadrant n={4} title="Intra-shift actions & escalation" icon={<AlertTriangle className="h-4 w-4" />}>
          <ActionForm
            intervals={intervals}
            disabled={locked}
            defaultTier={tier}
            onAdd={(v) => addAction.mutate(v)}
          />
          <div className="mt-3 space-y-2">
            {actions.length === 0 && <p className="text-sm text-muted-foreground">No actions raised this shift.</p>}
            {actions.map((a) => {
              const m = tierMeta(a.escalation_level);
              return (
                <div key={a.id} className="rounded-lg border border-border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{a.problem}</p>
                      {a.containment && <p className="text-xs text-muted-foreground">Containment: {a.containment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{a.owner_name || "Unassigned"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${m.className}`}>L{a.escalation_level}</span>
                      {!locked && (
                        <>
                          {a.status !== "closed" ? (
                            <Button size="sm" variant="outline" className="h-7" onClick={() => updateAction.mutate({ id: a.id, status: "closed", resolved_at: new Date().toISOString() })}>
                              Close
                            </Button>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800">Closed</Badge>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => delAction.mutate(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {openActions.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {openActions.length} open action{openActions.length > 1 ? "s" : ""} — anything unresolved after this shift escalates to the daily SQDP board.
            </p>
          )}
        </Quadrant>
      </div>
    </div>
  );
}

function Quadrant({ n, title, icon, children }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">{n}</span>
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function LossForm({
  codes,
  intervals,
  disabled,
  onAdd,
}: {
  codes: SicLossCode[];
  intervals: SicInterval[];
  disabled: boolean;
  onAdd: (v: { loss_code_id: string; minutes: number; description: string; interval_id: string | null }) => void;
}) {
  const [code, setCode] = useState("");
  const [minutes, setMinutes] = useState("15");
  const [desc, setDesc] = useState("");
  const [iv, setIv] = useState("none");
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_90px_1fr_auto]">
      <Select value={code} onValueChange={setCode} disabled={disabled}>
        <SelectTrigger className="h-9"><SelectValue placeholder="Loss code" /></SelectTrigger>
        <SelectContent>
          {codes.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.code} · {c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input className="h-9" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={disabled} aria-label="Minutes lost" />
      <Input className="h-9" placeholder="Detail" value={desc} onChange={(e) => setDesc(e.target.value)} disabled={disabled} />
      <div className="flex gap-2">
        <Select value={iv} onValueChange={setIv} disabled={disabled}>
          <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Interval" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Whole shift</SelectItem>
            {intervals.map((i) => (
              <SelectItem key={i.id} value={i.id}>{hhmm(i.start_at)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="h-9"
          disabled={disabled || !code}
          onClick={() => {
            onAdd({ loss_code_id: code, minutes: Number(minutes) || 0, description: desc, interval_id: iv === "none" ? null : iv });
            setDesc("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ActionForm({
  intervals,
  disabled,
  defaultTier,
  onAdd,
}: {
  intervals: SicInterval[];
  disabled: boolean;
  defaultTier: number;
  onAdd: (v: { problem: string; containment: string; owner_name: string; escalation_level: number; interval_id: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [containment, setContainment] = useState("");
  const [owner, setOwner] = useState("");
  const [tier, setTier] = useState(String(defaultTier));
  const [iv, setIv] = useState("none");
  return (
    <>
      <Button size="sm" disabled={disabled} onClick={() => { setTier(String(defaultTier)); setOpen(true); }}>
        <Plus className="h-4 w-4 mr-1" /> Raise action
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Raise intra-shift action</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Problem</Label><Input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Spindle alarm on OP20" /></div>
            <div><Label>Immediate containment</Label><Textarea rows={2} value={containment} onChange={(e) => setContainment(e.target.value)} placeholder="What restores flow now? (root cause goes to A3)" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
              <div>
                <Label>Escalation tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">L1 — Team leader</SelectItem>
                    <SelectItem value="2">L2 — Value stream manager</SelectItem>
                    <SelectItem value="3">L3 — Plant leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Interval</Label>
              <Select value={iv} onValueChange={setIv}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Whole shift</SelectItem>
                  {intervals.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{hhmm(i.start_at)}–{hhmm(i.end_at)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!problem.trim()}
              onClick={() => {
                onAdd({ problem: problem.trim(), containment, owner_name: owner, escalation_level: Number(tier), interval_id: iv === "none" ? null : iv });
                setProblem(""); setContainment(""); setOwner(""); setIv("none"); setOpen(false);
              }}
            >
              Add action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
