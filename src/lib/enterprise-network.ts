/**
 * Enterprise Network — pure model + analysis engine.
 *
 * The enterprise is modelled as a directed, weighted, typed graph:
 * nodes are capabilities / value streams / functions / decisions / resources,
 * links are information, material, financial, governance or decision
 * dependencies with a strength (0–1) and a lag in weeks.
 *
 * Everything here is deterministic and side-effect free so the UI, the board
 * report and any future server-side use share exactly the same numbers.
 */

import { detectLoops, type CldLink, type CldNode } from "@/lib/problem-tools";

// ---------------------------------------------------------------- types

export type EnLayer =
  | "strategy"
  | "capability"
  | "value_stream"
  | "function"
  | "decision"
  | "resource"
  | "kpi";

export type EnLinkType = "information" | "material" | "financial" | "governance" | "decision";

export type EnNode = {
  id: string;
  model_id: string;
  layer: EnLayer;
  node_type: string;
  label: string;
  pillar: string | null;
  owner_id: string | null;
  owner_label: string | null;
  criticality: number;
  health: string | null;
  notes: string | null;
  source_table: string | null;
  source_id: string | null;
  x: number | null;
  y: number | null;
  pinned: boolean;
  sort_order: number;
};

export type EnLink = {
  id: string;
  model_id: string;
  from_node: string;
  to_node: string;
  link_type: EnLinkType;
  strength: number;
  lag_weeks: number;
  polarity: "S" | "O";
  note: string | null;
};

export type EnScenario = {
  id: string;
  model_id: string;
  name: string;
  description: string | null;
  source_node: string | null;
  shock_pct: number;
  direction: "increase" | "decrease";
  settings: Record<string, unknown>;
  results: RippleResult[] | null;
  archived_at: string | null;
  created_at: string;
};

// ---------------------------------------------------------------- catalogue

export const LAYERS: { key: EnLayer; label: string; short: string; color: string; ring: string }[] = [
  { key: "strategy", label: "Strategic objective", short: "Strategy", color: "hsl(var(--chart-1, 222 60% 45%))", ring: "#2563eb" },
  { key: "capability", label: "Business capability", short: "Capability", color: "#7c3aed", ring: "#7c3aed" },
  { key: "value_stream", label: "Value stream", short: "Value stream", color: "#0891b2", ring: "#0891b2" },
  { key: "function", label: "Function / team", short: "Function", color: "#059669", ring: "#059669" },
  { key: "decision", label: "Decision point", short: "Decision", color: "#d97706", ring: "#d97706" },
  { key: "resource", label: "Resource / supplier", short: "Resource", color: "#e11d48", ring: "#e11d48" },
  { key: "kpi", label: "KPI / outcome", short: "KPI", color: "#475569", ring: "#475569" },
];

export const LAYER_ORDER: EnLayer[] = [
  "strategy",
  "capability",
  "value_stream",
  "function",
  "decision",
  "resource",
  "kpi",
];

export function layerMeta(layer: string) {
  return LAYERS.find((l) => l.key === layer) ?? LAYERS[1]!;
}

export const LINK_TYPES: {
  key: EnLinkType;
  label: string;
  color: string;
  dash: string | undefined;
  hint: string;
}[] = [
  { key: "information", label: "Information", color: "#2563eb", dash: "6 4", hint: "Forecasts, plans, signals, data" },
  { key: "material", label: "Material", color: "#059669", dash: undefined, hint: "Parts, product, physical flow" },
  { key: "financial", label: "Financial", color: "#d97706", dash: "1 5", hint: "Cash, cost, margin, funding" },
  { key: "governance", label: "Governance", color: "#7c3aed", dash: "10 4", hint: "Policy, standard, control" },
  { key: "decision", label: "Decision right", color: "#e11d48", dash: "2 3", hint: "Who decides, and for whom" },
];

export function linkMeta(type: string) {
  return LINK_TYPES.find((l) => l.key === type) ?? LINK_TYPES[0]!;
}

export const HEALTH_COLORS: Record<string, string> = {
  green: "#16a34a",
  yellow: "#eab308",
  red: "#dc2626",
};

// ---------------------------------------------------------------- layout

