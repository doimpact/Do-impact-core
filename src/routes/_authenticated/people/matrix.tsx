import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmployees, listSkillCatalog, setEmployeeSkill, upsertEmployee } from "@/lib/people.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { SectionTabs, SKILLS_TABS } from "@/components/people/section-tabs";

export const Route = createFileRoute("/_authenticated/people/matrix")({
  head: () => ({ meta: [{ title: "Matrix — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: MatrixPage,
});

const LEVEL_COLORS = ["#e5e7eb", "#fca5a5", "#fcd34d", "#86efac", "#22c55e"];

function MatrixPage() {
  const qc = useQueryClient();
  const empFn = useServerFn(listEmployees);
  const catFn = useServerFn(listSkillCatalog);
  const setFn = useServerFn(setEmployeeSkill);
  const addEmpFn = useServerFn(upsertEmployee);

  const empQ = useQuery({ queryKey: ["employees"], queryFn: () => empFn() });
  const catQ = useQuery({ queryKey: ["skill-catalog"], queryFn: () => catFn() });

  const setSkill = useMutation({
    mutationFn: (v: { employeeId: string; skillId: string; level: number | null }) => setFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const employees = empQ.data ?? [];
  const skills = catQ.data?.skills ?? [];

  const skillLevel = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of employees) {
      for (const es of (e.employee_skills ?? []) as { skill_id: string; level: number }[]) {
        m.set(`${e.id}:${es.skill_id}`, es.level);
      }
    }
    return m;
  }, [employees]);

  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dept, setDept] = useState("");

  const addEmp = useMutation({
    mutationFn: () => addEmpFn({ data: { firstName: first, lastName: last, department: dept || null } }),
    onSuccess: () => { toast.success("Added"); setOpen(false); setFirst(""); setLast(""); setDept(""); qc.invalidateQueries({ queryKey: ["employees"] }); },
  });

  return (
    <>
      <SectionTabs tabs={SKILLS_TABS} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skill Matrix</h1>
          <p className="text-muted-foreground mt-1">Click cells to cycle proficiency: 0 → 1 → 2 → 3 → 4 → cleared.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add employee</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add employee</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (first && last) addEmp.mutate(); }} className="space-y-3">
              <Input placeholder="First name" value={first} onChange={(e) => setFirst(e.target.value)} required />
              <Input placeholder="Last name" value={last} onChange={(e) => setLast(e.target.value)} required />
              <Input placeholder="Department" value={dept} onChange={(e) => setDept(e.target.value)} />
              <Button type="submit" className="w-full">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card p-2 text-left border-b border-r min-w-[180px]">Employee</th>
              {skills.map((s) => (
                <th key={s.id} className="p-1 border-b border-r rotate-180 [writing-mode:vertical-rl] whitespace-nowrap h-32">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="sticky left-0 bg-card p-2 border-b border-r font-medium">
                  {e.first_name} {e.last_name}
                  <div className="text-[10px] text-muted-foreground">{e.department ?? ""}</div>
                </td>
                {skills.map((s) => {
                  const lvl = skillLevel.get(`${e.id}:${s.id}`);
                  return (
                    <td key={s.id} className="border-b border-r p-0">
                      <button
                        onClick={() => {
                          const next = lvl == null ? 0 : lvl >= 4 ? null : lvl + 1;
                          setSkill.mutate({ employeeId: e.id, skillId: s.id, level: next });
                        }}
                        className="w-10 h-10 hover:brightness-90 transition"
                        style={{ backgroundColor: lvl != null ? LEVEL_COLORS[lvl] : "transparent" }}
                        title={lvl != null ? `Level ${lvl}` : "Not assessed"}
                      >
                        {lvl != null ? lvl : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3 text-xs items-center">
        <span>Legend:</span>
        {LEVEL_COLORS.map((c, i) => (
          <span key={i} className="flex items-center gap-1"><span className="w-4 h-4 rounded" style={{ backgroundColor: c }} /> {i}</span>
        ))}
      </div>
    </>
  );
}
