import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "./types";

const table = (name: string) => supabase.from(name as never);

export function useCppRows<T>(name: string, visitId: string | null, orderBy: string, ascending = true) {
  return useQuery({
    queryKey: [name, visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const { data, error } = await table(name)
        .select("*")
        .eq("visit_id", visitId as string)
        .order(orderBy, { ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useCppMutations(name: string, visitId: string | null) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: [name, visitId] });

  const create = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { error } = await table(name).insert({ ...row, visit_id: visitId } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      done();
      toast.success("Saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await table(name).update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
    onError: (e) => toast.error(errMsg(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table(name).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      done();
      toast.success("Deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return { create, update, remove };
}
