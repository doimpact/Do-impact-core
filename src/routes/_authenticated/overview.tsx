import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Compass,
  TrendingUp,
  Cog,
  Users,
  Network,
  ArrowRight,
  ArrowDown,
  FileText,
  Presentation,
  ListChecks,
  Lightbulb,
  CalendarDays,
  BarChart3,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PILLARS, subNavKeyForPath } from "@/lib/nav-registry";
import { useExecRoomAddon } from "@/hooks/use-exec-room";
import { Wordmark } from "@/components/wordmark";


export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({ meta: [{ title: "Overview — DO.Impact" }] }),
  component: Overview,
});

const pillars = [
  {
    name: "Strategy & Transformation",
    role: "Decide where to go",
    step: "Decide",
    to: "/strategy",
    Icon: Compass,
    tone: "var(--color-pillar-strategy)",
    subs: [
      { label: "Goals & Strategy Map", to: "/strategy" },
      { label: "Strategy Deployment (Waterfall)", to: "/strategy/waterfall" },
      { label: "Hoshin Planning (X-Matrix)", to: "/strategy/hoshin" },
      { label: "Restructuring", to: "/strategy/restructuring" },
      { label: "Plant Consolidation", to: "/strategy/consolidation" },
      { label: "Turnaround Finance (CAPEX)", to: "/strategy/capex" },
      { label: "Initiative Progress", to: "/strategy/initiatives" },
    ],
  },
  {
    name: "Commercial & Growth",
    role: "Win the work",
    step: "Sell",
    to: "/commercial",
    Icon: TrendingUp,
    tone: "var(--color-pillar-commercial)",
    subs: [
      { label: "Overview", to: "/commercial" },
      { label: "Accounts", to: "/commercial/accounts" },
      { label: "Stakeholders", to: "/commercial/stakeholders" },
      { label: "Opportunities", to: "/commercial/opportunities" },
      { label: "Contracts", to: "/commercial/contracts" },
      { label: "Plan vs Pipeline", to: "/commercial/plan" },
      { label: "Weekly review", to: "/commercial/review" },
    ],
  },
  {
    name: "Operating Management System",
    role: "Deliver it",
    step: "Run",
    to: "/oms",
    Icon: Cog,
    tone: "var(--color-pillar-oms)",
    subs: [
      { label: "How the System Works", to: "/oms" },
      { label: "Daily Management (SQDP)", to: "/oms/daily" },

      { label: "Sales & Ops Planning (SIOP)", to: "/oms/siop" },
      { label: "Shop Floor", to: "/oms/shopfloor" },
      { label: "Scheduling (0–12 Weeks)", to: "/oms/scheduling" },
      { label: "Supply Chain", to: "/oms/supply-chain" },
      { label: "New Product Introduction (NPI)", to: "/oms/industrialization" },
    ],
  },
  {
    name: "Our People & Leadership",
    role: "Make it possible",
    step: "Enable",
    to: "/people",
    Icon: Users,
    tone: "var(--color-pillar-people)",
    subs: [
      { label: "Overview", to: "/people" },
      { label: "Employees", to: "/people/employees" },
      { label: "Skills", to: "/people/skills" },
      { label: "Roles", to: "/people/roles" },
      { label: "Development", to: "/people/development" },
      { label: "Leadership", to: "/people/leadership" },
      { label: "Org chart", to: "/people/org-chart" },
    ],
  },

] as const;

type PillarDef = (typeof pillars)[number];

