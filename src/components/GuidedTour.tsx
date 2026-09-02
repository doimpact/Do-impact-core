import { useEffect, useMemo, useRef, useState } from "react";
import {
  Compass, TrendingUp, Cog, Users, FileText, X, Play, Pause, RotateCcw,
  Target, GitBranch, LineChart, Activity, ShieldCheck, BadgeCheck,
  Layers, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Zap, Circle, Download,
  DollarSign, Package, Factory, Wallet, AlertTriangle, Plane, Building2,
} from "lucide-react";
import { PROBLEMS, MODULE_BY_ID, COLUMNS } from "@/lib/problem-matrix";


type Hurdle = { n: number; label: string; answer: string };

type Scene = {
  key: string;
  duration: number; // seconds
  title: string;
  kicker: string;
  tone: string;
  Icon: typeof Compass;
  hurdle?: Hurdle;
  render: (p: number) => React.ReactNode; // p = 0..1 progress within scene
};

const TOTAL = 50; // seconds

// Aerospace/aviation turnaround hurdles this suite addresses.
const HURDLES: Hurdle[] = [
  { n: 1, label: "Regulatory & Quality (Speed vs Compliance)",
    answer: "Automate paperwork — free QA capacity, don't cut it." },
  { n: 2, label: "Supply chain lead times & OEM lock-in",
    answer: "High-turn material availability — long-lead, USM, PMA, rotables." },
  { n: 3, label: "Capital intensity & stretched working capital",
    answer: "WIP velocity releases trapped cash — not stretched AP." },
  { n: 4, label: "Specialized labor shortages",
    answer: "Maximize certified wrench-time — schedule to certifications." },
  { n: 5, label: "Fragmented legacy systems & unpredictable TAT",
    answer: "One real-time picture — TAT becomes predictable, not volatile." },
];

function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ---------- Hurdles hook scene ----------

