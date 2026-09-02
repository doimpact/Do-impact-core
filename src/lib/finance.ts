import { formatMoney } from "@/lib/number-format";

export const STAGE_WEIGHTS: Record<string, number> = {
  L0: 0,
  L1: 0.15,
  L2: 0.4,
  L3: 0.7,
  L4: 0.9,
  L5: 1.0,
};

export type Stage = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export const STAGES: { key: Stage; label: string; sub: string }[] = [
  { key: "L0", label: "L0", sub: "Idea" },
  { key: "L1", label: "L1", sub: "Identified" },
  { key: "L2", label: "L2", sub: "Validated" },
  { key: "L3", label: "L3", sub: "Planned" },
  { key: "L4", label: "L4", sub: "Executed" },
  { key: "L5", label: "L5", sub: "Realized" },
];

export interface InitiativeLike {
  current_stage: Stage;
  gross_value_l1: number | string;
  validated_value_l2: number | string;
}

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export function baselineValue(i: InitiativeLike): number {
  return i.current_stage === "L0" || i.current_stage === "L1"
    ? num(i.gross_value_l1)
    : num(i.validated_value_l2);
}

export function discountedValue(i: InitiativeLike): number {
  return baselineValue(i) * (STAGE_WEIGHTS[i.current_stage] ?? 0);
}

export function formatUSD(n: number): string {
  return formatMoney(n);
}


// ─────────────────────────────────────────────────────────────────────
// Discounted-cashflow helpers. Cashflows are indexed by month (t=0 first).

export function monthlyRateFromAnnualPct(annualPct: number): number {
  const p = Number.isFinite(annualPct) ? annualPct : 0;
  return Math.pow(1 + p / 100, 1 / 12) - 1;
}

/** NPV where cashflows[0] is at t=0 (undiscounted) and each subsequent flow is one month later. */
export function npv(cashflows: number[], annualPct: number): number {
  const r = monthlyRateFromAnnualPct(annualPct);
  let acc = 0;
  for (let i = 0; i < cashflows.length; i++) {
    acc += (cashflows[i] || 0) / Math.pow(1 + r, i);
  }
  return acc;
}

function npvAtMonthly(cashflows: number[], rMonthly: number): number {
  let acc = 0;
  for (let i = 0; i < cashflows.length; i++) {
    acc += (cashflows[i] || 0) / Math.pow(1 + rMonthly, i);
  }
  return acc;
}

/** IRR by bisection. Returns annual % (e.g. 12.4 for 12.4%) or null when no sign change. */
export function irr(cashflows: number[]): number | null {
  if (!cashflows.length) return null;
  const hasPos = cashflows.some((v) => v > 0);
  const hasNeg = cashflows.some((v) => v < 0);
  if (!hasPos || !hasNeg) return null;

  let lo = -0.9999 / 12;
  let hi = 10;
  let fLo = npvAtMonthly(cashflows, lo);
  const fHi = npvAtMonthly(cashflows, hi);
  if (fLo * fHi > 0) return null;

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvAtMonthly(cashflows, mid);
    if (Math.abs(fMid) < 1e-6) {
      return (Math.pow(1 + mid, 12) - 1) * 100;
    }
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
}

/** First month index where cumulative cashflow >= 0. Returns null if never. */
export function paybackMonth(cashflows: number[]): number | null {
  let cum = 0;
  for (let i = 0; i < cashflows.length; i++) {
    cum += cashflows[i] || 0;
    if (cum >= 0) return i;
  }
  return null;
}

export function formatPct(x: number | null | undefined, digits = 1): string {
  if (x == null || !Number.isFinite(x)) return "—";
  return `${x.toFixed(digits)}%`;
}
