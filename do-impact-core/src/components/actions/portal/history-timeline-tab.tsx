import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, Clock } from "lucide-react";
import {
  ActionRow,
  MODULE_HEX,
  STATUS_LABEL,
  parseISO,
} from "@/lib/execution-actions";

export type HistoryZoom = "month" | "quarter" | "year";

type Event = {
  row: ActionRow;
  date: string;
  past: boolean;
  overdue: boolean;
};

function eventDate(r: ActionRow): string | null {
  if (r.status === "done") return r.done_date ?? r.due_date ?? r.end_date ?? r.start_date;
  return r.due_date ?? r.start_date;
}

function fmtDate(iso: string) {
  return parseISO(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function periodKey(iso: string, zoom: HistoryZoom) {
  const d = parseISO(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  if (zoom === "year") return `${y}`;
  if (zoom === "quarter") return `${y}-Q${Math.floor(m / 3) + 1}`;
  return `${y}-${m}`;
}

function periodLabel(iso: string, zoom: HistoryZoom) {
  const d = parseISO(iso);
  if (zoom === "year") return String(d.getUTCFullYear());
  if (zoom === "quarter") return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

const CARD_W = 196;
const CARD_H = 96;
const LANE_GAP = 14;
const STEM = 40;

export function HistoryTimelineTab({
  rows,
  zoom,
  today,
  onSelect,
}: {
  rows: ActionRow[];
  zoom: HistoryZoom;
  today: string;
  onSelect: (r: ActionRow) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const slotW = zoom === "month" ? 232 : zoom === "quarter" ? 208 : 184;

  const { events, undated } = useMemo(() => {
    const ev: Event[] = [];
    const un: ActionRow[] = [];
    for (const r of rows) {
      const d = eventDate(r);
      if (!d) {
        un.push(r);
        continue;
      }
      ev.push({ row: r, date: d, past: d <= today, overdue: r.status !== "done" && d < today });
    }
    ev.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return { events: ev, undated: un };
  }, [rows, today]);

  // Evenly spaced chronological slots keep the timeline readable regardless of
  // how the real dates cluster; past events hang below the spine, future above.
  const placed = useMemo(() => {
    let pastSeen = 0;
    let futureSeen = 0;
    return events.map((e, i) => {
      const lane = e.past ? pastSeen++ % 2 : futureSeen++ % 2;
      return { ...e, x: i * slotW + slotW / 2 + 24, lane };
    });
  }, [events, slotW]);

  const laneBlock = CARD_H + LANE_GAP;
  const halfH = STEM + laneBlock * 2 + 16;
  const spineY = halfH;
  const totalH = halfH * 2 + 24;
  const totalW = Math.max(960, placed.length * slotW + 48 + CARD_W);

  const firstFuture = placed.findIndex((p) => !p.past);
  const todayX =
    firstFuture === -1
      ? totalW - 40
      : firstFuture === 0
        ? 16
        : (placed[firstFuture - 1].x + placed[firstFuture].x) / 2;

  // Period bands along the spine.
  const bands = useMemo(() => {
    const out: { key: string; label: string; start: number; end: number; past: boolean }[] = [];
    for (const p of placed) {
      const key = periodKey(p.date, zoom);
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.end = p.x;
        last.past = last.past && p.past;
      } else {
        out.push({ key, label: periodLabel(p.date, zoom), start: p.x, end: p.x, past: p.past });
      }
    }
    return out;
  }, [placed, zoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = Math.max(0, todayX - el.clientWidth / 2);
  }, [todayX, zoom]);

  const doneCount = events.filter((e) => e.row.status === "done").length;
  const overdueCount = events.filter((e) => e.overdue).length;
  const upcomingCount = events.filter((e) => !e.past).length;

  if (events.length === 0 && undated.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          No actions match the current filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> {doneCount} completed</Badge>
        <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" /> {overdueCount} overdue</Badge>
        <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> {upcomingCount} upcoming</Badge>
        <span className="ml-auto text-muted-foreground">
          History below the line · what&apos;s ahead above it · scroll sideways
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={scrollRef} className="overflow-x-auto">
            <div className="relative" style={{ width: totalW, height: totalH }}>
              {/* period bands */}
              {bands.map((b) => (
                <div key={b.key}>
                  <div
                    className="absolute rounded-full"
                    style={{
                      left: b.start - slotW / 2 + 6,
                      width: b.end - b.start + slotW - 12,
                      top: spineY - 1,
                      height: 4,
                      backgroundColor: b.past ? "var(--color-muted-foreground)" : "var(--color-primary)",
                      opacity: b.past ? 0.35 : 0.55,
                    }}
                  />
                  <div
                    className="absolute flex items-start"
                    style={{
                      left: b.start - slotW / 2 + 6,
                      width: b.end - b.start + slotW - 12,
                      top: spineY + 8,
                      height: 18,
                    }}
                  >
                    <span className="sticky left-2 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-sm">
                      {b.label}
                    </span>
                  </div>
                </div>
              ))}


              {/* base spine */}
              <div className="absolute left-0 right-0 bg-border" style={{ top: spineY, height: 1 }} />

              {/* today marker */}
              <div className="absolute" style={{ left: todayX, top: 24, height: totalH - 48 }}>
                <div className="h-full w-[2px] bg-primary/60" />
                <span className="absolute -left-px -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground" style={{ top: -14 }}>
                  Today
                </span>
              </div>

              {placed.map((e) => {
                const color = MODULE_HEX[e.row.module];
                const done = e.row.status === "done";
                const offset = STEM + e.lane * laneBlock;
                const cardTop = e.past ? spineY + offset : spineY - offset - CARD_H;
                const stemTop = e.past ? spineY : cardTop + CARD_H;
                const stemH = offset;
                return (
                  <div key={e.row.id} className="absolute" style={{ left: e.x, top: 0 }}>
                    <div
                      className="absolute -translate-x-1/2 rounded-full"
                      style={{ top: stemTop, width: 2, height: stemH, backgroundColor: color, opacity: done ? 0.4 : 0.85 }}
                    />
                    <div
                      className="absolute -translate-x-1/2 rounded-full border-2 border-background"
                      style={{ top: spineY - 5, width: 11, height: 11, backgroundColor: color, opacity: done ? 0.5 : 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(e.row)}
                      className={`absolute -translate-x-1/2 rounded-xl border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
                        done ? "opacity-75" : ""
                      } ${e.overdue ? "border-destructive/60" : "border-border"}`}
                      style={{ top: cardTop, width: CARD_W, height: CARD_H, borderLeftWidth: 3, borderLeftColor: color }}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {done ? (
                          <Check className="h-3 w-3" />
                        ) : e.overdue ? (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {fmtDate(e.date)}
                      </div>
                      <p className={`mt-1 line-clamp-2 text-xs font-medium leading-snug ${done ? "text-muted-foreground line-through decoration-1" : ""}`}>
                        {e.row.title}
                      </p>
                      <div className="absolute inset-x-3 bottom-2 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
                        <span className="truncate">{e.row.owner_name ?? "Unassigned"}</span>
                        <span className="shrink-0 font-medium" style={{ color }}>{e.row.module}</span>
                      </div>
                      <span className="sr-only">{STATUS_LABEL[e.row.status]}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {undated.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              No date set · {undated.length}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {undated.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r)}
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                  style={{ borderLeftWidth: 3, borderLeftColor: MODULE_HEX[r.module] }}
                >
                  <span className="line-clamp-1 max-w-[220px]">{r.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
