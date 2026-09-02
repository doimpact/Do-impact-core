import { useState } from "react";
import { Gauge, Boxes, ClipboardCheck, CalendarClock, Wrench, Droplets, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AMPM_PILLARS, AMPM_TOTAL_ITEMS } from "@/lib/compliance-ampm";
import { ComplianceFramework } from "@/components/oms/compliance-framework";
import { AmpmDashboard } from "./ampm-dashboard";
import { EquipmentRegister } from "./equipment-register";
import { AmPanel } from "./am-panel";
import { PmPanel } from "./pm-panel";
import { BreakdownsPanel } from "./breakdowns-panel";
import { SparesPanel } from "./spares-panel";
import { AmpmFrameworkNotes } from "./ampm-framework-notes";
import {
  useAbnormalities,
  useAmChecks,
  useAmpmActions,
  useBreakdowns,
  useEquipment,
  useLubrication,
  usePmTasks,
  useSpares,
  useWorkOrders,
} from "./use-ampm";

type Tab = "dashboard" | "equipment" | "am" | "pm" | "breakdowns" | "spares" | "framework";

const TABS: { key: Tab; label: string; Icon: typeof Gauge }[] = [
  { key: "dashboard", label: "Dashboard", Icon: Gauge },
  { key: "equipment", label: "Equipment register", Icon: Boxes },
  { key: "am", label: "Autonomous maintenance", Icon: ClipboardCheck },
  { key: "pm", label: "Preventive maintenance", Icon: CalendarClock },
  { key: "breakdowns", label: "Breakdowns & reliability", Icon: Wrench },
  { key: "spares", label: "Spares & lubrication", Icon: Droplets },
  { key: "framework", label: "Framework & plan", Icon: BookOpen },
];

export function AmpmView() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const { data: equipment, isLoading } = useEquipment();
  const { data: checks } = useAmChecks();
  const { data: abnormalities } = useAbnormalities();
  const { data: tasks } = usePmTasks();
  const { data: orders } = useWorkOrders();
  const { data: breakdowns } = useBreakdowns();
  const { data: spares } = useSpares();
  const { data: lubrication } = useLubrication();
  const { data: actions } = useAmpmActions();

  const eq = equipment ?? [];
  const ch = checks ?? [];
  const ab = abnormalities ?? [];
  const pt = tasks ?? [];
  const wo = orders ?? [];
  const bd = breakdowns ?? [];
  const sp = spares ?? [];
  const lu = lubrication ?? [];
  const ac = actions ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">AM / PM — Maintenance & Reliability</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          CLEAN → INSPECT → DETECT → PLAN → MAINTAIN → VERIFY → IMPROVE. Operators own basic equipment care and early
          detection; maintenance owns planned technical maintenance and reliability; engineering eliminates chronic
          problems.
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
        <AmpmDashboard
          equipment={eq}
          checks={ch}
          abnormalities={ab}
          tasks={pt}
          orders={wo}
          breakdowns={bd}
          spares={sp}
          actions={ac}
        />
      ) : tab === "equipment" ? (
        <EquipmentRegister equipment={eq} />
      ) : tab === "am" ? (
        <AmPanel equipment={eq} checks={ch} abnormalities={ab} />
      ) : tab === "pm" ? (
        <PmPanel equipment={eq} tasks={pt} orders={wo} />
      ) : tab === "breakdowns" ? (
        <BreakdownsPanel equipment={eq} breakdowns={bd} actions={ac} />
      ) : tab === "spares" ? (
        <SparesPanel equipment={eq} spares={sp} lubrication={lu} />
      ) : (
        <div className="space-y-6">
          <ComplianceFramework
            framework="ampm"
            title="Autonomous & Preventive Maintenance Programme"
            subtitle="Ownership, equipment register and criticality, autonomous maintenance, abnormality tagging, preventive maintenance, lubrication and spares, breakdowns and root cause, verification and improvement."
            pillars={AMPM_PILLARS}
            totalItems={AMPM_TOTAL_ITEMS}
            auditNoun="AM/PM audit"
            footer={<AmpmFrameworkNotes />}
          />
        </div>
      )}
    </div>
  );
}
