export type EolPhase = 1 | 2 | 3 | 4 | 5;

export type EolProgram = {
  id: string;
  company_id: string;
  product_name: string;
  platform: string | null;
  family: string | null;
  description: string | null;
  phase: EolPhase;
  status: string;
  health: "green" | "yellow" | "red" | null;
  eos_announce_date: string | null;
  ltb_cutoff_date: string | null;
  fts_date: string | null;
  line_clear_date: string | null;
  closeout_date: string | null;
  reserve_budget: number | null;
  lifetime_revenue: number | null;
  currency: string;
  program_owner_id: string | null;
  engineering_owner_id: string | null;
  supply_chain_owner_id: string | null;
  aftermarket_owner_id: string | null;
  finance_owner_id: string | null;
  notes: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EolChecklistItem = {
  id: string;
  program_id: string;
  phase: EolPhase;
  sort_order: number;
  label: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  evidence_url: string | null;
  notes: string | null;
};

export type EolReadinessItem = {
  id: string;
  program_id: string;
  domain: string;
  deliverable: string;
  owner_id: string | null;
  rag: "green" | "yellow" | "red" | null;
  complete: boolean;
  notes: string | null;
  sort_order: number;
};

export type EolLtbItem = {
  id: string;
  program_id: string;
  part_number: string;
  description: string | null;
  risk_tier: string;
  supplier: string | null;
  forecast_qty: number | null;
  ordered_qty: number | null;
  consumed_qty: number | null;
  unit_cost: number | null;
  holding_strategy: string;
  notes: string | null;
};

export type EolAssetItem = {
  id: string;
  program_id: string;
  asset_name: string;
  asset_tag: string | null;
  disposition: string;
  book_value: number | null;
  realized_value: number | null;
  status: string;
  location: string | null;
  notes: string | null;
};

export type EolMigrationItem = {
  id: string;
  program_id: string;
  customer: string;
  current_product: string | null;
  target_product: string | null;
  notice_date: string | null;
  status: string;
  revenue_at_risk: number | null;
  notes: string | null;
};

export const PHASE_LABELS: Record<number, { code: string; short: string; full: string; window: string; blurb: string }> = {
  1: {
    code: "8A",
    short: "Trigger & Strategy",
    full: "Trigger & Strategy Alignment",
    window: "T-24 to T-18 months",
    blurb:
      "Sign off the formal EOL business case (margin erosion, component obsolescence, regulatory shift or next-gen substitution), nominate the cross-functional team and map component commonality so shared parts are not killed by accident.",
  },
  2: {
    code: "8B",
    short: "Customer Migration",
    full: "Commercial & Customer Migration",
    window: "T-18 to T-12 months",
    blurb:
      "Issue formal End-of-Sale notices with a precise replacement roadmap, build the Last Time Buy demand model from contracted spares, warranty obligations and historical MRO demand, and clear all LTSA obligations before production stops.",
  },
  3: {
    code: "8C",
    short: "Ramp-Down",
    full: "Supply Chain & Factory Ramp-Down",
    window: "T-12 to T-0 (Final Time Ship)",
    blurb:
      "Place the final component POs, close out suppliers and protect single-source IP and tooling, then phase out the production cell with floor-space re-allocation, operator re-skilling and Short Interval Control on the final runs.",
  },
  4: {
    code: "8D",
    short: "Asset Recovery",
    full: "Asset Recovery & Aftermarket Transition",
    window: "T-0 to T+12 months",
    blurb:
      "Audit and dispose of tooling and fixtures, harvest high-value cores and Used Serviceable Material for aftermarket support, and lock the IP — build records, FAI reports, CAD, test software and technical publications.",
  },
  5: {
    code: "8E",
    short: "Closeout",
    full: "Final Gate Sign-Off & Closeout",
    window: "T+12 months",
    blurb:
      "Reconcile scrap write-downs against the EOL reserve, complete EHS and regulatory decommissioning, and feed Design-for-EOL learning back into current design projects before the final P&L sign-off.",
  },
};

export const PHASE_COLORS: Record<number, string> = {
  1: "bg-slate-500 text-white",
  2: "bg-blue-500 text-white",
  3: "bg-amber-500 text-white",
  4: "bg-indigo-500 text-white",
  5: "bg-emerald-500 text-white",
};

export const HEALTH_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export const EOL_STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  on_track: "On track",
  at_risk: "At risk",
  delayed: "Delayed",
  on_hold: "On hold",
  complete: "Complete",
};

