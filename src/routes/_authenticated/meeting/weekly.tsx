import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useNumberFormat } from "@/lib/number-format";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ShieldAlert, Network, Gauge, AlertOctagon, TrendingUp, Rocket, ListChecks, Users, ClipboardCheck, CircleDot, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useActiveCompany } from "@/hooks/use-companies";
import { AgendaPicker } from "@/components/meeting/agenda-picker";
import { filterKeyKpis, NO_KEY_KPIS_HINT } from "@/lib/key-kpis";
import { MEETING_STEPS, defaultAgenda, orderAgenda, resolveAgenda, type MeetingStepId } from "@/lib/meeting-agenda";
import {
  HoshinStep, ProgressStep, ConsolidationStep, CapexStep,
  AccountsStep, OpportunitiesStep, ContractsStep, CommercialReviewStep,
  SchedulingStep, SupplyChainStep,
  ProblemSolverStep, A3Step, EightDStep, MroStep,
  DevelopmentStep, LeadershipStep,
} from "@/components/meeting/extra-steps";
import { CompanyMindmap } from "@/components/company-map/CompanyMindmap";

export const Route = createFileRoute("/_authenticated/meeting/weekly")({
  head: () => ({ meta: [{ title: "Weekly SLT Meeting — DO.Impact" }] }),
  component: MeetingMode,
  errorComponent: ({ error }) => <div className="p-8 text-red-600">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

const STEP_ICON: Partial<Record<MeetingStepId, typeof ShieldAlert>> = {
  safety: ShieldAlert,
  company_map: Network,
  framework: Gauge,
  sqdp: Gauge,
  escalations: AlertOctagon,
  kpis: TrendingUp,
  commercial: TrendingUp,
  stakeholders: Users,
  progress: Rocket,
  waterfall: TrendingUp,
  restructuring: CircleDot,
  value_delivered: TrendingUp,
  siop: Gauge,
  npi: Rocket,
  compliance: ShieldAlert,
  shopfloor: Gauge,
  scheduling: Gauge,
  supplychain: TrendingUp,
  calendar: ClipboardCheck,
  actions: ListChecks,
  people: Users,
  development: Users,
  leadership: Users,
  wrap: ClipboardCheck,
};

function MeetingMode() {
  useNumberFormat(); // re-render when the money display setting changes
  const [step, setStep] = useState(0);
  const [fs, setFs] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const {
    prefs, setMeetingSteps,
    saveMeetingPreset, updateMeetingPreset, renameMeetingPreset, deleteMeetingPreset,
  } = useUserPreferences();

  const now = new Date();
  const from7 = format(subDays(now, 6), "yyyy-MM-dd");
  const to = format(now, "yyyy-MM-dd");
  const weekEnd = format(subDays(now, -7), "yyyy-MM-dd");

  const selected = useMemo<MeetingStepId[]>(
    () => resolveAgenda(prefs.meeting_steps, prefs.hidden_keys),
    [prefs.meeting_steps, prefs.hidden_keys],
  );

  const steps = useMemo(() => MEETING_STEPS.filter((s) => selected.includes(s.id)), [selected]);
  const safeStep = Math.min(step, Math.max(steps.length - 1, 0));
  const current = steps[safeStep]!;

  useEffect(() => {
    if (step > steps.length - 1) setStep(Math.max(steps.length - 1, 0));
  }, [steps.length, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) return;
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
      if (e.key === "f") toggleFs();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  const toggleFs = async () => {
    if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); setFs(true); }
    else { await document.exitFullscreen(); setFs(false); }
  };

  const progress = ((safeStep + 1) / steps.length) * 100;
  const CurrentIcon = STEP_ICON[current.id] ?? CircleDot;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-primary" />
            <span className="font-semibold">Weekly SLT Meeting</span>
            <span className="text-sm text-muted-foreground">· {format(now, "EEEE d MMM yyyy")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <SlidersHorizontal className="mr-1 h-4 w-4" /> Customize agenda
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFs}>
              {fs ? <Minimize2 className="mr-1 h-4 w-4" /> : <Maximize2 className="mr-1 h-4 w-4" />}
              {fs ? "Exit" : "Full screen"}
            </Button>
          </div>
        </div>
        <div className="h-1 w-full bg-muted"><div className="h-full transition-all" style={{ width: `${progress}%`, background: current.tone }} /></div>
      </div>

      {/* Agenda strip */}
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {steps.map((s, i) => {
            const active = i === safeStep;
            const done = i < safeStep;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${active ? "border-transparent text-white shadow-sm" : done ? "border-border bg-muted text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                style={active ? { background: s.tone } : undefined}
              >
                <CircleDot className="h-3 w-3" />
                <span>{i + 1}. {s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{ background: current.tone }}>
            <CurrentIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Step {safeStep + 1} of {steps.length}</div>
            <h1 className="text-2xl font-bold">{current.label}</h1>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {current.id === "safety" && <SafetyStep from={from7} to={to} />}
          {current.id === "company_map" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                One picture of the whole company before we drill in: every module you have switched on, sized by activity and coloured by status. Click a node to fan out what is inside it.
              </p>
              <CompanyMindmap />
            </div>
          )}
          {current.id === "framework" && <FrameworkStep />}
          {current.id === "hoshin" && <HoshinStep />}
          {current.id === "waterfall" && <WaterfallStep />}
          {current.id === "value_delivered" && <ValueDeliveredStep />}
          {current.id === "progress" && <ProgressStep />}
          {current.id === "restructuring" && <RestructuringStep />}
          {current.id === "consolidation" && <ConsolidationStep />}
          {current.id === "capex" && <CapexStep />}

          {current.id === "commercial" && <CommercialStep />}
          {current.id === "accounts" && <AccountsStep />}
          {current.id === "opportunities" && <OpportunitiesStep />}
          {current.id === "contracts" && <ContractsStep />}
          {current.id === "stakeholders" && <StakeholdersStep />}
          {current.id === "commercial_review" && <CommercialReviewStep />}

          {current.id === "sqdp" && <SqdpStep from={from7} to={to} />}
          {current.id === "escalations" && <EscalationsStep />}
          {current.id === "kpis" && <KpisStep />}
          {current.id === "siop" && <SiopStep />}
          {current.id === "shopfloor" && <ShopFloorStep />}
          {current.id === "scheduling" && <SchedulingStep />}
          {current.id === "supplychain" && <SupplyChainStep />}
          {current.id === "npi" && <NpiStep />}
          {current.id === "compliance" && <ComplianceStep />}
          {current.id === "calendar" && <CalendarStep />}

          {current.id === "actions" && <ActionsStep dueBy={weekEnd} />}
          {current.id === "problem_solver" && <ProblemSolverStep />}
          {current.id === "a3" && <A3Step />}
          {current.id === "eight_d" && <EightDStep />}
          {current.id === "mro" && <MroStep />}

          {current.id === "people" && <PeopleStep />}
          {current.id === "development" && <DevelopmentStep />}
          {current.id === "leadership" && <LeadershipStep />}

          {current.id === "wrap" && <WrapStep meetingDate={to} />}
        </div>


        {/* Nav */}
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={safeStep === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <div className="text-xs text-muted-foreground">Use ← → arrows to navigate · press <kbd className="rounded border px-1">F</kbd> for full screen</div>
          <Button onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={safeStep === steps.length - 1} style={{ background: current.tone }}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <AgendaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selected={selected}
        onSelectedChange={(next) => { setMeetingSteps(orderAgenda(next)); setStep(0); }}
        onResetToDefault={() => {
          setMeetingSteps(defaultAgenda(prefs.hidden_keys));
          setStep(0);
          toast.success("Agenda reset to the default flow");
        }}
        presets={prefs.meeting_presets}
        hiddenKeys={prefs.hidden_keys}
        onSavePreset={(name, s) => { saveMeetingPreset(name, orderAgenda(s)); toast.success("Agenda preset saved"); }}
        onUpdatePreset={(id, s) => { updateMeetingPreset(id, orderAgenda(s)); toast.success("Preset updated"); }}
        onRenamePreset={(id, name) => renameMeetingPreset(id, name)}
        onDeletePreset={(id) => { deleteMeetingPreset(id); toast.success("Preset deleted"); }}
      />
    </div>
  );
}



/* ================= STEP COMPONENTS ================= */

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold" style={{ color: tone }}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SafetyStep({ from, to }: { from: string; to: string }) {
  const q = useQuery({
    queryKey: ["m-safety", from, to],
    queryFn: async () => (await supabase.from("dm_marks").select("*").eq("category", "safety").gte("mark_date", from).lte("mark_date", to)).data ?? [],
  });
  const e = useQuery({
    queryKey: ["m-safety-esc"],
    queryFn: async () => (await supabase.from("dm_escalations").select("*").eq("category", "safety").neq("status", "closed").order("occurred_on", { ascending: false })).data ?? [],
  });
  const marks = q.data ?? [];
  const green = marks.filter((m: any) => m.status === "green").length;
  const red = marks.filter((m: any) => m.status === "red").length;
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">Always start with safety. Any incidents this week?</p>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Days recorded" value={String(marks.length)} sub="last 7 days" />
        <StatTile label="Green" value={String(green)} tone="#16a34a" />
        <StatTile label="Red" value={String(red)} tone="#dc2626" />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Open safety escalations</div>
        {!e.data?.length ? <EmptyLine text="No open safety escalations." /> : (
          <ul className="space-y-2">
            {e.data.map((x: any) => (
              <li key={x.id} className="rounded border border-red-200 bg-red-50 p-3 text-sm">
                <div className="font-medium">{format(new Date(x.occurred_on), "d MMM")} — {x.concern || "—"}</div>
                {x.countermeasure && <div className="mt-1 text-xs text-neutral-700">Countermeasure: {x.countermeasure}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FrameworkStep() {
  const q = useQuery({
    queryKey: ["m-framework"],
    queryFn: async () => (await supabase.from("pillars").select("id, name, tagline, health").order("sort_order")).data ?? [],
  });
  const pillars = q.data ?? [];
  const counts = { green: 0, yellow: 0, red: 0 } as Record<string, number>;
  pillars.forEach((p: any) => { const h = (p.health || "green"); if (counts[h] != null) counts[h]++; });
  const color = (h: string) => h === "red" ? "#dc2626" : h === "yellow" ? "#eab308" : "#16a34a";
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Current business framework health per Operations pillar.</p>
      <div className="grid grid-cols-3 gap-3">
        {(["green","yellow","red"] as const).map((h) => (
          <div key={h} className="rounded-lg border border-border bg-background p-4 text-center">
            <div className="text-xs uppercase text-muted-foreground">{h}</div>
            <div className="mt-1 text-3xl font-bold" style={{ color: color(h) }}>{counts[h]}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {pillars.map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <span className="h-3 w-3 rounded-full" style={{ background: color(p.health || "green"), boxShadow: `0 0 8px ${color(p.health || "green")}` }} />
            <div className="min-w-0">
              <div className="font-medium">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">{p.tagline || ""}</div>
            </div>
            <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: color(p.health || "green") }}>
              {(p.health || "green").toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SqdpStep({ from, to }: { from: string; to: string }) {

  const q = useQuery({
    queryKey: ["m-sqdp", from, to],
    queryFn: async () => (await supabase.from("dm_marks").select("*").gte("mark_date", from).lte("mark_date", to)).data ?? [],
  });
  const cats = ["safety", "quality", "delivery", "productivity", "people"];
  const marks = q.data ?? [];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">SQDP performance over the last 7 days.</p>
      <div className="grid grid-cols-5 gap-3">
        {cats.map((c) => {
          const r = marks.filter((m: any) => m.category === c);
          const g = r.filter((m: any) => m.status === "green").length;
          const rd = r.filter((m: any) => m.status === "red").length;
          const pct = r.length ? Math.round((g / r.length) * 100) : 0;
          return (
            <div key={c} className="rounded-lg border border-border bg-background p-4 text-center">
              <div className="text-xs uppercase text-muted-foreground">{c}</div>
              <div className="mt-1 text-3xl font-bold" style={{ color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#dc2626" }}>{pct}%</div>
              <div className="mt-1 text-xs text-muted-foreground">{g}G · {rd}R</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EscalationsStep() {
  const q = useQuery({
    queryKey: ["m-esc"],
    queryFn: async () => (await supabase.from("dm_escalations").select("*").neq("status", "closed").order("occurred_on", { ascending: false })).data ?? [],
  });
  const rows = q.data ?? [];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Walk each open 3C: concern, cause, countermeasure — is it moving?</p>
      {!rows.length ? <EmptyLine text="No open 3C escalations." /> : (
        <div className="space-y-2">
          {rows.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{r.category?.toUpperCase()} · {format(new Date(r.occurred_on), "d MMM")}</div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{r.status ?? "open"}</span>
              </div>
              <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                <div><span className="font-medium text-red-700">Concern:</span> {r.concern || "—"}</div>
                <div><span className="font-medium text-amber-700">Cause:</span> {r.cause || "—"}</div>
                <div><span className="font-medium text-emerald-700">Countermeasure:</span> {r.countermeasure || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpisStep() {
  const [showAll, setShowAll] = useState(false);
  const kQ = useQuery({
    queryKey: ["s-kpis"],
    queryFn: async () => (await supabase.from("kpis").select("*, pillars(name)")).data ?? [],
  });
  const vQ = useQuery({
    queryKey: ["s-kpi-vals"],
    queryFn: async () => (await supabase.from("kpi_values").select("*").order("period_start", { ascending: false })).data ?? [],
  });
  const all = kQ.data ?? [];
  const kpis = showAll ? all : filterKeyKpis(all as any[]);
  const vals = vQ.data ?? [];
  const byPillar = new Map<string, any[]>();
  kpis.forEach((k: any) => {
    const pn = k.pillars?.name ?? "Unassigned";
    if (!byPillar.has(pn)) byPillar.set(pn, []);
    byPillar.get(pn)!.push(k);
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {showAll ? `All KPIs (${all.length})` : `Key KPIs only (${kpis.length} of ${all.length})`}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show key KPIs only" : "Show all KPIs"}
        </Button>
      </div>
      {[...byPillar.entries()].map(([pn, ks]) => (
        <div key={pn}>
          <div className="mb-2 text-sm font-semibold">{pn}</div>
          <div className="grid gap-2 md:grid-cols-2">
            {ks.map((k: any) => {
              const latest = vals.find((v: any) => v.kpi_id === k.id);
              let tone = "#94a3b8";
              if (latest?.actual != null && k.target != null) {
                const green = k.higher_is_better ? Number(latest.actual) >= Number(k.green_threshold ?? k.target) : Number(latest.actual) <= Number(k.green_threshold ?? k.target);
                tone = green ? "#16a34a" : "#dc2626";
              }
              return (
                <div key={k.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                  <div>
                    <div className="text-sm font-medium">{k.name}</div>
                    <div className="text-xs text-muted-foreground">Target {k.target ?? "—"} {k.unit ?? ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: tone }}>{latest?.actual ?? "—"} <span className="text-xs font-normal text-muted-foreground">{k.unit ?? ""}</span></div>
                    <div className="text-[10px] text-muted-foreground">{latest?.period_start ? format(new Date(latest.period_start), "MMM yy") : "no data"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {!all.length && <EmptyLine text="No KPIs defined yet." />}
      {!!all.length && !kpis.length && <EmptyLine text={NO_KEY_KPIS_HINT} />}
    </div>
  );
}

function CommercialStep() {
  const oQ = useQuery({
    queryKey: ["s-opps"],
    queryFn: async () => (await supabase.from("opportunities").select("*, accounts(name)").eq("archived", false).order("value", { ascending: false })).data ?? [],
  });
  const tQ = useQuery({
    queryKey: ["m-targets"],
    queryFn: async () => (await supabase.from("growth_targets").select("*").eq("year", new Date().getFullYear())).data ?? [],
  });
  const opps = oQ.data ?? [];
  const targets = tQ.data ?? [];
  const pipe = opps.reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);
  const target = targets.reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0);
  const delta = pipe - target;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Pipeline" value={pipe.toLocaleString()} />
        <StatTile label={`Budget ${new Date().getFullYear()}`} value={target.toLocaleString()} />
        <StatTile label="Gap vs budget" value={delta.toLocaleString()} tone={delta >= 0 ? "#16a34a" : "#dc2626"} />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Top 8 opportunities</div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-2 text-left">Opportunity</th><th className="p-2 text-left">Account</th><th className="p-2 text-left">Stage</th><th className="p-2 text-right">Value</th><th className="p-2 text-left">Close</th></tr></thead>
            <tbody>
              {opps.slice(0, 8).map((o: any) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-2 font-medium">{o.name}</td>
                  <td className="p-2 text-muted-foreground">{o.accounts?.name ?? "—"}</td>
                  <td className="p-2">{o.stage}</td>
                  <td className="p-2 text-right">{Number(o.value ?? 0).toLocaleString()}</td>
                  <td className="p-2 text-muted-foreground">{o.expected_close_date ? format(new Date(o.expected_close_date), "d MMM yy") : "—"}</td>
                </tr>
              ))}
              {!opps.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No opportunities.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InitiativesStep() {
  const q = useQuery({
    queryKey: ["s-initiatives"],
    queryFn: async () => (await supabase.from("initiatives").select("*").is("archived_at", null)).data ?? [],
  });
  const init = q.data ?? [];
  const stages = ["L0", "L1", "L2", "L3", "L4", "L5"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2">
        {stages.map((s) => {
          const n = init.filter((i: any) => (i.current_stage ?? "L0") === s).length;
          return (
            <div key={s} className="rounded-lg border border-border bg-background p-3 text-center">
              <div className="text-xs text-muted-foreground">{s}</div>
              <div className="text-2xl font-bold">{n}</div>
            </div>
          );
        })}
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Top 5 by validated value (L2)</div>
        <ul className="space-y-1.5">
          {[...init].sort((a: any, b: any) => Number(b.validated_value_l2 ?? 0) - Number(a.validated_value_l2 ?? 0)).slice(0, 5).map((i: any) => (
            <li key={i.id} className="flex items-center justify-between rounded border border-border bg-background p-2 text-sm">
              <span><span className="mr-2 rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800">{i.current_stage ?? "L0"}</span>{i.title}</span>
              <span className="font-mono text-xs">{Number(i.validated_value_l2 ?? 0).toLocaleString()}</span>
            </li>
          ))}
          {!init.length && <EmptyLine text="No active initiatives." />}
        </ul>
      </div>
    </div>
  );
}

function ActionsStep({ dueBy }: { dueBy: string }) {
  const q = useQuery({
    queryKey: ["m-actions", dueBy],
    queryFn: async () => (await supabase.from("tasks").select("*, pillars(name)").neq("status", "done").lte("due_date", dueBy).order("due_date", { ascending: true })).data ?? [],
  });
  const rows = q.data ?? [];
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Open actions due by {format(new Date(dueBy), "d MMM")}. Confirm owners & unblock.</p>
      {!rows.length ? <EmptyLine text="Nothing due this week." /> : (
        <ul className="space-y-1.5">
          {rows.map((t: any) => {
            const overdue = t.due_date && t.due_date < today;
            return (
              <li key={t.id} className={`flex items-center justify-between rounded border p-2.5 text-sm ${overdue ? "border-red-200 bg-red-50" : "border-border bg-background"}`}>
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.pillars?.name ?? "—"} · {t.status}</div>
                </div>
                <div className={`text-xs font-medium ${overdue ? "text-red-700" : "text-muted-foreground"}`}>{t.due_date ? format(new Date(t.due_date), "d MMM") : "—"}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PeopleStep() {
  const eQ = useQuery({ queryKey: ["s-emp"], queryFn: async () => (await supabase.from("employees").select("id, role_id")).data ?? [] });
  const sQ = useQuery({ queryKey: ["s-empsk"], queryFn: async () => (await supabase.from("employee_skills").select("employee_id, skill_id, level")).data ?? [] });
  const rQ = useQuery({ queryKey: ["s-reqs"], queryFn: async () => (await supabase.from("role_requirements").select("role_id, skill_id, required_level")).data ?? [] });
  const cQ = useQuery({ queryKey: ["m-certs"], queryFn: async () => (await supabase.from("certifications").select("*, employees(first_name, last_name)").not("expires_on", "is", null).order("expires_on")).data ?? [] });
  const emp = eQ.data ?? [], empSk = sQ.data ?? [], reqs = rQ.data ?? [], certs = cQ.data ?? [];
  let met = 0, total = 0;
  emp.forEach((e: any) => {
    if (!e.role_id) return;
    reqs.filter((r: any) => r.role_id === e.role_id).forEach((r: any) => {
      total++;
      const es = empSk.find((s: any) => s.employee_id === e.id && s.skill_id === r.skill_id);
      if (es && Number(es.level ?? 0) >= Number(r.required_level ?? 0)) met++;
    });
  });
  const pct = total ? Math.round((met / total) * 100) : 0;
  const horizon = subDays(new Date(), -30);
  const expiring = certs.filter((c: any) => c.expires_on && new Date(c.expires_on) <= horizon);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Skill coverage" value={`${pct}%`} sub={`${met} / ${total} met`} tone={pct >= 80 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626"} />
        <StatTile label="Employees" value={String(emp.length)} />
        <StatTile label="Certs expiring 30d" value={String(expiring.length)} tone={expiring.length ? "#dc2626" : "#16a34a"} />
      </div>
      {expiring.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Expiring soon</div>
          <ul className="space-y-1 text-sm">
            {expiring.slice(0, 8).map((c: any) => (
              <li key={c.id} className="flex justify-between rounded border border-red-200 bg-red-50 p-2">
                <span>{c.employees ? `${c.employees.first_name} ${c.employees.last_name}` : "—"} · {c.name}</span>
                <span className="font-medium text-red-700">{format(new Date(c.expires_on), "d MMM yy")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WrapStep({ meetingDate }: { meetingDate: string }) {
  const qc = useQueryClient();
  // Compute Monday of this week as week_start
  const weekStart = useMemo(() => {
    const d = new Date(meetingDate);
    const day = d.getDay(); // 0 Sun … 6 Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return format(d, "yyyy-MM-dd");
  }, [meetingDate]);

  const activeCompany = useActiveCompany();
  const companyId = activeCompany.data?.company_id ?? null;

  const q = useQuery({
    enabled: !!companyId,
    queryKey: ["m-notes", weekStart, companyId],
    queryFn: async () => (await supabase.from("meeting_notes").select("*").eq("company_id", companyId!).eq("week_start", weekStart).maybeSingle()).data,
  });

  const [decisions, setDecisions] = useState("");
  const [actions, setActions] = useState("");
  const [risks, setRisks] = useState("");
  const [attendees, setAttendees] = useState("");

  useEffect(() => {
    const n = (q.data?.section_notes ?? {}) as { decisions?: string; actions?: string; risks?: string };
    setDecisions(n.decisions ?? "");
    setActions(n.actions ?? "");
    setRisks(n.risks ?? "");
    setAttendees((q.data?.attendees ?? []).join(", "));
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await getCurrentUser();
      const payload = {
        ...(companyId ? { company_id: companyId } : {}),
        week_start: weekStart,
        section_notes: { decisions, actions, risks },
        attendees: attendees.split(",").map((s) => s.trim()).filter(Boolean),
        created_by: u.user?.id,
      };
      const { error } = await supabase.from("meeting_notes").upsert(payload, { onConflict: "company_id,week_start" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["m-notes", weekStart, companyId] });
      toast.success("Meeting notes saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Capture outcomes for the week of {format(new Date(weekStart), "d MMM yyyy")}. Notes persist and can be pulled into the board report.</p>
      <div>
        <label className="text-xs font-semibold uppercase text-muted-foreground">Attendees (comma separated)</label>
        <Textarea rows={1} value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Alex, Sam, Priya…" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase text-emerald-700">Decisions</label>
          <Textarea rows={5} value={decisions} onChange={(e) => setDecisions(e.target.value)} placeholder="What did we decide?" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-blue-700">Actions</label>
          <Textarea rows={5} value={actions} onChange={(e) => setActions(e.target.value)} placeholder="Who owns what by when?" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-red-700">Risks / escalations</label>
          <Textarea rows={5} value={risks} onChange={(e) => setRisks(e.target.value)} placeholder="What needs surfacing?" />
        </div>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save meeting notes"}</Button>
    </div>
  );
}


/* ============ New SLT step components ============ */

function DataTable({ head, rows, empty }: { head: string[]; rows: (string | number)[][]; empty: string }) {
  if (!rows.length) return <EmptyLine text={empty} />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted"><tr>{head.map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="p-2">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StakeholdersStep() {
  const aQ = useQuery({ queryKey: ["m-accts"], queryFn: async () => (await supabase.from("accounts").select("*").is("archived_at", null)).data ?? [] });
  const tQ = useQuery({ queryKey: ["m-touch"], queryFn: async () => (await supabase.from("stakeholder_touchpoints").select("*").order("scheduled_at", { ascending: false }).limit(15)).data ?? [] });
  const accts = aQ.data ?? [], tps = tQ.data ?? [];
  const byCrit: Record<string, number> = {};
  accts.forEach((a: any) => { const c = a.tier ?? "unrated"; byCrit[c] = (byCrit[c] ?? 0) + 1; });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Accounts" value={String(accts.length)} />
        <StatTile label="Critical" value={String(byCrit["a"] ?? 0)} tone="#dc2626" />
        <StatTile label="Recent touchpoints" value={String(tps.length)} />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Recent touchpoints</div>
        <DataTable head={["Date","Stakeholder","Channel","Summary"]} rows={tps.map((t: any) => [t.scheduled_at ? format(new Date(t.scheduled_at), "d MMM") : "—", t.subject ?? "—", t.type ?? "—", t.notes ?? ""])} empty="No recent touchpoints." />
      </div>
    </div>
  );
}

function WaterfallStep() {
  const bQ = useQuery({ queryKey: ["m-wf-b"], queryFn: async () => (await supabase.from("waterfall_bridges").select("*").is("archived_at", null)).data ?? [] });
  const iQ = useQuery({ queryKey: ["m-wf-i"], queryFn: async () => (await supabase.from("waterfall_items").select("*")).data ?? [] });
  const bs = bQ.data ?? [], items = iQ.data ?? [];
  const tBase = bs.reduce((s: number, b: any) => s + Number(b.baseline_value ?? 0), 0);
  const tTarg = bs.reduce((s: number, b: any) => s + Number(b.target_value ?? 0), 0);
  const bMap = new Map(bs.map((b: any) => [b.id, b.title]));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Bridges" value={String(bs.length)} />
        <StatTile label="Baseline" value={tBase.toLocaleString()} />
        <StatTile label="Target" value={tTarg.toLocaleString()} tone="#16a34a" />
      </div>
      <DataTable head={["Bridge","Metric","Baseline","Target"]} rows={bs.map((b: any) => [b.title, b.metric ?? "—", Number(b.baseline_value ?? 0).toLocaleString(), Number(b.target_value ?? 0).toLocaleString()])} empty="No bridges." />
      {items.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Top value levers</div>
          <DataTable head={["Bridge","Lever","Category","Impact"]} rows={items.slice(0, 8).map((i: any) => [bMap.get(i.bridge_id) ?? "—", i.label, i.category ?? "—", Number(i.gross_impact ?? 0).toLocaleString()])} empty="—" />
        </div>
      )}
    </div>
  );
}

function RestructuringStep() {
  const pQ = useQuery({ queryKey: ["s-rest-proj"], queryFn: async () => (await supabase.from("restructuring_projects").select("*").is("archived_at", null)).data ?? [] });
  const iQ = useQuery({ queryKey: ["s-rest-items"], queryFn: async () => (await supabase.from("restructuring_items").select("*").is("archived_at", null)).data ?? [] });
  const ps = pQ.data ?? [], items = iQ.data ?? [];
  const openItems = items.filter((i: any) => (i.status ?? "").toLowerCase() !== "done" && (i.status ?? "").toLowerCase() !== "closed");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Projects" value={String(ps.length)} />
        <StatTile label="Open items" value={String(openItems.length)} />
        <StatTile label="Total items" value={String(items.length)} />
      </div>
      <DataTable head={["Project","Status","Start","Target"]} rows={ps.map((p: any) => [p.name, p.status ?? "—", p.start_date ? format(new Date(p.start_date), "d MMM yy") : "—", p.target_date ? format(new Date(p.target_date), "d MMM yy") : "—"])} empty="No restructuring projects." />
    </div>
  );
}

function ValueDeliveredStep() {
  const q = useQuery({ queryKey: ["s-obj-benefits"], queryFn: async () => (await supabase.from("objective_monthly_benefits").select("*")).data ?? [] });
  const oQ = useQuery({ queryKey: ["m-benefits-obj"], queryFn: async () => (await supabase.from("strategic_objectives").select("id, title")).data ?? [] });
  const b = q.data ?? [], objs = oQ.data ?? [];
  const tPlan = b.reduce((s: number, m: any) => s + Number(m.value ?? 0), 0);
  const tAct = b.reduce((s: number, m: any) => s + Number(m.actual ?? 0), 0);
  const pct = tPlan ? Math.round((tAct / tPlan) * 100) : 0;
  const byObj = new Map<string, { plan: number; actual: number }>();
  b.forEach((m: any) => { const c = byObj.get(m.objective_id) ?? { plan: 0, actual: 0 }; c.plan += Number(m.value ?? 0); c.actual += Number(m.actual ?? 0); byObj.set(m.objective_id, c); });
  const oMap = new Map(objs.map((o: any) => [o.id, o.title]));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Plan" value={tPlan.toLocaleString()} />
        <StatTile label="Actual" value={tAct.toLocaleString()} tone={tAct >= tPlan ? "#16a34a" : "#f59e0b"} />
        <StatTile label="Realization" value={`${pct}%`} tone={pct >= 90 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626"} />
      </div>
      <DataTable head={["Objective","Plan","Actual","%"]} rows={Array.from(byObj.entries()).map(([id, v]) => [oMap.get(id) ?? "—", v.plan.toLocaleString(), v.actual.toLocaleString(), `${v.plan ? Math.round((v.actual / v.plan) * 100) : 0}%`])} empty="No benefit data captured yet." />
    </div>
  );
}

function SiopStep() {
  const cQ = useQuery({ queryKey: ["m-siop-cy"], queryFn: async () => (await supabase.from("siop_cycles" as never).select("*").order("cycle_month", { ascending: false }).limit(1)).data ?? [] });
  const llQ = useQuery({ queryKey: ["s-siop-ll"], queryFn: async () => (await supabase.from("siop_long_lead_materials" as never).select("*")).data ?? [] });
  const osQ = useQuery({ queryKey: ["s-siop-osp"], queryFn: async () => (await supabase.from("siop_osp_jobs" as never).select("*")).data ?? [] });
  const cycle = (cQ.data ?? [])[0] as any;
  const ll = llQ.data ?? [], osp = osQ.data ?? [];
  const llRisk = ll.filter((m: any) => m.risk === "high" || m.status !== "on_track");
  const ospRisk = osp.filter((j: any) => j.status !== "on_track");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Latest cycle: {cycle ? (cycle.title ?? cycle.cycle_month) : "—"}</p>
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="Long-lead" value={String(ll.length)} />
        <StatTile label="LL at risk" value={String(llRisk.length)} tone={llRisk.length ? "#dc2626" : "#16a34a"} />
        <StatTile label="OSP jobs" value={String(osp.length)} />
        <StatTile label="OSP at risk" value={String(ospRisk.length)} tone={ospRisk.length ? "#dc2626" : "#16a34a"} />
      </div>
      {llRisk.length > 0 && <div><div className="mb-2 text-sm font-semibold">Long-lead materials at risk</div>
        <DataTable head={["Material","Supplier","Expected","Status"]} rows={llRisk.slice(0, 10).map((m: any) => [m.material, m.supplier ?? "—", m.expected_date ? format(new Date(m.expected_date), "d MMM") : "—", m.status ?? "—"])} empty="—" />
      </div>}
    </div>
  );
}

function NpiStep() {
  const pQ = useQuery({ queryKey: ["s-npi-proj"], queryFn: async () => (await supabase.from("npi_projects" as never).select("*").is("archived_at", null)).data ?? [] });
  const rQ = useQuery({ queryKey: ["s-npi-risks"], queryFn: async () => (await supabase.from("npi_risks" as never).select("*")).data ?? [] });
  const ps = pQ.data ?? [], rs = rQ.data ?? [];
  const openRisks = rs.filter((r: any) => r.status !== "closed");
  const byGate: Record<string, number> = {};
  ps.forEach((p: any) => { const g = p.current_gate ?? "G0"; byGate[g] = (byGate[g] ?? 0) + 1; });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Projects" value={String(ps.length)} />
        <StatTile label="Open risks" value={String(openRisks.length)} tone={openRisks.length ? "#dc2626" : "#16a34a"} />
        <StatTile label="Gates active" value={String(Object.keys(byGate).length)} />
      </div>
      <DataTable head={["Part #","Name","Customer","Gate","Health"]} rows={ps.slice(0, 10).map((p: any) => [p.part_number ?? "—", p.part_name ?? "—", p.customer ?? "—", p.current_gate ?? "—", (p.health ?? "—").toUpperCase()])} empty="No NPI projects." />
    </div>
  );
}

function ComplianceStep() {
  const q = useQuery({ queryKey: ["s-compliance"], queryFn: async () => (await supabase.from("compliance_snapshots" as never).select("*").order("created_at", { ascending: false }).limit(5)).data ?? [] });
  const snaps = q.data ?? [];
  const latest = snaps[0] as any;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Snapshots" value={String(snaps.length)} />
        <StatTile label="Latest score" value={latest?.percent != null ? `${latest.overall_score}%` : "—"} tone={latest?.percent >= 90 ? "#16a34a" : latest?.percent >= 70 ? "#f59e0b" : "#dc2626"} />
        <StatTile label="Latest date" value={latest?.created_at ? format(new Date(latest.created_at), "d MMM") : "—"} />
      </div>
      <DataTable head={["Date","Saved by","Score","Notes"]} rows={snaps.map((s: any) => [s.created_at ? format(new Date(s.created_at), "d MMM yy") : "—", s.created_by_email ?? "—", s.percent != null ? `${s.percent}%` : "—", s.label ?? ""])} empty="No compliance snapshots saved yet." />
    </div>
  );
}

function ShopFloorStep() {
  const lQ = useQuery({ queryKey: ["s-shop-lines"], queryFn: async () => (await supabase.from("aps_value_streams" as never).select("*")).data ?? [] });
  const gQ = useQuery({ queryKey: ["s-shop-gates"], queryFn: async () => (await supabase.from("shop_floor_gates" as never).select("*")).data ?? [] });
  const pQ = useQuery({ queryKey: ["s-shop-parts"], queryFn: async () => (await supabase.from("shop_floor_parts" as never).select("*")).data ?? [] });
  const lines = lQ.data ?? [], gates = gQ.data ?? [], parts = pQ.data ?? [];
  const wipByGate = new Map<string, number>();
  parts.forEach((p: any) => { wipByGate.set(p.current_gate_id, (wipByGate.get(p.current_gate_id) ?? 0) + 1); });
  const overs = gates.filter((g: any) => g.wip_cap != null && (wipByGate.get(g.id) ?? 0) > Number(g.wip_cap));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Lines" value={String(lines.length)} />
        <StatTile label="Gates" value={String(gates.length)} />
        <StatTile label="Over WIP cap" value={String(overs.length)} tone={overs.length ? "#dc2626" : "#16a34a"} />
      </div>
      <DataTable head={["Line","Gates","Parts in WIP"]} rows={lines.map((l: any) => [l.name, String(gates.filter((g: any) => g.line_id === l.id).length), String(parts.filter((p: any) => p.line_id === l.id).length)])} empty="No lines configured." />
    </div>
  );
}

function CalendarStep() {
  const q = useQuery({ queryKey: ["m-cal"], queryFn: async () => (await supabase.from("calendar_events").select("*").is("archived_at", null).order("event_date", { ascending: true })).data ?? [] });
  const events = q.data ?? [];
  const now = new Date();
  const upcoming = events.filter((e: any) => e.event_date && new Date(e.event_date) >= now && new Date(e.event_date) <= subDays(now, -60));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Upcoming audits and events (next 60 days).</p>
      <DataTable head={["Date","Type","Title","Owner","Status"]} rows={upcoming.slice(0, 20).map((e: any) => [format(new Date(e.event_date), "d MMM yy"), e.event_type ?? "—", e.title ?? "—", e.assignee_id ?? "—", e.status ?? "—"])} empty="No events scheduled." />
    </div>
  );
}
