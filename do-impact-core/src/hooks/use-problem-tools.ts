import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  CatchballEntry,
  CldLink,
  CldNode,
  CldPhases,
  HoshinFinding,
  MroDriverEntry,
  MroModuleEntry,
} from "@/lib/problem-tools";

type Status = "not_started" | "in_progress" | "blocked" | "done";

// ---------- shared row types ----------
export type TocAnalysis = {
  id: string;
  archived_at: string | null;
  plan_id: string | null;
  title: string;
  system_scope: string | null;
  constraint_name: string | null;
  throughput: number | null;
  inventory: number | null;
  operating_expense: number | null;
  c2c_baseline: number | null;
  c2c_target: number | null;
  c2c_current: number | null;
  buffer_notes: string | null;
  dbr_notes: string | null;
  policy_constraints: string[];
  owner_id: string | null;
  created_at: string;
};
export type TocCandidate = {
  id: string;
  analysis_id: string;
  name: string;
  load_pct: number | null;
  capacity_note: string | null;
  is_constraint: boolean;
  sort_order: number;
};
export type TocStep = {
  id: string;
  analysis_id: string;
  step: number;
  title: string;
  description: string | null;
  owner_id: string | null;
  status: Status;
  due_date: string | null;
  sort_order: number;
};
export type CldDiagram = {
  id: string;
  archived_at: string | null;
  plan_id: string | null;
  title: string;
  description: string | null;
  nodes: CldNode[];
  links: CldLink[];
  loop_notes: Record<string, string>;
  phases: CldPhases;
  owner_id: string | null;
  created_at: string;
};
export type IbpCycle = {
  id: string;
  archived_at: string | null;
  plan_id: string | null;
  title: string;
  cycle_month: string | null;
  horizon_months: number;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
};
export type IbpStep = {
  id: string;
  cycle_id: string;
  step_key: string;
  owner_id: string | null;
  meeting_date: string | null;
  status: Status;
  decisions: string | null;
  assumptions: string | null;
  sort_order: number;
};
export type IbpGap = {
  id: string;
  cycle_id: string;
  kind: string;
  label: string;
  month: string | null;
  demand_val: number | null;
  supply_val: number | null;
  financial_val: number | null;
  lead_time_weeks: number | null;
  risk: string | null;
  owner_id: string | null;
  status: Status;
  notes: string | null;
  sort_order: number;
};
export type HoshinReview = {
  id: string;
  archived_at: string | null;
  plan_id: string | null;
  title: string;
  review_date: string | null;
  notes: string | null;
  findings: HoshinFinding[];
  catchball: CatchballEntry[];
  owner_id: string | null;
  created_at: string;
};
export type JourneyMap = {
  id: string;
  archived_at: string | null;
  plan_id: string | null;
  title: string;
  segment: string | null;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
};
export type JourneyStage = {
  id: string;
  map_id: string;
  stage_key: string;
  sentiment: number;
  moments: string | null;
};
export type JourneyPain = {
  id: string;
  map_id: string;
  stage_key: string;
  label: string;
  severity: number;
  frequency: number;
  root_cause: string | null;
  countermeasure: string | null;
  owner_id: string | null;
  status: Status;
  sort_order: number;
};

// ---------- generic helpers ----------
const table = (name: string) => supabase.from(name as never);

function useRows<T>(
  key: unknown[],
  name: string,
  opts?: { eq?: [string, string | null]; order?: string; includeArchived?: boolean },
) {
  const enabled = !opts?.eq || !!opts.eq[1];
  return useQuery({
    queryKey: key,
    enabled,
    queryFn: async () => {
      let q = table(name).select("*");
      if (opts?.eq) q = (q as never as { eq: (c: string, v: string) => typeof q }).eq(opts.eq[0], opts.eq[1] as string);
      if (opts?.includeArchived === false)
        q = (q as never as { is: (c: string, v: null) => typeof q }).is("archived_at", null);
      if (opts?.order) q = (q as never as { order: (c: string) => typeof q }).order(opts.order);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function useRowMutations(name: string, invalidate: unknown[][]) {
  const qc = useQueryClient();
  const done = () => invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
  const create = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data, error } = await table(name).insert(row as never).select("id").single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: done,
    onError: (e) => toast.error(`Could not create: ${errMsg(e)}`),
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await table(name).update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e) => toast.error(`Could not save: ${errMsg(e)}`),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await table(name).delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0)
        throw new Error("Nothing was deleted — the record may belong to another company or be read-only.");
    },
    onSuccess: () => {
      done();
      toast.success("Deleted");
    },
    onError: (e) => toast.error(`Could not delete: ${errMsg(e)}`),
  });
  const setArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await table(name)
        .update({ archived_at: archived ? new Date().toISOString() : null } as never)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || (data as unknown[]).length === 0) throw new Error("No record was updated.");
    },
    onSuccess: (_d, v) => {
      done();
      toast.success(v.archived ? "Archived" : "Restored");
    },
    onError: (e) => toast.error(`Could not archive: ${errMsg(e)}`),
  });
  return { create, update, remove, setArchived };
}

// ---------- TOC ----------
export const useTocAnalyses = (includeArchived = false) =>
  useRows<TocAnalysis>(["toc-analyses", includeArchived], "toc_analyses", { order: "created_at", includeArchived });
