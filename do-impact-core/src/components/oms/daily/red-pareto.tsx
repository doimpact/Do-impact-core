import { useMemo, useState } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { Category, Mark, ReasonCode } from "./types";
import { PARETO_PERIODS, formatRangeLabel, type ParetoPeriod } from "@/lib/oms-pareto-period";

const UNTAGGED = "__untagged__";

export function RedPareto({
  marks, reasonCodes, categories, boards, onManage, onSelectReason, selectedReasonId,
  collapsed, onToggleCollapsed, period, onPeriodChange, rangeFrom, rangeTo,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  marks: Mark[];
  reasonCodes: ReasonCode[];
  categories: Category[];
  boards: { id: string; name: string }[];
  onManage?: () => void;
  onSelectReason?: (id: string | null) => void;
  selectedReasonId?: string | null;
  period: ParetoPeriod;
  onPeriodChange: (p: ParetoPeriod) => void;
  rangeFrom: string;
  rangeTo: string;
}) {
  const [catFilter, setCatFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");


  const boardIds = useMemo(() => new Set(boards.map(b => b.id)), [boards]);
  const labelById = useMemo(() => new Map(reasonCodes.map(r => [r.id, r.label])), [reasonCodes]);

  const reds = useMemo(() => marks.filter(m =>
    m.status === "red"
    && boardIds.has(m.board_id)
    && (catFilter === "all" || m.category === catFilter)
    && (boardFilter === "all" || m.board_id === boardFilter)
  ), [marks, boardIds, catFilter, boardFilter]);

  const rows = useMemo(() => {
    const counts = new Map<string, { count: number; byBoard: Map<string, number> }>();
    for (const m of reds) {
      const key = m.reason_code_id ?? UNTAGGED;
      if (!counts.has(key)) counts.set(key, { count: 0, byBoard: new Map() });
      const e = counts.get(key)!;
      e.count += 1;
      e.byBoard.set(m.board_id, (e.byBoard.get(m.board_id) ?? 0) + 1);
    }
    const list = [...counts.entries()].map(([id, v]) => ({
      id,
      label: id === UNTAGGED ? "Untagged" : (labelById.get(id) ?? "Deleted reason"),
      count: v.count,
      byBoard: [...v.byBoard.entries()]
        .map(([bid, n]) => `${boards.find(b => b.id === bid)?.name ?? "Board"}: ${n}`)
        .join(" · "),
    })).sort((a, b) => b.count - a.count);
    const total = list.reduce((s, r) => s + r.count, 0) || 1;
    let run = 0;
    return list.map(r => {
      run += r.count;
      return { ...r, cum: Math.round((run / total) * 100) };
    });
  }, [reds, labelById, boards]);

  const totalRed = reds.length;
  const tagged = reds.filter(m => m.reason_code_id).length;
  const tagPct = totalRed ? Math.round((tagged / totalRed) * 100) : null;

  return (
    <div className="rounded-lg border bg-card p-3 mb-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className="text-sm font-semibold">Why red?</h3>
          <p className="text-[11px] text-muted-foreground">
            {formatRangeLabel(rangeFrom, rangeTo)} · {totalRed} red day{totalRed === 1 ? "" : "s"}
            {tagPct == null ? "" : ` · ${tagPct}% tagged with a reason`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-8 rounded border bg-background px-2 text-xs"
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as ParetoPeriod)}
            aria-label="Period"
          >
            {PARETO_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="h-8 rounded border bg-background px-2 text-xs" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {boards.length > 1 && (
            <select className="h-8 rounded border bg-background px-2 text-xs" value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)}>
              <option value="all">All boards</option>
              {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {onToggleCollapsed && (
            <Button size="sm" variant="ghost" onClick={onToggleCollapsed}>
              {collapsed ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronUp className="h-4 w-4 mr-1" />}
              {collapsed ? "Show" : "Hide"}
            </Button>
          )}
          {!collapsed && onManage && (
            <Button size="sm" variant="outline" onClick={onManage}>
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Reason codes
            </Button>
          )}
        </div>
      </div>

      {collapsed ? null : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No red days in this period. Red days you tag with a reason show up here as a Pareto.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={46} />
              <YAxis yAxisId="l" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v: number | string, name: string) => name === "Cumulative" ? [`${v}%`, name] : [v, name]}
                labelFormatter={(l: string) => {
                  const r = rows.find(x => x.label === l);
                  return r?.byBoard ? `${l} — ${r.byBoard}` : l;
                }}
              />
              <Bar
                yAxisId="l"
                dataKey="count"
                name="Red days"
                maxBarSize={56}
                fill="var(--destructive)"
                radius={[3, 3, 0, 0]}
                cursor={onSelectReason ? "pointer" : undefined}
                onClick={(d: { id?: string }) => {
                  if (!onSelectReason || !d?.id) return;
                  onSelectReason(selectedReasonId === d.id ? null : d.id);
                }}
              />
              <Line yAxisId="r" type="monotone" dataKey="cum" name="Cumulative" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {!collapsed && selectedReasonId && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Filtered to{" "}
          <span className="font-medium text-foreground">
            {selectedReasonId === UNTAGGED ? "Untagged" : labelById.get(selectedReasonId) ?? "reason"}
          </span>{" "}
          <button className="underline" onClick={() => onSelectReason?.(null)}>clear</button>
          {period !== "month" && <span> · the grid filter applies to the visible month only</span>}
        </div>

      )}
    </div>
  );
}
