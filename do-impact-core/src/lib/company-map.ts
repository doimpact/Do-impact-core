/**
 * Company Map — data model + radial layout for the living company mindmap.
 *
 * Pure logic only (no React, no Supabase) so the layout can be unit tested
 * and rendered identically on the server and the client.
 */

export type MapPillarKey = "strategy" | "commercial" | "oms" | "people" | "actions";

export type MapStatus = "green" | "amber" | "red" | "empty";

/** How a module node counts its rows and decides whether it is hot. */
export type ModuleSpec = {
  /** nav-registry key — used to respect the user's Settings visibility. */
  navKey: string;
  id: string;
  label: string;
  to: string;
  table: string;
  /** Rows that are excluded from every count (soft-deleted records). */
  archivedColumn?: string;
  /** Boolean soft-delete column (true = archived). */
  archivedFlag?: string;
  /** Column used for the leaf labels when the node is expanded. */
  titleColumn?: string;
  /** Column + values that mark a row as "still needs attention". */
  alert?: { column: string; notIn?: string[]; in?: string[] };
  /** Overdue rule: date column in the past AND alert filter still true. */
  overdueColumn?: string;
};

export type MapPillar = {
  key: MapPillarKey;
  label: string;
  tone: string;
  modules: ModuleSpec[];
};

export const MAP_PILLARS: MapPillar[] = [
  {
    key: "strategy",
    label: "Strategy",
    tone: "var(--pillar-strategy)",
    modules: [
      { navKey: "nav.strategy.hoshin", id: "hoshin", label: "Hoshin", to: "/strategy/hoshin", table: "hoshin_items", archivedColumn: "archived_at", titleColumn: "title" },
      { navKey: "nav.strategy.initiatives", id: "initiatives", label: "Initiatives", to: "/strategy/initiatives", table: "initiatives", archivedColumn: "archived_at", titleColumn: "title" },
      { navKey: "nav.strategy.capex", id: "capex", label: "CapEx", to: "/strategy/capex", table: "capex_projects", archivedColumn: "archived_at", titleColumn: "title", alert: { column: "health", in: ["red", "yellow"] } },
      { navKey: "nav.strategy.restructuring", id: "restructuring", label: "Restructuring", to: "/strategy/restructuring", table: "restructuring_items", archivedColumn: "archived_at", titleColumn: "title", alert: { column: "status", notIn: ["done", "complete"] }, overdueColumn: "due_date" },
    ],
  },
  {
    key: "commercial",
    label: "Commercial",
    tone: "var(--pillar-commercial)",
    modules: [
      { navKey: "nav.commercial.accounts", id: "accounts", label: "Accounts", to: "/commercial/accounts", table: "accounts", archivedColumn: "archived_at", titleColumn: "name" },
      { navKey: "nav.commercial.opportunities", id: "opportunities", label: "Pipeline", to: "/commercial/opportunities", table: "opportunities", archivedFlag: "archived", titleColumn: "name", alert: { column: "stage", in: ["prospect", "proposal"] } },
      { navKey: "nav.commercial.contracts", id: "contracts", label: "Contracts", to: "/commercial/contracts", table: "contracts", titleColumn: "title", alert: { column: "status", in: ["draft", "expired"] } },
      { navKey: "nav.commercial.stakeholders", id: "voc", label: "Voice of Customer", to: "/commercial/stakeholders", table: "interactions", titleColumn: "subject" },
    ],
  },
  {
    key: "oms",
    label: "Operations",
    tone: "var(--pillar-oms)",
    modules: [
      { navKey: "nav.oms.daily", id: "escalations", label: "Daily 3C", to: "/oms/daily", table: "dm_escalations", archivedColumn: "archived_at", titleColumn: "concern", alert: { column: "status", notIn: ["closed", "done"] }, overdueColumn: "due_date" },
      { navKey: "nav.oms.kpis", id: "kpis", label: "KPIs", to: "/oms/kpis", table: "kpis", archivedColumn: "archived_at", titleColumn: "name" },
      { navKey: "nav.oms.siop", id: "siop", label: "SIOP", to: "/oms/siop", table: "siop_cycles", titleColumn: "title" },
      { navKey: "nav.oms.supplychain", id: "supply", label: "Supply chain", to: "/oms/supply-chain", table: "sc_risks", archivedColumn: "archived_at", titleColumn: "title", alert: { column: "status", notIn: ["closed"] } },
      { navKey: "nav.oms.npi", id: "npi", label: "NPI", to: "/oms/npi", table: "npi_projects", archivedColumn: "archived_at", titleColumn: "part_name", alert: { column: "health", in: ["red", "yellow"] } },
      { navKey: "nav.oms.ampm", id: "ampm", label: "AM / PM", to: "/oms/am-pm", table: "ampm_work_orders", titleColumn: "wo_ref", alert: { column: "status", notIn: ["done", "closed", "verified"] } },
      { navKey: "nav.oms.safety", id: "safety", label: "Safety", to: "/oms/safety", table: "safety_reports", titleColumn: "ref", alert: { column: "status", notIn: ["closed"] } },
    ],
  },
  {
    key: "people",
    label: "People",
    tone: "var(--pillar-people)",
    modules: [
      { navKey: "nav.people.index", id: "employees", label: "Team", to: "/people", table: "employees", archivedColumn: "archived_at", titleColumn: "last_name" },
      { navKey: "nav.people.index", id: "skills", label: "Skills", to: "/people/skills", table: "employee_skills" },
      { navKey: "nav.people.development", id: "development", label: "Development", to: "/people/development", table: "development_plans", titleColumn: "notes", alert: { column: "status", notIn: ["done", "complete", "closed"] }, overdueColumn: "target_date" },
    ],
  },
  {
    key: "actions",
    label: "Execution",
    tone: "var(--accent)",
    modules: [
      { navKey: "nav.actions.index", id: "actions", label: "Actions", to: "/actions", table: "objective_actions", archivedColumn: "archived_at", titleColumn: "title", alert: { column: "status", notIn: ["done"] }, overdueColumn: "due_date" },
      { navKey: "nav.actions.eight-d", id: "eight_d", label: "8D", to: "/actions/eight-d", table: "eight_d_reports", archivedColumn: "archived_at", titleColumn: "title", alert: { column: "status", notIn: ["closed", "archived"] } },
      { navKey: "nav.actions.a3", id: "a3", label: "A3", to: "/actions/a3", table: "a3_reports", titleColumn: "title", alert: { column: "status", notIn: ["completed", "archived"] } },
      { navKey: "nav.actions.problem-solver", id: "problem", label: "Problem Solver", to: "/actions/problem-solver", table: "problem_plans", titleColumn: "title", alert: { column: "status", notIn: ["complete"] } },
    ],
  },
];

