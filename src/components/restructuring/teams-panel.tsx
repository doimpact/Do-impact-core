import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { confirmThen } from "@/components/confirm-dialog";

export type Body = "steerco" | "pmo" | "workstream";

export type Member = {
  id: string;
  project_id: string;
  body: Body;
  workstream_name: string | null;
  user_id: string | null;
  name: string;
  role: string | null;
  email: string | null;
  sort_order: number;
};

export function useMembers(projectId: string | null) {
  return useQuery({
    queryKey: ["restructuring_members", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase.from("restructuring_members")
        .select("*").eq("project_id", projectId!).order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });
}

const BODY_TABS: { key: Body; label: string }[] = [
  { key: "steerco", label: "Steering Committee" },
  { key: "pmo", label: "PMO" },
  { key: "workstream", label: "Workstream Execution Teams" },
];

export function TeamsPanel({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Body>("steerco");
  const { data: members = [] } = useMembers(projectId);
  const list = members.filter((m) => m.body === tab);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 rounded-md bg-background p-0.5 border border-border">
          {BODY_TABS.map((b) => (
            <button key={b.key}
              onClick={() => setTab(b.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${tab === b.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {b.label}
            </button>
          ))}
        </div>
        <AddMemberButton projectId={projectId} body={tab} />
      </div>

      {tab === "workstream" ? (
        <WorkstreamGrouped members={list} projectId={projectId} />
      ) : (
        <MemberList members={list} projectId={projectId} />
      )}
    </div>
  );
}

function WorkstreamGrouped({ members, projectId }: { members: Member[]; projectId: string }) {
  const groups = members.reduce<Record<string, Member[]>>((acc, m) => {
    const key = m.workstream_name || "Unassigned";
    (acc[key] ??= []).push(m);
    return acc;
  }, {});
  const names = Object.keys(groups);
  if (!names.length) return <Empty />;
  return (
    <div className="space-y-3">
      {names.map((n) => (
        <div key={n} className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{n}</p>
          <MemberList members={groups[n]} projectId={projectId} />
        </div>
      ))}
    </div>
  );
}

function MemberList({ members, projectId }: { members: Member[]; projectId: string }) {
  if (!members.length) return <Empty />;
  return (
    <div className="grid gap-1.5">
      {members.map((m) => <MemberRow key={m.id} member={m} projectId={projectId} />)}
    </div>
  );
}

function MemberRow({ member, projectId }: { member: Member; projectId: string }) {
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const [edit, setEdit] = useState(false);
  const linked = profiles.find((p) => p.id === member.user_id);
  const displayName = linked ? ownerLabel(linked) : member.name;

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("restructuring_members").delete().eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restructuring_members", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="flex min-w-0 items-center justify-between gap-2 rounded border border-border bg-background px-2.5 py-1.5 text-sm">
        <div className="min-w-0 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{displayName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {member.role || "—"}{member.email ? ` · ${member.email}` : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEdit(true)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
            onClick={() => { confirmThen("Remove member?", () => { del.mutate(); }) }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {edit && (
        <MemberDialog projectId={projectId} body={member.body} member={member} open={edit} onOpenChange={setEdit} />
      )}
    </>
  );
}

function AddMemberButton({ projectId, body }: { projectId: string; body: Body }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> Add member
      </Button>
      {open && <MemberDialog projectId={projectId} body={body} open={open} onOpenChange={setOpen} />}
    </>
  );
}

function MemberDialog({
  projectId, body, member, open, onOpenChange,
}: {
  projectId: string;
  body: Body;
  member?: Member;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const [userId, setUserId] = useState<string | null>(member?.user_id ?? null);
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [workstreamName, setWorkstreamName] = useState(member?.workstream_name ?? "");

  // When a user is picked, auto-fill name/email if empty
  function handleUserChange(v: string | null) {
    setUserId(v);
    if (v) {
      const p = profiles.find((x) => x.id === v);
      if (p) {
        if (!name) setName(p.display_name || p.email || "");
        if (!email && p.email) setEmail(p.email);
      }
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        project_id: projectId, body,
        workstream_name: body === "workstream" ? (workstreamName || null) : null,
        user_id: userId, name, role: role || null, email: email || null,
      };
      if (member) {
        const { error } = await supabase.from("restructuring_members").update(payload).eq("id", member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("restructuring_members").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restructuring_members", projectId] });
      toast.success(member ? "Updated" : "Added");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{member ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {body === "workstream" && (
            <div>
              <label className="text-xs font-medium">Workstream</label>
              <Input value={workstreamName} onChange={(e) => setWorkstreamName(e.target.value)} placeholder="e.g. Manufacturing Cost" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Link to user (optional)</label>
            <OwnerSelect value={userId} onChange={handleUserChange} placeholder="External / unlinked" />
          </div>
          <div>
            <label className="text-xs font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Role</label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. CFO" />
            </div>
            <div>
              <label className="text-xs font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name || save.isPending} onClick={() => save.mutate()}>{member ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground italic">No members yet.</p>;
}
