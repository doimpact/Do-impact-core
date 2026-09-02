import { getCurrentUser } from "@/lib/auth-session";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ExternalLink, Plus, Save, Trash2, RotateCcw, LayoutTemplate, Pencil, GripVertical } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";

export type Block = {
  id: string;
  day: 1 | 2 | 3 | 4 | 5;
  start: string;
  end: string;
  title: string;
  link?: string;
  notes?: string;
};

export const DAYS: { n: 1 | 2 | 3 | 4 | 5; label: string; theme: string }[] = [
  { n: 1, label: "Monday", theme: "Strategy & Direction" },
  { n: 2, label: "Tuesday", theme: "Commercial & Growth" },
  { n: 3, label: "Wednesday", theme: "Operations" },
  { n: 4, label: "Thursday", theme: "People, Finance & Report" },
  { n: 5, label: "Friday", theme: "Ad-hoc / Reserve" },
];

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const DEFAULT_BLOCKS: Block[] = [
  // Monday — Strategy
  { id: uid(), day: 1, start: "08:30", end: "09:00", title: "Weekly kick-off — Hoshin X-Matrix + 3-yr Roadmap", link: "/strategy/hoshin" },
  { id: uid(), day: 1, start: "09:00", end: "10:00", title: "Strategic Themes / Value-Driver Tree", link: "/strategy" },
  { id: uid(), day: 1, start: "10:00", end: "11:00", title: "Workstreams Kanban review (L1–L4)", link: "/strategy/workstreams" },
  { id: uid(), day: 1, start: "11:00", end: "12:00", title: "A3 problems in flight", link: "/actions/problem-solver/a3" },
  { id: uid(), day: 1, start: "14:00", end: "15:00", title: "Restructuring SteerCo prep", link: "/strategy/restructuring" },
  { id: uid(), day: 1, start: "15:30", end: "16:30", title: "Execution Timeline sweep (owner + due)", link: "/actions" },

  // Tuesday — Commercial
  { id: uid(), day: 2, start: "08:30", end: "10:00", title: "Pipeline health & Plan vs Pipeline", link: "/commercial/plan" },
  { id: uid(), day: 2, start: "10:00", end: "11:00", title: "Accounts & Stakeholders touchpoints", link: "/commercial" },
  { id: uid(), day: 2, start: "11:00", end: "12:00", title: "Quotes / Contracts pending decisions", link: "/commercial" },
  { id: uid(), day: 2, start: "14:00", end: "15:00", title: "Sales tunnel with sales lead", link: "/commercial" },
  { id: uid(), day: 2, start: "15:30", end: "16:30", title: "Growth targets vs booked backlog", link: "/commercial/plan" },

  // Wednesday — Operations
  { id: uid(), day: 3, start: "08:30", end: "09:30", title: "Daily SQDP board — 3C on red", link: "/oms/daily" },
  { id: uid(), day: 3, start: "09:30", end: "10:30", title: "KPI review (starred only)", link: "/oms/kpis" },
  { id: uid(), day: 3, start: "10:30", end: "12:00", title: "SIOP: demand, capacity, long-lead, OSP", link: "/oms/siop" },
  { id: uid(), day: 3, start: "13:30", end: "14:30", title: "Shop Floor Flow — gates & bottlenecks", link: "/oms/shopfloor" },
  { id: uid(), day: 3, start: "14:30", end: "15:30", title: "Industrialization gate review", link: "/oms/industrialization" },
  { id: uid(), day: 3, start: "15:30", end: "16:30", title: "Compliance walk (audit-ready)", link: "/oms/compliance" },

  // Thursday — People, Finance, Report
  { id: uid(), day: 4, start: "08:30", end: "09:30", title: "Org chart & open roles", link: "/people" },
  { id: uid(), day: 4, start: "09:30", end: "10:30", title: "Skills matrix & development plans", link: "/people/matrix" },
  { id: uid(), day: 4, start: "11:00", end: "12:00", title: "Turnaround Finance tracker & Value Realization", link: "/strategy/capex" },
  { id: uid(), day: 4, start: "13:30", end: "14:30", title: "13-Week Cash Flow + Working Capital", link: "/commercial" },
  { id: uid(), day: 4, start: "14:30", end: "15:30", title: "Part Margins & COPQ", link: "/commercial" },
  { id: uid(), day: 4, start: "15:30", end: "16:30", title: "Weekly SLT report-out prep", link: "/report/weekly" },

  // Friday — Ad-hoc (kept intentionally empty; one optional block)
  { id: uid(), day: 5, start: "15:00", end: "16:00", title: "(Optional) Board report-out review — monthly", link: "/report/board" },
];