export type ModuleCounts = { total: number; open: number; overdue: number };

export function moduleStatus(c: ModuleCounts | undefined): MapStatus {
  if (!c || c.total === 0) return "empty";
  if (c.overdue > 0) return "red";
  if (c.open > 0) return "amber";
  return "green";
}

export const STATUS_COLOR: Record<MapStatus, string> = {
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#dc2626",
  empty: "#94a3b8",
};

export const STATUS_LABEL: Record<MapStatus, string> = {
  green: "Nothing open",
  amber: "Open items",
  red: "Overdue",
  empty: "Not used yet",
};

/* ------------------------------ layout ------------------------------ */

export type Point = { x: number; y: number };

export type LaidOutModule = ModuleSpec & { pos: Point; pillar: MapPillarKey; tone: string; angle: number; r: number };
export type LaidOutPillar = { pillar: MapPillar; pos: Point; angle: number; modules: LaidOutModule[] };

export type MapLayout = {
  centre: Point;
  pillars: LaidOutPillar[];
  width: number;
  height: number;
};

const R_PILLAR = 200;
const R_MODULE = 400;
const RING_STEP = 165;
const NODE_R = 46;
const PILLAR_R = 40;
const CENTRE_R = 104;
/** Minimum empty space between two circle edges. */
const GAP = 26;
const PAD = 90;

export function polar(centre: Point, r: number, angleDeg: number): Point {
  const a = (angleDeg * Math.PI) / 180;
  return { x: centre.x + r * Math.cos(a), y: centre.y + r * Math.sin(a) };
}

