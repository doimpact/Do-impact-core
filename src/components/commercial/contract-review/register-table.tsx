import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { riskRating } from "@/lib/bid-contract-review";
import { ItemDialog, KIND_LABEL, statusLabel, type ItemKind } from "./item-dialog";
import { useBidReviewMutations, type BidReviewItem } from "./use-bid-reviews";
import { confirmThen } from "@/components/confirm-dialog";

const RISK_TONE: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  muted: "bg-muted text-muted-foreground",
};

export function RegisterTable({
  kind, reviewId, items, emptyHint, showReview,
}: {
  kind: ItemKind;
  reviewId?: string;
  items: BidReviewItem[];
  emptyHint?: string;
  showReview?: (id: string) => string;
}) {
  const { saveItem, deleteItem } = useBidReviewMutations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BidReviewItem | null>(null);

  const rows = items.filter((i) => i.kind === kind);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "entry" : "entries"}</p>
        {reviewId && (
          <Button size="sm" variant="outline" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </div>

      {rows.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {emptyHint ?? `No ${KIND_LABEL[kind].toLowerCase()} entries yet.`}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => {
          const rating = kind === "risk" ? riskRating(r.probability, r.impact) : null;
          return (
            <div key={r.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.ref && <span className="text-xs text-muted-foreground font-mono">{r.ref}</span>}
                    <span className="font-medium text-sm">{r.title}</span>
                    <Badge variant="secondary">{statusLabel(r.kind, r.status)}</Badge>
                    {rating && <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${RISK_TONE[rating.tone]}`}>{rating.label} · {rating.score}</span>}
                    {showReview && <span className="text-xs text-muted-foreground">{showReview(r.review_id)}</span>}
                  </div>
                  {r.detail && <p className="text-sm text-muted-foreground mt-1">{r.detail}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {Object.entries(r.data ?? {}).filter(([, v]) => v !== "" && v !== null && v !== undefined && typeof v !== "boolean").map(([k, v]) => (
                      <span key={k}><span className="capitalize">{k.replace(/_/g, " ")}:</span> <span className="text-foreground">{String(v)}</span></span>
                    ))}
                    {r.owner_name && <span>Owner: <span className="text-foreground">{r.owner_name}</span></span>}
                    {r.due_date && <span>Due: <span className="text-foreground">{r.due_date}</span></span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirmThen(
                    { title: "Delete entry?", description: "This removes the register entry permanently.", confirmLabel: "Delete" },
                    () => deleteItem.mutate(r.id),
                  )} aria-label="Delete"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ItemDialog
        open={open}
        onOpenChange={setOpen}
        kind={kind}
        reviewId={editing?.review_id ?? reviewId ?? ""}
        item={editing}
        onSave={(row) => saveItem.mutate(row)}
      />
    </div>
  );
}
