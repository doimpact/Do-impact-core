import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useNumberFormat } from "@/lib/number-format";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadWfViewPrefs, saveWfViewPrefs } from "@/lib/waterfall-view-prefs";
import { isWorkstreamNotStarted } from "@/lib/not-started";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Plus, Pencil, Settings2, Trash2, Archive, ArchiveRestore, Calendar, CheckSquare, Square, X, DollarSign, TrendingUp, ListChecks } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { MilestonesEditor, type Milestone } from "@/components/strategy/milestones-editor";

import { type Stage } from "@/lib/finance";
import { ObjectiveBenefitsDialog, ObjectiveKpisDialog, ObjectiveDialog, ObjectiveCard, type Objective, type Theme } from "@/routes/_authenticated/strategy/index";
import { ItemActionsDialog } from "@/routes/_authenticated/strategy/waterfall";

const WS_STAGES: { key: Stage; label: string; sub: string }[] = [
  { key: "L1", label: "L1", sub: "Identified" },
  { key: "L3", label: "L2", sub: "Planned" },
  { key: "L4", label: "L3", sub: "Executed" },
  { key: "L5", label: "L4", sub: "Realized" },
];
import { useMyRoles, canEditStrategy } from "@/hooks/use-my-roles";
import { confirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/strategy/initiatives")({
  head: () => ({ meta: [{ title: "Workstreams — DO.Impact" }] }),
  component: InitiativesPage,
});

type Workstream = { id: string; name: string; archived_at?: string | null };

type Initiative = {
  id: string;
  workstream_id: string;
  owner_id: string | null;
  title: string;
  current_stage: Stage;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  milestones: Milestone[];
  locked: boolean;
  archived_at: string | null;
  source_objective_id: string | null;
  source_waterfall_item_id: string | null;
};

