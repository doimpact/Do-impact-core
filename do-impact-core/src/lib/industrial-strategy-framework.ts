// Static content for the Industrial Strategy Framework workspace
// (Strategy Foundation → Industrial Strategy Framework tab).
// Editable data lives in industrial_strategy_entries / industrial_strategy_rows.

export const EXECUTIVE_PRINCIPLE =
  "The objective is not simply to make the factory more efficient. The objective is to design an industrial system that creates a structural competitive advantage in the markets the company chooses to serve.";

export const VALUE_CHAIN = [
  "Market",
  "Customer value proposition",
  "Product portfolio",
  "Competitive advantage",
  "Manufacturing capabilities",
  "Supply chain",
  "Footprint & capacity",
  "Technology",
  "Organization",
  "Capital allocation",
  "Performance management",
];

/** The one-page strategic cascade. Each band is a saved text entry. */
export const CASCADE: { key: string; label: string; question: string; hint: string }[] = [
  { key: "ambition", label: "Ambition", question: "Where are we going?", hint: "Become the preferred North American supplier of X for customers in Y, differentiated by Z, at A% EBITDA and B% on-time delivery." },
  { key: "where-to-play", label: "Where to play", question: "Which markets, customers, products and geographies?", hint: "Name the segments you will serve — and the ones you will not." },
  { key: "how-to-win", label: "How to win", question: "What are our 2–3 sources of competitive advantage?", hint: "Two or three. Not eight." },
  { key: "capabilities", label: "Capabilities", question: "What must we become excellent at?", hint: "The capabilities a larger competitor would find hard to replicate economically." },
  { key: "industrial-model", label: "Industrial model", question: "What should we make, where, how and with what technology?", hint: "Make / buy / partner, flow, footprint, capacity, technology." },
  { key: "economics", label: "Economics", question: "What will it generate?", hint: "Revenue, gross margin, EBITDA, working capital, capex, ROIC." },
  { key: "transformation", label: "Transformation", question: "What must we do first?", hint: "The 0–90 day moves and the funded initiative portfolio." },
];

/** Nine integrated components of the industrial strategy architecture. */
export const COMPONENTS: {
  key: string;
  label: string;
  question: string;
  output: string;
  prompts: string[];
}[] = [
  {
    key: "c-ambition",
    label: "Strategic ambition",
    question: "Where are we going?",
    output: "3–5 year ambition",
    prompts: ["Revenue ambition", "EBITDA / operating-profit ambition", "Target margin", "Geographic ambition", "Customer segments", "Product categories", "Desired competitive position", "Desired return on capital", "Risk appetite", "Manufacturing footprint", "Strategic capabilities"],
  },
  {
    key: "c-market",
    label: "Market & customers",
    question: "Where will we compete?",
    output: "Attractive market segments",
    prompts: ["Market size, growth, cyclicality", "Industry profitability", "Customer & competitor concentration", "Pricing trends", "Technology disruption & regulation", "Labor, energy and raw-material trends", "Import/export dynamics"],
  },
  {
    key: "c-competitive",
    label: "Competitive strategy",
    question: "How will we win?",
    output: "Sources of advantage",
    prompts: ["Why does a customer choose them instead of us?", "Where does economic profit sit in the value chain?", "Our 2–3 primary advantages"],
  },
  {
    key: "c-product",
    label: "Product strategy",
    question: "What should we sell/make?",
    output: "Product portfolio choices",
    prompts: ["Grow / Fix / Simplify / Harvest / Exit", "Complexity cost", "NPI pipeline"],
  },
  {
    key: "c-manufacturing",
    label: "Manufacturing strategy",
    question: "How should we manufacture?",
    output: "Manufacturing model",
    prompts: ["Flow & layout", "Planning (S&OP, MRP, scheduling)", "Quality system", "Maintenance strategy", "People & skills", "Daily management system"],
  },
  {
    key: "c-supply",
    label: "Supply chain strategy",
    question: "What should we make/buy and how should we source?",
    output: "Supply network",
    prompts: ["Make / buy / partner logic", "Supplier segmentation", "Single-source exposure", "Risk heat map"],
  },
  {
    key: "c-footprint",
    label: "Footprint & capacity",
    question: "Where and with how much capacity?",
    output: "Plant / network roadmap",
    prompts: ["Current vs required capacity", "Debottleneck / shift / outsource / new site", "Total landed cost, not labor cost"],
  },
  {
    key: "c-technology",
    label: "Technology & capabilities",
    question: "What capabilities must we build?",
    output: "Technology / capability roadmap",
    prompts: ["Business problem → economic opportunity → technical solution → ROI", "Automation, robotics, MES, data/AI", "Implementation capability"],
  },
  {
    key: "c-transformation",
    label: "Transformation & governance",
    question: "How do we execute?",
    output: "Initiative portfolio + management system",
    prompts: ["Funded initiative portfolio", "Single accountable owners", "Monthly Industrial Strategy Review"],
  },
];

