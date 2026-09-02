import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CANVAS,
  layerMeta,
  linkMeta,
  HEALTH_COLORS,
  type EnLink,
  type EnNode,
  type RippleResult,
} from "@/lib/enterprise-network";

type Pos = Record<string, { x: number; y: number }>;

export type MapProps = {
  nodes: EnNode[];
  links: EnLink[];
  positions: Pos;
  selectedId: string | null;
  linkFrom: string | null;
  ripple?: Map<string, RippleResult> | null;
  pathIds?: string[] | null;
  onSelect: (id: string | null) => void;
  onLinkTarget: (id: string) => void;
  onMove: (id: string, x: number, y: number, commit: boolean) => void;
  readOnly?: boolean;
};

const { W, H } = CANVAS;

export function NetworkMap({
  nodes,
  links,
  positions,
  selectedId,
  linkFrom,
  ripple,
  pathIds,
  onSelect,
  onLinkTarget,
  onMove,
  readOnly,
}: MapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const dragNode = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const panning = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const pathSet = useMemo(() => new Set(pathIds ?? []), [pathIds]);
  const maxSeverity = useMemo(
    () => Math.max(0.0001, ...[...(ripple?.values() ?? [])].map((r) => r.severity)),
    [ripple],
  );

  // screen -> model coordinates
  const toModel = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    const sy = ((clientY - rect.top) / rect.height) * H;
    const v = viewRef.current;
    return { x: (sx - v.x) / v.k, y: (sy - v.y) / v.k };
  }, []);

  // Non-passive wheel: React's onWheel can't preventDefault, so the page would scroll.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svgRef.current!.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const py = ((e.clientY - rect.top) / rect.height) * H;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setView((v) => {
        const next = Math.max(0.35, Math.min(3.5, v.k * Math.exp(-dy * 0.0015)));
        const k = next / v.k;
        return { k: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    setView((v) => {
      const next = Math.max(0.35, Math.min(3.5, v.k * factor));
      const k = next / v.k;
      const cx = W / 2;
      const cy = H / 2;
      return { k: next, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragNode.current) {
      const p = toModel(e.clientX, e.clientY);
      dragNode.current.moved = true;
      onMove(dragNode.current.id, clamp(p.x - dragNode.current.dx, 60, W - 60), clamp(p.y - dragNode.current.dy, 40, H - 40), false);
      return;
    }
    if (panning.current) {
      const rect = svgRef.current!.getBoundingClientRect();
      const scale = W / rect.width;
      const { ox, oy, px, py } = panning.current;
      const nx = ox + (e.clientX - px) * scale;
      const ny = oy + (e.clientY - py) * scale;
      setView((v) => ({ ...v, x: nx, y: ny }));
    }
  };

  const endDrag = () => {
    if (dragNode.current?.moved) {
      const id = dragNode.current.id;
      const p = positions[id];
      if (p) onMove(id, p.x, p.y, true);
    }
    dragNode.current = null;
    panning.current = null;
  };

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-border bg-background/90 p-1 shadow-sm backdrop-blur">
        <button className="h-7 w-7 rounded text-sm font-semibold hover:bg-muted" onClick={() => zoomBy(1.25)} aria-label="Zoom in">+</button>
        <button className="h-7 w-7 rounded text-sm font-semibold hover:bg-muted" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">−</button>
        <button
          className="h-7 w-7 rounded text-[10px] font-semibold hover:bg-muted"
          onClick={() => setView({ x: 0, y: 0, k: 1 })}
          aria-label="Reset view"
        >
          1:1
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[620px] w-full touch-none select-none"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerDown={(e) => {
          if ((e.target as Element).closest("[data-node]")) return;
          onSelect(null);
          panning.current = { px: e.clientX, py: e.clientY, ox: view.x, oy: view.y };
        }}
        style={{ cursor: panning.current ? "grabbing" : "grab" }}
      >
        <defs>
          {["information", "material", "financial", "governance", "decision"].map((t) => (
            <marker
              key={t}
              id={`en-arrow-${t}`}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={linkMeta(t).color} />
            </marker>
          ))}
        </defs>

        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {links.map((l) => {
            const a = positions[l.from_node];
            const b = positions[l.to_node];
            if (!a || !b) return null;
            const meta = linkMeta(l.link_type);
            const dimmed =
              (selectedId && l.from_node !== selectedId && l.to_node !== selectedId) ||
              (pathSet.size > 0 && !(pathSet.has(l.from_node) && pathSet.has(l.to_node)));
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            const start = { x: a.x + nx * 46, y: a.y + ny * 24 };
            const end = { x: b.x - nx * 50, y: b.y - ny * 26 };
            const cx = (start.x + end.x) / 2 - ny * 26;
            const cy = (start.y + end.y) / 2 + nx * 26;
            return (
              <path
                key={l.id}
                d={`M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`}
                fill="none"
                stroke={meta.color}
                strokeWidth={1 + l.strength * 3}
                strokeDasharray={meta.dash}
                markerEnd={`url(#en-arrow-${l.link_type})`}
                opacity={dimmed ? 0.12 : 0.75}
              />
            );
          })}

          {nodes.map((n) => {
            const p = positions[n.id];
            if (!p) return null;
            const meta = layerMeta(n.layer);
            const r = ripple?.get(n.id);
            const dimmed = pathSet.size > 0 && !pathSet.has(n.id);
            const heat = r ? Math.max(0.15, r.severity / maxSeverity) : 0;
            const w = 132;
            const h = 46;
            return (
              <g
                key={n.id}
                data-node
                transform={`translate(${p.x},${p.y})`}
                opacity={dimmed ? 0.2 : 1}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect(n.id);
                  if (readOnly) return;
                  const m = toModel(e.clientX, e.clientY);
                  dragNode.current = { id: n.id, dx: m.x - p.x, dy: m.y - p.y, moved: false };
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  if (linkFrom && linkFrom !== n.id && !dragNode.current?.moved) onLinkTarget(n.id);
                  endDrag();
                }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                className={readOnly ? "cursor-pointer" : "cursor-move"}
              >
                {r && (
                  <rect
                    x={-w / 2 - 7}
                    y={-h / 2 - 7}
                    width={w + 14}
                    height={h + 14}
                    rx={14}
                    fill={r.impact >= 0 ? "#16a34a" : "#dc2626"}
                    opacity={0.1 + heat * 0.5}
                  />
                )}
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx={10}
                  fill="var(--color-background, #fff)"
                  stroke={selectedId === n.id ? "#0f172a" : linkFrom === n.id ? "#f59e0b" : meta.ring}
                  strokeWidth={selectedId === n.id || linkFrom === n.id ? 3 : 1.6}
                />
                <rect x={-w / 2} y={-h / 2} width={5} height={h} rx={2.5} fill={meta.ring} />
                {n.health && HEALTH_COLORS[n.health] && (
                  <circle cx={w / 2 - 10} cy={-h / 2 + 10} r={4.5} fill={HEALTH_COLORS[n.health]} />
                )}
                <foreignObject x={-w / 2 + 9} y={-h / 2 + 4} width={w - 22} height={h - 8}>
                  <div className="flex h-full items-center text-[10.5px] font-medium leading-tight text-foreground">
                    <span className="line-clamp-3">{n.label}</span>
                  </div>
                </foreignObject>
                {(hover === n.id || selectedId === n.id) && r && (
                  <text x={0} y={h / 2 + 15} textAnchor="middle" className="fill-current text-[11px] font-semibold">
                    {r.impact >= 0 ? "+" : "−"}
                    {Math.abs(r.impact).toFixed(1)}% · {r.weeks}w
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
          Nothing in view — build the model from your live data, or loosen the filters.
        </div>
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
