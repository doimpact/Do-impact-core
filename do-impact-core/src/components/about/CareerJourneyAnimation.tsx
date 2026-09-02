import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type Scene = {
  id: string;
  start: number;
  end: number;
  kind: "intro" | "stop" | "synthesis" | "outro";
  location?: string;
  region?: string;
  industry?: string;
  delivered?: string;
  learned?: string;
  // approximate positions on a 1000x500 map (equirectangular-ish)
  x?: number;
  y?: number;
};

// Simplified positions on a 1000x500 canvas
const SCENES: Scene[] = [
  { id: "intro", start: 0, end: 4, kind: "intro" },
  {
    id: "sweden",
    start: 4,
    end: 10,
    kind: "stop",
    location: "Sweden",
    region: "Nordics",
    industry: "Engineering Services · CAE",
    delivered: "Scaled a CAE organisation across multiple offices with sustained double-digit YoY growth.",
    learned: "Technical execution — time is finite; foster high-performance teams and stay curious.",
    x: 520, y: 130,
  },
  {
    id: "india",
    start: 10,
    end: 17,
    kind: "stop",
    location: "India",
    region: "South Asia",
    industry: "Engineering Services → Aerospace",
    delivered: "Built an engineering centre from an empty office into a full-scale delivery organisation; later scaled an aerospace engineering and SE Asia supply hub.",
    learned: "Empowerment and scale — culture is what happens under pressure.",
    x: 690, y: 240,
  },
  {
    id: "us-east",
    start: 17,
    end: 23,
    kind: "stop",
    location: "US East · Connecticut",
    region: "North America",
    industry: "Aerospace Manufacturing",
    delivered: "Turnaround: solved systemic quality issues, stopped negative cash flow in 9 months, built an automated aero engine vane Center-of-Excellence.",
    learned: "Discipline — say no to a hundred good ideas to make room for the essential few.",
    x: 305, y: 175,
  },
  {
    id: "global",
    start: 23,
    end: 29,
    kind: "stop",
    location: "Global Restructuring",
    region: "US · Mexico · Norway",
    industry: "Enterprise PMO",
    delivered: "Led restructuring across 6 sites — work transfers, site closures and Centers-of-Excellence — closed better than budget.",
    learned: "Strategic execution — milestones and governance are only as strong as the core team.",
    x: 250, y: 155,
  },
  {
    id: "us-west",
    start: 29,
    end: 35,
    kind: "stop",
    location: "US West · California",
    region: "North America",
    industry: "Aerospace MRO",
    delivered: "$55M greenfield MRO campus, FAA Part 145 Accountable Manager, 98% customer satisfaction, Business of the Year.",
    learned: "Visionary leadership — bridging strategy and the messy reality of getting things done.",
    x: 195, y: 190,
  },
  { id: "synthesis", start: 35, end: 42, kind: "synthesis" },
  { id: "outro", start: 42, end: 45, kind: "outro" },
];

const TOTAL = 45;

