import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PART145_PILLARS, PART145_TOTAL_ITEMS } from "@/lib/compliance-part145";
import { SMS_PILLARS, SMS_TOTAL_ITEMS } from "@/lib/compliance-sms";
import { ComplianceFramework } from "@/components/oms/compliance-framework";
import { SafetyView } from "@/components/oms/safety/safety-view";
import { BcmView } from "@/components/oms/bcm/bcm-view";
import { AmpmView } from "@/components/oms/ampm/ampm-view";
import { ShieldCheck, AlertTriangle, LifeBuoy, HardHat, Building2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/oms/compliance")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : "",
  }),
  head: () => ({
    meta: [
      { title: "Compliance & SMS — DO.Impact" },
      {
        name: "description",
        content:
          "Audit-ready Part 145 repair station and Safety Management System (SMS) compliance checklists with internal audit records.",
      },
      { property: "og:title", content: "Compliance & SMS — DO.Impact" },
      {
        property: "og:description",
        content: "Part 145 and ICAO Annex 19 SMS compliance checklists with saved internal audits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompliancePage,
});

type Tab = "part145" | "sms" | "safety" | "bcm" | "ampm";

const TABS: Tab[] = ["part145", "sms", "safety", "bcm", "ampm"];

function CompliancePage() {
  const { tab: tabParam } = Route.useSearch();
  const initial = (TABS as string[]).includes(tabParam) ? (tabParam as Tab) : "part145";
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    if ((TABS as string[]).includes(tabParam)) setTab(tabParam as Tab);
  }, [tabParam]);


  return (
    <div className="space-y-6">
      <style>{`@media print{
        .no-print{display:none!important}
        .print-open{display:block!important}
        body{background:white}
      }`}</style>

      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Operations · Compliance
        </div>
        <h1 className="mt-1 text-3xl font-bold">Regulatory Compliance</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Two audit-ready frameworks. Tick items as evidence is verified, capture evidence notes, and save the review as an
          internal audit record for traceability.
        </p>
      </div>

      <div className="no-print flex flex-wrap gap-2 border-b">
        {([
          { key: "part145" as const, label: "Part 145 Repair Station", Icon: ShieldCheck },
          { key: "sms" as const, label: "Safety Management System (SMS)", Icon: LifeBuoy },
          { key: "safety" as const, label: "Safety", Icon: HardHat },
          { key: "bcm" as const, label: "Business Continuity", Icon: Building2 },
          { key: "ampm" as const, label: "AM / PM", Icon: Wrench },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.Icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "part145" ? (
        <ComplianceFramework
          framework="part145"
          title="Part 145 Repair Station Compliance"
          subtitle="Checklist covering FAA / EASA Part 145 regulatory certificates, manuals, personnel, facilities, quality and oversight."
          pillars={PART145_PILLARS}
          totalItems={PART145_TOTAL_ITEMS}
          pillarWord="Pillar"
          footer={
            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Operational insight — top audit findings
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                During FAA or EASA audits, the top three fine-inducing systemic vulnerabilities for Part 145 stations are:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                <li>Out-of-calibration tools left in active toolboxes.</li>
                <li>Expired shelf-life materials in production areas.</li>
                <li>Untracked revisions on personnel rosters or contract vendor lists.</li>
              </ol>
            </div>
          }
        />
      ) : tab === "sms" ? (
        <ComplianceFramework
          framework="sms"
          title="Safety Management System (SMS)"
          subtitle="ICAO Annex 19 four components and twelve elements, aligned with 14 CFR Part 5 and EASA requirements. Each item states the evidence an auditor expects to see."
          pillars={SMS_PILLARS}
          totalItems={SMS_TOTAL_ITEMS}
          pillarWord="Component"
          footer={
            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Operational insight — where SMS audits fail
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                An SMS is judged on evidence of use, not on the manual. The recurring findings are:
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                <li>Hazard register and risk assessments not updated after occurrences or changes.</li>
                <li>Safety performance indicators defined but never trended or reviewed by the Accountable Executive.</li>
                <li>Corrective actions closed without verification that the risk control is effective.</li>
                <li>Reporters receiving no feedback, which quietly kills the reporting rate.</li>
              </ol>
            </div>
          }
        />
      ) : tab === "safety" ? (
        <SafetyView />
      ) : tab === "bcm" ? (
        <BcmView />
      ) : (
        <AmpmView />
      )}
    </div>
  );
}
