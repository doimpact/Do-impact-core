import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRoles, listSkillCatalog, upsertRole, setRoleRequirement } from "@/lib/people.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/people/leadership")({
  head: () => ({ meta: [{ title: "Leadership — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: RolesPage,
});

function RolesPage() {
  const qc = useQueryClient();
  const roleFn = useServerFn(listRoles);
  const catFn = useServerFn(listSkillCatalog);
  const upsertFn = useServerFn(upsertRole);
  const setReqFn = useServerFn(setRoleRequirement);

  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: () => roleFn() });
  const catQ = useQuery({ queryKey: ["skill-catalog"], queryFn: () => catFn() });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  const create = useMutation({
    mutationFn: () => upsertFn({ data: { name, department: dept || null } }),
    onSuccess: () => { toast.success("Role created"); setOpen(false); setName(""); setDept(""); qc.invalidateQueries({ queryKey: ["roles"] }); },
  });

  const setReq = useMutation({
    mutationFn: (v: { roleId: string; skillId: string; requiredLevel: number | null }) => setReqFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  const reqMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rolesQ.data?.requirements ?? []) m.set(`${r.role_id}:${r.skill_id}`, r.required_level);
    return m;
  }, [rolesQ.data]);

  const role = rolesQ.data?.roles.find((r) => r.id === selectedRole);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Leadership</h1>
          <p className="text-muted-foreground mt-1">Define job roles and their required skills and proficiency levels.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New role</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New role</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (name) create.mutate(); }} className="space-y-3">
              <Input placeholder="Role name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input placeholder="Department" value={dept} onChange={(e) => setDept(e.target.value)} />
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <div className="text-xs uppercase font-semibold text-muted-foreground">Roles</div>
          {(rolesQ.data?.roles ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`block w-full text-left rounded-lg border p-3 transition ${selectedRole === r.id ? "border-primary bg-primary/5" : "bg-card hover:border-primary/50"}`}
            >
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.department ?? ""}</div>
            </button>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-5">
          {!role ? (
            <div className="text-sm text-muted-foreground">Select a role to configure its skill requirements.</div>
          ) : (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{role.name}</h2>
                {role.description && <p className="text-sm text-muted-foreground mt-1">{role.description}</p>}
              </div>
              <div className="space-y-2">
                {(catQ.data?.skills ?? []).map((s) => {
                  const level = reqMap.get(`${role.id}:${s.id}`) ?? null;
                  return (
                    <div key={s.id} className="flex items-center justify-between border-b pb-2">
                      <div className="text-sm">{s.name}</div>
                      <Select
                        value={level == null ? "none" : String(level)}
                        onValueChange={(v) => setReq.mutate({ roleId: role.id, skillId: s.id, requiredLevel: v === "none" ? null : Number(v) })}
                      >
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not required</SelectItem>
                          {[0, 1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>Level {n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
