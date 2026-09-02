import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { REVIEW_STATUS } from "@/lib/bid-contract-review";
import type { BidReview } from "./use-bid-reviews";

type Draft = Record<string, string>;

const empty: Draft = {
  reference: "", title: "", account_id: "", customer_name: "", product_program: "",
  est_revenue: "0", est_volume: "", currency: "USD", bid_due_date: "", program_timing: "",
  strategic_rationale: "", capital_tooling: "", owner_name: "", status: "in_review", notes: "",
};

export function ReviewDialog({
  open, onOpenChange, review, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review?: BidReview | null;
  onSave: (row: Partial<BidReview> & { id?: string }) => void;
}) {
  const [f, setF] = useState<Draft>(empty);

  const { data: accounts } = useQuery({
    queryKey: ["accounts-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!open) return;
    setF(review
      ? {
          reference: review.reference ?? "", title: review.title, account_id: review.account_id ?? "",
          customer_name: review.customer_name ?? "", product_program: review.product_program ?? "",
          est_revenue: String(review.est_revenue ?? 0), est_volume: review.est_volume ?? "",
          currency: review.currency ?? "USD", bid_due_date: review.bid_due_date ?? "",
          program_timing: review.program_timing ?? "", strategic_rationale: review.strategic_rationale ?? "",
          capital_tooling: review.capital_tooling ?? "", owner_name: review.owner_name ?? "",
          status: review.status, notes: review.notes ?? "",
        }
      : empty);
  }, [open, review]);

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: review?.id,
      reference: f.reference || null,
      title: f.title,
      account_id: f.account_id || null,
      customer_name: f.customer_name || null,
      product_program: f.product_program || null,
      est_revenue: Number(f.est_revenue) || 0,
      est_volume: f.est_volume || null,
      currency: f.currency || "USD",
      bid_due_date: f.bid_due_date || null,
      program_timing: f.program_timing || null,
      strategic_rationale: f.strategic_rationale || null,
      capital_tooling: f.capital_tooling || null,
      owner_name: f.owner_name || null,
      status: f.status,
      notes: f.notes || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{review ? "Edit bid review" : "New bid review"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Reference</Label><Input value={f.reference} onChange={(e) => set("reference", e.target.value)} placeholder="BR-2026-001" /></div>
            <div className="col-span-2"><Label>Title *</Label><Input required value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Account</Label>
              <Select value={f.account_id} onValueChange={(v) => set("account_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
                <SelectContent>{(accounts ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Customer (if not an account)</Label><Input value={f.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></div>
          </div>
          <div><Label>Product / program</Label><Input value={f.product_program} onChange={(e) => set("product_program", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Estimated revenue</Label><Input type="number" step="0.01" value={f.est_revenue} onChange={(e) => set("est_revenue", e.target.value)} /></div>
            <div><Label>Currency</Label><Input value={f.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
            <div><Label>Estimated volume</Label><Input value={f.est_volume} onChange={(e) => set("est_volume", e.target.value)} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Bid due date</Label><Input type="date" value={f.bid_due_date} onChange={(e) => set("bid_due_date", e.target.value)} /></div>
            <div><Label>Program timing</Label><Input value={f.program_timing} onChange={(e) => set("program_timing", e.target.value)} placeholder="Award Q4, SOP Q3 next year" /></div>
          </div>
          <div><Label>Strategic rationale</Label><Textarea value={f.strategic_rationale} onChange={(e) => set("strategic_rationale", e.target.value)} /></div>
          <div><Label>Capital / tooling required</Label><Textarea value={f.capital_tooling} onChange={(e) => set("capital_tooling", e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Owner</Label><Input value={f.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REVIEW_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <DialogFooter><Button type="submit">{review ? "Save" : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
