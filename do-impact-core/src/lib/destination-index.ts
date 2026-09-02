import {
  PILLARS,
  SUB_NAV,
  EXTRA_MODULES,
  COMPLIANCE_SECTIONS,
  PILLAR_TONE,
  type PillarKey,
} from "@/lib/nav-registry";
import { getHelpEntry } from "@/lib/help-registry";

export type DestinationGroup =
  | "Strategy"
  | "Commercial"
  | "Operations"
  | "People"
  | "Execution"
  | "Reporting"
  | "Workspace";

export type Destination = {
  /** Stable preference key when the destination can be hidden in Settings. */
  key?: string;
  label: string;
  path: string;
  /** Optional search params, e.g. the Compliance tab. */
  search?: Record<string, string>;
  group: DestinationGroup;
  description?: string;
  keywords: string[];
  tone: string;
};

const GROUP_BY_PILLAR: Record<PillarKey, DestinationGroup> = {
  strategy: "Strategy",
  commercial: "Commercial",
  oms: "Operations",
  people: "People",
  actions: "Execution",
};

/** Synonyms and acronyms people actually type, keyed by path. */
const KEYWORDS: Record<string, string[]> = {
  "/strategy": ["strategy foundation", "vision", "mission", "swot", "north star"],
  "/strategy/waterfall": ["bridge", "ebitda bridge", "profit bridge", "levers", "value drivers"],
  "/strategy/hoshin": ["hoshin kanri", "x-matrix", "policy deployment", "catchball", "annual objectives"],
  "/strategy/initiatives": ["progress", "workstreams", "initiatives", "transformation tracker"],
  "/strategy/restructuring": ["restructuring", "reorg", "cost out", "footprint"],
  "/strategy/consolidation": ["consolidation", "site merge", "plant closure"],
  "/strategy/capex": ["capex", "turnaround finance", "cash", "investment case", "payback"],
  "/commercial": ["commercial overview", "growth", "sales"],
  "/commercial/accounts": ["crm", "customers", "clients", "accounts"],
  "/commercial/stakeholders": ["contacts", "buying centre", "decision makers", "raci"],
  "/commercial/opportunities": ["pipeline", "deals", "quotes", "bids", "rfq"],
  "/commercial/contracts": ["contract review", "bid review", "terms", "ltas", "gates", "legal"],
  "/commercial/plan": ["plan vs pipeline", "forecast", "budget", "coverage"],
  "/commercial/review": ["weekly commercial review", "pipeline meeting"],
  "/commercial/voc": ["voc", "voice of the customer", "customer feedback", "complaints", "nps", "survey"],
  "/oms": ["oms", "operating system", "framework", "operations model"],
  "/oms/daily": ["sqdp", "daily management", "tier 1", "t1", "t2", "tier meetings", "3c", "gemba", "shift start"],
  "/oms/shopfloor": ["shop floor", "andon", "downtime", "production board", "operators"],
  "/oms/scheduling": ["scheduling", "aps", "finite capacity", "master schedule", "0-12 week"],
  "/oms/supply-chain": ["supply chain", "suppliers", "procurement", "purchasing", "mrp", "shortages", "otd"],
  "/oms/siop": ["siop", "s&op", "sales and operations planning", "demand plan", "capacity plan", "ibp"],
  "/oms/industrialization": ["npi", "new product introduction", "apqp", "ppap", "as9145", "industrialization", "new equipment"],
  "/oms/end-of-life": ["eol", "end of life", "obsolescence", "last time buy", "phase out"],
  "/oms/compliance": ["compliance", "audit", "regulatory", "part 145", "sms", "safety", "ehs", "business continuity", "am/pm", "tpm"],
  "/oms/kpis": ["kpi", "metrics", "oee", "otif", "scrap", "ppm", "measures", "dashboard"],
  "/oms/sic": ["sic", "short interval control", "hour by hour", "pacing"],
  "/oms/vsm": ["vsm", "value stream map", "lead time", "flow", "waste"],
  "/oms/quality": ["quality", "capa", "ncr", "nonconformance", "cost of poor quality", "copq", "pfmea"],
  "/oms/risk": ["risk register", "mitigation", "fmea", "risk matrix"],
  "/oms/standard-work": ["standard work", "sop", "work instructions", "5s", "training within industry"],
  "/oms/critical-path": ["critical path", "pulse", "bottleneck", "constraint", "late orders"],
  "/people": ["people overview", "human capital", "hr"],
  "/people/employees": ["employees", "headcount", "staff", "workforce", "team list"],
  "/people/skills": ["skills", "competency", "capability"],
  "/people/roles": ["roles", "job descriptions", "responsibilities"],
  "/people/development": ["development", "training plan", "idp", "coaching"],
  "/people/leadership": ["leadership", "succession", "talent review", "9 box"],
  "/people/org-chart": ["org chart", "organisation chart", "reporting lines", "structure"],
  "/people/matrix": ["skills matrix", "training matrix", "versatility", "ilu"],
  "/people/gaps": ["skill gaps", "capability gaps", "coverage"],
  "/people/certifications": ["certifications", "licences", "qualifications", "expiry", "tickets"],
  "/people/engagement": ["engagement", "pulse survey", "morale", "absenteeism", "turnover"],
  "/people/import": ["import people", "upload employees", "excel", "csv"],
  "/actions": ["execution timeline", "gantt", "actions", "task tracker", "to do"],
  "/actions/problem-solver": ["problem solving", "rca", "root cause", "corrective action"],
  "/actions/problem-solver/a3": ["a3", "problem solving report", "pdca"],
  "/actions/problem-solver/eight-d": ["8d", "eight disciplines", "customer complaint", "containment"],
  "/actions/problem-solver/five-whys": ["5 whys", "five whys", "why why"],
  "/actions/problem-solver/fishbone": ["fishbone", "ishikawa", "cause and effect", "6m"],
  "/actions/problem-solver/dmaic": ["dmaic", "six sigma", "lean sigma"],
  "/actions/problem-solver/mro": ["mro", "aviation", "repair station", "turn time"],
  "/actions/problem-solver/flows": ["problem flows", "guided problem solving"],
  "/actions/problem-solver/toolkit": ["toolkit", "improvement tools", "lean tools"],
  "/actions/problem-solver/toolkit/toc": ["theory of constraints", "toc", "drum buffer rope", "bottleneck"],
  "/actions/problem-solver/toolkit/cld": ["systems thinking", "causal loop diagram", "cld"],
  "/actions/problem-solver/toolkit/ibp": ["ibp", "integrated business planning"],
  "/actions/problem-solver/toolkit/hoshin": ["hoshin", "policy deployment"],
  "/actions/problem-solver/toolkit/journey": ["employee journey", "onboarding", "experience map"],
  "/actions/playbook": ["decision playbook", "worksheet", "decision log"],
  "/actions/calculators": ["calculators", "shop floor maths"],
  "/actions/calculators/oee": ["oee calculator", "availability", "performance", "quality rate"],
  "/actions/calculators/takt": ["takt time", "cycle time", "line balance"],
  "/actions/calculators/copq": ["cost of poor quality", "copq", "scrap cost", "rework"],
  "/actions/calculators/downtime": ["downtime cost", "breakdown cost"],
  "/actions/calculators/changeover": ["smed", "changeover", "setup reduction"],
};