/** The 16 working steps. `link` points at an existing module in the suite. */
export const STEPS: {
  key: string;
  n: number;
  title: string;
  intro: string;
  checklist: string[];
  links?: { label: string; to: string }[];
}[] = [
  {
    key: "s1", n: 1, title: "Establish the strategic ambition",
    intro: "Define what the company is trying to become — actionable, not aspirational.",
    checklist: ["Revenue and EBITDA ambition quantified", "Target margin and ROIC set", "Geography, segments and product categories named", "Desired competitive position stated", "Risk appetite and footprint agreed"],
    links: [{ label: "Strategy Foundation vision", to: "/strategy" }],
  },
  {
    key: "s2", n: 2, title: "Understand the external environment",
    intro: "Build a fact base on market, industry economics and competitors.",
    checklist: ["Market size, growth and cyclicality", "Economic waterfall: price − material − labor − overhead − logistics − warranty", "Where economic profit sits in the value chain", "Competitor profiles: margin, price, lead time, technology, integration", "Answer: why does a customer choose them instead of us?"],
    links: [{ label: "Strategy Deployment (Waterfall)", to: "/strategy/waterfall" }],
  },
  {
    key: "s3", n: 3, title: "Customer segmentation",
    intro: "Segment by economics and needs, not by industry label.",
    checklist: ["Segments defined by application, volume, quality, lead time, complexity, certification, price sensitivity", "Attractiveness × right-to-win scored", "INVEST / BUILD / MAINTAIN / EXIT decided"],
    links: [{ label: "Accounts", to: "/commercial/accounts" }, { label: "Voice of Customer", to: "/commercial/voc" }],
  },
  {
    key: "s4", n: 4, title: "Define how we win",
    intro: "Pick 2–3 primary advantages. Trying to be best at everything is the classic mistake.",
    checklist: ["2–3 advantages selected and evidenced", "Advantages tested against customer buying criteria", "Trade-offs explicitly accepted"],
  },
  {
    key: "s5", n: 5, title: "Translate advantage into manufacturing capabilities",
    intro: "Ask what we must become exceptionally good at — not what equipment to buy.",
    checklist: ["Each competitive requirement mapped to a required capability", "Current maturity assessed (have / partial / none)", "Owner and action per gap"],
    links: [{ label: "Skills & gaps", to: "/people/gaps" }],
  },
  {
    key: "s6", n: 6, title: "Product & industrialization strategy",
    intro: "Analyse every major product on economics and complexity.",
    checklist: ["Revenue, margin, volume, growth per product", "Engineering hours, setup time, quality and warranty cost", "GROW / FIX / SIMPLIFY / HARVEST / EXIT assigned"],
    links: [{ label: "Industrialization (NPI)", to: "/oms/industrialization" }, { label: "End-of-Life", to: "/oms/end-of-life" }],
  },
  {
    key: "s7", n: 7, title: "Design the manufacturing model",
    intro: "Make / buy / partner, then the operating model across flow, planning, quality, maintenance, people and management system.",
    checklist: ["Make when differentiating, IP-critical, quality-critical or supply-risky", "Buy when standardized and suppliers have better economics", "Partner when specialized capability is required", "Flow, layout, WIP and setup strategy defined", "Planning, quality, maintenance and daily management defined"],
    links: [{ label: "Value stream map", to: "/oms/vsm" }, { label: "Daily (SQDP)", to: "/oms/daily" }],
  },
  {
    key: "s8", n: 8, title: "Capacity strategy",
    intro: "Demand → required hours → available hours → utilization → bottleneck → investment.",
    checklist: ["Current, base, high and downside demand cases modelled", "Effective vs bottleneck capacity known", "Capacity after productivity and automation modelled", "Answer sequenced: improve → debottleneck → equipment → shift → outsource → facility"],
    links: [{ label: "SIOP", to: "/oms/siop" }, { label: "Scheduling (0–12wk)", to: "/oms/scheduling" }],
  },
  {
    key: "s9", n: 9, title: "Footprint strategy",
    intro: "Use total landed cost, never labor cost alone.",
    checklist: ["Current plant and expansion potential assessed", "Second site / nearshore / outsource options costed", "Labor, material, energy, freight, duties, inventory, quality, working capital and risk included"],
    links: [{ label: "Consolidation", to: "/strategy/consolidation" }],
  },
  {
    key: "s10", n: 10, title: "Supply chain strategy",
    intro: "Map the value chain and segment suppliers by risk and value.",
    checklist: ["Spend, lead time, MOQ, capacity and financial health per critical supplier", "Single-source exposure and switching time known", "STRATEGIC / LEVERAGE / BOTTLENECK / TRANSACTIONAL assigned", "Risk heat map built"],
    links: [{ label: "Supply Chain", to: "/oms/supply-chain" }],
  },
  {
    key: "s11", n: 11, title: "Technology strategy",
    intro: "Technology follows strategy. Business problem → economic opportunity → technical solution → ROI → implementation capability.",
    checklist: ["Each technology tied to a specific economic problem", "Automation and robotics justified by labor, quality or throughput", "MES / scheduling / traceability scoped", "Data and AI use cases defined", "No 'cool technology → find a use case'"],
  },
  {
    key: "s12", n: 12, title: "Cost transformation",
    intro: "Build a clean-sheet cost model and attack the structural drivers.",
    checklist: ["Material, conversion labor, machine, overhead, scrap, logistics, quality, warranty, inventory per product", "Material levers: value engineering, should-cost, specification, design simplification", "Labor levers: automation, line balancing, standard work, layout", "Equipment levers: OEE, cycle time, setup, maintenance, bottleneck", "Complexity measured: SKUs, variants, changeovers, routings, suppliers"],
    links: [{ label: "Turnaround Finance (CAPEX)", to: "/strategy/capex" }, { label: "Calculators", to: "/actions/calculators" }],
  },
  {
    key: "s13", n: 13, title: "Quality strategy",
    intro: "Quality as a strategic capability, not an inspection department.",
    checklist: ["Customer PPM, FPY, scrap, rework, warranty and COPQ tracked", "Process capability understood on critical characteristics", "Supplier defects managed", "Shift from inspect–detect–correct to design–prevent–control"],
    links: [{ label: "KPIs", to: "/oms/kpis" }, { label: "Problem Solver", to: "/actions/problem-solver" }],
  },
  {
    key: "s14", n: 14, title: "Organization & talent",
    intro: "The minimum critical capability set — not a corporate organization.",
    checklist: ["Required capability defined per function", "Have / partially have / do not have assessed", "Leverage, develop, hire, partner or acquire decided per gap"],
    links: [{ label: "Employees", to: "/people/employees" }, { label: "Leadership", to: "/people/leadership" }],
  },
  {
    key: "s15", n: 15, title: "Capital allocation",
    intro: "Every initiative competes for capital: strategic importance × economic return × risk × capability impact.",
    checklist: ["All capital requests scored on the same framework", "Local ROI does not override strategic fit", "Capex phased against cash"],
    links: [{ label: "Turnaround Finance (CAPEX)", to: "/strategy/capex" }],
  },
  {
    key: "s16", n: 16, title: "Build the strategic initiative portfolio",
    intro: "8–12 genuine strategic choices, 10–20 funded initiatives. If everything is strategic, nothing is.",
    checklist: ["Objective, owner, baseline, target, impact, investment, timing, KPI and risks per initiative", "Dependencies mapped", "Benefits tracked monthly"],
    links: [{ label: "Initiative Progress", to: "/strategy/initiatives" }, { label: "Timeline (Gantt)", to: "/actions" }],
  },
];

