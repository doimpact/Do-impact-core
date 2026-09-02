import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useActiveCompany } from "@/hooks/use-companies";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import {
  MAP_PILLARS, STATUS_COLOR, STATUS_LABEL, layoutMap, leafPositions, moduleStatus,
  type LaidOutModule, type MapPillar, type MapStatus,
} from "@/lib/company-map";
import { useCompanyMap } from "./use-company-map";

export function CompanyMindmap({ compact = false }: { compact?: boolean }) {
  const active = useActiveCompany();
  const companyId = active.data?.company_id;
  const companyName = active.data?.companies?.name ?? "Your company";
  const { isEnabled } = useUserPreferences();
  const map = useCompanyMap(companyId);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [onlyRed, setOnlyRed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const pillars = useMemo<MapPillar[]>(
    () => MAP_PILLARS.map((p) => ({ ...p, modules: p.modules.filter((m) => isEnabled(m.navKey)) })).filter((p) => p.modules.length),
    [isEnabled],
  );
  const data = map.data ?? {};
  const layout = useMemo(() => layoutMap(pillars, data), [pillars, data]);

  const totals = useMemo(() => {
    const vals = Object.values(data);
    return {
      open: vals.reduce((a, v) => a + v.open, 0),
      overdue: vals.reduce((a, v) => a + v.overdue, 0),
      tracked: vals.reduce((a, v) => a + v.total, 0),
      hot: vals.filter((v) => v.overdue > 0).length,
    };
  }, [data]);

  const statusOf = (id: string): MapStatus => moduleStatus(data[id]);
  const dim = (id: string) => onlyRed && statusOf(id) !== "red";

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onUp = () => { drag.current = null; };

  const hovered = hover ? layout.pillars.flatMap((p) => p.modules).find((m) => m.id === hover) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto flex flex-wrap gap-2">
          {(["red", "amber", "green", "empty"] as MapStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
        <Button size="sm" variant={onlyRed ? "default" : "outline"} onClick={() => setOnlyRed((v) => !v)}>Only what&apos;s red</Button>
        <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}>−</Button>
        <Button size="sm" variant="outline" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setExpanded(null); }}>Fit</Button>
        <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))}>+</Button>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-background">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className={compact ? "h-[420px] w-full touch-none select-none" : "h-[620px] w-full touch-none select-none"}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom}) translate(${(layout.width * (1 - zoom)) / (2 * zoom)} ${(layout.height * (1 - zoom)) / (2 * zoom)})`}>
            {/* spokes */}
            {layout.pillars.map((p) => (
              <g key={p.pillar.key}>
                <line x1={layout.centre.x} y1={layout.centre.y} x2={p.pos.x} y2={p.pos.y} stroke={p.pillar.tone} strokeWidth={3} opacity={0.5} />
                {p.modules.map((m) => (
                  <line
                    key={m.id}
                    x1={p.pos.x} y1={p.pos.y} x2={m.pos.x} y2={m.pos.y}
                    stroke={p.pillar.tone}
                    strokeWidth={Math.min(6, 1.5 + (data[m.id]?.open ?? 0) / 4)}
                    opacity={dim(m.id) ? 0.1 : 0.35}
                  />
                ))}
              </g>
            ))}

            {/* expanded leaves */}
            {layout.pillars.flatMap((p) => p.modules).map((m) => {
              if (expanded !== m.id) return null;
              const c = data[m.id];
              const labels = [
                ...(c?.overdue ? [`${c.overdue} overdue`] : []),
                ...(c?.open ? [`${c.open} open`] : []),
                ...(c?.leaves ?? []),
              ].slice(0, 5);
              const pts = leafPositions(m, labels.length, 108);
              return (
                <g key={`leaf-${m.id}`}>
                  {pts.map((pt, i) => (
                    <g key={i}>
                      <line x1={m.pos.x} y1={m.pos.y} x2={pt.x} y2={pt.y} stroke={m.tone} strokeWidth={1.5} opacity={0.5} />
                      <rect x={pt.x - 70} y={pt.y - 13} width={140} height={26} rx={13} fill="var(--background)" stroke={m.tone} strokeWidth={1.2} />
                      <text x={pt.x} y={pt.y + 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 11 }}>
                        {labels[i]!.length > 20 ? `${labels[i]!.slice(0, 19)}…` : labels[i]}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}

            {/* centre */}
            <circle cx={layout.centre.x} cy={layout.centre.y} r={104} fill="var(--card)" stroke="var(--accent)" strokeWidth={3} />
            <text x={layout.centre.x} y={layout.centre.y - 34} textAnchor="middle" className="fill-foreground" style={{ fontSize: 15, fontWeight: 700 }}>
              {companyName.length > 20 ? `${companyName.slice(0, 19)}…` : companyName}
            </text>
            <text x={layout.centre.x} y={layout.centre.y - 8} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>OPEN / OVERDUE</text>
            <text x={layout.centre.x} y={layout.centre.y + 22} textAnchor="middle" style={{ fontSize: 26, fontWeight: 800, fill: totals.overdue ? STATUS_COLOR.red : STATUS_COLOR.green }}>
              {totals.open} / {totals.overdue}
            </text>
            <text x={layout.centre.x} y={layout.centre.y + 44} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
              {totals.tracked} records tracked
            </text>

            {/* pillars */}
            {layout.pillars.map((p) => (
              <g key={`p-${p.pillar.key}`}>
                <circle cx={p.pos.x} cy={p.pos.y} r={40} fill={p.pillar.tone} opacity={0.92} />
                <text x={p.pos.x} y={p.pos.y + 4} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: "white" }}>{p.pillar.label}</text>
              </g>
            ))}

            {/* modules */}
            {layout.pillars.flatMap((p) => p.modules).map((m: LaidOutModule) => {
              const c = data[m.id];
              const st = statusOf(m.id);
              const r = m.r;
              return (
                <g
                  key={m.id}
                  className="cursor-pointer"
                  opacity={dim(m.id) ? 0.2 : 1}
                  onClick={() => setExpanded((e) => (e === m.id ? null : m.id))}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover((h) => (h === m.id ? null : h))}
                >
                  <circle cx={m.pos.x} cy={m.pos.y} r={r} fill="var(--card)" stroke={STATUS_COLOR[st]} strokeWidth={expanded === m.id ? 5 : 3} />
                  <text x={m.pos.x} y={m.pos.y - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
                    {m.label.length > 13 ? `${m.label.slice(0, 12)}…` : m.label}
                  </text>
                  <text x={m.pos.x} y={m.pos.y + 14} textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: STATUS_COLOR[st] }}>
                    {c?.total ?? 0}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {hovered && (
          <div className="pointer-events-none absolute bottom-3 left-3 max-w-xs rounded-lg border border-border bg-card/95 p-3 shadow-lg">
            <div className="text-sm font-semibold">{hovered.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {data[hovered.id]?.total ?? 0} records · {data[hovered.id]?.open ?? 0} open · {data[hovered.id]?.overdue ?? 0} overdue
            </div>
            {(data[hovered.id]?.leaves ?? []).map((l, i) => (
              <div key={i} className="mt-1 truncate text-xs">• {l}</div>
            ))}
          </div>
        )}

        {map.isLoading && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 text-sm text-muted-foreground">Building the map…</div>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <strong>{layout.pillars.flatMap((p) => p.modules).find((m) => m.id === expanded)?.label}</strong>
          <span className="text-muted-foreground">
            {data[expanded]?.total ?? 0} records · {data[expanded]?.open ?? 0} open · {data[expanded]?.overdue ?? 0} overdue
          </span>
          <Link
            to={layout.pillars.flatMap((p) => p.modules).find((m) => m.id === expanded)?.to as never}
            className="ml-auto rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
          >
            Open module
          </Link>
        </div>
      )}
    </div>
  );
}
