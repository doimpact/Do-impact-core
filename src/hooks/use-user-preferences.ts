import { getCurrentUser } from "@/lib/auth-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import { type TourState, DEFAULT_TOUR_STATE } from "@/components/help/tour-context";

export type SavedPreset = { id: string; name: string; hidden_keys: string[] };
export type MeetingPreset = { id: string; name: string; steps: string[] };
export type DemoPreset = {
  id: string;
  name: string;
  problemId: string | null;
  problemTitle: string;
  problemStatement: string;
  moduleIds: string[];
};

export type UserPreferences = {
  hidden_keys: string[];
  overview_show_all_chips: boolean;
  overview_how_it_works_collapsed: boolean;
  actions_default_view: string | null;
  actions_default_zoom: string | null;
  actions_default_group: string | null;
  saved_presets: SavedPreset[];
  meeting_steps: string[] | null;
  meeting_presets: MeetingPreset[];
  demo_presets: DemoPreset[];
  tour_state: TourState;
};

const DEFAULTS: UserPreferences = {
  hidden_keys: [],
  overview_show_all_chips: false,
  overview_how_it_works_collapsed: false,
  actions_default_view: null,
  actions_default_zoom: null,
  actions_default_group: null,
  saved_presets: [],
  meeting_steps: null,
  meeting_presets: [],
  demo_presets: [],
  tour_state: DEFAULT_TOUR_STATE,
};

function normalizePresets(raw: unknown): SavedPreset[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? "Untitled"),
      hidden_keys: Array.isArray(p.hidden_keys) ? p.hidden_keys.map(String) : [],
    }))
    .filter((p) => p.id);
}

function normalizeMeetingPresets(raw: unknown): MeetingPreset[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? "Untitled"),
      steps: Array.isArray(p.steps) ? p.steps.map(String) : [],
    }))
    .filter((p) => p.id);
}

function normalizeDemoPresets(raw: unknown): DemoPreset[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      id: String(p.id ?? ""),
      name: String(p.name ?? "Untitled demo"),
      problemId: p.problemId == null ? null : String(p.problemId),
      problemTitle: String(p.problemTitle ?? "Your problem"),
      problemStatement: String(p.problemStatement ?? ""),
      moduleIds: Array.isArray(p.moduleIds) ? p.moduleIds.map(String) : [],
    }))
    .filter((p) => p.id && p.moduleIds.length);
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `p_${Date.now()}`;
}