const W = 1560;
const H = 700;

export const CANVAS = { W, H };

const NODE_W = 132;
const GAP_X = 24;
const TOP = 60;

/**
 * Layered (Sugiyama-style) layout: one horizontal band per abstraction level,
 * x settled by barycentre of connected nodes and then de-overlapped. Far more
 * readable than a free force layout once the model has 30+ nodes.
 *
 * Nodes that are pinned keep their saved coordinates.
 */
export function layoutNodes(nodes: EnNode[], links: EnLink[], iterations = 40): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  const fixed = new Set<string>();

  const lanesPresent = LAYER_ORDER.filter((l) => nodes.some((n) => n.layer === l));
  const laneY = (layer: EnLayer) => {
    const i = Math.max(0, lanesPresent.indexOf(layer));
    const span = H - TOP * 2;
    return TOP + (lanesPresent.length <= 1 ? span / 2 : (i * span) / (lanesPresent.length - 1));
  };

  const byLayer = new Map<EnLayer, EnNode[]>();
  nodes.forEach((n) => {
    const arr = byLayer.get(n.layer) ?? [];
    arr.push(n);
    byLayer.set(n.layer, arr);
  });

  nodes.forEach((n) => {
    if (n.pinned && n.x != null && n.y != null) {
      pos[n.id] = { x: Number(n.x), y: Number(n.y) };
      fixed.add(n.id);
      return;
    }
    if (n.x != null && n.y != null) {
      pos[n.id] = { x: Number(n.x), y: Number(n.y) };
      return;
    }
    const peers = byLayer.get(n.layer) ?? [];
    const i = Math.max(0, peers.findIndex((p) => p.id === n.id));
    const step = W / (peers.length + 1);
    pos[n.id] = { x: step * (i + 1), y: laneY(n.layer) };
  });

  if (nodes.length < 2) return pos;

  const neighbours = new Map<string, string[]>();
  links.forEach((l) => {
    if (!pos[l.from_node] || !pos[l.to_node]) return;
    (neighbours.get(l.from_node) ?? neighbours.set(l.from_node, []).get(l.from_node)!).push(l.to_node);
    (neighbours.get(l.to_node) ?? neighbours.set(l.to_node, []).get(l.to_node)!).push(l.from_node);
  });

  for (let it = 0; it < iterations; it++) {
    // 1. barycentre: pull each node under/over the things it connects to
    nodes.forEach((n) => {
      if (fixed.has(n.id)) return;
      const ns = neighbours.get(n.id) ?? [];
      if (!ns.length) return;
      const mean = ns.reduce((sum, o) => sum + (pos[o]?.x ?? 0), 0) / ns.length;
      pos[n.id]!.x += (mean - pos[n.id]!.x) * 0.5;
    });

    // 2. keep every lane on its band and free of overlaps
    lanesPresent.forEach((layer) => {
      const row = (byLayer.get(layer) ?? []).slice().sort((a, b) => (pos[a.id]!.x - pos[b.id]!.x));
      const y = laneY(layer);
      const minGap = NODE_W + GAP_X;
      const needed = minGap * row.length;
      const scale = needed > W - 80 ? (W - 80) / needed : 1;
      const gap = minGap * scale;

      row.forEach((n, i) => {
        if (!fixed.has(n.id)) pos[n.id]!.y = y;
        if (i === 0) return;
        const prev = row[i - 1]!;
        const min = pos[prev.id]!.x + gap;
        if (pos[n.id]!.x < min && !fixed.has(n.id)) pos[n.id]!.x = min;
      });
      // recentre the lane
      const first = row[0];
      const last = row[row.length - 1];
      if (first && last) {
        const width = pos[last.id]!.x - pos[first.id]!.x;
        const shift = (W - width) / 2 - pos[first.id]!.x;
        row.forEach((n) => {
          if (!fixed.has(n.id)) pos[n.id]!.x = clamp(pos[n.id]!.x + shift, NODE_W / 2 + 20, W - NODE_W / 2 - 20);
        });
      }
    });
  }

  return pos;
}


function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------- ripple

