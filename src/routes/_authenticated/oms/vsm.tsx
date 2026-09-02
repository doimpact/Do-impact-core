import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, GripVertical, ArchiveRestore, Archive, ArrowLeft, Save, Copy,
  Factory, Users, ChevronRight,
} from "lucide-react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable,
  horizontalListSortingStrategy, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  availableTimeSec, formatDuration, formatPct, leadTimeSeconds, processCycleEfficiency,
  rolledThroughputYield, taktSeconds, valueAddedSeconds,
  type VsmInventory, type VsmMap, type VsmState, type VsmStep,
} from "@/lib/vsm";

export const Route = createFileRoute("/_authenticated/oms/vsm")({
  head: () => ({
    meta: [
      { title: "Value Stream Map — DO.Impact" },
      { name: "description", content: "Model manufacturing value streams with process boxes, takt time, inventory, and current vs future state." },
      { property: "og:title", content: "Value Stream Map — DO.Impact" },
      { property: "og:description", content: "Model manufacturing value streams with process boxes, takt time, inventory, and current vs future state." },
    ],
  }),
  component: VsmPage,
});

type MapRow = VsmMap & { company_id: string };

function VsmPage() {
  const companyQ = useActiveCompany();
  const companyId = companyQ.data?.company_id ?? null;
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const mapsQ = useQuery({
    queryKey: ["vsm-maps", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vsm_maps")
        .select("*")
        .eq("company_id", companyId!)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MapRow[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<MapRow>) => {
      const { data: u } = await getCurrentUser();
      const nextOrder = (mapsQ.data?.reduce((m, x) => Math.max(m, x.sort_order), 0) ?? 0) + 1;
      const { data, error } = await supabase
        .from("vsm_maps")
        .insert({
          company_id: companyId!,
          created_by: u.user?.id ?? null,
          title: input.title ?? "New value stream",
          description: input.description ?? null,
          product_family: input.product_family ?? null,
          customer: input.customer ?? null,
          demand_per_period: input.demand_per_period ?? null,
          period_label: input.period_label ?? "per day",
          available_time_sec: input.available_time_sec ?? null,
          shifts: input.shifts ?? null,
          working_time_per_shift_min: input.working_time_per_shift_min ?? null,
          notes: input.notes ?? null,
          sort_order: nextOrder,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as MapRow;
    },
    onSuccess: (row) => {
      toast.success("Value stream created");
      qc.invalidateQueries({ queryKey: ["vsm-maps", companyId] });
      setOpenId(row.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; patch: Partial<MapRow> }) => {
      const { error } = await supabase.from("vsm_maps").update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vsm-maps", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vsm_maps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Value stream deleted");
      qc.invalidateQueries({ queryKey: ["vsm-maps", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, idx) =>
          supabase.from("vsm_maps").update({ sort_order: idx + 1 }).eq("id", id),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vsm-maps", companyId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = (mapsQ.data ?? []).filter((m) => !m.archived_at);
  const archived = (mapsQ.data ?? []).filter((m) => m.archived_at);
  const openMap = mapsQ.data?.find((m) => m.id === openId) ?? null;

  if (openMap) {
    return (
      <MapEditor
        map={openMap}
        onBack={() => setOpenId(null)}
        onUpdate={(patch) => update.mutate({ id: openMap.id, patch })}
      />
    );
  }

  function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const ids = active.map((m) => m.id);
    const from = ids.indexOf(String(a.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    reorder.mutate(arrayMove(ids, from, to));
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Value Stream Map</h1>
          <p className="text-sm text-muted-foreground">
            Model each value stream end-to-end with current and future state.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived((s) => !s)}
          >
            {showArchived ? "Hide archived" : `Show archived (${archived.length})`}
          </Button>
          <MapDialog
            trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> New value stream</Button>}
            onSubmit={(v) => create.mutate(v)}
          />
        </div>
      </div>

      {mapsQ.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {mapsQ.isFetched && active.length === 0 && !showArchived && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No value streams yet. Create your first one.</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={active.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-3">
            {active.map((m) => (
              <SortableMapCard
                key={m.id}
                map={m}
                onOpen={() => setOpenId(m.id)}
                onUpdate={(patch) => update.mutate({ id: m.id, patch })}
                onArchive={() => update.mutate({ id: m.id, patch: { archived_at: new Date().toISOString() } as never })}
                onDelete={() => remove.mutate(m.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showArchived && archived.length > 0 && (
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Archived</h2>
          <div className="grid gap-2">
            {archived.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.customer ?? ""}{m.product_family ? ` · ${m.product_family}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => update.mutate({ id: m.id, patch: { archived_at: null } as never })}
                  >
                    <ArchiveRestore className="mr-1 h-3.5 w-3.5" /> Unarchive
                  </Button>
                  <ConfirmDelete onConfirm={() => remove.mutate(m.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableMapCard({
  map, onOpen, onUpdate, onArchive, onDelete,
}: {
  map: MapRow;
  onOpen: () => void;
  onUpdate: (patch: Partial<MapRow>) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: map.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const summaryQ = useQuery({
    queryKey: ["vsm-summary", map.id],
    queryFn: async () => {
      const [{ data: steps }, { data: inv }] = await Promise.all([
        supabase.from("vsm_steps").select("*").eq("map_id", map.id).order("position"),
        supabase.from("vsm_inventories").select("*").eq("map_id", map.id).order("after_step_position"),
      ]);
      return {
        steps: (steps ?? []) as unknown as VsmStep[],
        inv: (inv ?? []) as unknown as VsmInventory[],
      };
    },
  });

  const cur = useMemo(() => {
    const s = summaryQ.data?.steps.filter((x) => x.state === "current") ?? [];
    const i = summaryQ.data?.inv.filter((x) => x.state === "current") ?? [];
    return {
      steps: s, inv: i,
      va: valueAddedSeconds(s),
      lt: leadTimeSeconds(s, i, map),
      pce: processCycleEfficiency(s, i, map),
    };
  }, [summaryQ.data, map]);

  const hasFuture = (summaryQ.data?.steps ?? []).some((x) => x.state === "future");

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch rounded-lg border bg-card">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="flex cursor-grab items-center px-2 text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onOpen} className="flex-1 p-4 text-left">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-semibold">
              {map.title}
              {hasFuture && <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Future state</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {map.customer ?? "No customer"}{map.product_family ? ` · ${map.product_family}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Metric label="Steps" value={cur.steps.length} />
            <Metric label="VA" value={formatDuration(cur.va)} />
            <Metric label="Lead time" value={formatDuration(cur.lt)} />
            <Metric label="PCE" value={formatPct(cur.pce)} />
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1 border-l px-2">
        <MapDialog
          trigger={<Button variant="ghost" size="sm"><Pencil className="h-3.5 w-3.5" /></Button>}
          initial={map}
          onSubmit={(v) => onUpdate(v)}
        />
        <Button variant="ghost" size="sm" onClick={onArchive} title="Archive">
          <Archive className="h-3.5 w-3.5" />
        </Button>
        <ConfirmDelete onConfirm={onDelete} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="uppercase tracking-wider text-[10px] text-muted-foreground">{label}</p>
      <p className="font-mono text-sm">{value}</p>
    </div>
  );
}

function MapDialog({
  trigger, initial, onSubmit,
}: {
  trigger: React.ReactNode;
  initial?: Partial<MapRow>;
  onSubmit: (v: Partial<MapRow>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<MapRow>>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    product_family: initial?.product_family ?? "",
    customer: initial?.customer ?? "",
    demand_per_period: initial?.demand_per_period ?? null,
    period_label: initial?.period_label ?? "per day",
    available_time_sec: initial?.available_time_sec ?? null,
    shifts: initial?.shifts ?? null,
    working_time_per_shift_min: initial?.working_time_per_shift_min ?? null,
    notes: initial?.notes ?? "",
  });

  function submit() {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    onSubmit(form);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.title ? "Edit value stream" : "New value stream"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer</Label>
              <Input value={form.customer ?? ""} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
            </div>
            <div>
              <Label>Product family</Label>
              <Input value={form.product_family ?? ""} onChange={(e) => setForm({ ...form, product_family: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer demand</Label>
              <Input
                type="number"
                value={form.demand_per_period ?? ""}
                onChange={(e) => setForm({ ...form, demand_per_period: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Period</Label>
              <Input placeholder="per day" value={form.period_label ?? ""} onChange={(e) => setForm({ ...form, period_label: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Shifts</Label>
              <Input
                type="number"
                value={form.shifts ?? ""}
                onChange={(e) => setForm({ ...form, shifts: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Min / shift</Label>
              <Input
                type="number"
                value={form.working_time_per_shift_min ?? ""}
                onChange={(e) => setForm({ ...form, working_time_per_shift_min: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Available (sec)</Label>
              <Input
                type="number"
                placeholder="auto"
                value={form.available_time_sec ?? ""}
                onChange={(e) => setForm({ ...form, available_time_sec: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Available time is computed as shifts × min/shift when set. Fill "Available (sec)" only to override.
          </p>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}><Save className="mr-2 h-4 w-4" /> Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this value stream?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the map and all its steps, inventory, and information flows. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// -------------------- Map editor --------------------

function MapEditor({
  map, onBack, onUpdate,
}: {
  map: MapRow;
  onBack: () => void;
  onUpdate: (patch: Partial<MapRow>) => void;
}) {
  const qc = useQueryClient();
  const [view, setView] = useState<"current" | "future" | "compare">("current");

  const stepsQ = useQuery({
    queryKey: ["vsm-steps", map.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vsm_steps").select("*").eq("map_id", map.id).order("position");
      if (error) throw error;
      return (data ?? []) as unknown as VsmStep[];
    },
  });

  const invQ = useQuery({
    queryKey: ["vsm-inv", map.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vsm_inventories").select("*").eq("map_id", map.id).order("after_step_position");
      if (error) throw error;
      return (data ?? []) as unknown as VsmInventory[];
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["vsm-steps", map.id] });
    qc.invalidateQueries({ queryKey: ["vsm-inv", map.id] });
    qc.invalidateQueries({ queryKey: ["vsm-summary", map.id] });
    qc.invalidateQueries({ queryKey: ["vsm-maps"] });
  };

  const stepsAll = stepsQ.data ?? [];
  const invAll = invQ.data ?? [];

  const copyCurrentToFuture = useMutation({
    mutationFn: async () => {
      const curSteps = stepsAll.filter((s) => s.state === "current");
      const curInv = invAll.filter((i) => i.state === "current");
      await supabase.from("vsm_steps").delete().eq("map_id", map.id).eq("state", "future");
      await supabase.from("vsm_inventories").delete().eq("map_id", map.id).eq("state", "future");
      if (curSteps.length) {
        const rows = curSteps.map((s) => ({
          company_id: map.company_id, map_id: map.id, state: "future",
          position: s.position, name: s.name,
          cycle_time_sec: s.cycle_time_sec, changeover_sec: s.changeover_sec,
          uptime_pct: s.uptime_pct, operators: s.operators, shifts: s.shifts,
          working_time_per_shift_min: s.working_time_per_shift_min,
          first_pass_yield_pct: s.first_pass_yield_pct,
          batch_size: s.batch_size, scrap_pct: s.scrap_pct, notes: s.notes,
        }));
        const { error } = await supabase.from("vsm_steps").insert(rows);
        if (error) throw error;
      }
      if (curInv.length) {
        const rows = curInv.map((i) => ({
          company_id: map.company_id, map_id: map.id, state: "future",
          after_step_position: i.after_step_position, quantity: i.quantity, notes: i.notes,
        }));
        const { error } = await supabase.from("vsm_inventories").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Future state seeded from current"); invalidateAll(); setView("future"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const takt = taktSeconds(map);
  const avail = availableTimeSec(map);

  const futureExists = stepsAll.some((s) => s.state === "future");

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{map.title}</h1>
            <p className="text-sm text-muted-foreground">
              {map.customer ?? "No customer"}{map.product_family ? ` · ${map.product_family}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as typeof view)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="current">Current state</ToggleGroupItem>
            <ToggleGroupItem value="future">Future state</ToggleGroupItem>
            <ToggleGroupItem value="compare" disabled={!futureExists}>Compare</ToggleGroupItem>
          </ToggleGroup>
          {view === "future" && !futureExists && (
            <Button variant="outline" size="sm" onClick={() => copyCurrentToFuture.mutate()}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Seed from current
            </Button>
          )}
          {view === "future" && futureExists && (
            <Button variant="outline" size="sm" onClick={() => copyCurrentToFuture.mutate()}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Re-seed
            </Button>
          )}
          <MapDialog
            trigger={<Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Edit header</Button>}
            initial={map}
            onSubmit={(v) => onUpdate(v)}
          />
        </div>
      </div>

      <CustomerBar map={map} takt={takt} avail={avail} />

      {view === "compare" ? (
        <div className="space-y-6">
          <div>
            <StateHeading label="Current state" tint="muted" />
            <StateView
              state="current"
              map={map}
              stepsAll={stepsAll}
              invAll={invAll}
              readOnly
              onInvalidate={invalidateAll}
            />
          </div>
          <div>
            <StateHeading label="Future state" tint="primary" />
            <StateView
              state="future"
              map={map}
              stepsAll={stepsAll}
              invAll={invAll}
              readOnly
              onInvalidate={invalidateAll}
            />
          </div>
          <CompareSummary map={map} stepsAll={stepsAll} invAll={invAll} />
        </div>
      ) : (
        <StateView
          state={view}
          map={map}
          stepsAll={stepsAll}
          invAll={invAll}
          onInvalidate={invalidateAll}
        />
      )}
    </div>
  );
}

function StateHeading({ label, tint }: { label: string; tint: "muted" | "primary" }) {
  return (
    <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${tint === "primary" ? "text-primary" : "text-muted-foreground"}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${tint === "primary" ? "bg-primary" : "bg-muted-foreground"}`} />
      {label}
    </div>
  );
}

function CustomerBar({ map, takt, avail }: { map: MapRow; takt: number | null; avail: number | null }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-lg border bg-card p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Customer</p>
        <p className="mt-1 flex items-center gap-2 font-semibold">
          <Users className="h-4 w-4 text-muted-foreground" />
          {map.customer ?? "—"}
        </p>
        <p className="mt-1 font-mono text-sm">
          {map.demand_per_period ?? "—"} <span className="text-muted-foreground">{map.period_label ?? ""}</span>
        </p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available time</p>
        <p className="mt-1 font-mono text-lg">{formatDuration(avail)}</p>
        <p className="text-[11px] text-muted-foreground">
          {map.shifts ?? "—"} shift{(map.shifts ?? 0) === 1 ? "" : "s"} × {map.working_time_per_shift_min ?? "—"} min
        </p>
      </div>
      <div className="rounded-lg border-2 border-primary/60 bg-primary/5 p-3">
        <p className="text-[10px] uppercase tracking-wider text-primary">Takt time</p>
        <p className="mt-1 font-mono text-2xl font-bold text-primary">{formatDuration(takt)}</p>
        <p className="text-[11px] text-muted-foreground">available ÷ demand — pace of customer pull</p>
      </div>
    </div>
  );
}

function StateView({
  state, map, stepsAll, invAll, readOnly, onInvalidate,
}: {
  state: VsmState;
  map: MapRow;
  stepsAll: VsmStep[];
  invAll: VsmInventory[];
  readOnly?: boolean;
  onInvalidate: () => void;
}) {
  const steps = useMemo(() => stepsAll.filter((s) => s.state === state).sort((a, b) => a.position - b.position), [stepsAll, state]);
  const inv = useMemo(() => invAll.filter((i) => i.state === state), [invAll, state]);
  const takt = taktSeconds(map);
  const va = valueAddedSeconds(steps);
  const lt = leadTimeSeconds(steps, inv, map);
  const pce = processCycleEfficiency(steps, inv, map);
  const rty = rolledThroughputYield(steps);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addStep = useMutation({
    mutationFn: async () => {
      const nextPos = (steps.reduce((m, s) => Math.max(m, s.position), 0) ?? 0) + 1;
      const { error } = await supabase.from("vsm_steps").insert({
        company_id: map.company_id, map_id: map.id, state, position: nextPos, name: `Step ${nextPos}`,
      });
      if (error) throw error;
    },
    onSuccess: onInvalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStep = useMutation({
    mutationFn: async (v: { id: string; patch: Partial<VsmStep> }) => {
      const { error } = await supabase.from("vsm_steps").update(v.patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: onInvalidate,
  });

  const removeStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vsm_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: onInvalidate,
  });

  const reorderSteps = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id, idx) => supabase.from("vsm_steps").update({ position: idx + 1 }).eq("id", id)));
    },
    onSuccess: onInvalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addInv = useMutation({
    mutationFn: async (afterPos: number) => {
      const { error } = await supabase.from("vsm_inventories").insert({
        company_id: map.company_id, map_id: map.id, state, after_step_position: afterPos, quantity: 0,
      });
      if (error) throw error;
    },
    onSuccess: onInvalidate,
  });
  const updateInv = useMutation({
    mutationFn: async (v: { id: string; patch: Partial<VsmInventory> }) => {
      const { error } = await supabase.from("vsm_inventories").update(v.patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: onInvalidate,
  });
  const removeInv = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vsm_inventories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: onInvalidate,
  });

  function onDragEnd(e: DragEndEvent) {
    const { active: a, over } = e;
    if (!over || a.id === over.id) return;
    const ids = steps.map((s) => s.id);
    const from = ids.indexOf(String(a.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    reorderSteps.mutate(arrayMove(ids, from, to));
  }

  const invByPos = useMemo(() => {
    const m = new Map<number, VsmInventory[]>();
    for (const i of inv) {
      const arr = m.get(i.after_step_position) ?? [];
      arr.push(i);
      m.set(i.after_step_position, arr);
    }
    return m;
  }, [inv]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Value-added" value={formatDuration(va)} />
        <KpiTile label="Lead time" value={formatDuration(lt)} />
        <KpiTile label="PCE" value={formatPct(pce)} />
        <KpiTile label="Rolled TP yield" value={formatPct(rty)} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Process flow — {state === "current" ? "Current" : "Future"} state
          </h2>
          {!readOnly && (
            <Button size="sm" onClick={() => addStep.mutate()}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add process
            </Button>
          )}
        </div>
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {readOnly ? "No steps in this state." : "No processes yet. Add the first one."}
          </p>
        )}
        <div className="overflow-x-auto pb-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex min-w-max items-stretch gap-0">
                {steps.map((s, idx) => (
                  <div key={s.id} className="flex items-stretch">
                    <ProcessBox
                      step={s}
                      takt={takt}
                      readOnly={readOnly}
                      onChange={(patch) => updateStep.mutate({ id: s.id, patch })}
                      onDelete={() => removeStep.mutate(s.id)}
                    />
                    {idx < steps.length - 1 && (
                      <BetweenBoxes
                        inv={invByPos.get(s.position) ?? []}
                        map={map}
                        readOnly={readOnly}
                        onAdd={() => addInv.mutate(s.position)}
                        onChangeInv={(id, patch) => updateInv.mutate({ id, patch })}
                        onDeleteInv={(id) => removeInv.mutate(id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <TimelineLadder steps={steps} inv={inv} map={map} />
    </div>
  );
}

function BetweenBoxes({
  inv, map, readOnly, onAdd, onChangeInv, onDeleteInv,
}: {
  inv: VsmInventory[];
  map: MapRow;
  readOnly?: boolean;
  onAdd: () => void;
  onChangeInv: (id: string, patch: Partial<VsmInventory>) => void;
  onDeleteInv: (id: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-2">
      <div className="mb-1 flex flex-col items-center gap-1">
        {inv.map((i) => (
          <InventoryTriangle
            key={i.id}
            inv={i}
            map={map}
            readOnly={readOnly}
            onChange={(patch) => onChangeInv(i.id, patch)}
            onDelete={() => onDeleteInv(i.id)}
          />
        ))}
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={onAdd}
          >
            <Plus className="mr-1 h-3 w-3" /> Inventory
          </Button>
        )}
      </div>
      <ChevronRight className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

function InventoryTriangle({
  inv, map, readOnly, onChange, onDelete,
}: {
  inv: VsmInventory;
  map: MapRow;
  readOnly?: boolean;
  onChange: (patch: Partial<VsmInventory>) => void;
  onDelete: () => void;
}) {
  const dos = inv.quantity != null && map.demand_per_period ? inv.quantity / map.demand_per_period : null;
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl leading-none text-amber-500" aria-hidden>▲</div>
      <div className="mt-0.5 flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {readOnly ? (
          <span className="font-mono">{inv.quantity ?? "—"}</span>
        ) : (
          <Input
            type="number"
            className="h-5 w-14 px-1 text-[10px]"
            defaultValue={inv.quantity ?? ""}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== inv.quantity) onChange({ quantity: v });
            }}
          />
        )}
        {!readOnly && (
          <button type="button" onClick={onDelete} className="text-destructive" aria-label="Remove inventory">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {dos != null && <span className="mt-0.5 text-[9px] text-muted-foreground">{dos.toFixed(1)} {map.period_label ?? "d"}</span>}
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}

// -------------------- Process Box --------------------

function ProcessBox({
  step, takt, readOnly, onChange, onDelete,
}: {
  step: VsmStep;
  takt: number | null;
  readOnly?: boolean;
  onChange: (patch: Partial<VsmStep>) => void;
  onDelete: () => void;
}) {
  const sortable = useSortable({ id: step.id, disabled: readOnly });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  };
  const bottleneck = takt != null && step.cycle_time_sec != null && step.cycle_time_sec > takt;
  const ratio = takt && step.cycle_time_sec != null ? Math.min(1.5, step.cycle_time_sec / takt) : null;

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`w-56 shrink-0 rounded-md border-2 bg-background text-xs shadow-sm ${bottleneck ? "border-red-500" : "border-foreground/70"}`}
    >
      <div className="flex items-center gap-1 border-b bg-muted/50 px-2 py-1">
        {!readOnly && (
          <button
            type="button"
            {...sortable.attributes}
            {...sortable.listeners}
            aria-label="Drag process"
            className="cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <Factory className="h-3.5 w-3.5 text-muted-foreground" />
        {readOnly ? (
          <span className="flex-1 truncate font-semibold">{step.name}</span>
        ) : (
          <Input
            className="h-6 flex-1 border-0 bg-transparent px-1 text-xs font-semibold shadow-none focus-visible:ring-1"
            defaultValue={step.name}
            onBlur={(e) => e.target.value !== step.name && onChange({ name: e.target.value })}
          />
        )}
        {!readOnly && (
          <button type="button" onClick={onDelete} aria-label="Delete process" className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2">
        <DataRow label="C/T" value={step.cycle_time_sec} unit="s" readOnly={readOnly} onChange={(v) => onChange({ cycle_time_sec: v })} />
        <DataRow label="C/O" value={step.changeover_sec} unit="s" readOnly={readOnly} onChange={(v) => onChange({ changeover_sec: v })} />
        <DataRow label="Uptime" value={step.uptime_pct} unit="%" readOnly={readOnly} onChange={(v) => onChange({ uptime_pct: v })} />
        <DataRow label="FTY" value={step.first_pass_yield_pct} unit="%" readOnly={readOnly} onChange={(v) => onChange({ first_pass_yield_pct: v })} />
        <DataRow label="Shifts" value={step.shifts} unit="" readOnly={readOnly} onChange={(v) => onChange({ shifts: v == null ? null : Math.round(v) })} />
        <DataRow label="Hrs/sh" value={step.working_time_per_shift_min != null ? step.working_time_per_shift_min / 60 : null} unit="h" readOnly={readOnly} onChange={(v) => onChange({ working_time_per_shift_min: v == null ? null : v * 60 })} />
        <DataRow label="Ops" value={step.operators} unit="" readOnly={readOnly} onChange={(v) => onChange({ operators: v == null ? null : Math.round(v) })} />
        <DataRow label="Scrap" value={step.scrap_pct} unit="%" readOnly={readOnly} onChange={(v) => onChange({ scrap_pct: v })} />
      </div>
      {ratio != null && (
        <div className="border-t px-2 py-1">
          <div className="mb-0.5 flex items-center justify-between text-[9px] text-muted-foreground">
            <span>C/T vs Takt</span>
            <span className={bottleneck ? "font-semibold text-red-500" : ""}>{(ratio * 100).toFixed(0)}%</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded bg-muted">
            <div
              className={`h-full ${bottleneck ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, (ratio / 1.5) * 100)}%` }}
            />
            <div className="absolute top-0 h-full w-px bg-foreground/60" style={{ left: `${(1 / 1.5) * 100}%` }} title="Takt" />
          </div>
        </div>
      )}
    </div>
  );
}

function DataRow({
  label, value, unit, readOnly, onChange,
}: {
  label: string;
  value: number | null;
  unit: string;
  readOnly?: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1 border-b border-dashed border-muted-foreground/20 py-0.5 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {readOnly ? (
        <span className="font-mono text-[11px]">
          {value == null ? "—" : `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`}
        </span>
      ) : (
        <div className="flex items-center gap-0.5">
          <Input
            type="number"
            className="h-5 w-14 px-1 text-right font-mono text-[11px]"
            defaultValue={value ?? ""}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== value) onChange(v);
            }}
          />
          {unit && <span className="text-[9px] text-muted-foreground">{unit}</span>}
        </div>
      )}
    </div>
  );
}

// -------------------- Timeline ladder --------------------

function TimelineLadder({
  steps, inv, map,
}: {
  steps: VsmStep[];
  inv: VsmInventory[];
  map: MapRow;
}) {
  if (steps.length === 0) return null;
  const va = valueAddedSeconds(steps);
  const lt = leadTimeSeconds(steps, inv, map);
  const nva = Math.max(0, lt - va);
  const invByPos = new Map<number, number>();
  const avail = availableTimeSec(map);
  for (const i of inv) {
    const sec = map.demand_per_period && avail ? ((i.quantity ?? 0) / map.demand_per_period) * avail : 0;
    invByPos.set(i.after_step_position, (invByPos.get(i.after_step_position) ?? 0) + sec);
  }
  const total = lt || 1;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h2>
        <p className="text-xs text-muted-foreground">
          VA {formatDuration(va)} · NVA {formatDuration(nva)} · Lead {formatDuration(lt)}
        </p>
      </div>
      {/* Sawtooth */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-end gap-0">
          {steps.map((s, idx) => {
            const vaSec = s.cycle_time_sec ?? 0;
            const invSec = invByPos.get(s.position) ?? 0;
            const showInv = idx < steps.length - 1 && invSec > 0;
            return (
              <div key={s.id} className="flex items-end">
                <div className="flex flex-col items-center px-1">
                  <div className="h-4 w-14 bg-emerald-500/70" title={`VA ${formatDuration(vaSec)}`} />
                  <span className="mt-0.5 font-mono text-[9px]">{formatDuration(vaSec)}</span>
                </div>
                {showInv && (
                  <div className="flex flex-col items-center px-1">
                    <div className="h-4 w-14 bg-red-400/70" title={`Wait ${formatDuration(invSec)}`} />
                    <span className="mt-0.5 font-mono text-[9px]">{formatDuration(invSec)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Ratio bar */}
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded bg-muted">
        <div className="bg-emerald-500" style={{ width: `${(va / total) * 100}%` }} title={`VA ${formatDuration(va)}`} />
        <div className="bg-red-400/70" style={{ width: `${(nva / total) * 100}%` }} title={`NVA ${formatDuration(nva)}`} />
      </div>
    </div>
  );
}

// -------------------- Compare summary --------------------

function CompareSummary({
  map, stepsAll, invAll,
}: {
  map: MapRow;
  stepsAll: VsmStep[];
  invAll: VsmInventory[];
}) {
  const cur = {
    steps: stepsAll.filter((s) => s.state === "current"),
    inv: invAll.filter((i) => i.state === "current"),
  };
  const fut = {
    steps: stepsAll.filter((s) => s.state === "future"),
    inv: invAll.filter((i) => i.state === "future"),
  };
  const rows: { label: string; c: string; f: string; delta: string; better: boolean }[] = [];
  const push = (label: string, cVal: number | null, fVal: number | null, fmt: (n: number | null) => string, higherIsBetter = false) => {
    const delta = cVal != null && fVal != null ? fVal - cVal : null;
    const better = delta == null ? false : (higherIsBetter ? delta > 0 : delta < 0);
    rows.push({
      label,
      c: fmt(cVal),
      f: fmt(fVal),
      delta: delta == null ? "—" : `${delta > 0 ? "+" : ""}${fmt(delta)}`,
      better,
    });
  };
  push("Value-added", valueAddedSeconds(cur.steps), valueAddedSeconds(fut.steps), formatDuration);
  push("Lead time", leadTimeSeconds(cur.steps, cur.inv, map), leadTimeSeconds(fut.steps, fut.inv, map), formatDuration);
  push("PCE", processCycleEfficiency(cur.steps, cur.inv, map), processCycleEfficiency(fut.steps, fut.inv, map), formatPct, true);
  push("Rolled TP yield", rolledThroughputYield(cur.steps), rolledThroughputYield(fut.steps), formatPct, true);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current vs Future</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Metric</th>
              <th className="py-2 pr-4">Current</th>
              <th className="py-2 pr-4">Future</th>
              <th className="py-2">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b last:border-b-0">
                <td className="py-2 pr-4 font-medium">{r.label}</td>
                <td className="py-2 pr-4 font-mono">{r.c}</td>
                <td className="py-2 pr-4 font-mono">{r.f}</td>
                <td className={`py-2 font-mono ${r.better ? "text-emerald-600" : r.delta === "—" ? "text-muted-foreground" : "text-red-600"}`}>{r.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
