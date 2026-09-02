import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  EXCEPTION_STATUS, FUNCTIONS, ONGOING_DETERMINATIONS, ONGOING_TRIGGERS,
  REQUIREMENT_STATUS, RISK_CATEGORIES, RISK_STATUS, riskRating,
} from "@/lib/bid-contract-review";
import type { BidReviewItem } from "./use-bid-reviews";

export type ItemKind = "requirement" | "assumption_exception" | "risk" | "ongoing";

export const KIND_LABEL: Record<ItemKind, string> = {
  requirement: "Requirement",
  assumption_exception: "Assumption / exception",
  risk: "Contract risk",
  ongoing: "Ongoing review entry",
};

const STATUS_OPTIONS: Record<ItemKind, { value: string; label: string }[]> = {
  requirement: REQUIREMENT_STATUS,
  assumption_exception: EXCEPTION_STATUS,
  risk: RISK_STATUS,
  ongoing: [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In progress" },
    { value: "closed", label: "Closed" },
  ],
};

export function statusLabel(kind: string, value: string) {
  const list = STATUS_OPTIONS[kind as ItemKind] ?? [];
  return list.find((s) => s.value === value)?.label ?? value;
}

type Draft = {
  ref: string; title: string; detail: string; owner_name: string; status: string;
  due_date: string; probability: string; impact: string; data: Record<string, any>;
};

const empty = (kind: ItemKind): Draft => ({
  ref: "", title: "", detail: "", owner_name: "",
  status: STATUS_OPTIONS[kind][0].value, due_date: "", probability: "3", impact: "3", data: {},
});

export function ItemDialog({
  open, onOpenChange, kind, reviewId, item, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: ItemKind;
  reviewId: string;
  item?: BidReviewItem | null;
  onSave: (row: Partial<BidReviewItem> & { id?: string }) => void;
}) {
  const [f, setF] = useState<Draft>(empty(kind));

  useEffect(() => {
    if (!open) return;
    setF(item
      ? {
          ref: item.ref ?? "", title: item.title, detail: item.detail ?? "", owner_name: item.owner_name ?? "",
          status: item.status, due_date: item.due_date ?? "",
          probability: String(item.probability ?? 3), impact: String(item.impact ?? 3), data: item.data ?? {},
        }
      : empty(kind));
  }, [open, item, kind]);

  const set = (k: keyof Draft, v: any) => setF((p) => ({ ...p, [k]: v }));
  const setData = (k: string, v: any) => setF((p) => ({ ...p, data: { ...p.data, [k]: v } }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    onSave({
      id: item?.id,
      review_id: reviewId,
      kind,
      ref: f.ref || null,
      title: f.title,
      detail: f.detail || null,
      owner_name: f.owner_name || null,
      status: f.status,
      due_date: f.due_date || null,
      probability: kind === "risk" ? Number(f.probability) : null,
      impact: kind === "risk" ? Number(f.impact) : null,
      data: f.data,
    });
    onOpenChange(false);
  }

  const rating = riskRating(Number(f.probability), Number(f.impact));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{item ? "Edit" : "Add"} {KIND_LABEL[kind].toLowerCase()}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Reference</Label><Input value={f.ref} onChange={(e) => set("ref", e.target.value)} placeholder="REQ-001" /></div>
            <div className="col-span-2"><Label>Title *</Label><Input required value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          </div>
          <div><Label>Detail</Label><Textarea value={f.detail} onChange={(e) => set("detail", e.target.value)} /></div>

          {kind === "requirement" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Source document</Label><Input value={f.data.source ?? ""} onChange={(e) => setData("source", e.target.value)} /></div>
              <div>
                <Label>Responsible function</Label>
                <Select value={f.data.function ?? ""} onValueChange={(v) => setData("function", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FUNCTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cost impact</Label><Input value={f.data.cost_impact ?? ""} onChange={(e) => setData("cost_impact", e.target.value)} /></div>
              <div><Label>Schedule impact</Label><Input value={f.data.schedule_impact ?? ""} onChange={(e) => setData("schedule_impact", e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>Disposition</Label><Input value={f.data.disposition ?? ""} onChange={(e) => setData("disposition", e.target.value)} /></div>
            </div>
          )}

          {kind === "assumption_exception" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Company concern</Label><Textarea value={f.data.company_concern ?? ""} onChange={(e) => setData("company_concern", e.target.value)} /></div>
              <div><Label>Business impact</Label><Input value={f.data.business_impact ?? ""} onChange={(e) => setData("business_impact", e.target.value)} /></div>
              <div><Label>Approval required</Label><Input value={f.data.approval_required ?? ""} onChange={(e) => setData("approval_required", e.target.value)} placeholder="CFO" /></div>
              <div><Label>Proposed position</Label><Textarea value={f.data.proposed_position ?? ""} onChange={(e) => setData("proposed_position", e.target.value)} /></div>
              <div><Label>Fallback position</Label><Textarea value={f.data.fallback ?? ""} onChange={(e) => setData("fallback", e.target.value)} /></div>
            </div>
          )}

          {kind === "risk" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={f.data.category ?? ""} onValueChange={(v) => setData("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{RISK_CATEGORIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Probability (1-5)</Label><Input type="number" min={1} max={5} value={f.probability} onChange={(e) => set("probability", e.target.value)} /></div>
                <div><Label>Impact (1-5)</Label><Input type="number" min={1} max={5} value={f.impact} onChange={(e) => set("impact", e.target.value)} /></div>
              </div>
              <div className="sm:col-span-2 text-xs text-muted-foreground">Rating: <strong className="text-foreground">{rating.label}</strong> ({rating.score})</div>
              <div className="sm:col-span-2"><Label>Mitigation</Label><Textarea value={f.data.mitigation ?? ""} onChange={(e) => setData("mitigation", e.target.value)} /></div>
              <div><Label>Residual risk</Label><Input value={f.data.residual ?? ""} onChange={(e) => setData("residual", e.target.value)} /></div>
              <div><Label>Management approval</Label><Input value={f.data.management_approval ?? ""} onChange={(e) => setData("management_approval", e.target.value)} /></div>
            </div>
          )}

          {kind === "ongoing" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Change trigger</Label>
                <Select value={f.data.trigger ?? ""} onValueChange={(v) => setData("trigger", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ONGOING_TRIGGERS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Determination</Label>
                <Select value={f.data.determination ?? ""} onValueChange={(v) => setData("determination", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ONGOING_DETERMINATIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Outcome</Label><Textarea value={f.data.outcome ?? ""} onChange={(e) => setData("outcome", e.target.value)} /></div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Owner</Label><Input value={f.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS[kind].map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due</Label><Input type="date" value={f.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
          </div>

          <DialogFooter><Button type="submit">{item ? "Save" : "Add"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
