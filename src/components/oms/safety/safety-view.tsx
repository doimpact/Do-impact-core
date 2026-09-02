import { useState } from "react";
import { Plus, Footprints, ClipboardList, Gauge, BookOpen, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SAFETY_PILLARS, SAFETY_TOTAL_ITEMS } from "@/lib/compliance-safety";
import { ComplianceFramework } from "@/components/oms/compliance-framework";
import { WALK_TYPES, type SafetyReport } from "@/lib/safety";
import { useSafetyReports, useSafetyWalks } from "./use-safety";
import { ReportDialog } from "./report-dialog";
import { ReportDetail } from "./report-detail";
import { WalkDialog } from "./walk-dialog";
import { SafetyDashboard } from "./safety-dashboard";
import { SafetyRegister } from "./safety-register";
import { SafetyFrameworkNotes } from "./safety-framework-notes";

type Tab = "dashboard" | "register" | "walks" | "framework";

const TABS: { key: Tab; label: string; Icon: typeof Gauge }[] = [
  { key: "dashboard", label: "Dashboard", Icon: Gauge },
  { key: "register", label: "Safety register", Icon: ClipboardList },
  { key: "walks", label: "Safety walks", Icon: Footprints },
  { key: "framework", label: "Framework & checklist", Icon: BookOpen },
];

export function SafetyView() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [reportOpen, setReportOpen] = useState(false);
  const [walkOpen, setWalkOpen] = useState(false);
  const [walkId, setWalkId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SafetyReport | null>(null);

  const { data: reports, isLoading } = useSafetyReports();
  const { data: walks } = useSafetyWalks();
  const rows = reports ?? [];
  const walkRows = walks ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Site Safety Management</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Identify → assess → control → report → correct → verify → learn. Every reported hazard has a visible path
            from discovery to verified closure.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="outline" onClick={() => setWalkOpen(true)}>
            <Footprints className="mr-2 h-4 w-4" /> Log safety walk
          </Button>
          <Button onClick={() => { setWalkId(null); setReportOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Report a hazard
          </Button>
        </div>
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
        <SafetyDashboard reports={rows} walks={walkRows} />
      ) : tab === "register" ? (
        <SafetyRegister reports={rows} onOpen={setSelected} />
      ) : tab === "walks" ? (
        <div className="space-y-3">
          {walkRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No walks logged yet. Daily supervisor walks are the cheapest hazard-detection system you have.
            </div>
          ) : (
            walkRows.map((w) => {
              const linked = rows.filter((r) => r.walk_id === w.id);
              return (
                <div key={w.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {WALK_TYPES.find((t) => t.key === w.walk_type)?.label ?? w.walk_type}
                        {w.area ? ` — ${w.area}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {w.walk_date} · {w.led_by || "Unnamed lead"}
                        {w.participants ? ` · with ${w.participants}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{linked.length} finding{linked.length === 1 ? "" : "s"}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="no-print"
                        onClick={() => { setWalkId(w.id); setReportOpen(true); }}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add finding
                      </Button>
                    </div>
                  </div>
                  {w.good_practices && (
                    <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">Good practice: {w.good_practices}</p>
                  )}
                  {w.notes && <p className="mt-1 text-sm text-muted-foreground">{w.notes}</p>}
                  {linked.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t pt-2 text-sm">
                      {linked.map((r) => (
                        <li key={r.id}>
                          <button className="text-left hover:underline" onClick={() => setSelected(r)}>
                            <span className="font-mono text-xs text-muted-foreground">{r.ref ?? "—"}</span> {r.description}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <ComplianceFramework
            framework="safety"
            title="Site Safety Management Framework"
            subtitle="Leadership, hazard identification, risk assessment, controls, engagement, walks, incident learning and metrics. Tick items as evidence is verified and save the review as an internal audit record."
            pillars={SAFETY_PILLARS}
            totalItems={SAFETY_TOTAL_ITEMS}
            pillarWord="Pillar"
            footer={
              <div className="rounded-xl border-l-4 border-red-500 bg-red-500/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4" /> Operating principle
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage the highest potential consequence, not just the number of injuries. A near miss with fatality
                  potential outranks ten first-aid cases.
                </p>
              </div>
            }
          />
          <SafetyFrameworkNotes />
        </div>
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        walkId={walkId}
        defaultSource={walkId ? "safety_walk" : "report"}
      />
      <WalkDialog open={walkOpen} onOpenChange={setWalkOpen} onLogged={(id) => { setWalkId(id); setTab("walks"); }} />
      <ReportDetail report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