const REPORTING: Omit<Destination, "tone" | "group">[] = [
  { key: "overview.report.board", label: "Board Report", path: "/report/board", description: "One-page board pack across all pillars.", keywords: ["board pack", "monthly report", "exec report", "pptx"] },
  { key: "overview.report.owner", label: "Owner Dashboard", path: "/report/owner", description: "Owner-level view of the whole business.", keywords: ["owner dashboard", "ceo view"] },
  { key: "overview.report.businesshealth", label: "Business Health", path: "/report/business-health", description: "Health check across the operating system.", keywords: ["business health", "maturity", "assessment", "scorecard"] },
  { key: "overview.report.industrialstrategy", label: "Industrial Strategy report", path: "/report/industrial-strategy", description: "16-step industrial strategy summary.", keywords: ["industrial strategy", "footprint", "make vs buy"] },
  { key: "overview.report.kpis", label: "KPI report", path: "/report", description: "Key KPIs and reporting hub.", keywords: ["reports", "kpi report", "key kpis"] },
  { key: "overview.report.network", label: "Enterprise Network", path: "/report/enterprise-network", description: "Multi-site network view.", keywords: ["enterprise network", "multi site", "group view"] },
  { key: "overview.report.teamroom", label: "Exec Team Room", path: "/report/team-room", description: "AI leadership team room.", keywords: ["team room", "ai advisor", "exec room", "intelligence"] },
  { key: "overview.report.weekly", label: "Weekly SLT Meeting", path: "/meeting/weekly", description: "Weekly senior leadership meeting agenda.", keywords: ["weekly meeting", "slt", "leadership meeting", "agenda"] },
  { key: "overview.report.calendar", label: "Calendar (audit & events)", path: "/meeting", description: "Audit and meeting calendar.", keywords: ["calendar", "audit schedule", "events"] },
];

