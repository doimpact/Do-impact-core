import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useNumberFormat, formatMoney } from "@/lib/number-format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadWfViewPrefs, saveWfViewPrefs } from "@/lib/waterfall-view-prefs";
import { isObjectiveNotStarted } from "@/lib/not-started";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Target, Compass, Archive, CheckCircle2, Circle, TrendingUp, TrendingDown, Minus, DollarSign, ListChecks, AlertCircle } from "lucide-react";
import { useMyRoles, canEditStrategy } from "@/hooks/use-my-roles";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { MilestonesEditor, type Milestone } from "@/components/strategy/milestones-editor";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndustrialFramework } from "@/components/strategy/industrial-framework";
import { ImportStrategyDialog } from "@/components/strategy/import-strategy-dialog";
import { ValueDelivered } from "@/components/strategy/value-delivered";
import { PillarEngagementPanel } from "@/components/people/pillar-engagement-panel";
import { confirmDialog } from "@/components/confirm-dialog";
import {
  MonthlyBenefitsDialog,
  KpisDialog,
  KpiEditDialog,
  KpiRow as SharedKpiRow,
  OBJECTIVE_VT,
} from "@/components/strategy/value-tracking-dialogs";


export const Route = createFileRoute("/_authenticated/strategy/")({
  head: () => ({ meta: [{ title: "Strategy Foundation — DO.Impact" }] }),
  component: StrategyPage,
});

export type Theme = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  sort_order: number;
  archived_at?: string | null;
};
export type Objective = {
  id: string;
  theme_id: string | null;
  horizon_year: number;
  title: string;
  description: string | null;
  target_metric: string | null;
  owner_id: string | null;
  status: "not_started" | "on_track" | "at_risk" | "done";
  stage: "L1" | "L3" | "L4" | "L5";
};


const STAGE_OPTIONS: { key: Objective["stage"]; label: string; sub: string }[] = [
  { key: "L1", label: "L1", sub: "Identified" },
  { key: "L3", label: "L2", sub: "Planned" },
  { key: "L4", label: "L3", sub: "Executed" },
  { key: "L5", label: "L4", sub: "Realized" },
];
const STAGE_LABEL: Record<Objective["stage"], string> = { L1: "L1", L3: "L2", L4: "L3", L5: "L4" };

const STATUS_META: Record<Objective["status"], { label: string; dot: string; text: string }> = {
  not_started: { label: "Not started", dot: "bg-neutral-300", text: "text-neutral-600" },
  on_track: { label: "On track", dot: "bg-emerald-500", text: "text-emerald-700" },
  at_risk: { label: "At risk", dot: "bg-amber-500", text: "text-amber-700" },
  done: { label: "Done", dot: "bg-sky-500", text: "text-sky-700" },
};