const CAPABILITIES = [
  { title: "Strategic Transformation", pillar: "Strategy & Transformation Engine", desc: "Site turnarounds, a strategic closure, three greenfield Centers-of-Excellence." },
  { title: "People & Culture", pillar: "Our People & Leadership", desc: "From contributors to impactful leaders — internal promotion first." },
  { title: "Industrial Innovation", pillar: "Operating Management System", desc: "Data-driven tools, automation and NPI with strict fiscal oversight." },
  { title: "Corporate Governance", pillar: "Compliance & Restructuring", desc: "Certified corporate director · EASA / FAA Part 145 Accountable Manager." },
];

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function CareerJourneyAnimation() {
  const [t, setT] = useState(0); // seconds
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
      return;
    }
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= TOTAL) {
          setPlaying(false);
          return TOTAL;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const play = () => {
    if (t >= TOTAL) setT(0);
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const restart = () => {
    setT(0);
    setPlaying(true);
  };
  const jumpTo = (sec: number) => {
    setT(sec);
    setPlaying(true);
  };

  const active = SCENES.find((s) => t >= s.start && t < s.end) ?? SCENES[SCENES.length - 1];
  const stopScenes = SCENES.filter((s) => s.kind === "stop");
  const visitedStops = stopScenes.filter((s) => t >= s.start);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Stage */}
      <div className="relative bg-gradient-to-br from-background via-background to-primary/5 aspect-[16/9] overflow-hidden">
        {/* World map */}
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* stylized continents (very simplified) */}
          <g fill="currentColor" className="text-muted-foreground/20">
            {/* North America */}
            <path d="M120,120 Q160,90 230,100 T330,130 Q360,180 330,230 Q290,260 240,255 Q180,250 150,220 Q110,180 120,120 Z" />
            {/* South America */}
            <path d="M290,290 Q310,280 320,310 Q330,360 300,410 Q280,430 270,400 Q260,340 290,290 Z" />
            {/* Europe */}
            <path d="M480,110 Q520,95 560,110 Q580,140 555,165 Q510,175 485,155 Q470,135 480,110 Z" />
            {/* Africa */}
            <path d="M500,190 Q550,180 580,220 Q590,290 555,340 Q520,360 495,330 Q475,270 500,190 Z" />
            {/* Asia */}
            <path d="M580,110 Q680,90 780,115 Q830,150 800,200 Q740,240 680,235 Q610,220 585,180 Q570,140 580,110 Z" />
            {/* India subcontinent */}
            <path d="M670,220 Q700,215 710,245 Q705,280 685,285 Q665,275 660,250 Q660,230 670,220 Z" />
            {/* Australia */}
            <path d="M810,340 Q860,330 890,355 Q880,385 840,390 Q810,385 805,365 Q800,350 810,340 Z" />
          </g>

          {/* Arcs between stops (drawn progressively) */}
          {stopScenes.slice(0, -1).map((from, i) => {
            const to = stopScenes[i + 1];
            const appearAt = to.start;
            const done = t >= appearAt + 0.8;
            const prog = Math.max(0, Math.min(1, (t - appearAt) / 0.8));
            if (t < appearAt) return null;
            const mx = (from.x! + to.x!) / 2;
            const my = Math.min(from.y!, to.y!) - 60;
            const path = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
            return (
              <path
                key={`arc-${i}`}
                d={path}
                fill="none"
                className="text-primary"
                stroke="currentColor"
                strokeWidth={2}
                strokeDasharray="600"
                strokeDashoffset={done ? 0 : 600 - easeOut(prog) * 600}
                opacity={0.7}
              />
            );
          })}

          {/* Pins */}
          {stopScenes.map((s) => {
            const visible = t >= s.start;
            const isActive = active.id === s.id;
            const appear = Math.max(0, Math.min(1, (t - s.start) / 0.4));
            if (!visible) return null;
            const scale = easeOut(appear) * (isActive ? 1.4 : 1);
            return (
              <g key={s.id} transform={`translate(${s.x} ${s.y})`}>
                {isActive && (
                  <circle r={22} className="text-primary" fill="currentColor" opacity={0.15}>
                    <animate attributeName="r" values="18;30;18" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={8 * scale} className="text-primary" fill="currentColor" />
                <circle r={3 * scale} fill="white" />
              </g>
            );
          })}
        </svg>

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
          {/* Intro */}
          {active.kind === "intro" && (
            <div className="m-auto text-center animate-fade-in">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">A Career in Motion</div>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
                Bridging strategy and the shop floor
              </h2>
              <p className="mt-3 text-muted-foreground">Across 3 continents · 20+ years · 4 capabilities</p>
            </div>
          )}

          {/* Stop card */}
          {active.kind === "stop" && (
            <>
              <div />
              <div
                key={active.id}
                className="max-w-lg self-end rounded-xl border border-border bg-card/95 p-5 shadow-lg backdrop-blur animate-fade-in"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  {active.location}
                  <span className="text-muted-foreground/70">· {active.region}</span>
                </div>
                <div className="mt-1 text-lg font-semibold">{active.industry}</div>
                <div className="mt-3 text-sm text-foreground">{active.delivered}</div>
                <div className="mt-3 border-t border-border pt-3 text-xs italic text-muted-foreground">
                  {active.learned}
                </div>
              </div>
            </>
          )}

          {/* Synthesis */}
          {active.kind === "synthesis" && (
            <div className="m-auto w-full max-w-4xl animate-fade-in">
              <div className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Four capabilities · One framework
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {CAPABILITIES.map((c, i) => {
                  const appearAt = 35 + i * 0.6;
                  const on = t >= appearAt;
                  return (
                    <div
                      key={c.title}
                      className="rounded-lg border border-border bg-card/95 p-4 backdrop-blur transition-all duration-500"
                      style={{
                        opacity: on ? 1 : 0,
                        transform: on ? "translateY(0)" : "translateY(12px)",
                      }}
                    >
                      <div className="text-sm font-semibold text-primary">{c.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">→ {c.pillar}</div>
                      <div className="mt-2 text-xs text-foreground">{c.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outro */}
          {active.kind === "outro" && (
            <div className="m-auto text-center animate-fade-in">
              <div className="text-4xl md:text-6xl font-bold tracking-tight">
                20+ years · 3 continents
              </div>
              <div className="mt-3 text-lg text-muted-foreground">One connected operating framework</div>
              <div className="mt-6 text-2xl font-bold text-primary">DO.Impact</div>
            </div>
          )}
        </div>

        {/* Visited-stop breadcrumbs */}
        {active.kind === "stop" && (
          <div className="absolute left-6 top-6 flex flex-wrap gap-1.5">
            {stopScenes.map((s) => {
              const done = visitedStops.some((v) => v.id === s.id);
              const isActive = active.id === s.id;
              return (
                <span
                  key={s.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.location}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-border bg-background/50 p-3">
        <div className="flex items-center gap-2">
          {playing ? (
            <Button size="sm" variant="secondary" onClick={pause}>
              <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
            </Button>
          ) : (
            <Button size="sm" onClick={play}>
              <Play className="mr-1.5 h-3.5 w-3.5" /> {t === 0 ? "Play 45s journey" : "Resume"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={restart}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restart
          </Button>
          <div className="ml-2 text-xs tabular-nums text-muted-foreground">
            {t.toFixed(1)}s / {TOTAL}s
          </div>
        </div>

        {/* Progress */}
        <div className="relative mt-3 h-1.5 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${(t / TOTAL) * 100}%` }}
          />
          {SCENES.filter((s) => s.kind === "stop" || s.kind === "synthesis").map((s) => (
            <button
              key={s.id}
              onClick={() => jumpTo(s.start)}
              className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-border bg-background hover:bg-primary"
              style={{ left: `${(s.start / TOTAL) * 100}%` }}
              title={s.location ?? "Synthesis"}
            />
          ))}
        </div>

        {/* Scene chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SCENES.filter((s) => s.kind !== "outro").map((s) => (
            <button
              key={s.id}
              onClick={() => jumpTo(s.start)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                active.id === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.kind === "intro" ? "Intro" : s.kind === "synthesis" ? "Synthesis" : s.location}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
