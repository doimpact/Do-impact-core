import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBusinessSnapshot, getBusinessSettings, saveBusinessSettings } from "@/lib/business.functions";

export function useBusinessSnapshot() {
  const fetch = useServerFn(getBusinessSnapshot);
  return useQuery({
    queryKey: ["business-snapshot"],
    queryFn: fetch,
  });
}

export function useBusinessSettings() {
  const fetch = useServerFn(getBusinessSettings);
  return useQuery({
    queryKey: ["business-settings"],
    queryFn: fetch,
  });
}

export type BusinessSettingsForm = {
  entity_name: string;
  legal_address: string;
  support_email: string;
  business_currency: string;
  cost_baseline_monthly: number;
};

export function useSaveBusinessSettings() {
  const qc = useQueryClient();
  const save = useServerFn(saveBusinessSettings);
  return useMutation({
    mutationFn: async (patch: BusinessSettingsForm) => save({ data: patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });
}