export type RippleResult = {
  nodeId: string;
  label: string;
  layer: EnLayer;
  impact: number; // signed percentage points
  severity: number; // absolute impact
  hops: number;
  weeks: number;
  path: string[]; // node ids, source first
  via: EnLinkType[];
};

export type RippleOptions = {
  decay?: number; // per-hop damping (default 0.85)
  minStrength?: number; // ignore weaker links
  maxHops?: number;
  cutoff?: number; // stop when |impact| below this (percentage points)
  linkTypes?: EnLinkType[]; // restrict propagation to these flows
};

/**
 * Propagate a shock from one node. Impact at each node is the best (largest
 * magnitude) path product of link strengths, damped per hop; polarity flips
 * the sign, lag accumulates in weeks.
 */
export function simulateRipple(
  nodes: EnNode[],
  links: EnLink[],
  sourceId: string,
  shockPct: number,
  opts: RippleOptions = {},
): RippleResult[] {
  const decay = opts.decay ?? 0.85;
  const minStrength = opts.minStrength ?? 0.05;
  const maxHops = opts.maxHops ?? 6;
  const cutoff = opts.cutoff ?? 0.25;
  const allowed = opts.linkTypes && opts.linkTypes.length ? new Set(opts.linkTypes) : null;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  if (!nodeById.has(sourceId)) return [];

  const out = new Map<string, EnLink[]>();
  links.forEach((l) => {
    if (allowed && !allowed.has(l.link_type)) return;
    if (l.strength < minStrength) return;
    if (!nodeById.has(l.from_node) || !nodeById.has(l.to_node)) return;
    const arr = out.get(l.from_node) ?? [];
    arr.push(l);
    out.set(l.from_node, arr);
  });

  const best = new Map<string, RippleResult>();
  const seed: RippleResult = {
    nodeId: sourceId,
    label: nodeById.get(sourceId)!.label,
    layer: nodeById.get(sourceId)!.layer,
    impact: shockPct,
    severity: Math.abs(shockPct),
    hops: 0,
    weeks: 0,
    path: [sourceId],
    via: [],
  };
  best.set(sourceId, seed);

  // breadth-first relaxation; keeps the strongest route to each node
  let frontier: RippleResult[] = [seed];
  for (let hop = 0; hop < maxHops && frontier.length; hop++) {
    const next: RippleResult[] = [];
    for (const cur of frontier) {
      for (const l of out.get(cur.nodeId) ?? []) {
        if (cur.path.includes(l.to_node)) continue; // no revisiting on one path
        const sign = l.polarity === "O" ? -1 : 1;
        const impact = cur.impact * l.strength * decay * sign;
        if (Math.abs(impact) < cutoff) continue;
        const target = nodeById.get(l.to_node)!;
        const cand: RippleResult = {
          nodeId: l.to_node,
          label: target.label,
          layer: target.layer,
          impact,
          severity: Math.abs(impact),
          hops: cur.hops + 1,
          weeks: cur.weeks + Number(l.lag_weeks ?? 0),
          path: [...cur.path, l.to_node],
          via: [...cur.via, l.link_type],
        };
        const prev = best.get(l.to_node);
        if (!prev || cand.severity > prev.severity + 1e-9) {
          best.set(l.to_node, cand);
          next.push(cand);
        }
      }
    }
    frontier = next;
  }

  return [...best.values()].sort((a, b) => b.severity - a.severity);
}

/** Plain-language read-out of a simulation, for exec consumption. */
export function rippleNarrative(results: RippleResult[], shockPct: number, direction: "increase" | "decrease"): string {
  if (results.length <= 1) return "This node has no outbound dependencies yet, so the change stays where it starts.";
  const source = results.find((r) => r.hops === 0);
  const downstream = results.filter((r) => r.hops > 0);
  const top = downstream.slice(0, 3);
  const fastest = [...downstream].sort((a, b) => a.weeks - b.weeks)[0]!;
  const slowest = [...downstream].sort((a, b) => b.weeks - a.weeks)[0]!;
  const dirWord = direction === "increase" ? "rise" : "drop";
  return [
    `A ${Math.abs(shockPct)}% ${dirWord} at ${source?.label ?? "the source"} reaches ${downstream.length} other part${downstream.length === 1 ? "" : "s"} of the business.`,
    `The strongest effects land on ${top.map((t) => `${t.label} (${fmtImpact(t.impact)})`).join(", ")}.`,
    `${fastest.label} feels it first, in about ${fmtWeeks(fastest.weeks)}; ${slowest.label} is the last to move, at roughly ${fmtWeeks(slowest.weeks)}.`,
  ].join(" ");
}

