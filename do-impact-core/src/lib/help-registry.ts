import { PILLARS, SUB_NAV, type PillarKey } from "@/lib/nav-registry";
import { BLURBS, CROSS_CUTTING } from "@/lib/framework-guide-content";
import { MODULES, PROBLEMS } from "@/lib/problem-matrix";

export type HelpPosition = "top" | "right" | "bottom" | "left";

export type HelpEntry = {
  route: string;
  title: string;
  shortBlurb: string;
  pillar: PillarKey | "reporting" | "cross";
  tone: string;
  whyItMatters?: string;
  relatedRoutes: string[];
};

export type TourStep = {
  targetSelector: string;
  title: string;
  body: string;
  position?: HelpPosition;
};

export type ModuleTour = {
  id: string;
  route: string;
  title: string;
  description: string;
  steps: TourStep[];
};

const PILLAR_TONE: Record<string, string> = {
  strategy: "var(--pillar-strategy)",
  commercial: "var(--pillar-commercial)",
  oms: "var(--pillar-oms)",
  people: "var(--pillar-people)",
  actions: "var(--accent)",
  reporting: "var(--accent)",
  cross: "var(--accent)",
};

function routePillar(route: string): PillarKey | "reporting" | "cross" {
  for (const p of Object.keys(SUB_NAV) as PillarKey[]) {
    if (SUB_NAV[p].some((s) => s.to === route)) return p;
  }
  if (route.startsWith("/report") || route.startsWith("/meeting")) return "reporting";
  return "cross";
}

export function buildHelpRegistry(): HelpEntry[] {
  const entries: HelpEntry[] = [];
  const seen = new Set<string>();

  for (const pillar of Object.keys(SUB_NAV) as PillarKey[]) {
    for (const sub of SUB_NAV[pillar]) {
      if (seen.has(sub.to)) continue;
      seen.add(sub.to);
      const moduleMatch = MODULES.find((m) => m.to === sub.to);
      const blurb = BLURBS[sub.to] ?? moduleMatch?.blurb ?? "";
      entries.push({
        route: sub.to,
        title: sub.label,
        shortBlurb: blurb,
        pillar,
        tone: PILLAR_TONE[pillar],
        whyItMatters: whyForRoute(sub.to),
        relatedRoutes: relatedRoutesFor(sub.to),
      });
    }
  }

  for (const cross of CROSS_CUTTING) {
    if (seen.has(cross.to)) continue;
    seen.add(cross.to);
    entries.push({
      route: cross.to,
      title: cross.label,
      shortBlurb: cross.blurb,
      pillar: "cross",
      tone: PILLAR_TONE.cross,
      whyItMatters: whyForRoute(cross.to),
      relatedRoutes: relatedRoutesFor(cross.to),
    });
  }

  return entries;
}

function whyForRoute(route: string): string | undefined {
  for (const problem of PROBLEMS) {
    const hit = problem.flow.find((f) => MODULES.find((m) => m.id === f.id)?.to === route);
    if (hit) return `${problem.title}: ${hit.why}`;
  }
  return undefined;
}

function relatedRoutesFor(route: string): string[] {
  const out: string[] = [];
  for (const problem of PROBLEMS) {
    const idx = problem.flow.findIndex((f) => MODULES.find((m) => m.id === f.id)?.to === route);
    if (idx >= 0) {
      const next = problem.flow[idx + 1];
      if (next) {
        const m = MODULES.find((mm) => mm.id === next.id);
        if (m && !out.includes(m.to)) out.push(m.to);
      }
    }
  }
  return out;
}

const REGISTRY = buildHelpRegistry();

export function getHelpEntry(route: string): HelpEntry | undefined {
  return REGISTRY.find((e) => e.route === route);
}

export function listHelpEntries(): HelpEntry[] {
  return REGISTRY;
}

export function getPillarHelp(pillar: PillarKey): HelpEntry[] {
  return REGISTRY.filter((e) => e.pillar === pillar);
}
