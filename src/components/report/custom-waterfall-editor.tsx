import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  type CustomBridge,
  type CustomLever,
  buildRows,
  chartExtent,
  formatNum,
  newBridge,
  newLever,
} from "@/lib/custom-waterfall";

interface Props {
  bridges: CustomBridge[];
  onChange: (next: CustomBridge[]) => void;
}

export function CustomWaterfallEditor({ bridges, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(bridges[0]?.id ?? null);

  function update(id: string, patch: Partial<CustomBridge>) {
    onChange(bridges.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function updateLever(bid: string, lid: string, patch: Partial<CustomLever>) {
    onChange(
      bridges.map((b) =>
        b.id === bid
          ? { ...b, levers: b.levers.map((l) => (l.id === lid ? { ...l, ...patch } : l)) }
          : b,
      ),
    );
  }
  function addLever(bid: string) {
    onChange(bridges.map((b) => (b.id === bid ? { ...b, levers: [...b.levers, newLever()] } : b)));
  }
  function removeLever(bid: string, lid: string) {
    onChange(
      bridges.map((b) => (b.id === bid ? { ...b, levers: b.levers.filter((l) => l.id !== lid) } : b)),
    );
  }
  function addBridge() {
    const nb = newBridge();
    onChange([...bridges, nb]);
    setOpenId(nb.id);
  }
  function removeBridge(id: string) {
    onChange(bridges.filter((b) => b.id !== id));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom waterfall
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Build ad-hoc bridge charts with levers &amp; comments, then include in the report.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addBridge}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Bridge
        </Button>
      </div>

      {bridges.length === 0 && (
        <p className="text-xs text-muted-foreground">No custom bridges yet.</p>
      )}

      <div className="space-y-2">
        {bridges.map((b) => {
          const open = openId === b.id;
          const rows = buildRows(b);
          const net = rows[rows.length - 1].signed - rows[0].signed;
          return (
            <div key={b.id} className="rounded-md border border-border">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : b.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span className="text-sm font-medium truncate">{b.title || "Untitled"}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatNum(rows[0].signed)} → {formatNum(rows[rows.length - 1].signed)} · Δ{" "}
                    <span className={net >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {net >= 0 ? "+" : ""}{formatNum(net)}
                    </span>
                  </span>
                </button>
                <Button size="icon" variant="ghost" onClick={() => removeBridge(b.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>

              {open && (
                <div className="border-t border-border p-3 space-y-3">
                  <MiniPreview bridge={b} />

                  <div>
                    <label className="text-[11px] font-medium">Title</label>
                    <Input value={b.title} onChange={(e) => update(b.id, { title: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium">Start label</label>
                      <Input value={b.startLabel} onChange={(e) => update(b.id, { startLabel: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium">Start value</label>
                      <Input
                        type="number"
                        value={b.startValue}
                        onChange={(e) => update(b.id, { startValue: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium">End label</label>
                      <Input value={b.endLabel} onChange={(e) => update(b.id, { endLabel: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium">End value (blank = computed)</label>
                      <Input
                        type="number"
                        value={b.endValue ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          update(b.id, { endValue: v === "" ? null : Number(v) || 0 });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium">Comment / narrative</label>
                    <Textarea
                      rows={2}
                      value={b.comment ?? ""}
                      onChange={(e) => update(b.id, { comment: e.target.value })}
                      placeholder="Context for the bridge, appears next to the chart in the report."
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Levers
                      </span>
                      <Button size="sm" variant="outline" onClick={() => addLever(b.id)}>
                        <Plus className="mr-1 h-3 w-3" /> Lever
                      </Button>
                    </div>
                    {b.levers.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No levers yet.</p>
                    )}
                    {b.levers.map((l) => (
                      <div key={l.id} className="rounded border border-border p-2 space-y-1.5">
                        <div className="grid grid-cols-[1fr_110px_28px] gap-2 items-end">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Label</label>
                            <Input
                              value={l.label}
                              onChange={(e) => updateLever(b.id, l.id, { label: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Δ (± value)</label>
                            <Input
                              type="number"
                              value={l.delta}
                              onChange={(e) =>
                                updateLever(b.id, l.id, { delta: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeLever(b.id, l.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={l.owner ?? ""}
                            onChange={(e) => updateLever(b.id, l.id, { owner: e.target.value })}
                            placeholder="Owner"
                            className="text-xs"
                          />
                          <Textarea
                            rows={1}
                            value={l.comment ?? ""}
                            onChange={(e) => updateLever(b.id, l.id, { comment: e.target.value })}
                            placeholder="Comment (shown next to lever in report)"
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniPreview({ bridge }: { bridge: CustomBridge }) {
  const rows = buildRows(bridge);
  const { min, max } = chartExtent(rows);
  const w = 320, h = 140, padL = 8, padR = 8, padT = 8, padB = 22;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const barW = plotW / rows.length;
  const bw = Math.max(2, barW * 0.7);
  const yAt = (v: number) => padT + plotH - ((v - min) / (max - min || 1)) * plotH;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded border border-border bg-white" style={{ height: h }}>
      {rows.map((r, i) => {
        const x = padL + i * barW + (barW - bw) / 2;
        const y1 = yAt(Math.max(r.range[0], r.range[1]));
        const y2 = yAt(Math.min(r.range[0], r.range[1]));
        const barH = Math.max(1, y2 - y1);
        return (
          <g key={i}>
            <rect x={x} y={y1} width={bw} height={barH} fill={r.fill} rx={1.5} />
            <text x={x + bw / 2} y={y1 - 2} textAnchor="middle" fontSize={7} fill="#171b21">{r.label}</text>
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize={7} fill="#6b7280">
              {r.name.length > 14 ? r.name.slice(0, 13) + "…" : r.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