/** The eight ways a manufacturer wins. Pick 2–3. */
export const ADVANTAGES: { key: string; label: string; claim: string }[] = [
  { key: "cost", label: "Cost", claim: "I am structurally cheaper." },
  { key: "quality", label: "Quality", claim: "I have materially better quality/reliability." },
  { key: "delivery", label: "Delivery", claim: "I am materially faster or more reliable." },
  { key: "engineering", label: "Engineering", claim: "I solve difficult technical problems." },
  { key: "flexibility", label: "Flexibility", claim: "I economically handle customization and low-volume/high-mix." },
  { key: "innovation", label: "Innovation", claim: "I bring better products/processes to market." },
  { key: "service", label: "Service", claim: "I am easier to do business with." },
  { key: "risk", label: "Risk reduction", claim: "I provide supply security, traceability, certification, domestic production." },
];

/** 10–12 week fact-based strategy process. */
export const PHASES: { key: string; n: number; label: string; weeks: string; collect: string[]; output: string }[] = [
  { key: "p1", n: 1, label: "Mobilize", weeks: "Week 1", collect: ["Strategic questions", "Scope", "Team", "Data requirements", "Financial baseline", "Timeline", "Decision rights"], output: "Strategy charter" },
  { key: "p2", n: 2, label: "Fact base", weeks: "Weeks 1–3", collect: ["Financials", "Product profitability", "Customers", "Markets", "Competitors", "Manufacturing performance", "Capacity", "Suppliers", "Costs", "Inventory", "Quality", "Workforce", "Technology", "Capital"], output: "Industrial fact base" },
  { key: "p3", n: 3, label: "External & customer analysis", weeks: "Weeks 2–4", collect: ["Customer interviews", "Lost-customer interviews", "Sales interviews", "Competitor analysis", "Market analysis", "Technology scan"], output: "Where-to-play hypotheses" },
  { key: "p4", n: 4, label: "Internal diagnostic", weeks: "Weeks 3–5", collect: ["Factory", "Value streams", "Product economics", "Supply chain", "Engineering", "Quality", "Organization", "Systems"], output: "Capability and performance gap assessment" },
  { key: "p5", n: 5, label: "Strategic choices", weeks: "Weeks 5–7", collect: ["Where will we play?", "Where will we not play?", "Target customers", "Product emphasis", "How will we win?", "Capabilities we must own", "Make vs buy", "Footprint", "Capacity", "Technology"], output: "Strategic choices" },
  { key: "p6", n: 6, label: "Industrial design", weeks: "Weeks 6–9", collect: ["Product", "Process", "Plant", "Supply chain", "Technology", "Organization"], output: "Target operating model" },
  { key: "p7", n: 7, label: "Economics", weeks: "Weeks 8–10", collect: ["Revenue impact", "Gross margin", "EBITDA", "Working capital", "Capex", "Cash flow", "ROIC"], output: "Strategy business case" },
  { key: "p8", n: 8, label: "Roadmap", weeks: "Weeks 9–11", collect: ["0–90 days: immediate actions", "3–12 months: transformation initiatives", "12–36 months: structural changes", "3–5 years: strategic investments"], output: "Transformation roadmap" },
  { key: "p9", n: 9, label: "Board / ownership alignment", weeks: "Week 12", collect: ["Ambition", "Strategic choices", "Target operating model", "Financial impact", "Capital requirements", "Major risks", "Roadmap"], output: "A decision — not merely a presentation" },
];

