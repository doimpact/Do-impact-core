import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { formatMoney } from "@/lib/csar";
import { GATES, REVIEW_STATUS, riskRating } from "@/lib/bid-contract-review";
import { confirmThen } from "@/components/confirm-dialog";
import { ReviewDialog } from "./review-dialog";
import { ReviewDetail } from "./review-detail";
import { useBidReviewItems, useBidReviewMutations, useBidReviews, type BidReview } from "./use-bid-reviews";

export function ReviewsTab() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: reviews, isLoading } = useBidReviews(showArchived);
  const { data: allItems } = useBidReviewItems(undefined, true);
  const { saveReview, deleteReview } = useBidReviewMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BidReview | null>(null);
  const [detail, setDetail] = useState<BidReview | null>(null);

  const list = reviews ?? [];

  const kpis = useMemo(() => {
    const items = allItems ?? [];
    const total = list.length;
    const reviewedBeforeSubmission = list.filter((r) => r.current_gate > 2 || r.status !== "in_review").length;
    const won = list.filter((r) => r.status === "won" || r.status === "handed_off").length;
    const decided = list.filter((r) => ["won", "lost", "handed_off", "no_bid"].includes(r.status)).length;
    const openExceptions = items.filter((i) => i.kind === "assumption_exception" && (i.status === "open" || i.status === "negotiating")).length;
    const highRisks = items.filter((i) => i.kind === "risk" && riskRating(i.probability, i.impact).tone === "high" && i.status !== "closed").length;
    return [
      { label: "Active reviews", value: String(total) },
      { label: "Past bid approval", value: total ? `${Math.round((reviewedBeforeSubmission / total) * 100)}%` : "—" },
      { label: "Win rate", value: decided ? `${Math.round((won / decided) * 100)}%` : "—" },
      { label: "Open exceptions", value: String(openExceptions) },
      { label: "High risks", value: String(highRisks) },
    ];
  }, [list, allItems]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          One record per RFQ, bid or contract. Nothing goes to the customer until the functions that have to deliver it
          have reviewed and accepted the commitment.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New bid review
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-xl font-semibold">{k.value}</div>
          </CardContent></Card>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && list.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No bid reviews yet. Start one as soon as a significant RFQ lands — within 1–3 business days.
        </div>
      )}

      <div className="space-y-3">
        {list.map((r) => (
          <Card key={r.id} className={r.archived ? "opacity-60" : undefined}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" className="text-left min-w-0" onClick={() => setDetail(r)}>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.reference && <span className="text-xs font-mono text-muted-foreground">{r.reference}</span>}
                    <span className="font-medium hover:underline">{r.title}</span>
                    <Badge variant="secondary">{REVIEW_STATUS.find((s) => s.value === r.status)?.label ?? r.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.accounts?.name ?? r.customer_name ?? "—"}
                    {r.product_program && <> · {r.product_program}</>}
                    {r.est_revenue > 0 && <> · {formatMoney(r.est_revenue, r.currency)}</>}
                    {r.bid_due_date && <> · due {r.bid_due_date}</>}
                    {r.owner_name && <> · {r.owner_name}</>}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={r.archived ? "Restore" : "Archive"}
                    onClick={() => saveReview.mutate({ id: r.id, archived: !r.archived })}>
                    {r.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirmThen(
                    { title: "Delete bid review?", description: "This removes the review, its gates and all register entries.", confirmLabel: "Delete" },
                    () => deleteReview.mutate(r.id),
                  )}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {GATES.map((g, i) => (
                  <span key={g.key} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetail(r)}
                      className={`rounded px-2 py-1 text-xs border transition-colors ${
                        r.current_gate > g.n ? "bg-primary/10 border-primary/30 text-primary"
                        : r.current_gate === g.n ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400"
                        : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      G{g.n} {g.short}
                    </button>
                    {i < GATES.length - 1 && <span className="text-xs text-muted-foreground">→</span>}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReviewDialog open={dialogOpen} onOpenChange={setDialogOpen} review={editing} onSave={(row) => saveReview.mutate(row)} />
      <ReviewDetail review={detail} onOpenChange={(v) => { if (!v) setDetail(null); }} />
    </div>
  );
}
