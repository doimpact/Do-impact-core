import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyAccess } from "@/hooks/use-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, Factory, Gauge, Pencil, Plane, Plus, Trash2, CalendarRange } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PulseLog } from "@/components/oms/cpp/pulse-log";
import { TaskBoard } from "@/components/oms/cpp/task-board";
import { BurnDown } from "@/components/oms/cpp/burn-down";
import { BlockerLog } from "@/components/oms/cpp/blocker-log";
import { HandoverPanel } from "@/components/oms/cpp/handover-panel";
import { daysUntil, errMsg, type CppVisit } from "@/components/oms/cpp/types";

export const Route = createFileRoute("/_authenticated/oms/critical-path")({
  head: () => ({
    meta: [
      { title: "Critical Path Pulse — DO.Impact" },
      {
        name: "description",
        content:
          "Bay-side short interval control for aircraft maintenance visits: critical path red-tagging, burn-down rate, dockside escalation clocks and structured shift handover.",
      },
      { property: "og:title", content: "Critical Path Pulse — DO.Impact" },
      {
        property: "og:description",
        content: "Control the aircraft critical path hour by hour: pulse checks, red tags, burn-down and handover.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriticalPathPulse,
});

const db = supabase as unknown as { from: (t: string) => any };

const emptyVisit = {
  aircraft_reg: "",
  aircraft_type: "",
  check_type: "",
  bay: "",
  induction_date: new Date().toISOString().slice(0, 10),
  planned_redelivery: "",
  total_planned_hours: 0,
  status: "in_work",
  notes: "",
};

function useVisits(showArchived: boolean) {
  return useQuery({
    queryKey: ["cpp_visits", showArchived],
    queryFn: async () => {
      let q = db.from("cpp_visits").select("*").order("induction_date", { ascending: false });
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CppVisit[];
    },
  });
}

function CriticalPathPulse() {
  const access = useMyAccess();
  const readOnly = access.level === "read";
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const visitsQ = useVisits(showArchived);
  const visits = visitsQ.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; visit?: CppVisit } | null>(null);
  const [form, setForm] = useState(emptyVisit);

  useEffect(() => {
    if (!selectedId && visits.length) setSelectedId(visits[0].id);
    if (selectedId && !visits.some((v) => v.id === selectedId)) setSelectedId(visits[0]?.id ?? null);
  }, [visits, selectedId]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cpp_visits"] });

  const saveVisit = useMutation({
    mutationFn: async () => {
      const payload = {
        aircraft_reg: form.aircraft_reg.trim(),
        aircraft_type: form.aircraft_type || null,
        check_type: form.check_type || null,
        bay: form.bay || null,
        induction_date: form.induction_date || null,
        planned_redelivery: form.planned_redelivery || null,
        total_planned_hours: Number(form.total_planned_hours) || 0,
        status: form.status,
        notes: form.notes || null,
      };
      if (!payload.aircraft_reg) throw new Error("Aircraft registration is required.");
      if (dialog?.mode === "edit" && dialog.visit) {
        const { error } = await db.from("cpp_visits").update(payload).eq("id", dialog.visit.id);
        if (error) throw error;
        return dialog.visit.id;
      }
      const { data, error } = await db.from("cpp_visits").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      invalidate();
      setSelectedId(id);
      setDialog(null);
      toast.success("Saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const setArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await db
        .from("cpp_visits")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const removeVisit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("cpp_visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success("Deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const openCreate = () => {
    setForm(emptyVisit);
    setDialog({ mode: "create" });
  };
  const openEdit = (v: CppVisit) => {
    setForm({
      aircraft_reg: v.aircraft_reg,
      aircraft_type: v.aircraft_type ?? "",
      check_type: v.check_type ?? "",
      bay: v.bay ?? "",
      induction_date: v.induction_date ?? "",
      planned_redelivery: v.planned_redelivery ?? "",
      total_planned_hours: v.total_planned_hours,
      status: v.status,
      notes: v.notes ?? "",
    });
    setDialog({ mode: "edit", visit: v });
  };

  const visit = visits.find((v) => v.id === selectedId) ?? null;
  const toGo = visit ? daysUntil(visit.planned_redelivery) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Plane className="h-7 w-7" /> Critical Path Pulse
          </h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Control an aircraft visit at the bay, not from a monthly report. Bi-hourly pulse checks, dynamic red-tagging
            of the critical path, dual burn-down rate, dockside escalation clocks and a structured handover at the board.
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> New visit
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/oms/shopfloor" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Factory className="mr-1 inline h-3.5 w-3.5" /> Pull system
        </Link>
        <Link to="/oms/sic" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Gauge className="mr-1 inline h-3.5 w-3.5" /> SIC boards
        </Link>
        <Link to="/oms/scheduling" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <CalendarRange className="mr-1 inline h-3.5 w-3.5" /> Scheduling (0–12wk)
        </Link>
        <span className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          Critical Path Pulse
        </span>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          Show archived
        </label>
      </div>

      {visits.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center">
          <Plane className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No aircraft visits yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create a visit to start pulsing the critical path: induct the aircraft, load the task cards, and flag the
            sequence that drives the redelivery date.
          </p>
          {!readOnly && (
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> New visit
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
            <div className="min-w-56">
              <Label className="text-xs">Aircraft visit</Label>
              <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {visits.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.aircraft_reg}
                      {v.check_type ? ` · ${v.check_type}` : ""}
                      {v.archived_at ? " (archived)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {visit && (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {visit.aircraft_type && <Badge variant="outline">{visit.aircraft_type}</Badge>}
                  {visit.bay && <Badge variant="secondary">Bay {visit.bay}</Badge>}
                  <Badge variant="outline">{visit.total_planned_hours} planned h</Badge>
                  {toGo !== null && (
                    <Badge variant={toGo < 0 ? "destructive" : "secondary"}>
                      {toGo >= 0 ? `${toGo} days to redelivery` : `${Math.abs(toGo)} days overdue`}
                    </Badge>
                  )}
                </div>
                {!readOnly && (
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(visit)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setArchived.mutate({ id: visit.id, archived: !visit.archived_at })}
                    >
                      <Archive className="mr-1 h-3.5 w-3.5" /> {visit.archived_at ? "Restore" : "Archive"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeVisit.mutate(visit.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {visit && (
            <div className="space-y-6">
              <PulseLog visit={visit} readOnly={readOnly} />
              <TaskBoard visit={visit} readOnly={readOnly} />
              <BurnDown visit={visit} />
              <BlockerLog visit={visit} readOnly={readOnly} />
              <HandoverPanel visit={visit} readOnly={readOnly} />
            </div>
          )}
        </>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? "Edit visit" : "New aircraft visit"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Aircraft registration">
              <Input value={form.aircraft_reg} onChange={(e) => setForm({ ...form, aircraft_reg: e.target.value })} />
            </Field>
            <Field label="Aircraft type">
              <Input value={form.aircraft_type} onChange={(e) => setForm({ ...form, aircraft_type: e.target.value })} />
            </Field>
            <Field label="Check type">
              <Input value={form.check_type} onChange={(e) => setForm({ ...form, check_type: e.target.value })} />
            </Field>
            <Field label="Bay">
              <Input value={form.bay} onChange={(e) => setForm({ ...form, bay: e.target.value })} />
            </Field>
            <Field label="Induction date">
              <Input type="date" value={form.induction_date} onChange={(e) => setForm({ ...form, induction_date: e.target.value })} />
            </Field>
            <Field label="Planned redelivery">
              <Input type="date" value={form.planned_redelivery} onChange={(e) => setForm({ ...form, planned_redelivery: e.target.value })} />
            </Field>
            <Field label="Total planned hours">
              <Input
                type="number"
                value={form.total_planned_hours}
                onChange={(e) => setForm({ ...form, total_planned_hours: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_work">In work</SelectItem>
                  <SelectItem value="redelivered">Redelivered</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={() => saveVisit.mutate()} disabled={saveVisit.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
