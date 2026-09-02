import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EolProgram, EolChecklistItem, EolReadinessItem, EolLtbItem, EolMigrationItem } from "./types";
import { PHASE_LABELS, PHASE_COLORS, HEALTH_COLORS, EOL_STATUS_LABELS, money, pct, eolKpis } from "./types";

export function EolReviewMeeting({ programs, onClose }: { programs: EolProgram[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const p = programs[Math.min(i, programs.length - 1)];

  const detail = useQuery({
    queryKey: ["eol_review", p?.id],
    enabled: !!p,
    queryFn: async () => {
      const [c, r, l, m] = await Promise.all([
        supabase.from("eol_gate_checklist").select("*").eq("program_id", p.id),
        supabase.from("eol_readiness").select("*").eq("program_id", p.id),
        supabase.from("eol_ltb_items").select("*").eq("program_id", p.id),
        supabase.from("eol_customer_migration").select("*").eq("program_id", p.id),
      ]);
      return {
        checklist: (c.data ?? []) as unknown as EolChecklistItem[],
        readiness: (r.data ?? []) as unknown as EolReadinessItem[],
        ltb: (l.data ?? []) as unknown as EolLtbItem[],
        migration: (m.data ?? []) as unknown as EolMigrationItem[],
      };
    },
  });

  if (!p) return null;
  const d = detail.data;
  const phaseItems = (d?.checklist ?? []).filter((c) => c.phase === p.phase);
  const phasePct = phaseItems.length ? Math.round((phaseItems.filter((c) => c.completed).length / phaseItems.length) * 100) : 0;
  const gaps = (d?.readiness ?? []).filter((r) => !r.complete);
  const k = d ? eolKpis(p, d.ltb, [], d.migration) : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge className={PHASE_COLORS[p.phase]}>{PHASE_LABELS[p.phase].code} — {PHASE_LABELS[p.phase].short}</Badge>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold">{p.product_name}</h2>
              <div className="text-sm text-muted-foreground">
                {[p.platform, p.family].filter(Boolean).join(" · ")} · {EOL_STATUS_LABELS[p.status] ?? p.status}
              </div>
            </div>
            {p.health && <span className={cn("mt-2 h-3 w-3 rounded-full", HEALTH_COLORS[p.health])} />}
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Current gate checklist</span><span>{phasePct}%</span></div>
            <Progress value={phasePct} className="h-2" />
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-4">
            <Stat label="FTS" value={p.fts_date ?? "—"} />
            <Stat label="LTB cutoff" value={p.ltb_cutoff_date ?? "—"} />
            <Stat label="Reserve" value={money(p.reserve_budget, p.currency)} />
            <Stat label="Migration rate" value={pct(k?.migrationRate ?? null, 0)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Open readiness gaps ({gaps.length})</div>
              <ul className="mt-2 space-y-1 text-sm">
                {gaps.slice(0, 8).map((g) => <li key={g.id}>· <span className="text-muted-foreground">{g.domain}:</span> {g.deliverable}</li>)}
                {gaps.length === 0 && <li className="text-muted-foreground">All gate deliverables complete.</li>}
              </ul>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Last Time Buy</div>
              <div className="mt-2 space-y-1 text-sm">
                <div>Lines: {d?.ltb.length ?? 0}</div>
                <div>Committed spend: {money(k?.ltbSpend ?? null, p.currency)}</div>
                <div>Demand variance vs forecast: {pct(k?.ltbVariance ?? null)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="font-semibold">Next gate:</span>{" "}
            {p.phase < 5
              ? `${PHASE_LABELS[(p.phase + 1) as 2 | 3 | 4 | 5].code} — ${PHASE_LABELS[(p.phase + 1) as 2 | 3 | 4 | 5].full} (${PHASE_LABELS[(p.phase + 1) as 2 | 3 | 4 | 5].window})`
              : "Final closeout sign-off"}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Button variant="outline" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">{i + 1} / {programs.length}</span>
            <Button variant="outline" onClick={() => setI((x) => Math.min(programs.length - 1, x + 1))} disabled={i >= programs.length - 1}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
