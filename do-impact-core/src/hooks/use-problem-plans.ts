import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProblemPlan, ProblemStep, StepAction } from "@/lib/problem-plan";

export function useProblemPlans() {
  return useQuery({
    queryKey: ["problem-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_plans")
        .select("id,title,statement,source_problem_id,owner_id,status,target_date,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProblemPlan[];
    },
  });
}

export function useAllProblemSteps() {
  return useQuery({
    queryKey: ["problem-steps-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_plan_steps")
        .select("id,plan_id,module_id,label,why,owner_id,status,progress_pct,due_date,notes,sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ProblemStep[];
    },
  });
}

export function useProblemPlan(planId: string) {
  return useQuery({
    queryKey: ["problem-plan", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_plans")
        .select("id,title,statement,source_problem_id,owner_id,status,target_date,created_at")
        .eq("id", planId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProblemPlan | null;
    },
  });
}

export function useProblemSteps(planId: string) {
  return useQuery({
    queryKey: ["problem-steps", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_plan_steps")
        .select("id,plan_id,module_id,label,why,owner_id,status,progress_pct,due_date,notes,sort_order")
        .eq("plan_id", planId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ProblemStep[];
    },
  });
}

export function useStepActions(planId: string) {
  return useQuery({
    queryKey: ["problem-step-actions", planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problem_step_actions")
        .select("id,step_id,plan_id,title,owner_id,due_date,status")
        .eq("plan_id", planId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as StepAction[];
    },
  });
}

export type NewPlanInput = {
  title: string;
  statement: string | null;
  owner_id: string | null;
  target_date: string | null;
  source_problem_id: string | null;
  steps: { module_id: string; label: string; why: string | null }[];
};

export function useCreateProblemPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPlanInput) => {
      const { data: userData } = await getCurrentUser();
      const { data: plan, error } = await supabase
        .from("problem_plans")
        .insert({
          title: input.title,
          statement: input.statement,
          owner_id: input.owner_id,
          target_date: input.target_date,
          source_problem_id: input.source_problem_id,
          created_by: userData.user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (input.steps.length) {
        const { error: sErr } = await supabase.from("problem_plan_steps").insert(
          input.steps.map((s, i) => ({
            plan_id: plan.id,
            module_id: s.module_id,
            label: s.label,
            why: s.why,
            sort_order: i,
          })),
        );
        if (sErr) throw sErr;
      }
      return plan.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problem-plans"] });
      qc.invalidateQueries({ queryKey: ["problem-steps-all"] });
    },
  });
}

export function useUpdatePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProblemPlan>) => {
      const { error } = await supabase.from("problem_plans").update(patch as never).eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problem-plan", planId] });
      qc.invalidateQueries({ queryKey: ["problem-plans"] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from("problem_plans").delete().eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problem-plans"] });
      qc.invalidateQueries({ queryKey: ["problem-steps-all"] });
    },
  });
}

export function useUpdateStep(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProblemStep> }) => {
      const { error } = await supabase.from("problem_plan_steps").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problem-steps", planId] });
      qc.invalidateQueries({ queryKey: ["problem-steps-all"] });
    },
  });
}

export function useAddSteps(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (steps: { module_id: string; label: string; why: string | null; sort_order: number }[]) => {
      const { error } = await supabase
        .from("problem_plan_steps")
        .insert(steps.map((s) => ({ ...s, plan_id: planId })));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problem-steps", planId] });
      qc.invalidateQueries({ queryKey: ["problem-steps-all"] });
    },
  });
}

export function useDeleteStep(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("problem_plan_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["problem-steps", planId] });
      qc.invalidateQueries({ queryKey: ["problem-steps-all"] });
    },
  });
}

export function useReorderSteps(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: { id: string; sort_order: number }[]) => {
      for (const o of ordered) {
        const { error } = await supabase
          .from("problem_plan_steps")
          .update({ sort_order: o.sort_order })
          .eq("id", o.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["problem-steps", planId] }),
  });
}

export function useStepActionMutations(planId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["problem-step-actions", planId] });
    qc.invalidateQueries({ queryKey: ["actions-timeline"] });
  };
  const create = useMutation({
    mutationFn: async (a: { step_id: string; title: string; owner_id: string | null; due_date: string | null }) => {
      const { error } = await supabase.from("problem_step_actions").insert({ ...a, plan_id: planId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<StepAction> }) => {
      const { error } = await supabase.from("problem_step_actions").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("problem_step_actions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { create, update, remove };
}
