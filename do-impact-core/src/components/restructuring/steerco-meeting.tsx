import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMembers } from "./teams-panel";
import { useProfiles, ownerLabel } from "@/components/owner-select";
import { cn } from "@/lib/utils";
import type { RestructuringProject } from "./project-switcher";

type Item = {
  id: string;
  section: string;
  kind: string;
  parent_id: string | null;
  workstream_id: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  health: "green" | "yellow" | "red" | null;
  due_date: string | null;
  meta: Record<string, unknown>;
};

const HEALTH_BG: Record<string, string> = { green: "bg-green-500", yellow: "bg-amber-400", red: "bg-red-500" };

export function SteerCoMeeting({
  project, onClose,
}: {
  project: RestructuringProject;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [decisions, setDecisions] = useState("");
  const [checkins, setCheckins] = useState<Record<string, boolean>>({});

  const { data: items = [] } = useQuery({
    queryKey: ["restructuring_items_meeting", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("restructuring_items")
        .select("*").eq("project_id", project.id).is("archived_at", null)
        .order("sort_order").order("created_at");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
  const { data: members = [] } = useMembers(project.id);
  const { data: profiles = [] } = useProfiles();

  const attendees = useMemo(() => members.filter((m) => m.body === "steerco" || m.body === "pmo"), [members]);

  const steps = [
    { key: "cover", label: "Cover" },
    { key: "governance", label: "Governance & Teams" },
    { key: "workstreams", label: "Workstreams" },
    { key: "objectives", label: "Objectives & Drivers" },
    { key: "roadmap", label: "Roadmap" },
    { key: "risks", label: "Risks" },
    { key: "scope", label: "Scope & Change" },
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

  const current = steps[step].key;
  const ownerLabel_ = (id: string | null) => ownerLabel(profiles.find((p) => p.id === id));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SteerCo Meeting</p>
          <h1 className="text-xl font-bold truncate">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <button key={s.key}
                onClick={() => setStep(i)}
                className={cn("h-2 w-8 rounded-full transition", i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted")}
                title={s.label}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Step {step + 1} / {steps.length} — {steps[step].label}
          </p>

          {current === "cover" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold">{project.name}</h2>
                {project.description && <p className="mt-2 text-lg text-muted-foreground">{project.description}</p>}
                <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                  {project.start_date && <div><b>Start:</b> {project.start_date}</div>}
                  {project.target_date && <div><b>Target:</b> {project.target_date}</div>}
                  <div><b>Owner:</b> {ownerLabel_(project.owner_id)}</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Attendees ({attendees.length})</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {attendees.map((m) => (
                    <label key={m.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
                      <input type="checkbox" checked={!!checkins[m.id]} onChange={(e) => setCheckins((c) => ({ ...c, [m.id]: e.target.checked }))} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.body === "steerco" ? "SteerCo" : "PMO"}{m.role ? ` · ${m.role}` : ""}</div>
                      </div>
                    </label>
                  ))}
                  {attendees.length === 0 && <p className="text-sm text-muted-foreground italic">No members added — add them under Governance.</p>}
                </div>
              </div>
            </div>
          )}

          {current === "governance" && (
            <div className="space-y-6">
              {(["steerco", "pmo", "workstream"] as const).map((body) => {
                const list = members.filter((m) => m.body === body);
                const label = body === "steerco" ? "Steering Committee" : body === "pmo" ? "PMO" : "Workstream Execution Teams";
                return (
                  <div key={body}>
                    <h3 className="text-lg font-semibold mb-2">{label} ({list.length})</h3>
                    <div className="grid gap-1.5 md:grid-cols-2">
                      {list.map((m) => (
                        <div key={m.id} className="rounded border border-border p-2 text-sm">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.role || "—"}{m.workstream_name ? ` · ${m.workstream_name}` : ""}
                          </div>
                        </div>
                      ))}
                      {!list.length && <p className="text-sm text-muted-foreground italic">None</p>}
                    </div>
                  </div>
                );
              })}
              <div>
                <h3 className="text-lg font-semibold mb-2">Governance entities</h3>
                <div className="grid gap-2 md:grid-cols-3">
                  {items.filter((i) => i.kind === "governance_entity").map((e) => (
                    <div key={e.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center gap-2">
                        {e.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_BG[e.health])} />}
                        <span className="font-semibold text-sm">{e.title}</span>
                      </div>
                      {e.description && <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {current === "workstreams" && (
            <div className="space-y-4">
              {items.filter((i) => i.kind === "workstream").length === 0 && (
                <p className="text-sm text-muted-foreground italic">No workstreams defined for this project yet.</p>
              )}
              {items.filter((i) => i.kind === "workstream").map((w) => {
                const objectives = items.filter((i) => i.kind === "objective" && i.workstream_id === w.id);
                const milestones = items.filter((i) => i.kind === "milestone" && i.workstream_id === w.id);
                const dueSoon = milestones.filter((m) => m.status !== "done").slice(0, 4);
                const risks = items
                  .filter((i) => i.kind === "risk" && i.workstream_id === w.id)
                  .sort((a, b) => {
                    const sc = (x: Item) => Number((x.meta as { likelihood?: number }).likelihood ?? 0) * Number((x.meta as { impact?: number }).impact ?? 0);
                    return sc(b) - sc(a);
                  })
                  .slice(0, 3);
                const roll = [...objectives, ...milestones];
                const pct = roll.length ? Math.round(roll.reduce((s, i) => s + i.progress, 0) / roll.length) : w.progress;
                return (
                  <div key={w.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      {w.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_BG[w.health])} />}
                      <h3 className="text-lg font-bold">{w.title}</h3>
                      <span className="text-xs text-muted-foreground">· {ownerLabel_(w.owner_id)}</span>
                      <span className="ml-auto text-sm tabular-nums">{pct}%</span>
                    </div>
                    {w.description && <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>}
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Milestones open</p>
                        <ul className="mt-1 space-y-1 text-sm">
                          {dueSoon.map((m) => (
                            <li key={m.id} className="flex items-center gap-2">
                              {m.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_BG[m.health])} />}
                              <span className="truncate">{m.title}</span>
                              {m.due_date && <span className="ml-auto text-xs text-muted-foreground">{m.due_date}</span>}
                            </li>
                          ))}
                          {!dueSoon.length && <li className="text-xs text-muted-foreground italic">None open</li>}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top risks</p>
                        <ul className="mt-1 space-y-1 text-sm">
                          {risks.map((r) => (
                            <li key={r.id} className="flex items-center gap-2">
                              {r.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_BG[r.health])} />}
                              <span className="truncate">{(r.meta as { category?: string }).category ?? r.title}</span>
                            </li>
                          ))}
                          {!risks.length && <li className="text-xs text-muted-foreground italic">None logged</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}



          {current === "objectives" && (
            <div className="space-y-4">
              {items.filter((i) => i.kind === "objective").map((o) => (
                <div key={o.id} className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    {o.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_BG[o.health])} />}
                    <h3 className="text-xl font-bold">{o.title}</h3>
                    <span className="ml-auto text-sm tabular-nums">{o.progress}%</span>
                  </div>
                  {o.description && <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>}
                </div>
              ))}
              <div className="grid gap-3 md:grid-cols-2">
                {items.filter((i) => i.kind === "value_driver").map((d) => {
                  const kpis = items.filter((k) => k.kind === "kpi" && k.parent_id === d.id);
                  return (
                    <div key={d.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center gap-2">
                        {d.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_BG[d.health])} />}
                        <h4 className="font-semibold">{d.title}</h4>
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{d.progress}%</span>
                      </div>
                      {kpis.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t border-border pt-2">
                          {kpis.map((k) => (
                            <li key={k.id} className="flex items-center gap-2 text-xs">
                              {k.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_BG[k.health])} />}
                              <span className="truncate">{k.title}</span>
                              <span className="ml-auto tabular-nums text-muted-foreground">{k.progress}%</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {current === "roadmap" && (
            <div className="space-y-3">
              {items.filter((i) => i.kind === "phase").map((p) => {
                const ms = items.filter((m) => m.kind === "milestone" && m.parent_id === p.id);
                return (
                  <div key={p.id} className="rounded-md border border-border">
                    <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                      {p.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_BG[p.health])} />}
                      <h4 className="font-semibold">{p.title}</h4>
                      <span className="ml-auto text-xs tabular-nums">{p.progress}%</span>
                    </div>
                    {ms.length > 0 && (
                      <ul className="divide-y divide-border">
                        {ms.map((m) => {
                          const overdue = m.due_date && new Date(m.due_date) < new Date() && m.status !== "done";
                          return (
                            <li key={m.id} className={cn("flex items-center gap-2 px-3 py-2 text-sm", overdue && "bg-destructive/5")}>
                              {m.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_BG[m.health])} />}
                              <span className="truncate flex-1">{m.title}</span>
                              {m.due_date && <span className={cn("text-xs tabular-nums", overdue ? "text-destructive font-semibold" : "text-muted-foreground")}>due {m.due_date}</span>}
                              <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{m.progress}%</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {current === "risks" && (
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs">
                <tr>
                  <th className="px-2 py-2 text-left">Risk</th>
                  <th className="px-2 py-2 text-left">Mitigation</th>
                  <th className="px-2 py-2 text-left">Score</th>
                  <th className="px-2 py-2 text-left">Owner</th>
                </tr>
              </thead>
              <tbody>
                {items.filter((i) => i.kind === "risk")
                  .map((r) => {
                    const m = r.meta as { category?: string; likelihood?: number; impact?: number; mitigation?: string };
                    return { r, score: (m.likelihood ?? 0) * (m.impact ?? 0), m };
                  })
                  .sort((a, b) => b.score - a.score)
                  .map(({ r, score, m }) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          {r.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_BG[r.health])} />}
                          <span className="font-medium">{m.category ?? r.title}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{m.mitigation}</td>
                      <td className="px-2 py-2 tabular-nums font-semibold">{score || "-"}</td>
                      <td className="px-2 py-2 text-xs">{ownerLabel_(r.owner_id)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {current === "scope" && (
            <div className="space-y-3">
              {items.filter((i) => i.kind === "change_request").map((c) => {
                const m = c.meta as { date_raised?: string; cost_impact?: string; schedule_impact?: string; cr_status?: string };
                return (
                  <div key={c.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      {c.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_BG[c.health])} />}
                      <span className="font-semibold">{c.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{m.cr_status ?? "-"}</span>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      {m.date_raised && <span>Raised: {m.date_raised}</span>}
                      {m.cost_impact && <span>Cost: {m.cost_impact}</span>}
                      {m.schedule_impact && <span>Schedule: {m.schedule_impact}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {current === "decisions" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Decisions & next steps</h3>
              <Textarea rows={16} value={decisions} onChange={(e) => setDecisions(e.target.value)} placeholder="Capture decisions taken, actions owned, deadlines…" />
              <p className="text-xs text-muted-foreground">Copy/paste this into your PMO record — it is not auto-saved.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-3 flex items-center justify-between">
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
