import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { assertWrote } from "@/lib/write-guard";
import type { ApqpPhaseItem, ApqpProject } from "@/lib/apqp";

const PROJECTS_KEY = ["apqp_projects"];
const ITEMS_KEY = ["apqp_phase_items"];

export function useApqpProjects(showArchived: boolean) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, showArchived],
    queryFn: async () => {
      let q = supabase
        .from("apqp_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (!showArchived) q = q.is("archived_at", null).neq("status", "archived");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ApqpProject[];
    },
  });
}

export function useApqpItems(projectId: string | null) {
  return useQuery({
    queryKey: [...ITEMS_KEY, projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apqp_phase_items")
        .select("*")
        .eq("project_id", projectId!)
        .order("phase", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ApqpPhaseItem[];
    },
  });
}

/** Lightweight status-only read for progress bars across all projects. */
export function useApqpItemStats() {
  return useQuery({
    queryKey: [...ITEMS_KEY, "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apqp_phase_items")
        .select("project_id, phase, status");
      if (error) throw error;
      return (data ?? []) as unknown as Pick<ApqpPhaseItem, "project_id" | "phase" | "status">[];
    },
  });
}

export function useApqpMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    qc.invalidateQueries({ queryKey: ITEMS_KEY });
  };

  const createProject = useMutation({
    mutationFn: async (input: Partial<ApqpProject> & { title: string }) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase
        .from("apqp_projects")
        .insert({ ...input, created_by: u.user?.id ?? null } as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ApqpProject;
    },
    onSuccess: invalidate,
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ApqpProject> }) => {
      const { data, error } = await supabase
        .from("apqp_projects")
        .update(patch as never)
        .eq("id", id)
        .select();
      if (error) throw error;
      return assertWrote(data, "change")[0] as unknown as ApqpProject;
    },
    onSuccess: invalidate,
  });

  const archiveProject = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const patch = archive
        ? { status: "archived", archived_at: new Date().toISOString() }
        : { status: "active", archived_at: null };
      const { data, error } = await supabase
        .from("apqp_projects")
        .update(patch as never)
        .eq("id", id)
        .select();
      if (error) throw error;
      assertWrote(data, "change");
    },
    onSuccess: invalidate,
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("apqp_projects").delete().eq("id", id).select();
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ApqpPhaseItem> }) => {
      const { data, error } = await supabase
        .from("apqp_phase_items")
        .update(patch as never)
        .eq("id", id)
        .select();
      if (error) throw error;
      return assertWrote(data, "change")[0] as unknown as ApqpPhaseItem;
    },
    onSuccess: invalidate,
  });

  return { createProject, updateProject, archiveProject, deleteProject, updateItem };
}
