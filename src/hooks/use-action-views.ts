import { getCurrentUser } from "@/lib/auth-session";
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ActionFilters, DEFAULT_FILTERS } from "@/lib/execution-actions";

export type ActionView = {
  id: string;
  name: string;
  tab: string;
  filters: ActionFilters;
};

function normalize(raw: unknown): ActionView[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      id: String(v.id ?? crypto.randomUUID()),
      name: String(v.name ?? "View"),
      tab: String(v.tab ?? "overview"),
      filters: { ...DEFAULT_FILTERS, ...((v.filters as Partial<ActionFilters>) ?? {}) },
    }));
}

export function useActionViews() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["action-views"],
    queryFn: async (): Promise<ActionView[]> => {
      const { data: userRes } = await getCurrentUser();
      const uid = userRes.user?.id;
      if (!uid) return [];
      const { data, error } = await supabase
        .from("user_preferences")
        .select("action_views")
        .eq("user_id", uid)
        .maybeSingle();
      if (error || !data) return [];
      return normalize((data as { action_views?: unknown }).action_views);
    },
    staleTime: 60_000,
  });

  const views = q.data ?? [];

  const save = useMutation({
    mutationFn: async (next: ActionView[]) => {
      const { data: userRes } = await getCurrentUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: uid, action_views: next }, { onConflict: "user_id" });
      if (error) throw error;
      return next;
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ["action-views"] });
      const prev = qc.getQueryData<ActionView[]>(["action-views"]);
      qc.setQueryData(["action-views"], next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["action-views"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["action-views"] }),
  });

  const addView = useCallback(
    (name: string, tab: string, filters: ActionFilters) =>
      save.mutate([...views, { id: crypto.randomUUID(), name, tab, filters }]),
    [views, save],
  );

  const removeView = useCallback(
    (id: string) => save.mutate(views.filter((v) => v.id !== id)),
    [views, save],
  );

  return { views, addView, removeView, isLoading: q.isLoading };
}
