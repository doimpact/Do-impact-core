import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { OwnerSelect } from "@/components/owner-select";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import {
  COLUMN_TONE,
  MODULES_BY_COLUMN,
  PROBLEMS,
  moduleFor,
} from "@/lib/problem-plan";
import type { NewPlanInput } from "@/hooks/use-problem-plans";

type SelectedStep = { module_id: string; why: string | null };

export function ProblemPlanDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: NewPlanInput) => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [preset, setPreset] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedStep[]>([]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.module_id)), [selected]);

  function reset() {
    setTitle(""); setStatement(""); setOwnerId(null); setTargetDate(""); setPreset(null); setSelected([]);
  }

  function applyPreset(id: string | null) {
    setPreset(id);
    if (!id) { setSelected([]); return; }
    const p = PROBLEMS.find((x) => x.id === id);
    if (!p) return;
    setSelected(p.flow.map((f) => ({ module_id: f.id, why: f.why })));
    if (!title.trim()) setTitle(p.title);
    if (!statement.trim()) setStatement(p.statement);
  }

  function toggle(moduleId: string) {
    setSelected((prev) =>
      prev.some((s) => s.module_id === moduleId)
        ? prev.filter((s) => s.module_id !== moduleId)
        : [...prev, { module_id: moduleId, why: null }],
    );
  }

  function move(i: number, dir: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const canSave = title.trim().length > 0 && selected.length > 0 && !submitting;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Define a problem</DialogTitle>
          <DialogDescription>
            Describe the problem, then select which sub-processes should be involved. The selection becomes your process flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Problem title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Late deliveries on the 737 programme" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Problem statement</Label>
              <Textarea rows={3} value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="What is happening, where, since when, and what is the impact?" />
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <OwnerSelect value={ownerId} onChange={setOwnerId} />
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Start from a framework problem (optional)</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={preset === null ? "default" : "outline"} onClick={() => applyPreset(null)}>
                Blank
              </Button>
              {PROBLEMS.map((p) => (
                <Button key={p.id} type="button" size="sm" variant={preset === p.id ? "default" : "outline"} onClick={() => applyPreset(p.id)}>
                  {p.index}. {p.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              <Label>Sub-processes to involve</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODULES_BY_COLUMN.map((col) => (
                  <div key={col.key} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className={COLUMN_TONE[col.key]} variant="secondary">{col.label}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {col.modules.map((m) => (
                        <label key={m.id} className="flex cursor-pointer items-start gap-2 text-sm">
                          <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggle(m.id)} className="mt-0.5" />
                          <span>{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Process flow ({selected.length})</Label>
              <div className="rounded-lg border border-border p-2">
                {selected.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">Pick the sub-processes on the left — the order here is the order of the flow.</p>
                )}
                <ol className="space-y-1">
                  {selected.map((s, i) => {
                    const m = moduleFor(s.module_id);
                    return (
                      <li key={s.module_id} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold">{i + 1}</span>
                        <span className="flex-1 truncate">{m?.label ?? s.module_id}</span>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggle(s.module_id)}><X className="h-3.5 w-3.5" /></Button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                statement: statement.trim() || null,
                owner_id: ownerId,
                target_date: targetDate || null,
                source_problem_id: preset,
                steps: selected.map((s) => ({
                  module_id: s.module_id,
                  label: moduleFor(s.module_id)?.label ?? s.module_id,
                  why: s.why ?? moduleFor(s.module_id)?.blurb ?? null,
                })),
              })
            }
          >
            {submitting ? "Creating…" : "Create process flow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
