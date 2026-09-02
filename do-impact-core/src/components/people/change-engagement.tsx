import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Megaphone,
  Repeat,
  MessagesSquare,
  TrendingDown,
  Lightbulb,
  Clock,
} from "lucide-react";
import {
  TIERS,
  PRACTICE_GROUPS,
  SEVEN_CHANNELS,
  FEEDBACK_LOOPS,
  type TierKey,
} from "@/lib/change-engagement";

/** Normalised change-curve value (0 = deepest, 1 = fully internalised performance). */
function curveValue(t: number) {
  if (t < 0.45) return 0.8 - 0.55 * (0.5 - 0.5 * Math.cos((Math.PI * t) / 0.45));
  return 0.25 + 0.75 * (0.5 - 0.5 * Math.cos((Math.PI * (t - 0.45)) / 0.55));
}

const W = 900;
const H = 260;
const PAD_X = 48;
const PAD_Y = 28;

function px(t: number) {
  return PAD_X + t * (W - PAD_X * 2);
}
function py(t: number) {
  return H - PAD_Y - curveValue(t) * (H - PAD_Y * 2);
}

const CURVE_PATH = Array.from({ length: 81 }, (_, i) => {
  const t = i / 80;
  return `${i === 0 ? "M" : "L"}${px(t).toFixed(1)},${py(t).toFixed(1)}`;
}).join(" ");

const STAGES = [
  { t: 0.04, label: "Shock" },
  { t: 0.24, label: "Denial / anger" },
  { t: 0.46, label: "Bargaining" },
  { t: 0.68, label: "Acceptance" },
  { t: 0.93, label: "Internalisation" },
];

