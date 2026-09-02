import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, Compass, Target, TrendingUp, DollarSign, LineChart, CalendarDays,
  Timer, Factory, Package, Users, SlidersHorizontal, Play, Pause, RotateCcw,
  ChevronRight, MousePointerClick, Network, Sparkles,
} from "lucide-react";

type Scene = {
  key: string;
  duration: number;
  title: string;
  kicker: string;
  tone: string;
  breadcrumb: string;
  caption: string;
  Icon: typeof Compass;
  render: (p: number) => React.ReactNode;
};

function ease(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}
function stagger(p: number, i: number, step = 0.12, dur = 0.22) {
  return ease((p - 0.08 - i * step) / dur);
}

const NAVY = "#0F172A";
const AMBER = "#F59E0B";

function Cursor({ x, y, show }: { x: number; y: number; show: number }) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left: `${x}%`, top: `${y}%`, opacity: show, transform: "translate(-2px,-2px)" }}
    >
      <MousePointerClick className="h-5 w-5 drop-shadow" style={{ color: AMBER }} />
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card p-3 ${className}`}>{children}</div>;
}

function Row({ label, right, op, tone }: { label: string; right?: React.ReactNode; op: number; tone?: string }) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5 text-[11px]"
      style={{ opacity: op, transform: `translateY(${(1 - op) * 8}px)`, borderColor: tone }}
    >
      <span className="truncate font-medium">{label}</span>
      {right}
    </div>
  );
}

function Chip({ text, tone }: { text: string; tone: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
      style={{ background: `color-mix(in oklch, ${tone} 15%, transparent)`, color: tone }}
    >
      {text}
    </span>
  );
}

// ---------------- Scenes ----------------

const COMPANIES = ["TitanScale Template (demo, read-only)", "Northgate Precision", "+ Create a company"];

function CompanyScene(p: number) {
  return (
    <div className="relative flex h-full items-center justify-center">
      <Panel className="w-[62%]">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold">
          <Building2 className="h-3.5 w-3.5" style={{ color: AMBER }} /> Select a company
        </div>
        <div className="space-y-1.5">
          {COMPANIES.map((c, i) => {
            const op = stagger(p, i, 0.14);
            const picked = i === 0 && p > 0.66;
            return (
              <Row
                key={c}
                label={c}
                op={op}
                tone={picked ? AMBER : undefined}
                right={picked ? <Chip text="ACTIVE" tone={AMBER} /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              />
            );
          })}
        </div>
      </Panel>
      <Cursor x={52} y={38} show={ease((p - 0.5) * 4)} />
    </div>
  );
}

const PILLAR_TABS = ["Strategy", "Commercial", "Operations", "People", "Execution"];
const SUBS = ["Overview", "Themes", "Objectives", "Waterfall", "X-Matrix"];

function NavScene(p: number) {
  return (
    <div className="relative flex h-full flex-col gap-3">
      <Panel>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold" style={{ color: NAVY }}>
            DO<span style={{ color: AMBER }}>.</span>Impact
          </span>
          <div className="flex flex-1 items-center gap-2">
            {PILLAR_TABS.map((t, i) => {
              const op = stagger(p, i, 0.08);
              const active = p > 0.55 && i === 0;
              return (
                <span
                  key={t}
                  className="rounded px-2 py-1 text-[10.5px]"
                  style={{
                    opacity: op,
                    fontWeight: active ? 700 : 500,
                    background: active ? `color-mix(in oklch, ${AMBER} 14%, transparent)` : "transparent",
                    color: active ? AMBER : undefined,
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex gap-3 border-t pt-2" style={{ opacity: ease((p - 0.6) * 3) }}>
          {SUBS.map((s, i) => (
            <span key={s} className={`text-[10px] ${i === 2 ? "font-semibold" : "text-muted-foreground"}`}>{s}</span>
          ))}
        </div>
      </Panel>
      <div className="grid flex-1 grid-cols-3 gap-2">
        {["Strategy & Transformation", "Commercial & Growth", "Operating Management"].map((c, i) => (
          <Panel key={c} className="flex items-center justify-center text-center text-[10.5px] font-semibold"
            >
            <span style={{ opacity: stagger(p, i + 3, 0.1) }}>{c}</span>
          </Panel>
        ))}
      </div>
      <Cursor x={22} y={10} show={ease((p - 0.5) * 4)} />
    </div>
  );
}

const THEMES = ["Operational excellence", "Profitable growth", "People & capability"];
const OBJECTIVES = [
  { t: "Cut turnaround time 20%", o: "M. Halvorsen" },
  { t: "Grow aftermarket revenue $4.2M", o: "R. Deshmukh" },
  { t: "Certify 12 new technicians", o: "L. Bergstrom" },
];

function StrategyScene(p: number) {
  return (
    <div className="relative grid h-full grid-cols-2 gap-3">
      <Panel>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
          <span>Strategic themes</span>
          <Chip text="+ ADD" tone={AMBER} />
        </div>
        <div className="space-y-1.5">
          {THEMES.map((t, i) => (
            <Row key={t} label={t} op={stagger(p, i, 0.12)} right={<Chip text={`${i + 1}`} tone={NAVY} />} />
          ))}
        </div>
      </Panel>
      <Panel>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
          <span>Objectives</span>
          <Chip text="+ ADD" tone={AMBER} />
        </div>
        <div className="space-y-1.5">
          {OBJECTIVES.map((o, i) => (
            <Row
              key={o.t}
              label={o.t}
              op={stagger(p, i + 2, 0.13)}
              right={<span className="shrink-0 text-[9px] text-muted-foreground">{o.o}</span>}
            />
          ))}
        </div>
      </Panel>
      <Cursor x={88} y={12} show={ease((p - 0.55) * 4)} />
    </div>
  );
}

const GATES = ["L1 Identified", "L2 Validated", "L3 In progress", "L4 Realized"];

function DriveScene(p: number) {
  const pct = Math.round(ease(p) * 62);
  return (
    <div className="relative grid h-full grid-cols-5 gap-3">
      <Panel className="col-span-3">
        <div className="text-[11px] font-semibold">Cut turnaround time 20%</div>
        <div className="mt-2 flex gap-1">
          {GATES.map((g, i) => {
            const on = p > 0.15 + i * 0.18;
            return (
              <div key={g} className="flex-1 rounded-md border px-1.5 py-1 text-center text-[8.5px] font-semibold"
                style={{
                  background: on ? `color-mix(in oklch, ${AMBER} 16%, transparent)` : "transparent",
                  color: on ? AMBER : "var(--color-muted-foreground)",
                  borderColor: on ? AMBER : undefined,
                }}>
                {g}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly benefit ($k)</div>
        <div className="mt-1.5 flex h-16 items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 18 + i * 6;
            const on = ease((p - i * 0.055) * 3);
            return <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * on}%`, background: i < 7 ? NAVY : AMBER, opacity: 0.85 }} />;
          })}
        </div>
      </Panel>
      <Panel className="col-span-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Milestones</div>
        <div className="mt-1.5 space-y-1">
          {["Baseline TAT measured", "Bottleneck cell re-laid out", "Kitting rollout"].map((m, i) => (
            <Row key={m} label={m} op={stagger(p, i + 1, 0.14)} right={<Chip text={i < 2 ? "DONE" : "OPEN"} tone={i < 2 ? "#16a34a" : NAVY} />} />
          ))}
        </div>
        <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Realization</div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: AMBER }} />
        </div>
        <div className="mt-1 text-[10px] font-semibold">{pct}% realized · On track</div>
      </Panel>
    </div>
  );
}

