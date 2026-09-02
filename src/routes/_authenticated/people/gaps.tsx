import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listEmployees, listSkillCatalog, listRoles } from "@/lib/people.functions";
import { AlertTriangle } from "lucide-react";
import { SectionTabs, SKILLS_TABS } from "@/components/people/section-tabs";

export const Route = createFileRoute("/_authenticated/people/gaps")({
  head: () => ({ meta: [{ title: "Gaps — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: GapsPage,
});

function GapsPage() {
  const empQ = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const catQ = useQuery({ queryKey: ["skill-catalog"], queryFn: () => listSkillCatalog() });
  const roleQ = useQuery({ queryKey: ["roles"], queryFn: () => listRoles() });

  const gaps = useMemo(() => {
    if (!empQ.data || !roleQ.data || !catQ.data) return [];
    const reqByRole = new Map<string, { skillId: string; required: number }[]>();
    for (const r of roleQ.data.requirements) {
      const arr = reqByRole.get(r.role_id) ?? [];
      arr.push({ skillId: r.skill_id, required: r.required_level });
      reqByRole.set(r.role_id, arr);
    }
    const skillName = new Map(catQ.data.skills.map((s) => [s.id, s.name]));
    const out: { emp: string; role: string; skill: string; required: number; actual: number; gap: number }[] = [];
    for (const e of empQ.data) {
      if (!e.role_id) continue;
      const reqs = reqByRole.get(e.role_id) ?? [];
      const skillMap = new Map<string, number>();
      for (const es of (e.employee_skills ?? []) as { skill_id: string; level: number }[]) skillMap.set(es.skill_id, es.level);
      for (const r of reqs) {
        const actual = skillMap.get(r.skillId) ?? 0;
        if (actual < r.required) {
          out.push({
            emp: `${e.first_name} ${e.last_name}`,
            role: e.job_roles?.name ?? "—",
            skill: skillName.get(r.skillId) ?? "?",
            required: r.required, actual, gap: r.required - actual,
          });
        }
      }
    }
    return out.sort((a, b) => b.gap - a.gap);
  }, [empQ.data, roleQ.data, catQ.data]);

  return (
    <>
      <SectionTabs tabs={SKILLS_TABS} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Skill Gaps</h1>
        <p className="text-muted-foreground mt-1">Employees whose current proficiency falls below their role requirements.</p>
      </div>

      {gaps.length === 0 ? (
        <div className="text-sm text-muted-foreground">No gaps detected — assign role requirements to identify development needs.</div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Employee</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Skill</th>
                <th className="text-center p-3">Required</th>
                <th className="text-center p-3">Actual</th>
                <th className="text-center p-3">Gap</th>
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">{g.emp}</td>
                  <td className="p-3 text-muted-foreground">{g.role}</td>
                  <td className="p-3">{g.skill}</td>
                  <td className="p-3 text-center">{g.required}</td>
                  <td className="p-3 text-center">{g.actual}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" /> {g.gap}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
