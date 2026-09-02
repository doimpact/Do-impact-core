import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { OwnerSelect } from "@/components/owner-select";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Minus, Plus, Trash2, X } from "lucide-react";
import { HOSHIN_CHECKS, type CatchballEntry, type HoshinFinding } from "@/lib/problem-tools";
import { useHoshinItems, type HoshinReview } from "@/hooks/use-problem-tools";

const KIND_LABEL: Record<string, string> = {
  long_term: "Breakthrough (3–5 yr)",
  annual: "Annual objective",
  priority: "Improvement priority",
  kpi: "Metric / target to improve",
};
const ORDER = ["long_term", "annual", "priority", "kpi"];

export function HoshinReviewBoard({
  review,
  onPatch,
}: {
  review: HoshinReview;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const itemsQ = useHoshinItems();
  const items = itemsQ.data ?? [];
  const findings = (review.findings ?? []) as HoshinFinding[];
  const catchball = (review.catchball ?? []) as CatchballEntry[];

  const findingFor = (key: string) => findings.find((f) => f.key === key);
  const setFinding = (key: string, patch: Partial<HoshinFinding>) => {
    const next = findings.some((f) => f.key === key)
      ? findings.map((f) => (f.key === key ? { ...f, ...patch } : f))
      : [...findings, { key, state: "ok" as const, ...patch }];
    onPatch({ findings: next });
  };

  const gaps = findings.filter((f) => f.state === "gap").length;
  const oks = findings.filter((f) => f.state === "ok").length;
  const score = HOSHIN_CHECKS.length ? Math.round((oks / HOSHIN_CHECKS.length) * 100) : 0;

  const counts = ORDER.map((k) => ({ kind: k, n: items.filter((i) => i.kind === k).length }));
  const noOwner = items.filter((i) => !i.owner_id).length;
  const noTarget = items.filter((i) => i.kind === "kpi" && !i.target_value).length;
  const noPriorities = items.some((i) => i.kind === "annual") && !items.some((i) => i.kind === "priority");

  return (
    <div className="space-y-4">
      <Card><CardContent className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Review date</p>
            <Input type="date" defaultValue={review.review_date ?? ""} onBlur={(e) => onPatch({ review_date: e.target.value || null })} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Owner</p>
            <OwnerSelect value={review.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
          </div>
          <div className="flex items-end">
            <Button asChild variant="outline" className="w-full">
              <Link to="/strategy/hoshin">Open the X-Matrix <ArrowUpRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${score}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{score}% cascade health · {gaps} gap{gaps === 1 ? "" : "s"}</span>
        </div>
      </CardContent></Card>

      <Card><CardContent className="space-y-3 p-4">
        <h2 className="font-semibold">Live X-Matrix snapshot</h2>
        {itemsQ.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in the X-Matrix yet — build the cascade first, then review it here.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {counts.map((c) => (
                <div key={c.kind} className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted-foreground">{KIND_LABEL[c.kind]}</p>
                  <p className="text-2xl font-semibold">{c.n}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Flag ok={!noPriorities} text={noPriorities ? "Annual objectives have no improvement priorities beneath them" : "Annual objectives have priorities beneath them"} />
              <Flag ok={noOwner === 0} text={noOwner === 0 ? "Every row has an owner" : `${noOwner} rows without an owner`} />
              <Flag ok={noTarget === 0} text={noTarget === 0 ? "Every metric has a target" : `${noTarget} metrics without a target`} />
            </div>
          </>
        )}
      </CardContent></Card>

      <Card><CardContent className="space-y-3 p-4">
        <h2 className="font-semibold">Cascade audit</h2>
        <p className="text-xs text-muted-foreground">
          The X-Matrix fails when it stays on the wall. Work each line: is it true here, today?
        </p>
        <div className="space-y-2">
          {HOSHIN_CHECKS.map((c) => {
            const f = findingFor(c.key);
            return (
              <div key={c.key} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-[240px] flex-1">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.hint}</p>
                  </div>
                  <div className="flex gap-1">
                    <StateBtn active={f?.state === "ok"} tone="ok" onClick={() => setFinding(c.key, { state: "ok" })}><Check className="h-4 w-4" /></StateBtn>
                    <StateBtn active={f?.state === "gap"} tone="gap" onClick={() => setFinding(c.key, { state: "gap" })}><X className="h-4 w-4" /></StateBtn>
                    <StateBtn active={f?.state === "na"} tone="na" onClick={() => setFinding(c.key, { state: "na" })}><Minus className="h-4 w-4" /></StateBtn>
                  </div>
                </div>
                {f?.state === "gap" && (
                  <Textarea
                    rows={2}
                    className="mt-2"
                    placeholder="Countermeasure — what closes this gap, by when, owned by whom?"
                    defaultValue={f?.note ?? ""}
                    onBlur={(e) => setFinding(c.key, { note: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent></Card>

      <Card><CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Catchball log</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPatch({ catchball: [...catchball, { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), level: "", note: "" }] })}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add entry
          </Button>
        </div>
        {catchball.length === 0 ? (
          <p className="text-sm text-muted-foreground">Record the two-way negotiation: who pushed back, on what target, and what was agreed.</p>
        ) : catchball.map((c) => (
          <div key={c.id} className="flex flex-wrap items-start gap-2 rounded-lg border border-border p-2">
            <Input type="date" className="w-[150px]" defaultValue={c.date} onBlur={(e) => onPatch({ catchball: catchball.map((x) => (x.id === c.id ? { ...x, date: e.target.value } : x)) })} />
            <Input className="w-[200px]" placeholder="Level (e.g. SLT ↔ Machining)" defaultValue={c.level} onBlur={(e) => onPatch({ catchball: catchball.map((x) => (x.id === c.id ? { ...x, level: e.target.value } : x)) })} />
            <Textarea rows={2} className="min-w-[220px] flex-1" placeholder="What was challenged and agreed" defaultValue={c.note} onBlur={(e) => onPatch({ catchball: catchball.map((x) => (x.id === c.id ? { ...x, note: e.target.value } : x)) })} />
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onPatch({ catchball: catchball.filter((x) => x.id !== c.id) })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Textarea rows={3} placeholder="Overall review notes" defaultValue={review.notes ?? ""} onBlur={(e) => onPatch({ notes: e.target.value || null })} />
      </CardContent></Card>
    </div>
  );
}

function Flag({ ok, text }: { ok: boolean; text: string }) {
  return (
    <Badge variant="secondary" className={ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200" : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"}>
      {text}
    </Badge>
  );
}

function StateBtn({ active, tone, onClick, children }: { active: boolean; tone: "ok" | "gap" | "na"; onClick: () => void; children: React.ReactNode }) {
  const cls = active
    ? tone === "ok" ? "bg-emerald-600 text-white hover:bg-emerald-600" : tone === "gap" ? "bg-red-600 text-white hover:bg-red-600" : "bg-muted-foreground text-background"
    : "";
  return <Button size="icon" variant="outline" className={cls} onClick={onClick}>{children}</Button>;
}
