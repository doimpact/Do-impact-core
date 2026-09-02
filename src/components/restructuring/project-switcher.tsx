import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { Plus, Settings2, Archive, ArchiveRestore, Trash2, Pencil } from "lucide-react";
import { confirmThen } from "@/components/confirm-dialog";

export type RestructuringProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  owner_id: string | null;
  start_date: string | null;
  target_date: string | null;
  archived_at: string | null;
};

export function useRestructuringProjects() {
  return useQuery({
    queryKey: ["restructuring_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restructuring_projects")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as RestructuringProject[];
    },
  });
}

export function ProjectSwitcher({
  projectId,
  onChange,
}: {
  projectId: string | null;
  onChange: (id: string) => void;
}) {
  const { data: projects = [] } = useRestructuringProjects();
  const active = projects.filter((p) => !p.archived_at);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Select value={projectId ?? ""} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-[240px]">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {active.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
          {active.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No projects</div>
          )}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> New
      </Button>
      <Button size="icon" variant="ghost" onClick={() => setManageOpen(true)} title="Manage projects">
        <Settings2 className="h-4 w-4" />
      </Button>

      <ProjectDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(id) => onChange(id)} />
      <ManageProjectsDialog open={manageOpen} onOpenChange={setManageOpen} projects={projects} activeId={projectId} onSelect={onChange} />
    </div>
  );
}

function ProjectDialog({
  open, onOpenChange, project, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: RestructuringProject;
  onSaved?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project?.start_date ?? "");
  const [targetDate, setTargetDate] = useState(project?.target_date ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name, description: description || null,
        start_date: startDate || null, target_date: targetDate || null,
      };
      if (project) {
        const { error } = await supabase.from("restructuring_projects").update(payload).eq("id", project.id);
        if (error) throw error;
        return project.id;
      }
      const { data, error } = await supabase.from("restructuring_projects").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["restructuring_projects"] });
      toast.success(project ? "Updated" : "Created");
      onSaved?.(id);
      onOpenChange(false);
      if (!project) { setName(""); setDescription(""); setStartDate(""); setTargetDate(""); }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{project ? "Edit project" : "New restructuring project"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Site X footprint" />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Start</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Target</label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name || save.isPending} onClick={() => save.mutate()}>{project ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageProjectsDialog({
  open, onOpenChange, projects, activeId, onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: RestructuringProject[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RestructuringProject | undefined>();

  const toggleArchive = useMutation({
    mutationFn: async (p: RestructuringProject) => {
      const { error } = await supabase.from("restructuring_projects")
        .update({ archived_at: p.archived_at ? null : new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restructuring_projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restructuring_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["restructuring_projects"] });
      qc.invalidateQueries({ queryKey: ["restructuring_items"] });
      const remaining = projects.filter((p) => p.id !== id && !p.archived_at);
      if (activeId === id && remaining[0]) onSelect(remaining[0].id);
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage projects</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {projects.length === 0 && <p className="text-sm text-muted-foreground italic">No projects yet.</p>}
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{p.name}</span>
                    {p.archived_at && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">archived</span>}
                    {activeId === p.id && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">current</span>}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(p)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleArchive.mutate(p)} title={p.archived_at ? "Restore" : "Archive"}>
                    {p.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => { confirmThen(`Delete project "${p.name}" and all its items?`, () => { del.mutate(p.id); }) }} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {editing && (
        <ProjectDialog
          open={!!editing}
          onOpenChange={(v) => { if (!v) setEditing(undefined); }}
          project={editing}
        />
      )}
    </>
  );
}
