import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import type {
  AmpmAbnormality,
  AmpmAction,
  AmpmAmCheck,
  AmpmBreakdown,
  AmpmEquipment,
  AmpmLubrication,
  AmpmPmTask,
  AmpmSpare,
  AmpmWorkOrder,
} from "@/lib/ampm";

export type AmpmTable =
  | "ampm_equipment"
  | "ampm_am_checks"
  | "ampm_abnormalities"
  | "ampm_pm_tasks"
  | "ampm_work_orders"
  | "ampm_breakdowns"
  | "ampm_spares"
  | "ampm_lubrication"
  | "ampm_actions";

const KEYS: AmpmTable[] = [
  "ampm_equipment",
  "ampm_am_checks",
  "ampm_abnormalities",
  "ampm_pm_tasks",
  "ampm_work_orders",
  "ampm_breakdowns",
  "ampm_spares",
  "ampm_lubrication",
  "ampm_actions",
];

function useList<T>(table: AmpmTable, order: { column: string; asc?: boolean }) {
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

export const useEquipment = () => useList<AmpmEquipment>("ampm_equipment", { column: "created_at", asc: true });
export const useAmChecks = () => useList<AmpmAmCheck>("ampm_am_checks", { column: "check_date" });
export const useAbnormalities = () => useList<AmpmAbnormality>("ampm_abnormalities", { column: "found_on" });
export const usePmTasks = () => useList<AmpmPmTask>("ampm_pm_tasks", { column: "next_due", asc: true });
export const useWorkOrders = () => useList<AmpmWorkOrder>("ampm_work_orders", { column: "scheduled_date" });
export const useBreakdowns = () => useList<AmpmBreakdown>("ampm_breakdowns", { column: "occurred_at" });
export const useSpares = () => useList<AmpmSpare>("ampm_spares", { column: "created_at", asc: true });
export const useLubrication = () => useList<AmpmLubrication>("ampm_lubrication", { column: "created_at", asc: true });
export const useAmpmActions = () => useList<AmpmAction>("ampm_actions", { column: "due_date", asc: true });

function useInvalidate() {
  const qc = useQueryClient();
  return () => KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useCreateAmpm(table: AmpmTable) {
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

export function useUpdateAmpm(table: AmpmTable) {
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

export function useDeleteAmpm(table: AmpmTable) {
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
