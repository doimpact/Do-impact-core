import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

export function ModulePagePlaceholder({
  title,
  description,
  source,
  planned,
  Icon,
}: {
  title: string;
  description: string;
  source: string;
  planned: string[];
  Icon?: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="rounded-lg border border-border bg-card p-3">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-accent)]">
          Coming soon
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sourced from <span className="font-medium text-foreground">{source}</span>. Feature port in a follow-up turn.
        </p>
        <ul className="mt-4 space-y-2">
          {planned.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-accent)]" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Link to="/overview" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to overview
        </Link>
      </div>
    </div>
  );
}
