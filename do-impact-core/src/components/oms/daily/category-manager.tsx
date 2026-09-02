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
import {
  Archive, ArchiveRestore, ChevronDown, ChevronUp, Plus, Trash2,
} from "lucide-react";
import type { Category } from "./types";
import { CATEGORY_ACCENTS, CATEGORY_ICONS, CategoryIcon } from "./category-meta";

export function CategoryManager({
  categories, open, onClose, onCreate, onUpdate, onDelete,
}: {
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onCreate: (v: { label: string; accent: string; icon: string }) => void;
  onUpdate: (v: { id: string; label?: string; accent?: string; icon?: string; sortOrder?: number; archived?: boolean }) => void;
  onDelete: (c: Category) => void;
}) {
  const [label, setLabel] = useState("");
  const [accent, setAccent] = useState(CATEGORY_ACCENTS[0]!.value);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]!.name);
  const [confirm, setConfirm] = useState<Category | null>(null);

  const active = categories.filter(c => !c.archived_at);
  const archived = categories.filter(c => c.archived_at);

  function move(c: Category, dir: -1 | 1) {
    const idx = active.findIndex(x => x.id === c.id);
    const other = active[idx + dir];
    if (!other) return;
    onUpdate({ id: c.id, sortOrder: other.sort_order });
    onUpdate({ id: other.id, sortOrder: c.sort_order });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Board categories</DialogTitle>
            <DialogDescription>
              These rows apply to every board in this workspace and to the consolidated roll-up.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {active.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 rounded border px-2 py-1.5">
                <CategoryIcon name={c.icon} className={`h-4 w-4 shrink-0 ${c.accent}`} />
                <Input
                  className="h-8 flex-1"
                  value={c.label}
                  onChange={(e) => onUpdate({ id: c.id, label: e.target.value })}
                />
                <select
                  className="h-8 rounded border bg-background px-1 text-xs"
                  value={c.icon}
                  onChange={(e) => onUpdate({ id: c.id, icon: e.target.value })}
                >
                  {CATEGORY_ICONS.map(o => <option key={o.name} value={o.name}>{o.label}</option>)}
                </select>
                <select
                  className="h-8 rounded border bg-background px-1 text-xs"
                  value={c.accent}
                  onChange={(e) => onUpdate({ id: c.id, accent: e.target.value })}
                >
                  {CATEGORY_ACCENTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => move(c, -1)}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === active.length - 1} onClick={() => move(c, 1)}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Archive" onClick={() => onUpdate({ id: c.id, archived: true })}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" title="Delete" onClick={() => setConfirm(c)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {active.length === 0 && (
              <p className="rounded border border-dashed p-3 text-xs text-muted-foreground">
                No categories yet. Add one below.
              </p>
            )}
          </div>

          {archived.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-2">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Archived</div>
              {archived.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs py-0.5">
                  <span className="flex-1">{c.label}</span>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate({ id: c.id, archived: false })}>
                    <ArchiveRestore className="mr-1 h-3.5 w-3.5" /> Restore
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => setConfirm(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 border-t pt-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">New category</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Cost" className="h-8" />
            </div>
            <select className="h-8 rounded border bg-background px-1 text-xs" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {CATEGORY_ICONS.map(o => <option key={o.name} value={o.name}>{o.label}</option>)}
            </select>
            <select className="h-8 rounded border bg-background px-1 text-xs" value={accent} onChange={(e) => setAccent(e.target.value)}>
              {CATEGORY_ACCENTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button
              size="sm"
              disabled={!label.trim()}
              onClick={() => { onCreate({ label: label.trim(), accent, icon }); setLabel(""); }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirm?.label}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Every daily mark and 3C recorded against this category is removed on all boards. This cannot be undone.
              Archive instead if you only want to hide the row.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
