// Pure, client-side shop-floor calculators. No persistence, no company scope —
// safe to use inside the read-only demo workspace and the free sandbox.

export type CalculatorKey =
  | "oee"
  | "takt"
  | "copq"
  | "downtime"
  | "changeover";

export const CALCULATORS: {
  key: CalculatorKey;
  navKey: string;
  title: string;
  blurb: string;
  to: string;
}[] = [
  {
    key: "oee",
    navKey: "nav.actions.calc.oee",
    title: "OEE calculator",
    blurb: "Availability x performance x quality, with the losses broken out so you can see where the time actually goes.",
    to: "/actions/calculators/oee",
  },
  {
    key: "takt",
    navKey: "nav.actions.calc.takt",
    title: "Takt time & cycle time",
    blurb: "Customer demand against available time, plus the number of operators the line needs to hold it.",
    to: "/actions/calculators/takt",
  },
  {
    key: "copq",
    navKey: "nav.actions.calc.copq",
    title: "Cost of poor quality",
    blurb: "Scrap, rework, warranty, sorting and expedite rolled into one annual number and a share of revenue.",
    to: "/actions/calculators/copq",
  },
  {
    key: "downtime",
    navKey: "nav.actions.calc.downtime",
    title: "Downtime cost",
    blurb: "What one minute of an unplanned stop really costs, based on throughput and contribution margin.",
    to: "/actions/calculators/downtime",
  },
  {
    key: "changeover",
    navKey: "nav.actions.calc.changeover",
    title: "Changeover / SMED savings",
    blurb: "Current versus target changeover time, translated into recovered hours and extra units per year.",
    to: "/actions/calculators/changeover",
  },
];

const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

/* ------------------------------- OEE ---------------------------------- */

export type OeeInput = {
  plannedMinutes: number;
  downtimeMinutes: number;
  idealCycleSeconds: number;
  totalUnits: number;
  rejectUnits: number;
};

export type OeeResult = {
  runMinutes: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  goodUnits: number;
  lostMinutesAvailability: number;
  lostMinutesPerformance: number;
  lostMinutesQuality: number;
  worstLoss: "availability" | "performance" | "quality" | null;
};

export function computeOee(i: OeeInput): OeeResult {
  const runMinutes = Math.max(0, i.plannedMinutes - i.downtimeMinutes);
  const availability = clamp01(safeDiv(runMinutes, i.plannedMinutes));
  const idealMinutes = (i.idealCycleSeconds * i.totalUnits) / 60;
  const performance = clamp01(safeDiv(idealMinutes, runMinutes));
  const goodUnits = Math.max(0, i.totalUnits - i.rejectUnits);
  const quality = clamp01(safeDiv(goodUnits, i.totalUnits));
  const oee = availability * performance * quality;

  const lostMinutesAvailability = Math.max(0, i.plannedMinutes - runMinutes);
  const lostMinutesPerformance = Math.max(0, runMinutes - runMinutes * performance);
  const lostMinutesQuality = Math.max(0, runMinutes * performance * (1 - quality));

  const losses: [OeeResult["worstLoss"], number][] = [
    ["availability", lostMinutesAvailability],
    ["performance", lostMinutesPerformance],
    ["quality", lostMinutesQuality],
  ];
  losses.sort((a, b) => b[1] - a[1]);
  const worstLoss = losses[0][1] > 0 ? losses[0][0] : null;

  return {
    runMinutes,
    availability,
    performance,
    quality,
    oee,
    goodUnits,
    lostMinutesAvailability,
    lostMinutesPerformance,
    lostMinutesQuality,
    worstLoss,
  };
}

/* ------------------------------- Takt --------------------------------- */

export type TaktInput = {
  shiftMinutes: number;
  breakMinutes: number;
  shiftsPerDay: number;
  demandPerDay: number;
  totalWorkContentSeconds: number;
  actualCycleSeconds: number;
};

export type TaktResult = {
  availableMinutes: number;
  taktSeconds: number;
  operatorsRequired: number;
  capacityPerDay: number;
  meetsDemand: boolean;
  utilisation: number;
};

export function computeTakt(i: TaktInput): TaktResult {
  const availableMinutes = Math.max(0, (i.shiftMinutes - i.breakMinutes) * Math.max(0, i.shiftsPerDay));
  const availableSeconds = availableMinutes * 60;
  const taktSeconds = safeDiv(availableSeconds, i.demandPerDay);
  const operatorsRequired = taktSeconds > 0 ? safeDiv(i.totalWorkContentSeconds, taktSeconds) : 0;
  const capacityPerDay = i.actualCycleSeconds > 0 ? Math.floor(safeDiv(availableSeconds, i.actualCycleSeconds)) : 0;
  return {
    availableMinutes,
    taktSeconds,
    operatorsRequired,
    capacityPerDay,
    meetsDemand: capacityPerDay >= i.demandPerDay,
    utilisation: clamp01(safeDiv(i.actualCycleSeconds, taktSeconds)),
  };
}

/* ------------------------------- COPQ --------------------------------- */