/** Industrial Strategy Cockpit — one page, layered. */
export const COCKPIT_LAYERS: { key: string; label: string; metrics: { key: string; label: string; kpiMatch?: string[] }[] }[] = [
  { key: "north-star", label: "North star", metrics: [
    { key: "revenue", label: "Revenue" }, { key: "ebitda", label: "EBITDA" }, { key: "roic", label: "ROIC" }, { key: "cash", label: "Cash" },
  ] },
  { key: "market", label: "Market", metrics: [
    { key: "growth", label: "Growth" }, { key: "win-rate", label: "Win rate", kpiMatch: ["win rate"] }, { key: "price", label: "Price" }, { key: "concentration", label: "Customer concentration" },
  ] },
  { key: "product", label: "Product", metrics: [
    { key: "p-margin", label: "Margin" }, { key: "p-growth", label: "Growth" }, { key: "p-complexity", label: "Complexity" }, { key: "npi", label: "NPI" },
  ] },
  { key: "factory", label: "Factory", metrics: [
    { key: "oee", label: "OEE", kpiMatch: ["oee", "overall equipment effectiveness"] },
    { key: "throughput", label: "Throughput", kpiMatch: ["throughput"] },
    { key: "labor-productivity", label: "Labor productivity", kpiMatch: ["labor productivity", "productivity"] },
    { key: "quality", label: "Quality", kpiMatch: ["first pass yield", "fpy", "scrap"] },
    { key: "delivery", label: "Delivery", kpiMatch: ["on-time delivery", "otd", "otif"] },
  ] },
  { key: "supply-chain", label: "Supply chain", metrics: [
    { key: "inventory", label: "Inventory", kpiMatch: ["inventory turns", "inventory"] },
    { key: "otif", label: "OTIF", kpiMatch: ["otif", "supplier on-time"] },
    { key: "supplier-risk", label: "Supplier risk" },
    { key: "material-cost", label: "Material cost" },
  ] },
  { key: "transformation", label: "Transformation", metrics: [
    { key: "benefits", label: "Benefits" }, { key: "capex", label: "Capex" }, { key: "milestones", label: "Milestones" }, { key: "risks", label: "Risks" },
  ] },
];

