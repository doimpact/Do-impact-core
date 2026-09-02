import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { GATES, GATE_DECISIONS, GATE_TOTALS, riskRating } from "@/lib/bid-contract-review";
import { RegisterTable } from "./register-table";
import { useBidReviewGates, useBidReviewItems, useBidReviewMutations, type BidReview, type BidReviewGate } from "./use-bid-reviews";

export function ReviewDetail({ review, onOpenChange }: { review: BidReview | null; onOpenChange: (v: boolean) => void }) {
  const { data: gates } = useBidReviewGates(review?.id);
  const { data: items } = useBidReviewItems(review?.id);

  return (
    <Sheet open={!!review} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        {review && (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {review.reference && <span className="font-mono text-xs text-muted-foreground">{review.reference}</span>}
                {review.title}
              </SheetTitle>
              <SheetDescription>
                {review.accounts?.name ?? review.customer_name ?? "—"}
                {review.product_program ? ` · ${review.product_program}` : ""}
                {review.bid_due_date ? ` · bid due ${review.bid_due_date}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4">
              <Tabs defaultValue={`g${review.current_gate}`}>
                <TabsList className="flex flex-wrap h-auto">
                  {GATES.map((g) => <TabsTrigger key={g.key} value={g.key}>G{g.n} {g.short}</TabsTrigger>)}
                  <TabsTrigger value="registers">Registers</TabsTrigger>
                </TabsList>

                {GATES.map((g) => (
                  <TabsContent key={g.key} value={g.key} className="mt-4">
                    <GatePanel
                      review={review}
                      gateN={g.n}
                      gate={(gates ?? []).find((x) => x.gate === g.n) ?? null}
                      openRisks={(items ?? []).filter((i) => i.kind === "risk" && i.status !== "accepted" && i.status !== "closed" && riskRating(i.probability, i.impact).tone === "high").length}
                      openExceptions={(items ?? []).filter((i) => i.kind === "assumption_exception" && (i.status === "open" || i.status === "negotiating")).length}
                    />
                  </TabsContent>
                ))}

                <TabsContent value="registers" className="mt-4 space-y-6">
                  <Section title="Requirements compliance matrix">
                    <RegisterTable kind="requirement" reviewId={review.id} items={items ?? []} />
                  </Section>
                  <Section title="Assumptions & exceptions">
                    <RegisterTable kind="assumption_exception" reviewId={review.id} items={items ?? []} />
                  </Section>
                  <Section title="Contract risk register">
                    <RegisterTable kind="risk" reviewId={review.id} items={items ?? []} />
                  </Section>
                  <Section title="Ongoing review log">
                    <RegisterTable kind="ongoing" reviewId={review.id} items={items ?? []} />
                  </Section>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function GatePanel({
  review, gateN, gate, openRisks, openExceptions,
}: {
  review: BidReview;
  gateN: number;
  gate: BidReviewGate | null;
  openRisks: number;
  openExceptions: number;
}) {
  const def = GATES[gateN - 1];
  const { saveGate, saveReview } = useBidReviewMutations();
  const [notes, setNotes] = useState(gate?.notes ?? "");
  const [approver, setApprover] = useState(gate?.approver ?? "");
  const [decidedOn, setDecidedOn] = useState(gate?.decided_on ?? "");
  const [decision, setDecision] = useState(gate?.decision ?? "");

  const checklist = gate?.checklist ?? {};
  const done = useMemo(
    () => def.sections.reduce((n, s) => n + s.items.filter((i) => checklist[i.id]?.done).length, 0),
    [def, checklist],
  );
  const total = GATE_TOTALS[gateN - 1];
  const pct = total ? Math.round((done / total) * 100) : 0;

  const blocked = gateN === 3 && (openRisks > 0 || openExceptions > 0);

  function toggle(itemId: string, value: boolean) {
    saveGate.mutate({
      review_id: review.id,
      gate: gateN,
      checklist: { ...checklist, [itemId]: { ...(checklist[itemId] ?? {}), done: value } },
    });
  }

  function saveDecision() {
    saveGate.mutate({
      review_id: review.id, gate: gateN,
      checklist, decision: decision || null, decided_on: decidedOn || null,
      approver: approver || null, notes: notes || null,
    });
    if (decision && review.current_gate <= gateN && gateN < 5) {
      saveReview.mutate({ id: review.id, current_gate: gateN + 1 });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{def.title}</h3>
        <p className="text-sm text-muted-foreground">{def.purpose}</p>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={pct} className="h-2 max-w-xs" />
          <span className="text-xs text-muted-foreground">{done}/{total} checked</span>
        </div>
      </div>

      {blocked && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
          <p>
            {openExceptions > 0 && <>{openExceptions} unresolved contract exception{openExceptions === 1 ? "" : "s"}. </>}
            {openRisks > 0 && <>{openRisks} high risk{openRisks === 1 ? "" : "s"} not yet accepted. </>}
            Resolve or formally accept these before approving Gate 3.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {def.sections.map((s) => (
          <div key={s.id} className="rounded-md border p-3">
            <h4 className="text-sm font-medium mb-2">{s.title}</h4>
            <div className="space-y-1.5">
              {s.items.map((i) => (
                <label key={i.id} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox checked={!!checklist[i.id]?.done} onCheckedChange={(v) => toggle(i.id, !!v)} className="mt-0.5" />
                  <span className={checklist[i.id]?.done ? "text-muted-foreground line-through" : ""}>{i.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-md border p-3 space-y-3">
        <h4 className="text-sm font-medium">Decision</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Outcome</Label>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger><SelectValue placeholder="Not decided" /></SelectTrigger>
              <SelectContent>{(GATE_DECISIONS[gateN] ?? []).map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Date</Label><Input type="date" value={decidedOn} onChange={(e) => setDecidedOn(e.target.value)} /></div>
          <div><Label>Approver</Label><Input value={approver} onChange={(e) => setApprover(e.target.value)} /></div>
        </div>
        <div><Label>Notes / conditions</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={saveDecision} disabled={blocked && !!decision && decision.startsWith("approved")}>Save decision</Button>
          {gate?.decision && <Badge variant="secondary">Recorded: {(GATE_DECISIONS[gateN] ?? []).find((d) => d.value === gate.decision)?.label ?? gate.decision}</Badge>}
        </div>
      </div>
    </div>
  );
}
