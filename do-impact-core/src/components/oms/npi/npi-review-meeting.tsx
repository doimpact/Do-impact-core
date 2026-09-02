import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfiles, ownerLabel } from "@/components/owner-select";
import type { NpiProject, ChecklistItem, NpiRisk } from "./npi-types";
import { GATE_LABELS, GATE_COLORS, HEALTH_COLORS, STATUS_LABELS } from "./npi-types";

export function NpiReviewMeeting({
  projects, onClose,
}: {
  projects: NpiProject[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [decisions, setDecisions] = useState("");
  const { data: profiles = [] } = useProfiles();

  const ids = useMemo(() => projects.map((p) => p.id), [projects]);
  const checklistQ = useQuery({
    queryKey: ["npi_checklist_meeting", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("npi_gate_checklist").select("*").in("project_id", ids);
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
  });
  const risksQ = useQuery({
    queryKey: ["npi_risks_meeting", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("npi_risks").select("*").in("project_id", ids).neq("status","closed");
      if (error) throw error;
      return (data ?? []) as NpiRisk[];
    },
  });

  const items = checklistQ.data ?? [];
  const risks = risksQ.data ?? [];

  const steps = [
    { key: "cover", label: "Portfolio Overview" },
    { key: "gate1", label: "Gate 1 — Planning" },
    { key: "gate2", label: "Gate 2 — Product Design" },
    { key: "gate3", label: "Gate 3 — Process Design" },
    { key: "gate4", label: "Gate 4 — Validation" },
    { key: "gate5", label: "Gate 5 — Ramp" },
    { key: "risks", label: "Risks" },
    { key: "decisions", label: "Decisions" },
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, steps.length]);

  const owner = (id: string | null) => ownerLabel(profiles.find((p) => p.id === id));

  const pctFor = (projectId: string, gate: number) => {
    const list = items.filter((i) => i.project_id === projectId && i.gate === gate);
    if (!list.length) return 0;
    return Math.round((list.filter((i) => i.completed).length / list.length) * 100);
  };

  const today = new Date();
  const in30 = new Date(); in30.setDate(today.getDate() + 30);

  const nextMilestone = (p: NpiProject): { label: string; date: string } | null => {
    const opts: [string, string | null][] = [
      ["PDR/CDR", p.pdr_cdr_date], ["PRR", p.prr_date], ["FAI", p.fai_date], ["EIS", p.eis_date || p.target_eis_date],
    ];
    const upcoming = opts.filter(([, d]) => d && new Date(d) >= today).sort((a, b) => (a[1]! < b[1]! ? -1 : 1));
    return upcoming.length ? { label: upcoming[0][0], date: upcoming[0][1]! } : null;
  };

  const byGate = (g: number) => projects.filter((p) => p.current_gate === g);

  const current = steps[step].key;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NPI Review Meeting</p>
          <h1 className="text-xl font-bold truncate">{projects.length} project{projects.length===1?"":"s"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <button key={s.key} onClick={() => setStep(i)}
                className={cn("h-2 w-8 rounded-full transition", i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted")}
                title={s.label} />
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Step {step + 1} / {steps.length} — {steps[step].label}
          </p>

          {current === "cover" && (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-5">
                {[1,2,3,4,5].map((g) => (
                  <div key={g} className="rounded-lg border p-4">
                    <Badge className={GATE_COLORS[g]}>Gate {g}</Badge>
                    <div className="text-3xl font-bold mt-2">{byGate(g).length}</div>
                    <div className="text-xs text-muted-foreground">{GATE_LABELS[g].short}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">At risk / delayed</div>
                  <div className="text-3xl font-bold mt-1">{projects.filter((p) => p.status === "at_risk" || p.status === "delayed").length}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">Health red</div>
                  <div className="text-3xl font-bold mt-1 text-red-500">{projects.filter((p) => p.health === "red").length}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-muted-foreground">Milestones next 30 days</div>
                  <div className="text-3xl font-bold mt-1">
                    {projects.reduce((acc, p) => {
                      const n = nextMilestone(p);
                      return n && new Date(n.date) <= in30 ? acc + 1 : acc;
                    }, 0)}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Upcoming milestones (30 days)</h3>
                <ul className="divide-y border rounded-md">
                  {projects.map((p) => ({ p, m: nextMilestone(p) }))
                    .filter((x) => x.m && new Date(x.m!.date) <= in30)
                    .sort((a, b) => (a.m!.date < b.m!.date ? -1 : 1))
                    .map(({ p, m }) => (
                      <li key={p.id} className="flex items-center gap-3 p-2.5 text-sm">
                        <Badge className={GATE_COLORS[p.current_gate]}>G{p.current_gate}</Badge>
                        <span className="font-medium">{p.part_number}</span>
                        <span className="text-muted-foreground truncate">{p.customer}</span>
                        <span className="ml-auto text-xs">{m!.label} · <b>{m!.date}</b></span>
                      </li>
                    ))}
                  {projects.every((p) => { const n = nextMilestone(p); return !n || new Date(n.date) > in30; }) && (
                    <li className="p-3 text-sm text-muted-foreground italic">None in the next 30 days.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {current.startsWith("gate") && (() => {
            const g = Number(current.slice(4));
            const list = byGate(g);
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className={GATE_COLORS[g]}>Gate {g}</Badge>
                  <h3 className="text-lg font-semibold">{GATE_LABELS[g].full}</h3>
                  <span className="text-sm text-muted-foreground">→ {GATE_LABELS[g].milestone}</span>
                </div>
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No projects currently at this gate.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {list.map((p) => (
                      <div key={p.id} className="rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          {p.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_COLORS[p.health])} />}
                          <span className="font-semibold">{p.part_number}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{STATUS_LABELS[p.status]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{p.customer} · {owner(p.owner_id)}</div>
                        <div className="mt-2 text-xs">Gate {g} checklist: <b>{pctFor(p.id, g)}%</b> complete</div>
                        {nextMilestone(p) && <div className="text-xs text-muted-foreground">Next: {nextMilestone(p)!.label} — {nextMilestone(p)!.date}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {current === "risks" && (
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs">
                <tr>
                  <th className="p-2 text-left">Project</th>
                  <th className="p-2 text-left">Risk</th>
                  <th className="p-2 text-left">Mitigation</th>
                  <th className="p-2">Score</th>
                  <th className="p-2 text-left">Owner</th>
                </tr>
              </thead>
              <tbody>
                {risks
                  .map((r) => ({ r, score: (r.likelihood ?? 0) * (r.impact ?? 0), proj: projects.find((p) => p.id === r.project_id) }))
                  .sort((a, b) => b.score - a.score)
                  .map(({ r, score, proj }) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 text-xs">{proj?.part_number ?? "—"}</td>
                      <td className="p-2">
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.category}</div>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">{r.mitigation}</td>
                      <td className="p-2 text-center font-semibold">{score || "-"}</td>
                      <td className="p-2 text-xs">{owner(r.owner_id)}</td>
                    </tr>
                  ))}
                {risks.length === 0 && <tr><td colSpan={5} className="p-3 text-sm text-muted-foreground italic text-center">No open risks.</td></tr>}
              </tbody>
            </table>
          )}

          {current === "decisions" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Decisions & next steps</h3>
              <Textarea rows={16} value={decisions} onChange={(e) => setDecisions(e.target.value)} placeholder="Capture decisions taken, actions owned, gate advancements approved…" />
              <p className="text-xs text-muted-foreground">Copy/paste into your program record — not auto-saved.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t px-6 py-3 flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="text-xs text-muted-foreground">Use ← / → to navigate · Esc to close</div>
        <Button onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={step === steps.length - 1}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </footer>
    </div>
  );
}