function Overview() {
  const { prefs, isEnabled, setField } = useUserPreferences();
  const { isActive: execRoomActive, lockReason: execRoomLock, termEnd: execRoomTermEnd } = useExecRoomAddon();

  const navigate = useNavigate();
  const visiblePillars = pillars.filter((p) => {
    const pk = PILLARS.find((x) => x.to === p.to);
    return !pk || isEnabled(pk.navKey);
  });
  const showBoard = isEnabled("overview.report.board");
  const showWeekly = isEnabled("overview.report.weekly");
  const showKpis = isEnabled("overview.report.kpis");
  const showCalendar = isEnabled("overview.report.calendar");
  const showActions = isEnabled("overview.report.actions") && isEnabled("nav.pillar.actions");
  const showActionsPillar = isEnabled("nav.pillar.actions");
  const showProblemSolver = isEnabled("nav.actions.problem-solver");
  const actionsSection = showActionsPillar && (showProblemSolver || showActions);
  const showTeamRoom = isEnabled("overview.report.teamroom");
  const showNetwork = isEnabled("overview.report.network");
  const execRoomLockReason = execRoomActive ? null : (execRoomLock ?? "inactive");
  const addonLockNote =
    execRoomLockReason === "expired"
      ? `The Intelligence add-on term ended${execRoomTermEnd ? ` on ${new Date(execRoomTermEnd).toLocaleDateString()}` : ""}. Renew it in Admin → Entitlements.`
      : execRoomLockReason === "no-grant"
        ? "Your workspace has this add-on — ask an admin to grant you access."
        : execRoomLockReason
          ? "Not part of this workspace's plan. Add Intelligence to unlock."
          : null;
  const reportCount = [showBoard, showWeekly, showKpis, showCalendar, showTeamRoom, showNetwork].filter(Boolean).length;
  const reportSection = reportCount > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight"><Wordmark /></h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One platform. Stronger relationships. Greater impact.
        </p>
      </div>

      <HowItWorks
        pillars={visiblePillars}
        showExecute={actionsSection}
        showReview={reportSection}
        collapsed={prefs.overview_how_it_works_collapsed}
        onToggle={() =>
          setField({ overview_how_it_works_collapsed: !prefs.overview_how_it_works_collapsed })
        }
      />

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-muted/30 p-4">
        <div className="grid gap-4 lg:grid-cols-4">
          {visiblePillars.map((p, idx) => {
            const visibleSubs = prefs.overview_show_all_chips
              ? [...p.subs]
              : p.subs.filter((s) => {
                  const k = subNavKeyForPath(s.to);
                  return !k || isEnabled(k);
                });
            return (
              <PillarCard
                key={p.to}
                pillar={p}
                index={idx}
                subs={visibleSubs}
                onNavigate={(to) => navigate({ to })}
              />
            );
          })}
        </div>
      </div>

      {actionsSection && (
        <>
          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <div className="grid items-stretch gap-3 md:grid-cols-2">
              {showActions && (
                <Link
                  to="/actions"
                  className="group flex h-full items-start gap-3 rounded-lg border border-border bg-background p-4 transition-shadow hover:shadow-md"
                >
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2.5"><ListChecks className="h-5 w-5 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">Timeline (Gantt)</p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Every action across Strategy, Operations, Turnaround Finance and Daily Management on one filterable timeline — see what's overdue, due this week, or by owner.</p>
                  </div>
                </Link>
              )}
              {showProblemSolver && (
                <Link
                  to="/actions/problem-solver"
                  className="group flex h-full items-start gap-3 rounded-lg border border-border bg-background p-4 transition-shadow hover:shadow-md"
                >
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2.5"><Lightbulb className="h-5 w-5 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">Problem Solver</p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Choose the right method for the pain: A3, 8D, the structured toolkit, or the Problem Flow workspace.</p>
                  </div>
                </Link>
              )}
            </div>
          </section>
        </>
      )}

      {reportSection && (
        <>
          <div className="mt-6 space-y-5">
            <CadenceGroup label="Weekly" hint="Leadership review cadence">
              {showWeekly && (
                <ReportTile
                  to="/meeting/weekly"
                  Icon={Presentation}
                  title="Weekly SLT Meeting"
                  desc="Full-screen, step-through agenda for the weekly leadership team review — safety, KPIs, escalations, pipeline, initiatives, actions."
                />
              )}
              {showKpis && (
                <ReportTile
                  to="/oms/kpis"
                  Icon={BarChart3}
                  title="KPIs"
                  desc="Track the operating KPI set month by month — targets, actuals and trend for the metrics that drive the review cadence."
                />
              )}
            </CadenceGroup>

            <CadenceGroup label="Monthly & board" hint="Report out to owners and the board">
              {showBoard && (
                <ReportTile
                  to="/report/board"
                  Icon={FileText}
                  title="Board Report"
                  desc="Cover, strategy, initiatives, A3, commercial pipeline, Operations SQDP/3C/KPIs, pillar boards, people coverage and open actions."
                />
              )}
              {showCalendar && (
                <ReportTile
                  to="/oms/risk"
                  Icon={CalendarDays}
                  title="Calendar"
                  desc="Audit and events calendar — customer and regulatory audits, reviews and key milestones across the cadence."
                />
              )}
            </CadenceGroup>

            <CadenceGroup label="Intelligence add-on" hint="AI leadership team and system modelling">
              {showTeamRoom && (
                <ReportTile
                  to="/report/team-room"
                  Icon={Users}
                  title="Exec Team Room"
                  desc="An AI senior leadership team — CEO, Operations, Sales, HR, Finance, Safety, Quality, Lean — briefed on the modules you have switched on."
                  addon
                  lockReason={execRoomLockReason}
                  lockNote={addonLockNote}
                />
              )}
              {showNetwork && (
                <ReportTile
                  to="/report/enterprise-network"
                  Icon={Network}
                  title="Enterprise Network"
                  desc="The business as one connected system — capabilities, value streams, decisions and suppliers — with ripple simulation showing where a change lands, and when."
                  addon
                  lockReason={execRoomLockReason}
                  lockNote={addonLockNote}
                />
              )}
            </CadenceGroup>
          </div>
        </>
      )}

    </div>
  );
}

