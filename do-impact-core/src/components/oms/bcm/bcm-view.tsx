import { useState } from "react";
import { Gauge, ClipboardList, ShieldAlert, Boxes, Siren, BookOpen, LifeBuoy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BCM_PILLARS, BCM_TOTAL_ITEMS } from "@/lib/compliance-bcm";
import { ComplianceFramework } from "@/components/oms/compliance-framework";
import { BcmDashboard } from "./bcm-dashboard";
import { BiaTable } from "./bia-table";
import { RiskRegister } from "./risk-register";
import { AssetRegisters } from "./asset-registers";
import { IncidentsPanel } from "./incidents-panel";
import { BcmFrameworkNotes } from "./bcm-framework-notes";
import {
  useBcmActions,
  useBcmAssets,
  useBcmExercises,
  useBcmIncidents,
  useBcmProcesses,
  useBcmRisks,
} from "./use-bcm";

type Tab = "dashboard" | "bia" | "risks" | "registers" | "incidents" | "framework";

const TABS: { key: Tab; label: string; Icon: typeof Gauge }[] = [
  { key: "dashboard", label: "Dashboard", Icon: Gauge },
  { key: "bia", label: "Business impact analysis", Icon: ClipboardList },
  { key: "risks", label: "Risk register", Icon: ShieldAlert },
  { key: "registers", label: "Continuity registers", Icon: Boxes },
  { key: "incidents", label: "Incidents & exercises", Icon: Siren },
  { key: "framework", label: "Framework & plan", Icon: BookOpen },
];

export function BcmView() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const { data: processes, isLoading } = useBcmProcesses();
  const { data: risks } = useBcmRisks();
  const { data: assets } = useBcmAssets();
  const { data: incidents } = useBcmIncidents();
  const { data: exercises } = useBcmExercises();
  const { data: actions } = useBcmActions();

  const p = processes ?? [];
  const r = risks ?? [];
  const a = assets ?? [];
  const i = incidents ?? [];
  const e = exercises ?? [];
  const act = actions ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Business Continuity Management</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Protect people → stabilize → continue critical operations → communicate → recover → learn → improve. Know who
          is in charge, what happens first, which operations are critical and how long you can run without them.
        </p>
      </div>

      <div className="no-print flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.Icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : tab === "dashboard" ? (
        <BcmDashboard processes={p} risks={r} assets={a} incidents={i} exercises={e} actions={act} />
      ) : tab === "bia" ? (
        <BiaTable processes={p} />
      ) : tab === "risks" ? (
        <RiskRegister risks={r} actions={act} />
      ) : tab === "registers" ? (
        <AssetRegisters assets={a} />
      ) : tab === "incidents" ? (
        <IncidentsPanel incidents={i} exercises={e} actions={act} />
      ) : (
        <div className="space-y-6">
          <ComplianceFramework
            framework="bcm"
            title="Business Continuity Management Program"
            subtitle="Policy and responsibilities, business impact analysis, risk assessment, continuity strategies, activation and communication, response playbooks, recovery and improvement. Tick items as evidence is verified and save the review as an internal audit record."
            pillars={BCM_PILLARS}
            totalItems={BCM_TOTAL_ITEMS}
            pillarWord="Pillar"
            footer={
              <div className="rounded-xl border-l-4 border-sky-500 bg-sky-500/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-400">
                  <LifeBuoy className="h-4 w-4" /> Operating principle
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  A recovery plan that has never been tested is an untested assumption. Exercise it, find the gaps and
                  close them with owners and due dates.
                </p>
              </div>
            }
          />
          <BcmFrameworkNotes />
        </div>
      )}
    </div>
  );
}