export const RISK_TIER_LABELS: Record<string, string> = {
  cots: "Standard COTS",
  custom: "Custom machined / moulded",
  obsolete_electronics: "Obsolete electronics",
};

export const HOLDING_LABELS: Record<string, string> = {
  in_house: "In-house stock",
  three_pl: "3PL consignment",
  distributor: "Distributor drop-ship",
};

export const DISPOSITION_LABELS: Record<string, string> = {
  undecided: "Undecided",
  repurpose: "Repurpose",
  transfer: "Transfer / consign",
  scrap: "Scrap & monetize",
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

export const MIGRATION_STATUS_LABELS: Record<string, string> = {
  not_notified: "Not notified",
  notified: "Notified",
  in_migration: "In migration",
  migrated: "Migrated",
  lost: "Lost",
};

export const READINESS_DOMAINS = [
  "Product Mgmt & Commercial",
  "Manufacturing Engineering",
  "Supply Chain & Sourcing",
  "Quality & Regulatory",
  "Aftermarket & MRO",
  "Finance",
];

export const VALUE_DRIVERS: { title: string; body: string }[] = [
  {
    title: "Advanced Last Time Buy modelling",
    body: "The biggest Gate 8 sinkhole is a mis-sized LTB. Slice items by risk tier (COTS, custom machined, obsolete electronics) and park long-tail stock with a 3PL or distributor to clear factory floor space.",
  },
  {
    title: "Tooling & asset disposition protocol",
    body: "No tooling sits in facility limbo. Every fixture gets one of three outcomes: repurpose onto an active line, transfer or consign to an aftermarket supplier under licence, or de-identify and scrap for material value.",
  },
  {
    title: "Circular economy & USM harvesting",
    body: "Treat retired units as a parts pool, not waste. Retain test rigs and conversion kits, and set teardown and inspection criteria to harvest field-grade subassemblies for warranty and MRO support.",
  },
];

export function money(v: number | null | undefined, currency = "USD") {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

export function pct(v: number | null | undefined, digits = 1) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}%`;
}

/** Gate 8 KPIs derived from the entered programme data. */
export function eolKpis(p: EolProgram, ltb: EolLtbItem[], assets: EolAssetItem[], mig: EolMigrationItem[]) {
  const scrapValue = assets
    .filter((a) => a.disposition === "scrap")
    .reduce((s, a) => s + ((a.book_value ?? 0) - (a.realized_value ?? 0)), 0);
  const obsolescenceRatio = p.lifetime_revenue && p.lifetime_revenue > 0
    ? (scrapValue / p.lifetime_revenue) * 100
    : null;

  const forecast = ltb.reduce((s, i) => s + (i.forecast_qty ?? 0), 0);
  const consumed = ltb.reduce((s, i) => s + (i.consumed_qty ?? 0), 0);
  const ltbVariance = forecast > 0 ? ((consumed - forecast) / forecast) * 100 : null;

  const floorVelocity = p.fts_date && p.line_clear_date
    ? Math.round((new Date(p.line_clear_date).getTime() - new Date(p.fts_date).getTime()) / 86400000)
    : null;

  const migrated = mig.filter((m) => m.status === "migrated").length;
  const migrationRate = mig.length > 0 ? (migrated / mig.length) * 100 : null;

  const realized = assets.reduce((s, a) => s + (a.realized_value ?? 0), 0);
  const reserveUse = p.reserve_budget && p.reserve_budget > 0 ? (scrapValue / p.reserve_budget) * 100 : null;

  const ltbSpend = ltb.reduce((s, i) => s + (i.ordered_qty ?? 0) * (i.unit_cost ?? 0), 0);

  return { scrapValue, obsolescenceRatio, ltbVariance, floorVelocity, migrationRate, realized, reserveUse, ltbSpend };
}