export const MONTHLY_REVIEW: { key: string; label: string; items: string[] }[] = [
  { key: "financial", label: "Financial", items: ["Revenue", "Gross margin", "EBITDA", "Cash", "Working capital"] },
  { key: "commercial", label: "Commercial", items: ["New business", "Win rate", "Pricing", "Customer concentration", "Pipeline"] },
  { key: "manufacturing", label: "Manufacturing", items: ["OEE", "Throughput", "Productivity", "Labor", "Scrap", "Changeover", "Capacity utilization"] },
  { key: "quality", label: "Quality", items: ["Customer PPM", "FPY", "Warranty", "COPQ"] },
  { key: "supply", label: "Supply chain", items: ["OTIF", "Inventory", "Supplier performance", "Expedites", "Supply risk"] },
  { key: "transformation", label: "Transformation", items: ["Initiative status", "Benefits realized", "Capex", "Risks", "Milestones"] },
];

export const AVOID: { label: string; why: string }[] = [
  { label: "Strategy by PowerPoint", why: "A strategy document without quantified economics." },
  { label: "Generic SWOT", why: "Useful as a prompt, but not a strategy." },
  { label: "Benchmarking without context", why: "Best practice doesn't matter if it isn't a source of advantage." },
  { label: "Technology-first strategy", why: "Buying automation before understanding the bottleneck." },
  { label: "Cost-only manufacturing strategy", why: "Lowest cost isn't necessarily the winning position." },
  { label: "Too many initiatives", why: "If everything is strategic, nothing is strategic." },
  { label: "Annual strategy-only process", why: "Industrial strategy should be continuously managed." },
];

export const TWELVE_QUESTIONS = [
  "What are our 20 most profitable products?",
  "Which customers generate the best economics?",
  "Why do customers choose us?",
  "Why do customers choose competitors?",
  "Where do we genuinely have an advantage?",
  "Which products/customers should we stop pursuing?",
  "What are our true manufacturing bottlenecks?",
  "What prevents us from doubling output?",
  "Which capabilities would create the greatest competitive advantage?",
  "What should we make versus buy?",
  "Where should we invest the next $1M of capital?",
  "What must be fundamentally different about the company in three years?",
];

export const DELIVERABLES = [
  "Industrial Strategy on a Page",
  "3–5 Year Strategic Ambition",
  "Market & Customer Attractiveness Map",
  "Competitive Positioning",
  "Product Portfolio Strategy",
  "Manufacturing Target Operating Model",
  "Supply Chain / Make-Buy Strategy",
  "Footprint & Capacity Strategy",
  "Technology & Capability Roadmap",
  "3-Year Transformation Plan + Business Case",
];

// ---- grid helpers -------------------------------------------------------

export function segmentBucket(attractiveness: number, rightToWin: number): { key: string; label: string; tone: string } {
  const a = attractiveness >= 3, r = rightToWin >= 3;
  if (a && r) return { key: "invest", label: "INVEST", tone: "bg-emerald-100 text-emerald-800" };
  if (a && !r) return { key: "build", label: "BUILD", tone: "bg-sky-100 text-sky-800" };
  if (!a && r) return { key: "maintain", label: "MAINTAIN", tone: "bg-amber-100 text-amber-800" };
  return { key: "exit", label: "EXIT", tone: "bg-rose-100 text-rose-800" };
}

export const PRODUCT_BUCKETS = [
  { key: "grow", label: "GROW", tone: "bg-emerald-100 text-emerald-800" },
  { key: "fix", label: "FIX", tone: "bg-amber-100 text-amber-800" },
  { key: "simplify", label: "SIMPLIFY", tone: "bg-sky-100 text-sky-800" },
  { key: "harvest", label: "HARVEST", tone: "bg-neutral-200 text-neutral-800" },
  { key: "exit", label: "EXIT", tone: "bg-rose-100 text-rose-800" },
];

export const MATURITY = [
  { key: "have", label: "Have", tone: "bg-emerald-100 text-emerald-800" },
  { key: "partial", label: "Partial", tone: "bg-amber-100 text-amber-800" },
  { key: "none", label: "None", tone: "bg-rose-100 text-rose-800" },
];

export const SUPPLIER_CLASSES = ["STRATEGIC", "LEVERAGE", "BOTTLENECK", "TRANSACTIONAL"];
