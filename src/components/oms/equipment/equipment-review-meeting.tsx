import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProfiles, ownerLabel } from "@/components/owner-select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EquipmentProject, EquipmentChecklistItem, EquipmentPunchItem, EquipmentRampEntry } from "./types";
import { STAGE_LABELS, STAGE_COLORS, HEALTH_COLORS, EQUIPMENT_STATUS_LABELS, oeeOf, money } from "./types";

export function EquipmentReviewMeeting({ projects, onClose }: { projects: EquipmentProject[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const p = projects[i];
  const { data: profiles = [] } = useProfiles();

  const checklistQ = useQuery({
    queryKey: ["equipment_checklist", p?.id],
    enabled: !!p,
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_gate_checklist")
        .select("*").eq("project_id", p.id).order("stage").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentChecklistItem[];
    },
  });

  const punchQ = useQuery({
    queryKey: ["equipment_punch", p?.id],
    enabled: !!p,
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_punch_items").select("*").eq("project_id", p.id);
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentPunchItem[];
    },
  });

  const rampQ = useQuery({
    queryKey: ["equipment_ramp", p?.id],
    enabled: !!p,
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_ramp_log").select("*").eq("project_id", p.id).order("entry_date");
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentRampEntry[];
    },
  });

  if (!p) return null;
  const items = checklistQ.data ?? [];
  const stageItems = items.filter((x) => x.stage === p.stage);
  const stagePct = stageItems.length ? Math.round((stageItems.filter((x) => x.completed).length / stageItems.length) * 100) : 0;
  const openPunch = (punchQ.data ?? []).filter((x) => x.status !== "closed");
  const latest = (rampQ.data ?? []).at(-1);
  const latestOee = latest ? oeeOf(latest) : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <Badge className={STAGE_COLORS[p.stage]}>S{p.stage} — {STAGE_LABELS[p.stage].short}</Badge>
            {p.asset_name}
            {p.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_COLORS[p.health])} />}
            <span className="ml-auto text-xs font-normal text-muted-foreground">{i + 1} / {projects.length}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-xs font-semibold text-muted-foreground">Programme</div>
            <div className="mt-1">{p.vendor ?? "—"} · {p.line_area ?? "—"}</div>
            <div className="text-xs text-muted-foreground">PO {p.po_number ?? "—"} · {money(p.contract_value, p.currency)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Owner: {ownerLabel(profiles.find((x) => x.id === p.owner_id))} · Maintenance: {ownerLabel(profiles.find((x) => x.id === p.maintenance_owner_id))}
            </div>
            <div className="mt-1 text-xs">{EQUIPMENT_STATUS_LABELS[p.status] ?? p.status} · target handover {p.target_handover_date ?? "—"}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs font-semibold text-muted-foreground">Gate readiness — {STAGE_LABELS[p.stage].milestone}</div>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={stagePct} className="h-2" />
              <span className="text-xs">{stagePct}%</span>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {stageItems.filter((x) => !x.completed).slice(0, 5).map((x) => (
                <li key={x.id} className="text-muted-foreground">• {x.label}</li>
              ))}
              {stageItems.every((x) => x.completed) && <li className="text-emerald-600">All stage items complete — ready to gate.</li>}
            </ul>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs font-semibold text-muted-foreground">Open punch items ({openPunch.length})</div>
            <ul className="mt-1 space-y-1 text-xs">
              {openPunch.slice(0, 6).map((x) => <li key={x.id}>• {x.title} <span className="text-muted-foreground">({x.severity}{x.due_date ? `, due ${x.due_date}` : ""})</span></li>)}
              {openPunch.length === 0 && <li className="text-emerald-600">Punch list clear.</li>}
            </ul>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs font-semibold text-muted-foreground">Ramp &amp; OEE</div>
            {latest ? (
              <div className="mt-1 text-xs">
                <div>{latest.entry_date}: plan {latest.planned_pct ?? "—"}% vs actual {latest.actual_pct ?? "—"}%</div>
                <div className={cn(latestOee != null && latestOee < p.oee_target && "text-destructive")}>
                  OEE {latestOee ?? "—"}% (target {p.oee_target}%) · MTBF {latest.mtbf_hours ?? "—"}h · MTTR {latest.mttr_hours ?? "—"}h
                </div>
                <div className="text-muted-foreground">Sustain requirement: {p.sustain_shifts} consecutive shifts at target.</div>
              </div>
            ) : (
              <p className="mt-1 text-xs italic text-muted-foreground">No ramp data logged yet.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button>
          <Button variant="outline" disabled={i >= projects.length - 1} onClick={() => setI(i + 1)}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
