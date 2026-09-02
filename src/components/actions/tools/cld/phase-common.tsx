import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OwnerSelect } from "@/components/owner-select";
import type { CldPhases, PhaseDef, PhaseMeta, PhaseStatus } from "@/lib/problem-tools";

export type PhaseProps = {
  phases: CldPhases;
  patch: (p: Partial<CldPhases>) => void;
};

export const STATUS_LABEL: Record<PhaseStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Complete",
};

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function PhaseHeader({
  def,
  phases,
  patch,
  children,
}: PhaseProps & { def: PhaseDef; children?: ReactNode }) {
  const meta: PhaseMeta = phases.meta?.[def.key] ?? {};
  const setMeta = (m: Partial<PhaseMeta>) =>
    patch({ meta: { ...(phases.meta ?? {}), [def.key]: { ...meta, ...m } } });

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Phase {def.index} — {def.name}
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">{def.intent}</p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Timeline: {def.timeline}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <OwnerSelect value={meta.owner_id ?? null} onChange={(v) => setMeta({ owner_id: v })} placeholder="Phase owner" />
          <Select value={meta.status ?? "not_started"} onValueChange={(v) => setMeta({ status: v as PhaseStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as PhaseStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={meta.start_date ?? ""} onChange={(e) => setMeta({ start_date: e.target.value || null })} />
          <Input type="date" value={meta.due_date ?? ""} onChange={(e) => setMeta({ due_date: e.target.value || null })} />
        </div>

        <Textarea
          rows={2}
          placeholder="Phase notes — what happened, what is blocked?"
          defaultValue={meta.notes ?? ""}
          onBlur={(e) => setMeta({ notes: e.target.value || null })}
        />

        {children}
      </CardContent>
    </Card>
  );
}

export function SectionCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
