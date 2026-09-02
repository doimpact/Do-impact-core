import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import type { BcmAction, BcmAsset, BcmExercise, BcmIncident, BcmProcess, BcmRisk } from "@/lib/bcm";

type Table = "bcm_processes" | "bcm_risks" | "bcm_assets" | "bcm_incidents" | "bcm_exercises" | "bcm_actions";

const KEYS: Table[] = ["bcm_processes", "bcm_risks", "bcm_assets", "bcm_incidents", "bcm_exercises", "bcm_actions"];

function useList<T>(table: Table, order: { column: string; asc?: boolean }) {
  const { data: active } = useActiveCompany();
  const companyId = active?.company_id ?? null;
  return useQuery({
    queryKey: [table, companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(order.column, { ascending: order.asc ?? false });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });
}

export const useBcmProcesses = () => useList<BcmProcess>("bcm_processes", { column: "created_at", asc: true });
export const useBcmRisks = () => useList<BcmRisk>("bcm_risks", { column: "risk_score" });
export const useBcmAssets = () => useList<BcmAsset>("bcm_assets", { column: "created_at", asc: true });
export const useBcmIncidents = () => useList<BcmIncident>("bcm_incidents", { column: "occurred_at" });
export const useBcmExercises = () => useList<BcmExercise>("bcm_exercises", { column: "exercise_date" });
export const useBcmActions = () => useList<BcmAction>("bcm_actions", { column: "due_date", asc: true });

function useInvalidate() {
  const qc = useQueryClient();
  return () => KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useCreateBcm(table: Table) {
  const invalidate = useInvalidate();
  const { data: active } = useActiveCompany();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const companyId = active?.company_id;
      if (!companyId) throw new Error("No active workspace");
      const { data: auth } = await getCurrentUser();
      const { data, error } = await supabase
        .from(table)
        .insert({ ...payload, company_id: companyId, created_by: auth.user?.id ?? null } as never)
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });
}

export function useUpdateBcm(table: Table) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await supabase.from(table).update(patch as never).eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Nothing was saved — this workspace may be read-only.");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });
}

export function useDeleteBcm(table: Table) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });
}
