import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect, ownerLabel, useProfiles } from "@/components/owner-select";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  COLUMN_TONE,
  STEP_STATUSES,
  STEP_STATUS_LABEL,
  STEP_STATUS_TONE,
  columnFor,
  defaultPctFor,
  moduleFor,
  type ProblemStep,
  type StepAction,
  type StepStatus,
} from "@/lib/problem-plan";

export function ProblemStepPanel({
  step,
  actions,
  onClose,
  onPatch,
  onDeleteStep,
  onCreateAction,
  onPatchAction,
  onDeleteAction,
}: {
  step: ProblemStep | null;
  actions: StepAction[];
  onClose: () => void;
  onPatch: (patch: Partial<ProblemStep>) => void;
  onDeleteStep: () => void;
  onCreateAction: (a: { title: string; owner_id: string | null; due_date: string | null }) => void;
  onPatchAction: (id: string, patch: Partial<StepAction>) => void;
  onDeleteAction: (id: string) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState<string | null>(null);
  const [newDue, setNewDue] = useState("");
  const { data: profiles = [] } = useProfiles();

  if (!step) return null;
  const mod = moduleFor(step.module_id);
  const col = columnFor(step.module_id);

  return (
    <Sheet open={!!step} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {step.label}
            {col && <Badge variant="secondary" className={COLUMN_TONE[col]}>{mod?.column}</Badge>}
          </SheetTitle>
          <SheetDescription>{step.why || mod?.blurb}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {mod?.to && (
            <Button asChild variant="outline" size="sm">
              <Link to={mod.to}>Open {mod.label} <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={step.status}
                onValueChange={(v) => onPatch({ status: v as StepStatus, progress_pct: defaultPctFor(v as StepStatus) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STEP_STATUSES.map((s) => <SelectItem key={s} value={s}>{STEP_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <OwnerSelect value={step.owner_id} onChange={(v) => onPatch({ owner_id: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={step.due_date ?? ""} onChange={(e) => onPatch({ due_date: e.target.value || null })} />
            </div>
            <div className="space-y-1.5">
              <Label>Progress — {step.progress_pct}%</Label>
              <Slider
                value={[step.progress_pct]}
                max={100}
                step={5}
                onValueCommit={(v) => onPatch({ progress_pct: v[0] })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={4}
              defaultValue={step.notes ?? ""}
              onBlur={(e) => onPatch({ notes: e.target.value || null })}
              placeholder="What has been done, what is blocking, next move…"
            />
          </div>

          <div className="space-y-2">
            <Label>Linked actions ({actions.length})</Label>
            <div className="space-y-1.5">
              {actions.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ownerLabel(profiles.find((p) => p.id === a.owner_id))}
                      {a.due_date ? ` · due ${a.due_date}` : ""}
                    </p>
                  </div>
                  <Select value={a.status} onValueChange={(v) => onPatchAction(a.id, { status: v as StepStatus })}>
                    <SelectTrigger className={`h-7 w-[130px] text-xs ${STEP_STATUS_TONE[a.status]}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STEP_STATUSES.map((s) => <SelectItem key={s} value={s}>{STEP_STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDeleteAction(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-md border border-dashed border-border p-2">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New action for this step…" />
              <div className="flex gap-2">
                <div className="flex-1"><OwnerSelect value={newOwner} onChange={setNewOwner} /></div>
                <Input type="date" className="w-[150px]" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
                <Button
                  size="icon"
                  disabled={!newTitle.trim()}
                  onClick={() => {
                    onCreateAction({ title: newTitle.trim(), owner_id: newOwner, due_date: newDue || null });
                    setNewTitle(""); setNewOwner(null); setNewDue("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button variant="ghost" className="text-destructive" onClick={onDeleteStep}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Remove this step
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
