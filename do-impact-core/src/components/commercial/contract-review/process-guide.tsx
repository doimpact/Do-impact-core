import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComplianceFramework } from "@/components/oms/compliance-framework";
import {
  AUTHORITY_CRITERIA, BID_REVIEW_PILLARS, BID_REVIEW_TOTAL_ITEMS, CADENCE, CHAIN_OF_CONTROL,
  FORMS, GOVERNANCE_PRINCIPLE, PROCESS_KPIS, RACI_NOTE, RACI_ROLES, RACI_ROWS, RETENTION_RECORDS, SCOPE_TRIGGERS,
} from "@/lib/bid-contract-review";

const RACI_TONE: Record<string, string> = {
  R: "bg-primary/15 text-primary",
  A: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  C: "bg-muted text-muted-foreground",
  I: "bg-transparent text-muted-foreground/70",
};

export function ContractReviewProcessGuide() {
  return (
    <ComplianceFramework
      framework="bidreview"
      title="Bid & contract review process"
      subtitle="Do not commit the company to anything the function that has to deliver it has not accepted. Tick where you actually stand."
      pillars={BID_REVIEW_PILLARS}
      totalItems={BID_REVIEW_TOTAL_ITEMS}
      pillarWord="Section"
      auditNoun="process audit"
      footer={<ProcessReference />}
    />
  );
}

function ProcessReference() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">When formal review is mandatory</CardTitle></CardHeader>
        <CardContent className="grid gap-1.5 sm:grid-cols-2 text-sm text-muted-foreground">
          {SCOPE_TRIGGERS.map((t) => <div key={t}>· {t}</div>)}
          <p className="sm:col-span-2 pt-2 text-xs">
            Routine quotations inside standard commercial and contractual terms may run through the standard quotation
            process, subject to the delegation of authority.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">RACI</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left font-medium py-1.5 pr-3">Activity</th>
                  {RACI_ROLES.map((r) => <th key={r} className="font-medium py-1.5 px-1.5 text-center">{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {RACI_ROWS.map((row) => (
                  <tr key={row.activity} className="border-t">
                    <td className="py-1.5 pr-3">{row.activity}</td>
                    {row.cells.map((c, i) => (
                      <td key={i} className="py-1.5 px-1.5 text-center">
                        <span className={`inline-flex h-6 min-w-6 px-1.5 items-center justify-center rounded text-xs font-medium ${RACI_TONE[c[0]] ?? ""}`}>{c}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{RACI_NOTE}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Meeting cadence</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {CADENCE.map((c) => (
            <div key={c.meeting} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{c.meeting}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.timing}</p>
              <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                {c.purpose.map((p) => <li key={p}>· {p}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Standard forms and records</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {FORMS.map((f) => (
            <div key={f.n} className="rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Form {f.n}</Badge>
                <span className="font-medium text-sm">{f.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{f.fields.join(" · ")}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Approval authority</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Maintain a separate delegation of authority matrix. Thresholds should consider:</p>
            <div className="grid gap-1 sm:grid-cols-2">{AUTHORITY_CRITERIA.map((a) => <div key={a}>· {a}</div>)}</div>
            <p className="pt-1 text-foreground text-sm font-medium">No individual may approve a commitment outside their delegated authority.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Record retention</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {RETENTION_RECORDS.map((r) => <div key={r}>· {r}</div>)}
            <p className="pt-1 text-xs">Retained in the controlled document system and readily retrievable.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Process performance indicators</CardTitle></CardHeader>
        <CardContent className="grid gap-1 sm:grid-cols-2 text-sm text-muted-foreground">
          {PROCESS_KPIS.map((k) => <div key={k}>· {k}</div>)}
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Core governance principle</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Bid and contract review is not a Sales or Legal activity alone.
          </p>
          <blockquote className="border-l-2 border-primary pl-3 text-sm italic">{GOVERNANCE_PRINCIPLE}</blockquote>
          <div>
            <p className="text-xs text-muted-foreground mb-2">The objective is an unbroken chain of control:</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {CHAIN_OF_CONTROL.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className="rounded border bg-muted/40 px-2 py-1 text-xs">{step}</span>
                  {i < CHAIN_OF_CONTROL.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