export type CopqInput = {
  annualRevenue: number;
  scrap: number;
  rework: number;
  warranty: number;
  sortingInspection: number;
  expediteFreight: number;
  concessionsCredits: number;
};

export type CopqResult = {
  total: number;
  pctOfRevenue: number;
  perMonth: number;
  lines: { label: string; value: number; share: number }[];
};

export function computeCopq(i: CopqInput): CopqResult {
  const raw: [string, number][] = [
    ["Scrap", i.scrap],
    ["Rework", i.rework],
    ["Warranty & returns", i.warranty],
    ["Sorting & extra inspection", i.sortingInspection],
    ["Expedite & premium freight", i.expediteFreight],
    ["Concessions & credits", i.concessionsCredits],
  ];
  const total = raw.reduce((s, [, v]) => s + (Number.isFinite(v) ? Math.max(0, v) : 0), 0);
  const lines = raw
    .map(([label, value]) => ({
      label,
      value: Math.max(0, value || 0),
      share: safeDiv(Math.max(0, value || 0), total),
    }))
    .sort((a, b) => b.value - a.value);
  return {
    total,
    pctOfRevenue: safeDiv(total, i.annualRevenue),
    perMonth: total / 12,
    lines,
  };
}

/* --------------------------- Value basis -------------------------------- */

/**
 * How recovered (or lost) time converts into money.
 * - "constrained": the line is sold out, so an hour is worth the contribution
 *   margin of the units it would have produced.
 * - "unconstrained": you cannot sell more, so an hour is only worth the cost
 *   you avoid (labour / overtime).
 */
export type ValueBasis = "constrained" | "unconstrained";

/* ----------------------------- Downtime -------------------------------- */

export type DowntimeInput = {
  unitsPerHour: number;
  contributionPerUnit: number;
  labourCostPerHour: number;
  fixedCostPerHour: number;
  downtimeMinutesPerWeek: number;
  weeksPerYear: number;
  valueBasis?: ValueBasis;
};

export type DowntimeResult = {
  costPerMinute: number;
  costPerHour: number;
  weeklyCost: number;
  annualCost: number;
  annualHoursLost: number;
  unitsLostPerYear: number;
  valueBasis: ValueBasis;
  lostMarginPerHour: number;
};

export function computeDowntime(i: DowntimeInput): DowntimeResult {
  const valueBasis: ValueBasis = i.valueBasis ?? "constrained";
  const lostMargin = Math.max(0, i.unitsPerHour) * Math.max(0, i.contributionPerUnit);
  const marginComponent = valueBasis === "constrained" ? lostMargin : 0;
  const costPerHour = marginComponent + Math.max(0, i.labourCostPerHour) + Math.max(0, i.fixedCostPerHour);
  const costPerMinute = costPerHour / 60;
  const weeklyCost = costPerMinute * Math.max(0, i.downtimeMinutesPerWeek);
  const annualHoursLost = (Math.max(0, i.downtimeMinutesPerWeek) * Math.max(0, i.weeksPerYear)) / 60;
  return {
    costPerMinute,
    costPerHour,
    weeklyCost,
    annualCost: weeklyCost * Math.max(0, i.weeksPerYear),
    annualHoursLost,
    unitsLostPerYear: annualHoursLost * Math.max(0, i.unitsPerHour),
    valueBasis,
    lostMarginPerHour: marginComponent,
  };
}

/* ---------------------------- Changeover ------------------------------- */

export type ChangeoverInput = {
  currentMinutes: number;
  targetMinutes: number;
  changeoversPerWeek: number;
  weeksPerYear: number;
  unitsPerHour: number;
  contributionPerUnit: number;
  valueBasis?: ValueBasis;
  avoidedCostPerHour?: number;
};

export type ChangeoverResult = {
  minutesSavedEach: number;
  hoursRecoveredPerYear: number;
  extraUnitsPerYear: number;
  annualValue: number;
  reductionPct: number;
  valueBasis: ValueBasis;
};

export function computeChangeover(i: ChangeoverInput): ChangeoverResult {
  const valueBasis: ValueBasis = i.valueBasis ?? "constrained";
  const minutesSavedEach = Math.max(0, i.currentMinutes - i.targetMinutes);
  const hoursRecoveredPerYear =
    (minutesSavedEach * Math.max(0, i.changeoversPerWeek) * Math.max(0, i.weeksPerYear)) / 60;
  const extraUnitsPerYear = hoursRecoveredPerYear * Math.max(0, i.unitsPerHour);
  const annualValue =
    valueBasis === "constrained"
      ? extraUnitsPerYear * Math.max(0, i.contributionPerUnit)
      : hoursRecoveredPerYear * Math.max(0, i.avoidedCostPerHour ?? 0);
  return {
    minutesSavedEach,
    hoursRecoveredPerYear,
    extraUnitsPerYear,
    annualValue,
    reductionPct: clamp01(safeDiv(minutesSavedEach, i.currentMinutes)),
    valueBasis,
  };
}

/* ------------------------------ helpers -------------------------------- */

export function pct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function num(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
