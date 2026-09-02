import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { assertWrote } from "@/lib/write-guard";
import type { Horizon, PlaybookInputs, Weight } from "@/lib/decision-playbook";

export type PlaybookWorksheet = {
  id: string;
  company_id: string;
  goal_key: string;
  title: string;
  objective_id: string | null;
  hoshin_item_id: string | null;
  inputs: PlaybookInputs;
  notes: string | null;
  status: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlaybookItemKind = "action" | "assumption" | "watch";

export type PlaybookItem = {
  id: string;
  worksheet_id: string;
  kind: PlaybookItemKind;
  rule_key: string | null;
  text: string;
  rationale: string | null;
  horizon: Horizon | null;
  impact: Weight | null;
  effort: Weight | null;
  accepted: boolean;
  owner_id: string | null;
  due_date: string | null;
  pushed_action_id: string | null;
  sort_order: number;
};

const WORKSHEET_COLS =
  "id,company_id,goal_key,title,objective_id,hoshin_item_id,inputs,notes,status,archived_at,created_at,updated_at";
const ITEM_COLS =
  "id,worksheet_id,kind,rule_key,text,rationale,horizon,impact,effort,accepted,owner_id,due_date,pushed_action_id,sort_order";

export function usePlaybooks() {
  return useQuery({
    queryKey: ["playbooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_worksheets")
        .select(WORKSHEET_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PlaybookWorksheet[];
    },
  });
}

export function usePlaybook(id: string) {
  return useQuery({
    queryKey: ["playbook", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_worksheets")
        .select(WORKSHEET_COLS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as PlaybookWorksheet | null;
    },
    enabled: !!id,
  });
}

export function usePlaybookItems(worksheetId: string) {
  return useQuery({
    queryKey: ["playbook-items", worksheetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playbook_items")
        .select(ITEM_COLS)
        .eq("worksheet_id", worksheetId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as PlaybookItem[];
    },
    enabled: !!worksheetId,
  });
}

export type NewItem = Omit<PlaybookItem, "id" | "worksheet_id" | "accepted" | "owner_id" | "due_date" | "pushed_action_id">;

export type NewPlaybook = {
  goal_key: string;
  title: string;
  objective_id: string | null;
  hoshin_item_id: string | null;
  inputs: PlaybookInputs;
  notes: string | null;
  items: NewItem[];
};

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPlaybook) => {
      const { data: userData } = await getCurrentUser();
      const { data: sheet, error } = await supabase
        .from("playbook_worksheets")
        .insert({
          goal_key: input.goal_key,
          title: input.title,
          objective_id: input.objective_id,
          hoshin_item_id: input.hoshin_item_id,
          inputs: input.inputs as never,
          notes: input.notes,
          created_by: userData.user?.id ?? null,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      const id = (sheet as { id: string }).id;
      if (input.items.length) {
        const { error: iErr } = await supabase
          .from("playbook_items")
          .insert(input.items.map((it) => ({ ...it, worksheet_id: id })) as never);
        if (iErr) throw iErr;
      }
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbooks"] }),
  });
}

export function useUpdatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PlaybookWorksheet> }) => {
      const { data, error } = await supabase
        .from("playbook_worksheets")
        .update(patch as never)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["playbooks"] });
      qc.invalidateQueries({ queryKey: ["playbook", v.id] });
    },
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("playbook_worksheets").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbooks"] }),
  });
}

/** Regenerate the items of a worksheet from a fresh rule run. */
export function useReplaceItems(worksheetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: NewItem[]) => {
      const { error: dErr } = await supabase
        .from("playbook_items")
        .delete()
        .eq("worksheet_id", worksheetId)
        .is("pushed_action_id", null);
      if (dErr) throw dErr;
      if (items.length) {
        const { error } = await supabase
          .from("playbook_items")
          .insert(items.map((it) => ({ ...it, worksheet_id: worksheetId })) as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbook-items", worksheetId] }),
  });
}

export function useUpdateItem(worksheetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PlaybookItem> }) => {
      const { data, error } = await supabase.from("playbook_items").update(patch as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playbook-items", worksheetId] }),
  });
}

/**
 * Push accepted recommendations into the action tracker.
 * Creates objective_actions rows, which the Execution Timeline already surfaces.
 */
export function usePushToActions(worksheetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, objectiveId }: { items: PlaybookItem[]; objectiveId: string | null }) => {
      const { data: userData } = await getCurrentUser();
      let pushed = 0;
      for (const item of items) {
        if (item.pushed_action_id) continue;
        const { data, error } = await supabase
          .from("objective_actions")
          .insert({
            objective_id: objectiveId,
            title: item.text,
            description: item.rationale,
            owner_id: item.owner_id,
            due_date: item.due_date,
            status: "open",
            created_by: userData.user?.id ?? null,
          } as never)
          .select("id")
          .single();
        if (error) throw error;
        const actionId = (data as { id: string }).id;
        const { data: upd, error: uErr } = await supabase
          .from("playbook_items")
          .update({ pushed_action_id: actionId, accepted: true } as never)
          .eq("id", item.id)
          .select("id");
        if (uErr) throw uErr;
        assertWrote(upd, "update");
        pushed += 1;
      }
      return pushed;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbook-items", worksheetId] });
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["execution-actions"] });
    },
  });
}