export function fmtImpact(v: number) {
  const s = v >= 0 ? "+" : "−";
  return `${s}${Math.abs(v).toFixed(1)}%`;
}

export function fmtWeeks(w: number) {
  if (!w) return "the same week";
  if (w < 1) return "under a week";
  if (w === 1) return "1 week";
  return `${w % 1 === 0 ? w : w.toFixed(1)} weeks`;
}

// ---------------------------------------------------------------- analysis

export type CriticalityRow = {
  nodeId: string;
  label: string;
  layer: EnLayer;
  betweenness: number; // share of shortest paths passing through
  inDegree: number;
  outDegree: number;
  reach: number; // nodes reachable downstream
  score: number; // 0–100 blended
};

/** Brandes-style betweenness on the unweighted directed graph + degree/reach. */
export function analyseCriticality(nodes: EnNode[], links: EnLink[]): CriticalityRow[] {
  const ids = nodes.map((n) => n.id);
  const adj = new Map<string, string[]>();
  ids.forEach((id) => adj.set(id, []));
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  ids.forEach((id) => {
    inDeg.set(id, 0);
    outDeg.set(id, 0);
  });
  links.forEach((l) => {
    if (!adj.has(l.from_node) || !adj.has(l.to_node)) return;
    adj.get(l.from_node)!.push(l.to_node);
    outDeg.set(l.from_node, (outDeg.get(l.from_node) ?? 0) + 1);
    inDeg.set(l.to_node, (inDeg.get(l.to_node) ?? 0) + 1);
  });

  const bc = new Map<string, number>(ids.map((id) => [id, 0]));
  const reach = new Map<string, number>(ids.map((id) => [id, 0]));

  for (const s of ids) {
    const stack: string[] = [];
    const preds = new Map<string, string[]>(ids.map((id) => [id, []]));
    const sigma = new Map<string, number>(ids.map((id) => [id, 0]));
    const dist = new Map<string, number>(ids.map((id) => [id, -1]));
    sigma.set(s, 1);
    dist.set(s, 0);
    const queue: string[] = [s];
    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) ?? []) {
        if (dist.get(w) === -1) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          preds.get(w)!.push(v);
        }
      }
    }
    reach.set(s, ids.filter((id) => id !== s && dist.get(id)! >= 0).length);
    const delta = new Map<string, number>(ids.map((id) => [id, 0]));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of preds.get(w) ?? []) {
        delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      }
      if (w !== s) bc.set(w, bc.get(w)! + delta.get(w)!);
    }
  }

  const maxBc = Math.max(1, ...[...bc.values()]);
  const maxReach = Math.max(1, ...[...reach.values()]);

  return nodes
    .map((n) => {
      const b = bc.get(n.id) ?? 0;
      const r = reach.get(n.id) ?? 0;
      const deg = (inDeg.get(n.id) ?? 0) + (outDeg.get(n.id) ?? 0);
      const score =
        100 *
        (0.45 * (b / maxBc) + 0.3 * (r / maxReach) + 0.15 * Math.min(1, deg / 8) + 0.1 * Number(n.criticality ?? 0.5));
      return {
        nodeId: n.id,
        label: n.label,
        layer: n.layer,
        betweenness: b,
        inDegree: inDeg.get(n.id) ?? 0,
        outDegree: outDeg.get(n.id) ?? 0,
        reach: r,
        score: Math.round(score),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export type LoopRow = { key: string; type: "R" | "B"; nodes: string[] };

export function findFeedbackLoops(nodes: EnNode[], links: EnLink[]): LoopRow[] {
  const cldNodes: CldNode[] = nodes.map((n) => ({ id: n.id, label: n.label, x: 0, y: 0 }));
  const cldLinks: CldLink[] = links.map((l) => ({
    id: l.id,
    from: l.from_node,
    to: l.to_node,
    polarity: l.polarity === "O" ? "O" : "S",
  }));
  return detectLoops(cldNodes, cldLinks).map((l) => ({ key: l.key, type: l.type, nodes: l.nodes }));
}

export type ClusterRow = { id: number; nodeIds: string[]; label: string };

/** Weakly-connected components — the practical "silo" view. */
export function findClusters(nodes: EnNode[], links: EnLink[]): ClusterRow[] {
  const parent = new Map<string, string>(nodes.map((n) => [n.id, n.id]));
  const find = (a: string): string => {
    let r = a;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(a) !== r) {
      const nxt = parent.get(a)!;
      parent.set(a, r);
      a = nxt;
    }
    return r;
  };
  links.forEach((l) => {
    if (!parent.has(l.from_node) || !parent.has(l.to_node)) return;
    const a = find(l.from_node);
    const b = find(l.to_node);
    if (a !== b) parent.set(a, b);
  });
  const groups = new Map<string, string[]>();
  nodes.forEach((n) => {
    const r = find(n.id);
    (groups.get(r) ?? groups.set(r, []).get(r)!).push(n.id);
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return [...groups.values()]
    .sort((a, b) => b.length - a.length)
    .map((ids, i) => ({
      id: i,
      nodeIds: ids,
      label: ids.length === 1 ? `${byId.get(ids[0]!)?.label ?? "?"} (isolated)` : `${byId.get(ids[0]!)?.label ?? "?"} +${ids.length - 1}`,
    }));
}

export type GapRow = { severity: "high" | "medium" | "low"; kind: string; message: string; nodeId?: string };

export function findGaps(nodes: EnNode[], links: EnLink[]): GapRow[] {
  const out: GapRow[] = [];
  const inTo = new Map<string, EnLink[]>();
  const outFrom = new Map<string, EnLink[]>();
  links.forEach((l) => {
    (inTo.get(l.to_node) ?? inTo.set(l.to_node, []).get(l.to_node)!).push(l);
    (outFrom.get(l.from_node) ?? outFrom.set(l.from_node, []).get(l.from_node)!).push(l);
  });

  nodes.forEach((n) => {
    const ins = inTo.get(n.id) ?? [];
    const outs = outFrom.get(n.id) ?? [];

    if (!ins.length && !outs.length) {
      out.push({ severity: "medium", kind: "Disconnected", message: `${n.label} has no dependencies in or out — it is modelled as an island.`, nodeId: n.id });
    }
    if (n.layer === "strategy" && !ins.length) {
      out.push({ severity: "high", kind: "Unsupported objective", message: `${n.label} has no capability feeding it.`, nodeId: n.id });
    }
    if (n.layer === "capability") {
      if (!n.owner_label && !n.owner_id) {
        out.push({ severity: "medium", kind: "No owner", message: `Capability ${n.label} has no accountable owner.`, nodeId: n.id });
      }
      if (!outs.some((l) => nodeLayer(nodes, l.to_node) === "strategy")) {
        out.push({ severity: "low", kind: "Unlinked capability", message: `${n.label} does not feed any strategic objective.`, nodeId: n.id });
      }
    }
    if (n.layer === "value_stream" && !outs.some((l) => nodeLayer(nodes, l.to_node) === "kpi")) {
      out.push({ severity: "medium", kind: "Unmeasured value stream", message: `${n.label} has no KPI attached.`, nodeId: n.id });
    }
    if (n.layer === "decision") {
      const gov = ins.filter((l) => l.link_type === "governance" || l.link_type === "decision");
      if (!gov.length) {
        out.push({ severity: "high", kind: "Undefined decision right", message: `Decision "${n.label}" has no governance or decision-right link in — nobody formally owns it.`, nodeId: n.id });
      } else if (gov.length > 1) {
        out.push({ severity: "medium", kind: "Contested decision", message: `Decision "${n.label}" has ${gov.length} owners claiming the call.`, nodeId: n.id });
      }
    }
  });

  const order = { high: 0, medium: 1, low: 2 } as const;
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

function nodeLayer(nodes: EnNode[], id: string): EnLayer | null {
  return nodes.find((n) => n.id === id)?.layer ?? null;
}

// ---------------------------------------------------------------- filtering

export type EnFilters = {
  layers: EnLayer[];
  linkTypes: EnLinkType[];
  pillars: string[];
  health: string[];
  minCriticality: number;
  minStrength: number;
  focusId: string | null;
  focusHops: number;
  pathToId: string | null;
  search: string;
};

export const DEFAULT_FILTERS: EnFilters = {
  layers: [...LAYER_ORDER],
  linkTypes: LINK_TYPES.map((l) => l.key),
  pillars: [],
  health: [],
  minCriticality: 0,
  minStrength: 0,
  focusId: null,
  focusHops: 2,
  pathToId: null,
  search: "",
};

export function applyFilters(nodes: EnNode[], links: EnLink[], f: EnFilters): { nodes: EnNode[]; links: EnLink[] } {
  let keep = nodes.filter((n) => {
    if (!f.layers.includes(n.layer)) return false;
    if (f.pillars.length && !(n.pillar && f.pillars.includes(n.pillar))) return false;
    if (f.health.length && !(n.health && f.health.includes(n.health))) return false;
    if (Number(n.criticality ?? 0) < f.minCriticality) return false;
    if (f.search.trim() && !n.label.toLowerCase().includes(f.search.trim().toLowerCase())) return false;
    return true;
  });

  let keepIds = new Set(keep.map((n) => n.id));
  let keepLinks = links.filter(
    (l) => f.linkTypes.includes(l.link_type) && l.strength >= f.minStrength && keepIds.has(l.from_node) && keepIds.has(l.to_node),
  );

  // path mode wins over hop-radius mode
  if (f.focusId && f.pathToId && keepIds.has(f.focusId) && keepIds.has(f.pathToId)) {
    const path = shortestPath(keepLinks, f.focusId, f.pathToId);
    const set = new Set(path);
    keep = keep.filter((n) => set.has(n.id));
    keepIds = new Set(keep.map((n) => n.id));
    keepLinks = keepLinks.filter((l) => set.has(l.from_node) && set.has(l.to_node));
    return { nodes: keep, links: keepLinks };
  }

  if (f.focusId && keepIds.has(f.focusId)) {
    const within = hopSet(keepLinks, f.focusId, f.focusHops);
    keep = keep.filter((n) => within.has(n.id));
    keepIds = new Set(keep.map((n) => n.id));
    keepLinks = keepLinks.filter((l) => keepIds.has(l.from_node) && keepIds.has(l.to_node));
  }

  return { nodes: keep, links: keepLinks };
}

/** Undirected hop neighbourhood — you care about what touches a node either way. */
function hopSet(links: EnLink[], start: string, hops: number): Set<string> {
  const adj = new Map<string, string[]>();
  links.forEach((l) => {
    (adj.get(l.from_node) ?? adj.set(l.from_node, []).get(l.from_node)!).push(l.to_node);
    (adj.get(l.to_node) ?? adj.set(l.to_node, []).get(l.to_node)!).push(l.from_node);
  });
  const seen = new Set([start]);
  let frontier = [start];
  for (let i = 0; i < hops; i++) {
    const next: string[] = [];
    frontier.forEach((id) =>
      (adj.get(id) ?? []).forEach((o) => {
        if (!seen.has(o)) {
          seen.add(o);
          next.push(o);
        }
      }),
    );
    frontier = next;
  }
  return seen;
}

export function shortestPath(links: EnLink[], from: string, to: string): string[] {
  const adj = new Map<string, string[]>();
  links.forEach((l) => (adj.get(l.from_node) ?? adj.set(l.from_node, []).get(l.from_node)!).push(l.to_node));
  const prev = new Map<string, string>();
  const seen = new Set([from]);
  const q = [from];
  while (q.length) {
    const v = q.shift()!;
    if (v === to) break;
    for (const w of adj.get(v) ?? []) {
      if (seen.has(w)) continue;
      seen.add(w);
      prev.set(w, v);
      q.push(w);
    }
  }
  if (!seen.has(to)) return [];
  const path = [to];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur);
    if (!p) return [];
    path.unshift(p);
    cur = p;
  }
  return path;
}
