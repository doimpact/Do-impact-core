import { createFileRoute, Link } from "@tanstack/react-router";
import { useDemoNow } from "@/lib/demo-date";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gauge, Plus, Factory, Plane, Lock, Unlock, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { SicBoard } from "@/components/oms/sic/sic-board";
import { addMinutes, hhmm, type SicShift } from "@/components/oms/sic/types";

export const Route = createFileRoute("/_authenticated/oms/sic")({
  head: () => ({
    meta: [
      { title: "Short Interval Control (SIC) — DO.Impact" },
      { name: "description", content: "Run hour-by-hour SIC boards: SQDCP status, production vs target, loss Pareto and tiered intra-shift escalation." },
      { property: "og:title", content: "Short Interval Control (SIC) — DO.Impact" },
      { property: "og:description", content: "Hour-by-hour shop floor control with loss capture and tiered escalation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SicPage,
});

type Line = { id: string; name: string };

type ShiftForm = {
  line_id: string | null;
  line_name: string | null;
  shift_date: string;
  shift_label: string;
  start_time: string;
  interval_minutes: number;
  interval_count: number;
  target_per_interval: number;
};

type SicShiftRow = SicShift & { archived_at: string | null };

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function SicPage() {
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; shift: SicShiftRow } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SicShiftRow | null>(null);

  const linesQ = useQuery({
    queryKey: ["aps-value-streams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_value_streams").select("id, name").is("archived_at", null).order("sort_order");
      if (error) throw error;
      return (data ?? []) as Line[];
    },
  });


  const shiftsQ = useQuery({
    queryKey: ["sic-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sic_shifts")
        .select("*")
        .order("shift_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as unknown as SicShiftRow[];
    },
  });

  const allShifts = shiftsQ.data ?? [];
  const archivedCount = allShifts.filter((s) => s.archived_at).length;
  const shifts = showArchived ? allShifts : allShifts.filter((s) => !s.archived_at);

  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (shifts.length && (!activeId || !shifts.some((s) => s.id === activeId))) setActiveId(shifts[0].id);
    if (!shifts.length && activeId) setActiveId(null);
  }, [shifts, activeId]);
  const active = shifts.find((s) => s.id === activeId) ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["sic-shifts"] });

  const createShift = useMutation({
    mutationFn: async (v: ShiftForm) => {
      const { data, error } = await supabase.from("sic_shifts").insert(v as never).select().single();
      if (error) throw error;
      const shift = data as unknown as SicShiftRow;
      const rows = Array.from({ length: v.interval_count }, (_, i) => ({
        company_id: shift.company_id,
        shift_id: shift.id,
        seq: i + 1,
        start_at: addMinutes(v.start_time, i * v.interval_minutes),
        end_at: addMinutes(v.start_time, (i + 1) * v.interval_minutes),
        planned_target: v.target_per_interval,
      }));
      const { error: e2 } = await supabase.from("sic_intervals").insert(rows);
      if (e2) throw e2;
      return shift;
    },
    onSuccess: (s) => {
      invalidate();
      setActiveId(s.id);
      toast.success("Shift board created");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: ShiftForm }) => {
      const { data, error } = await supabase.from("sic_shifts").update(v as never).eq("id", id).select().single();
      if (error) throw error;
      const shift = data as unknown as SicShiftRow;

      // Reconcile the interval grid with the new timing/length.
      const { data: existing, error: e1 } = await supabase
        .from("sic_intervals")
        .select("id, seq")
        .eq("shift_id", id)
        .order("seq");
      if (e1) throw e1;
      const rows = (existing ?? []) as { id: string; seq: number }[];

      const keep = rows.filter((r) => r.seq <= v.interval_count);
      const drop = rows.filter((r) => r.seq > v.interval_count);

      for (const r of keep) {
        const i = r.seq - 1;
        const { error } = await supabase
          .from("sic_intervals")
          .update({
            start_at: addMinutes(v.start_time, i * v.interval_minutes),
            end_at: addMinutes(v.start_time, (i + 1) * v.interval_minutes),
            planned_target: v.target_per_interval,
          })
          .eq("id", r.id);
        if (error) throw error;
      }

      if (drop.length) {
        const { error } = await supabase.from("sic_intervals").delete().in("id", drop.map((r) => r.id));
        if (error) throw error;
      }

      const have = new Set(keep.map((r) => r.seq));
      const add = Array.from({ length: v.interval_count }, (_, i) => i + 1)
        .filter((seq) => !have.has(seq))
        .map((seq) => ({
          company_id: shift.company_id,
          shift_id: id,
          seq,
          start_at: addMinutes(v.start_time, (seq - 1) * v.interval_minutes),
          end_at: addMinutes(v.start_time, seq * v.interval_minutes),
          planned_target: v.target_per_interval,
        }));
      if (add.length) {
        const { error } = await supabase.from("sic_intervals").insert(add);
        if (error) throw error;
      }
      return shift;
    },
    onSuccess: (s) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["sic-intervals", s.id] });
      toast.success("Shift board updated");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const setArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await supabase
        .from("sic_shifts")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("No board was updated — it may be read-only.");
    },
    onSuccess: (_d, v) => {
      invalidate();
      toast.success(v.archived ? "Board archived" : "Board restored");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const removeShift = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("sic_shifts").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Nothing was deleted — the board may be read-only.");
    },
    onSuccess: () => {
      invalidate();
      setActiveId(null);
      toast.success("Board deleted");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const toggleClose = useMutation({
    mutationFn: async (s: SicShiftRow) => {
      const { error } = await supabase
        .from("sic_shifts")
        .update({ closed_at: s.closed_at ? null : new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Gauge className="h-7 w-7" /> Short Interval Control
          </h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Break the shift into short intervals and control the plan hour by hour. Four quadrants: SQDCP status,
            production vs target, loss capture with a live Pareto, and containment actions with tiered escalation.
            Keep the huddle to 15 minutes — contain here, send root cause to A3.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus className="mr-1 h-4 w-4" /> New shift board
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link to="/oms/shopfloor" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Factory className="mr-1 inline h-3.5 w-3.5" /> Pull system
        </Link>
        <span className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          SIC boards
        </span>
        <Link to="/oms/critical-path" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Plane className="mr-1 inline h-3.5 w-3.5" /> Critical Path Pulse
        </Link>
        <Link to="/oms/scheduling" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <CalendarRange className="mr-1 inline h-3.5 w-3.5" /> Scheduling (0–12wk)
        </Link>
        {archivedCount > 0 && (
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived ({archivedCount})
          </label>
        )}
      </div>

      {shifts.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed p-10 text-center">
          <Gauge className="mx-auto h-10 w-10 text-muted-foreground" />
          <div className="text-lg font-semibold">No SIC shift boards yet</div>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Create a shift board to start controlling output in short intervals (typically 60 minutes).
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {shifts.slice(0, 16).map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-1 rounded-md border ${
                  s.id === activeId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className="px-3 py-1.5 text-sm font-medium"
                >
                  {s.shift_date} · {s.shift_label}
                  {s.line_name ? ` · ${s.line_name}` : ""}
                  {s.closed_at && <Badge className="ml-2 bg-muted text-muted-foreground">closed</Badge>}
                  {s.archived_at && <Badge className="ml-2 bg-muted text-muted-foreground">archived</Badge>}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${s.id === activeId ? "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" : "text-muted-foreground"}`}
                      aria-label="Board actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDialog({ mode: "edit", shift: s })}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit board
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setArchived.mutate({ id: s.id, archived: !s.archived_at })}>
                      {s.archived_at ? (
                        <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore</>
                      ) : (
                        <><Archive className="mr-2 h-4 w-4" /> Archive</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(s)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {active && (
            <>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "edit", shift: active })}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit board
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleClose.mutate(active)}>
                  {active.closed_at ? <><Unlock className="mr-1 h-4 w-4" /> Reopen shift</> : <><Lock className="mr-1 h-4 w-4" /> Close shift</>}
                </Button>
              </div>
              <SicBoard key={active.id} shift={active} />
            </>
          )}
        </>
      )}

      <ShiftDialog
        key={dialog ? (dialog.mode === "edit" ? dialog.shift.id : "create") : "closed"}
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        lines={linesQ.data ?? []}
        initial={dialog?.mode === "edit" ? dialog.shift : null}
        onSubmit={(v) => {
          if (dialog?.mode === "edit") updateShift.mutate({ id: dialog.shift.id, v });
          else createShift.mutate(v);
          setDialog(null);
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this shift board?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete ? `${confirmDelete.shift_date} · ${confirmDelete.shift_label}` : ""} — all intervals, losses
              and containment actions on this board are removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) removeShift.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ShiftDialog({
  open,
  onOpenChange,
  lines,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: Line[];
  initial: SicShiftRow | null;
  onSubmit: (v: ShiftForm) => void;
}) {
  const demoNow = useDemoNow();
  const [lineId, setLineId] = useState(initial?.line_id ?? "none");
  const [date, setDate] = useState(initial?.shift_date ?? demoNow.toISOString().slice(0, 10));
  const [label, setLabel] = useState(initial?.shift_label ?? "Day");
  const [start, setStart] = useState(initial ? hhmm(initial.start_time) : "06:00");
  const [mins, setMins] = useState(String(initial?.interval_minutes ?? 60));
  const [count, setCount] = useState(String(initial?.interval_count ?? 8));
  const [target, setTarget] = useState(String(initial?.target_per_interval ?? 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit SIC shift board" : "New SIC shift board"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Line</Label>
            <Select value={lineId} onValueChange={setLineId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No line</SelectItem>
                {lines.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div>
              <Label>Shift</Label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start time</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>Interval (minutes)</Label><Input type="number" value={mins} onChange={(e) => setMins(e.target.value)} /></div>
            <div><Label>Intervals</Label><Input type="number" value={count} onChange={(e) => setCount(e.target.value)} /></div>
            <div><Label>Target per interval</Label><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
          </div>
          {initial && (
            <p className="text-xs text-muted-foreground">
              Changing the timing re-times the existing intervals. Reducing the interval count removes the last
              intervals and any data captured against them.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const line = lines.find((l) => l.id === lineId) ?? null;
              onSubmit({
                line_id: line?.id ?? null,
                line_name: line?.name ?? null,
                shift_date: date,
                shift_label: label,
                start_time: start,
                interval_minutes: Math.max(5, Number(mins) || 60),
                interval_count: Math.min(24, Math.max(1, Number(count) || 8)),
                target_per_interval: Number(target) || 0,
              });
            }}
          >
            {initial ? "Save changes" : "Create board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
