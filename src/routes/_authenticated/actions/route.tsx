import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/actions")({
  head: () => ({ meta: [{ title: "Actions — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ActionsLayout,
});

const tabs = [
  { label: "Timeline (Gantt)", to: "/actions" },
  { label: "Problem Solver", to: "/actions/problem-solver" },
  { label: "Decision Playbook", to: "/actions/playbook" },
  { label: "Calculators", to: "/actions/calculators" },
];

function ActionsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-5">
      <div className="no-print flex items-center gap-1 border-b border-border">
        {tabs.map((t) => {
          const active = t.to === "/actions"
            ? pathname === "/actions"
            : pathname.startsWith(t.to);

          return (
            <Link
              key={t.to}
              to={t.to}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
