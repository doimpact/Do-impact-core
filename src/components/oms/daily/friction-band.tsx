import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Gauge, AlertTriangle, TrendingDown, TrendingUp, MoreVertical, Plus, Pencil, Archive, ArchiveRestore, Trash2,
} from "lucide-react";
import type { Board, MetricDef, MetricValue } from "./types";
import { isMetricRed, isMetricOnTarget } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export type MetricDraft = {
  label: string;
  unit: string;
  direction: "higher_better" | "lower_better";
  target: number | null;
  redTrigger: number | null;
};

function Sparkline({ points, redFlags }: { points: (number | null)[]; redFlags: boolean[] }) {
  const vals = points.filter((v): v is number => v != null);
  if (vals.length < 2) return <div className="h-6 text-[10px] text-muted-foreground">Not enough data</div>;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const w = 100;
  const h = 24;
  const step = w / Math.max(1, points.length - 1);
  let d = "";
  points.forEach((v, i) => {
    if (v == null) return;
    const x = i * step;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    d += d ? ` L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-primary" />
      {points.map((v, i) =>
        v != null && redFlags[i] ? (
          <circle key={i} cx={i * step} cy={h - ((v - min) / span) * (h - 4) - 2} r={1.8} className="fill-red-500" />
        ) : null,
      )}
    </svg>
  );
}

export function FrictionBand({
  anchor, days, boards, defs, values, consolidated,
  onSetValue, onRaise3C, onSaveDef, onCreateDef, onArchiveDef, onDeleteDef,
}: {
  anchor: Date;
  days: number[];
  boards: Board[];
  defs: MetricDef[];
  values: MetricValue[];
  consolidated?: boolean;
  onSetValue?: (v: { metricDefId: string; boardId: string; valueDate: string; value: number | null }) => void;
  onRaise3C?: (def: MetricDef, date: string, value: number | null) => void;
  onSaveDef?: (v: { id: string } & MetricDraft) => void;
  onCreateDef?: (v: { boardId: string } & MetricDraft) => void;
  onArchiveDef?: (v: { id: string; archived: boolean }) => void;
  onDeleteDef?: (def: MetricDef) => void;
}) {
  const [editingCell, setEditingCell] = useState<{ defId: string; date: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; def: MetricDef } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MetricDef | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const today = isoDay(new Date());

  const manageable = !consolidated && boards.length === 1 && !!onCreateDef;
  const boardId = boards[0]?.id;
  const boardIds = useMemo(() => new Set(boards.map(b => b.id)), [boards]);

  // One logical row per metric key (consolidated averages across boards).
  const rows = useMemo(() => {
    const byKey = new Map<string, MetricDef[]>();
    for (const d of defs) {
      if (!boardIds.has(d.board_id) || !d.active || d.archived_at) continue;
      if (!byKey.has(d.key)) byKey.set(d.key, []);
      byKey.get(d.key)!.push(d);
    }
    return [...byKey.values()]
      .map(list => ({ head: list[0], list }))
      .sort((a, b) => a.head.sort_order - b.head.sort_order);
  }, [defs, boardIds]);

  const archivedDefs = useMemo(
    () => defs.filter(d => boardIds.has(d.board_id) && (d.archived_at || !d.active)),
    [defs, boardIds],
  );

  const valueIndex = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of values) {
      if (v.value == null) continue;
      m.set(`${v.metric_def_id}|${v.value_date}`, Number(v.value));
    }
    return m;
  }, [values]);

  function cellValue(list: MetricDef[], date: string): number | null {
    const nums = list.map(d => valueIndex.get(`${d.id}|${date}`)).filter((v): v is number => v != null);
    if (!nums.length) return null;
    if (list[0].unit === "count") return nums.reduce((a, b) => a + b, 0);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  const dayDates = useMemo(
    () => days.map(d => isoDay(new Date(anchor.getFullYear(), anchor.getMonth(), d))),
    [days, anchor],
  );

  if (rows.length === 0 && !manageable) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <Gauge className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Friction — leading indicators</h3>
        <span className="text-[11px] text-muted-foreground">
          Fix the bottleneck before the output metric turns red.
        </span>
        {manageable && (
          <div className="ml-auto flex items-center gap-1">
            {archivedDefs.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowArchived(s => !s)}>
                {showArchived ? "Hide" : "Show"} archived ({archivedDefs.length})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "create" })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add metric
            </Button>
          </div>
        )}
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-3">
        {rows.map(({ head, list }) => {
          const series = dayDates.map(d => cellValue(list, d));
          const redFlags = series.map(v => isMetricRed(head, v));
          const daysRed = redFlags.filter(Boolean).length;
          const last = [...series].reverse().find(v => v != null) ?? null;
          const red = isMetricRed(head, last);
          const onTarget = isMetricOnTarget(head, last);
          const Trend = head.direction === "higher_better" ? TrendingUp : TrendingDown;
          return (
            <div key={head.key} className={`rounded-lg border bg-card p-3 ${red ? "border-red-300" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium leading-tight">{head.label}</div>
                {manageable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground" title="Manage metric">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDialog({ mode: "edit", def: head })}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit & targets
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchiveDef?.({ id: head.id, archived: true })}>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete(head)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${red ? "text-red-600" : onTarget ? "text-emerald-600" : ""}`}>
                  {last == null ? "—" : head.unit === "count" ? last.toFixed(0) : last.toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground">{head.unit === "count" ? "open" : head.unit}</span>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Trend className="h-3 w-3" />
                  {head.target == null ? "no target" : `tgt ${head.target}`}
                </span>
              </div>
              <div className={red ? "text-red-500" : ""}>
                <Sparkline points={series} redFlags={redFlags} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{daysRed} day{daysRed === 1 ? "" : "s"} at red this month</span>
                {head.red_trigger != null && (
                  <span>trigger {head.direction === "higher_better" ? "<" : ">"} {head.red_trigger}</span>
                )}
              </div>
            </div>
          );
        })}
        {manageable && rows.length === 0 && (
          <div className="rounded-lg border border-dashed bg-card p-4 text-xs text-muted-foreground sm:col-span-2 xl:col-span-4">
            No friction metrics on this board yet. Add one to start tracking leading indicators.
          </div>
        )}
      </div>

      {manageable && showArchived && archivedDefs.length > 0 && (
        <div className="mb-3 rounded-lg border bg-muted/30 p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Archived metrics</div>
          <div className="space-y-1">
            {archivedDefs.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1">{d.label}</span>
                <Button size="sm" variant="ghost" onClick={() => onArchiveDef?.({ id: d.id, archived: false })}>
                  <ArchiveRestore className="mr-1 h-3.5 w-3.5" /> Restore
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(d)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* daily grid */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="sticky left-0 bg-muted/40 text-left px-3 py-2 font-medium min-w-[150px]">Friction metric</th>
              {days.map(d => (
                <th key={d} className="px-1 py-1.5 font-normal text-center border-l text-muted-foreground">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ head, list }) => (
              <tr key={head.key} className="border-b">
                <td className="sticky left-0 bg-card px-3 py-2 font-medium">
                  <div className="leading-tight">{head.label}</div>
                  <div className="text-[10px] text-muted-foreground">{head.unit === "count" ? "count" : "percent"}</div>
                </td>
                {dayDates.map((date, i) => {
                  const v = cellValue(list, date);
                  const red = isMetricRed(head, v);
                  const editable = !consolidated && !!onSetValue;
                  const isEditing = editingCell?.defId === head.id && editingCell.date === date;
                  const bg = v == null
                    ? "bg-muted/50 text-muted-foreground"
                    : red
                    ? "bg-red-500 text-white"
                    : isMetricOnTarget(head, v)
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-400 text-white";
                  return (
                    <td key={date} className="p-0.5 text-center border-l align-top">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="number"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => {
                            const parsed = draft.trim() === "" ? null : Number(draft);
                            onSetValue?.({
                              metricDefId: head.id, boardId: head.board_id, valueDate: date,
                              value: parsed != null && Number.isFinite(parsed) ? parsed : null,
                            });
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingCell(null); }}
                          className="w-9 h-6 rounded border text-center text-[10px] tabular-nums"
                        />
                      ) : (
                        <button
                          disabled={!editable}
                          title={`${head.label} — ${date}${v == null ? "" : ` · ${v.toFixed(head.unit === "count" ? 0 : 0)}`}${editable ? "\nClick to enter today's value" : ""}`}
                          onClick={() => {
                            if (!editable) return;
                            setDraft(v == null ? "" : String(Math.round(v)));
                            setEditingCell({ defId: head.id, date });
                          }}
                          className={`w-7 h-6 rounded ${bg} mx-auto flex items-center justify-center text-[9px] font-semibold tabular-nums ${date === today ? "ring-2 ring-primary/60" : ""} ${editable ? "hover:opacity-80" : "cursor-default"}`}
                        >
                          {v == null ? "" : Math.round(v)}
                        </button>
                      )}
                      {red && !consolidated && onRaise3C && (
                        <button
                          onClick={() => onRaise3C(head, date, v)}
                          className="mx-auto mt-0.5 block text-[9px] text-red-600 hover:underline"
                          title="Raise a 3C for this friction"
                        >
                          3C
                        </button>
                      )}
                      {red && consolidated && (
                        <div className="mt-0.5 flex justify-center"><AlertTriangle className="h-2.5 w-2.5 text-red-600" /></div>
                      )}
                      {i < 0 && null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
          {consolidated
            ? "Rolled up across active boards — percentages averaged, counts summed."
            : "Click a cell to enter the day's value. Colour is set automatically against the target and red trigger."}
        </div>
      </div>

      {dialog && (
        <MetricDialog
          def={dialog.mode === "edit" ? dialog.def : null}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            if (dialog.mode === "edit") onSaveDef?.({ id: dialog.def.id, ...v });
            else if (boardId) onCreateDef?.({ boardId, ...v });
          }}
        />
      )}

      {confirmDelete && (
        <Dialog open onOpenChange={(v) => !v && setConfirmDelete(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete “{confirmDelete.label}”?</DialogTitle>
              <DialogDescription>
                This permanently removes the metric and every daily value recorded against it.
                Any 3Cs raised from it stay, but lose the link.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => { onDeleteDef?.(confirmDelete); setConfirmDelete(null); }}
              >
                Delete metric
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const UNITS = [
  { value: "%", label: "Percent (%)" },
  { value: "count", label: "Count" },
  { value: "hrs", label: "Hours" },
  { value: "days", label: "Days" },
];

function MetricDialog({
  def, onClose, onSave,
}: {
  def: MetricDef | null;
  onClose: () => void;
  onSave: (v: MetricDraft) => void;
}) {
  const [label, setLabel] = useState(def?.label ?? "");
  const [unit, setUnit] = useState(def?.unit ?? "%");
  const [direction, setDirection] = useState<"higher_better" | "lower_better">(def?.direction ?? "higher_better");
  const [target, setTarget] = useState(def?.target == null ? "" : String(def.target));
  const [trigger, setTrigger] = useState(def?.red_trigger == null ? "" : String(def.red_trigger));
  const num = (s: string) => (s.trim() === "" ? null : Number(s));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{def ? def.label : "New friction metric"}</DialogTitle>
          <DialogDescription>
            {direction === "higher_better"
              ? "Higher is better — the day turns red below the trigger."
              : "Lower is better — the day turns red above the trigger."}
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-xs text-muted-foreground">Metric name</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Kit completeness" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Unit</label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Direction</label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "higher_better" | "lower_better")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="higher_better">Higher is better</SelectItem>
                <SelectItem value="lower_better">Lower is better</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Target</label>
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Red trigger</label>
            <Input type="number" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!label.trim()}
            onClick={() => {
              onSave({ label: label.trim(), unit, direction, target: num(target), redTrigger: num(trigger) });
              onClose();
            }}
          >
            {def ? "Save" : "Add metric"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