function HurdlesScene(p: number) {
  const primary = "var(--color-primary)";
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-2 flex flex-col justify-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground"
          style={{ opacity: ease(Math.min(1, p * 3)) }}>
          The A&D turnaround problem
        </div>
        <div className="mt-2 text-2xl font-bold leading-tight"
          style={{ opacity: ease(Math.min(1, p * 2)), transform: `translateY(${(1 - ease(Math.min(1, p * 2))) * 10}px)` }}>
          Standard PE playbooks<br />break aerospace.
        </div>
        <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground"
          style={{ opacity: ease(Math.max(0, (p - 0.35) * 2)) }}>
          <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: primary }} />
          <span>Regulation, long lead-times, trapped WIP, licensed labor, and volatile TAT reward throughput velocity — not raw cost cuts.</span>
        </div>
      </div>
      <div className="col-span-3 flex flex-col justify-center gap-1.5">
        {HURDLES.map((h, i) => {
          const op = ease(Math.max(0, Math.min(1, (p - 0.15 - i * 0.12) / 0.2)));
          return (
            <div key={h.n}
              className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2"
              style={{ opacity: op, transform: `translateX(${(1 - op) * 14}px)` }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                style={{ background: primary }}>
                {h.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold">{h.label}</div>
                <div className="truncate text-[10px] text-muted-foreground">{h.answer}</div>
              </div>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
}



// ---------- Scene visuals ----------

function StrategyScene(p: number) {
  const tone = "var(--color-pillar-strategy)";
  const reveal = (delay: number) => ({
    opacity: ease(Math.max(0, Math.min(1, (p - delay) / 0.2))),
    transform: `translateY(${(1 - ease(Math.max(0, Math.min(1, (p - delay) / 0.2)))) * 12}px)`,
  });
  const cells = ["Waterfall", "Consolidation", "A3", "Turnaround"];
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-2 flex flex-col justify-center gap-3" style={reveal(0)}>
        <div className="rounded-lg border-2 p-3" style={{ borderColor: tone, background: `color-mix(in oklch, ${tone} 10%, transparent)` }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tone }}>Vision & Mission</div>
          <div className="mt-1 text-sm font-bold">Become #1 in region by 2027</div>
        </div>
        <div className="rounded-lg border bg-card p-3" style={reveal(0.2)}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Value Driver Tree</div>
          <div className="mt-2 flex items-center justify-center">
            <svg viewBox="0 0 200 90" className="w-full">
              <circle cx="100" cy="15" r="8" fill={tone} />
              {[30, 100, 170].map((x, i) => (
                <g key={i} style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.3 - i * 0.08) / 0.2))) }}>
                  <line x1="100" y1="20" x2={x} y2="55" stroke={tone} strokeWidth="1.5" />
                  <rect x={x - 18} y="55" width="36" height="20" rx="4" fill="white" stroke={tone} strokeWidth="1.5" />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
      <div className="col-span-3 rounded-lg border bg-card p-4" style={reveal(0.35)}>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">Hoshin Kanri X-Matrix</div>
        </div>
        <div className="mt-3 grid grid-cols-3 grid-rows-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => {
            const isCenter = i === 4;
            const isCorner = [0, 2, 6, 8].includes(i);
            const filled = i < Math.floor(p * 10);
            return (
              <div
                key={i}
                className="aspect-square rounded transition-all"
                style={{
                  background: isCenter ? tone : isCorner ? `color-mix(in oklch, ${tone} 20%, transparent)` : filled ? `color-mix(in oklch, ${tone} 55%, transparent)` : "var(--muted)",
                  transform: filled ? "scale(1)" : "scale(0.85)",
                }}
              />
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {cells.map((c, i) => (
            <div
              key={c}
              className="rounded border bg-background px-2 py-1.5 text-center text-[10px] font-medium"
              style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.55 - i * 0.05) / 0.15))), borderColor: tone }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommercialScene(p: number) {
  const tone = "var(--color-pillar-commercial)";
  const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Won"];
  const values = [120, 95, 70, 45, 28];
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">Sales Pipeline</div>
        </div>
        <div className="mt-3 space-y-1.5">
          {stages.map((s, i) => {
            const w = ease(Math.max(0, Math.min(1, (p - i * 0.08) / 0.3))) * (values[i] / 120) * 100;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="w-20 text-[11px] font-medium">{s}</div>
                <div className="flex-1 rounded bg-muted">
                  <div
                    className="flex h-6 items-center justify-end rounded px-2 text-[10px] font-bold text-white"
                    style={{ width: `${w}%`, background: `linear-gradient(90deg, ${tone}, color-mix(in oklch, ${tone} 60%, white))`, transition: "width 100ms linear" }}
                  >
                    {w > 20 ? `$${Math.round(values[i] * (w / 100))}k` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <div className="rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.3) / 0.2))) }}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Plan vs Pipeline</div>
          <div className="mt-1 flex items-end gap-1 h-16">
            {[40, 60, 55, 75, 68, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                <div className="rounded-t" style={{ height: `${h * ease(Math.max(0, Math.min(1, (p - 0.35 - i * 0.04) / 0.2)))}%`, background: tone }} />
                <div className="rounded-t opacity-40" style={{ height: `${(h - 15) * ease(Math.max(0, Math.min(1, (p - 0.4 - i * 0.04) / 0.2)))}%`, background: tone }} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.5) / 0.2))) }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coverage</div>
              <div className="text-xl font-bold" style={{ color: tone }}>
                {(2.4 * ease(Math.max(0, Math.min(1, (p - 0.55) / 0.3)))).toFixed(1)}x
              </div>
            </div>
            <Sparkles className="h-6 w-6" style={{ color: tone }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function OmsScene(p: number) {
  const tone = "var(--color-pillar-oms)";
  const days = 30;
  const letters = ["S", "Q", "D", "P"];
  const seed = (i: number, j: number) => (i * 31 + j * 7) % 10;
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">Daily Management — SQDP</div>
        </div>
        <div className="mt-2 grid grid-cols-[auto_1fr] gap-1">
          <div className="grid grid-rows-4 gap-1 pr-1">
            {letters.map((l) => (
              <div key={l} className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">{l}</div>
            ))}
          </div>
          <div className="grid grid-rows-4 gap-1">
            {letters.map((_, row) => (
              <div key={row} className="grid grid-cols-[repeat(30,1fr)] gap-[2px]">
                {Array.from({ length: days }).map((_, col) => {
                  const revealed = col / days < p * 1.3;
                  const s = seed(row, col);
                  const status = s > 8 ? "red" : s > 6 ? "yellow" : "green";
                  const color = status === "red" ? "#ef4444" : status === "yellow" ? "#eab308" : "#22c55e";
                  return (
                    <div
                      key={col}
                      className="h-5 rounded-sm flex items-center justify-center text-[7px] font-bold text-white"
                      style={{
                        background: revealed ? color : "var(--muted)",
                        opacity: revealed ? 1 : 0.4,
                        transition: "background 120ms",
                      }}
                    >
                      {revealed && status === "red" ? "3C" : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <div className="rounded-lg border bg-card p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Friction — leading indicators</div>
          {[
            { label: "Kit completeness", val: 82 },
            { label: "Tool readiness", val: 91 },
            { label: "RFI aging (≤3d)", val: 74 },
          ].map((k, i) => {
            const v = k.val * ease(Math.max(0, Math.min(1, (p - 0.1 - i * 0.1) / 0.3)));
            return (
              <div key={k.label} className="mt-1.5" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.08 - i * 0.1) / 0.2))) }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-[10.5px] font-medium">{k.label}</div>
                  <div className="text-[11px] font-bold" style={{ color: tone }}>{Math.round(v)}%</div>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: tone }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-lg border bg-card p-2.5" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.42) / 0.2))) }}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Closed-loop escalation</div>
          <div className="mt-1.5 flex items-center gap-1 text-[9.5px] font-medium">
            {["Red", "3C", "Own", "A3/DMAIC", "Verify"].map((s, i) => (
              <span key={s} className="flex items-center gap-1"
                style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.45 - i * 0.05) / 0.15))) }}>
                <span className="rounded px-1.5 py-0.5" style={{ background: `color-mix(in oklch, ${tone} 15%, transparent)`, color: tone }}>{s}</span>
                {i < 4 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-2.5" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.6) / 0.2))) }}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Also inside Operations</div>
          <div className="flex flex-wrap gap-1">
            {[
              { l: "SIC boards", I: Activity },
              { l: "Gemba walks", I: BadgeCheck },
              { l: "SIOP · 24-mo", I: Package },
              { l: "NPI · 5 gates", I: Factory },
              { l: "Shop Floor · VSM", I: Layers },
            ].map((c, i) => (
              <span key={c.l} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                style={{ borderColor: tone, color: tone, opacity: ease(Math.max(0, Math.min(1, (p - 0.62 - i * 0.05) / 0.2))) }}>
                <c.I className="h-3 w-3" /> {c.l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function PeopleScene(p: number) {
  const tone = "var(--color-pillar-people)";
  const skills = ["Lean", "SPC", "PLM", "SAP", "PM", "Quality"];
  const rows = ["A. Silva", "M. Chen", "J. Kim", "R. Duarte"];
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">Skill Matrix</div>
        </div>
        <div className="mt-2 overflow-hidden">
          <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-1 text-[10px]">
            <div />
            {skills.map((s) => <div key={s} className="text-center font-medium text-muted-foreground">{s}</div>)}
            {rows.map((r, i) => (
              <div key={r} className="contents">
                <div className="pr-1 font-medium">{r}</div>
                {skills.map((s, j) => {
                  const idx = i * skills.length + j;
                  const revealed = idx / (rows.length * skills.length) < p * 1.3;
                  const level = ((i * 3 + j * 5) % 5);
                  return (
                    <div key={s + i} className="flex items-center justify-center">
                      <svg viewBox="0 0 20 20" className="h-4 w-4">
                        <circle cx="10" cy="10" r="8" fill="none" stroke="var(--muted)" strokeWidth="3" />
                        <circle
                          cx="10" cy="10" r="8" fill="none"
                          stroke={tone} strokeWidth="3"
                          strokeDasharray={`${revealed ? (level / 4) * 50.27 : 0} 100`}
                          transform="rotate(-90 10 10)"
                          style={{ transition: "stroke-dasharray 200ms" }}
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-span-2 rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.3) / 0.2))) }}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">Org Chart</div>
        </div>
        <svg viewBox="0 0 180 120" className="mt-2 w-full">
          <rect x="70" y="5" width="40" height="18" rx="3" fill={tone} />
          <text x="90" y="17" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">CEO</text>
          {[20, 90, 160].map((x, i) => {
            const op = ease(Math.max(0, Math.min(1, (p - 0.3 - i * 0.08) / 0.2)));
            return (
              <g key={i} style={{ opacity: op }}>
                <line x1="90" y1="23" x2={x} y2="45" stroke={tone} strokeWidth="1" />
                <rect x={x - 18} y="45" width="36" height="16" rx="3" fill="white" stroke={tone} strokeWidth="1.5" />
                <text x={x} y="56" textAnchor="middle" fontSize="7" fill={tone}>Dir</text>
                {[x - 12, x + 12].map((cx, j) => (
                  <g key={j} style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.5 - j * 0.05) / 0.2))) }}>
                    <line x1={x} y1="61" x2={cx} y2="80" stroke={tone} strokeWidth="1" />
                    <circle cx={cx} cy="88" r="6" fill={`color-mix(in oklch, ${tone} 30%, white)`} stroke={tone} />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Skills → Matrix → Gaps", "Certifications", "Change Curve · J-Curve · 7×7"].map((c, i) => (
            <span key={c} className="rounded-full border px-2 py-0.5 text-[9.5px] font-medium"
              style={{ borderColor: tone, color: tone, opacity: ease(Math.max(0, Math.min(1, (p - 0.55 - i * 0.07) / 0.2))) }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportScene(p: number) {
  const tone = "var(--color-primary)";
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 rounded-lg border-2 bg-card p-4 shadow-lg" style={{ borderColor: tone, transform: `scale(${0.9 + ease(Math.min(1, p * 2)) * 0.1})` }}>
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Board Report</div>
            <div className="text-sm font-bold">DO.Impact — Q4 Review</div>
          </div>
          <FileText className="h-5 w-5" style={{ color: tone }} />
        </div>
        <div className="mt-3 space-y-1.5">
          {["Strategy — VDT · Hoshin · Waterfall · Consolidation", "Commercial — Pipeline vs Plan", "Operations — SQDP · SIC · SIOP · NPI · Compliance", "People — Skills · Gaps · Engagement", "Turnaround Finance — 4 gates + NPV/IRR"].map((s, i) => {
            const op = ease(Math.max(0, Math.min(1, (p - 0.15 - i * 0.1) / 0.15)));
            return (
              <div key={s} className="flex items-center gap-2 rounded border bg-background px-2 py-1.5" style={{ opacity: op, transform: `translateX(${(1 - op) * 12}px)` }}>
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--color-pillar-commercial)" }} />
                <div className="text-[11px] font-medium">{s}</div>
                <div className="ml-auto text-[9px] font-bold" style={{ color: tone }}>PDF · PPTX</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <div className="flex-1 rounded-lg border bg-gradient-to-br from-primary/10 to-transparent p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.5) / 0.2))) }}>
          <Sparkles className="h-5 w-5" style={{ color: tone }} />
          <div className="mt-2 text-sm font-bold leading-tight">Editable blocks.<br />Board-ready.</div>
          <div className="mt-1 text-[10px] text-muted-foreground">Every pillar, every starred KPI — exported as PDF or fully editable PowerPoint.</div>
        </div>
        <div className="rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.65) / 0.2))) }}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Weekly SLT Mode · Execution Timeline</div>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-primary/60" />
            <div className="h-1.5 flex-1 rounded-full bg-primary/30" />
            <div className="h-1.5 flex-1 rounded-full bg-muted" />
          </div>
          <div className="mt-1 text-[10px] font-medium">9-step agenda · one zoomable Gantt for every action</div>
        </div>

      </div>
    </div>
  );
}

function CashCapexScene(p: number) {
  const tone = "var(--color-pillar-strategy)";
  // 13-week rolling cash bars: green = inflow, red = outflow, line = balance
  const weeks = 13;
  const flows = [8, -6, 12, -9, 15, -7, 10, -11, 14, -5, 9, -8, 13];
  const balance: number[] = [];
  flows.reduce((a, v) => { const n = a + v; balance.push(n); return n; }, 20);
  const maxAbs = Math.max(...flows.map(Math.abs));
  const maxBal = Math.max(...balance);
  const gates = ["G1 Concept", "G2 Design", "G3 Build", "G4 Commission"];
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">13-Week Cash Flow</div>
          <span className="ml-auto text-[10px] text-muted-foreground">$k · rolling</span>
        </div>
        <div className="mt-2 relative h-28 flex items-end gap-1">
          {flows.map((v, i) => {
            const reveal = ease(Math.max(0, Math.min(1, (p - i * 0.04) / 0.2)));
            const h = (Math.abs(v) / maxAbs) * 55 * reveal;
            const positive = v >= 0;
            return (
              <div key={i} className="flex-1 flex flex-col justify-center items-center h-full">
                <div className="flex-1 w-full flex items-end justify-center">
                  {positive && <div className="w-full rounded-t" style={{ height: `${h}%`, background: "#22c55e" }} />}
                </div>
                <div className="h-px w-full bg-border" />
                <div className="flex-1 w-full flex items-start justify-center">
                  {!positive && <div className="w-full rounded-b" style={{ height: `${h}%`, background: "#ef4444" }} />}
                </div>
              </div>
            );
          })}
          {/* balance line */}
          <svg className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${weeks} 100`} preserveAspectRatio="none">
            <polyline
              fill="none" stroke={tone} strokeWidth="1.2"
              points={balance.map((b, i) => `${i + 0.5},${50 - (b / maxBal) * 40 * ease(Math.max(0, Math.min(1, (p - i * 0.04) / 0.2)))}`).join(" ")}
            />
          </svg>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Inflow</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500" /> Outflow</span>
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3" style={{ background: tone }} /> Balance</span>
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-2">
        <div className="rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.15) / 0.2))) }}>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" style={{ color: tone }} />
            <div className="text-xs font-semibold">Turnaround Finance — 4-Gate</div>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {gates.map((g, i) => {
              const filled = ease(Math.max(0, Math.min(1, (p - 0.2 - i * 0.08) / 0.2)));
              return (
                <div key={g} className="flex-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${filled * 100}%`, background: tone }} />
                  </div>
                  <div className="mt-1 text-[9px] font-medium text-muted-foreground truncate">{g}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.4) / 0.2))) }}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Turnaround finance</div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[10px]">
            {["Working Capital", "Part Margins", "COPQ", "Value Realized"].map((s, i) => (
              <div key={s} className="rounded border px-2 py-1.5 font-medium"
                style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.45 - i * 0.05) / 0.15))), borderColor: tone }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Problem-first scene ----------

function ProblemFirstScene(p: number) {
  // Cycle through the three sample problems across the scene.
  const slot = Math.min(2, Math.floor(p * 3));
  const local = Math.min(1, (p * 3) % 1 || (p >= 1 ? 1 : 0));
  const problem = PROBLEMS[slot];
  const chips = problem.flow.slice(0, 9);
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-2 flex flex-col justify-center gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          How the tool is used
        </div>
        <div className="text-2xl font-bold leading-tight">
          Start with the problem,<br />not the tool.
        </div>
        <div className="text-[11px] leading-snug text-muted-foreground">
          You never switch on the whole suite. Pick the business challenge, and DO.Impact lights up
          only the modules that answer it — run as one connected flow.
        </div>
        <div className="mt-1 space-y-1.5">
          {PROBLEMS.map((pr, i) => {
            const on = i === slot;
            return (
              <div key={pr.id}
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-all"
                style={{
                  borderColor: on ? "var(--color-primary)" : "var(--border)",
                  background: on ? "color-mix(in oklch, var(--color-primary) 8%, transparent)" : "transparent",
                  opacity: on ? 1 : 0.45,
                }}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{ background: on ? "var(--color-primary)" : "var(--muted-foreground)" }}>
                  {pr.index}
                </span>
                <span className="truncate text-[11px] font-semibold">{pr.title}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-span-3 flex flex-col justify-center rounded-lg border bg-card p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Modules switched on for problem {problem.index}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {chips.map((f, i) => {
            const m = MODULE_BY_ID[f.id];
            if (!m) return null;
            const col = COLUMNS.find((c) => c.key === m.column)!;
            const op = ease(Math.max(0, Math.min(1, (local - i * 0.07) / 0.18)));
            return (
              <div key={`${problem.id}-${f.id}`}
                className="rounded-md border px-2 py-1.5"
                style={{
                  opacity: op,
                  transform: `translateY(${(1 - op) * 8}px)`,
                  borderColor: col.tone,
                  background: `color-mix(in oklch, ${col.tone} 8%, transparent)`,
                }}>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[8px] font-bold text-white"
                    style={{ background: col.tone }}>
                    {col.badge}
                  </span>
                  <span className="truncate text-[10.5px] font-semibold">{m.label}</span>
                  <span className="ml-auto text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span className="truncate">{chips[0] ? chips[0].why : ""}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Problem Solver toolkit ----------

const TOOLKIT = [
  { l: "Theory of Constraints", d: "Find and exploit the bottleneck" },
  { l: "Systems Thinking · Causal Loops", d: "5-phase workspace with golden-rule gating" },
  { l: "Integrated Business Planning", d: "Align demand, supply and finance" },
  { l: "Hoshin Kanri", d: "Cascade the vital few" },
  { l: "Employee Journey Mapping", d: "Fix the moments that matter" },
  { l: "Aviation MRO", d: "5 drivers of Muda · maturity scoring" },
];

function ToolkitScene(p: number) {
  const tone = "var(--color-primary)";
  const phases = ["Pattern", "System Map", "Leverage Point", "Trade-offs", "Deploy"];
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-2 flex flex-col justify-center gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Execution · Problem Solver
        </div>
        <div className="text-2xl font-bold leading-tight">Pick the right<br />thinking tool.</div>
        <div className="text-[11px] leading-snug text-muted-foreground">
          Define the problem, select the sub-processes, and get a live process flow with owners and progress —
          backed by a toolkit that tells you which method fits which symptom. A3 sits alongside it.
        </div>
        <div className="mt-1 rounded-lg border bg-card p-2.5" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.4) / 0.2))) }}>
          <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">Causal loop workspace</div>
          <div className="mt-1.5 flex items-center gap-1">
            {phases.map((ph, i) => {
              const on = ease(Math.max(0, Math.min(1, (p - 0.45 - i * 0.06) / 0.15)));
              return (
                <div key={ph} className="flex-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${on * 100}%`, background: tone }} />
                  </div>
                  <div className="mt-1 truncate text-[8.5px] font-medium text-muted-foreground">{ph}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="col-span-3 flex flex-col justify-center gap-1.5">
        {TOOLKIT.map((t, i) => {
          const op = ease(Math.max(0, Math.min(1, (p - i * 0.1) / 0.2)));
          return (
            <div key={t.l} className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-1.5"
              style={{ opacity: op, transform: `translateX(${(1 - op) * 14}px)` }}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                style={{ background: tone }}>{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11.5px] font-semibold">{t.l}</div>
                <div className="truncate text-[9.5px] text-muted-foreground">{t.d}</div>
              </div>
              <Circle className="h-3 w-3 shrink-0" style={{ color: tone }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Compliance & assurance ----------

function ComplianceScene(p: number) {
  const tone = "var(--color-pillar-oms)";
  const part145 = ["Organisation", "Facilities", "Personnel", "Procedures", "Records", "Safety"];
  const sms = ["Policy & Objectives", "Risk Management", "Safety Assurance", "Safety Promotion"];
  return (
    <div className="grid h-full grid-cols-5 gap-3">
      <div className="col-span-3 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" style={{ color: tone }} />
          <div className="text-sm font-semibold">Part 145 — audit-ready checklist</div>
          <span className="ml-auto text-[10px] text-muted-foreground">6 pillars · snapshots</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {part145.map((c, i) => {
            const op = ease(Math.max(0, Math.min(1, (p - i * 0.07) / 0.18)));
            const done = p > 0.15 + i * 0.08;
            return (
              <div key={c} className="rounded-md border px-2 py-2"
                style={{ opacity: op, borderColor: tone, background: done ? `color-mix(in oklch, ${tone} 10%, transparent)` : "transparent" }}>
                <div className="flex items-center gap-1.5">
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: tone }} /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="truncate text-[10.5px] font-semibold">{c}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground"
          style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.6) / 0.2))) }}>
          <AlertCircle className="h-3 w-3" />
          Snapshot each audit for traceability, then reset for the next one.
        </div>
      </div>
      <div className="col-span-2 rounded-lg border bg-card p-3" style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.25) / 0.2))) }}>
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4" style={{ color: tone }} />
          <div className="text-xs font-semibold">SMS — ICAO Annex 19</div>
        </div>
        <div className="mt-2 space-y-1">
          {sms.map((s, i) => (
            <div key={s} className="rounded border px-2 py-1.5 text-[10.5px] font-medium"
              style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.3 - i * 0.07) / 0.18))), borderColor: tone }}>
              {s}
            </div>
          ))}
        </div>
        <div className="mt-2 text-[9.5px] text-muted-foreground"
          style={{ opacity: ease(Math.max(0, Math.min(1, (p - 0.7) / 0.2))) }}>
          Review each topic and save the result as an internal audit with full history.
        </div>
      </div>
    </div>
  );
}

// ---------- Governance / multi-company ----------

function GovernanceScene(p: number) {
  const tone = "var(--color-primary)";
  const levels = ["No access", "Read", "Write", "Admin"];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
        style={{ opacity: ease(Math.min(1, p * 3)) }}>
        One suite · many companies
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight"
        style={{ opacity: ease(Math.min(1, p * 2)), transform: `translateY(${(1 - ease(Math.min(1, p * 2))) * 10}px)` }}>
        Scoped, governed, yours
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {levels.map((l, i) => (
          <span key={l} className="rounded-full border px-3 py-1 text-[11px] font-semibold"
            style={{ borderColor: tone, color: tone, opacity: ease(Math.max(0, Math.min(1, (p - 0.2 - i * 0.09) / 0.2))) }}>
            {l}
          </span>
        ))}
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground"
        style={{ opacity: ease(Math.max(0, (p - 0.55) * 2.2)) }}>
        Every record scoped by company · module-level permissions · email invites · monthly AI credit caps
      </div>
    </div>
  );
}

const SCENES: Scene[] = [

  { key: "intro", duration: 3, title: "DO.Impact", kicker: "Connection Creates Impact",
    tone: "var(--color-primary)", Icon: Sparkles,
    render: (p) => (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground" style={{ opacity: ease(Math.min(1, p * 3)) }}>
          Built for aerospace & aviation turnarounds
        </div>
        <div className="mt-3 text-4xl font-bold tracking-tight" style={{ opacity: ease(Math.min(1, p * 2)), transform: `translateY(${(1 - ease(Math.min(1, p * 2))) * 12}px)` }}>
          Steer the entire enterprise
        </div>
        <div className="mt-2 text-[12px] text-muted-foreground" style={{ opacity: ease(Math.max(0, (p - 0.2) * 2)) }}>
          A&D turnaround ≠ standard PE cut-to-growth.
        </div>
        <div className="mt-5 flex gap-3" style={{ opacity: ease(Math.max(0, (p - 0.3) * 2)) }}>
          {[Compass, TrendingUp, Cog, Users].map((I, i) => (
            <div key={i} className="rounded-lg border bg-card p-3" style={{ transform: `translateY(${(1 - ease(Math.max(0, Math.min(1, (p - 0.3 - i * 0.08) * 3)))) * 20}px)` }}>
              <I className="h-6 w-6" style={{ color: `var(--color-pillar-${["strategy","commercial","oms","people"][i]})` }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  { key: "problem-first", duration: 6, title: "Start with the problem, not the tool", kicker: "How DO.Impact works",
    tone: "var(--color-primary)", Icon: Target, render: ProblemFirstScene },
  { key: "hurdles", duration: 3, title: "5 Aerospace Turnaround Hurdles", kicker: "The problem DO.Impact is built for",
    tone: "var(--color-primary)", Icon: AlertTriangle, render: HurdlesScene },
  { key: "strategy", duration: 4, title: "Strategy & Transformation", kicker: "01 · The steering wheel",
    tone: "var(--color-pillar-strategy)", Icon: Compass,
    hurdle: HURDLES[0], render: StrategyScene },
  { key: "commercial", duration: 4, title: "Commercial & Growth", kicker: "02 · Top-line engine",
    tone: "var(--color-pillar-commercial)", Icon: TrendingUp, render: CommercialScene },

  { key: "oms", duration: 6, title: "Operating Management", kicker: "03 · Daily friction · SIC · SIOP · NPI",
    tone: "var(--color-pillar-oms)", Icon: Cog,
    hurdle: HURDLES[1], render: OmsScene },
  { key: "capex", duration: 5, title: "Turnaround Finance & Cash", kicker: "04 · 13-week cash · gates · COPQ",
    tone: "var(--color-pillar-strategy)", Icon: Wallet,
    hurdle: HURDLES[2], render: CashCapexScene },
  { key: "toolkit", duration: 5, title: "Problem Solver & Toolkit", kicker: "05 · TOC · Systems Thinking · IBP · Hoshin · MRO",
    tone: "var(--color-primary)", Icon: Target, render: ToolkitScene },
  { key: "compliance", duration: 4, title: "Compliance & Assurance", kicker: "06 · Part 145 · SMS (ICAO Annex 19)",
    tone: "var(--color-pillar-oms)", Icon: ShieldCheck, render: ComplianceScene },
  { key: "people", duration: 4, title: "Human Capital & Change", kicker: "07 · The enablers",
    tone: "var(--color-pillar-people)", Icon: Users,
    hurdle: HURDLES[3], render: PeopleScene },
  { key: "report", duration: 4, title: "Report to the Board", kicker: "08 · PDF & editable PowerPoint",
    tone: "var(--color-primary)", Icon: FileText,
    hurdle: HURDLES[4], render: ReportScene },
  { key: "governance", duration: 2, title: "Multi-company & access", kicker: "09 · Governed by design",
    tone: "var(--color-primary)", Icon: Building2, render: GovernanceScene },
];



export function GuidedTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    setPlaying(true);
    last.current = null;
  }, [open]);

  useEffect(() => {
    if (!open || !playing) return;
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
  }, [open, playing]);

  const stopRecording = () => {
    try { recorderRef.current?.stop(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
    setRecording(false);
  };

  // Auto-stop recording when tour finishes
  useEffect(() => {
    if (recording && elapsed >= TOTAL) {
      // Give the final frame a beat to render
      const id = setTimeout(stopRecording, 500);
      return () => clearTimeout(id);
    }
  }, [recording, elapsed]);

  const startRecording = async () => {
    setRecError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setRecError("Screen recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;
      const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `do-impact-tour-${new Date().toISOString().slice(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      // If the user stops sharing from the browser bar, clean up.
      stream.getVideoTracks()[0].addEventListener("ended", stopRecording);
      recorderRef.current = rec;
      rec.start(250);
      setRecording(true);
      // Restart the tour from frame 0 so the whole thing is captured
      setElapsed(0);
      setPlaying(true);
      last.current = null;
    } catch (e: any) {
      setRecError(e?.message ?? "Could not start screen recording.");
    }
  };

  // Cleanup on close
  useEffect(() => {
    if (!open && recording) stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { sceneIdx, sceneProgress, scene } = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < SCENES.length; i++) {
      const s = SCENES[i];
      if (elapsed < acc + s.duration || i === SCENES.length - 1) {
        return { sceneIdx: i, sceneProgress: Math.min(1, (elapsed - acc) / s.duration), scene: s };
      }
      acc += s.duration;
    }
    return { sceneIdx: 0, sceneProgress: 0, scene: SCENES[0] };
  }, [elapsed]);

  if (!open) return null;

  const Icon = scene.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="text-sm font-bold tracking-tight">DO.Impact — Guided Tour</span>
            {recording && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> REC
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!recording ? (
              <button onClick={startRecording} className="mr-1 inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/5 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10" title="Record & download">
                <Circle className="h-3 w-3 fill-current" /> Record
              </button>
            ) : (
              <button onClick={stopRecording} className="mr-1 inline-flex items-center gap-1.5 rounded-md border border-red-500 bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600" title="Stop & download">
                <Download className="h-3 w-3" /> Stop & save
              </button>
            )}
            <button onClick={() => { setElapsed(0); setPlaying(true); last.current = null; }} className="rounded p-1.5 hover:bg-muted" title="Restart">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => setPlaying((p) => !p)} className="rounded p-1.5 hover:bg-muted" title={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button onClick={onClose} className="rounded p-1.5 hover:bg-muted" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {recError && (
          <div className="border-b bg-red-500/10 px-5 py-1.5 text-xs text-red-600">{recError}</div>
        )}

        {/* Stage */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-muted/40 to-background p-5">
          {/* Scene header */}
          <div key={scene.key + "h"} className="animate-fade-in mb-3 flex items-center gap-3">
            <div className="rounded-lg p-2" style={{ background: `color-mix(in oklch, ${scene.tone} 15%, transparent)` }}>
              <Icon className="h-5 w-5" style={{ color: scene.tone }} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: scene.tone }}>
                {scene.kicker}
              </div>
              <div className="text-xl font-bold tracking-tight">{scene.title}</div>
            </div>
            {sceneIdx < SCENES.length - 1 && (
              <ArrowRight className="ml-auto h-5 w-5 animate-pulse text-muted-foreground" />
            )}
          </div>

          {/* Scene body — reserves space for hurdle ribbon when present */}
          <div key={scene.key} className={`animate-fade-in ${scene.hurdle ? "h-[calc(100%-6rem)]" : "h-[calc(100%-4rem)]"}`}>
            {scene.render(sceneProgress)}
          </div>

          {/* Hurdle → Answer ribbon */}
          {scene.hurdle && (
            <div key={scene.key + "-hurdle"} className="animate-fade-in absolute inset-x-5 bottom-3 flex items-center gap-2.5 rounded-md border bg-card/95 px-3 py-1.5 shadow-sm backdrop-blur">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ background: scene.tone }}>
                {scene.hurdle.n}
              </div>
              <div className="min-w-0 flex-1 text-[10.5px] leading-tight">
                <span className="font-semibold">Solves hurdle {scene.hurdle.n}:</span>{" "}
                <span className="text-muted-foreground">{scene.hurdle.label}</span>
              </div>
              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                <ArrowRight className="h-3 w-3" style={{ color: scene.tone }} />
                <span className="text-[10.5px] font-semibold" style={{ color: scene.tone }}>{scene.hurdle.answer}</span>
              </div>
            </div>
          )}
        </div>


        {/* Progress + chapters */}
        <div className="border-t px-5 py-3">
          <div className="mb-2 flex h-1.5 gap-1 overflow-hidden rounded-full">
            {SCENES.map((s, i) => {
              const acc = SCENES.slice(0, i).reduce((a, b) => a + b.duration, 0);
              const p = Math.max(0, Math.min(1, (elapsed - acc) / s.duration));
              return (
                <div key={s.key} className="flex-1 overflow-hidden rounded-full bg-muted" style={{ flexGrow: s.duration }}>
                  <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${p * 100}%`, background: s.tone }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              <span>{Math.ceil(TOTAL - elapsed)}s remaining · {sceneIdx + 1}/{SCENES.length}</span>
            </div>
            <div className="hidden gap-3 sm:flex">
              {SCENES.slice(1).map((s, i) => (
                <span key={s.key} className={`transition-opacity ${i + 1 === sceneIdx ? "font-semibold text-foreground" : "opacity-60"}`} style={{ color: i + 1 === sceneIdx ? s.tone : undefined }}>
                  {s.title.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {elapsed >= TOTAL && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 backdrop-blur-sm animate-fade-in p-6">
            <LineChart className="h-10 w-10 text-primary" />
            <div className="text-2xl font-bold text-center">Throughput velocity + regulatory discipline</div>
            <div className="max-w-lg text-center text-sm text-muted-foreground">
              In A&D, sustainable EBITDA is a byproduct of throughput and discipline — never raw cost-cutting. DO.Impact wires the five hurdles into one operating rhythm, from strategy to boardroom.
            </div>

            <div className="mt-2 flex gap-2">
              <button onClick={() => { setElapsed(0); setPlaying(true); last.current = null; }} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                Replay
              </button>
              <button onClick={onClose} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Enter suite
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
