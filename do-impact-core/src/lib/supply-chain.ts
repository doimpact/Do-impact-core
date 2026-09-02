import { supabase } from "@/integrations/supabase/client";

/** Loose client for the data-driven supply-chain tables. */
export const scClient = supabase as unknown as {
  from: (table: string) => {
    select: (cols?: string) => any;
    insert: (values: any) => any;
    update: (values: any) => any;
    delete: () => any;
  };
};

export type ScRow = Record<string, any>;

export const SC_TABLES = {
  categories: "sc_categories",
  segments: "sc_segments",
  riskTypes: "sc_risk_types",
  escalationLevels: "sc_escalation_levels",
  metrics: "sc_score_metrics",
  onboardingTemplates: "sc_onboarding_templates",
  contractClauses: "sc_contract_clauses",
  reviewTypes: "sc_review_types",
  suppliers: "sc_suppliers",
  scorecards: "sc_scorecards",
  scores: "sc_scorecard_scores",
  risks: "sc_risks",
  capacity: "sc_capacity",
  contracts: "sc_contracts",
  onboarding: "sc_onboarding_items",
  development: "sc_development_plans",
  reviews: "sc_reviews",
  candidates: "sc_selection_candidates",
  gates: "sc_selection_gates",
  escalations: "sc_escalations",
  actions: "sc_actions",
} as const;

export type Metric = { id: string; name: string; dimension: string; weight_pct: number; archived_at: string | null; sort_order: number };
export type Score = { id: string; scorecard_id: string; metric_id: string; score: number };

/** Weighted 0–100 score for one scorecard. Metrics are scored 0–100. */
export function weightedScore(scores: Score[], metrics: Metric[]): number | null {
  const live = metrics.filter((m) => !m.archived_at);
  let weight = 0;
  let total = 0;
  for (const m of live) {
    const s = scores.find((x) => x.metric_id === m.id);
    if (!s) continue;
    weight += Number(m.weight_pct) || 0;
    total += (Number(s.score) || 0) * (Number(m.weight_pct) || 0);
  }
  if (weight <= 0) return null;
  return Math.round((total / weight) * 10) / 10;
}

export function ratingBand(score: number | null): { label: string; className: string } {
  if (score === null) return { label: "No data", className: "bg-muted text-muted-foreground" };
  if (score >= 90) return { label: "Excellent", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" };
  if (score >= 75) return { label: "Good", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" };
  if (score >= 60) return { label: "Needs improvement", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
  return { label: "At risk", className: "bg-red-500/15 text-red-600 dark:text-red-400" };
}

export function riskBand(likelihood: number, impact: number): { label: string; className: string } {
  const v = (Number(likelihood) || 0) * (Number(impact) || 0);
  if (v >= 15) return { label: "High", className: "bg-red-500/15 text-red-600 dark:text-red-400" };
  if (v >= 8) return { label: "Medium", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };
  return { label: "Low", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" };
}

export const SELECTION_STAGES = [
  { value: "need", label: "1. Need & specification" },
  { value: "market", label: "2. Market scan" },
  { value: "rfi", label: "3. RFI / RFQ" },
  { value: "assessment", label: "4. Capability & risk assessment" },
  { value: "audit", label: "5. Audit / site visit" },
  { value: "award", label: "6. Award & contract" },
  { value: "onboard", label: "7. Onboarding" },
];

export const money = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? "—"
    : `$${Math.round(Number(n)).toLocaleString()}`;

export const monthLabel = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};
