import { createFileRoute } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, Presentation } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { cn } from "@/lib/utils";
import { ProjectSwitcher, useRestructuringProjects } from "@/components/restructuring/project-switcher";
import { TeamsPanel } from "@/components/restructuring/teams-panel";
import { SteerCoMeeting } from "@/components/restructuring/steerco-meeting";
import { confirmThen } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/strategy/restructuring")({
  head: () => ({ meta: [{ title: "Restructuring — DO.Impact" }] }),
  component: RestructuringPage,
});

type Section = "governance" | "workstreams" | "objectives" | "roadmap" | "risks" | "scope_control";
type Kind =
  | "governance_entity" | "workstream" | "value_driver" | "kpi" | "phase" | "milestone"
  | "risk" | "change_request" | "note" | "objective";
type Status = "not_started" | "in_progress" | "at_risk" | "blocked" | "done";
type Health = "green" | "yellow" | "red" | null;

type Item = {
  id: string;
  section: Section;
  kind: Kind;
  parent_id: string | null;
  workstream_id: string | null;
  project_id?: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  status: Status;
  health: Health;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  meta: Record<string, unknown>;
  archived_at: string | null;
};

const SECTIONS: { key: Section; label: string; blurb: string }[] = [
  { key: "governance", label: "1. Governance Architecture", blurb: "Decision rights and cadence across SteerCo, PMO, and workstream teams." },
  { key: "workstreams", label: "2. Workstreams", blurb: "The unit of accountability — one lead per workstream, owning its objectives, milestones and risks." },
  { key: "objectives", label: "3. Objectives & Value Driver Tree", blurb: "Objectives grouped by workstream, each with its value drivers and the KPIs that move the P&L." },
  { key: "roadmap", label: "4. Phase-Gated Roadmap & Milestones", blurb: "Stage-gate execution — read by phase for gate reviews, or by workstream for team reviews." },
  { key: "risks", label: "5. Risk Management Framework", blurb: "Categorized risks scored likelihood × impact with mitigation, owner and workstream." },
  { key: "scope_control", label: "6. Scope Control & Change Log", blurb: "Change governance process and the running change-request log." },
];

const UNASSIGNED = "__unassigned";

/** Kinds that can be assigned to a workstream directly through the dialog. */
const WS_OWNABLE: Kind[] = ["objective", "value_driver", "milestone", "phase", "risk", "change_request", "note"];

/** Page-level context so every add/edit dialog can see the workstreams already loaded. */
type RestructuringCtx = { projectId: string | null; workstreams: Item[]; allItems: Item[] };
const RestructuringContext = createContext<RestructuringCtx>({ projectId: null, workstreams: [], allItems: [] });
const useRestructuringCtx = () => useContext(RestructuringContext);

/** Effective workstream of an item: its own, else inherited from its parent (KPI → driver, milestone → phase). */
function effectiveWorkstreamId(item: Item, allItems: Item[]): string | null {
  if (item.workstream_id) return item.workstream_id;
  let cursor: Item | undefined = item;
  const seen = new Set<string>();
  while (cursor?.parent_id && !seen.has(cursor.parent_id)) {
    seen.add(cursor.parent_id);
    const parent: Item | undefined = allItems.find((i) => i.id === cursor!.parent_id);
    if (!parent) return null;
    if (parent.workstream_id) return parent.workstream_id;
    cursor = parent;
  }
  return null;
}



/** Roll-up: average progress of a set of items (0 when empty). */
function avgProgress(list: Item[]): number {
  const a = list.filter((i) => !i.archived_at);
  return a.length ? Math.round(a.reduce((s, i) => s + i.progress, 0) / a.length) : 0;
}

/** Worst health across a set of items. */
function worstHealth(list: Item[]): NonNullable<Health> {
  const a = list.filter((i) => !i.archived_at);
  if (a.some((i) => i.health === "red")) return "red";
  if (a.some((i) => i.health === "yellow")) return "yellow";
  return "green";
}

const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started", in_progress: "In progress", at_risk: "At risk", blocked: "Blocked", done: "Done",
};

const HEALTH_BG: Record<NonNullable<Health>, string> = {
  green: "bg-green-500", yellow: "bg-amber-400", red: "bg-red-500",
};
const nextHealth: Record<NonNullable<Health>, NonNullable<Health>> = { green: "yellow", yellow: "red", red: "green" };

function RestructuringPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("restructuring.projectId") : null
  );
  const [meetingOpen, setMeetingOpen] = useState(false);
  const qc = useQueryClient();
  const { data: projects = [] } = useRestructuringProjects();

  // Default-select first active project if none chosen or the chosen one is gone
  useEffect(() => {
    const active = projects.filter((p) => !p.archived_at);
    if (!active.length) return;
    if (!projectId || !active.find((p) => p.id === projectId)) {
      setProjectId(active[0].id);
    }
  }, [projects, projectId]);

  useEffect(() => {
    if (projectId && typeof window !== "undefined") localStorage.setItem("restructuring.projectId", projectId);
  }, [projectId]);

  const currentProject = projects.find((p) => p.id === projectId);

  const { data: items = [] } = useQuery({
    queryKey: ["restructuring_items", projectId, showArchived],
    enabled: !!projectId,
    queryFn: async () => {
      let q = supabase.from("restructuring_items").select("*").eq("project_id", projectId!).order("sort_order").order("created_at");
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const bySection = useMemo(() => {
    const map: Record<Section, Item[]> = { governance: [], workstreams: [], objectives: [], roadmap: [], risks: [], scope_control: [] };
    for (const i of items) map[i.section].push(i);
    return map;
  }, [items]);

  const updateMut = useMutation({
    mutationFn: async (patch: Partial<Item> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("restructuring_items").update(rest as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restructuring_items"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restructuring_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["restructuring_items"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const ctxValue = useMemo<RestructuringCtx>(() => ({
    projectId,
    workstreams: items.filter((i) => i.kind === "workstream" && !i.archived_at),
    allItems: items,
  }), [projectId, items]);

  return (
    <RestructuringContext.Provider value={ctxValue}>
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Restructuring</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            A manufacturing restructuring framework bridging financial mandates and floor-level execution —
            protecting quality and customer delivery while driving out cost and complexity.
          </p>
          {currentProject?.description && (
            <p className="mt-2 max-w-3xl text-xs text-muted-foreground italic">{currentProject.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectSwitcher projectId={projectId} onChange={setProjectId} />
          {currentProject && (
            <Button size="sm" className="gap-1.5" onClick={() => setMeetingOpen(true)}>
              <Presentation className="h-3.5 w-3.5" /> Start SteerCo meeting
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
        </div>
      </header>

      {!projectId ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No restructuring project yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Use the <b>New</b> button above to create your first project.</p>
        </div>
      ) : (
        SECTIONS.map((s) => (
          <SectionCard
            key={s.key}
            section={s}
            projectId={projectId}
            items={bySection[s.key]}
            allItems={items}
            onPatch={(patch) => updateMut.mutate(patch)}
            onDelete={(id) => { confirmThen("Delete this item?", () => { deleteMut.mutate(id); }) }}
          />
        ))
      )}

      {meetingOpen && currentProject && (
        <SteerCoMeeting project={currentProject} onClose={() => setMeetingOpen(false)} />
      )}
    </div>
    </RestructuringContext.Provider>
  );
}

function SectionCard({
  section, projectId, items, allItems, onPatch, onDelete,
}: {
  section: { key: Section; label: string; blurb: string };
  projectId: string;
  items: Item[];
  allItems: Item[];
  onPatch: (patch: Partial<Item> & { id: string }) => void;
  onDelete: (id: string) => void;
}) {
  const active = items.filter((i) => !i.archived_at);
  const avg = active.length ? Math.round(active.reduce((a, b) => a + b.progress, 0) / active.length) : 0;
  const workstreams = allItems.filter((i) => i.kind === "workstream" && !i.archived_at);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className="text-lg font-semibold">{section.label}</h2>
          <p className="text-xs text-muted-foreground">{section.blurb}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{avg}%</span>
            <div className="h-1.5 w-24 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${avg}%` }} /></div>
          </div>
          <AddDialog section={section.key} projectId={projectId} />
        </div>
      </div>
      <div className="p-5 space-y-5">
        {section.key === "governance" && (
          <>
            <TeamsPanel projectId={projectId} />
            <GovernanceView items={items} onPatch={onPatch} onDelete={onDelete} />
          </>
        )}
        {section.key === "workstreams" && <WorkstreamsView items={items} allItems={allItems} onPatch={onPatch} onDelete={onDelete} />}
        {section.key === "objectives" && <ObjectivesView items={items} workstreams={workstreams} onPatch={onPatch} onDelete={onDelete} />}
        {section.key === "roadmap" && <RoadmapView items={items} workstreams={workstreams} onPatch={onPatch} onDelete={onDelete} />}
        {section.key === "risks" && <RisksView items={items} workstreams={workstreams} onPatch={onPatch} onDelete={onDelete} />}
        {section.key === "scope_control" && <ScopeView items={items} onPatch={onPatch} onDelete={onDelete} />}
      </div>
    </section>
  );
}

/* ----- Shared row controls ----- */

function HealthDot({ value, onChange }: { value: Health; onChange: (h: NonNullable<Health>) => void }) {
  const v: NonNullable<Health> = value ?? "green";
  return (
    <button
      type="button"
      className={cn("h-4 w-4 rounded-full ring-2 ring-background", HEALTH_BG[v])}
      onClick={() => onChange(nextHealth[v])}
      title={`Health: ${v} — click to cycle`}
    />
  );
}

function ProgressBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range" min={0} max={100} step={5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-primary"
      />
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

function RowActions({ item, onDelete }: { item: Item; onDelete: (id: string) => void }) {
  const qc = useQueryClient();
  const toggleArchive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("restructuring_items")
        .update({ archived_at: item.archived_at ? null : new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restructuring_items"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex items-center gap-1">
      <EditDialog item={item} />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleArchive.mutate()} title={item.archived_at ? "Restore" : "Archive"}>
        {item.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)} title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function OwnerBadge({ ownerId }: { ownerId: string | null }) {
  const { data: profiles = [] } = useProfiles();
  const p = profiles.find((x) => x.id === ownerId);
  return <span className="text-xs text-muted-foreground">{ownerLabel(p)}</span>;
}

function StatusPill({ item }: { item: Item }) {
  const qc = useQueryClient();
  return (
    <Select
      value={item.status}
      onValueChange={async (v) => {
        const { error } = await supabase.from("restructuring_items").update({ status: v }).eq("id", item.id);
        if (error) toast.error(error.message);
        else qc.invalidateQueries({ queryKey: ["restructuring_items"] });
      }}
    >
      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ----- Section views ----- */

function GovernanceView({ items, onPatch, onDelete }: { items: Item[]; onPatch: (p: Partial<Item> & { id: string }) => void; onDelete: (id: string) => void }) {
  const entities = items.filter((i) => i.kind === "governance_entity");
  if (!entities.length) return <Empty />;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {entities.map((e) => {
        const meta = e.meta as { composition?: string; cadence?: string };
        return (
          <div key={e.id} className={cn("rounded-lg border border-border p-4", e.archived_at && "opacity-60")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <HealthDot value={e.health} onChange={(h) => onPatch({ id: e.id, health: h })} />
                <h3 className="font-semibold text-sm">{e.title}</h3>
              </div>
              <RowActions item={e} onDelete={onDelete} />
            </div>
            {meta.composition && <p className="mt-2 text-xs"><span className="font-medium">Composition:</span> {meta.composition}</p>}
            {e.description && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">{e.description}</p>}
            {meta.cadence && <p className="mt-2 text-xs"><span className="font-medium">Cadence:</span> {meta.cadence}</p>}
            <div className="mt-3 flex items-center justify-between gap-2">
              <ProgressBar value={e.progress} onChange={(v) => onPatch({ id: e.id, progress: v })} />
              <OwnerBadge ownerId={e.owner_id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ViewProps = {
  items: Item[];
  workstreams: Item[];
  onPatch: (p: Partial<Item> & { id: string }) => void;
  onDelete: (id: string) => void;
};

/**
 * Group a list by effective workstream (own, else inherited from parent),
 * preserving workstream order, with an Unassigned bucket last.
 */
function groupByWorkstream<T extends Item>(list: T[], workstreams: Item[], allItems: Item[] = []): { ws: Item | null; rows: T[] }[] {
  const ids = new Set(workstreams.map((w) => w.id));
  const wsOf = (i: T) => {
    const eff = effectiveWorkstreamId(i, allItems.length ? allItems : list);
    return eff && ids.has(eff) ? eff : null;
  };
  const groups: { ws: Item | null; rows: T[] }[] = workstreams.map((w) => ({
    ws: w,
    rows: list.filter((i) => wsOf(i) === w.id),
  }));
  const orphans = list.filter((i) => wsOf(i) === null);
  if (orphans.length) groups.push({ ws: null, rows: orphans });
  return groups.filter((g) => g.rows.length > 0 || g.ws);
}

function WorkstreamBadge({ ws }: { ws: Item | null }) {
  return (
    <span className={cn(
      "rounded px-1.5 py-0.5 text-[10px] font-medium",
      ws ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    )}>
      {ws ? ws.title : "Unassigned"}
    </span>
  );
}

/** Bulk-assign a set of items to a workstream (used on the Unassigned bucket). */
function BulkAssign({ rows }: { rows: Item[] }) {
  const qc = useQueryClient();
  const { workstreams } = useRestructuringCtx();
  const assign = useMutation({
    mutationFn: async (workstreamId: string) => {
      const { error } = await supabase.from("restructuring_items")
        .update({ workstream_id: workstreamId })
        .in("id", rows.map((r) => r.id));
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["restructuring_items"] }); toast.success("Assigned"); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!rows.length || !workstreams.length) return null;
  return (
    <Select value="" onValueChange={(v) => assign.mutate(v)}>
      <SelectTrigger className="h-7 w-48 text-xs"><SelectValue placeholder="Assign all to…" /></SelectTrigger>
      <SelectContent>
        {workstreams.map((w) => <SelectItem key={w.id} value={w.id} className="text-xs">{w.title}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function GroupHeader({ ws, count, rows, addSection, projectId, addLabel }: {
  ws: Item | null; count: number; rows?: Item[];
  addSection?: Section; projectId?: string | null; addLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-1.5">
      <h4 className="text-sm font-semibold">{ws ? ws.title : "Unassigned"}</h4>
      <span className="text-xs text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>
      <div className="ml-auto flex items-center gap-2">
        {!ws && rows && <BulkAssign rows={rows} />}
        {addSection && projectId && (
          <AddDialog
            section={addSection}
            projectId={projectId}
            defaultWorkstreamId={ws?.id ?? null}
            label={addLabel ?? "Add"}
            size="xs"
          />
        )}
      </div>
    </div>
  );
}

function WorkstreamsView({ items, allItems, onPatch, onDelete }: {
  items: Item[]; allItems: Item[];
  onPatch: (p: Partial<Item> & { id: string }) => void; onDelete: (id: string) => void;
}) {
  const workstreams = items.filter((i) => i.kind === "workstream");
  const unassigned = allItems.filter(
    (i) => !i.workstream_id && !i.archived_at &&
      (i.kind === "objective" || i.kind === "milestone" || i.kind === "risk")
  );
  if (!workstreams.length) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No workstreams yet — add one (e.g. Commercial &amp; Pricing, Operations &amp; Footprint, Procurement &amp; Supply,
        Working Capital &amp; Cash, Organisation &amp; Overhead), then assign objectives, milestones and risks to it.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {workstreams.map((w) => {
          const objectives = allItems.filter((i) => i.kind === "objective" && i.workstream_id === w.id);
          const milestones = allItems.filter((i) => i.kind === "milestone" && i.workstream_id === w.id);
          const risks = allItems.filter((i) => i.kind === "risk" && i.workstream_id === w.id && !i.archived_at);
          const children = [...objectives, ...milestones];
          const rollup = children.length ? avgProgress(children) : w.progress;
          const rollHealth = children.length || risks.length ? worstHealth([...children, ...risks]) : (w.health ?? "green");
          const meta = w.meta as { target_value?: string; scope?: string };
          return (
            <div key={w.id} className={cn("rounded-lg border border-border p-4", w.archived_at && "opacity-60")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <HealthDot value={w.health} onChange={(h) => onPatch({ id: w.id, health: h })} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workstream</p>
                    <h3 className="font-semibold text-sm truncate">{w.title}</h3>
                  </div>
                </div>
                <RowActions item={w} onDelete={onDelete} />
              </div>
              {w.description && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">{w.description}</p>}
              {meta.target_value && <p className="mt-2 text-xs"><span className="font-medium">Target value:</span> {meta.target_value}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Objectives", n: objectives.length },
                  { label: "Milestones", n: milestones.length },
                  { label: "Open risks", n: risks.filter((r) => r.status !== "done").length },
                ].map((s) => (
                  <div key={s.label} className="rounded-md bg-muted/50 py-1.5">
                    <p className="text-sm font-semibold tabular-nums">{s.n}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", HEALTH_BG[rollHealth])} />
                  Rolled-up {rollup}%
                </span>
                <OwnerBadge ownerId={w.owner_id} />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary" style={{ width: `${rollup}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <ProgressBar value={w.progress} onChange={(v) => onPatch({ id: w.id, progress: v })} />
                <span className="text-[10px] text-muted-foreground">manual</span>
              </div>
            </div>
          );
        })}
      </div>
      {unassigned.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {unassigned.length} item{unassigned.length === 1 ? " is" : "s are"} not yet assigned to a workstream —
          they appear under “Unassigned” in the sections below.
        </p>
      )}
    </div>
  );
}

function ObjectivesView({ items, workstreams, onPatch, onDelete }: ViewProps) {
  const { projectId, allItems } = useRestructuringCtx();
  const objectives = items.filter((i) => i.kind === "objective");
  const drivers = items.filter((i) => i.kind === "value_driver");
  if (!objectives.length && !drivers.length && !workstreams.length) return <Empty />;

  const groups = groupByWorkstream(objectives, workstreams, allItems);
  const objIds = new Set(objectives.map((o) => o.id));
  const looseDrivers = drivers.filter((d) => !d.parent_id || !objIds.has(d.parent_id));

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.ws?.id ?? UNASSIGNED} className="space-y-3">
          <GroupHeader
            ws={g.ws}
            count={g.rows.length}
            rows={g.rows}
            addSection="objectives"
            projectId={projectId}
            addLabel="Add objective"
          />
          {g.rows.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No objectives in this workstream yet.</p>
          ) : (
            g.rows.map((o) => (
              <ObjectiveBlock
                key={o.id}
                objective={o}
                drivers={drivers.filter((d) => d.parent_id === o.id)}
                items={items}
                onPatch={onPatch}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      ))}
      {looseDrivers.length > 0 && (
        <div className="space-y-3">
          <GroupHeader ws={null} count={looseDrivers.length} rows={looseDrivers} />
          <p className="text-xs text-muted-foreground italic">Value drivers without a parent objective.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {looseDrivers.map((d) => (
              <DriverCard key={d.id} driver={d} items={items} onPatch={onPatch} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectiveBlock({ objective, drivers, items, onPatch, onDelete }: {
  objective: Item; drivers: Item[]; items: Item[];
  onPatch: (p: Partial<Item> & { id: string }) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className={cn("rounded-lg border-2 border-primary/40 bg-primary/5 p-4", objective.archived_at && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <HealthDot value={objective.health} onChange={(h) => onPatch({ id: objective.id, health: h })} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Objective</p>
            <h3 className="font-semibold">{objective.title}</h3>
          </div>
        </div>
        <RowActions item={objective} onDelete={onDelete} />
      </div>
      {objective.description && <p className="mt-2 text-sm text-muted-foreground">{objective.description}</p>}
      <div className="mt-3 flex items-center justify-between">
        <ProgressBar value={objective.progress} onChange={(v) => onPatch({ id: objective.id, progress: v })} />
        <OwnerBadge ownerId={objective.owner_id} />
      </div>
      {drivers.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {drivers.map((d) => (
            <DriverCard key={d.id} driver={d} items={items} onPatch={onPatch} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function DriverCard({ driver: d, items, onPatch, onDelete }: {
  driver: Item; items: Item[];
  onPatch: (p: Partial<Item> & { id: string }) => void; onDelete: (id: string) => void;
}) {
  const kpis = items.filter((i) => i.kind === "kpi" && i.parent_id === d.id);
  const lever = (d.meta as { lever?: string }).lever;
  return (
    <div className={cn("min-w-0 rounded-lg border border-border bg-card p-4", d.archived_at && "opacity-60")}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <HealthDot value={d.health} onChange={(h) => onPatch({ id: d.id, health: h })} />
          <div>
            <h4 className="font-semibold text-sm">{d.title}</h4>
            {lever && <p className="text-[11px] text-muted-foreground">Lever: {lever}</p>}
          </div>
        </div>
        <RowActions item={d} onDelete={onDelete} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <ProgressBar value={d.progress} onChange={(v) => onPatch({ id: d.id, progress: v })} />
        <OwnerBadge ownerId={d.owner_id} />
      </div>
      {kpis.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {kpis.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <HealthDot value={k.health} onChange={(h) => onPatch({ id: k.id, health: h })} />
                <span className="truncate">{k.title}</span>
                {(k.meta as { target?: string }).target && <span className="text-muted-foreground">· {(k.meta as { target?: string }).target}</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-9 text-right tabular-nums text-muted-foreground">{k.progress}%</span>
                <RowActions item={k} onDelete={onDelete} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MilestoneRow({ m, ws, showWorkstream, onPatch, onDelete }: {
  m: Item; ws: Item | null; showWorkstream: boolean;
  onPatch: (p: Partial<Item> & { id: string }) => void; onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HealthDot value={m.health} onChange={(h) => onPatch({ id: m.id, health: h })} />
        <span className="truncate">{m.title}</span>
        {showWorkstream && <WorkstreamBadge ws={ws} />}
        {m.due_date && <span className="text-xs text-muted-foreground">· due {m.due_date}</span>}
      </div>
      <StatusPill item={m} />
      <ProgressBar value={m.progress} onChange={(v) => onPatch({ id: m.id, progress: v })} />
      <OwnerBadge ownerId={m.owner_id} />
      <RowActions item={m} onDelete={onDelete} />
    </li>
  );
}

function RoadmapView({ items, workstreams, onPatch, onDelete }: ViewProps) {
  const { projectId, allItems } = useRestructuringCtx();
  const [mode, setMode] = useState<"phase" | "workstream">("phase");
  const phases = items.filter((i) => i.kind === "phase");
  const milestones = items.filter((i) => i.kind === "milestone");
  if (!phases.length && !milestones.length) return <Empty />;
  const wsById = new Map(workstreams.map((w) => [w.id, w]));
  const wsOf = (m: Item) => {
    const eff = effectiveWorkstreamId(m, allItems);
    return eff ? wsById.get(eff) ?? null : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-md border border-border p-0.5 w-fit text-xs">
        {(["phase", "workstream"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn("rounded px-2.5 py-1 capitalize", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            By {m}
          </button>
        ))}
      </div>

      {mode === "phase" ? (
        phases.map((p) => {
          const ms = milestones.filter((i) => i.parent_id === p.id);
          return (
            <div key={p.id} className={cn("rounded-lg border border-border", p.archived_at && "opacity-60")}>
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <HealthDot value={p.health} onChange={(h) => onPatch({ id: p.id, health: h })} />
                  <h4 className="font-semibold text-sm">{p.title}</h4>
                  {p.description && <span className="text-xs text-muted-foreground">· {p.description}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <ProgressBar value={p.progress} onChange={(v) => onPatch({ id: p.id, progress: v })} />
                  <RowActions item={p} onDelete={onDelete} />
                </div>
              </div>
              {ms.length > 0 && (
                <ul className="divide-y divide-border">
                  {ms.map((m) => (
                    <MilestoneRow
                      key={m.id}
                      m={m}
                      ws={wsOf(m)}
                      showWorkstream
                      onPatch={onPatch}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        })
      ) : (
        groupByWorkstream(milestones, workstreams, allItems).map((g) => (
          <div key={g.ws?.id ?? UNASSIGNED} className="rounded-lg border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
              <h4 className="font-semibold text-sm">{g.ws ? g.ws.title : "Unassigned"}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{g.rows.length} milestone{g.rows.length === 1 ? "" : "s"} · {avgProgress(g.rows)}%</span>
                {!g.ws && <BulkAssign rows={g.rows} />}
                {projectId && (
                  <AddDialog section="roadmap" projectId={projectId} defaultWorkstreamId={g.ws?.id ?? null} label="Add milestone" size="xs" />
                )}
              </div>
            </div>
            {g.rows.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground italic">No milestones in this workstream yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {g.rows.map((m) => (
                  <MilestoneRow key={m.id} m={m} ws={g.ws} showWorkstream={false} onPatch={onPatch} onDelete={onDelete} />
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}


function RisksView({ items, workstreams, onPatch, onDelete }: ViewProps) {
  const { allItems } = useRestructuringCtx();
  const [filter, setFilter] = useState<string>("all");
  const all = items.filter((i) => i.kind === "risk");
  if (!all.length) return <Empty />;
  const wsById = new Map(workstreams.map((w) => [w.id, w]));
  const effWs = (r: Item) => {
    const eff = effectiveWorkstreamId(r, allItems);
    return eff ? wsById.get(eff) ?? null : null;
  };
  const risks = filter === "all"
    ? all
    : filter === UNASSIGNED
      ? all.filter((r) => !effWs(r))
      : all.filter((r) => effWs(r)?.id === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Workstream</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All workstreams</SelectItem>
            {workstreams.map((w) => <SelectItem key={w.id} value={w.id} className="text-xs">{w.title}</SelectItem>)}
            <SelectItem value={UNASSIGNED} className="text-xs">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs">
            <tr>
              <th className="px-2 py-2 text-left">Category</th>
              <th className="px-2 py-2 text-left">Workstream</th>
              <th className="px-2 py-2 text-left">Failure mode</th>
              <th className="px-2 py-2 text-left">Mitigation</th>
              <th className="px-2 py-2 text-left">L × I</th>
              <th className="px-2 py-2 text-left">Owner</th>
              <th className="px-2 py-2 text-left">Progress</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => {
              const m = r.meta as { category?: string; likelihood?: number; impact?: number; mitigation?: string };
              const score = (m.likelihood ?? 0) * (m.impact ?? 0);
              return (
                <tr key={r.id} className={cn("border-t border-border", r.archived_at && "opacity-60")}>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <HealthDot value={r.health} onChange={(h) => onPatch({ id: r.id, health: h })} />
                      <span className="font-medium">{m.category ?? r.title}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2"><WorkstreamBadge ws={effWs(r)} /></td>
                  <td className="px-2 py-2 text-muted-foreground">{r.description}</td>
                  <td className="px-2 py-2 text-muted-foreground">{m.mitigation}</td>
                  <td className="px-2 py-2 tabular-nums">{m.likelihood ?? "-"} × {m.impact ?? "-"} = <b>{score || "-"}</b></td>
                  <td className="px-2 py-2"><OwnerBadge ownerId={r.owner_id} /></td>
                  <td className="px-2 py-2"><ProgressBar value={r.progress} onChange={(v) => onPatch({ id: r.id, progress: v })} /></td>
                  <td className="px-2 py-2"><RowActions item={r} onDelete={onDelete} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ScopeView({ items, onPatch, onDelete }: { items: Item[]; onPatch: (p: Partial<Item> & { id: string }) => void; onDelete: (id: string) => void }) {
  const notes = items.filter((i) => i.kind === "note");
  const crs = items.filter((i) => i.kind === "change_request");
  return (
    <div className="space-y-4">
      {notes.map((n) => (
        <div key={n.id} className={cn("rounded-lg border border-border bg-muted/30 p-4", n.archived_at && "opacity-60")}>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{n.title}</h4>
            <RowActions item={n} onDelete={onDelete} />
          </div>
          {n.description && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">{n.description}</p>}
        </div>
      ))}
      {crs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs">
              <tr>
                <th className="px-2 py-2 text-left">Date</th>
                <th className="px-2 py-2 text-left">Scope</th>
                <th className="px-2 py-2 text-left">Cost impact</th>
                <th className="px-2 py-2 text-left">Schedule impact</th>
                <th className="px-2 py-2 text-left">Value impact</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Approver</th>
                <th className="px-2 py-2 text-left">Progress</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {crs.map((c) => {
                const m = c.meta as { date_raised?: string; cost_impact?: string; schedule_impact?: string; value_impact?: string; cr_status?: string; approver?: string };
                return (
                  <tr key={c.id} className={cn("border-t border-border", c.archived_at && "opacity-60")}>
                    <td className="px-2 py-2 whitespace-nowrap">{m.date_raised ?? "-"}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <HealthDot value={c.health} onChange={(h) => onPatch({ id: c.id, health: h })} />
                        <span>{c.description ?? c.title}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">{m.cost_impact ?? "-"}</td>
                    <td className="px-2 py-2">{m.schedule_impact ?? "-"}</td>
                    <td className="px-2 py-2">{m.value_impact ?? "-"}</td>
                    <td className="px-2 py-2">{m.cr_status ?? "-"}</td>
                    <td className="px-2 py-2">{m.approver ?? "-"}</td>
                    <td className="px-2 py-2"><ProgressBar value={c.progress} onChange={(v) => onPatch({ id: c.id, progress: v })} /></td>
                    <td className="px-2 py-2"><RowActions item={c} onDelete={onDelete} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {notes.length === 0 && crs.length === 0 && <Empty />}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground italic">No items yet — use “+ Add” to create one.</p>;
}

/* ----- Add / Edit dialogs ----- */

const KIND_OPTIONS: Record<Section, { value: Kind; label: string }[]> = {
  governance: [{ value: "governance_entity", label: "Governance entity" }],
  workstreams: [{ value: "workstream", label: "Workstream" }],
  objectives: [
    { value: "objective", label: "Strategic objective" },
    { value: "value_driver", label: "Value driver" },
    { value: "kpi", label: "KPI" },
  ],
  roadmap: [{ value: "phase", label: "Phase" }, { value: "milestone", label: "Milestone" }],
  risks: [{ value: "risk", label: "Risk" }],
  scope_control: [{ value: "note", label: "Note" }, { value: "change_request", label: "Change request" }],
};

function AddDialog({ section, projectId, defaultWorkstreamId, label, size = "sm" }: {
  section: Section; projectId: string; defaultWorkstreamId?: string | null; label?: string; size?: "sm" | "xs";
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {size === "xs" ? (
          <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
            <Plus className="h-3 w-3" /> {label ?? "Add"}
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> {label ?? "Add"}</Button>
        )}
      </DialogTrigger>
      {open && (
        <ItemDialogBody
          section={section}
          projectId={projectId}
          defaultWorkstreamId={defaultWorkstreamId ?? null}
          onDone={() => setOpen(false)}
        />
      )}
    </Dialog>
  );
}

function EditDialog({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
      </DialogTrigger>
      {open && <ItemDialogBody section={item.section} item={item} onDone={() => setOpen(false)} />}
    </Dialog>
  );
}

function ItemDialogBody({ section, projectId, item, defaultWorkstreamId, onDone }: {
  section: Section; projectId?: string; item?: Item; defaultWorkstreamId?: string | null; onDone: () => void;
}) {
  const qc = useQueryClient();
  const ctx = useRestructuringCtx();
  const [kind, setKind] = useState<Kind>(item?.kind ?? KIND_OPTIONS[section][0].value);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [ownerId, setOwnerId] = useState<string | null>(item?.owner_id ?? null);
  const [progress, setProgress] = useState(item?.progress ?? 0);
  const [status, setStatus] = useState<Status>(item?.status ?? "not_started");
  const [dueDate, setDueDate] = useState(item?.due_date ?? "");
  const [startDate, setStartDate] = useState(item?.start_date ?? "");
  const [meta, setMeta] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries((item?.meta as Record<string, unknown>) ?? {}).map(([k, v]) => [k, String(v ?? "")]))
  );

  const pid = projectId ?? item?.project_id ?? ctx.projectId ?? null;
  const [workstreamId, setWorkstreamId] = useState<string | null>(item?.workstream_id ?? defaultWorkstreamId ?? null);

  // Workstreams come from the page-level context — already loaded, always in sync.
  const workstreams = ctx.workstreams;

  // parent selection for milestones / value drivers / kpis
  const { data: siblingsRaw = [] } = useQuery({
    queryKey: ["restructuring_items_parents", section, kind, pid],
    enabled: !!pid,
    queryFn: async () => {
      const parentKind = kind === "milestone" ? "phase" : kind === "value_driver" ? "objective" : kind === "kpi" ? "value_driver" : null;
      if (!parentKind) return [] as Item[];
      const { data, error } = await supabase.from("restructuring_items")
        .select("*").eq("project_id", pid!).eq("section", section).eq("kind", parentKind)
        .is("archived_at", null).order("sort_order");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
  // Scope parents to the selected workstream where the parent itself is workstream-owned
  const scopedParents = kind === "value_driver" && workstreamId;
  const siblings = scopedParents
    ? siblingsRaw.filter((s) => s.workstream_id === workstreamId)
    : siblingsRaw;
  const [parentId, setParentId] = useState<string | null>(item?.parent_id ?? null);

  const metaFields = metaFieldsFor(kind);
  const showWorkstream = WS_OWNABLE.includes(kind);
  // KPIs inherit the workstream of their parent value driver
  const inheritedWorkstreamId = kind === "kpi" && parentId
    ? (ctx.allItems.find((i) => i.id === parentId)?.workstream_id ?? null)
    : null;
  const inheritedWs = inheritedWorkstreamId
    ? workstreams.find((w) => w.id === inheritedWorkstreamId) ?? null
    : null;


  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        section, kind, title, description: description || null,
        owner_id: ownerId, progress, status,
        due_date: dueDate || null, start_date: startDate || null,
        parent_id: parentId,
        workstream_id: kind === "workstream" ? null : kind === "kpi" ? inheritedWorkstreamId : workstreamId,
        meta: Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== "")),
        ...(item ? {} : { project_id: projectId ?? pid }),
      };
      if (item) {
        const { error } = await supabase.from("restructuring_items").update(payload as never).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("restructuring_items").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restructuring_items"] });
      toast.success(item ? "Updated" : "Created");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        {!item && (
          <div>
            <label className="text-xs font-medium">Type</label>
            <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS[section].map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {showWorkstream && (
          <div>
            <label className="text-xs font-medium">Workstream</label>
            <Select
              value={workstreamId ?? "__none"}
              onValueChange={(v) => { setWorkstreamId(v === "__none" ? null : v); setParentId(null); }}
            >
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Unassigned</SelectItem>
                {workstreams.map((w) => <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {workstreams.length === 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">No workstreams yet — add one in section 2 “Workstreams”.</p>
            )}
          </div>
        )}
        {kind === "kpi" && (
          <p className="rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            Workstream is inherited from the parent value driver{inheritedWs ? `: ${inheritedWs.title}` : " (select a parent below)"}.
          </p>
        )}
        {(siblings.length > 0 || (scopedParents && siblingsRaw.length > 0)) && (
          <div>
            <label className="text-xs font-medium">Parent</label>
            <Select value={parentId ?? "__none"} onValueChange={(v) => setParentId(v === "__none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {siblings.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {scopedParents && siblings.length === 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                This workstream has no objectives yet — add one first, or leave the parent empty.
              </p>
            )}
          </div>
        )}
        <div>
          <label className="text-xs font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Owner</label>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
          <div>
            <label className="text-xs font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Due date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">Progress: {progress}%</label>
          <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        {metaFields.length > 0 && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Details</p>
            {metaFields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium">{f.label}</label>
                <Input value={meta[f.key] ?? ""} onChange={(e) => setMeta((m) => ({ ...m, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={() => save.mutate()} disabled={!title || save.isPending}>{item ? "Save" : "Create"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function metaFieldsFor(kind: Kind): { key: string; label: string; placeholder?: string }[] {
  switch (kind) {
    case "governance_entity":
      return [{ key: "composition", label: "Composition" }, { key: "cadence", label: "Cadence" }];
    case "workstream":
      return [
        { key: "target_value", label: "Target value", placeholder: "e.g. $4.2M EBITDA" },
        { key: "scope", label: "Scope / boundaries" },
      ];
    case "value_driver":
      return [{ key: "lever", label: "Lever" }];
    case "kpi":
      return [{ key: "target", label: "Target", placeholder: "e.g. -20%" }];
    case "risk":
      return [
        { key: "category", label: "Category" },
        { key: "likelihood", label: "Likelihood (1–5)" },
        { key: "impact", label: "Impact (1–5)" },
        { key: "mitigation", label: "Mitigation" },
      ];
    case "change_request":
      return [
        { key: "date_raised", label: "Date raised", placeholder: "YYYY-MM-DD" },
        { key: "cost_impact", label: "Cost impact" },
        { key: "schedule_impact", label: "Schedule impact" },
        { key: "value_impact", label: "Value impact" },
        { key: "cr_status", label: "CR status" },
        { key: "approver", label: "Approver" },
      ];
    default:
      return [];
  }
}