const THEME_COLORS = ["#e85d3a", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

function StrategyPage() {
  useNumberFormat(); // re-render when the money display setting changes
  const qc = useQueryClient();
  const { data: roles = [] } = useMyRoles();
  const canEdit = canEditStrategy(roles);

  const strategyQ = useQuery({
    queryKey: ["strategy"],
    queryFn: async () => {
      const { data, error } = await supabase.from("strategies").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const themesQ = useQuery({
    queryKey: ["strategy-themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_themes")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Theme[];
    },
  });
  const objectivesQ = useQuery({
    queryKey: ["strategy-objectives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_objectives")
        .select("*")
        .order("horizon_year");
      if (error) throw error;
      return (data ?? []) as (Objective & { archived_at: string | null })[];
    },
  });
  const benefitsQ = useQuery({
    queryKey: ["objective-benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objective_monthly_benefits")
        .select("objective_id,year,month,value,actual");
      if (error) throw error;
      return (data ?? []) as { objective_id: string; year: number; month: number; value: number; actual: number }[];
    },
  });


  const strategy = strategyQ.data;
  const allThemes = themesQ.data ?? [];
  const allObjectives = objectivesQ.data ?? [];
  const [showArchived, setShowArchived] = useState(false);
  const [hideNotStarted, setHideNotStarted] = useState(() => loadWfViewPrefs().hideNotStarted);
  useEffect(() => {
    saveWfViewPrefs({ ...loadWfViewPrefs(), hideNotStarted });
  }, [hideNotStarted]);
  const themes = showArchived ? allThemes : allThemes.filter((t) => !t.archived_at);
  const objectivesByArchive = showArchived ? allObjectives : allObjectives.filter((o) => !o.archived_at);
  const objectives = hideNotStarted
    ? objectivesByArchive.filter((o) => !isObjectiveNotStarted(o))
    : objectivesByArchive;

  const startYear = strategy?.horizon_start_year ?? new Date().getFullYear();

  const [visionOpen, setVisionOpen] = useState(false);
  const [visionText, setVisionText] = useState("");
  const [missionText, setMissionText] = useState("");
  const [horizon, setHorizon] = useState<number>(startYear);

  const invalidateStrategy = () => qc.invalidateQueries({ queryKey: ["strategy"] });
  const invalidateThemes = () => qc.invalidateQueries({ queryKey: ["strategy-themes"] });
  const invalidateObj = () => qc.invalidateQueries({ queryKey: ["strategy-objectives"] });
  const invalidateBenefits = () => qc.invalidateQueries({ queryKey: ["objective-benefits"] });

  const benefitTotals = (benefitsQ.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.objective_id] = (acc[r.objective_id] ?? 0) + Number(r.value || 0);
    return acc;
  }, {});

  const saveStrategy = useMutation({
    mutationFn: async () => {
      if (!strategy) return;
      const { error } = await supabase
        .from("strategies")
        .update({
          vision: visionText,
          mission: missionText,
          horizon_start_year: horizon,
        })
        .eq("id", strategy.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      invalidateStrategy();
      setVisionOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  return (
    <Tabs defaultValue="foundation" className="space-y-6">
      <TabsList>
        <TabsTrigger value="foundation">Strategy Foundation</TabsTrigger>
        <TabsTrigger value="framework">Industrial Strategy Framework</TabsTrigger>
      </TabsList>

      <TabsContent value="framework" className="mt-0">
        <IndustrialFramework canEdit={canEdit} />
      </TabsContent>

      <TabsContent value="foundation" className="mt-0 space-y-8">
      {/* Vision hero */}
      <section className="relative overflow-hidden rounded-2xl bg-neutral-900 p-8 text-neutral-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#e85d3a,_transparent_55%)] opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
            <Compass className="h-3.5 w-3.5" /> Vision · {startYear}–{startYear + 2}
          </div>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight md:text-4xl">
            {strategy?.vision || "Define the future you're building toward."}
          </h1>
          {strategy?.mission ? (
            <p className="mt-4 max-w-3xl text-neutral-300">{strategy.mission}</p>
          ) : (
            <p className="mt-4 max-w-3xl italic text-neutral-400">
              Add a mission — why the company exists today.
            </p>
          )}
          {canEdit && (
            <div className="mt-6">
              <Dialog
                open={visionOpen}
                onOpenChange={(v) => {
                  setVisionOpen(v);
                  if (v) {
                    setVisionText(strategy?.vision ?? "");
                    setMissionText(strategy?.mission ?? "");
                    setHorizon(startYear);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit vision & mission
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vision, mission & horizon</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Vision (10+ year north star)</label>
                      <Textarea rows={3} value={visionText} onChange={(e) => setVisionText(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Mission (why we exist today)</label>
                      <Textarea rows={3} value={missionText} onChange={(e) => setMissionText(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-medium">3-year horizon start year</label>
                      <Input
                        type="number"
                        value={horizon}
                        onChange={(e) => setHorizon(parseInt(e.target.value) || startYear)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => saveStrategy.mutate()} disabled={saveStrategy.isPending}>
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </section>

      <PillarEngagementPanel pillar="strategy" />


      {/* Themes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-4 w-4" /> Strategic themes
            </h2>
            <p className="text-xs text-muted-foreground">
              The 3–5 bets that will define the next three years.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={hideNotStarted} onChange={(e) => setHideNotStarted(e.target.checked)} />
              Hide not started
            </label>

            {canEdit && <ImportStrategyDialog kind="themes" />}
            {canEdit && <ThemeDialog onSaved={invalidateThemes} nextSortOrder={themes.length} />}
          </div>
        </div>
        {themes.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No themes yet. Add 3–5 strategic themes to anchor the plan.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => {
              const archived = !!t.archived_at;
              return (
              <div key={t.id} className={`relative rounded-lg border border-neutral-200 bg-card p-4 ${archived ? "opacity-60" : ""}`}>
                <div className="mb-3 h-1 rounded-full" style={{ background: t.color ?? "#e85d3a" }} />
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">
                    {t.title}
                    {archived && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">archived</span>}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <ThemeDialog
                        initial={t}
                        onSaved={invalidateThemes}
                        trigger={
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={archived ? "Unarchive" : "Archive"}
                        onClick={async () => {
                          const { error } = await supabase
                            .from("strategic_themes")
                            .update({ archived_at: archived ? null : new Date().toISOString() })
                            .eq("id", t.id);
                          if (error) toast.error(error.message);
                          else { toast.success(archived ? "Restored" : "Archived"); invalidateThemes(); }
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={async () => {
                          if (!(await confirmDialog({
                            title: `Delete theme "${t.title}"?`,
                            description: "Objectives linked to this theme are kept — they simply lose the theme link.",
                          }))) return;
                          const { error } = await supabase
                            .from("strategic_themes")
                            .delete()
                            .eq("id", t.id);
                          if (error) toast.error(error.message);
                          else { toast.success("Theme deleted"); invalidateThemes(); }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {t.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                )}
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Roadmap */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">3-year roadmap</h2>
            <p className="text-xs text-muted-foreground">Objectives per year, grouped by theme.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={hideNotStarted} onChange={(e) => setHideNotStarted(e.target.checked)} />
              Hide not started
            </label>

            {canEdit && <ImportStrategyDialog kind="objectives" />}
            {canEdit && <ObjectiveDialog themes={themes} onSaved={invalidateObj} />}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {([1, 2, 3] as const).map((y) => {
            const yearObjectives = objectives.filter((o) => o.horizon_year === y);
            const groups = themes
              .map((t) => ({ theme: t, items: yearObjectives.filter((o) => o.theme_id === t.id) }))
              .concat([
                {
                  theme: {
                    id: "__none",
                    title: "Unassigned",
                    description: null,
                    color: "#9ca3af",
                    sort_order: 999,
                  },
                  items: yearObjectives.filter((o) => !o.theme_id),
                },
              ])
              .filter((g) => g.items.length > 0);
            return (
              <div key={y} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-neutral-500">Year {y}</div>
                    <div className="text-xl font-bold">{startYear + (y - 1)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {yearObjectives.length} objective{yearObjectives.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="space-y-2">
                  {yearObjectives.length === 0 && (
                    <div className="py-6 text-center text-xs italic text-muted-foreground">
                      Nothing planned yet.
                    </div>
                  )}
                  {groups.map((g) => (
                    <div key={g.theme.id} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
                        <span
                          className="h-2 w-2 rounded-sm"
                          style={{ background: g.theme.color ?? "#9ca3af" }}
                        />
                        {g.theme.title}
                      </div>
                      {g.items.map((o) => (
                        <ObjectiveCard
                          key={o.id}
                          obj={o}
                          canEdit={canEdit}
                          themes={themes}
                          startYear={startYear}
                          benefitTotal={benefitTotals[o.id] ?? 0}
                          onChanged={invalidateObj}
                          onBenefitsChanged={invalidateBenefits}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Value delivered */}
      <ValueDelivered
        objectives={objectives}
        themes={themes}
        benefits={benefitsQ.data ?? []}
        startYear={startYear}
      />

      {/* Follow-up on objectives */}
      <ValueDriverTree
        objectives={objectives}
        themes={themes}
        canEdit={canEdit}
        vision={strategy?.vision ?? null}
        startYear={startYear}
        benefitTotals={benefitTotals}
        onChanged={invalidateObj}
        onBenefitsChanged={invalidateBenefits}
      />
      </TabsContent>
    </Tabs>
  );
}

function ThemeDialog({
  initial,
  trigger,
  onSaved,
  nextSortOrder,
}: {
  initial?: Theme;
  trigger?: React.ReactNode;
  onSaved: () => void;
  nextSortOrder?: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? THEME_COLORS[0]);

  const save = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (initial) {
      const { error } = await supabase
        .from("strategic_themes")
        .update({ title, description, color })
        .eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("strategic_themes")
        .insert({ title, description, color, sort_order: nextSortOrder ?? 0 });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    onSaved();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> New theme
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit theme" : "New strategic theme"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Color</label>
            <div className="mt-1 flex gap-2">
              {THEME_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-neutral-900" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ObjectiveDialog({
  themes,
  initial,
  trigger,
  onSaved,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  themes: Theme[];
  initial?: Objective;
  trigger?: React.ReactNode;
  onSaved: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(v);
    else setInternalOpen(v);
  };

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [target, setTarget] = useState(initial?.target_metric ?? "");
  const [themeId, setThemeId] = useState<string>(initial?.theme_id ?? "__none");
  const [year, setYear] = useState<number>(initial?.horizon_year ?? 1);
  const [status, setStatus] = useState<Objective["status"]>(initial?.status ?? "not_started");
  const [ownerId, setOwnerId] = useState<string | null>(initial?.owner_id ?? null);
  const [stage, setStage] = useState<Objective["stage"]>(initial?.stage ?? "L1");
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Milestones live on the mirrored workstream row so both views stay in sync.
  useEffect(() => {
    if (!open || !initial) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("milestones")
        .eq("source_objective_id", initial.id)
        .maybeSingle();
      if (cancelled) return;
      const raw = (data as { milestones?: unknown } | null)?.milestones;
      setMilestones(Array.isArray(raw) ? (raw as Milestone[]) : []);
    })();
    return () => { cancelled = true; };
  }, [open, initial]);

  const saveMilestones = async (objectiveId: string) => {
    const { error } = await supabase
      .from("initiatives")
      .update({ milestones: milestones as unknown as never })
      .eq("source_objective_id", objectiveId);
    if (error) toast.error(`Milestones: ${error.message}`);
  };

  const save = async () => {
    if (!title.trim()) return toast.error("Title required");
    const { data: userData } = await getCurrentUser();
    const payload = {
      title,
      description,
      target_metric: target,
      theme_id: themeId === "__none" ? null : themeId,
      horizon_year: year,
      status,
      stage,
      owner_id: ownerId ?? initial?.owner_id ?? userData.user?.id ?? null,
    };
    if (initial) {
      const { error } = await supabase
        .from("strategic_objectives")
        .update(payload)
        .eq("id", initial.id);
      if (error) return toast.error(error.message);
      await saveMilestones(initial.id);
    } else {
      const { data: created, error } = await supabase
        .from("strategic_objectives")
        .insert(payload)
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      if (created?.id && milestones.length > 0) await saveMilestones(created.id);
    }
    toast.success("Saved");
    setMilestones([]);
    onSaved();
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> New objective
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

        <DialogHeader>
          <DialogTitle>{initial ? "Edit objective" : "New objective"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea rows={2} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Target metric</label>
            <Input value={target ?? ""} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. +15% EBITDA" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Theme</label>
              <Select value={themeId} onValueChange={setThemeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Year</label>
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Year 1</SelectItem>
                  <SelectItem value="2">Year 2</SelectItem>
                  <SelectItem value="3">Year 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as Objective["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as Objective["status"][]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Stage (workstream)</label>
              <Select value={stage} onValueChange={(v) => setStage(v as Objective["stage"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>{s.label} — {s.sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Owner</label>
              <OwnerSelect value={ownerId} onChange={setOwnerId} />
            </div>
          </div>
          <MilestonesEditor value={milestones} onChange={setMilestones} />
        </div>

        <DialogFooter>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ObjectiveCard({
  obj,
  canEdit,
  themes,
  startYear,
  benefitTotal,
  onChanged,
  onBenefitsChanged,
}: {
  obj: Objective & { archived_at?: string | null };
  canEdit: boolean;
  themes: Theme[];
  startYear: number;
  benefitTotal: number;
  onChanged: () => void;
  onBenefitsChanged: () => void;
}) {
  const meta = STATUS_META[obj.status];
  const archived = !!obj.archived_at;
  const { data: profiles = [] } = useProfiles();
  const owner = obj.owner_id ? profiles.find((p) => p.id === obj.owner_id) : undefined;
  const actionsQ = useQuery({
    queryKey: ["obj-actions-summary", obj.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objective_actions")
        .select("id,status,due_date,archived_at")
        .eq("objective_id", obj.id);
      if (error) throw error;
      return (data ?? []) as { id: string; status: string; due_date: string | null; archived_at: string | null }[];
    },
    staleTime: 30_000,
  });
  const openActions = (actionsQ.data ?? []).filter((a) => !a.archived_at && a.status !== "done");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = openActions.some((a) => a.due_date && a.due_date < today);
  const milestonesQ = useQuery({
    queryKey: ["obj-milestones-summary", obj.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("milestones")
        .eq("source_objective_id", obj.id)
        .maybeSingle();
      if (error) throw error;
      const raw = (data as { milestones?: unknown } | null)?.milestones;
      return Array.isArray(raw) ? (raw as Milestone[]) : [];
    },
    staleTime: 30_000,
  });
  const msAll = milestonesQ.data ?? [];
  const msDone = msAll.filter((m) => m.done).length;

  return (
    <div className={`rounded-md border border-neutral-200 bg-card p-2.5 ${archived ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-tight">{obj.title}</div>
          {obj.target_metric && (
            <div className="mt-0.5 text-xs text-muted-foreground">🎯 {obj.target_metric}</div>
          )}
          <div className="mt-0.5 text-[11px] text-muted-foreground">👤 {ownerLabel(owner)}</div>
        </div>
        {canEdit && (
          <div className="flex gap-0.5">
            <ObjectiveBenefitsDialog
              objectiveId={obj.id}
              objectiveTitle={obj.title}
              startYear={startYear}
              onSaved={onBenefitsChanged}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Monthly benefits">
                  <DollarSign className="h-3 w-3" />
                </Button>
              }
            />
            <ObjectiveKpisDialog
              objectiveId={obj.id}
              objectiveTitle={obj.title}
              canEdit={canEdit}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Leading & lagging KPIs">
                  <TrendingUp className="h-3 w-3" />
                </Button>
              }
            />
            <ObjectiveActionsDialog
              objectiveId={obj.id}
              objectiveTitle={obj.title}
              canEdit={canEdit}
              onChanged={() => actionsQ.refetch()}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6 relative" title="Actions">
                  <ListChecks className="h-3 w-3" />
                  {openActions.length > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-semibold flex items-center justify-center ${overdue ? "bg-red-600 text-white" : "bg-neutral-700 text-white"}`}>
                      {openActions.length}
                    </span>
                  )}
                </Button>
              }
            />
            <ObjectiveDialog
              themes={themes}
              initial={obj}
              onSaved={() => { onChanged(); milestonesQ.refetch(); }}
              trigger={
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Pencil className="h-3 w-3" />
                </Button>
              }
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title={archived ? "Unarchive" : "Archive"}
              onClick={async () => {
                const { error } = await supabase
                  .from("strategic_objectives")
                  .update({ archived_at: archived ? null : new Date().toISOString() })
                  .eq("id", obj.id);
                if (error) toast.error(error.message);
                else { toast.success(archived ? "Restored" : "Archived"); onChanged(); }
              }}
            >
              <Archive className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-red-600"
              onClick={async () => {
                if (!(await confirmDialog(`Delete "${obj.title}"?`))) return;
                const { error } = await supabase
                  .from("strategic_objectives")
                  .delete()
                  .eq("id", obj.id);
                if (error) toast.error(error.message);
                else onChanged();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <span className={`text-[11px] ${meta.text}`}>{meta.label}</span>
          <span className="rounded border border-neutral-300 bg-neutral-50 px-1 py-px text-[10px] font-semibold text-neutral-700" title="Workstream stage">
            {STAGE_LABEL[obj.stage]}
          </span>
          {archived && <span className="text-[10px] text-muted-foreground">· archived</span>}
          {msAll.length > 0 && (
            <span className="text-[10px] text-muted-foreground" title="Milestones complete">
              🏁 {msDone}/{msAll.length}
            </span>
          )}
          {openActions.length > 0 && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] ${overdue ? "text-red-600" : "text-muted-foreground"}`} title={overdue ? "Has overdue actions" : "Open actions"}>
              {overdue && <AlertCircle className="h-2.5 w-2.5" />}
              {openActions.length} action{openActions.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {benefitTotal > 0 && (
          <span className="text-[11px] tabular-nums font-medium text-emerald-700" title="Total planned benefit over 3 years">
            {formatMoney(benefitTotal)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ObjectiveKpisDialog({
  objectiveId,
  objectiveTitle,
  canEdit,
  trigger,
}: {
  objectiveId: string;
  objectiveTitle: string;
  canEdit: boolean;
  trigger: React.ReactNode;
}) {
  return (
    <KpisDialog
      cfg={OBJECTIVE_VT}
      parentId={objectiveId}
      parentTitle={objectiveTitle}
      canEdit={canEdit}
      trigger={trigger}
    />
  );
}

const ACTION_ROW_STATUS_CLS: Record<"open" | "in_progress" | "done" | "blocked", string> = {
  open: "bg-neutral-100 text-neutral-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
};



export function ObjectiveActionsDialog({
  objectiveId,
  objectiveTitle,
  canEdit,
  trigger,
  onChanged,
}: {
  objectiveId: string;
  objectiveTitle: string;
  canEdit: boolean;
  trigger: React.ReactNode;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const actionsQ = useQuery({
    queryKey: ["obj-actions", objectiveId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objective_actions")
        .select("*")
        .eq("objective_id", objectiveId)
        .order("archived_at", { ascending: true, nullsFirst: true })
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ObjAction[];
    },
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["obj-actions", objectiveId] });
    qc.invalidateQueries({ queryKey: ["obj-actions-summary", objectiveId] });
    onChanged?.();
  };
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState<string | null>(null);
  const [newDue, setNewDue] = useState<string>("");

  const addAction = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const { error } = await (supabase as any).from("objective_actions").insert({
      objective_id: objectiveId,
      title,
      owner_id: newOwner,
      due_date: newDue || null,
      status: "open",
    });
    if (error) return toast.error(error.message);
    setNewTitle(""); setNewOwner(null); setNewDue("");
    invalidate();
  };

  const actions = actionsQ.data ?? [];
  const active = actions.filter((a) => !a.archived_at);
  const archived = actions.filter((a) => !!a.archived_at);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{objectiveTitle} — Actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {active.length === 0 && (
            <div className="text-sm text-muted-foreground">No actions yet.</div>
          )}
          {active.map((a) => (
            <ObjectiveActionRow key={a.id} action={a} canEdit={canEdit} onChanged={invalidate} today={today} />
          ))}
          {canEdit && (
            <div className="rounded border border-dashed border-neutral-300 p-2 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Add action</div>
              <div className="grid gap-2 md:grid-cols-[1fr_180px_150px_auto]">
                <Input placeholder="Action title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <OwnerSelect value={newOwner} onChange={setNewOwner} placeholder="Owner" />
                <Input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
                <Button onClick={addAction} disabled={!newTitle.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          )}
          {archived.length > 0 && (
            <details className="rounded border border-neutral-200 p-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">Archived ({archived.length})</summary>
              <div className="mt-2 space-y-2">
                {archived.map((a) => (
                  <ObjectiveActionRow key={a.id} action={a} canEdit={canEdit} onChanged={invalidate} today={today} />
                ))}
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ObjectiveActionRow({
  action, canEdit, onChanged, today,
}: {
  action: ObjAction;
  canEdit: boolean;
  onChanged: () => void;
  today: string;
}) {
  const isArchived = !!action.archived_at;
  const overdue = !isArchived && action.status !== "done" && action.due_date && action.due_date < today;
  const cls = ACTION_ROW_STATUS_CLS[action.status];

  const patch = async (fields: Partial<ObjAction>) => {
    const { error } = await (supabase as any)
      .from("objective_actions")
      .update(fields)
      .eq("id", action.id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <div className={`grid gap-2 md:grid-cols-[1fr_180px_150px_140px_auto] items-center rounded border border-neutral-200 p-2 ${isArchived ? "opacity-60" : ""}`}>
      <Input
        defaultValue={action.title}
        disabled={!canEdit || isArchived}
        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== action.title) patch({ title: v }); }}
      />
      <OwnerSelect
        value={action.owner_id}
        onChange={(v) => patch({ owner_id: v })}
      />
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={action.due_date ?? ""}
          disabled={!canEdit || isArchived}
          onChange={(e) => patch({ due_date: e.target.value || null })}
        />
        {overdue && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
      </div>
      <Select
        value={action.status}
        onValueChange={(v) => patch({ status: v as ObjAction["status"], completed_at: v === "done" ? new Date().toISOString() : null } as any)}
      >
        <SelectTrigger className={`h-9 ${cls}`}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In progress</SelectItem>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
        </SelectContent>
      </Select>
      {canEdit && (
        <div className="flex gap-0.5 justify-end">
          <Button
            size="icon" variant="ghost" className="h-7 w-7"
            title={isArchived ? "Unarchive" : "Archive"}
            onClick={() => patch({ archived_at: isArchived ? null : new Date().toISOString() })}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost" className="h-7 w-7 text-red-600"
            title="Delete"
            onClick={async () => {
              if (!(await confirmDialog(`Delete action "${action.title}"?`))) return;
              const { error } = await (supabase as any).from("objective_actions").delete().eq("id", action.id);
              if (error) return toast.error(error.message);
              onChanged();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ObjectiveBenefitsDialog({
  objectiveId,
  objectiveTitle,
  startYear,
  trigger,
  onSaved,
}: {
  objectiveId: string;
  objectiveTitle: string;
  startYear: number;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  return (
    <MonthlyBenefitsDialog
      cfg={OBJECTIVE_VT}
      parentId={objectiveId}
      parentTitle={objectiveTitle}
      startYear={startYear}
      trigger={trigger}
      onSaved={onSaved}
    />
  );
}


// ============================================================
// Follow-up on objectives: actions + leading/lagging KPIs
// ============================================================

type ObjAction = {
  id: string;
  objective_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  due_date: string | null;
  status: "open" | "in_progress" | "done" | "blocked";
  completed_at: string | null;
  archived_at: string | null;
};

type ObjKpi = {
  id: string;
  objective_id: string;
  name: string;
  unit: string | null;
  kind: "leading" | "lagging";
  target: number | null;
  higher_is_better: boolean;
  frequency: string;
  owner_id: string | null;
  archived_at: string | null;
};

type ObjKpiValue = {
  id: string;
  kpi_id: string;
  period_start: string;
  actual: number | null;
  note: string | null;
};

const ACTION_STATUS_META: Record<ObjAction["status"], { label: string; dot: string }> = {
  open: { label: "Open", dot: "bg-neutral-300" },
  in_progress: { label: "In progress", dot: "bg-sky-500" },
  done: { label: "Done", dot: "bg-emerald-500" },
  blocked: { label: "Blocked", dot: "bg-red-500" },
};

function ValueDriverTree({
  objectives,
  themes,
  canEdit,
  vision,
  startYear,
  benefitTotals,
  onChanged,
  onBenefitsChanged,
}: {
  objectives: (Objective & { archived_at?: string | null })[];
  themes: Theme[];
  canEdit: boolean;
  vision: string | null;
  startYear: number;
  benefitTotals: Record<string, number>;
  onChanged: () => void;
  onBenefitsChanged: () => void;
}) {
  const active = objectives.filter((o) => !o.archived_at);
  const activeThemes = themes.filter((t) => !t.archived_at);

  const grouped = activeThemes.map((t) => ({
    theme: t,
    items: active.filter((o) => o.theme_id === t.id),
  }));
  const unassigned = active.filter((o) => !o.theme_id);

  const totals = {
    total: active.length,
    onTrack: active.filter((o) => o.status === "on_track" || o.status === "done").length,
    atRisk: active.filter((o) => o.status === "at_risk").length,
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Objectives & value-driver tree</h2>
          <p className="text-xs text-muted-foreground">
            Strategic objective at the top, strategic themes as the levers, objectives and their KPIs beneath.
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Define a yearly objective above to start building the value-driver tree.
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          {/* Root: strategic objective */}
          <div className="mx-auto max-w-3xl rounded-lg border-2 border-primary/40 bg-primary/5 p-4 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Strategic objective
            </div>
            <div className="mt-1 text-base font-semibold leading-snug">
              {vision || "Set a vision to anchor the tree."}
            </div>
            <div className="mt-3 flex justify-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{totals.onTrack} on track</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{totals.atRisk} at risk</span>
              <span className="text-muted-foreground">· {totals.total} objectives</span>
            </div>
          </div>

          {/* Connector */}
          <div className="mx-auto my-3 h-6 w-px bg-neutral-300" />

          {/* Levers = themes */}
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map((g) => (
              <LeverColumn
                key={g.theme.id}
                theme={g.theme}
                items={g.items}
                canEdit={canEdit}
                themes={themes}
                startYear={startYear}
                benefitTotals={benefitTotals}
                onChanged={onChanged}
                onBenefitsChanged={onBenefitsChanged}
              />
            ))}
            {unassigned.length > 0 && (
              <LeverColumn
                theme={{
                  id: "__none",
                  title: "Unassigned",
                  description: "Objectives without a strategic theme",
                  color: "#9ca3af",
                  sort_order: 999,
                }}
                items={unassigned}
                canEdit={canEdit}
                themes={themes}
                startYear={startYear}
                benefitTotals={benefitTotals}
                onChanged={onChanged}
                onBenefitsChanged={onBenefitsChanged}
              />
            )}
            {grouped.length === 0 && unassigned.length === 0 && (
              <div className="col-span-full rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                Add strategic themes above to define the levers of the tree.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function LeverColumn({
  theme,
  items,
  canEdit,
  themes,
  startYear,
  benefitTotals,
  onChanged,
  onBenefitsChanged,
}: {
  theme: Theme;
  items: (Objective & { archived_at?: string | null })[];
  canEdit: boolean;
  themes: Theme[];
  startYear: number;
  benefitTotals: Record<string, number>;
  onChanged: () => void;
  onBenefitsChanged: () => void;
}) {
  const raw = theme.color ?? "";
  const color = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.trim()) ? raw.trim() : "#9ca3af";
  return (
    <div className="flex flex-col self-start rounded-lg border border-neutral-200 bg-card">
      <div
        className="rounded-t-lg px-3 py-2 text-white"
        style={{ background: color }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Lever</div>
        <div className="text-sm font-semibold leading-tight">{theme.title}</div>
      </div>
      <div className="space-y-2 p-3">

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">
            No objectives linked to this lever yet.
          </div>
        ) : (
          items.map((o) => (
            <ObjectiveCard
              key={o.id}
              obj={o}
              canEdit={canEdit}
              themes={themes}
              startYear={startYear}
              benefitTotal={benefitTotals[o.id] ?? 0}
              onChanged={onChanged}
              onBenefitsChanged={onBenefitsChanged}
            />
          ))
        )}
      </div>
    </div>
  );
}


function ObjectiveDriverNode({
  obj,
  canEdit,
  color,
}: {
  obj: Objective & { archived_at?: string | null };
  canEdit: boolean;
  color: string;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[obj.status];

  const actionsQ = useQuery({
    queryKey: ["obj-actions", obj.id],
    enabled: expanded,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objective_actions")
        .select("*")
        .eq("objective_id", obj.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ObjAction[];
    },
  });
  const kpisQ = useQuery({
    queryKey: ["obj-kpis", obj.id],
    enabled: expanded,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objective_kpis")
        .select("*")
        .eq("objective_id", obj.id)
        .order("kind")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ObjKpi[];
    },
  });

  const invalidateActions = () => qc.invalidateQueries({ queryKey: ["obj-actions", obj.id] });
  const invalidateKpis = () => qc.invalidateQueries({ queryKey: ["obj-kpis", obj.id] });

  const actions = (actionsQ.data ?? []).filter((a) => !a.archived_at);
  const kpis = (kpisQ.data ?? []).filter((k) => !k.archived_at);
  const leading = kpis.filter((k) => k.kind === "leading");
  const lagging = kpis.filter((k) => k.kind === "lagging");

  return (
    <div className="rounded-md border border-neutral-200 bg-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-2 p-2 text-left hover:bg-neutral-50"
      >
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-tight">{obj.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            <span>Y{obj.horizon_year}</span>
            {obj.target_metric && <span>· 🎯 {obj.target_metric}</span>}
            <span className="inline-flex items-center gap-1">
              · <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              <span className={meta.text}>{meta.label}</span>
            </span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{expanded ? "−" : "+"}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-neutral-200 p-3">
          {/* KPIs */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                KPIs
              </div>
              {canEdit && <KpiDialog objectiveId={obj.id} onSaved={invalidateKpis} />}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <KpiGroup title="Leading" items={leading} canEdit={canEdit} onChanged={invalidateKpis} />
              <KpiGroup title="Lagging" items={lagging} canEdit={canEdit} onChanged={invalidateKpis} />
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </div>
              {canEdit && <ActionDialog objectiveId={obj.id} onSaved={invalidateActions} />}
            </div>
            {actions.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-center text-[11px] text-muted-foreground">
                No actions yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {actions.map((a) => (
                  <ActionRow key={a.id} action={a} canEdit={canEdit} onChanged={invalidateActions} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionRow({
  action,
  canEdit,
  onChanged,
}: {
  action: ObjAction;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const { data: profiles = [] } = useProfiles();
  const owner = action.owner_id ? profiles.find((p) => p.id === action.owner_id) : undefined;
  const done = action.status === "done";
  const meta = ACTION_STATUS_META[action.status];

  const toggleDone = async () => {
    const nextStatus: ObjAction["status"] = done ? "open" : "done";
    const { error } = await (supabase as any)
      .from("objective_actions")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", action.id);
    if (error) toast.error(error.message);
    else onChanged();
  };

  return (
    <div className="flex items-start gap-2 rounded-md border border-neutral-200 bg-card p-2">
      <button
        type="button"
        onClick={canEdit ? toggleDone : undefined}
        className="mt-0.5 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
        disabled={!canEdit}
        title={done ? "Mark not done" : "Mark done"}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
          {action.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          {action.due_date && <span>· due {action.due_date}</span>}
          <span>· 👤 {ownerLabel(owner)}</span>
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-0.5">
          <ActionDialog
            objectiveId={action.objective_id}
            initial={action}
            onSaved={onChanged}
            trigger={
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <Pencil className="h-3 w-3" />
              </Button>
            }
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-600"
            onClick={async () => {
              if (!(await confirmDialog(`Delete action "${action.title}"?`))) return;
              const { error } = await (supabase as any)
                .from("objective_actions")
                .delete()
                .eq("id", action.id);
              if (error) toast.error(error.message);
              else onChanged();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ActionDialog({
  objectiveId,
  initial,
  trigger,
  onSaved,
}: {
  objectiveId: string;
  initial?: ObjAction;
  trigger?: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ownerId, setOwnerId] = useState<string | null>(initial?.owner_id ?? null);
  const [dueDate, setDueDate] = useState<string>(initial?.due_date ?? "");
  const [status, setStatus] = useState<ObjAction["status"]>(initial?.status ?? "open");

  const save = async () => {
    if (!title.trim()) return toast.error("Title required");
    const { data: userData } = await getCurrentUser();
    const payload: Record<string, unknown> = {
      objective_id: objectiveId,
      title,
      description,
      owner_id: ownerId,
      due_date: dueDate || null,
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    };
    if (initial) {
      const { error } = await (supabase as any)
        .from("objective_actions")
        .update(payload)
        .eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      payload.created_by = userData.user?.id ?? null;
      const { error } = await (supabase as any).from("objective_actions").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    onSaved();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-3.5 w-3.5" /> New action
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit action" : "New action"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea rows={2} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Due date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as ObjAction["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ACTION_STATUS_META) as ObjAction["status"][]).map((s) => (
                    <SelectItem key={s} value={s}>{ACTION_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Owner</label>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiGroup({
  title,
  items,
  canEdit,
  onChanged,
}: {
  title: string;
  items: ObjKpi[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No {title.toLowerCase()} KPIs yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((k) => (
            <SharedKpiRow
              key={k.id}
              cfg={OBJECTIVE_VT}
              parentId={k.objective_id}
              kpi={k as never}
              canEdit={canEdit}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiDialog({
  objectiveId,
  initial,
  trigger,
  onSaved,
}: {
  objectiveId: string;
  initial?: ObjKpi;
  trigger?: React.ReactNode;
  onSaved: () => void;
}) {
  return (
    <KpiEditDialog
      cfg={OBJECTIVE_VT}
      parentId={objectiveId}
      initial={initial as never}
      trigger={trigger}
      onSaved={onSaved}
    />
  );
}


