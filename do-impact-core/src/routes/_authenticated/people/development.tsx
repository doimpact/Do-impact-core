import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listDevelopmentPlans, upsertDevelopmentPlan, deleteDevelopmentPlan, listEmployees, listSkillCatalog } from "@/lib/people.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SectionTabs, DEVELOPMENT_TABS } from "@/components/people/section-tabs";

export const Route = createFileRoute("/_authenticated/people/development")({
  head: () => ({ meta: [{ title: "Development — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DevPage,
});

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-neutral-100 text-neutral-500",
};

function DevPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDevelopmentPlans);
  const upsertFn = useServerFn(upsertDevelopmentPlan);
  const delFn = useServerFn(deleteDevelopmentPlan);
  const empFn = useServerFn(listEmployees);
  const catFn = useServerFn(listSkillCatalog);

  const plansQ = useQuery({ queryKey: ["dev-plans"], queryFn: () => listFn() });
  const empQ = useQuery({ queryKey: ["employees"], queryFn: () => empFn() });
  const catQ = useQuery({ queryKey: ["skill-catalog"], queryFn: () => catFn() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["dev-plans"] });

  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [current, setCurrent] = useState("0");
  const [target, setTarget] = useState("3");
  const [targetDate, setTargetDate] = useState("");

  const add = useMutation({
    mutationFn: () => upsertFn({ data: { employeeId: empId, skillId, currentLevel: Number(current), targetLevel: Number(target), targetDate: targetDate || null } }),
    onSuccess: () => { toast.success("Plan created"); setOpen(false); invalidate(); },
  });

  const updateStatus = useMutation({
    mutationFn: (v: { id: string; employeeId: string; skillId: string; currentLevel: number; targetLevel: number; status: string }) => upsertFn({ data: v }),
    onSuccess: invalidate,
  });

  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: invalidate });

  return (
    <>
      <SectionTabs tabs={DEVELOPMENT_TABS} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Development Plans</h1>
          <p className="text-muted-foreground mt-1">Track individual training and skill progression.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New plan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New development plan</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (empId && skillId) add.mutate(); }} className="space-y-3">
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger>
                <SelectContent>{(empQ.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={skillId} onValueChange={setSkillId}>
                <SelectTrigger><SelectValue placeholder="Skill" /></SelectTrigger>
                <SelectContent>{(catQ.data?.skills ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Current level" type="number" min={0} max={4} value={current} onChange={(e) => setCurrent(e.target.value)} />
                <Input placeholder="Target level" type="number" min={0} max={4} value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {(plansQ.data ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[p.status ?? "open"]}`}>{(p.status ?? "open").toUpperCase()}</span>
                <div className="font-semibold">{p.employees?.first_name} {p.employees?.last_name}</div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {p.skills?.name} · L{p.current_level} → L{p.target_level}
                {p.target_date && <span> · target {new Date(p.target_date).toLocaleDateString()}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={p.status ?? "open"}
                onValueChange={(v) => updateStatus.mutate({ id: p.id, employeeId: p.employee_id, skillId: p.skill_id, currentLevel: p.current_level, targetLevel: p.target_level, status: v })}
              >
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {(plansQ.data ?? []).length === 0 && <div className="text-sm text-muted-foreground">No development plans yet.</div>}
      </div>
    </>
  );
}
