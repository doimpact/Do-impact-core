// Shared user preferences for the Strategy → Waterfall view. Persisted in
// localStorage so the Board Report can mirror what's currently visible/active.
export type WfViewPrefs = {
  rollupMode: "sum" | "delta";
  riskAdjusted: boolean;
  showArchived: boolean;
  compareAll: boolean;
  /** Hide items that have not started yet (objectives, levers, workstreams, tasks). */
  hideNotStarted: boolean;
};

export const WF_VIEW_PREFS_KEY = "wf-view-prefs";

export const DEFAULT_WF_VIEW_PREFS: WfViewPrefs = {
  rollupMode: "delta",
  riskAdjusted: false,
  showArchived: false,
  compareAll: true,
  hideNotStarted: false,
};

export function loadWfViewPrefs(): WfViewPrefs {
  if (typeof window === "undefined") return DEFAULT_WF_VIEW_PREFS;
  try {
    const raw = window.localStorage.getItem(WF_VIEW_PREFS_KEY);
    if (!raw) return DEFAULT_WF_VIEW_PREFS;
    const parsed = JSON.parse(raw);
    return {
      rollupMode: parsed.rollupMode === "sum" ? "sum" : "delta",
      riskAdjusted: !!parsed.riskAdjusted,
      showArchived: !!parsed.showArchived,
      compareAll: parsed.compareAll !== false,
      hideNotStarted: !!parsed.hideNotStarted,
    };
  } catch {
    return DEFAULT_WF_VIEW_PREFS;
  }
}


export function saveWfViewPrefs(prefs: WfViewPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WF_VIEW_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
