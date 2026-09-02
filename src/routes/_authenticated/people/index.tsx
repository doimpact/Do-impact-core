import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listEmployees, listSkillCatalog, listRoles } from "@/lib/people.functions";
import { Users, Award, Target } from "lucide-react";
import { PillarEngagementPanel } from "@/components/people/pillar-engagement-panel";


export const Route = createFileRoute("/_authenticated/people/")({
  head: () => ({ meta: [{ title: "People — DO.Impact" }] }),
  component: PeopleHome,
});

function PeopleHome() {
  const empQ = useQuery({ queryKey: ["employees"], queryFn: () => listEmployees() });
  const catQ = useQuery({ queryKey: ["skill-catalog"], queryFn: () => listSkillCatalog() });
  const roleQ = useQuery({ queryKey: ["roles"], queryFn: () => listRoles() });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Our People & Leadership</h1>
        <p className="text-muted-foreground mt-1">Capability mapping and workforce development.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat Icon={Users} label="Employees" value={empQ.data?.length ?? 0} to="/people/employees" />
        <Stat Icon={Award} label="Skills tracked" value={catQ.data?.skills.length ?? 0} to="/people/skills" />
        <Stat Icon={Target} label="Job roles" value={roleQ.data?.roles.length ?? 0} to="/people/roles" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Quick to="/people/matrix" label="Skill matrix" />
        <Quick to="/people/gaps" label="Skill gaps" />
        <Quick to="/people/certifications" label="Certifications" />
      </div>
      <div className="mt-6">
        <PillarEngagementPanel pillar="people" />
      </div>
    </>

  );
}

function Stat({ Icon, label, value, to }: { Icon: typeof Users; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-5 block transition-colors hover:bg-muted/50">
      <Icon className="h-5 w-5 text-muted-foreground mb-2" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </Link>
  );
}

function Quick({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {label}
    </Link>
  );
}