const WORKSPACE: Omit<Destination, "tone" | "group">[] = [
  { label: "Overview", path: "/overview", description: "Your home screen across all pillars.", keywords: ["home", "start", "dashboard"] },
  { label: "Settings", path: "/settings", description: "Show or hide modules, presets, number format, privacy.", keywords: ["preferences", "hide modules", "on off", "profile"] },
  { label: "Billing & plan", path: "/billing", description: "Plan, seats, invoices and add-ons.", keywords: ["subscription", "invoice", "payment", "plan", "seats"] },
  { label: "Administration", path: "/admin/people", description: "Users, access levels and module grants.", keywords: ["admin", "users", "permissions", "access", "invite"] },
  { label: "Support center", path: "/support", description: "Guides, walkthrough videos and the getting-started PDF.", keywords: ["help", "videos", "guide", "training", "tour"] },
  { label: "FAQ", path: "/faq", description: "Frequently asked questions.", keywords: ["faq", "questions"] },
];

function kw(path: string, label: string, extra: string[] = []): string[] {
  return [...(KEYWORDS[path] ?? []), ...extra, label.toLowerCase()];
}

function buildIndex(): Destination[] {
  const out: Destination[] = [];
  const seen = new Set<string>();

  const push = (d: Destination) => {
    const id = d.path + (d.search ? `?${new URLSearchParams(d.search).toString()}` : "");
    if (seen.has(id)) return;
    seen.add(id);
    out.push(d);
  };

  for (const pillar of PILLARS) {
    push({
      key: pillar.navKey,
      label: pillar.label,
      path: pillar.to,
      group: GROUP_BY_PILLAR[pillar.key],
      description: getHelpEntry(pillar.to)?.shortBlurb,
      keywords: kw(pillar.to, pillar.label),
      tone: PILLAR_TONE[pillar.key],
    });
  }

  for (const pillarKey of Object.keys(SUB_NAV) as PillarKey[]) {
    const items = [...SUB_NAV[pillarKey], ...EXTRA_MODULES[pillarKey]];
    for (const item of items) {
      push({
        key: item.key,
        label: item.label,
        path: item.to,
        group: GROUP_BY_PILLAR[pillarKey],
        description: getHelpEntry(item.to)?.shortBlurb,
        keywords: kw(item.to, item.label),
        tone: PILLAR_TONE[pillarKey],
      });
    }
  }

  for (const section of COMPLIANCE_SECTIONS) {
    push({
      key: section.key,
      label: `Compliance · ${section.label}`,
      path: "/oms/compliance",
      search: { tab: section.tab },
      group: "Operations",
      description: "Audit-ready checklists and evidence records.",
      keywords: kw("/oms/compliance", section.label, [section.tab]),
      tone: PILLAR_TONE.oms,
    });
  }

  for (const r of REPORTING) push({ ...r, group: "Reporting", tone: "var(--accent)" });
  for (const w of WORKSPACE) push({ ...w, group: "Workspace", tone: "var(--accent)" });

  return out;
}

export const DESTINATIONS: Destination[] = buildIndex();

export const DESTINATION_GROUP_ORDER: DestinationGroup[] = [
  "Strategy",
  "Commercial",
  "Operations",
  "People",
  "Execution",
  "Reporting",
  "Workspace",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9&\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Simple, predictable ranking: exact > prefix > word-start > substring. */
export function searchDestinations(query: string, limit = 40): Destination[] {
  const q = normalize(query);
  if (!q) return DESTINATIONS.slice(0, limit);
  const terms = q.split(" ");

  const scored: { d: Destination; score: number }[] = [];
  for (const d of DESTINATIONS) {
    const label = normalize(d.label);
    const haystack = normalize([d.label, d.description ?? "", d.keywords.join(" "), d.path].join(" "));
    let score = 0;
    for (const term of terms) {
      if (label === term) score += 100;
      else if (label.startsWith(term)) score += 60;
      else if (label.includes(term)) score += 40;
      else if (d.keywords.some((k) => normalize(k).startsWith(term))) score += 30;
      else if (haystack.includes(term)) score += 15;
      else {
        score = -1;
        break;
      }
    }
    if (score > 0) scored.push({ d, score });
  }

  scored.sort((a, b) => b.score - a.score || a.d.label.localeCompare(b.d.label));
  return scored.slice(0, limit).map((s) => s.d);
}
