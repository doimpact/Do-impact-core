import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Plus, Square, X } from "lucide-react";

export type Milestone = { title: string; due_date?: string | null; done?: boolean };

export function MilestonesEditor({
  value,
  onChange,
  label = "Milestones",
}: {
  value: Milestone[];
  onChange: (next: Milestone[]) => void;
  label?: string;
}) {
  const update = (idx: number, patch: Partial<Milestone>) =>
    onChange(value.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  const add = () => onChange([...value, { title: "", due_date: null, done: false }]);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium">{label}</label>
        <Button size="sm" variant="outline" type="button" onClick={add}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {value.length === 0 && (
          <div className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
            No milestones yet.
          </div>
        )}
        {value.map((m, idx) => (
          <div key={idx} className="grid grid-cols-[auto_1fr_160px_auto] items-center gap-2 rounded border p-2">
            <button
              type="button"
              onClick={() => update(idx, { done: !m.done })}
              className="text-muted-foreground hover:text-foreground"
            >
              {m.done ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
            </button>
            <Input
              placeholder="Milestone title"
              value={m.title}
              onChange={(e) => update(idx, { title: e.target.value })}
            />
            <Input
              type="date"
              value={m.due_date ?? ""}
              onChange={(e) => update(idx, { due_date: e.target.value || null })}
            />
            <Button size="icon" variant="ghost" type="button" className="h-7 w-7" onClick={() => remove(idx)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
