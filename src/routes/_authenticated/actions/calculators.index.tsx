import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { CALCULATORS } from "@/lib/calculators";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export const Route = createFileRoute("/_authenticated/actions/calculators/")({
  head: () => ({
    meta: [
      { title: "Calculators — DO.Impact" },
      { name: "description", content: "OEE, takt time, cost of poor quality, downtime cost and changeover savings — quick shop-floor maths." },
    ],
  }),
  component: CalculatorsHub,
});

function CalculatorsHub() {
  const { isEnabled } = useUserPreferences();
  const items = CALCULATORS.filter((c) => isEnabled(c.navKey));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Calculators</h1>
        <p className="text-sm text-muted-foreground">
          Quick shop-floor maths. Nothing is saved — change the numbers freely, including in the read-only demo workspace.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No calculators are enabled in your settings.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.key}
              to={c.to}
              className="rounded-lg border bg-card p-5 transition-colors hover:bg-muted/50"
            >
              <Calculator className="mb-2 h-5 w-5 text-muted-foreground" />
              <div className="font-semibold">{c.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