function InitiativesPage() {
  useNumberFormat(); // re-render when the money display setting changes
  const qc = useQueryClient();
  const [selectedWs, setSelectedWs] = useState<string | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [hideNotStarted, setHideNotStarted] = useState(() => loadWfViewPrefs().hideNotStarted);
  useEffect(() => {
    saveWfViewPrefs({ ...loadWfViewPrefs(), hideNotStarted });
  }, [hideNotStarted]);

  const [editing, setEditing] = useState<Initiative | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wsDialogOpen, setWsDialogOpen] = useState(false);
  


  const workstreamsQ = useQuery({
    queryKey: ["workstreams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workstreams")
        .select("id,name,archived_at")
        .order("name");

      if (error) throw error;
      return (data ?? []) as Workstream[];
    },
  });
  const initiativesQ = useQuery({
    queryKey: ["initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("id,workstream_id,owner_id,title,current_stage,progress,start_date,end_date,milestones,locked,archived_at,source_objective_id,source_waterfall_item_id");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        milestones: Array.isArray(r.milestones) ? r.milestones : [],
      })) as Initiative[];
    },
  });
  const strategyQ = useQuery({
    queryKey: ["strategy-horizon"],
    queryFn: async () => {
      const { data } = await supabase.from("strategies").select("horizon_start_year").limit(1).maybeSingle();
      return (data?.horizon_start_year as number | undefined) ?? new Date().getFullYear();
    },
  });
  const themesQ = useQuery({
    queryKey: ["strategy-themes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("strategic_themes").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Theme[];
    },
  });
  const objectivesQ = useQuery({
    queryKey: ["strategy-objectives"],
    queryFn: async () => {
      const { data, error } = await supabase.from("strategic_objectives").select("*").order("horizon_year");
      if (error) throw error;
      return (data ?? []) as Objective[];
    },
  });
  const benefitsQ = useQuery({
    queryKey: ["objective-benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objective_monthly_benefits")
        .select("objective_id,value");
      if (error) throw error;
      return (data ?? []) as { objective_id: string; value: number }[];
    },
  });
  const benefitTotals = (benefitsQ.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.objective_id] = (acc[r.objective_id] ?? 0) + Number(r.value || 0);
    return acc;
  }, {});

  const startYear = strategyQ.data ?? new Date().getFullYear();

  const { data: roles = [] } = useMyRoles();
  const canEdit = canEditStrategy(roles);

  const allInitiatives = initiativesQ.data ?? [];
  const initiatives = showArchived ? allInitiatives : allInitiatives.filter((i) => !i.archived_at);
  const workstreams = workstreamsQ.data ?? [];

  const filtered = useMemo(
    () => {
      const base = selectedWs === "all" ? initiatives : initiatives.filter((i) => i.workstream_id === selectedWs);
      return hideNotStarted ? base.filter((i) => !isWorkstreamNotStarted(i)) : base;
    },
    [initiatives, selectedWs, hideNotStarted],
  );


  const avgProgress =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, i) => s + (i.progress || 0), 0) / filtered.length)
      : 0;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["initiatives"] });
    qc.invalidateQueries({ queryKey: ["workstreams"] });
    qc.invalidateQueries({ queryKey: ["strategy-objectives"] });
    qc.invalidateQueries({ queryKey: ["objective-benefits"] });
  };

  const objectives = objectivesQ.data ?? [];
  const themes = themesQ.data ?? [];
  const objectiveById = new Map(objectives.map((o) => [o.id, o]));




  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workstreams</h1>
          <p className="text-sm text-muted-foreground">
            Kanban of workstreams by stage — track progress, owners, dates and milestones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedWs} onValueChange={(v) => setSelectedWs(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All workstreams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workstreams</SelectItem>
              {workstreams.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={hideNotStarted} onChange={(e) => setHideNotStarted(e.target.checked)} />
            Hide not started
          </label>

          <Button variant="outline" size="sm" onClick={() => setWsDialogOpen(true)}>
            <Settings2 className="mr-1 h-4 w-4" /> Groups
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            disabled={workstreams.length === 0}
          >
            <Plus className="mr-1 h-4 w-4" /> New workstream
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-card p-4">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Average progress across {filtered.length} workstream{filtered.length === 1 ? "" : "s"}</span>
          <span className="tabular-nums font-medium">{avgProgress}%</span>
        </div>
        <Progress value={avgProgress} />
      </div>

      {workstreams.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Create a group first to start adding workstreams.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {WS_STAGES.map((stage) => {
          const col = filtered.filter((i) => i.current_stage === stage.key);
          return (
            <div key={stage.key} className="flex min-h-[360px] flex-col">
              <div className="mb-2 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{stage.sub}</span>
                </div>
                <Badge variant="secondary" className="tabular-nums">{col.length}</Badge>
              </div>
              <div className="flex-1 space-y-2 rounded-md border bg-muted/40 p-2">
                {col.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">Empty</div>
                ) : (
                  col.map((i) => {
                    const linkedObj = i.source_objective_id ? objectiveById.get(i.source_objective_id) : null;
                    if (linkedObj) {
                      return (
                        <ObjectiveCard
                          key={i.id}
                          obj={linkedObj}
                          canEdit={canEdit}
                          themes={themes}
                          startYear={startYear}
                          benefitTotal={benefitTotals[linkedObj.id] ?? 0}
                          onChanged={invalidate}
                          onBenefitsChanged={invalidate}
                        />
                      );
                    }
                    return (
                      <InitiativeCard
                        key={i.id}
                        i={i}
                        startYear={startYear}
                        canEdit={canEdit}
                        onOpen={() => { setEditing(i); setDialogOpen(true); }}
                        onSaved={invalidate}
                      />
                    );
                  })


                )}
              </div>
            </div>
          );
        })}
      </div>

      <InitiativeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        workstreams={workstreams}
        onSaved={invalidate}
      />
      <WorkstreamsDialog
        open={wsDialogOpen}
        onOpenChange={setWsDialogOpen}
        workstreams={workstreams}
        onChanged={invalidate}
      />


    </div>
  );
}


function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function InitiativeCard({
  i,
  startYear,
  canEdit,
  onOpen,
  onSaved,
}: {
  i: Initiative;
  startYear: number;
  canEdit: boolean;
  onOpen: () => void;
  onSaved: () => void;
}) {
  const { data: profiles = [] } = useProfiles();
  const owner = i.owner_id ? profiles.find((p) => p.id === i.owner_id) : undefined;
  const doneMs = i.milestones.filter((m) => m.done).length;
  const totalMs = i.milestones.length;
  const dateRange = [fmtDate(i.start_date), fmtDate(i.end_date)].filter(Boolean).join(" → ");
  const linked = !!i.source_objective_id;
  const linkedWaterfall = (i as any).source_waterfall_item_id as string | null | undefined;
  const [actionsOpen, setActionsOpen] = useState(false);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <Card className="group cursor-pointer p-3 transition-shadow hover:shadow-sm" onClick={onOpen}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-tight">{i.title}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">👤 {ownerLabel(owner)}</div>
        </div>
        {i.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span className="tabular-nums font-medium text-foreground">{i.progress ?? 0}%</span>
        </div>
        <Progress value={i.progress ?? 0} className="h-1.5" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {dateRange && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {dateRange}
          </span>
        )}
        {totalMs > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckSquare className="h-3 w-3" /> {doneMs}/{totalMs} milestones
          </span>
        )}
      </div>
      {linked && i.source_objective_id && (
        <div className="mt-2 flex items-center justify-between border-t pt-2" onClick={stop}>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Roadmap objective</span>
          <div className="flex gap-0.5">
            <ObjectiveBenefitsDialog
              objectiveId={i.source_objective_id}
              objectiveTitle={i.title}
              startYear={startYear}
              onSaved={onSaved}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Monthly benefits">
                  <DollarSign className="h-3 w-3" />
                </Button>
              }
            />
            <ObjectiveKpisDialog
              objectiveId={i.source_objective_id}
              objectiveTitle={i.title}
              canEdit={canEdit}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Leading & lagging KPIs">
                  <TrendingUp className="h-3 w-3" />
                </Button>
              }
            />
          </div>
        </div>
      )}
      {linkedWaterfall && (
        <div className="mt-2 flex items-center justify-between border-t pt-2" onClick={stop}>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Waterfall lever</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" title="Actions" onClick={() => setActionsOpen(true)}>
            <ListChecks className="h-3 w-3" />
          </Button>
        </div>
      )}
      {actionsOpen && linkedWaterfall && (
        <div onClick={stop}>
          <ItemActionsDialog
            item={{ id: linkedWaterfall, label: i.title }}
            onClose={() => setActionsOpen(false)}
            onChanged={onSaved}
          />
        </div>
      )}
    </Card>
  );
}

