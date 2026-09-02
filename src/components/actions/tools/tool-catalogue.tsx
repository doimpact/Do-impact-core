import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Circle } from "lucide-react";
import { DECISION_GUIDE_CATALOGUE, SYMPTOMS, TOOLS_CATALOGUE, TOOL_BY_ID, type ToolDef, type ToolId } from "@/lib/problem-tools";

export function ToolCards({ items }: { items?: readonly (ToolDef | (Omit<ToolDef, "id"> & { id: string }))[] }) {
  const cards = items ?? TOOLS_CATALOGUE;
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((t) => (
        <Card key={t.id} className="flex h-full flex-col">

          <CardContent className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-tight">{t.name}</h3>
              <Badge variant="secondary" className={t.tone}>{t.short}</Badge>
            </div>
            <dl className="space-y-2 text-xs">
              <Row label="Solves" value={t.problem} />
              <Row label="Mechanism" value={t.mechanism} />
              <Row label="Aerospace example" value={t.example} />
            </dl>
            <div className="mt-auto space-y-2 pt-1">
              <div className="flex flex-wrap gap-1">
                {t.links.map((l) => (
                  <Link key={l.to} to={l.to} className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                ))}
              </div>
              <Button asChild size="sm" className="w-full">
                <Link to={t.to}>Open {t.short} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ToolGuides() {
  return (
    <div className="space-y-8">


      {/* Decision guide */}
      <section className="space-y-3" data-tour="ps-toolkit">
        <div>
          <h2 className="text-lg font-semibold">Which tool for which problem?</h2>
          <p className="text-sm text-muted-foreground">Name the nature of the pain first — the tool follows from it.</p>
        </div>
        <div className="grid gap-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">

          {DECISION_GUIDE_CATALOGUE.map((d, i) => {
            const t = TOOL_BY_ID[d.tool];
            return (
              <Link key={d.tool} to={t.to} className="group relative rounded-xl border border-border p-3 transition-colors hover:border-primary/50">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${t.bar}`}>{i + 1}</span>
                <p className="mt-2 text-sm font-semibold">{d.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d.answer}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-medium">
                  {t.name} <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Symptom → tool matrix */}
      <section className="space-y-3" data-tour="ps-symptom-matrix">
        <div>
          <h2 className="text-lg font-semibold">Symptom → tool matrix</h2>
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> primary tool</span>
            <span className="mx-2">·</span>
            <span className="inline-flex items-center gap-1"><Circle className="h-2.5 w-2.5" /> supporting tool</span>
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[960px] text-sm">

            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-3 text-left font-medium">Symptom you actually feel</th>
                {TOOLS_CATALOGUE.map((t) => (
                  <th key={t.id} className="p-3 text-center font-medium">
                    <Link to={t.to} className="hover:underline">{t.short}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SYMPTOMS.map((s) => (
                <tr key={s.label} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.detail}</p>
                  </td>
                  {TOOLS_CATALOGUE.map((t) => (
                    <td key={t.id} className="p-3 text-center">
                      <Mark strength={s.fit[t.id as ToolId]} bar={t.bar} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Mark({ strength, bar }: { strength?: "strong" | "support"; bar: string }) {
  if (!strength) return <span className="text-muted-foreground/30">—</span>;
  if (strength === "strong")
    return (
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-white ${bar}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${bar} opacity-50`} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
