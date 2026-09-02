import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { Category, ReasonCode } from "./types";
import { CATEGORY_ACCENTS } from "./category-meta";

export function ReasonCodeManager({
  reasonCodes, categories, open, onClose, onCreate, onUpdate, onDelete,
}: {
  reasonCodes: ReasonCode[];
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onCreate: (v: { label: string; categoryKey: string | null; color: string }) => void;
  onUpdate: (v: { id: string; label?: string; categoryKey?: string | null; color?: string; sortOrder?: number; archived?: boolean }) => void;
  onDelete: (r: ReasonCode) => void;
}) {
  const [label, setLabel] = useState("");
  const [categoryKey, setCategoryKey] = useState<string>("all");
  const [color, setColor] = useState(CATEGORY_ACCENTS[0]!.value);
  const [confirm, setConfirm] = useState<ReasonCode | null>(null);

  const active = reasonCodes.filter(r => !r.archived_at);
  const archived = reasonCodes.filter(r => r.archived_at);

  function move(r: ReasonCode, dir: -1 | 1) {
    const idx = active.findIndex(x => x.id === r.id);
    const other = active[idx + dir];
    if (!other) return;
    onUpdate({ id: r.id, sortOrder: other.sort_order });
    onUpdate({ id: other.id, sortOrder: r.sort_order });
  }

  function submit() {
    const l = label.trim();
    if (!l) return;
    onCreate({ label: l, categoryKey: categoryKey === "all" ? null : categoryKey, color });
    setLabel("");
    setCategoryKey("all");
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Red-day reason codes</DialogTitle>
            <DialogDescription>
              Tag every red day with a reason so the Pareto shows what is really driving red.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 max-h-72 overflow-y-auto">
            {active.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 rounded border px-2 py-1.5">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 bg-current ${r.color}`} />
                <Input
                  className="h-8 flex-1"
                  value={r.label}
                  onChange={(e) => onUpdate({ id: r.id, label: e.target.value })}
                />
                <select
                  className="h-8 rounded border bg-background px-1 text-xs"
                  value={r.category_key ?? "all"}
                  onChange={(e) => onUpdate({ id: r.id, categoryKey: e.target.value === "all" ? null : e.target.value })}
                >
                  <option value="all">All rows</option>
                  {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select
                  className="h-8 rounded border bg-background px-1 text-xs"
                  value={r.color}
                  onChange={(e) => onUpdate({ id: r.id, color: e.target.value })}
                >
                  {CATEGORY_ACCENTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(r, -1)}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === active.length - 1} onClick={() => move(r, 1)}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Archive" onClick={() => onUpdate({ id: r.id, archived: true })}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" title="Delete" onClick={() => setConfirm(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {active.length === 0 && (
              <p className="text-xs text-muted-foreground px-1 py-2">No reason codes yet. Add one below.</p>
            )}
          </div>

          {archived.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Archived</p>
              {archived.map(r => (
                <div key={r.id} className="flex items-center gap-2 rounded border bg-muted/40 px-2 py-1.5">
                  <span className="flex-1 text-sm">{r.label}</span>
                  <Button size="sm" variant="outline" onClick={() => onUpdate({ id: r.id, archived: false })}>
                    <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => setConfirm(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">New reason</label>
              <Input className="h-8" value={label} placeholder="e.g. Fixture unavailable" onChange={(e) => setLabel(e.target.value)} />
            </div>
            <select
              className="h-8 rounded border bg-background px-1 text-xs"
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
            >
              <option value="all">All rows</option>
              {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select
              className="h-8 rounded border bg-background px-1 text-xs"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {CATEGORY_ACCENTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button size="sm" onClick={submit}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{confirm?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Red days tagged with this reason become untagged. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (confirm) onDelete(confirm); setConfirm(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
