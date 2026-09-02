import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Wordmark } from "@/components/wordmark";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home, Settings as SettingsIcon, LifeBuoy, Building2, UserRound, Search } from "lucide-react";
import { openHelpSearch } from "@/components/help/help-search";
import { MobileNav } from "@/components/mobile-nav";

import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PILLARS, SUB_NAV, PILLAR_TONE, PILLAR_TONE_BY_MATCH, tint, type PillarKey } from "@/lib/nav-registry";
import { useMyAccess } from "@/hooks/use-access";
import { useMyCompanies, useActiveCompany, useSetActiveCompany } from "@/hooks/use-companies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = { label: string; to: string; match?: string; navKey?: string };
const nav: NavItem[] = [
  ...PILLARS.filter((p) => p.key !== "actions").map((p) => ({ label: p.label, to: p.to, match: p.match, navKey: p.navKey })),
];

const subNavByPath: Record<string, { key: string; label: string; to: string }[]> = {
  "/strategy": SUB_NAV.strategy,
  "/commercial": SUB_NAV.commercial,
  "/oms": SUB_NAV.oms,
  "/people": SUB_NAV.people,
};

const pillarMatchToKey: Record<string, PillarKey> = {
  "/strategy": "strategy",
  "/commercial": "commercial",
  "/oms": "oms",
  "/people": "people",
};

const LABELS: Record<string, string> = {
  overview: "Overview", strategy: "Strategy", commercial: "Commercial", oms: "Operations", people: "People",
  hoshin: "Hoshin Kanri", initiatives: "Progress", a3: "A3", restructuring: "Restructuring", capex: "Turnaround Finance", waterfall: "Waterfall",
  accounts: "Accounts", stakeholders: "Stakeholders", opportunities: "Opportunities",
  contracts: "Contracts", plan: "Plan vs pipeline", review: "Weekly review",
  daily: "Daily (SQDP)", kpis: "KPIs", risk: "Calendar", meetings: "Meetings", siop: "SIOP", npi: "NPI", industrialization: "Industrialization", "end-of-life": "End-of-Life",
  pillars: "Pillar", employees: "Employees", skills: "Skills", roles: "Roles",
  matrix: "Skill matrix", gaps: "Gaps", certifications: "Certifications",
  development: "Development", leadership: "Leadership", "org-chart": "Org chart", import: "Import",
  report: "Report", board: "Board report", weekly: "Weekly SLT", meeting: "Meeting", actions: "Execution",
  "problem-solver": "Problem Solver", flows: "Problem Flow", mro: "Aviation MRO",
};

