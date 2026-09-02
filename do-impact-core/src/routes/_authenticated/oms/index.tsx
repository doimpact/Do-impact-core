import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listPillars, listAllTaskCounts, setPillarHealth, deletePillar, archivePillar,
} from "@/lib/oms.functions";
import { toast } from "sonner";
import { Cog, Activity, ShieldCheck, BadgeCheck, Users, TrendingUp, Plus, Pencil, Trash2, Archive, ArchiveRestore, UserRound, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PillarDialog } from "@/components/oms/PillarDialog";
import { PillarEngagementPanel } from "@/components/people/pillar-engagement-panel";
import { confirmThen } from "@/components/confirm-dialog";


const pillarsQO = queryOptions({ queryKey: ["pillars"], queryFn: async () => (await listPillars()) ?? [] });
const countsQO = queryOptions({ queryKey: ["task-counts"], queryFn: async () => (await listAllTaskCounts()) ?? [] });

export const Route = createFileRoute("/_authenticated/oms/")({
  head: () => ({ meta: [{ title: "Operations — DO.Impact" }] }),
  // No loader: these queries hit auth-protected server fns that need the
  // client-side bearer token; they fetch via useSuspenseQuery in the component.
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg p-10 text-center space-y-3">
      <h1 className="text-lg font-semibold">Operations could not load</h1>
      <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Please refresh, or sign in again."}</p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  ),
  component: OmsHome,
});


type Health = "green" | "yellow" | "red";
const NEXT: Record<Health, Health> = { green: "yellow", yellow: "red", red: "green" };
const DOT: Record<Health, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
const ICON: Record<string, LucideIcon> = {
  daily: Activity, safety: ShieldCheck, quality: BadgeCheck, people: Users, financial: TrendingUp, customers: Cog, strategic: Cog,
};

type Pillar = {
  id: string; key: string; name: string; tagline: string | null; health: string; archived_at: string | null;
  owner_id?: string | null; owner?: { id: string; display_name: string | null } | null;
};

function OmsHome() {
  const { data: allPillars } = useSuspenseQuery(pillarsQO);
  const { data: counts } = useSuspenseQuery(countsQO);
  const qc = useQueryClient();
  const setFn = useServerFn(setPillarHealth);
  const delFn = useServerFn(deletePillar);
  const archiveFn = useServerFn(archivePillar);
  const [editing, setEditing] = useState<Pillar | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const cycle = useMutation({
    mutationFn: (v: { pillarId: string; health: Health }) => setFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pillars"] }),
    onError: () => toast.error("Only admins can change pillar health"),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Pillar deleted"); qc.invalidateQueries({ queryKey: ["pillars"] }); qc.invalidateQueries({ queryKey: ["task-counts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => archiveFn({ data: { id, archived } }),
    onSuccess: (_, vars) => {
      toast.success(vars.archived ? "Pillar archived" : "Pillar restored");
      qc.invalidateQueries({ queryKey: ["pillars"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openByPillar = new Map<string, number>();
  for (const t of counts) {
    if (t.status === "done" || t.status === "blocked") continue;
    openByPillar.set(t.pillar_id, (openByPillar.get(t.pillar_id) ?? 0) + 1);
  }

  const pillars = showArchived ? allPillars : allPillars.filter((p) => !p.archived_at);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Operating Management System</h1>
          <p className="text-muted-foreground mt-1">Business framework health — click a pillar to open its board.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="show-archived-pillars" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="show-archived-pillars" className="text-sm text-muted-foreground">Show archived</Label>
          </div>
          <Button onClick={() => setCreating(true)} size="sm"><Plus className="h-4 w-4 mr-1" />New pillar</Button>
        </div>
      </div>
      <div className="mb-6">
        <PillarEngagementPanel pillar="oms" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pillars.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground">
            {showArchived ? "No archived pillars." : "No active pillars."}
          </div>
        )}
        {pillars.map((p) => {
          const Icon = ICON[p.key] ?? Cog;
          const health = (p.health as Health) ?? "green";
          const open = openByPillar.get(p.id) ?? 0;
          const isArchived = !!p.archived_at;
          return (
            <div key={p.id} className={`group relative rounded-lg border bg-card hover:border-primary transition-colors ${isArchived ? "opacity-60" : ""}`}>
              <Link to="/oms/pillars/$pillarKey" params={{ pillarKey: p.key }} className="block p-5">
                <button
                  type="button"
                  title={health}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycle.mutate({ pillarId: p.id, health: NEXT[health] }); }}
                  className="absolute right-4 top-4 h-3 w-3 rounded-full"
                  style={{ backgroundColor: DOT[health], boxShadow: `0 0 8px ${DOT[health]}` }}
                />
                <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="text-lg font-semibold group-hover:text-primary pr-6">
                  {isArchived ? <span className="line-through">{p.name}</span> : p.name}
                  {isArchived && <span className="ml-2 text-xs font-normal text-muted-foreground">· archived</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{p.tagline}</div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  <span>{(p as Pillar).owner?.display_name ?? "Unassigned"}</span>
                </div>
                <div className="mt-3 text-xs">
                  <span className="font-semibold">{open}</span> open action{open === 1 ? "" : "s"}
                </div>
              </Link>
              <div className="flex gap-1 border-t px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(p as Pillar)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => archiveMut.mutate({ id: p.id, archived: !isArchived })}
                >
                  {isArchived ? <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> : <Archive className="h-3.5 w-3.5 mr-1" />}
                  {isArchived ? "Restore" : "Archive"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    confirmThen(`Delete pillar "${p.name}"? This removes all its tasks, KPIs, and notes.`, () => {
                      del.mutate(p.id);
                    })
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <PillarDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["pillars"] }); qc.invalidateQueries({ queryKey: ["task-counts"] }); }}
      />
      <PillarDialog
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        pillar={editing}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["pillars"] }); }}
      />
    </>
  );
}
