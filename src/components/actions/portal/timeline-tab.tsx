import { useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ActionRow,
  ActionModule,
  MODULE_BAR,
  STATUS_LABEL,
  addDaysISO,
  daysBetween,
  parseISO,
} from "@/lib/execution-actions";
import { ProgressBar, rollup } from "@/lib/execution-rollups";

export type GanttGroupBy = "module" | "owner" | "status" | "parent";

export function TimelineTab({
  rows,
  groupBy,
  zoom,
  today,
  onSelect,
}: {
  rows: ActionRow[];
  groupBy: GanttGroupBy;
  zoom: "week" | "month" | "quarter";
  today: string;
  onSelect: (r: ActionRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const pxPerDay = zoom === "week" ? 28 : zoom === "month" ? 10 : 4;
  const subRowGap = 4;
  const barHeight = 22;
  const labelW = 180;

  const dated = rows.filter((r) => r.due_date || r.start_date);
  const undated = rows.filter((r) => !r.due_date && !r.start_date);

  const { axisStart, axisEnd, days } = useMemo(() => {
    let minD = addDaysISO(today, -14);
    let maxD = addDaysISO(today, 90);
    for (const r of dated) {
      const s = r.start_date ?? r.due_date!;
      const e = r.end_date ?? r.due_date ?? s;
      if (s < minD) minD = s;
      if (e > maxD) maxD = e;
    }
    minD = addDaysISO(minD, -7);
    maxD = addDaysISO(maxD, 14);
    return { axisStart: minD, axisEnd: maxD, days: daysBetween(minD, maxD) + 1 };
  }, [dated, today]);

  const totalW = days * pxPerDay;
  const todayLeft = daysBetween(axisStart, today) * pxPerDay;

  const lanes = useMemo(() => {
    const map = new Map<string, ActionRow[]>();
    for (const r of dated) {
      const key =
        groupBy === "module"
          ? r.module
          : groupBy === "status"
            ? STATUS_LABEL[r.status]
            : groupBy === "parent"
              ? (r.parent ?? "No parent")
              : (r.owner_name ?? (r.owner_id ? r.owner_id.slice(0, 8) : "Unassigned"));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const preferred =
      groupBy === "module"
        ? (["Strategy", "Progress", "Commercial", "Operations", "Turnaround Finance", "Daily Mgmt", "Problem Solver"] as string[])
        : groupBy === "status"
          ? ["Blocked", "In progress", "Open", "Done"]
          : [];
    const remaining = Array.from(map.keys())
      .filter((k) => !preferred.includes(k))
      .sort((a, b) => a.localeCompare(b));
    const order = [...preferred, ...remaining];
    const arr: { key: string; rows: ActionRow[]; packed: { row: ActionRow; sub: number; left: number; width: number }[]; subRows: number }[] = [];
    for (const key of order) {
      const items = map.get(key);
      if (!items || items.length === 0) continue;
      const sorted = [...items].sort((a, b) => {
        const as = a.start_date ?? a.due_date!;
        const bs = b.start_date ?? b.due_date!;
        return as.localeCompare(bs);
      });
      const subEnds: number[] = [];
      const packed = sorted.map((r) => {
        const s = r.start_date ?? r.due_date!;
        const e = r.end_date ?? r.due_date ?? s;
        let leftDays = daysBetween(axisStart, s);
        let widthDays = Math.max(1, daysBetween(s, e) + 1);
        if (s === e && r.source !== "capex_milestone") {
          leftDays = daysBetween(axisStart, s) - 1;
          widthDays = 3;
        }
        const left = leftDays * pxPerDay;
        const width = Math.max(pxPerDay, widthDays * pxPerDay);
        let sub = 0;
        while (sub < subEnds.length && subEnds[sub] > left) sub++;
        if (sub === subEnds.length) subEnds.push(0);
        subEnds[sub] = left + width + 4;
        return { row: r, sub, left, width };
      });
      arr.push({ key, rows: sorted, packed, subRows: Math.max(1, subEnds.length) });
    }

    if (undated.length > 0) {
      const pillW = Math.max(pxPerDay * 3, 60);
      const gap = 6;
      const anchor = Math.max(0, todayLeft - Math.floor(pillW / 2));
      const perRow = Math.max(1, Math.floor((totalW - anchor) / (pillW + gap)));
      const packed = undated.map((r, i) => {
        const sub = Math.floor(i / perRow);
        const col = i % perRow;
        return { row: r, sub, left: anchor + col * (pillW + gap), width: pillW };
      });
      const subRows = Math.max(1, Math.ceil(undated.length / perRow));
      arr.push({ key: "No due date", rows: undated, packed, subRows });
    }
    return arr;
  }, [dated, undated, groupBy, axisStart, pxPerDay, todayLeft, totalW]);

  const ticks = useMemo(() => {
    const out: { left: number; label: string; major: boolean }[] = [];
    const start = parseISO(axisStart);
    for (let i = 0; i <= days; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const day = d.getUTCDate();
      const month = d.getUTCMonth();
      const isWeekStart = d.getUTCDay() === 1;
      if (zoom === "week") {
        if (day === 1 || i === 0) out.push({ left: i * pxPerDay, label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), major: true });
        else if (isWeekStart) out.push({ left: i * pxPerDay, label: String(day), major: false });
      } else if (zoom === "month") {
        if (day === 1 || i === 0) out.push({ left: i * pxPerDay, label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), major: true });
      } else {
        if (month % 3 === 0 && day === 1) out.push({ left: i * pxPerDay, label: `Q${Math.floor(month / 3) + 1} ${d.getUTCFullYear()}`, major: true });
        else if (day === 1) out.push({ left: i * pxPerDay, label: d.toLocaleDateString(undefined, { month: "short" }), major: false });
      }
    }
    return out;
  }, [axisStart, days, pxPerDay, zoom]);

  const jumpToToday = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ left: Math.max(0, todayLeft - 200), behavior: "smooth" });
  };

  if (dated.length === 0 && undated.length === 0) {
    return <div className="text-sm text-muted-foreground p-8 text-center border border-dashed rounded-lg">No dated actions to plot on the timeline.</div>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {axisStart} → {axisEnd} · {lanes.length} lanes · {rows.length} actions
          </div>
          <Button size="sm" variant="outline" className="h-7" onClick={jumpToToday}>Jump to today</Button>
        </div>
        <div className="flex">
          <div className="shrink-0 border-r bg-background" style={{ width: labelW }}>
            <div className="h-9 border-b bg-muted/40" />
            {lanes.map((lane) => (
              <div
                key={lane.key}
                className="border-b px-3 flex flex-col justify-center gap-1 text-sm font-medium"
                style={{ height: lane.subRows * (barHeight + subRowGap) + subRowGap }}
              >
                <div className="flex items-center">
                  <span className="truncate">{lane.key}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px]">{lane.rows.length}</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <ProgressBar pct={rollup(lane.rows).pct} className="flex-1 h-1.5" />
                  <span className="text-[10px] text-muted-foreground tabular-nums">{rollup(lane.rows).pct}%</span>
                </div>
              </div>
            ))}
          </div>

          <div ref={scrollRef} className="relative overflow-x-auto flex-1">
            <div style={{ width: totalW, position: "relative" }}>
              <div className="h-9 border-b bg-muted/40 relative">
                {ticks.map((t, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 h-full flex items-end pb-1 pl-1 text-[10px] whitespace-nowrap ${t.major ? "text-foreground font-semibold border-l border-border" : "text-muted-foreground border-l border-border/50"}`}
                    style={{ left: t.left }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>

              {todayLeft >= 0 && todayLeft <= totalW && (
                <div className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10 pointer-events-none" style={{ left: todayLeft }}>
                  <div className="absolute top-0 -translate-x-1/2 text-[9px] bg-red-500 text-white px-1 rounded">Today</div>
                </div>
              )}

              {lanes.map((lane) => {
                const laneH = lane.subRows * (barHeight + subRowGap) + subRowGap;
                return (
                  <div key={lane.key} className="relative border-b" style={{ height: laneH }}>
                    {ticks.filter((t) => t.major).map((t, i) => (
                      <div key={i} className="absolute top-0 bottom-0 w-px bg-border/40" style={{ left: t.left }} />
                    ))}

                    {lane.packed.map(({ row, sub, left, width }) => {
                      const overdue = row.due_date && row.due_date < today && row.status !== "done";
                      const isDone = row.status === "done";
                      const barTone = MODULE_BAR[row.module];
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => onSelect(row)}
                          className={`absolute rounded border-l-4 text-[11px] text-white text-left px-2 truncate shadow-sm hover:brightness-110 hover:z-20 transition ${barTone} ${isDone ? "opacity-40" : ""} ${overdue ? "!border-l-red-600 ring-1 ring-red-500/60" : ""}`}
                          style={{ left, width, top: subRowGap + sub * (barHeight + subRowGap), height: barHeight, lineHeight: `${barHeight}px` }}
                          title={`${row.module} · ${row.title}${row.parent ? " — " + row.parent : ""}\nOwner: ${row.owner_name ?? "—"}\nDue: ${row.due_date ?? "—"} · ${STATUS_LABEL[row.status]}`}
                        >
                          {row.title || "(untitled)"}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-3 py-2 border-t text-[11px] text-muted-foreground">
          {(Object.keys(MODULE_BAR) as ActionModule[]).map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-4 rounded ${MODULE_BAR[m]}`} /> {m}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-neutral-400 opacity-40" /> Done</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-neutral-400 ring-1 ring-red-500" /> Overdue</span>
          <span className="ml-auto">Click a bar for details.</span>
        </div>
      </CardContent>
    </Card>
  );
}
