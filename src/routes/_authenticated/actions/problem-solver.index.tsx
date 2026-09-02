import { createFileRoute } from "@tanstack/react-router";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { ToolCards, ToolGuides } from "@/components/actions/tools/tool-catalogue";
import { PROBLEM_SOLVER_CARDS } from "@/lib/problem-tools";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/")({
  head: () => ({
    meta: [
      { title: "Problem Solver — DO.Impact" },
      { name: "description", content: "A3, 8D, Aviation MRO, Problem Flow and the five structured tools — all in one workspace." },
      { property: "og:title", content: "Problem Solver — DO.Impact" },
      { property: "og:description", content: "A3, 8D, Aviation MRO, Problem Flow and the five structured tools — all in one workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProblemSolverHub,
});

function ProblemSolverHub() {
  const { isEnabled } = useUserPreferences();
  const cards = PROBLEM_SOLVER_CARDS.filter((c) => isEnabled(c.key));
  const showGuides = isEnabled("nav.actions.toolkit");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Problem Solver</h1>
        <p className="text-sm text-muted-foreground">
          Start with the problem, not the tool. Pick the method that matches the pain you are solving and work it inside one workspace.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No Problem Solver modules are enabled in your settings.</p>
      ) : (
        <div data-tour="ps-cards"><ToolCards items={cards} /></div>
      )}

      {showGuides && <ToolGuides />}

      <div data-tour="ps-flows" className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <h3 className="text-sm font-semibold">Problem flows</h3>
          <p className="text-xs text-muted-foreground">Connect a symptom through root cause to the right method and a linked action.</p>
        </div>
        <a href="/actions/problem-solver/flows" className="text-sm font-medium text-primary hover:underline">Open flows →</a>
      </div>
    </div>
  );
}

