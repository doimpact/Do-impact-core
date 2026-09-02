import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function CalcShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/actions/calculators"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> All calculators
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{intro}</p>
      </div>
      {children}
    </div>
  );
}

export function CalcGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-2">{children}</div>;
}

export function CalcInputs({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Inputs</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

export function NumField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-32 rounded-md border bg-background px-2 py-1.5 text-right text-sm tabular-nums"
        />
        {suffix ? <span className="w-12 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

export function CalcResults({
  headline,
  headlineLabel,
  tone = "default",
  children,
}: {
  headline: string;
  headlineLabel: string;
  tone?: "default" | "good" | "warn";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Result</h2>
      <div className={`mt-3 text-4xl font-bold tabular-nums ${toneClass}`}>{headline}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{headlineLabel}</div>
      <div className="mt-5 space-y-2">{children}</div>
    </div>
  );
}

export function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0">
      <div>
        <div className="text-sm">{label}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function NextStep({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        to={to}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function BasisToggle({
  value,
  onChange,
  label = "How do you value recovered time?",
}: {
  value: "constrained" | "unconstrained";
  onChange: (v: "constrained" | "unconstrained") => void;
  label?: string;
}) {
  const options: { key: "constrained" | "unconstrained"; title: string; hint: string }[] = [
    { key: "constrained", title: "Constrained (sold out)", hint: "Every recovered hour becomes units you can sell" },
    { key: "unconstrained", title: "Not constrained", hint: "You value avoided labour / overtime, not extra sales" },
  ];
  return (
    <div className="space-y-2 border-b border-border/60 pb-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              aria-pressed={active}
              className={`rounded-md border p-2.5 text-left transition-colors ${
                active ? "border-primary bg-primary/10" : "bg-background hover:bg-muted/50"
              }`}
            >
              <div className="text-sm font-medium">{o.title}</div>
              <div className="text-xs text-muted-foreground">{o.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AssumptionNote({ text }: { text: string }) {
  return (
    <p className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{text}</p>
  );
}
