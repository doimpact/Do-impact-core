import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ACTION_STATUSES,
  AP_LABEL,
  DETECTION_GUIDE,
  OCCURRENCE_GUIDE,
  SEVERITY_GUIDE,
  actionPriority,
  apClasses,
  rpn,
  type DraftRow,
} from "./pfmea-types";

type Editable = Omit<DraftRow, "tempId">;

function RatingSelect({
  label,
  value,
  guide,
  onChange,
}: {
  label: string;
  value: number | null;
  guide: Record<number, string>;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value ? String(value) : "none"} onValueChange={(v) => onChange(v === "none" ? null : Number(v))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="none">Not rated</SelectItem>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
            <SelectItem key={n} value={String(n)}>
              <span className="font-mono mr-2">{n}</span>
              <span className="text-xs text-muted-foreground">{guide[n]}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PfmeaRowDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Editable | null;
  onSave: (row: Editable) => void;
  saving?: boolean;
}) {
  const [row, setRow] = useState<Editable | null>(initial);
  useEffect(() => setRow(initial), [initial, open]);
  if (!row) return null;

  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setRow({ ...row, [k]: v });
  const ap = actionPriority(row.severity, row.occurrence, row.detection);
  const postAp = actionPriority(row.post_severity, row.post_occurrence, row.post_detection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PFMEA line</DialogTitle>
          <DialogDescription>Process step, failure mode, ratings and the action that reduces the risk.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Step no.</Label>
              <Input value={row.step_no ?? ""} onChange={(e) => set("step_no", e.target.value || null)} placeholder="10" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label className="text-xs">Process step *</Label>
              <Input value={row.step_name} onChange={(e) => set("step_name", e.target.value)} placeholder="CNC finish mill pocket profile" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Function / requirement</Label>
            <Textarea rows={2} value={row.function_req ?? ""} onChange={(e) => set("function_req", e.target.value || null)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Failure mode</Label>
              <Textarea rows={2} value={row.failure_mode ?? ""} onChange={(e) => set("failure_mode", e.target.value || null)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Effect of failure</Label>
              <Textarea rows={2} value={row.effect ?? ""} onChange={(e) => set("effect", e.target.value || null)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Cause</Label>
              <Textarea rows={2} value={row.cause ?? ""} onChange={(e) => set("cause", e.target.value || null)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Classification (CC / SC)</Label>
              <Select value={row.classification ?? "none"} onValueChange={(v) => set("classification", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="CC">CC — Critical characteristic</SelectItem>
                  <SelectItem value="SC">SC — Significant characteristic</SelectItem>
                  <SelectItem value="KC">KC — Key characteristic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Prevention control</Label>
              <Textarea rows={2} value={row.prevention_control ?? ""} onChange={(e) => set("prevention_control", e.target.value || null)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Detection control</Label>
              <Textarea rows={2} value={row.detection_control ?? ""} onChange={(e) => set("detection_control", e.target.value || null)} />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current rating</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={apClasses(ap)}>AP {ap ? AP_LABEL[ap] : "—"}</Badge>
                <Badge variant="outline">RPN {rpn(row.severity, row.occurrence, row.detection) ?? "—"}</Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RatingSelect label="Severity (S)" value={row.severity} guide={SEVERITY_GUIDE} onChange={(v) => set("severity", v)} />
              <RatingSelect label="Occurrence (O)" value={row.occurrence} guide={OCCURRENCE_GUIDE} onChange={(v) => set("occurrence", v)} />
              <RatingSelect label="Detection (D)" value={row.detection} guide={DETECTION_GUIDE} onChange={(v) => set("detection", v)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Recommended action</Label>
            <Textarea rows={2} value={row.action ?? ""} onChange={(e) => set("action", e.target.value || null)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Action status</Label>
              <Select value={row.action_status} onValueChange={(v) => set("action_status", v as Editable["action_status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={row.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} />
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">After the action</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={apClasses(postAp)}>AP {postAp ? AP_LABEL[postAp] : "—"}</Badge>
                <Badge variant="outline">RPN {rpn(row.post_severity, row.post_occurrence, row.post_detection) ?? "—"}</Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RatingSelect label="Severity (S)" value={row.post_severity} guide={SEVERITY_GUIDE} onChange={(v) => set("post_severity", v)} />
              <RatingSelect label="Occurrence (O)" value={row.post_occurrence} guide={OCCURRENCE_GUIDE} onChange={(v) => set("post_occurrence", v)} />
              <RatingSelect label="Detection (D)" value={row.post_detection} guide={DETECTION_GUIDE} onChange={(v) => set("post_detection", v)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!row.step_name.trim() || saving} onClick={() => onSave(row)}>
            {saving ? "Saving…" : "Save line"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
