import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEVEL_COLORS, LEVEL_LABELS } from "@/lib/proficiency";
import { toast } from "sonner";
import { confirmThen } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/people/roles")({
  head: () => ({ meta: [{ title: "Roles — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: RolesPage,
});

function RolesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", department: "" });
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["roles-page"],
    queryFn: async () => {
      const [roles, skills, reqs] = await Promise.all([
        supabase.from("job_roles").select("*").order("name"),
        supabase.from("skills").select("*, skill_categories(name)").order("name"),
        supabase.from("role_requirements").select("*"),
      ]);
      const reqMap = new Map<string, number>();
      (reqs.data ?? []).forEach((r) => reqMap.set(`${r.role_id}:${r.skill_id}`, r.required_level));
      return { roles: roles.data ?? [], skills: skills.data ?? [], reqMap };
    },
  });

  const createRole = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("job_roles").insert({ name: form.name, description: form.description || null, department: form.department || null });
      if (error) throw error;
    },
    onSuccess: () => { setOpen(false); setForm({ name: "", description: "", department: "" }); qc.invalidateQueries({ queryKey: ["roles-page"] }); toast.success("Role created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setReq = useMutation({
    mutationFn: async ({ role_id, skill_id, level }: { role_id: string; skill_id: string; level: number }) => {
      if (level === 0) {
        await supabase.from("role_requirements").delete().eq("role_id", role_id).eq("skill_id", skill_id);
      } else {
        const { error } = await supabase.from("role_requirements").upsert({ role_id, skill_id, required_level: level }, { onConflict: "role_id,skill_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles-page"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const delRole = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("job_roles").delete().eq("id", id); if (error) throw error; },
    onSuccess: (_, id) => { if (selectedRole === id) setSelectedRole(null); qc.invalidateQueries({ queryKey: ["roles-page"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const role = data?.roles.find((r: any) => r.id === selectedRole);
  const skillsByCat = new Map<string, any[]>();
  (data?.skills ?? []).forEach((s: any) => {
    const k = s.skill_categories?.name ?? "Other";
    if (!skillsByCat.has(k)) skillsByCat.set(k, []);
    skillsByCat.get(k)!.push(s);
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job roles & requirements</h1>
          <p className="text-muted-foreground mt-1">Define the required proficiency for each skill per role.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New role</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New job role</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => createRole.mutate()} disabled={!form.name}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Roles</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {data?.roles.map((r: any) => (
              <div key={r.id} className={`flex items-center justify-between rounded p-2 text-sm cursor-pointer ${selectedRole === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setSelectedRole(r.id)}>
                <span>{r.name}</span>
                <Trash2 className="h-4 w-4 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); confirmThen(`Delete ${r.name}?`, () => { delRole.mutate(r.id); }) }} />
              </div>
            ))}
            {!data?.roles.length && <p className="text-sm text-muted-foreground">No roles yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{role ? `Requirements for ${role.name}` : "Select a role"}</CardTitle></CardHeader>
          <CardContent>
            {!role ? <p className="text-sm text-muted-foreground">Pick a role from the left to edit its skill requirements.</p> : (
              <div className="space-y-4">
                {Array.from(skillsByCat.entries()).map(([cat, list]) => (
                  <div key={cat}>
                    <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{cat}</div>
                    <div className="space-y-1">
                      {list.map((s) => {
                        const cur = data!.reqMap.get(`${role.id}:${s.id}`) ?? 0;
                        return (
                          <div key={s.id} className="flex items-center justify-between rounded border p-2">
                            <span className="text-sm">{s.name}</span>
                            <div className="flex gap-1">
                              {[0, 1, 2, 3, 4].map((lvl) => (
                                <button key={lvl} onClick={() => setReq.mutate({ role_id: role.id, skill_id: s.id, level: lvl })}
                                  className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium text-slate-900 ${cur === lvl ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}
                                  style={{ backgroundColor: LEVEL_COLORS[lvl] }} title={LEVEL_LABELS[lvl]}>{lvl}</button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
