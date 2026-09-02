import { useState } from "react";
import { Plus, Trash2, Siren, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACTIVATION_LEVELS,
  EXERCISE_FIELDS,
  EXERCISE_TYPES,
  INCIDENT_FIELDS,
  activationMeta,
  type BcmAction,
  type BcmExercise,
  type BcmIncident,
} from "@/lib/bcm";
import { RecordDialog, normalise } from "./record-dialog";
import { ActionList } from "./action-list";
import { useCreateBcm, useDeleteBcm, useUpdateBcm } from "./use-bcm";

const ACTIVATION_CHECKLIST = [
  "Protect employees and visitors",
  "Contact emergency services if required",
  "Stop unsafe operations",
  "Account for employees",
  "Stabilize immediate hazards",
  "Notify the site leader",
  "Determine the activation level",
  "Establish the incident commander",
  "Assemble the appropriate team",
  "Establish communications",
  "Assess facility, equipment, IT, employees, suppliers and customers",
  "Identify critical operations and recovery priorities",
  "Implement the continuity strategy",
  "Communicate status and document decisions",
  "Establish the next review time",
];

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

export function IncidentsPanel({
  incidents,
  exercises,
  actions,
}: {
  incidents: BcmIncident[];
  exercises: BcmExercise[];
  actions: BcmAction[];
}) {
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [editIncident, setEditIncident] = useState<BcmIncident | null>(null);
  const [editExercise, setEditExercise] = useState<BcmExercise | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const createI = useCreateBcm("bcm_incidents");
  const updateI = useUpdateBcm("bcm_incidents");
  const delI = useDeleteBcm("bcm_incidents");
  const createE = useCreateBcm("bcm_exercises");
  const updateE = useUpdateBcm("bcm_exercises");
  const delE = useDeleteBcm("bcm_exercises");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Siren className="h-4 w-4" /> Activation log
            </h3>
            <p className="text-sm text-muted-foreground">
              Every activation records impacts, decisions, recovery and lessons learned.
            </p>
          </div>
          <Button className="no-print" onClick={() => { setEditIncident(null); setIncidentOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Log an activation
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activation levels</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {ACTIVATION_LEVELS.map((l) => (
              <div key={l.n} className="rounded-md border bg-background p-2">
                <Badge className={cn("text-[11px]", l.className)}>{l.label}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">{l.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {incidents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No activations logged. That is good news — keep the checklist ready anyway.
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.map((i) => {
              const meta = activationMeta(i.activation_level);
              const isOpen = expanded === i.id;
              return (
                <div key={i.id} className="rounded-lg border">
                  <div className="flex flex-wrap items-center gap-3 p-3">
                    <Badge className={meta.className}>L{i.activation_level}</Badge>
                    <button className="flex-1 text-left font-medium hover:underline" onClick={() => setExpanded(isOpen ? null : i.id)}>
                      {i.title}
                    </button>
                    <span className="text-xs text-muted-foreground">{new Date(i.occurred_at).toLocaleString()}</span>
                    {i.incident_commander && <span className="text-xs text-muted-foreground">IC: {i.incident_commander}</span>}
                    {i.recovery_hours !== null && (
                      <Badge variant="outline" className="text-[11px]">Recovered in {i.recovery_hours} h</Badge>
                    )}
                    <Badge variant="secondary" className="text-[11px]">{i.status}</Badge>
                    <Button size="sm" variant="outline" className="no-print" onClick={() => { setEditIncident(i); setIncidentOpen(true); }}>
                      Edit
                    </Button>
                    <Button size="icon" variant="ghost" className="no-print h-8 w-8" onClick={() => delI.mutate(i.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {isOpen && (
                    <div className="space-y-3 border-t p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Description" value={i.description} />
                        <Field label="Safety impact" value={i.safety_impact} />
                        <Field label="Facility impact" value={i.facility_impact} />
                        <Field label="Equipment impact" value={i.equipment_impact} />
                        <Field label="IT impact" value={i.it_impact} />
                        <Field label="Production impact" value={i.production_impact} />
                        <Field label="Supply chain impact" value={i.supply_chain_impact} />
                        <Field label="Customer impact" value={i.customer_impact} />
                        <Field label="Immediate actions" value={i.immediate_actions} />
                        <Field label="Decisions" value={i.decisions} />
                        <Field label="Communications" value={i.communications} />
                        <Field label="Recovery actions" value={i.recovery_actions} />
                        <Field label="Final resolution" value={i.final_resolution} />
                        <Field label="Lessons learned" value={i.lessons_learned} />
                      </div>
                      <ActionList actions={actions} sourceKind="incident" sourceId={i.id} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
          <div className="text-sm font-semibold">Activation checklist</div>
          <ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            {ACTIVATION_CHECKLIST.map((c) => (
              <li key={c}>☐ {c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FlaskConical className="h-4 w-4" /> Exercises
            </h3>
            <p className="text-sm text-muted-foreground">
              A recovery plan that has never been tested is an untested assumption.
            </p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => { setEditExercise(null); setExerciseOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Record an exercise
          </Button>
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No exercises recorded. Start with a 60-minute tabletop: “Power fails at 2:00 PM.”
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((e) => (
              <div key={e.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline">{EXERCISE_TYPES.find((t) => t.key === e.exercise_type)?.label ?? e.exercise_type}</Badge>
                  <button className="flex-1 text-left font-medium hover:underline" onClick={() => { setEditExercise(e); setExerciseOpen(true); }}>
                    {e.title}
                  </button>
                  <span className="text-xs text-muted-foreground">{e.exercise_date}</span>
                  <Button size="icon" variant="ghost" className="no-print h-8 w-8" onClick={() => delE.mutate(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Field label="Scenario" value={e.scenario} />
                  <Field label="What worked" value={e.what_worked} />
                  <Field label="What failed" value={e.what_failed} />
                  <Field label="Lessons learned" value={e.lessons_learned} />
                </div>
                <div className="mt-3 border-t pt-3">
                  <ActionList actions={actions} sourceKind="exercise" sourceId={e.id} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <RecordDialog
        open={incidentOpen}
        onOpenChange={setIncidentOpen}
        title={editIncident ? "Edit activation" : "Log an activation"}
        description="Incident and decision log for a business continuity event."
        fields={INCIDENT_FIELDS}
        initial={
          editIncident
            ? ({ ...editIncident } as Record<string, unknown>)
            : { activation_level: 1, status: "open", occurred_at: new Date().toISOString() }
        }
        onSubmit={async (v) => {
          const patch = normalise(INCIDENT_FIELDS, v);
          if (patch.occurred_at) patch.occurred_at = new Date(String(patch.occurred_at)).toISOString();
          if (editIncident) await updateI.mutateAsync({ id: editIncident.id, patch });
          else await createI.mutateAsync(patch);
        }}
      />

      <RecordDialog
        open={exerciseOpen}
        onOpenChange={setExerciseOpen}
        title={editExercise ? "Edit exercise" : "Record an exercise"}
        fields={EXERCISE_FIELDS}
        initial={
          editExercise
            ? ({ ...editExercise } as Record<string, unknown>)
            : { exercise_type: "tabletop", exercise_date: new Date().toISOString().slice(0, 10) }
        }
        onSubmit={async (v) => {
          const patch = normalise(EXERCISE_FIELDS, v);
          if (editExercise) await updateE.mutateAsync({ id: editExercise.id, patch });
          else await createE.mutateAsync(patch);
        }}
      />
    </div>
  );
}
