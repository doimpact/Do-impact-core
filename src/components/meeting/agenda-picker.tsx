import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  GROUP_LABEL,
  MEETING_STEPS,
  mergeLaterSteps,
  missingLaterSteps,
  stepById,
  type MeetingGroup,
  type MeetingStepId,
} from "@/lib/meeting-agenda";
import type { MeetingPreset } from "@/hooks/use-user-preferences";

export function AgendaPicker({
  open,
  onOpenChange,
  selected,
  onSelectedChange,
  onResetToDefault,
  presets,
  onSavePreset,
  onUpdatePreset,
  onRenamePreset,
  onDeletePreset,
  hiddenKeys,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: MeetingStepId[];
  onSelectedChange: (next: MeetingStepId[]) => void;
  onResetToDefault?: () => void;
  presets: MeetingPreset[];
  onSavePreset: (name: string, steps: MeetingStepId[]) => void;
  onUpdatePreset: (id: string, steps: MeetingStepId[]) => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  hiddenKeys: string[];
}) {
  const [presetName, setPresetName] = useState("");
  const [activePreset, setActivePreset] = useState<string>("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const hidden = useMemo(() => new Set(hiddenKeys), [hiddenKeys]);
  const set = useMemo(() => new Set(selected), [selected]);

  const groups = useMemo(() => {
    const map = new Map<MeetingGroup, typeof MEETING_STEPS>();
    for (const s of MEETING_STEPS) {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return [...map.entries()];
  }, []);

  const toggle = (id: MeetingStepId, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    onSelectedChange([...next]);
  };

  const setGroup = (group: MeetingGroup, on: boolean) => {
    const next = new Set(set);
    for (const s of MEETING_STEPS) {
      if (s.group !== group || s.pinned) continue;
      if (on) next.add(s.id);
      else next.delete(s.id);
    }
    onSelectedChange([...next]);
  };

  const applyPreset = (id: string) => {
    setActivePreset(id);
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    // A preset saved before a step existed cannot have an opinion about it, so
    // merge those steps in rather than treating them as deselected.
    const added = missingLaterSteps(p.steps, hiddenKeys);
    onSelectedChange(mergeLaterSteps(p.steps, hiddenKeys));
    if (added.length) {
      const labels = added.map((a) => stepById(a)?.label ?? a).join(", ");
      toast.info(`Added new step${added.length > 1 ? "s" : ""} to this preset: ${labels}`);
    }
  };

  const count = MEETING_STEPS.filter((s) => s.pinned || set.has(s.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize the agenda</DialogTitle>
          <DialogDescription>
            Pick the modules to walk through this week. Safety check-in and Wrap-up are always included. Save a selection as a preset to reuse it next week.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3">
          <span className="text-sm font-medium">{count} steps in the flow</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onSelectedChange(MEETING_STEPS.map((s) => s.id))}>Select all</Button>
            <Button size="sm" variant="outline" onClick={() => onSelectedChange(MEETING_STEPS.filter((s) => s.pinned).map((s) => s.id))}>Clear all</Button>
            {onResetToDefault && (
              <Button size="sm" variant="outline" onClick={onResetToDefault}>Reset to default</Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(([group, steps]) => (
            <div key={group} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">{GROUP_LABEL[group]}</Badge>
                {steps.some((s) => !s.pinned) && (
                  <div className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setGroup(group, true)}>All</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setGroup(group, false)}>None</Button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                {steps.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      disabled={s.pinned}
                      checked={s.pinned || set.has(s.id)}
                      onCheckedChange={(v) => toggle(s.id, v === true)}
                    />
                    <span className={s.pinned ? "text-muted-foreground" : ""}>
                      {s.label}
                      {s.pinned && <span className="ml-1 text-xs text-muted-foreground">(always on)</span>}
                      {!s.pinned && s.navKey && hidden.has(s.navKey) && (
                        <span className="ml-1 text-xs text-amber-600">off in Settings</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="text-sm font-semibold">Presets</div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={activePreset} onValueChange={applyPreset}>
              <SelectTrigger className="w-56"><SelectValue placeholder={presets.length ? "Load a preset…" : "No presets saved"} /></SelectTrigger>
              <SelectContent>
                {presets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {activePreset && (
              <>
                <Button size="sm" variant="outline" onClick={() => onUpdatePreset(activePreset, [...set])}>
                  <Save className="mr-1 h-3.5 w-3.5" /> Update
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setRenaming(activePreset); setRenameValue(presets.find((p) => p.id === activePreset)?.name ?? ""); }}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Rename
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { onDeletePreset(activePreset); setActivePreset(""); }}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </>
            )}
          </div>

          {renaming && (
            <div className="flex items-center gap-2">
              <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Preset name" />
              <Button size="sm" onClick={() => { onRenamePreset(renaming, renameValue); setRenaming(null); }}>
                <Check className="mr-1 h-3.5 w-3.5" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Name this agenda, e.g. Monday SLT" />
            <Button
              size="sm"
              disabled={!presetName.trim()}
              onClick={() => { onSavePreset(presetName.trim(), [...set]); setPresetName(""); }}
            >
              Save as preset
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