export default function ChangeEngagement() {
  const [activeKey, setActiveKey] = useState<TierKey>("frontline");
  const active = TIERS.find((t) => t.key === activeKey)!;

  return (
    <div className="space-y-10">
      {/* a) Temporal mismatch */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight">The problem is timing, not communication</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          By the time the board and executive team announce a restructuring, a plant closure or a
          technology rollout, they have spent six to twelve months analysing data, working through
          uncertainty and reaching internalisation. The shop floor experiences that same announcement as
          Day&nbsp;1. Everyone is on the same curve — just not in the same place on it.
        </p>

        <div className="mt-5 rounded-xl border bg-card p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Change curve with each tier plotted at announcement day">
            {/* axes */}
            <line x1={PAD_X} y1={H - PAD_Y} x2={W - PAD_X} y2={H - PAD_Y} stroke="currentColor" className="text-border" />
            <line x1={PAD_X} y1={PAD_Y - 10} x2={PAD_X} y2={H - PAD_Y} stroke="currentColor" className="text-border" />
            <text x={PAD_X + 4} y={PAD_Y + 2} textAnchor="start" className="fill-muted-foreground text-[10px]">
              Performance
            </text>



            {STAGES.map((s) => (
              <text
                key={s.label}
                x={px(s.t)}
                y={H - PAD_Y + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px] uppercase tracking-wider"
              >
                {s.label}
              </text>
            ))}

            <path d={CURVE_PATH} fill="none" stroke="currentColor" strokeWidth={2} className="text-muted-foreground/50" />

            {/* Day 1 marker at frontline position */}
            <line
              x1={px(TIERS[3].curvePos)}
              y1={PAD_Y - 12}
              x2={px(TIERS[3].curvePos)}
              y2={H - PAD_Y}
              strokeDasharray="4 4"
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-destructive/70"
            />
            <text x={px(TIERS[3].curvePos) + 6} y={PAD_Y - 14} className="fill-destructive text-[10px] font-semibold">
              Day 1 — announcement
            </text>

            {TIERS.map((tier, i) => {
              const x = px(tier.curvePos);
              const y = py(tier.curvePos);
              const above = i % 2 === 0;
              return (
                <g key={tier.key} onClick={() => setActiveKey(tier.key)} className="cursor-pointer">
                  <circle cx={x} cy={y} r={activeKey === tier.key ? 9 : 6} fill={tier.tone} opacity={0.25} />
                  <circle cx={x} cy={y} r={activeKey === tier.key ? 5.5 : 4} fill={tier.tone} />
                  <text
                    x={x}
                    y={above ? y - 14 : y + 22}
                    textAnchor="middle"
                    className="text-[11px] font-semibold"
                    fill={tier.tone}
                  >
                    {tier.short}
                  </text>
                  <text
                    x={x}
                    y={above ? y - 2 : y + 34}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {tier.curveStage}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* b) Cascaded engagement architecture */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight">The cascaded engagement architecture</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Each tier needs a different information format, cadence and emotional framing. Select a tier to
          see what it needs, how often, through which channel — and which parts of DO.Impact carry that
          conversation.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {TIERS.map((tier) => {
            const selected = tier.key === activeKey;
            return (
              <button
                key={tier.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveKey(tier.key)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span
                  className="inline-block h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: tier.tone }}
                />
                <p className="mt-2 text-sm font-semibold">{tier.label}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {tier.cadence}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Primary need & psychological focus
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{active.need}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Strategic communication focus
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{active.focus}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              High-impact channels
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {active.channels.map((c) => (
                <span key={c} className="rounded-md border bg-background px-2 py-0.5 text-xs">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="md:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Where this happens in DO.Impact
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {active.modules.map((m) => (
                <Link
                  key={m.to + m.label}
                  to={m.to}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:border-primary hover:text-primary"
                >
                  {m.label} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* c) Research-backed practices */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Research-backed practices</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {PRACTICE_GROUPS.map((g) => (
            <div key={g.id} className="rounded-xl border bg-card">
              <div
                className="rounded-t-xl px-4 py-2.5"
                style={{ backgroundColor: `color-mix(in oklch, ${g.tone} 16%, transparent)` }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.audience}
                </p>
                <p className="text-sm font-semibold">{g.title}</p>
              </div>
              <div className="divide-y">
                {g.practices.map((p) => (
                  <div key={p.title} className="p-4">
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* d) Core mechanics */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight">Core mechanics: echo and feedback</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">The 7×7 rule</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              A key change message must land roughly seven times, through seven different channels, before
              it is internalised. Track each message across the grid — the empty cells are where the rumour
              mill fills the gap.
            </p>
            <div className="mt-4 space-y-1.5">
              {SEVEN_CHANNELS.map((c, ci) => (
                <div key={c} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <span className="truncate text-xs text-muted-foreground">{c}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }, (_, ri) => (
                      <span
                        key={ri}
                        className="h-3.5 w-3.5 rounded-[3px] border"
                        style={{
                          backgroundColor:
                            ri <= 6 - ci
                              ? `color-mix(in oklch, var(--color-primary) ${18 + (6 - ci) * 10}%, transparent)`
                              : "transparent",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <MessagesSquare className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Bi-directional feedback architecture</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Communication cannot be a one-way broadcast. Rapid loops let leadership kill a rumour within
              24 to 48 hours, before it becomes the accepted version of events.
            </p>
            <div className="mt-4 grid gap-2">
              <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
                <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">Broadcast down</span>
                <span className="text-muted-foreground">— board → exec → plant → shift</span>
              </div>
              {FEEDBACK_LOOPS.map((f) => (
                <div key={f.label} className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs font-medium">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* e) J-curve */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Plan for the J-curve</p>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Footprint consolidation and major technology change cause a temporary productivity dip before
            the gains arrive. Agree the depth and the length of that window with the board up front, so a
            planned dip is never mistaken for a failing programme.
          </p>
          <svg viewBox="0 0 520 180" className="mt-4 w-full" role="img" aria-label="J-curve productivity dip">
            <line x1="40" y1="150" x2="500" y2="150" stroke="currentColor" className="text-border" />
            <line x1="40" y1="16" x2="40" y2="150" stroke="currentColor" className="text-border" />
            <line x1="40" y1="70" x2="500" y2="70" strokeDasharray="4 4" stroke="currentColor" className="text-muted-foreground/40" />
            <text x="46" y="64" className="fill-muted-foreground text-[9px]">Baseline productivity</text>
            <path
              d="M40,70 C110,72 140,120 190,126 C250,132 300,96 360,64 C410,38 460,28 500,24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
            />
            <circle cx="190" cy="126" r="4" fill="var(--color-destructive, #ef4444)" />
            <text x="196" y="142" className="fill-muted-foreground text-[9px]">Dip — hold the line, do not course-correct</text>
            <circle cx="360" cy="64" r="4" fill="var(--color-primary)" />
            <text x="300" y="52" className="fill-muted-foreground text-[9px]">Break-even</text>
          </svg>
        </div>

        <div className="rounded-xl border bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Key transformation insight</p>
          </div>
          <p className="mt-3 text-base leading-relaxed">
            Employees rarely resist change itself. They resist the loss of control and the lack of
            predictability.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Restoring agency through participation — especially on the shop floor — is what turns
            resistance into sustainable execution. Every mechanic on this page exists to give a tier back
            some control: the board through scenario clarity, the executive through a single narrative,
            the plant manager through tools, and the operator through co-design.
          </p>
        </div>
      </section>
    </div>
  );
}
