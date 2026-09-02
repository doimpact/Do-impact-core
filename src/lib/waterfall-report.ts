// Convert stored waterfall bridges + items into the CustomBridge shape used by
// the board report renderer (PDF, preview and PPTX). This lets the "Waterfall"
// section render the same "Compare all" visuals (consolidated rollup + per
// sub-bridge charts) that the Strategy → Waterfall page shows.
import type { CustomBridge, CustomLever } from "@/lib/custom-waterfall";

type Category = "headwind" | "organic_growth" | "new_strategy" | "efficiency" | "investment" | "other";

const CATEGORY_SIGN: Record<Category, 1 | -1> = {
  headwind: -1,
  organic_growth: 1,
  new_strategy: 1,
  efficiency: 1,
  investment: -1,
  other: 1,
};

const CATEGORY_LABEL: Record<Category, string> = {
  headwind: "Headwind",
  organic_growth: "Organic Growth",
  new_strategy: "New Strategy",
  efficiency: "Operational Efficiency",
  investment: "Strategic Investment",
  other: "Other",
};

function effectiveDelta(it: any, riskAdjusted: boolean): number {
  const raw = Number(it.gross_impact) || 0;
  const cat = (it.category ?? "other") as Category;
  const signed = raw !== 0 ? raw : CATEGORY_SIGN[cat] * Math.abs(raw);
  if (!riskAdjusted) return signed;
  const real = Number(it.realization_pct);
  const pct = Number.isFinite(real) ? real : 100;
  return signed * pct / 100;
}


export type RollupMode = "sum" | "delta";

export function bridgesToCustomWaterfalls(
  bridges: any[],
  items: any[],
  opts: { includeRollup?: boolean; rollupMode?: RollupMode; riskAdjusted?: boolean; includeArchived?: boolean } = {},
): CustomBridge[] {
  const { includeRollup = true, rollupMode = "sum", riskAdjusted = true, includeArchived = false } = opts;
  const active = includeArchived ? bridges.slice() : bridges.filter((b) => !b.archived_at);

  const itemsByBridge = new Map<string, any[]>();
  for (const it of items) {
    const arr = itemsByBridge.get(it.bridge_id) ?? [];
    arr.push(it);
    itemsByBridge.set(it.bridge_id, arr);
  }

  const out: CustomBridge[] = [];

  if (includeRollup && active.length) {
    let baseline = 0, headwinds = 0, gains = 0;
    let statedTarget = 0; let hasStated = false;
    const perBridge: { title: string; net: number }[] = [];
    for (const b of active) {
      const its = itemsByBridge.get(b.id) ?? [];
      const bl = Number(b.baseline_value ?? 0);
      let hw = 0, gn = 0;
      for (const it of its) {
        const d = effectiveDelta(it, riskAdjusted);
        if (d < 0) hw += d; else gn += d;
      }
      baseline += bl;
      headwinds += hw;
      gains += gn;
      if (b.target_value != null) { statedTarget += Number(b.target_value); hasStated = true; }
      perBridge.push({ title: b.title, net: hw + gn });
    }
    const computedTarget = baseline + headwinds + gains;
    const endValue = hasStated ? statedTarget : computedTarget;

    if (rollupMode === "delta") {
      out.push({
        id: "rollup-delta",
        title: "Portfolio rollup — Δ by bridge",
        comment: `Consolidated across ${active.length} bridge(s). Each step is a bridge's net Δ.`,
        startLabel: "Start",
        startValue: 0,
        endLabel: "Total Δ",
        endValue: null,
        levers: perBridge.map<CustomLever>((p) => ({
          id: `roll-${p.title}`,
          label: p.title,
          delta: p.net,
          comment: "",
        })),
      });
    } else {
      const levers: CustomLever[] = [];
      if (headwinds !== 0) levers.push({ id: "roll-hw", label: "Headwinds", delta: headwinds, comment: "Aggregate negative levers across bridges" });
      if (gains !== 0) levers.push({ id: "roll-gn", label: "Gains", delta: gains, comment: "Aggregate positive levers across bridges" });
      out.push({
        id: "rollup-sum",
        title: `Portfolio rollup — sum of components (${active.length} bridge${active.length === 1 ? "" : "s"})`,
        comment: hasStated
          ? `Baseline ${baseline.toLocaleString()} → Target ${endValue.toLocaleString()} (computed ${computedTarget.toLocaleString()}).`
          : `Baseline ${baseline.toLocaleString()} → Computed target ${computedTarget.toLocaleString()}.`,
        startLabel: "Total Baseline",
        startValue: baseline,
        endLabel: hasStated ? "Total Target" : "Computed Target",
        endValue: endValue,
        levers,
      });
    }
  }

  for (const b of active) {
    const its = itemsByBridge.get(b.id) ?? [];
    const target = b.target_value != null ? Number(b.target_value) : null;
    out.push({
      id: `bridge-${b.id}`,
      title: b.title,
      comment: b.description ?? (b.metric ? `Metric: ${b.metric}` : ""),
      startLabel: b.baseline_label || "Baseline",
      startValue: Number(b.baseline_value ?? 0),
      endLabel: b.target_label || "Target",
      endValue: target,
      levers: its.map<CustomLever>((it) => {
        const cat = (it.category ?? "other") as Category;
        const real = Number(it.realization_pct);
        const pct = Number.isFinite(real) ? real : 100;
        const comment = [CATEGORY_LABEL[cat], pct !== 100 ? `${pct}% realized` : null]
          .filter(Boolean)
          .join(" · ");
        return {
          id: it.id ?? `${b.id}-${it.label}`,
          label: it.label,
          delta: effectiveDelta(it, riskAdjusted),
          owner: it.owner_id ?? "",
          comment,
        };
      }),
    });
  }

  return out;
}
