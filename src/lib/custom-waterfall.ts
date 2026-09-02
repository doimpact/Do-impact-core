// Ad-hoc waterfall bridges authored directly from the Board Report page.
// Persisted per-browser in localStorage; not tied to strategy/waterfall tables.

export type CustomLever = {
  id: string;
  label: string;
  delta: number;        // signed number; +gain, -headwind
  owner?: string;
  comment?: string;
};

export type CustomBridge = {
  id: string;
  title: string;
  comment?: string;
  startLabel: string;
  startValue: number;
  endLabel: string;
  endValue: number | null; // null → computed from start + levers
  levers: CustomLever[];
};

export type WfRow = {
  name: string;
  range: [number, number];
  fill: string;
  label: string;
  isAnchor: boolean;
  signed: number;
};

const ANCHOR = "#2d5c48";
const POS = "#3b82f6";
const NEG = "#ef4444";

export const STORAGE_KEY = "boardCustomWaterfalls_v1";

export function newBridge(): CustomBridge {
  return {
    id: crypto.randomUUID(),
    title: "Custom bridge",
    comment: "",
    startLabel: "Start",
    startValue: 0,
    endLabel: "End",
    endValue: null,
    levers: [],
  };
}

export function newLever(): CustomLever {
  return { id: crypto.randomUUID(), label: "Lever", delta: 0, owner: "", comment: "" };
}

export function loadBridges(): CustomBridge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveBridges(bridges: CustomBridge[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bridges)); } catch { /* ignore */ }
}

export function formatNum(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function buildRows(b: CustomBridge): WfRow[] {
  const rows: WfRow[] = [];
  let cum = Number(b.startValue) || 0;
  rows.push({
    name: b.startLabel || "Start",
    range: [0, cum],
    fill: ANCHOR,
    label: formatNum(cum),
    isAnchor: true,
    signed: cum,
  });
  for (const lv of b.levers) {
    const d = Number(lv.delta) || 0;
    const start = cum;
    cum = cum + d;
    const range: [number, number] = d >= 0 ? [start, cum] : [cum, start];
    rows.push({
      name: lv.label || "—",
      range,
      fill: d >= 0 ? POS : NEG,
      label: (d >= 0 ? "+" : "−") + formatNum(Math.abs(d)),
      isAnchor: false,
      signed: d,
    });
  }
  const endVal = b.endValue == null ? cum : Number(b.endValue);
  rows.push({
    name: b.endLabel || "End",
    range: [0, endVal],
    fill: ANCHOR,
    label: formatNum(endVal),
    isAnchor: true,
    signed: endVal,
  });
  return rows;
}

export function chartExtent(rows: WfRow[]): { min: number; max: number } {
  let min = 0, max = 0;
  for (const r of rows) {
    min = Math.min(min, r.range[0], r.range[1]);
    max = Math.max(max, r.range[0], r.range[1]);
  }
  if (max === min) max = min + 1;
  return { min, max };
}
