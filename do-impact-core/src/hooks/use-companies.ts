// DO.Impact Core (open-source edition) — workspaces without accounts or
// billing: every company in the local database is available, and the active
// workspace is remembered in localStorage.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOCAL_USER_ID } from "@/lib/local-user";

export type CompanyMembership = {
  company_id: string;
  role: "owner" | "admin" | "member";
  companies: { id: string; name: string; slug: string | null; archived_at: string | null; is_template: boolean; pending_checkout: boolean } | null;
};

const ACTIVE_KEY = "do-impact-core.active-company";

export function useMyCompanies() {
  return useQuery({
    queryKey: ["my-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, archived_at, is_template, pending_checkout")
        .is("archived_at", null)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((c) => ({ company_id: c.id, role: "owner" as const, companies: c }));
    },
  });
}

export function useActiveCompany() {
  const companiesQ = useMyCompanies();
  return useQuery({
    queryKey: ["active-company"],
    enabled: companiesQ.isSuccess,
    queryFn: async () => {
      const companies = companiesQ.data ?? [];
      if (companies.length === 0) return null;
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_KEY) : null;
      const found = companies.find((c) => c.company_id === stored);
      // Default to the TitanScale Template sample when present, else first.
      const fallback =
        companies.find((c) => c.companies?.is_template) ?? companies[0];
      const chosen = found ?? fallback;
      return { company_id: chosen.company_id, companies: chosen.companies };
    },
  });
}

export function useSetActiveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (company_id: string) => {
      if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_KEY, company_id);
      await supabase
        .from("user_active_company")
        .upsert({ user_id: LOCAL_USER_ID, company_id }, { onConflict: "user_id" });
      return { company_id };
    },
    onSuccess: () => qc.clear(),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("companies")
        .insert({ name, created_by: LOCAL_USER_ID })
        .select("id, name")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-companies"] });
      qc.invalidateQueries({ queryKey: ["active-company"] });
    },
  });
}

export function useMyCompanyQuota() {
  return { used: 0, quota: Infinity, unlimited: true, isLoading: false, canCreate: true, remaining: Infinity };
}

export function useRenameCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("companies").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-companies"] });
      qc.invalidateQueries({ queryKey: ["active-company"] });
    },
  });
}

export function useArchiveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from("companies")
        .update({ archived_at: archive ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-companies"] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.clear(),
  });
}

export function useDuplicateCompany() {
  // Duplicating a whole workspace needs the hosted product's server logic;
  // locally, create a fresh workspace instead.
  return useCreateCompany();
}