/** Node circle radius, driven by how many records the module holds. */
export function nodeRadius(total: number): number {
  if (!total) return NODE_R * 0.72;
  return NODE_R * (0.8 + Math.min(0.55, Math.log10(total + 1) * 0.45));
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Deterministic radial layout: one wedge per pillar, modules packed onto arcs
 * sized by their actual circle radius, then relaxed so nothing overlaps.
 */
export function layoutMap(pillars: MapPillar[], counts: Record<string, { total: number }> = {}): MapLayout {
  const centre = { x: 0, y: 0 };
  const wedge = 360 / Math.max(pillars.length, 1);

  const laid: LaidOutPillar[] = pillars.map((p, i) => {
    const base = -90 + i * wedge;
    const spread = wedge * 0.94;
    const start = base - spread / 2;

    let ring = R_MODULE;
    let cursor = start;
    const modules: LaidOutModule[] = p.modules.map((m) => {
      const r = nodeRadius(counts[m.id]?.total ?? 0);
      // Angular half-width this node needs on the current ring.
      const half = (Math.atan2(r + GAP / 2, ring) * 180) / Math.PI;
      if (cursor + half > start + spread + 0.01) {
        // Ran out of arc — start a fresh ring further out.
        ring += RING_STEP;
        cursor = start;
      }
      const a = Math.min(cursor + half, start + spread);
      cursor = a + half;
      return { ...m, pillar: p.key, tone: p.tone, angle: a, r, pos: polar(centre, ring, a) };
    });

    return { pillar: p, angle: base, pos: polar(centre, R_PILLAR, base), modules };
  });

  /* ---- relaxation: push apart anything that still overlaps ---- */
  const nodes = laid.flatMap((p) => p.modules);
  const hubs: Array<{ pos: Point; r: number }> = [
    { pos: centre, r: CENTRE_R },
    ...laid.map((p) => ({ pos: p.pos, r: PILLAR_R })),
  ];

  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const na = nodes[a]!;
        const nb = nodes[b]!;
        const need = na.r + nb.r + GAP;
        let d = dist(na.pos, nb.pos);
        if (d >= need) continue;
        if (d < 0.001) d = 0.001;
        const push = (need - d) / 2;
        const ux = (nb.pos.x - na.pos.x) / d;
        const uy = (nb.pos.y - na.pos.y) / d;
        na.pos = { x: na.pos.x - ux * push, y: na.pos.y - uy * push };
        nb.pos = { x: nb.pos.x + ux * push, y: nb.pos.y + uy * push };
        moved = true;
      }
    }
    // Keep nodes clear of the centre hub and every pillar hub.
    for (const n of nodes) {
      for (const h of hubs) {
        const need = n.r + h.r + GAP;
        let d = dist(n.pos, h.pos);
        if (d >= need) continue;
        if (d < 0.001) d = 0.001;
        const ux = (n.pos.x - h.pos.x) / d;
        const uy = (n.pos.y - h.pos.y) / d;
        n.pos = { x: h.pos.x + ux * need, y: h.pos.y + uy * need };
        moved = true;
      }
    }
    if (!moved) break;
  }

  // Refresh each node's angle so leaf pills still fan outwards correctly.
  for (const n of nodes) {
    n.angle = (Math.atan2(n.pos.y - centre.y, n.pos.x - centre.x) * 180) / Math.PI;
  }

  /* ---- auto-fit the canvas around everything we placed ---- */
  let minX = -CENTRE_R;
  let minY = -CENTRE_R;
  let maxX = CENTRE_R;
  let maxY = CENTRE_R;
  const consider = (pos: Point, r: number) => {
    minX = Math.min(minX, pos.x - r);
    minY = Math.min(minY, pos.y - r);
    maxX = Math.max(maxX, pos.x + r);
    maxY = Math.max(maxY, pos.y + r);
  };
  for (const h of hubs) consider(h.pos, h.r);
  for (const n of nodes) consider(n.pos, n.r + 24);

  const offX = PAD - minX;
  const offY = PAD - minY;
  const shift = (pt: Point): Point => ({ x: pt.x + offX, y: pt.y + offY });

  const shifted: LaidOutPillar[] = laid.map((p) => ({
    ...p,
    pos: shift(p.pos),
    modules: p.modules.map((m) => ({ ...m, pos: shift(m.pos) })),
  }));

  return {
    centre: shift(centre),
    pillars: shifted,
    width: Math.round(maxX - minX + PAD * 2),
    height: Math.round(maxY - minY + PAD * 2),
  };
}

/** Leaf pills fan outwards from a module node, spaced so they never stack. */
export function leafPositions(m: LaidOutModule, count: number, radius = 92): Point[] {
  if (count <= 0) return [];
  const r = Math.max(radius, m.r + 60);
  // Pills are 26px tall; keep at least 34px of arc between their centres.
  const stepDeg = Math.min(46, (Math.atan2(34, r) * 180) / Math.PI + 12);
  const spread = stepDeg * (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const a = m.angle - spread / 2 + i * stepDeg;
    return polar(m.pos, r + (i % 2 === 1 ? 34 : 0), a);
  });
}

