import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";
import {
  type ApsWorkCenter,
  type ApsWorkOrder,
  type ApsDowntime,
  type ApsTooling,
  weeklyCapacityHours,
  workOrderHours,
  weekOffset,
} from "@/lib/aps";

type Props = {
  companyId: string;
  valueStreamId: string;
  workCenters: ApsWorkCenter[];
  orders: ApsWorkOrder[];
  tooling: ApsTooling[];
};

const emptyWc = {
  name: "",
  code: "",
  capacity_hours_per_shift: 8,
  shifts_per_day: 2,
  days_per_week: 5,
  efficiency_pct: 85,
  staging_slots: 6,
  notes: "",
};

export function CapacityPanel({ companyId, valueStreamId, workCenters, orders, tooling }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApsWorkCenter | null>(null);
  const [form, setForm] = useState({ ...emptyWc });
  const [showArchived, setShowArchived] = useState(false);

  const downtimeQ = useQuery({
    queryKey: ["aps-downtime", valueStreamId],
    queryFn: async () => {
      const ids = workCenters.map((w) => w.id);
      if (!ids.length) return [] as ApsDowntime[];
      const { data, error } = await supabase.from("aps_downtime").select("*").in("work_center_id", ids).order("start_date");
      if (error) throw error;
      return (data ?? []) as ApsDowntime[];
    },
    enabled: workCenters.length > 0,
  });
  const downtime = downtimeQ.data ?? [];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["aps-work-centers"] });
    void qc.invalidateQueries({ queryKey: ["aps-downtime"] });
  };

  const save = useMutation({
    mutationFn: async (v: typeof emptyWc & { id?: string }) => {
      if (!v.name.trim()) throw new Error("Give the work center a name.");
      const payload = {
        name: v.name.trim(),
        code: v.code.trim() || null,
        capacity_hours_per_shift: Number(v.capacity_hours_per_shift),
        shifts_per_day: Number(v.shifts_per_day),
        days_per_week: Number(v.days_per_week),
        efficiency_pct: Number(v.efficiency_pct),
        staging_slots: Number(v.staging_slots),
        notes: v.notes.trim() || null,
      };
      if (v.id) {
        const { data, error } = await supabase.from("aps_work_centers").update(payload).eq("id", v.id).select("id");
        if (error) throw error;
        assertWrote(data, "edit");
        return;
      }
      const { error } = await supabase.from("aps_work_centers").insert({
        ...payload,
        company_id: companyId,
        value_stream_id: valueStreamId,
        sort_order: workCenters.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editing ? "Work center updated" : "Work center added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setArchived = useMutation({
    mutationFn: async (v: { id: string; archived: boolean }) => {
      const { data, error } = await supabase
        .from("aps_work_centers")
        .update({ archived_at: v.archived ? new Date().toISOString() : null })
        .eq("id", v.id)
        .select("id");
      if (error) throw error;
      assertWrote(data, v.archived ? "archive" : "restore");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Work center updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("aps_work_centers").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Work center deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addDowntime = useMutation({
    mutationFn: async (v: { work_center_id: string; start_date: string; end_date: string; hours: number; planned: boolean; reason: string }) => {
      const { error } = await supabase.from("aps_downtime").insert({ ...v, company_id: companyId });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Downtime logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDowntime = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("aps_downtime").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Downtime removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = workCenters.filter((w) => (showArchived ? true : !w.archived_at));
  const weeks = Array.from({ length: 12 }, (_, i) => i);

  const loadFor = (wcId: string, week: number) =>
    orders
      .filter((o) => o.work_center_id === wcId && !o.archived_at && weekOffset(o.scheduled_start) === week)
      .reduce((s, o) => s + workOrderHours(o), 0);

  const downtimeHours = (wcId: string, week: number) =>
    downtime
      .filter((d) => d.work_center_id === wcId && weekOffset(d.start_date) <= week && weekOffset(d.end_date) >= week)
      .reduce((s, d) => s + (d.hours ?? 0), 0);

  const [dtForm, setDtForm] = useState({ work_center_id: "", start_date: "", end_date: "", hours: 8, planned: true, reason: "" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Capacity &amp; constraints</h3>
          <p className="text-sm text-muted-foreground">
            Finite capacity: weekly load against available hours, net of downtime. Overloads must be levelled before release.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({ ...emptyWc });
              setOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Work center
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No work centers yet in this value stream. Add one to start scheduling against real capacity.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left font-medium">Work center</th>
                <th className="p-2 text-left font-medium">Capacity / wk</th>
                {weeks.map((w) => (
                  <th key={w} className="p-2 text-center font-medium">
                    W{w}
                  </th>
                ))}
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {visible.map((wc) => {
                const cap = weeklyCapacityHours(wc);
                return (
                  <tr key={wc.id} className="border-t">
                    <td className="p-2">
                      <div className="font-medium">
                        {wc.name} {wc.archived_at && <span className="text-muted-foreground">(archived)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wc.code ?? "—"} · {wc.shifts_per_day} shifts · {wc.staging_slots} staging slots
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">{cap.toFixed(0)} h</td>
                    {weeks.map((w) => {
                      const load = loadFor(wc.id, w);
                      const avail = Math.max(cap - downtimeHours(wc.id, w), 0);
                      const pct = avail > 0 ? (load / avail) * 100 : load > 0 ? 999 : 0;
                      const tone = pct > 100 ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500";
                      return (
                        <td key={w} className="p-1 text-center align-bottom">
                          <div className="mx-auto h-10 w-6 rounded bg-muted relative overflow-hidden" title={`${load.toFixed(1)}h of ${avail.toFixed(1)}h`}>
                            <div className={`absolute bottom-0 w-full ${tone}`} style={{ height: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <div className={`mt-0.5 text-[10px] ${pct > 100 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                            {Math.round(pct)}%
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 opacity-70 hover:opacity-100" aria-label={`Actions for ${wc.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(wc);
                              setForm({
                                name: wc.name,
                                code: wc.code ?? "",
                                capacity_hours_per_shift: wc.capacity_hours_per_shift,
                                shifts_per_day: wc.shifts_per_day,
                                days_per_week: wc.days_per_week,
                                efficiency_pct: wc.efficiency_pct,
                                staging_slots: wc.staging_slots,
                                notes: wc.notes ?? "",
                              });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setArchived.mutate({ id: wc.id, archived: !wc.archived_at })}>
                            {wc.archived_at ? (
                              <>
                                <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                              </>
                            ) : (
                              <>
                                <Archive className="mr-2 h-4 w-4" /> Archive
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              void confirmDialog({
                                title: `Delete ${wc.name}?`,
                                description: "Downtime entries are removed and its work orders become unassigned.",
                                destructive: true,
                                confirmLabel: "Delete",
                              }).then((ok) => ok && remove.mutate(wc.id))
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h4 className="font-medium">Downtime &amp; secondary constraints</h4>
        </div>
        <div className="grid gap-2 md:grid-cols-6">
          <select
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            value={dtForm.work_center_id}
            onChange={(e) => setDtForm({ ...dtForm, work_center_id: e.target.value })}
            aria-label="Work center"
          >
            <option value="">Work center…</option>
            {visible.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <Input type="date" value={dtForm.start_date} onChange={(e) => setDtForm({ ...dtForm, start_date: e.target.value })} aria-label="Start date" />
          <Input type="date" value={dtForm.end_date} onChange={(e) => setDtForm({ ...dtForm, end_date: e.target.value })} aria-label="End date" />
          <Input
            type="number"
            value={dtForm.hours}
            onChange={(e) => setDtForm({ ...dtForm, hours: Number(e.target.value) })}
            aria-label="Hours lost"
            placeholder="Hours"
          />
          <Input value={dtForm.reason} onChange={(e) => setDtForm({ ...dtForm, reason: e.target.value })} placeholder="Reason" aria-label="Reason" />
          <Button
            size="sm"
            onClick={() => {
              if (!dtForm.work_center_id || !dtForm.start_date || !dtForm.end_date) {
                toast.error("Pick a work center and a date range.");
                return;
              }
              addDowntime.mutate(dtForm);
            }}
          >
            Log downtime
          </Button>
        </div>
        <div className="space-y-1">
          {downtime.length === 0 && <p className="text-sm text-muted-foreground">No downtime logged for this value stream.</p>}
          {downtime.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
              <span>
                <Badge variant={d.planned ? "secondary" : "destructive"} className="mr-2">
                  {d.planned ? "Planned" : "Unplanned"}
                </Badge>
                {workCenters.find((w) => w.id === d.work_center_id)?.name ?? "—"} · {d.start_date} → {d.end_date} · {d.hours ?? 0} h
                {d.reason && <span className="text-muted-foreground"> · {d.reason}</span>}
              </span>
              <button className="text-muted-foreground hover:text-destructive" onClick={() => removeDowntime.mutate(d.id)} aria-label="Remove downtime">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Secondary constraints tracked per order: required operator certification, tooling/fixture ({tooling.length} registered) and staging slots per
          work center.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit work center" : "New work center"}</DialogTitle>
            <DialogDescription>Available hours drive the finite-capacity check for every week in the horizon.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="wc-name">Name</Label>
              <Input id="wc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="5-axis cell" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-code">Code</Label>
              <Input id="wc-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-hours">Hours per shift</Label>
              <Input
                id="wc-hours"
                type="number"
                value={form.capacity_hours_per_shift}
                onChange={(e) => setForm({ ...form, capacity_hours_per_shift: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-shifts">Shifts per day</Label>
              <Input id="wc-shifts" type="number" value={form.shifts_per_day} onChange={(e) => setForm({ ...form, shifts_per_day: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-days">Days per week</Label>
              <Input id="wc-days" type="number" value={form.days_per_week} onChange={(e) => setForm({ ...form, days_per_week: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-eff">Efficiency %</Label>
              <Input id="wc-eff" type="number" value={form.efficiency_pct} onChange={(e) => setForm({ ...form, efficiency_pct: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wc-slots">Staging slots</Label>
              <Input id="wc-slots" type="number" value={form.staging_slots} onChange={(e) => setForm({ ...form, staging_slots: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="wc-notes">Notes</Label>
              <Textarea id="wc-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate({ ...form, id: editing?.id })} disabled={save.isPending}>
              {editing ? "Save changes" : "Add work center"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
