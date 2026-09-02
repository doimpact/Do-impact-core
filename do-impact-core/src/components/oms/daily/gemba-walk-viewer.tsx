import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Footprints, Trash2 } from "lucide-react";
import type { Board } from "./types";

export type GembaWalkItem = {
  id: string;
  label: string | null;
  depth_score: number | null;
  note: string | null;
  escalation_id: string | null;
  metric_def_id: string | null;
  sort_order: number | null;
};

export type GembaWalk = {
  id: string;
  board_id: string;
  walked_on: string;
  avg_depth: number | null;
  notes?: string | null;
  dm_gemba_items?: GembaWalkItem[] | null;
};

export function depthClass(v: number | null | undefined) {
  if (v == null) return "text-muted-foreground";
  if (v >= 4) return "text-emerald-600";
  if (v >= 3) return "text-amber-600";
  return "text-red-600";
}

export function boardName(boards: Board[], id: string) {
  return boards.find((b) => b.id === id)?.name ?? "Board";
}

/** Read-only detail of one recorded coaching walk. */
export function GembaWalkViewer({
  walk, boards, canDelete, onDelete, onClose,
}: {
  walk: GembaWalk;
  boards: Board[];
  canDelete: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const items = [...(walk.dm_gemba_items ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Footprints className="h-4 w-4 text-primary" />
            Gemba walk — {boardName(boards, walk.board_id)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>Walked on <span className="font-medium text-foreground">{walk.walked_on}</span></span>
          <span>
            Average depth{" "}
            <span className={`font-bold tabular-nums ${depthClass(walk.avg_depth)}`}>
              {walk.avg_depth == null ? "—" : Number(walk.avg_depth).toFixed(1)}
            </span>{" "}
            / 5
          </span>
          <span>{items.length} item{items.length === 1 ? "" : "s"} coached</span>
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {items.length === 0 && (
            <p className="rounded border border-dashed p-4 text-center text-sm text-muted-foreground">
              No items were scored on this walk.
            </p>
          )}
          {items.map((it) => (
            <div key={it.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium">{it.label || "Untitled item"}</div>
                <div className={`shrink-0 text-sm font-bold tabular-nums ${depthClass(it.depth_score)}`}>
                  {it.depth_score == null ? "—" : `${it.depth_score}/5`}
                </div>
              </div>
              {it.note && <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{it.note}</p>}
            </div>
          ))}
        </div>

        {walk.notes && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Walk notes</div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{walk.notes}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {canDelete ? (
            <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete walk
            </Button>
          ) : <span />}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** All recorded walks, newest first. */
export function GembaWalkList({
  walks, boards, onOpen, onClose,
}: {
  walks: GembaWalk[];
  boards: Board[];
  onOpen: (w: GembaWalk) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gemba walks</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
          {walks.length === 0 && (
            <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              No coaching walks recorded yet.
            </p>
          )}
          {walks.map((w) => (
            <button
              key={w.id}
              onClick={() => onOpen(w)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/60"
            >
              <div>
                <div className="text-sm font-medium">{boardName(boards, w.board_id)}</div>
                <div className="text-xs text-muted-foreground">
                  {w.walked_on} · {(w.dm_gemba_items?.length ?? 0)} item{(w.dm_gemba_items?.length ?? 0) === 1 ? "" : "s"}
                </div>
              </div>
              <div className={`text-sm font-bold tabular-nums ${depthClass(w.avg_depth)}`}>
                {w.avg_depth == null ? "—" : Number(w.avg_depth).toFixed(1)}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
