import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardCheck, Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";
import { APQP_PHASES, type ApqpProject } from "@/lib/apqp";
import { useApqpItemStats, useApqpItems, useApqpMutations, useApqpProjects } from "./use-apqp";
import { ApqpProjectDialog } from "./apqp-project-dialog";
import { ApqpPhaseChecklist } from "./phase-checklist";
import { ApqpGuide } from "./apqp-guide";

const PHASE_BADGE = ["", "Plan", "Design", "Process", "Validate", "Improve"];

export function ApqpPanel() {
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApqpProject | null>(null);
  const [creating, setCreating] = useState(false);

  const projectsQ = useApqpProjects(showArchived);
  const statsQ = useApqpItemStats();
  const { createProject, updateProject, archiveProject, deleteProject, updateItem } = useApqpMutations();

  const projects = projectsQ.data ?? [];
  const openProject = openId ? projects.find((p) => p.id === openId) ?? null : null;
  const itemsQ = useApqpItems(openId);

  const statsByProject = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    for (const s of statsQ.data ?? []) {
      const cur = m.get(s.project_id) ?? { total: 0, done: 0 };
      if (s.status !== "na") {
        cur.total++;
        if (s.status === "complete") cur.done++;
      }
      m.set(s.project_id, cur);
    }
    return m;
  }, [statsQ.data]);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (phaseFilter !== "all" && String(p.current_phase) !== phaseFilter) return false;
        if (q && !`${p.title} ${p.part_number ?? ""} ${p.part_name ?? ""} ${p.customer ?? ""} ${p.program ?? ""}`
          .toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [projects, q, phaseFilter],
  );

  const handleSave = (values: Partial<ApqpProject> & { title: string }) => {
    if (editing) {
      updateProject.mutate(
        { id: editing.id, patch: values },
        {
          onSuccess: () => { toast.success("Program updated"); setEditing(null); },
          onError: (e: Error) => toast.error(e.message),
        },
      );
    } else {
      createProject.mutate(values, {
        onSuccess: (p) => {
          toast.success("APQP program created — 5-phase checklist seeded");
          setCreating(false);
          setOpenId(p.id);
        },
        onError: (e: Error) => toast.error(e.message),
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" /> APQP
          </h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            AIAG Advanced Product Quality Planning — the 5-phase automotive launch framework ending in PPAP
            approval. The aerospace equivalent (AS9145) lives on the NPI tab.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New APQP program</Button>
        </div>
      </header>

      <ApqpGuide />

      <div className="rounded-lg border p-3 grid gap-2 md:grid-cols-3">
        <Input placeholder="Search program / part / customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger><SelectValue placeholder="Phase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            {APQP_PHASES.map((p) => <SelectItem key={p.phase} value={String(p.phase)}>Phase {p.phase} — {p.short}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {projectsQ.isLoading && <p className="text-sm text-muted-foreground">Loading programs…</p>}
      {!projectsQ.isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No APQP programs yet. Create one to start tracking the 5-phase checklist toward PPAP.
        </p>
      )}

      <div className="grid gap-3">
        {filtered.map((p) => {
          const s = statsByProject.get(p.id) ?? { total: 0, done: 0 };
          const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
          return (
            <div
              key={p.id}
              className={cn("rounded-lg border p-4 cursor-pointer hover:border-primary/50 transition-colors",
                p.status === "archived" && "opacity-60")}
              onClick={() => setOpenId(p.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {[p.customer, p.part_number, p.part_name, p.program].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">Phase {p.current_phase} · {PHASE_BADGE[p.current_phase]}</Badge>
                  <Badge variant={p.status === "complete" ? "default" : "outline"}>{p.status.replace("_", " ")}</Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={pct} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">{s.done}/{s.total} deliverables</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {p.owner && <span>Owner: {p.owner}</span>}
                {p.target_ppap_date && <span>Target PPAP: {p.target_ppap_date}</span>}
                {p.pfmea_study_id && <span>PFMEA linked</span>}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!openProject} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {openProject && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8">{openProject.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Phase {openProject.current_phase} · {PHASE_BADGE[openProject.current_phase]}</Badge>
                <Badge variant="outline">{openProject.status.replace("_", " ")}</Badge>
                {openProject.target_ppap_date && (
                  <span className="text-xs text-muted-foreground">Target PPAP: {openProject.target_ppap_date}</span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(openProject)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    archiveProject.mutate(
                      { id: openProject.id, archive: openProject.status !== "archived" },
                      {
                        onSuccess: () => toast.success(openProject.status === "archived" ? "Program restored" : "Program archived"),
                        onError: (e: Error) => toast.error(e.message),
                      },
                    )
                  }
                >
                  {openProject.status === "archived"
                    ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore</>
                    : <><Archive className="h-3.5 w-3.5 mr-1" /> Archive</>}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    confirmThen(
                      {
                        title: "Delete APQP program?",
                        description: "This permanently deletes the program and its entire 5-phase checklist.",
                        confirmLabel: "Delete",
                      },
                      () =>
                        deleteProject.mutate(openProject.id, {
                          onSuccess: () => { toast.success("Program deleted"); setOpenId(null); },
                          onError: (e: Error) => toast.error(e.message),
                        }),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
              {openProject.notes && (
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{openProject.notes}</p>
              )}
              <div className="mt-5">
                {itemsQ.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading checklist…</p>
                ) : (
                  <ApqpPhaseChecklist
                    items={itemsQ.data ?? []}
                    currentPhase={openProject.current_phase}
                    onUpdateItem={(id, patch) =>
                      updateItem.mutate(
                        { id, patch },
                        { onError: (e: Error) => toast.error(e.message) },
                      )
                    }
                  />
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ApqpProjectDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        project={editing}
        onSave={handleSave}
        saving={createProject.isPending || updateProject.isPending}
      />
    </div>
  );
}