function InitiativeDialog({
  open,
  onOpenChange,
  initial,
  workstreams,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Initiative | null;
  workstreams: Workstream[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [wsId, setWsId] = useState<string>("");
  const [stage, setStage] = useState<Stage>("L1");
  const [progress, setProgress] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [locked, setLocked] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setWsId(initial?.workstream_id ?? workstreams[0]?.id ?? "");
      setStage(initial?.current_stage ?? "L1");
      setProgress(initial?.progress ?? 0);
      setStartDate(initial?.start_date ?? "");
      setEndDate(initial?.end_date ?? "");
      setMilestones(initial?.milestones ?? []);
      setLocked(initial?.locked ?? false);
      setOwnerId(initial?.owner_id ?? null);
    }
  }, [open, initial, workstreams]);

  const save = async () => {
    if (!title.trim() || !wsId) return toast.error("Title and group required");
    const { data: userData } = await getCurrentUser();
    const payload: any = {
      title,
      workstream_id: wsId,
      current_stage: stage,
      progress: Math.max(0, Math.min(100, Number(progress) || 0)),
      start_date: startDate || null,
      end_date: endDate || null,
      milestones,
      locked,
      owner_id: ownerId ?? initial?.owner_id ?? userData.user?.id ?? null,
    };
    if (initial) {
      const { error } = await supabase.from("initiatives").update(payload).eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("initiatives").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    onSaved();
    onOpenChange(false);
  };

  const remove = async () => {
    if (!initial) return;
    if (!(await confirmDialog(`Delete workstream "${initial.title}"?`))) return;
    const { error } = await supabase.from("initiatives").delete().eq("id", initial.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onSaved();
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit workstream" : "New workstream"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Group</label>
              <Select value={wsId} onValueChange={setWsId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {workstreams.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Stage</label>
              <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                {WS_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label} · {s.sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Progress</label>
              <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => setProgress(v[0] ?? 0)}
              className="mt-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Start date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">End date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Owner</label>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
          <MilestonesEditor value={milestones} onChange={setMilestones} />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
            />
            Lock (finance-validated baseline)
          </label>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex gap-2">
            {initial && (
              <Button variant="ghost" className="text-red-600" onClick={remove}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            )}
            {initial && (
              <Button
                variant="ghost"
                onClick={async () => {
                  const archived = !!initial.archived_at;
                  const { error } = await supabase.from("initiatives")
                    .update({ archived_at: archived ? null : new Date().toISOString() })
                    .eq("id", initial.id);
                  if (error) return toast.error(error.message);
                  toast.success(archived ? "Restored" : "Archived");
                  onSaved();
                  onOpenChange(false);
                }}
              >
                <Archive className="mr-1 h-4 w-4" /> {initial.archived_at ? "Unarchive" : "Archive"}
              </Button>
            )}
          </div>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkstreamsDialog({
  open,
  onOpenChange,
  workstreams,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workstreams: Workstream[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase
      .from("workstreams")
      .insert({ name, target_value_usd: 0 });
    if (error) return toast.error(error.message);
    setName("");
    onChanged();
  };

  const visible = showArchived ? workstreams : workstreams.filter((w) => !w.archived_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Groups</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {visible.length === 0 && (
            <div className="text-sm text-muted-foreground">No groups yet.</div>
          )}
          {visible.map((w) => (
            <div key={w.id} className={`flex items-center gap-2 rounded border p-2 ${w.archived_at ? "opacity-60" : ""}`}>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {w.archived_at ? <span className="line-through">{w.name}</span> : w.name}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                title={w.archived_at ? "Restore" : "Archive"}
                onClick={async () => {
                  const { data: rows, error } = await supabase.from("workstreams")
                    .update({ archived_at: w.archived_at ? null : new Date().toISOString() })
                    .eq("id", w.id)
                    .select("id");
                  if (error) return toast.error(error.message);
                  if (!rows || rows.length === 0) return toast.error("Nothing was changed — this workspace is read-only or you don't have permission.");
                  toast.success(w.archived_at ? "Group restored" : "Group archived");
                  onChanged();
                }}
              >
                {w.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-600"
                onClick={async () => {
                  if (!(await confirmDialog(`Delete group "${w.name}"? Workstreams inside will also be deleted.`)))
                    return;
                  const { error } = await supabase.from("workstreams").delete().eq("id", w.id);
                  if (error) toast.error(error.message);
                  else onChanged();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t pt-3">
          <input
            type="checkbox"
            id="show-archived-groups"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <label htmlFor="show-archived-groups" className="text-xs text-muted-foreground">Show archived</label>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 border-t pt-3">
          <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={add}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

