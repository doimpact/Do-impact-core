import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { ActionRow, ActionStatus, MODULE_TONE, isOverdue, todayISO } from "@/lib/execution-actions";
import { ProgressBar, rollup } from "@/lib/execution-rollups";
import { editCaps, statusOptions, useUpdateAction } from "@/lib/execution-mutations";

const COLUMNS: { key: ActionStatus; label: string; tone: string }[] = [
  { key: "open", label: "Open", tone: "bg-neutral-100 text-neutral-800" },
  { key: "in_progress", label: "In progress", tone: "bg-blue-100 text-blue-800" },
  { key: "blocked", label: "Blocked", tone: "bg-red-100 text-red-800" },
  { key: "done", label: "Done", tone: "bg-emerald-100 text-emerald-800" },
];

const LABEL: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

const DRAG_THRESHOLD = 6;

export function BoardTab({
  rows,
  swimlane,
  onSelect,
}: {
  rows: ActionRow[];
  swimlane: "none" | "module" | "owner";
  onSelect: (r: ActionRow) => void;
}) {
  const today = todayISO();
  const update = useUpdateAction();

  // key = `${laneKey}|${status}` -> column element
  const colRefs = useRef(new Map<string, HTMLElement>());
  const [drag, setDrag] = useState<{ row: ActionRow; x: number; y: number; active: boolean } | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const lanes = useMemo(() => {
    if (swimlane === "none") return [{ key: "All actions", rows }];
    const map = new Map<string, ActionRow[]>();
    for (const r of rows) {
      const key = swimlane === "module" ? r.module : (r.owner_name ?? "Unassigned");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map, ([key, v]) => ({ key, rows: v })).sort((a, b) => b.rows.length - a.rows.length);
  }, [rows, swimlane]);

  const move = (row: ActionRow, status: ActionStatus) => {
    if (row.status === status) return;
    const caps = editCaps(row.source);
    if (!caps.status) {
      toast.error("This action can only be updated in its module.");
      return;
    }
    if (!statusOptions(row.source).includes(status)) {
      toast.error(`${row.module} items only support Open / Done.`);
      return;
    }
    update.mutate({ row, patch: { status } });
  };

  const colKeyAt = (x: number, y: number): string | null => {
    for (const [key, el] of colRefs.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return key;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, row: ActionRow) => {
    if (!editCaps(row.source).status) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ row, x: e.clientX, y: e.clientY, active: false });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const active = drag.active || Math.hypot(dx, dy) > DRAG_THRESHOLD;
    if (!active) return;
    e.preventDefault();
    setDrag({ ...drag, x: e.clientX, y: e.clientY, active: true });
    setOverCol(colKeyAt(e.clientX, e.clientY));
  };

  const onPointerUp = (e: React.PointerEvent, row: ActionRow) => {
    const wasDragging = drag?.active;
    const target = wasDragging ? colKeyAt(e.clientX, e.clientY) : null;
    setDrag(null);
    setOverCol(null);
    startRef.current = null;
    if (!wasDragging) {
      onSelect(row);
      return;
    }
    if (!target) return;
    const status = target.slice(target.lastIndexOf("|") + 1) as ActionStatus;
    move(row, status);
  };

  return (
    <div className="space-y-5">
      {lanes.map((lane) => {
        const laneRoll = rollup(lane.rows, today);
        return (
          <div key={lane.key}>
            {swimlane !== "none" && (
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold">{lane.key}</h3>
                <Badge variant="secondary" className="text-[10px]">{lane.rows.length}</Badge>
                <div className="w-28"><ProgressBar pct={laneRoll.pct} /></div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {laneRoll.pct}% · {laneRoll.done}/{laneRoll.total}
                </span>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-4">
              {COLUMNS.map((col) => {
                const items = lane.rows.filter((r) => r.status === col.key);
                const key = lane.key + "|" + col.key;
                return (
                  <div
                    key={col.key}
                    ref={(el) => {
                      if (el) colRefs.current.set(key, el);
                      else colRefs.current.delete(key);
                    }}
                    className={`rounded-lg border bg-muted/20 transition-colors ${overCol === key ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${col.tone}`}>{col.label}</span>
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <div className="p-2 space-y-2 max-h-[520px] overflow-y-auto">
                      {items.length === 0 && <div className="text-[11px] text-muted-foreground px-1 py-3 text-center">—</div>}
                      {items.map((r) => {
                        const caps = editCaps(r.source);
                        const dragging = drag?.active && drag.row.id === r.id;
                        return (
                          <div
                            key={r.id}
                            role="button"
                            tabIndex={0}
                            onPointerDown={(e) => onPointerDown(e, r)}
                            onPointerMove={onPointerMove}
                            onPointerUp={(e) => onPointerUp(e, r)}
                            onPointerCancel={() => { setDrag(null); setOverCol(null); startRef.current = null; }}
                            onClick={() => { if (!caps.status) onSelect(r); }}
                            onKeyDown={(e) => { if (e.key === "Enter") onSelect(r); }}
                            style={caps.status ? { touchAction: "none" } : undefined}
                            className={`w-full text-left rounded-md border bg-background p-2 hover:bg-muted/50 transition-colors ${caps.status ? "cursor-grab active:cursor-grabbing select-none" : "cursor-pointer"} ${dragging ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start gap-1.5 mb-1">
                              {caps.status && <GripVertical className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />}
                              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                <span className={`text-[9px] px-1 py-0.5 rounded font-semibold ${MODULE_TONE[r.module]}`}>{r.module}</span>
                                {isOverdue(r, today) && (
                                  <span className="text-[9px] px-1 py-0.5 rounded font-semibold bg-red-100 text-red-800">Overdue</span>
                                )}
                              </div>
                              {caps.status && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 -mt-0.5 -mr-0.5 shrink-0"
                                      aria-label="Move action"
                                      onPointerDown={(e) => e.stopPropagation()}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuLabel className="text-xs">Move to</DropdownMenuLabel>
                                    {statusOptions(r.source).map((s) => (
                                      <DropdownMenuItem
                                        key={s}
                                        disabled={s === r.status}
                                        onSelect={() => move(r, s)}
                                      >
                                        {LABEL[s]}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem onSelect={() => onSelect(r)}>Open details…</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <div className="text-xs font-medium line-clamp-2">{r.title || "(untitled)"}</div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="truncate">{r.owner_name ?? "Unassigned"}</span>
                              <span>{r.due_date ?? "—"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No actions match these filters.</CardContent></Card>
      )}
      <p className="text-[11px] text-muted-foreground">
        Drag a card onto another column, or tap the ••• menu on a card to move it — both work on touch. Tap the card itself to edit owner and due date. Done items appear when “Show done” is on.
      </p>
    </div>
  );
}
