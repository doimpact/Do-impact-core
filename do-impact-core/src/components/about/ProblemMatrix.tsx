import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Cpu, Leaf } from "lucide-react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { subNavKeyForPath } from "@/lib/nav-registry";
import { COLUMNS, MODULES, MODULE_BY_ID, PROBLEMS } from "@/lib/problem-matrix";

const PROBLEM_ICON = [Globe2, Cpu, Leaf] as const;

export default function ProblemMatrix() {
  const [activeId, setActiveId] = useState(PROBLEMS[0].id);
  const active = PROBLEMS.find((p) => p.id === activeId)!;
  const { isEnabled } = useUserPreferences();

  const order = new Map<string, number>();
  active.flow.forEach((f, i) => {
    if (!order.has(f.id)) order.set(f.id, i + 1);
  });

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Start with the problem, not the tool
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          You never switch on the whole suite. You pick the slice of modules that answers your business
          challenge, and run them as one flow. Choose a sample problem below to see exactly which
          sub-processes light up — and in what order they are used.
        </p>
      </div>

      {/* Problem selector */}
      <div className="grid gap-3 md:grid-cols-3">
        {PROBLEMS.map((p, i) => {
          const Icon = PROBLEM_ICON[i] ?? Globe2;
          const selected = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              aria-pressed={selected}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Problem statement {p.index}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.statement}</p>
            </button>
          );
        })}
      </div>

      {/* Matrix */}
      <div className="mt-6 grid gap-4 md:grid-cols-5">
        {COLUMNS.map((col) => {
          const mods = MODULES.filter((m) => m.column === col.key);
          return (
            <div key={col.key} className="rounded-lg border border-border bg-card">
              <div
                className="rounded-t-lg px-3 py-2"
                style={{ backgroundColor: `color-mix(in oklch, ${col.tone} 18%, transparent)` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold text-background"
                    style={{ backgroundColor: col.tone }}
                  >
                    {col.badge}
                  </span>
                  <p className="truncate text-sm font-semibold uppercase tracking-wide text-foreground">
                    {col.label}
                  </p>
                </div>
                <p className="mt-1 hidden text-[11px] leading-snug text-muted-foreground md:block">
                  {col.tagline}
                </p>
              </div>

              <ul className="space-y-1.5 p-2">
                {mods.map((m) => {
                  const step = order.get(m.id);
                  const on = step !== undefined;
                  const navKey = subNavKeyForPath(m.to);
                  const hidden = navKey ? !isEnabled(navKey) : false;
                  return (
                    <li
                      key={m.id}
                      className={`rounded-md border p-2 transition-opacity ${
                        on ? "border-border bg-background" : "hidden border-border/60 opacity-40 md:block"
                      }`}
                      style={on ? { borderColor: col.tone } : undefined}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                        <Link
                          to={m.to}
                          className="min-w-0 truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {m.label}
                        </Link>
                        {on && (
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-background"
                            style={{ backgroundColor: col.tone }}
                          >
                            {col.badge}
                            {step}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-muted-foreground">
                        {m.blurb}
                      </p>
                      {hidden && (
                        <span className="mt-1 inline-block rounded border border-border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          hidden in your settings
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Flow strip */}
      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          The flow for problem {active.index}: {active.title}
        </p>
        <ol className="mt-3 flex flex-wrap items-stretch gap-2">
          {active.flow.map((f, i) => {
            const m = MODULE_BY_ID[f.id];
            if (!m) return null;
            const tone = COLUMNS.find((c) => c.key === m.column)!.tone;
            return (
              <li key={`${f.id}-${i}`} className="flex items-stretch gap-2">
                <div
                  className="w-44 rounded-md border p-2"
                  style={{ borderColor: tone, backgroundColor: `color-mix(in oklch, ${tone} 8%, transparent)` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold text-background"
                      style={{ backgroundColor: tone }}
                    >
                      {i + 1}
                    </span>
                    <Link to={m.to} className="truncate text-xs font-semibold text-foreground hover:underline">
                      {m.label}
                    </Link>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{f.why}</p>
                </div>
                {i < active.flow.length - 1 && (
                  <ArrowRight className="my-auto hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