function CadenceGroup({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  const tiles = (Array.isArray(children) ? children : [children]).filter(Boolean);
  if (tiles.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground/70">{hint}</span>
      </div>
      <div className="grid items-stretch gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

/** Explainer strip: Decide → Sell → Run → Enable, with Execute and Review closing the loop. */
function HowItWorks({
  pillars: list,
  showExecute,
  showReview,
  collapsed,
  onToggle,
}: {
  pillars: readonly PillarDef[];
  showExecute: boolean;
  showReview: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  if (list.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-label="How DO.Impact works">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How DO.Impact works</p>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Strategy sets the target, Commercial wins the work, Operations delivers it, People make it
            possible — Execution turns decisions into actions, and Review closes the loop.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Show how DO.Impact works" : "Hide how DO.Impact works"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p, i) => (
              <div
                key={p.to}
                className="relative rounded-lg border border-border border-t-4 bg-muted/30 px-4 py-3"
                style={{ borderTopColor: p.tone }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold" style={{ color: p.tone }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: p.tone }}>
                    {p.step}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium leading-tight">{p.role}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.name}</p>
                {i < list.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground lg:block" />
                )}
              </div>
            ))}
          </div>

          {(showExecute || showReview) && (
            <div className="mt-3 space-y-2">
              {showExecute && <LoopBar Icon={ListChecks} label="Execute" text="Actions and problem solving across every pillar" />}
              {showReview && <LoopBar Icon={RefreshCw} label="Review" text="Daily · weekly · monthly — findings feed back into strategy" />}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5 rotate-180" />
                <span>back into Decide</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LoopBar({ Icon, label, text }: { Icon: LucideIcon; label: string; text: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-sm font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

function PillarCard({
  pillar: p,
  index,
  subs,
  onNavigate,
}: {
  pillar: PillarDef;
  index: number;
  subs: { label: string; to: string }[];
  onNavigate: (to: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? subs : subs.slice(0, 3);
  const hidden = subs.length - shown.length;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".sub-module-list")) return;
        onNavigate(p.to);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(p.to);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border border-l-4 bg-card transition-shadow hover:shadow-md"
      style={{ borderLeftColor: p.tone }}
    >
      <div className="flex items-start justify-between p-5 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg p-2.5"
            style={{ backgroundColor: `color-mix(in oklch, ${p.tone} 15%, transparent)` }}
          >
            <p.Icon className="h-6 w-6" style={{ color: p.tone }} />
          </div>
          <span className="font-display text-2xl font-bold" style={{ color: p.tone }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <div className="px-5 pb-3">
        <h2 className="text-lg font-semibold leading-tight">{p.role}</h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{p.name}</p>
      </div>
      {shown.length > 0 && (
        <div className="sub-module-list mt-auto flex flex-col gap-1 border-t border-border bg-muted/30 p-5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Start here</p>
          {shown.map((s) => (
            <button
              key={s.to}
              onClick={() => onNavigate(s.to)}
              className="group/sub flex w-full items-center justify-between rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <span>{s.label}</span>
              <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover/sub:translate-x-0.5 group-hover/sub:opacity-100" />
            </button>
          ))}
          {(hidden > 0 || expanded) && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 self-start text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {expanded ? "Show less" : `+${hidden} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type ReportTileProps = {
  to: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  span?: string;
  addon?: boolean;
  lockReason?: "inactive" | "expired" | "no-grant" | null;
  lockNote?: string | null;
};

const LOCK_LABEL: Record<string, string> = {
  inactive: "Not active",
  expired: "Expired",
  "no-grant": "No access",
};

function ReportTile({ to, Icon, title, desc, span = "", addon, lockReason, lockNote }: ReportTileProps) {
  const locked = !!lockReason;
  const base = `group flex h-full items-start gap-3 rounded-lg border p-4 ${span}`;

  const body = (
    <>
      <div className={`rounded-lg p-2.5 ${locked ? "bg-muted" : "bg-primary/10"}`}>
        <Icon className={`h-5 w-5 ${locked ? "text-muted-foreground" : "text-primary"}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-semibold ${locked ? "text-muted-foreground" : ""}`}>
            {title}
            {addon && (
              <span
                className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                {locked ? `Add-on · ${LOCK_LABEL[lockReason!] ?? "Locked"}` : "Add-on"}
              </span>
            )}
          </p>
          {locked ? (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        {locked && lockNote && <p className="mt-2 text-xs text-muted-foreground/80">{lockNote}</p>}
      </div>
    </>
  );

  if (locked) {
    return (
      <div aria-disabled className={`${base} border-dashed border-muted-foreground/30 bg-muted/20`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`${base} ${addon ? "border-primary/30" : "border-border"} bg-background transition-shadow hover:shadow-md`}
    >
      {body}
    </Link>
  );
}
