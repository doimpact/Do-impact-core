import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Download } from "lucide-react";
import {
  CLD_TEMPLATES,
  cldId,
  detectLoops,
  type CldLink,
  type CldNode,
} from "@/lib/problem-tools";
import type { CldDiagram } from "@/hooks/use-problem-tools";

const W = 900;
const H = 460;

export function CldCanvas({
  diagram,
  onPatch,
}: {
  diagram: CldDiagram;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodes = (diagram.nodes ?? []) as CldNode[];
  const links = (diagram.links ?? []) as CldLink[];
  const notes = (diagram.loop_notes ?? {}) as Record<string, string>;

  const [selected, setSelected] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const loops = useMemo(() => detectLoops(nodes, links), [nodes, links]);

  const setNodes = (n: CldNode[]) => onPatch({ nodes: n });
  const setLinks = (l: CldLink[]) => onPatch({ links: l });

  const point = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const addNode = () => {
    const n: CldNode = { id: cldId("n"), label: "New variable", x: 120 + nodes.length * 20, y: 90 + nodes.length * 18 };
    setNodes([...nodes, n]);
    setSelected(n.id);
  };

  const applyTemplate = (key: string) => {
    const t = CLD_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    onPatch({
      nodes: t.nodes.map((n) => ({ ...n })),
      links: t.links.map((l) => ({ ...l })),
      description: diagram.description || t.description,
      loop_notes: {},
    });
    setSelected(null);
    setLinkFrom(null);
  };

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${diagram.title.replace(/\s+/g, "-").toLowerCase()}-cld.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  };

  const sel = nodes.find((n) => n.id === selected) ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={addNode}><Plus className="mr-1.5 h-4 w-4" /> Variable</Button>
            <Select onValueChange={applyTemplate}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Load a starter template…" /></SelectTrigger>
              <SelectContent>
                {CLD_TEMPLATES.map((t) => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportPng}><Download className="mr-1.5 h-4 w-4" /> Export PNG</Button>
            <span className="text-xs text-muted-foreground">
              {linkFrom ? "Click a target variable to finish the link (Esc to cancel)" : "Drag to move · click a variable then “Link from here”"}
            </span>
          </div>

          <Input
            defaultValue={diagram.description ?? ""}
            placeholder="What story does this diagram tell?"
            onBlur={(e) => onPatch({ description: e.target.value || null })}
          />

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="h-[460px] w-full min-w-[720px] touch-none select-none"
              onMouseMove={(e) => {
                if (!drag.current) return;
                const p = point(e);
                setNodesLocal(nodes, drag.current.id, p.x - drag.current.dx, p.y - drag.current.dy, setNodes);
              }}
              onMouseUp={() => (drag.current = null)}
              onMouseLeave={() => (drag.current = null)}
              onKeyDown={(e) => e.key === "Escape" && setLinkFrom(null)}
              tabIndex={0}
            >
              <defs>
                <marker id="cld-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
              </defs>

              {links.map((l) => {
                const a = nodes.find((n) => n.id === l.from);
                const b = nodes.find((n) => n.id === l.to);
                if (!a || !b) return null;
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const len = Math.hypot(dx, dy) || 1;
                const ox = (-dy / len) * 45;
                const oy = (dx / len) * 45;
                const cx = mx + ox;
                const cy = my + oy;
                return (
                  <g key={l.id} className={l.polarity === "S" ? "text-emerald-600" : "text-rose-600"}>
                    <path
                      d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      markerEnd="url(#cld-arrow)"
                      opacity={0.85}
                    />
                    <circle cx={cx * 0.75 + mx * 0.25} cy={cy * 0.75 + my * 0.25} r={10} fill="currentColor" opacity={0.12} />
                    <text x={cx * 0.75 + mx * 0.25} y={cy * 0.75 + my * 0.25 + 4} textAnchor="middle" className="fill-current text-[12px] font-bold">
                      {l.polarity}
                    </text>
                    {l.delay && (
                      <text x={cx * 0.75 + mx * 0.25} y={cy * 0.75 + my * 0.25 - 14} textAnchor="middle" className="fill-current text-[11px]">
                        ‖ delay
                      </text>
                    )}
                  </g>
                );
              })}

              {nodes.map((n) => (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  onMouseDown={(e) => {
                    const p = point(e);
                    drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
                    setSelected(n.id);
                  }}
                  onClick={() => {
                    if (linkFrom && linkFrom !== n.id) {
                      setLinks([...links, { id: cldId("l"), from: linkFrom, to: n.id, polarity: "S" }]);
                      setLinkFrom(null);
                    }
                  }}
                  className="cursor-move"
                >
                  <rect
                    x={-72}
                    y={-22}
                    width={144}
                    height={44}
                    rx={10}
                    className={`fill-background ${selected === n.id ? "stroke-primary" : "stroke-border"}`}
                    strokeWidth={selected === n.id ? 2.5 : 1.5}
                  />
                  <foreignObject x={-68} y={-20} width={136} height={40}>
                    <div className="flex h-full items-center justify-center px-1 text-center text-[11px] leading-tight">{n.label}</div>
                  </foreignObject>
                </g>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="space-y-3 p-4">
          <h2 className="font-semibold">Selected variable</h2>
          {!sel ? <p className="text-sm text-muted-foreground">Click a variable on the canvas.</p> : (
            <div className="space-y-2">
              <Input
                value={sel.label}
                onChange={(e) => setNodes(nodes.map((n) => (n.id === sel.id ? { ...n, label: e.target.value } : n)))}
              />
              <Textarea
                rows={2}
                placeholder="Leverage point — what intervention here changes the loop?"
                defaultValue={sel.leverage ?? ""}
                onBlur={(e) => setNodes(nodes.map((n) => (n.id === sel.id ? { ...n, leverage: e.target.value } : n)))}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={linkFrom === sel.id ? "default" : "outline"} onClick={() => setLinkFrom(linkFrom === sel.id ? null : sel.id)}>
                  {linkFrom === sel.id ? "Pick a target…" : "Link from here"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    onPatch({ nodes: nodes.filter((n) => n.id !== sel.id), links: links.filter((l) => l.from !== sel.id && l.to !== sel.id) });
                    setSelected(null);
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>

              <div className="space-y-1.5 border-t border-border pt-2">
                <p className="text-xs font-medium text-muted-foreground">Links from this variable</p>
                {links.filter((l) => l.from === sel.id).map((l) => {
                  const target = nodes.find((n) => n.id === l.to);
                  return (
                    <div key={l.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">→ {target?.label ?? "?"}</span>
                      <Select value={l.polarity} onValueChange={(v) => setLinks(links.map((x) => (x.id === l.id ? { ...x, polarity: v as "S" | "O" } : x)))}>
                        <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S — same (+)</SelectItem>
                          <SelectItem value="O">O — opposite (−)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant={l.delay ? "default" : "outline"} onClick={() => setLinks(links.map((x) => (x.id === l.id ? { ...x, delay: !x.delay } : x)))}>
                        delay
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent></Card>

        <Card><CardContent className="space-y-3 p-4">
          <h2 className="font-semibold">Detected feedback loops</h2>
          {loops.length === 0 ? (
            <p className="text-sm text-muted-foreground">No closed loop yet — a causal loop diagram only bites once the arrows come back around.</p>
          ) : (
            <div className="space-y-2">
              {loops.map((lp, i) => (
                <div key={lp.key} className="rounded-lg border border-border p-2">
                  <div className="flex items-center gap-2">
                    <Badge className={lp.type === "R" ? "bg-rose-600 text-white" : "bg-sky-600 text-white"}>
                      {lp.type}{i + 1} — {lp.type === "R" ? "Reinforcing" : "Balancing"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {lp.nodes.map((id) => nodes.find((n) => n.id === id)?.label ?? "?").join(" → ")} →
                    </span>
                  </div>
                  <Textarea
                    rows={2}
                    className="mt-2"
                    placeholder="What does this loop mean, and where would you break it?"
                    defaultValue={notes[lp.key] ?? ""}
                    onBlur={(e) => onPatch({ loop_notes: { ...notes, [lp.key]: e.target.value } })}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}

function setNodesLocal(nodes: CldNode[], id: string, x: number, y: number, apply: (n: CldNode[]) => void) {
  apply(nodes.map((n) => (n.id === id ? { ...n, x: Math.max(80, Math.min(W - 80, x)), y: Math.max(30, Math.min(H - 30, y)) } : n)));
}
