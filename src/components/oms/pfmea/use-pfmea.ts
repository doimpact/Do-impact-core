import { getCurrentUser } from "@/lib/auth-session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { assertWrote } from "@/lib/write-guard";
import type { PfmeaRow, PfmeaStudy, DraftRow } from "./pfmea-types";

const STUDIES_KEY = ["pfmea_studies"];

export function usePfmeaStudies() {
  return useQuery({
    queryKey: STUDIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pfmea_studies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PfmeaStudy[];
    },
  });
}

export function usePfmeaRowCounts() {
  return useQuery({
    queryKey: ["pfmea_row_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pfmea_rows")
        .select("study_id, severity, occurrence, detection, action_status");
      if (error) throw error;
      return (data ?? []) as unknown as Pick<
        PfmeaRow,
        "study_id" | "severity" | "occurrence" | "detection" | "action_status"
      >[];
    },
  });
}

export function usePfmeaRows(studyId: string | null) {
  return useQuery({
    queryKey: ["pfmea_rows", studyId],
    enabled: !!studyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pfmea_rows")
        .select("*")
        .eq("study_id", studyId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PfmeaRow[];
    },
  });
}

export function usePfmeaMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: STUDIES_KEY });
    qc.invalidateQueries({ queryKey: ["pfmea_row_counts"] });
    qc.invalidateQueries({ queryKey: ["pfmea_rows"] });
  };

  const createStudy = useMutation({
    mutationFn: async (input: { study: Partial<PfmeaStudy> & { part_number: string }; rows: DraftRow[] }) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase
        .from("pfmea_studies")
        .insert({ ...input.study, created_by: u.user?.id ?? null } as never)
        .select()
        .single();
      if (error) throw error;
      const study = data as unknown as PfmeaStudy;

      if (input.rows.length) {
        const payload = input.rows.map((r, i) => {
          const { tempId: _t, ...rest } = r;
          void _t;
          return { ...rest, study_id: study.id, sort_order: i + 1 };
        });
        const { error: rowsError } = await supabase.from("pfmea_rows").insert(payload as never);
        if (rowsError) throw rowsError;
      }
      return study;
    },
    onSuccess: invalidate,
  });

  const updateStudy = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PfmeaStudy> }) => {
      const { data, error } = await supabase
        .from("pfmea_studies")
        .update(patch as never)
        .eq("id", id)
        .select();
      if (error) throw error;
      return assertWrote(data, "change")[0] as unknown as PfmeaStudy;
    },
    onSuccess: invalidate,
  });

  const deleteStudy = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("pfmea_studies").delete().eq("id", id).select();
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: invalidate,
  });

  const duplicateStudy = useMutation({
    mutationFn: async (study: PfmeaStudy) => {
      const { data: rows, error: rowsError } = await supabase
        .from("pfmea_rows")
        .select("*")
        .eq("study_id", study.id)
        .order("sort_order");
      if (rowsError) throw rowsError;

      const { data: u } = await getCurrentUser();
      const { id: _id, created_at: _c, updated_at: _u, company_id: _co, ...rest } = study;
      void _id; void _c; void _u; void _co;
      const { data, error } = await supabase
        .from("pfmea_studies")
        .insert({
          ...rest,
          title: `${study.title ?? study.part_number} (copy)`,
          status: "draft",
          archived_at: null,
          created_by: u.user?.id ?? null,
        } as never)
        .select()
        .single();
      if (error) throw error;
      const copy = data as unknown as PfmeaStudy;

      const source = (rows ?? []) as unknown as PfmeaRow[];
      if (source.length) {
        const payload = source.map((r, i) => {
          const { id: _rid, study_id: _sid, ...rowRest } = r;
          void _rid; void _sid;
          return { ...rowRest, study_id: copy.id, sort_order: i + 1 };
        });
        const { error: insertError } = await supabase.from("pfmea_rows").insert(payload as never);
        if (insertError) throw insertError;
      }
      return copy;
    },
    onSuccess: invalidate,
  });

  const saveRow = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PfmeaRow> }) => {
      const { data, error } = await supabase.from("pfmea_rows").update(patch as never).eq("id", id).select();
      if (error) throw error;
      return assertWrote(data, "change")[0] as unknown as PfmeaRow;
    },
    onSuccess: invalidate,
  });

  const addRow = useMutation({
    mutationFn: async (row: Partial<PfmeaRow> & { study_id: string; step_name: string }) => {
      const { data, error } = await supabase.from("pfmea_rows").insert(row as never).select().single();
      if (error) throw error;
      return data as unknown as PfmeaRow;
    },
    onSuccess: invalidate,
  });

  const addRows = useMutation({
    mutationFn: async ({ studyId, rows, startOrder }: { studyId: string; rows: DraftRow[]; startOrder: number }) => {
      const payload = rows.map((r, i) => {
        const { tempId: _t, ...rest } = r;
        void _t;
        return { ...rest, study_id: studyId, sort_order: startOrder + i };
      });
      const { error } = await supabase.from("pfmea_rows").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteRow = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("pfmea_rows").delete().eq("id", id).select();
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: invalidate,
  });

  return { createStudy, updateStudy, deleteStudy, duplicateStudy, saveRow, addRow, addRows, deleteRow };
}

/** Upload a drawing/spec to the private bucket; returns the stored path. */
export async function uploadPfmeaDrawing(companyId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("pfmea-drawings").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function useSignedDrawing(path: string | null) {
  return useQuery({
    queryKey: ["pfmea-drawing", path],
    enabled: !!path,
    staleTime: 45 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("pfmea-drawings").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}
