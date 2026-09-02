import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BidReview = {
  id: string;
  account_id: string | null;
  opportunity_id: string | null;
  contract_id: string | null;
  reference: string | null;
  title: string;
  customer_name: string | null;
  product_program: string | null;
  est_revenue: number;
  est_volume: string | null;
  currency: string;
  bid_due_date: string | null;
  program_timing: string | null;
  strategic_rationale: string | null;
  capital_tooling: string | null;
  owner_name: string | null;
  current_gate: number;
  status: string;
  archived: boolean;
  notes: string | null;
  created_at: string;
  accounts?: { name: string } | null;
};

export type BidReviewGate = {
  id: string;
  review_id: string;
  gate: number;
  decision: string | null;
  decided_on: string | null;
  approver: string | null;
  notes: string | null;
  checklist: Record<string, { done?: boolean; note?: string; owner?: string }>;
};

export type BidReviewItem = {
  id: string;
  review_id: string;
  kind: string;
  ref: string | null;
  title: string;
  detail: string | null;
  owner_name: string | null;
  status: string;
  due_date: string | null;
  probability: number | null;
  impact: number | null;
  data: Record<string, any>;
  sort: number;
};

export function useBidReviews(includeArchived = false) {
  return useQuery({
    queryKey: ["bid-reviews", includeArchived],
    queryFn: async () => {
      let q = supabase.from("bid_reviews").select("*, accounts(name)").order("created_at", { ascending: false });
      if (!includeArchived) q = q.eq("archived", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as BidReview[];
    },
  });
}

export function useBidReviewGates(reviewId?: string) {
  return useQuery({
    enabled: !!reviewId,
    queryKey: ["bid-review-gates", reviewId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bid_review_gates").select("*").eq("review_id", reviewId!).order("gate");
      if (error) throw error;
      return (data ?? []) as unknown as BidReviewGate[];
    },
  });
}

export function useBidReviewItems(reviewId?: string, all = false) {
  return useQuery({
    enabled: !!reviewId || all,
    queryKey: ["bid-review-items", reviewId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("bid_review_items").select("*").order("sort");
      if (reviewId) q = q.eq("review_id", reviewId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as BidReviewItem[];
    },
  });
}

export function useBidReviewMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["bid-reviews"] });
    qc.invalidateQueries({ queryKey: ["bid-review-gates"] });
    qc.invalidateQueries({ queryKey: ["bid-review-items"] });
  };

  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const saveReview = useMutation({
    mutationFn: async (row: Partial<BidReview> & { id?: string }) => {
      const { id, accounts: _a, ...rest } = row as any;
      if (id) {
        const { data, error } = await supabase.from("bid_reviews").update(rest).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Nothing was changed — this workspace may be read-only.");
      } else {
        const { error } = await supabase.from("bid_reviews").insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { refresh(); toast.success("Saved"); },
    onError: fail,
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("bid_reviews").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Nothing was deleted — this workspace may be read-only.");
    },
    onSuccess: () => { refresh(); toast.success("Deleted"); },
    onError: fail,
  });

  const saveGate = useMutation({
    mutationFn: async (row: Partial<BidReviewGate> & { review_id: string; gate: number }) => {
      const { id, ...rest } = row as any;
      const { data, error } = await supabase
        .from("bid_review_gates")
        .upsert(rest as any, { onConflict: "review_id,gate" })
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Nothing was changed — this workspace may be read-only.");
    },
    onSuccess: () => refresh(),
    onError: fail,
  });

  const saveItem = useMutation({
    mutationFn: async (row: Partial<BidReviewItem> & { id?: string }) => {
      const { id, ...rest } = row as any;
      if (id) {
        const { data, error } = await supabase.from("bid_review_items").update(rest).eq("id", id).select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Nothing was changed — this workspace may be read-only.");
      } else {
        const { error } = await supabase.from("bid_review_items").insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { refresh(); toast.success("Saved"); },
    onError: fail,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("bid_review_items").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Nothing was deleted — this workspace may be read-only.");
    },
    onSuccess: () => { refresh(); toast.success("Deleted"); },
    onError: fail,
  });

  return { saveReview, deleteReview, saveGate, saveItem, deleteItem };
}