function normalizeTourState(raw: unknown): TourState {
  if (!raw || typeof raw !== "object") return DEFAULTS.tour_state;
  const r = raw as Record<string, unknown>;
  return {
    completed: Array.isArray(r.completed) ? r.completed.map(String) : [],
    dismissed: Array.isArray(r.dismissed) ? r.dismissed.map(String) : [],
    lastSeenAt: r.lastSeenAt && typeof r.lastSeenAt === "object" ? Object.fromEntries(
      Object.entries(r.lastSeenAt as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
    ) : {},
  };
}

export function useUserPreferences() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async (): Promise<UserPreferences> => {
      const { data: userRes } = await getCurrentUser();
      const uid = userRes.user?.id;
      if (!uid) return DEFAULTS;
      const { data, error } = await supabase
        .from("user_preferences")
        .select("hidden_keys, overview_show_all_chips, overview_how_it_works_collapsed, actions_default_view, actions_default_zoom, actions_default_group, saved_presets, meeting_steps, meeting_presets, demo_presets, tour_state")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) return DEFAULTS;
      if (!data) return DEFAULTS;
      return {
        hidden_keys: data.hidden_keys ?? [],
        overview_show_all_chips: data.overview_show_all_chips ?? false,
        overview_how_it_works_collapsed: data.overview_how_it_works_collapsed ?? false,
        actions_default_view: data.actions_default_view,
        actions_default_zoom: data.actions_default_zoom,
        actions_default_group: data.actions_default_group,
        saved_presets: normalizePresets(data.saved_presets),
        meeting_steps: data.meeting_steps ?? null,
        meeting_presets: normalizeMeetingPresets(data.meeting_presets),
        demo_presets: normalizeDemoPresets((data as { demo_presets?: unknown }).demo_presets),
        tour_state: normalizeTourState((data as { tour_state?: unknown }).tour_state),
      };
    },
    staleTime: 60_000,
  });

  const prefs = q.data ?? DEFAULTS;

  const save = useMutation({
    mutationFn: async (patch: Partial<UserPreferences>) => {
      const { data: userRes } = await getCurrentUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not signed in");
      const next = { ...prefs, ...patch };
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: uid, ...next }, { onConflict: "user_id" });
      if (error) throw error;
      return next;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["user-preferences"] });
      const prev = qc.getQueryData<UserPreferences>(["user-preferences"]);
      qc.setQueryData<UserPreferences>(["user-preferences"], { ...prefs, ...patch });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["user-preferences"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["user-preferences"] }),
  });

  const isEnabled = useCallback(
    (key: string) => !prefs.hidden_keys.includes(key),
    [prefs.hidden_keys],
  );

  const setEnabled = useCallback(
    (key: string, enabled: boolean) => {
      const set = new Set(prefs.hidden_keys);
      if (enabled) set.delete(key);
      else set.add(key);
      save.mutate({ hidden_keys: Array.from(set) });
    },
    [prefs.hidden_keys, save],
  );

  const setHiddenKeys = useCallback(
    (keys: string[]) => save.mutate({ hidden_keys: keys }),
    [save],
  );

  const setField = useCallback(
    (patch: Partial<UserPreferences>) => save.mutate(patch),
    [save],
  );

  const savePreset = useCallback(
    (name: string) =>
      save.mutate({
        saved_presets: [
          ...prefs.saved_presets,
          {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `p_${Date.now()}`,
            name: name.trim() || "Untitled preset",
            hidden_keys: [...prefs.hidden_keys],
          },
        ],
      }),
    [prefs.saved_presets, prefs.hidden_keys, save],
  );

  const updatePreset = useCallback(
    (id: string) =>
      save.mutate({
        saved_presets: prefs.saved_presets.map((p) =>
          p.id === id ? { ...p, hidden_keys: [...prefs.hidden_keys] } : p,
        ),
      }),
    [prefs.saved_presets, prefs.hidden_keys, save],
  );

  const renamePreset = useCallback(
    (id: string, name: string) =>
      save.mutate({
        saved_presets: prefs.saved_presets.map((p) =>
          p.id === id ? { ...p, name: name.trim() || p.name } : p,
        ),
      }),
    [prefs.saved_presets, save],
  );

  const deletePreset = useCallback(
    (id: string) => save.mutate({ saved_presets: prefs.saved_presets.filter((p) => p.id !== id) }),
    [prefs.saved_presets, save],
  );

  /* ---- Saved product tours ---- */

  const saveDemoPreset = useCallback(
    (
      name: string,
      def: { problemId: string | null; problemTitle: string; problemStatement: string; moduleIds: string[] },
    ) =>
      save.mutate({
        demo_presets: [
          ...prefs.demo_presets,
          { id: newId(), name: name.trim() || "Untitled demo", ...def, moduleIds: [...def.moduleIds] },
        ],
      }),
    [prefs.demo_presets, save],
  );

  const deleteDemoPreset = useCallback(
    (id: string) => save.mutate({ demo_presets: prefs.demo_presets.filter((p) => p.id !== id) }),
    [prefs.demo_presets, save],
  );

  /* ---- Weekly SLT meeting agenda ---- */

  const setMeetingSteps = useCallback(
    (steps: string[]) => save.mutate({ meeting_steps: steps }),
    [save],
  );

  const saveMeetingPreset = useCallback(
    (name: string, steps: string[]) =>
      save.mutate({
        meeting_presets: [
          ...prefs.meeting_presets,
          { id: newId(), name: name.trim() || "Untitled agenda", steps: [...steps] },
        ],
      }),
    [prefs.meeting_presets, save],
  );

  const updateMeetingPreset = useCallback(
    (id: string, steps: string[]) =>
      save.mutate({
        meeting_presets: prefs.meeting_presets.map((p) => (p.id === id ? { ...p, steps: [...steps] } : p)),
      }),
    [prefs.meeting_presets, save],
  );

  const renameMeetingPreset = useCallback(
    (id: string, name: string) =>
      save.mutate({
        meeting_presets: prefs.meeting_presets.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
      }),
    [prefs.meeting_presets, save],
  );

  const deleteMeetingPreset = useCallback(
    (id: string) => save.mutate({ meeting_presets: prefs.meeting_presets.filter((p) => p.id !== id) }),
    [prefs.meeting_presets, save],
  );

  return {
    prefs,
    isEnabled,
    setEnabled,
    setHiddenKeys,
    setField,
    savePreset,
    updatePreset,
    renamePreset,
    deletePreset,
    saveDemoPreset,
    deleteDemoPreset,
    setMeetingSteps,
    saveMeetingPreset,
    updateMeetingPreset,
    renameMeetingPreset,
    deleteMeetingPreset,
    isLoading: q.isLoading,
  };
}
