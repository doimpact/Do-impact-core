// Framework reference structures for the KPI module: causal tree, OEE loss tree,
// role scorecards and pillar mapping.

import {
  KPI_LIBRARY,
  type KpiCategoryKey,
  type KpiLibraryEntry,
  type KpiRole,
} from "./kpi-library";

export type TreeNode = { label: string; children?: TreeNode[] };

export const CAUSAL_TREE: TreeNode[] = [
  {
    label: "Business Results",
    children: [
      { label: "Profit" },
      { label: "Revenue", children: [{ label: "Price" }, { label: "Volume" }, { label: "Delivery" }] },
      { label: "Cost", children: [{ label: "Labour" }, { label: "Materials" }, { label: "Manufacturing overhead" }, { label: "Energy" }, { label: "Maintenance" }, { label: "Scrap" }, { label: "Rework" }] },
      { label: "Cash" },
    ],
  },
  {
    label: "Operational Results",
    children: [
      { label: "Delivery", children: [{ label: "OTIF" }, { label: "Schedule adherence" }, { label: "Production capacity" }, { label: "Inventory availability" }] },
      { label: "OEE", children: [{ label: "Availability" }, { label: "Performance" }, { label: "Quality" }] },
      { label: "Quality", children: [{ label: "FPY" }, { label: "RTY" }, { label: "Scrap" }, { label: "Rework" }, { label: "Process capability" }, { label: "Customer PPM" }, { label: "COPQ" }] },
      { label: "Inventory", children: [{ label: "Raw material" }, { label: "WIP" }, { label: "Finished goods" }, { label: "Inventory turns" }, { label: "Inventory accuracy" }, { label: "Obsolescence" }] },
    ],
  },
  {
    label: "Performance Drivers",
    children: [
      { label: "Downtime" },
      { label: "Yield" },
      { label: "Speed" },
      { label: "Labour productivity" },
      { label: "Changeover" },
      { label: "WIP" },
    ],
  },
  {
    label: "Root Causes",
    children: [
      { label: "Equipment failure" },
      { label: "Minor stops" },
      { label: "Process deviations" },
      { label: "Training gaps" },
      { label: "Material shortages" },
      { label: "Supplier defects" },
      { label: "Maintenance backlog" },
    ],
  },
  {
    label: "Leading Indicators",
    children: [
      { label: "PM compliance" },
      { label: "Predictive maintenance alerts" },
      { label: "Training completion" },
      { label: "Process capability" },
      { label: "Audit compliance" },
      { label: "CAPA closure" },
      { label: "Supplier risk" },
      { label: "Standard work compliance" },
    ],
  },
];

export const OEE_LOSS_TREE: { label: string; formula: string; losses: string[] }[] = [
  {
    label: "Availability",
    formula: "Operating time / Planned production time",
    losses: ["Equipment breakdown", "Setup", "Changeover", "Tool changes", "Material shortages", "Waiting for operator", "Waiting for maintenance", "Waiting for quality approval"],
  },
  {
    label: "Performance",
    formula: "Actual output / Theoretical output at ideal cycle time",
    losses: ["Reduced speed", "Minor stops", "Micro-stoppages", "Idling", "Operator inefficiency"],
  },
  {
    label: "Quality",
    formula: "Good units / Total units",
    losses: ["Scrap", "Rework", "Startup rejects", "Process defects", "Inspection failures"],
  },
];

export const OEE_NOTE =
  "OEE should not automatically be read as plant utilisation. A machine can show high OEE while producing excess inventory or the wrong product — always connect OEE to demand, schedule, output and inventory.";

export const SQDCPME_LETTERS: KpiCategoryKey[] = [
  "safety",
  "quality",
  "delivery",
  "cost",
  "productivity",
  "maintenance",
  "environment",
];

export function coreScorecard(): KpiLibraryEntry[] {
  return KPI_LIBRARY.filter((e) => e.core);
}

export function scorecardForRole(role: KpiRole): KpiLibraryEntry[] {
  return KPI_LIBRARY.filter((e) => e.roles.includes(role));
}

// Pillar key prefixes are company-suffixed (e.g. "safety-titan"), so match on prefix.
const CATEGORY_TO_PILLAR_PREFIX: Record<KpiCategoryKey, string[]> = {
  safety: ["safety"],
  quality: ["quality"],
  delivery: ["delivery"],
  cost: ["finance"],
  productivity: ["delivery", "daily"],
  maintenance: ["daily", "delivery"],
  environment: ["safety"],
  people: ["people"],
  inventory: ["delivery", "finance"],
  "supply-chain": ["delivery"],
  planning: ["delivery"],
  engineering: ["quality", "delivery"],
  digital: ["daily", "quality"],
  lean: ["delivery", "quality"],
  financial: ["finance"],
};

export function suggestPillarId(
  category: KpiCategoryKey,
  pillars: { id: string; key: string }[],
): string | null {
  for (const prefix of CATEGORY_TO_PILLAR_PREFIX[category] ?? []) {
    const hit = pillars.find((p) => p.key === prefix || p.key.startsWith(`${prefix}-`));
    if (hit) return hit.id;
  }
  return pillars[0]?.id ?? null;
}
