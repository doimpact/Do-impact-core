import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Footprints, Compass, ChevronRight, ChevronLeft } from "lucide-react";
import type { Board, Escalation, MetricDef, MetricValue } from "./types";
import { isMetricRed } from "./types";

const DEPTH_HINTS: Record<number, string> = {
  1: "Symptom only — the team restated what happened.",
  2: "Containment described, no cause asked.",
  3: "A direct cause named, but not verified at the process.",
  4: "Cause verified with data at the gemba.",
  5: "System cause found — standard work / process changed to prevent recurrence.",
};

type WalkItem = {
  key: string;
  label: string;
  escalationId?: string | null;
  metricDefId?: string | null;
  depthScore: number | null;
  objectiveId: string | null;
  note: string;
};

export function GembaMode({
  board, boards, escalations, defs, values, today, objectives, onClose, onSave,
}: {
  board: Board;
  boards: Board[];
  escalations: Escalation[];
  defs: MetricDef[];
  values: MetricValue[];
  today: string;
  objectives: { id: string; title: string }[];
  onClose: () => void;
  onSave: (v: {
    boardId: string; walkedOn: string; notes: string | null;
    items: { escalationId?: string | null; metricDefId?: string | null; label?: string | null; depthScore?: number | null; objectiveId?: string | null; note?: string | null }[];
  }) => void;
}) {
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState("");

  const boardDefs = useMemo(() => defs.filter(d => d.board_id === board.id && d.active), [defs, board.id]);
  const latest = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of values) {
      if (v.value == null) continue;
      const prev = m.get(v.metric_def_id);
      m.set(v.metric_def_id, prev == null ? Number(v.value) : Number(v.value));
    }
    return m;
  }, [values]);

  const redMetrics = boardDefs.filter(d => isMetricRed(d, latest.get(d.id)));

  const [items, setItems] = useState<WalkItem[]>(() => [
    ...redMetrics.map(d => ({
      key: `m-${d.id}`, label: d.label, metricDefId: d.id,
      depthScore: null as number | null, objectiveId: null as string | null, note: "",
    })),
    ...escalations.map(e => ({
      key: `e-${e.id}`, label: e.concern, escalationId: e.id,
      depthScore: null as number | null, objectiveId: null as string | null, note: "",
    })),
  ]);

  const patch = (key: string, p: Partial<WalkItem>) =>
    setItems(list => list.map(i => (i.key === key ? { ...i, ...p } : i)));

  const scored = items.map(i => i.depthScore).filter((v): v is number => v != null);
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;

  const steps = ["Friction first", "Coach the depth", "True North", "Close the walk"];

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Gemba coaching walk</div>
          <DialogTitle className="flex items-center gap-2">
            <Footprints className="h-5 w-5" /> {board.name} · {today}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`rounded px-2 py-1 font-medium transition ${
                i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Start at the friction, not the score. Ask what is blocking flow right now.
            </p>
            {boardDefs.length === 0 ? (
              <div className="rounded border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                No friction metrics on this board yet.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {boardDefs.map(d => {
                  const v = latest.get(d.id) ?? null;
                  const red = isMetricRed(d, v);
                  return (
                    <div key={d.id} className={`rounded border p-3 ${red ? "border-red-300 bg-red-50/50" : "bg-card"}`}>
                      <div className="text-sm font-medium">{d.label}</div>
                      <div className="mt-1 text-2xl font-bold tabular-nums">
                        {v == null ? "—" : Math.round(v)}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {d.unit === "count" ? "open" : "%"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {red ? "Red — coach this one first." : "Within trigger."}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Score how deep the team's thinking went — you are coaching the problem-solving, not the number.
            </p>
            {items.length === 0 ? (
              <div className="rounded border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                Nothing red and no open 3C — spend the walk on standard work confirmation.
              </div>
            ) : (
              items.map(i => (
                <div key={i.key} className="rounded border bg-card p-3">
                  <div className="text-sm font-medium">{i.label}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => patch(i.key, { depthScore: n })}
                        title={DEPTH_HINTS[n]}
                        className={`h-7 w-7 rounded text-xs font-semibold transition ${
                          i.depthScore != null && n <= i.depthScore
                            ? n >= 4 ? "bg-emerald-500 text-white" : n === 3 ? "bg-amber-400 text-white" : "bg-red-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      {i.depthScore ? DEPTH_HINTS[i.depthScore] : "1 = symptom · 5 = system cause fixed in standard work"}
                    </span>
                  </div>
                  <Textarea
                    className="mt-2"
                    rows={2}
                    placeholder="Coaching note — the question you asked and what the team will verify next."
                    value={i.note}
                    onChange={(e) => patch(i.key, { note: e.target.value })}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Compass className="h-4 w-4" /> Link each item to the objective it serves. No link means it may not be worth the team's time.
            </p>
            {items.length === 0 ? (
              <div className="rounded border bg-muted/20 p-4 text-center text-xs text-muted-foreground">Nothing to align.</div>
            ) : (
              items.map(i => (
                <div key={i.key} className="flex flex-wrap items-center gap-2 rounded border bg-card p-3">
                  <div className="min-w-[180px] flex-1 text-sm">{i.label}</div>
                  <div className="w-full sm:w-72">
                    <Select
                      value={i.objectiveId ?? "none"}
                      onValueChange={(v) => patch(i.key, { objectiveId: v === "none" ? null : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Objective" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not linked</SelectItem>
                        {objectives.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Average problem-solving depth</div>
              <div className="text-3xl font-bold tabular-nums">{avg == null ? "—" : avg.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                {avg == null
                  ? "Score at least one item to record a depth."
                  : avg >= 4
                  ? "Strong — the team is reaching system causes."
                  : avg >= 3
                  ? "Developing — push for verification at the process."
                  : "Shallow — coach the team past containment."}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Walk summary</label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="What you saw, what you coached, what you will check next walk." />
            </div>
            <div className="text-[11px] text-muted-foreground">
              {boards.length > 1 && "Tip: rotate boards so every cell gets coached across the week."}
            </div>
          </div>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 3 && (
              <Button variant="outline" onClick={() => setStep(s => s + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() =>
                onSave({
                  boardId: board.id,
                  walkedOn: today,
                  notes: notes || null,
                  items: items.map(i => ({
                    escalationId: i.escalationId ?? null,
                    metricDefId: i.metricDefId ?? null,
                    label: i.label,
                    depthScore: i.depthScore,
                    objectiveId: i.objectiveId,
                    note: i.note || null,
                  })),
                })
              }
            >
              Save walk
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
