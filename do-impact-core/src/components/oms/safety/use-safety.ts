import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import type { SafetyReport, SafetyWalk } from "@/lib/safety";

const REPORT_COLS =
  "id,ref,source,walk_id,report_type,occurred_at,location,department,reporter_name,anonymous,description,immediate_action,potential_consequence,photo_path,severity,likelihood,risk_score,immediate_control,permanent_action,control_level,owner_id,due_date,status,verified_by,effectiveness,closed_at,created_at";

export function useSafetyReports() {
  const { data: active } = useActiveCompany();
  const companyId = active?.company_id ?? null;
  return useQuery({
    queryKey: ["safety_reports", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_reports")
        .select(REPORT_COLS)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SafetyReport[];
    },
  });
}

export function useSafetyWalks() {
  const { data: active } = useActiveCompany();
  const companyId = active?.company_id ?? null;
  return useQuery({
    queryKey: ["safety_walks", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_walks")
        .select("id,walk_type,walk_date,area,department,led_by,participants,good_practices,notes,created_at")
        .order("walk_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as SafetyWalk[];
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["safety_reports"] });
    qc.invalidateQueries({ queryKey: ["safety_walks"] });
  };
}

export function useCreateReport() {
  const invalidate = useInvalidate();
  const { data: active } = useActiveCompany();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const companyId = active?.company_id;
      if (!companyId) throw new Error("No active workspace");
      const { data: auth } = await getCurrentUser();
      const { data, error } = await supabase
        .from("safety_reports")
        .insert({ ...payload, company_id: companyId, created_by: auth.user?.id ?? null } as never)
        .select("id,ref")
        .single();
      if (error) throw error;
      return data as { id: string; ref: string | null };
    },
    onSuccess: (r) => {
      invalidate();
      toast.success(`Report logged${r?.ref ? ` — ${r.ref}` : ""}`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save the report"),
  });
}

export function useUpdateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await supabase.from("safety_reports").update(patch as never).eq("id", id).select("id");
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

export function useDeleteReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("safety_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Report deleted");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });
}

export function useCreateWalk() {
  const invalidate = useInvalidate();
  const { data: active } = useActiveCompany();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const companyId = active?.company_id;
      if (!companyId) throw new Error("No active workspace");
      const { data: auth } = await getCurrentUser();
      const { data, error } = await supabase
        .from("safety_walks")
        .insert({ ...payload, company_id: companyId, created_by: auth.user?.id ?? null } as never)
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => {
      invalidate();
      toast.success("Safety walk logged");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not save the walk"),
  });
}

/** Upload a hazard photo to the private bucket; returns the stored path. */
export async function uploadSafetyPhoto(companyId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("safety-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function useSignedPhoto(path: string | null) {
  return useQuery({
    queryKey: ["safety-photo", path],
    enabled: !!path,
    staleTime: 45 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("safety-photos").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
