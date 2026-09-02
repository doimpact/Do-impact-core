// Shared "not started" predicates so Strategy screens and the Board Report
// hide exactly the same items when the "Hide not started" option is on.

export function isObjectiveNotStarted(o: { status?: string | null }): boolean {
  return (o.status ?? "not_started") === "not_started";
}

export function isWorkstreamNotStarted(i: { current_stage?: string | null; progress?: number | null }): boolean {
  return (i.current_stage ?? "L1") === "L1" && (Number(i.progress) || 0) === 0;
}

export function isTaskNotStarted(t: { status?: string | null }): boolean {
  const s = t.status ?? "";
  return s === "backlog" || s === "todo";
}

export function isLeverActionNotStarted(a: { status?: string | null }): boolean {
  return (a.status ?? "open") === "open";
}

export type LeverEvidence = {
  /** waterfall_items — any positive realization percentage means work has started */
  items?: { id?: string | null; realization_pct?: number | string | null }[];
  /** strategic objectives promoted from a lever */
  objectives?: { id?: string | null; status?: string | null; source_waterfall_item_id?: string | null }[];
  /** objective_actions — actions live on the objective, and may also carry the lever id */
  actions?: { objective_id?: string | null; waterfall_item_id?: string | null; status?: string | null; archived_at?: string | null }[];
  /** objective_monthly_benefits rows */
  objectiveBenefits?: { objective_id?: string | null; actual?: number | string | null }[];
  /** waterfall_item_monthly_benefits rows */
  leverBenefits?: { item_id?: string | null; actual?: number | string | null }[];
};

const nonZero = (v: unknown) => Math.abs(Number(v) || 0) > 0;

/**
 * A value lever counts as NOT started only when there is no evidence of work:
 * no objective status beyond "not started", no action past "open", and no
 * actual value recorded (on the objective or on the lever itself).
 *
 * Levers with no linked objective are assumed started unless they themselves
 * show no evidence — the absence of a promotion is not proof of inactivity,
 * so we only hide them when they also have no actions and no actuals.
 */
export function notStartedLeverIds(itemIds: string[], evidence: LeverEvidence): Set<string> {
  const { items = [], objectives = [], actions = [], objectiveBenefits = [], leverBenefits = [] } = evidence;

  const objIdByItem = new Map<string, string>();
  const startedByStatus = new Set<string>();
  const itemByObjId = new Map<string, string>();
  for (const o of objectives) {
    const item = o.source_waterfall_item_id;
    if (!item) continue;
    if (o.id) {
      objIdByItem.set(item, o.id);
      itemByObjId.set(o.id, item);
    }
    if (!isObjectiveNotStarted(o)) startedByStatus.add(item);
  }

  const started = new Set<string>(startedByStatus);

  for (const item of items) {
    if (item.id && Number(item.realization_pct) > 0) started.add(item.id);
  }

  for (const a of actions) {
    if (a.archived_at) continue;
    if (isLeverActionNotStarted(a)) continue;
    const item = a.waterfall_item_id ?? (a.objective_id ? itemByObjId.get(a.objective_id) : undefined);
    if (item) started.add(item);
  }

  for (const b of objectiveBenefits) {
    if (!nonZero(b.actual)) continue;
    const item = b.objective_id ? itemByObjId.get(b.objective_id) : undefined;
    if (item) started.add(item);
  }

  for (const b of leverBenefits) {
    if (!nonZero(b.actual)) continue;
    if (b.item_id) started.add(b.item_id);
  }

  const out = new Set<string>();
  for (const id of itemIds) if (!started.has(id)) out.add(id);
  return out;
}
