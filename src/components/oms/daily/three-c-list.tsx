import { Button } from "@/components/ui/button";
import { ownerLabel } from "@/components/owner-select";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowUpCircle, Trash2, Plus, Repeat2, FileText, Clock, ShieldAlert, Archive, RotateCcw } from "lucide-react";
import type { DmLoopState } from "@/lib/oms.functions";
import type { Category, Escalation } from "./types";
import { LOOP_STATES, daysBetween } from "./types";

export function ThreeCList({
  escalations, profiles, categories = [], onEdit, onSave, onDelete, onNew, onEscalateA3, onEscalate8D, onArchive,
}: {
  escalations: Escalation[];
  profiles: { id: string; [k: string]: unknown }[];
  categories?: Category[];
  onEdit: (e: Escalation) => void;
  onSave: (v: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onEscalateA3: (e: Escalation) => void;
  onEscalate8D: (e: Escalation) => void;
  onArchive?: (e: Escalation, archived: boolean) => void;
}) {
  const catLabel = (key: string) => categories.find(c => c.key === key)?.label ?? key;
  const base = (e: Escalation) => ({
    id: e.id, boardId: e.board_id, category: e.category, occurredOn: e.occurred_on,
    concern: e.concern, cause: e.cause, countermeasure: e.countermeasure,
    ownerId: e.owner_id, dueDate: e.due_date, status: e.status, escalated: e.escalated,
  });


  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Open 3C — closed loop</h3>
          <p className="text-[11px] text-muted-foreground">
            Contain → Cause → Countermeasure → Standardised → Closed. Recurring concerns escalate to an A3.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onNew}><Plus className="mr-1 h-4 w-4" /> New 3C</Button>
      </div>

      {escalations.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          No open 3C on this board.
        </div>
      ) : (
        <div className="space-y-2">
          {escalations.map((e) => {
            const loop = LOOP_STATES.find(l => l.key === (e.loop_state ?? "contain"))!;
            const stepIdx = LOOP_STATES.findIndex(l => l.key === loop.key);
            const age = daysBetween(e.occurred_on);
            const recurring = (e.recurrence_count ?? 1) > 1;
            return (
              <div key={e.id} className={`rounded-lg border p-3 ${e.archived_at ? "bg-muted/40 opacity-75" : "bg-card"} ${recurring && !e.a3_report_id && !e.archived_at ? "border-amber-300" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">{catLabel(e.category)}</span>
                      <span>{e.occurred_on}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {age}d open</span>
                      {recurring && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">
                          <Repeat2 className="h-3 w-3" /> Recurring ×{e.recurrence_count}
                        </span>
                      )}
                      {e.a3_report_id && (
                        <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 font-medium text-violet-800">
                          <FileText className="h-3 w-3" /> A3 opened
                        </span>
                      )}
                      {e.due_date && <span>· Due {e.due_date}</span>}
                      {e.owner_id && <span>· Owner {ownerLabel(profiles.find(p => p.id === e.owner_id) as never)}</span>}
                    </div>

                    {/* loop tracker */}
                    <div className="mb-2 flex flex-wrap items-center gap-1">
                      {LOOP_STATES.map((s, i) => (
                        <button
                          key={s.key}
                          onClick={() => onSave({ ...base(e), loopState: s.key })}
                          title={`Move to ${s.label}`}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                            i <= stepIdx ? s.className : "bg-muted text-muted-foreground hover:bg-muted/70"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Concern</div>
                        <div>{e.concern}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Cause</div>
                        <div className="text-muted-foreground">{e.cause || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Countermeasure</div>
                        <div className="text-muted-foreground">{e.countermeasure || "—"}</div>
                      </div>
                    </div>

                    {recurring && !e.a3_report_id && (
                      <div className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                        Seen {e.recurrence_count} times in 90 days — containment is not holding. Escalate to a formal A3.
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => onEdit(e)}>Edit</Button>
                    <Button
                      size="sm"
                      variant={recurring && !e.a3_report_id ? "default" : "outline"}
                      onClick={() => onEscalateA3(e)}
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      {e.a3_report_id ? "View A3" : "To A3"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEscalate8D(e)}>
                      <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                      To 8D
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onSave({ ...base(e), escalated: !e.escalated })}>
                      <ArrowUpCircle className="mr-1 h-3.5 w-3.5" />
                      {e.escalated ? "Unflag" : "Flag"}
                    </Button>
                    {onArchive && (
                      <Button size="sm" variant="outline" onClick={() => onArchive(e, !e.archived_at)}>
                        {e.archived_at
                          ? <><RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore</>
                          : <><Archive className="mr-1 h-3.5 w-3.5" /> Archive</>}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LoopStateSelect({
  value, onChange,
}: {
  value: DmLoopState;
  onChange: (v: DmLoopState) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DmLoopState)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {LOOP_STATES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
