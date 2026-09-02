import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type FrameworkEntry = {
  id: string;
  section_key: string;
  item_key: string;
  content: string | null;
  status: string;
  position: number;
};

export type FrameworkRow = {
  id: string;
  section_key: string;
  label: string | null;
  data: Record<string, unknown>;
  position: number;
};

const ENTRIES_KEY = ["industrial-strategy-entries"];
const ROWS_KEY = ["industrial-strategy-rows"];

export function useFrameworkEntries() {
  return useQuery({
    queryKey: ENTRIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrial_strategy_entries")
        .select("id,section_key,item_key,content,status,position");
      if (error) throw error;
      return (data ?? []) as FrameworkEntry[];
    },
  });
}

export function useSaveEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sectionKey: string; itemKey: string; content?: string | null; status?: string }) => {
      const payload: Record<string, unknown> = {
        section_key: input.sectionKey,
        item_key: input.itemKey,
      };
      if (input.content !== undefined) payload.content = input.content;
      if (input.status !== undefined) payload.status = input.status;
      const { error } = await supabase
        .from("industrial_strategy_entries")
        .upsert(payload as never, { onConflict: "company_id,section_key,item_key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ENTRIES_KEY }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
}

export function useFrameworkRows() {
  return useQuery({
    queryKey: ROWS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industrial_strategy_rows")
        .select("id,section_key,label,data,position")
        .order("position");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        data: (r.data ?? {}) as Record<string, unknown>,
      })) as FrameworkRow[];
    },
  });
}

export function useRowMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ROWS_KEY });
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Save failed");

  const add = useMutation({
    mutationFn: async (input: { sectionKey: string; label?: string; data?: Record<string, unknown>; position?: number }) => {
      const { error } = await supabase.from("industrial_strategy_rows").insert({
        section_key: input.sectionKey,
        label: input.label ?? "",
        data: (input.data ?? {}) as never,
        position: input.position ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; label?: string | null; data?: Record<string, unknown> }) => {
      const payload: Record<string, unknown> = {};
      if (input.label !== undefined) payload.label = input.label;
      if (input.data !== undefined) payload.data = input.data;
      const { error } = await supabase
        .from("industrial_strategy_rows")
        .update(payload as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("industrial_strategy_rows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: fail,
  });

  return { add, update, remove };
}