export const useTocCandidates = (analysisId: string | null) =>
  useRows<TocCandidate>(["toc-candidates", analysisId], "toc_candidates", { eq: ["analysis_id", analysisId], order: "sort_order" });
export const useTocSteps = (analysisId: string | null) =>
  useRows<TocStep>(["toc-steps", analysisId], "toc_steps", { eq: ["analysis_id", analysisId], order: "sort_order" });
export const useTocAnalysisMut = () => useRowMutations("toc_analyses", [["toc-analyses"]]);
export const useTocCandidateMut = (analysisId: string | null) =>
  useRowMutations("toc_candidates", [["toc-candidates", analysisId]]);
export const useTocStepMut = (analysisId: string | null) => useRowMutations("toc_steps", [["toc-steps", analysisId]]);

// ---------- CLD ----------
export const useCldDiagrams = (includeArchived = false) =>
  useRows<CldDiagram>(["cld-diagrams", includeArchived], "cld_diagrams", { order: "created_at", includeArchived });
export const useCldMut = () => useRowMutations("cld_diagrams", [["cld-diagrams"]]);

// ---------- IBP ----------
export const useIbpCycles = (includeArchived = false) =>
  useRows<IbpCycle>(["ibp-cycles", includeArchived], "ibp_cycles", { order: "created_at", includeArchived });
export const useIbpSteps = (cycleId: string | null) =>
  useRows<IbpStep>(["ibp-steps", cycleId], "ibp_steps", { eq: ["cycle_id", cycleId], order: "sort_order" });
export const useIbpGaps = (cycleId: string | null) =>
  useRows<IbpGap>(["ibp-gaps", cycleId], "ibp_gaps", { eq: ["cycle_id", cycleId], order: "sort_order" });
export const useIbpCycleMut = () => useRowMutations("ibp_cycles", [["ibp-cycles"]]);
export const useIbpStepMut = (cycleId: string | null) => useRowMutations("ibp_steps", [["ibp-steps", cycleId]]);
export const useIbpGapMut = (cycleId: string | null) => useRowMutations("ibp_gaps", [["ibp-gaps", cycleId]]);

// ---------- Hoshin review ----------
export const useHoshinReviews = (includeArchived = false) =>
  useRows<HoshinReview>(["hoshin-reviews", includeArchived], "hoshin_reviews", { order: "created_at", includeArchived });
export const useHoshinReviewMut = () => useRowMutations("hoshin_reviews", [["hoshin-reviews"]]);

/** Read-only pull of the live X-matrix so the review can flag real gaps. */
export function useHoshinItems() {
  return useQuery({
    queryKey: ["hoshin-items-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hoshin_items")
        .select("id,kind,title,owner_id,target_value,current_value")
        .is("archived_at", null)
        .order("kind");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        kind: string;
        title: string;
        owner_id: string | null;
        target_value: string | null;
        current_value: string | null;
      }[];
    },
  });
}

// ---------- Employee journey ----------
export const useJourneyMaps = (includeArchived = false) =>
  useRows<JourneyMap>(["journey-maps", includeArchived], "journey_maps", { order: "created_at", includeArchived });
export const useJourneyStages = (mapId: string | null) =>
  useRows<JourneyStage>(["journey-stages", mapId], "journey_stages", { eq: ["map_id", mapId] });
export const useJourneyPains = (mapId: string | null) =>
  useRows<JourneyPain>(["journey-pains", mapId], "journey_pain_points", { eq: ["map_id", mapId], order: "sort_order" });
export const useJourneyMapMut = () => useRowMutations("journey_maps", [["journey-maps"]]);
export const useJourneyStageMut = (mapId: string | null) =>
  useRowMutations("journey_stages", [["journey-stages", mapId]]);
export const useJourneyPainMut = (mapId: string | null) =>
  useRowMutations("journey_pain_points", [["journey-pains", mapId]]);

// ---------- Aviation MRO ----------
export type MroAssessment = {
  id: string;
  archived_at: string | null;
  plan_id: string | null;
  title: string;
  aircraft_type: string | null;
  check_type: string | null;
  wrench_time_pct: number;
  drivers: Record<string, MroDriverEntry>;
  modules: Record<string, MroModuleEntry>;
  owner_id: string | null;
  created_at: string;
};
export type MroAction = {
  id: string;
  assessment_id: string;
  driver_key: string | null;
  title: string;
  owner_id: string | null;
  due_date: string | null;
  status: Status;
  sort_order: number;
};

export const useMroAssessments = (includeArchived = false) =>
  useRows<MroAssessment>(["mro-assessments", includeArchived], "mro_assessments", {
    order: "created_at",
    includeArchived,
  });
export const useMroActions = (assessmentId: string | null) =>
  useRows<MroAction>(["mro-actions", assessmentId], "mro_actions", {
    eq: ["assessment_id", assessmentId],
    order: "sort_order",
  });
export const useMroAssessmentMut = () => useRowMutations("mro_assessments", [["mro-assessments"]]);
export const useMroActionMut = (assessmentId: string | null) =>
  useRowMutations("mro_actions", [["mro-actions", assessmentId]]);