const STAGES = ["Qualify", "Solution", "Proposal", "Negotiate", "Won"];

function CommercialScene(p: number) {
  const idx = Math.min(4, Math.floor(p * 5.4));
  return (
    <div className="relative flex h-full flex-col gap-3">
      <Panel>
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span>Account · Meridian Aero Services</span>
          <Chip text="+ OPPORTUNITY" tone={AMBER} />
        </div>
      </Panel>
      <div className="grid flex-1 grid-cols-5 gap-2">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-col rounded-lg border bg-card p-2" style={{ opacity: stagger(p, i, 0.06, 0.3) }}>
            <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">{s}</div>
            {i === idx && (
              <div className="rounded-md border px-2 py-1.5 text-[10px] font-semibold shadow-sm"
                style={{ borderColor: AMBER, background: `color-mix(in oklch, ${AMBER} 10%, transparent)` }}>
                Landing gear MRO
                <div className="text-[9px] font-normal text-muted-foreground">$1.4M · Q3</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanVsPipelineScene(p: number) {
  const bars = [62, 48, 71, 55, 80, 66, 90, 74];
  return (
    <div className="relative flex h-full flex-col gap-2">
      <div className="flex gap-1.5">
        {["Account", "Owner", "Stakeholder", "Stage"].map((f, i) => (
          <span key={f} className="rounded-full border px-2 py-0.5 text-[9px] font-medium"
            style={{ opacity: stagger(p, i, 0.07), borderColor: p > 0.5 && i === 1 ? AMBER : undefined, color: p > 0.5 && i === 1 ? AMBER : undefined }}>
            {f}
          </span>
        ))}
      </div>
      <Panel className="relative flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plan vs pipeline</div>
        <div className="relative mt-2 flex h-[75%] items-end gap-2">
          <div className="absolute inset-x-0 z-10 border-t-2 border-dashed" style={{ bottom: "62%", borderColor: AMBER, opacity: ease((p - 0.4) * 3) }} />
          {bars.map((b, i) => {
            const on = ease((p - i * 0.06) * 3);
            return (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${b * on}%`, background: NAVY, opacity: 0.85 }} />
            );
          })}
        </div>
        <div className="mt-1 text-[9.5px] text-muted-foreground">Dashed line = plan · bars = weighted pipeline</div>
      </Panel>
    </div>
  );
}

const SQDP_ROWS = ["Safety", "Quality", "Delivery", "People"];

function SqdpScene(p: number) {
  return (
    <div className="relative grid h-full grid-cols-5 gap-3">
      <Panel className="col-span-3">
        <div className="mb-2 text-[11px] font-semibold">Daily board — Assembly Line 2</div>
        <div className="space-y-1">
          {SQDP_ROWS.map((r, ri) => (
            <div key={r} className="flex items-center gap-1">
              <span className="w-14 shrink-0 text-[9.5px] font-medium text-muted-foreground">{r}</span>
              {Array.from({ length: 15 }).map((_, ci) => {
                const on = ease((p - (ri * 15 + ci) * 0.008) * 4);
                const red = (ri === 2 && (ci === 5 || ci === 11)) || (ri === 1 && ci === 8);
                return (
                  <div key={ci} className="h-4 flex-1 rounded-sm"
                    style={{ background: red ? "#dc2626" : "#16a34a", opacity: on * 0.9 }} />
                );
              })}
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="col-span-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Red day → 3C</div>
        <div className="mt-1.5 space-y-1">
          {["Concern: kit short at Op 40", "Cause: supplier late 3 days", "Countermeasure: expedite + buffer"].map((m, i) => (
            <Row key={m} label={m} op={stagger(p, i + 2, 0.18)} />
          ))}
        </div>
        <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Red cause pareto</div>
        <div className="mt-1 flex h-10 items-end gap-1">
          {[100, 72, 45, 30, 18].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h * ease((p - 0.5 - i * 0.05) * 4)}%`, background: AMBER }} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SicScene(p: number) {
  const hours = [12, 11, 9, 12, 7, 12, 10, 12];
  return (
    <div className="relative grid h-full grid-cols-5 gap-3">
      <Panel className="col-span-3">
        <div className="text-[11px] font-semibold">Hour-by-hour · plan 12/hr</div>
        <div className="relative mt-2 flex h-[72%] items-end gap-1.5">
          <div className="absolute inset-x-0 border-t-2 border-dashed" style={{ bottom: "80%", borderColor: NAVY, opacity: 0.6 }} />
          {hours.map((h, i) => {
            const on = ease((p - i * 0.09) * 4);
            const miss = h < 12;
            return (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${(h / 15) * 100 * on}%`, background: miss ? "#dc2626" : "#16a34a", opacity: 0.85 }} />
            );
          })}
        </div>
        <div className="mt-1 text-[9.5px] text-muted-foreground">Miss an hour → capture the loss reason on the spot</div>
      </Panel>
      <Panel className="col-span-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Loss codes</div>
        <div className="mt-1.5 space-y-1">
          {[["Tooling wait", "42m"], ["Material short", "28m"], ["Rework", "17m"]].map(([l, v], i) => (
            <Row key={l} label={l} op={stagger(p, i + 2, 0.16)} right={<Chip text={v} tone={AMBER} />} />
          ))}
        </div>
        <div className="mt-3 rounded-md border px-2.5 py-2 text-[10px]"
          style={{ opacity: ease((p - 0.7) * 4), borderColor: "#dc2626", color: "#dc2626" }}>
          Escalated to supervisor · 30 min SLA
        </div>
      </Panel>
    </div>
  );
}

function ScheduleScene(p: number) {
  const zones = [
    { name: "Frozen · 0-2 wks", w: 20, tone: "#0F172A" },
    { name: "Firm · 2-4 wks", w: 22, tone: "#2563eb" },
    { name: "Flexible · 4-12 wks", w: 58, tone: AMBER },
  ];
  return (
    <div className="relative flex h-full flex-col gap-3">
      <Panel>
        <div className="mb-2 text-[11px] font-semibold">0-12 week schedule</div>
        <div className="flex h-7 gap-1 overflow-hidden rounded-md">
          {zones.map((z, i) => (
            <div key={z.name} className="flex items-center justify-center text-[9.5px] font-semibold text-white"
              style={{ width: `${z.w * ease((p - i * 0.12) * 3)}%`, background: z.tone }}>
              {z.name}
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Finite capacity · load vs available</div>
        <div className="mt-2 space-y-1.5">
          {[["CNC cell", 92], ["Assembly", 78], ["NDT", 108], ["Paint", 64]].map(([l, v], i) => {
            const val = v as number;
            const on = ease((p - 0.2 - i * 0.1) * 3);
            return (
              <div key={l as string} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-[9.5px] font-medium">{l}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, val) * on}%`, background: val > 100 ? "#dc2626" : NAVY }} />
                </div>
                <span className="w-8 shrink-0 text-right text-[9.5px] font-semibold" style={{ color: val > 100 ? "#dc2626" : undefined }}>{val}%</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function SiopScene(p: number) {
  return (
    <div className="relative flex h-full flex-col gap-3">
      <div className="flex gap-1.5">
        {["1 Demand", "2 Supply", "3 Reconcile", "4 Exec S&OP"].map((s, i) => {
          const on = p > 0.1 + i * 0.2;
          return (
            <div key={s} className="flex-1 rounded-md border px-2 py-1 text-center text-[9.5px] font-semibold"
              style={{ background: on ? `color-mix(in oklch, ${AMBER} 15%, transparent)` : undefined, color: on ? AMBER : "var(--color-muted-foreground)", borderColor: on ? AMBER : undefined }}>
              {s}
            </div>
          );
        })}
      </div>
      <Panel className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">24-month demand vs capacity</div>
        <div className="relative mt-2 flex h-[72%] items-end gap-[3px]">
          {Array.from({ length: 24 }).map((_, i) => {
            const d = 40 + Math.round(28 * Math.sin(i / 3.2) + i * 1.6);
            const on = ease((p - i * 0.025) * 4);
            return <div key={i} className="flex-1 rounded-t" style={{ height: `${d * on}%`, background: d > 78 ? "#dc2626" : NAVY, opacity: 0.85 }} />;
          })}
          <div className="absolute inset-x-0 border-t-2 border-dashed" style={{ bottom: "78%", borderColor: AMBER }} />
        </div>
        <div className="mt-1 text-[9.5px] text-muted-foreground">Bars above the line = capacity gap to resolve in reconciliation</div>
      </Panel>
    </div>
  );
}

const PEOPLE = ["A. Ferreira", "K. Nowak", "S. Adeyemi", "J. Lindqvist"];
const SKILLS = ["Composite", "NDT L2", "Torque", "Final QA", "Sealant"];

function PeopleScene(p: number) {
  const levels = [
    [4, 3, 4, 2, 1],
    [2, 4, 3, 3, 2],
    [3, 1, 4, 4, 3],
    [1, 2, 2, 3, 4],
  ];
  const color = (l: number) => ["#e2e8f0", "#fde68a", "#fcd34d", "#86efac", "#16a34a"][l];
  return (
    <div className="relative flex h-full items-center justify-center">
      <Panel className="w-full">
        <div className="mb-2 text-[11px] font-semibold">Skill matrix — Assembly</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `90px repeat(${SKILLS.length}, 1fr)` }}>
          <div />
          {SKILLS.map((s) => <div key={s} className="text-center text-[9px] font-medium text-muted-foreground">{s}</div>)}
          {PEOPLE.map((per, r) => (
            <Fragment key={per}>
              <div className="text-[9.5px] font-medium">{per}</div>
              {SKILLS.map((s, c) => {
                const on = ease((p - (r * SKILLS.length + c) * 0.028) * 4);
                return <div key={per + s} className="h-6 rounded-sm" style={{ background: color(levels[r][c]), opacity: on }} />;
              })}
            </Fragment>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground" style={{ opacity: ease((p - 0.7) * 3) }}>
          <span>0 none</span>
          <div className="flex flex-1 gap-0.5">
            {[0, 1, 2, 3, 4].map((l) => <div key={l} className="h-2 flex-1 rounded-sm" style={{ background: color(l) }} />)}
          </div>
          <span>4 can train</span>
        </div>
      </Panel>
    </div>
  );
}

// Mirrors the real layer palette in src/lib/enterprise-network.ts
const EN_LAYERS = [
  { key: "strategy", label: "Strategy", ring: "#2563eb" },
  { key: "capability", label: "Capability", ring: "#7c3aed" },
  { key: "value_stream", label: "Value stream", ring: "#0891b2" },
  { key: "function", label: "Function", ring: "#059669" },
  { key: "decision", label: "Decision", ring: "#d97706" },
  { key: "resource", label: "Resource", ring: "#e11d48" },
  { key: "kpi", label: "KPI", ring: "#475569" },
] as const;

const EN_LAYER_RING: Record<string, string> = Object.fromEntries(
  EN_LAYERS.map((l) => [l.key, l.ring]),
);

const EN_NODES = [
  { id: "obj", label: "OTD 95%", layer: "strategy", x: 50, y: 12 },
  { id: "cap", label: "Planning", layer: "capability", x: 24, y: 34 },
  { id: "vs", label: "Build-to-order", layer: "value_stream", x: 63, y: 36 },
  { id: "fn", label: "Assembly", layer: "function", x: 40, y: 60 },
  { id: "dec", label: "Release rule", layer: "decision", x: 76, y: 62 },
  { id: "res", label: "NDT supplier", layer: "resource", x: 18, y: 82 },
  { id: "kpi", label: "Ship rate", layer: "kpi", x: 60, y: 88 },
] as const;

// type: information (dashed) / material (solid) / financial (dotted)
const EN_LINKS: Array<{ a: string; b: string; type: "information" | "material" | "financial" }> = [
  { a: "obj", b: "cap", type: "information" },
  { a: "obj", b: "vs", type: "information" },
  { a: "cap", b: "fn", type: "information" },
  { a: "vs", b: "fn", type: "material" },
  { a: "vs", b: "dec", type: "financial" },
  { a: "fn", b: "kpi", type: "material" },
  { a: "res", b: "fn", type: "material" },
  { a: "dec", b: "kpi", type: "information" },
];

const EN_LINK_STYLE = {
  information: { color: "#2563eb", dash: "4 3" },
  material: { color: "#059669", dash: undefined as string | undefined },
  financial: { color: "#d97706", dash: "1 3" },
};

const EN_TABS = ["Network map", "Layers", "Dependency matrix", "Ripple simulation", "Insights"];

function enNode(id: string) {
  return EN_NODES.find((n) => n.id === id)!;
}

/** Ripple hop distance from the resource node. */
const EN_RIPPLE_HOPS: Record<string, number> = {
  res: 0, fn: 1, cap: 2, vs: 2, kpi: 2, obj: 3, dec: 3,
};

function NetMapView(q: number) {
  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {EN_LINKS.map((l, i) => {
          const na = enNode(l.a);
          const nb = enNode(l.b);
          const grow = stagger(q, i + 2, 0.05, 0.28);
          const s = EN_LINK_STYLE[l.type];
          return (
            <line
              key={`${l.a}-${l.b}`}
              x1={na.x} y1={na.y}
              x2={na.x + (nb.x - na.x) * grow}
              y2={na.y + (nb.y - na.y) * grow}
              stroke={s.color} strokeWidth={1} strokeDasharray={s.dash}
              vectorEffect="non-scaling-stroke" opacity={0.75}
            />
          );
        })}
      </svg>
      {EN_NODES.map((n, i) => {
        const on = stagger(q, i, 0.05, 0.26);
        const ring = EN_LAYER_RING[n.layer];
        return (
          <div
            key={n.id}
            className="absolute whitespace-nowrap rounded-md border bg-background px-1.5 py-1 text-[9px] font-semibold shadow-sm"
            style={{
              left: `${n.x}%`, top: `${n.y}%`, opacity: on,
              transform: `translate(-50%,-50%) scale(${0.86 + on * 0.14})`,
              borderColor: ring, color: ring,
            }}
          >
            {n.label}
          </div>
        );
      })}
      <div className="absolute bottom-0 left-0 flex flex-wrap gap-2 text-[8px] text-muted-foreground"
        style={{ opacity: ease((q - 0.55) * 3) }}>
        <span style={{ color: "#2563eb" }}>— — information</span>
        <span style={{ color: "#059669" }}>—— material</span>
        <span style={{ color: "#d97706" }}>···· financial</span>
      </div>
    </div>
  );
}

function NetLanesView(q: number) {
  return (
    <div className="flex h-full flex-col justify-center gap-1">
      {EN_LAYERS.map((l, i) => {
        const on = stagger(q, i, 0.07, 0.24);
        const items = EN_NODES.filter((n) => n.layer === l.key);
        return (
          <div
            key={l.key}
            className="flex items-center gap-2 rounded-md border bg-background px-2 py-1"
            style={{ opacity: on, transform: `translateX(${(1 - on) * -10}px)`, borderLeft: `3px solid ${l.ring}` }}
          >
            <span className="w-[74px] shrink-0 text-[9px] font-semibold" style={{ color: l.ring }}>{l.label}</span>
            <div className="flex flex-wrap gap-1">
              {items.map((n) => (
                <span key={n.id} className="rounded border px-1.5 py-0.5 text-[9px]">{n.label}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NetMatrixView(q: number) {
  const ids = EN_NODES.map((n) => n.id);
  const has = (a: string, b: string) => EN_LINKS.some((l) => l.a === a && l.b === b);
  return (
    <div className="flex h-full items-center justify-center">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `62px repeat(${ids.length}, 1fr)` }}>
        <div />
        {EN_NODES.map((n) => (
          <div key={n.id} className="flex h-10 items-end justify-center">
            <span className="text-[8px] font-medium text-muted-foreground"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{n.label}</span>
          </div>
        ))}
        {EN_NODES.map((row, r) => (
          <Fragment key={row.id}>
            <div className="truncate pr-1 text-[9px] font-medium" style={{ color: EN_LAYER_RING[row.layer] }}>
              {row.label}
            </div>
            {ids.map((cid, c) => {
              const on = ease((q - (r * ids.length + c) * 0.012) * 3.5);
              const filled = has(row.id, cid);
              return (
                <div key={cid} className="h-4 rounded-sm border"
                  style={{
                    opacity: on,
                    background: filled ? EN_LAYER_RING[row.layer] : "var(--color-muted)",
                    borderColor: "transparent",
                  }} />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function NetRippleView(q: number) {
  const wave = q * 3.4;
  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {EN_LINKS.map((l) => {
          const na = enNode(l.a);
          const nb = enNode(l.b);
          const hit = Math.max(EN_RIPPLE_HOPS[l.a], EN_RIPPLE_HOPS[l.b]) <= wave;
          return (
            <line key={`${l.a}-${l.b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={hit ? "#dc2626" : "#cbd5e1"} strokeWidth={hit ? 1.2 : 0.6}
              vectorEffect="non-scaling-stroke" />
          );
        })}
      </svg>
      {EN_NODES.map((n) => {
        const hop = EN_RIPPLE_HOPS[n.id];
        const hit = hop <= wave;
        const tone = hop === 0 ? "#dc2626" : hit ? "#f97316" : "#94a3b8";
        return (
          <div key={n.id}
            className="absolute whitespace-nowrap rounded-md border bg-background px-1.5 py-1 text-[9px] font-semibold shadow-sm"
            style={{
              left: `${n.x}%`, top: `${n.y}%`,
              transform: `translate(-50%,-50%) scale(${hit ? 1 : 0.9})`,
              borderColor: tone, color: tone,
            }}>
            {n.label}{hop > 0 && hit ? <span className="ml-1 opacity-70">+{hop}</span> : null}
          </div>
        );
      })}
      <div className="absolute bottom-0 left-0 text-[9px] font-medium" style={{ color: "#dc2626" }}>
        NDT supplier fails → {EN_NODES.filter((n) => EN_RIPPLE_HOPS[n.id] <= wave).length - 1} downstream nodes impacted
      </div>
    </div>
  );
}

const EN_INSIGHTS = [
  { tone: "#dc2626", tag: "CRITICAL", text: "Assembly is the highest-degree node — 4 dependencies converge here." },
  { tone: "#7c3aed", tag: "LOOP", text: "Release rule → Ship rate → Planning forms a feedback loop." },
  { tone: "#d97706", tag: "GAP", text: "No KPI linked to the Planning capability." },
];

function NetInsightsView(q: number) {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {EN_INSIGHTS.map((ins, i) => {
        const on = stagger(q, i, 0.16, 0.26);
        return (
          <div key={ins.tag}
            className="flex items-start gap-2 rounded-md border bg-background px-2.5 py-2 text-[10px]"
            style={{ opacity: on, transform: `translateY(${(1 - on) * 8}px)`, borderColor: ins.tone }}>
            <Chip text={ins.tag} tone={ins.tone} />
            <span>{ins.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function EnterpriseNetworkScene(p: number) {
  const idx = Math.min(EN_TABS.length - 1, Math.floor(p * EN_TABS.length));
  const q = Math.max(0, Math.min(1, p * EN_TABS.length - idx));
  const views = [NetMapView, NetLanesView, NetMatrixView, NetRippleView, NetInsightsView];
  const View = views[idx];
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Network className="h-3.5 w-3.5 shrink-0" style={{ color: AMBER }} />
        {EN_TABS.map((t, i) => (
          <div key={t}
            className="rounded-md border px-2 py-1 text-[9.5px] font-medium"
            style={{
              background: i === idx ? NAVY : "transparent",
              color: i === idx ? "#fff" : "var(--color-muted-foreground)",
              borderColor: i === idx ? NAVY : "var(--color-border)",
            }}>
            {t}
          </div>
        ))}
      </div>
      <Panel className="relative min-h-0 flex-1 overflow-hidden">
        {View(q)}
      </Panel>
    </div>
  );
}

const EXEC_TURNS = [
  { who: "COO", tone: NAVY, text: "Assembly is the constraint — 3 work centres over 95% load in week 4." },
  { who: "CFO", tone: AMBER, text: "Overtime to cover it costs 42k; the margin still clears plan." },
  { who: "Sales", tone: "#16a34a", text: "Two aftermarket orders can slip a week without penalty." },
  { who: "Quality", tone: "#dc2626", text: "Hold the NDT queue — escalating scrap on the sealant line." },
];

function ExecRoomScene(p: number) {
  const question = "Where is next month's biggest risk to plan?";
  const typed = question.slice(0, Math.round(ease(p * 5) * question.length));
  return (
    <div className="relative grid h-full grid-cols-[1fr_1.4fr] gap-3">
      <Panel>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold">
          <Sparkles className="h-3.5 w-3.5" style={{ color: AMBER }} /> Exec Team Room
        </div>
        <div className="rounded-md border bg-background px-2.5 py-2 text-[10.5px]">
          <span className="text-muted-foreground">You: </span>
          {typed}
          <span style={{ opacity: p < 0.25 ? 1 : 0 }}>|</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {EXEC_TURNS.map((t, i) => (
            <div
              key={t.who}
              className="flex items-center gap-2 text-[10px]"
              style={{ opacity: stagger(p, i + 2, 0.12) }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.tone }} />
              <span className="font-medium">{t.who} agent</span>
              <Chip text="ON" tone={t.tone} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="mb-2 text-[11px] font-semibold">Leadership responses</div>
        <div className="space-y-1.5">
          {EXEC_TURNS.map((t, i) => {
            const on = stagger(p, i + 2, 0.14, 0.24);
            return (
              <div
                key={t.who}
                className="rounded-md border bg-background px-2.5 py-1.5 text-[10px]"
                style={{ opacity: on, transform: `translateY(${(1 - on) * 8}px)`, borderColor: t.tone }}
              >
                <span className="font-semibold" style={{ color: t.tone }}>{t.who}: </span>
                {t.text}
              </div>
            );
          })}
        </div>
        <div
          className="mt-2 rounded-md px-2.5 py-2 text-[10px] font-medium"
          style={{ opacity: ease((p - 0.74) * 4), background: `color-mix(in oklch, ${AMBER} 14%, transparent)`, color: NAVY }}
        >
          Synthesis: protect NDT capacity, slip two aftermarket orders, approve limited overtime.
        </div>
      </Panel>
    </div>
  );
}

const MODULES = ["Strategy", "Commercial", "Operations", "People", "Execution", "Toolkit"];

function SettingsScene(p: number) {
  return (
    <div className="relative grid h-full grid-cols-2 gap-3">
      <Panel>
        <div className="mb-2 text-[11px] font-semibold">Show / hide modules</div>
        <div className="space-y-1.5">
          {MODULES.map((m, i) => {
            const on = stagger(p, i, 0.08);
            const off = p > 0.6 && (i === 5 || i === 4);
            return (
              <div key={m} className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-[11px]"
                style={{ opacity: on }}>
                <span className="font-medium">{m}</span>
                <div className="h-3.5 w-7 rounded-full p-0.5" style={{ background: off ? "var(--color-muted)" : AMBER }}>
                  <div className="h-2.5 w-2.5 rounded-full bg-white transition-transform"
                    style={{ transform: `translateX(${off ? 0 : 14}px)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel>
        <div className="mb-2 text-[11px] font-semibold">Saved presets</div>
        <div className="space-y-1.5">
          {["Board view", "Shop floor view", "My setup"].map((s, i) => (
            <Row key={s} label={s} op={stagger(p, i + 3, 0.14)} right={<Chip text={i === 2 ? "SAVED" : "LOAD"} tone={i === 2 ? AMBER : NAVY} />} />
          ))}
        </div>
        <div className="mt-3 rounded-md border border-dashed px-2.5 py-2 text-[10px] text-muted-foreground"
          style={{ opacity: ease((p - 0.65) * 3) }}>
          Save the current on/off selection as a preset and switch between them anytime.
        </div>
      </Panel>
    </div>
  );
}

const SCENES: Scene[] = [
  { key: "company", duration: 6, title: "Pick your company", kicker: "Step 1", tone: AMBER, Icon: Building2,
    breadcrumb: "Landing → Select company",
    caption: "Choose a company to work in — or create one. TitanScale Template is the read-only demo tenant you can explore freely.",
    render: CompanyScene },
  { key: "nav", duration: 6, title: "Find your way around", kicker: "Step 2", tone: NAVY, Icon: Compass,
    breadcrumb: "Top bar → pillar → sub-nav",
    caption: "Five pillars sit in the top bar. Pick one and the sub-navigation underneath shows every module inside it.",
    render: NavScene },
  { key: "strategy", duration: 6, title: "Define your strategy", kicker: "Step 3", tone: NAVY, Icon: Target,
    breadcrumb: "Strategy → Themes → Objectives",
    caption: "Create a handful of strategic themes, then add the objectives that deliver each one.",
    render: StrategyScene },
  { key: "drive", duration: 7, title: "Drive objectives to done", kicker: "Step 4", tone: AMBER, Icon: TrendingUp,
    breadcrumb: "Strategy → Objectives → open a card",
    caption: "Set an owner, move through gates L1 to L4, enter monthly benefit values and track milestones on the same card.",
    render: DriveScene },
  { key: "commercial", duration: 6, title: "Work the opportunity", kicker: "Step 5", tone: NAVY, Icon: DollarSign,
    breadcrumb: "Commercial → Accounts → Sales tunnel",
    caption: "Add the account, add the opportunity, then drag it through the tunnel as it progresses.",
    render: CommercialScene },
  { key: "pipeline", duration: 6, title: "Plan vs pipeline", kicker: "Step 6", tone: AMBER, Icon: LineChart,
    breadcrumb: "Commercial → Plan vs pipeline",
    caption: "See weighted pipeline against plan, and filter by account, owner, stakeholder or stage.",
    render: PlanVsPipelineScene },
  { key: "sqdp", duration: 7, title: "Run the day (SQDP)", kicker: "Step 7", tone: "#16a34a", Icon: CalendarDays,
    breadcrumb: "Operations → Daily",
    caption: "Click a day to mark it green or red. Red days can raise a 3C and roll into the cause pareto.",
    render: SqdpScene },
  { key: "sic", duration: 6, title: "Short Interval Control", kicker: "Step 8", tone: "#dc2626", Icon: Timer,
    breadcrumb: "Operations → Shop floor → SIC",
    caption: "Track plan vs actual hour by hour, capture the loss reason and escalate before the shift is lost.",
    render: SicScene },
  { key: "schedule", duration: 6, title: "Schedule 0-12 weeks", kicker: "Step 9", tone: NAVY, Icon: Factory,
    breadcrumb: "Operations → Scheduling",
    caption: "Frozen, firm and flexible zones with a finite capacity check on every work centre.",
    render: ScheduleScene },
  { key: "siop", duration: 6, title: "Balance 24 months (SIOP)", kicker: "Step 10", tone: AMBER, Icon: Package,
    breadcrumb: "Operations → SIOP",
    caption: "Step through demand, supply, reconciliation and exec S&OP to close capacity gaps early.",
    render: SiopScene },
  { key: "people", duration: 6, title: "Build capability", kicker: "Step 11", tone: "#2563eb", Icon: Users,
    breadcrumb: "People → Skills matrix",
    caption: "Score each person against each skill to expose single points of failure and training needs.",
    render: PeopleScene },
  { key: "network", duration: 10, title: "Map the enterprise network", kicker: "Step 12", tone: AMBER, Icon: Network,
    breadcrumb: "Reports & Meetings → Enterprise Network",
    caption: "Map objectives, capabilities, value streams, functions, decisions, resources and KPIs — then see layers, dependency matrix, ripple impact and insights.",
    render: EnterpriseNetworkScene },
  { key: "execroom", duration: 6, title: "AI Exec Team Room", kicker: "Step 13", tone: "#2563eb", Icon: Sparkles,
    breadcrumb: "Intelligence → Exec Team Room",
    caption: "Ask a question and get an answer from each leadership persona, grounded in your own company data.",
    render: ExecRoomScene },
  { key: "settings", duration: 6, title: "Make it yours", kicker: "Step 14", tone: NAVY, Icon: SlidersHorizontal,
    breadcrumb: "Settings → Modules",
    caption: "Turn pillars and sub-modules on or off, then save the selection as a reusable preset.",
    render: SettingsScene },
];

const TOTAL = SCENES.reduce((a, s) => a + s.duration, 0);

export function GettingStartedTour({
  autoPlay = false,
}: { autoPlay?: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);

  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (t: number) => {
      if (last.current == null) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;
      setElapsed((e) => {
        const n = e + dt;
        if (n >= TOTAL) { setPlaying(false); return TOTAL; }
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [playing]);

  const starts = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const s of SCENES) { out.push(acc); acc += s.duration; }
    return out;
  }, []);

  const { sceneIdx, sceneProgress, scene } = useMemo(() => {
    for (let i = SCENES.length - 1; i >= 0; i--) {
      if (elapsed >= starts[i] || i === 0) {
        return {
          sceneIdx: i,
          sceneProgress: Math.min(1, (elapsed - starts[i]) / SCENES[i].duration),
          scene: SCENES[i],
        };
      }
    }
    return { sceneIdx: 0, sceneProgress: 0, scene: SCENES[0] };
  }, [elapsed, starts]);

  const jump = (i: number) => {
    setElapsed(starts[i]);
    last.current = null;
    setPlaying(true);
  };

  const Icon = scene.Icon;
  // Before playback starts, draw the first frame fully instead of a blank fade-in state
  const renderProgress = !playing && elapsed === 0 ? 1 : sceneProgress;

  return (
    <div className="space-y-4">

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="rounded-lg p-1.5" style={{ background: `color-mix(in oklch, ${scene.tone} 15%, transparent)` }}>
              <Icon className="h-4 w-4" style={{ color: scene.tone }} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: scene.tone }}>
                {scene.kicker} · {scene.breadcrumb}
              </div>
              <div className="truncate text-base font-bold tracking-tight">{scene.title}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => { setElapsed(0); last.current = null; setPlaying(true); }}
              className="rounded p-1.5 hover:bg-muted" title="Restart" aria-label="Restart">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => { last.current = null; setPlaying((v) => !v); }}
              className="rounded p-1.5 hover:bg-muted" title={playing ? "Pause" : "Play"} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Stage */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-muted/40 to-background p-4">
          <div key={scene.key} className="animate-fade-in h-[calc(100%-2.25rem)]">
            {scene.render(renderProgress)}
          </div>
          <div key={scene.key + "-cap"} className="animate-fade-in absolute inset-x-4 bottom-3 rounded-md border bg-card/95 px-3 py-1.5 text-[11px] leading-tight shadow-sm backdrop-blur">
            {scene.caption}
          </div>
          {!playing && elapsed === 0 && (
            <button
              onClick={() => { last.current = null; setPlaying(true); }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/45 backdrop-blur-[2px]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: AMBER }}>
                <Play className="h-6 w-6 text-white" />
              </span>
              <span className="text-sm font-semibold">Play the getting started walkthrough</span>
              <span className="text-xs text-muted-foreground">{TOTAL}s · {SCENES.length} chapters</span>
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="border-t px-4 py-3">
          <div className="mb-2 flex h-1.5 gap-1">
            {SCENES.map((s, i) => {
              const p = Math.max(0, Math.min(1, (elapsed - starts[i]) / s.duration));
              return (
                <button key={s.key} onClick={() => jump(i)} aria-label={`Chapter ${i + 1}: ${s.title}`}
                  className="h-1.5 overflow-hidden rounded-full bg-muted" style={{ flex: s.duration }}>
                  <div className="h-full rounded-full" style={{ width: `${p * 100}%`, background: s.tone }} />
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Chapter {sceneIdx + 1} of {SCENES.length} · {Math.ceil(TOTAL - elapsed)}s remaining
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SCENES.map((s, i) => {
          const active = i === sceneIdx;
          const SIcon = s.Icon;
          return (
            <button key={s.key} onClick={() => jump(i)}
              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/60 ${active ? "bg-muted/60" : "bg-card"}`}
              style={{ borderColor: active ? s.tone : undefined }}>
              <div className="rounded-md p-1.5" style={{ background: `color-mix(in oklch, ${s.tone} 14%, transparent)` }}>
                <SIcon className="h-3.5 w-3.5" style={{ color: s.tone }} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold leading-tight">{i + 1}. {s.title}</div>
                <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{s.breadcrumb}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GettingStartedTour;