export function StandardWorkPanel() {
  const companyQ = useActiveCompany();
  const companyId = companyQ.data?.company_id ?? null;
  const qc = useQueryClient();

  const workQ = useQuery({
    queryKey: ["sw", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase
        .from("oms_standard_work")
        .select("id, blocks")
        .eq("company_id", companyId!)
        .eq("user_id", u.user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; blocks: Block[] } | null;
    },
  });

  const templatesQ = useQuery({
    queryKey: ["sw-templates", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oms_standard_work_templates")
        .select("id, name, blocks, is_default")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; blocks: Block[]; is_default: boolean }[];
    },
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (workQ.data) {
      setBlocks(workQ.data.blocks ?? []);
      setDirty(false);
    } else if (workQ.isFetched && !workQ.data) {
      setBlocks(DEFAULT_BLOCKS);
      setDirty(false);
    }
  }, [workQ.data, workQ.isFetched]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await getCurrentUser();
      const { error } = await supabase
        .from("oms_standard_work")
        .upsert(
          { company_id: companyId!, user_id: u.user!.id, blocks: blocks as unknown as never },
          { onConflict: "company_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      setDirty(false);
      toast.success("Standard work saved");
      qc.invalidateQueries({ queryKey: ["sw", companyId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const saveTemplate = useMutation({
    mutationFn: async (name: string) => {
      const { data: u } = await getCurrentUser();
      const { error } = await supabase
        .from("oms_standard_work_templates")
        .insert({ company_id: companyId!, user_id: u.user!.id, name, blocks: blocks as unknown as never });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: ["sw-templates", companyId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("oms_standard_work_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template deleted");
      qc.invalidateQueries({ queryKey: ["sw-templates", companyId] });
    },
  });

  const deleteSaved = useMutation({
    mutationFn: async () => {
      const { data: u } = await getCurrentUser();
      const { error } = await supabase
        .from("oms_standard_work")
        .delete()
        .eq("company_id", companyId!)
        .eq("user_id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved standard work deleted");
      setBlocks(DEFAULT_BLOCKS.map((b) => ({ ...b, id: uid() })));
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["sw", companyId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setDirty(true);
  };
  const removeBlock = (id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setDirty(true);
  };
  const addBlock = (day: Block["day"]) => {
    setBlocks((bs) => [
      ...bs,
      { id: uid(), day, start: "09:00", end: "10:00", title: "New block" },
    ]);
    setDirty(true);
  };
  const resetDefault = () => {
    setBlocks(DEFAULT_BLOCKS.map((b) => ({ ...b, id: uid() })));
    setDirty(true);
  };
  const applyTemplate = (tplId: string) => {
    const tpl = templatesQ.data?.find((t) => t.id === tplId);
    if (!tpl) return;
    setBlocks(tpl.blocks.map((b) => ({ ...b, id: uid() })));
    setDirty(true);
    toast.success(`Loaded template "${tpl.name}"`);
  };

  const byDay = useMemo(() => {
    const m = new Map<number, Block[]>();
    for (const d of DAYS) m.set(d.n, []);
    for (const b of blocks) m.get(b.day)?.push(b);
    for (const [, arr] of m) arr.sort((a, b) => a.start.localeCompare(b.start));
    return m;
  }, [blocks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly Standard Work</h2>
          <p className="text-sm text-muted-foreground">CEO / Head of Transformation weekly cadence across Strategy, Commercial, Operations and People.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {templatesQ.data && templatesQ.data.length > 0 && (
            <Select onValueChange={applyTemplate}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Load template…" /></SelectTrigger>
              <SelectContent>
                {templatesQ.data.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <SaveTemplateButton onSave={(name) => saveTemplate.mutateAsync(name)} pending={saveTemplate.isPending} />
          {templatesQ.data && templatesQ.data.length > 0 && (
            <ManageTemplatesButton
              templates={templatesQ.data}
              onDelete={(id) => deleteTemplate.mutateAsync(id)}
            />
          )}
          <Button variant="outline" size="sm" onClick={resetDefault}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset to default
          </Button>
          {workQ.data && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete saved
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete saved standard work?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your saved weekly cadence will be removed and reset to the default. Templates are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteSaved.mutateAsync()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button size="sm" onClick={() => save.mutateAsync()} disabled={!dirty || save.isPending || !companyId}>
            <Save className="mr-2 h-4 w-4" /> {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>

      <StandardWorkBoard
        byDay={byDay}
        onMove={(id, day) => updateBlock(id, { day })}
        onUpdate={updateBlock}
        onDelete={removeBlock}
        onAdd={addBlock}
      />
    </div>
  );
}

function StandardWorkBoard({
  byDay, onMove, onUpdate, onDelete, onAdd,
}: {
  byDay: Map<number, Block[]>;
  onMove: (id: string, day: Block["day"]) => void;
  onUpdate: (id: string, patch: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAdd: (day: Block["day"]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeBlock = useMemo(() => {
    if (!activeId) return null;
    for (const arr of byDay.values()) {
      const b = arr.find((x) => x.id === activeId);
      if (b) return b;
    }
    return null;
  }, [activeId, byDay]);

  const handleEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id as string | undefined;
    if (!overId) return;
    const activeId = e.active.id as string;
    let targetDay: Block["day"] | null = null;
    if (overId.startsWith("day-")) targetDay = Number(overId.slice(4)) as Block["day"];
    else {
      for (const [d, arr] of byDay) {
        if (arr.some((b) => b.id === overId)) { targetDay = d as Block["day"]; break; }
      }
    }
    if (targetDay) onMove(activeId, targetDay);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleEnd}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {DAYS.map((d) => (
          <DayColumn key={d.n} day={d} blocks={byDay.get(d.n)!} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay>
        {activeBlock && (
          <div className="rounded-md border border-primary bg-background p-2 text-sm shadow-lg">
            <p className="font-mono text-xs text-muted-foreground">{activeBlock.start}–{activeBlock.end}</p>
            <p className="mt-0.5 font-medium">{activeBlock.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DayColumn({
  day, blocks, onUpdate, onDelete, onAdd,
}: {
  day: { n: 1 | 2 | 3 | 4 | 5; label: string; theme: string };
  blocks: Block[];
  onUpdate: (id: string, patch: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAdd: (day: Block["day"]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.n}` });
  return (
    <div ref={setNodeRef} className={`rounded-lg border bg-card transition-colors ${isOver ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{day.label}</p>
        <p className="text-sm font-semibold">{day.theme}</p>
      </div>
      <div className="min-h-[80px] space-y-2 p-2">
        {blocks.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {day.n === 5 ? "Reserved for ad-hoc, buffer & deep work." : "Drop blocks here or add new."}
          </p>
        )}
        {blocks.map((b) => (
          <BlockCard
            key={b.id}
            block={b}
            onChange={(patch) => onUpdate(b.id, patch)}
            onDelete={() => onDelete(b.id)}
          />
        ))}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => onAdd(day.n)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add block
        </Button>
      </div>
    </div>
  );
}

function BlockCard({
  block, onChange, onDelete,
}: { block: Block; onChange: (p: Partial<Block>) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: block.id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border border-border bg-background p-2 text-sm ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Drag block"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted-foreground">{block.start}–{block.end}</p>
          <p className="mt-0.5 break-words font-medium leading-snug">{block.title}</p>
          {block.notes && <p className="mt-1 text-xs text-muted-foreground">{block.notes}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6"><Pencil className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit block</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={block.title} onChange={(e) => onChange({ title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start</Label>
                    <Input type="time" value={block.start} onChange={(e) => onChange({ start: e.target.value })} />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input type="time" value={block.end} onChange={(e) => onChange({ end: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Module link (optional)</Label>
                  <Input placeholder="/strategy/hoshin" value={block.link ?? ""} onChange={(e) => onChange({ link: e.target.value || undefined })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={block.notes ?? ""} onChange={(e) => onChange({ notes: e.target.value || undefined })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {block.link && (
        <Link to={block.link} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Open <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function SaveTemplateButton({ onSave, pending }: { onSave: (name: string) => Promise<unknown>; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><LayoutTemplate className="mr-2 h-4 w-4" /> Save as template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Save current week as template</DialogTitle></DialogHeader>
        <div>
          <Label>Template name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CEO default" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || pending}
            onClick={async () => { await onSave(name.trim()); setOpen(false); setName(""); }}
          >Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageTemplatesButton({
  templates, onDelete,
}: {
  templates: { id: string; name: string }[];
  onDelete: (id: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Manage templates</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Templates</DialogTitle></DialogHeader>
        <ul className="divide-y divide-border">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <span className="text-sm">{t.name}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{t.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>This template will be removed.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(t.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