function humanize(seg: string) {
  return LABELS[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Path prefixes that are grouping segments only — no page exists there.
const NON_LINKABLE_CRUMBS = new Set(["/oms/pillars"]);

function buildCrumbs(pathname: string) {
  const segs = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; to: string; linkable: boolean }[] = [];
  let acc = "";
  for (const s of segs) {
    acc += "/" + s;
    const linkable = !NON_LINKABLE_CRUMBS.has(acc);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) {
      crumbs.push({ label: "Details", to: acc, linkable });
    } else {
      crumbs.push({ label: humanize(s), to: acc, linkable });
    }
  }
  return crumbs;
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isEnabled } = useUserPreferences();
  const { hasModule } = useMyAccess();

  const visible = (key: string) => isEnabled(key) && hasModule(key);

  // The shop-floor view renders its own minimal frame — no pillars, no breadcrumbs.
  const bare = pathname.startsWith("/floor");

  const visibleNav = nav.filter((n) => !n.navKey || visible(n.navKey));
  const activePillar = visibleNav.find((n) => n.match && pathname.startsWith(n.match))?.match;
  const rawSubs = activePillar ? subNavByPath[activePillar] : null;
  const pillarKey = activePillar ? pillarMatchToKey[activePillar] : null;
  const pillarNavKey = pillarKey ? PILLARS.find((p) => p.key === pillarKey)?.navKey : null;
  const subs = rawSubs && (!pillarNavKey || visible(pillarNavKey))
    ? rawSubs.filter((s) => visible(s.key))
    : null;
  const crumbs = buildCrumbs(pathname);
  const showCrumbs = crumbs.length > 1 && pathname !== "/overview";
  const activeTone = pillarKey
    ? PILLAR_TONE[pillarKey]
    : (pathname.startsWith("/actions") ? PILLAR_TONE.actions : null);

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-4 py-2 md:px-6 md:py-3">
          <div className="flex min-w-0 items-center gap-1">
            <MobileNav visible={visible} />
            <Link to="/overview" className="flex min-w-0 items-center gap-2">
              <div className="h-7 w-7 shrink-0 rounded bg-primary" />
              <Wordmark className="truncate font-bold tracking-tight" />
            </Link>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {visibleNav.map((n) => {
              const isActive =
                n.to === "/overview"
                  ? pathname === "/overview"
                  : !!n.match && pathname.startsWith(n.match);
              const tone = (n.match && PILLAR_TONE_BY_MATCH[n.match]) || null;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive ? "font-semibold" : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                  style={
                    tone
                      ? {
                          backgroundColor: isActive ? tint(tone, 14) : undefined,
                          color: isActive ? tone : undefined,
                          boxShadow: isActive ? `inset 0 -2px 0 0 ${tone}` : undefined,
                        }
                      : isActive
                        ? { backgroundColor: "var(--secondary)", color: "var(--secondary-foreground)" }
                        : undefined
                  }
                >
                  {tone && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tone, opacity: isActive ? 1 : 0.55 }}
                    />
                  )}
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => openHelpSearch()}
              className="flex items-center gap-2 rounded-full border border-border px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-3"
              aria-label="Search the app"
              title="Search the app (⌘K)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search…</span>
              <kbd className="hidden rounded border border-border px-1 text-[10px] lg:inline">⌘K</kbd>
            </button>

            <CompanySwitcher />

            <div className="hidden items-center gap-1 md:flex">
              <Link
                to="/settings"
                className="rounded-full p-2 text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Settings"
                title="Settings"
              >
                <SettingsIcon className="h-5 w-5" />
              </Link>

              <Link
                to="/support"
                className="rounded-full p-2 text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Support & getting started"
                title="Support & getting started"
              >
                <LifeBuoy className="h-5 w-5" />
              </Link>
            </div>

            {/* Mobile: everything above collapsed into one menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu" className="min-h-11 min-w-11 md:hidden">
                  <UserRound className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ to: "/select-company" })}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Switch workspace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/support" })}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {subs && (
          <div
            style={
              activeTone
                ? { borderTopColor: tint(activeTone, 45), backgroundColor: tint(activeTone, 7) }
                : undefined
            }
            className="border-t border-border"
          >
            <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 py-2 md:px-6">
              {subs.map((s) => {
                const isActive = pathname === s.to;
                return (
                  <Link
                    key={s.to}
                    to={s.to}
                    ref={(el) => {
                      if (isActive && el) el.scrollIntoView({ block: "nearest", inline: "center" });
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`whitespace-nowrap py-1 text-sm ${
                      isActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      isActive && activeTone
                        ? { color: activeTone, boxShadow: `inset 0 -2px 0 0 ${activeTone}` }
                        : undefined
                    }
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {showCrumbs && (
          <div className="border-t border-border bg-muted/30">
            <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-1.5 text-xs md:px-6">
              <Link to="/overview" className="flex items-center text-muted-foreground hover:text-foreground">
                <Home className="h-3 w-3" />
              </Link>
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                const crumbTone = PILLAR_TONE_BY_MATCH[c.to] ?? null;
                return (
                  <span key={c.to} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    {isLast || !c.linkable ? (
                      <span
                        className={isLast ? "font-medium text-foreground" : "whitespace-nowrap text-muted-foreground"}
                        style={crumbTone ? { color: crumbTone, fontWeight: 600 } : undefined}
                      >
                        {c.label}
                      </span>
                    ) : (
                      <a
                        href={c.to}
                        onClick={(e) => { e.preventDefault(); navigate({ to: c.to as string }); }}
                        className="whitespace-nowrap text-muted-foreground hover:text-foreground"
                        style={crumbTone ? { color: crumbTone, fontWeight: 600 } : undefined}
                      >
                        {c.label}
                      </a>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      {activeTone && <div aria-hidden className="no-print h-0.5 w-full" style={{ backgroundColor: activeTone }} />}

      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">{children}</main>
    </div>
  );
}

function CompanySwitcher() {
  const navigate = useNavigate();
  const companiesQ = useMyCompanies();
  const activeQ = useActiveCompany();
  const setActive = useSetActiveCompany();

  const companies = companiesQ.data ?? [];
  const activeId = activeQ.data?.company_id ?? null;
  const active = companies.find((c) => c.company_id === activeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-44 gap-2 rounded-full">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{active?.companies?.name ?? "Select workspace"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {companies.map((c) => (
          <DropdownMenuItem
            key={c.company_id}
            onClick={() => {
              setActive.mutate(c.company_id, { onSuccess: () => navigate({ to: "/overview" }) });
            }}
          >
            <span className="truncate">{c.companies?.name ?? c.company_id}</span>
            {c.company_id === activeId && <span className="ml-auto text-xs text-muted-foreground">active</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/select-company" })}>
          Manage workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
