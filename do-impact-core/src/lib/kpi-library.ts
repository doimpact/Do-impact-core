// Industrial manufacturing KPI library (SQDCPME + cross-functional areas).
// Static reference data — available to every company, no seeding required.

export type KpiCategoryKey =
  | "safety"
  | "quality"
  | "delivery"
  | "cost"
  | "productivity"
  | "maintenance"
  | "environment"
  | "people"
  | "inventory"
  | "supply-chain"
  | "planning"
  | "engineering"
  | "digital"
  | "lean"
  | "financial";

export type KpiIndicator = "leading" | "lagging";
export type KpiRole = "ceo" | "plant" | "production" | "maintenance" | "quality";
export type KpiLevel = 1 | 2 | 3 | 4 | 5;
export type KpiFrequency = "shift" | "daily" | "weekly" | "monthly" | "quarterly" | "annual";

export type KpiLibraryEntry = {
  key: string;
  name: string;
  code: string | null;
  category: KpiCategoryKey;
  group: string;
  definition: string;
  formula: string | null;
  unit: string;
  higherIsBetter: boolean;
  frequency: KpiFrequency;
  owner: string;
  dataSource: string;
  level: KpiLevel;
  indicator: KpiIndicator;
  roles: KpiRole[];
  core: boolean;
};

export const KPI_CATEGORIES: {
  key: KpiCategoryKey;
  letter: string | null;
  name: string;
  blurb: string;
}[] = [
  { key: "safety", letter: "S", name: "Safety", blurb: "Incidents, near misses and the leading behaviours that prevent them." },
  { key: "quality", letter: "Q", name: "Quality", blurb: "Yield, defects, escapes and the cost of poor quality." },
  { key: "delivery", letter: "D", name: "Delivery", blurb: "On time, in full, and to the production schedule." },
  { key: "cost", letter: "C", name: "Cost", blurb: "Conversion cost, cost per unit and variance to standard." },
  { key: "productivity", letter: "P", name: "Productivity", blurb: "OEE, throughput, utilisation and labour productivity." },
  { key: "maintenance", letter: "M", name: "Maintenance", blurb: "Reliability, downtime, PM discipline and asset availability." },
  { key: "environment", letter: "E", name: "Environment / Energy", blurb: "Energy, emissions, water and waste per unit produced." },
  { key: "people", letter: null, name: "People", blurb: "Labour hours, absence, turnover, skills and training." },
  { key: "inventory", letter: null, name: "Inventory", blurb: "Raw material, WIP, finished goods, turns and accuracy." },
  { key: "supply-chain", letter: null, name: "Supply Chain", blurb: "Supplier delivery, supplier quality, price and risk." },
  { key: "planning", letter: null, name: "Planning", blurb: "Plan attainment, schedule stability and forecast accuracy." },
  { key: "engineering", letter: null, name: "Engineering / NPI", blurb: "Launch timing, engineering change and design maturity." },
  { key: "digital", letter: null, name: "Digital Manufacturing", blurb: "Connectivity, data quality, automation and MES adoption." },
  { key: "lean", letter: null, name: "Lean", blurb: "Flow, cycle efficiency, standard work and improvement rate." },
  { key: "financial", letter: null, name: "Financial & Plant Performance", blurb: "Revenue, margin, EBITDA, capital and cash." },
];

export const KPI_LEVELS: { level: KpiLevel; name: string; blurb: string }[] = [
  { level: 1, name: "Strategic Outcomes", blurb: "What the business ultimately cares about." },
  { level: 2, name: "Operational Outcomes", blurb: "What the plant needs to achieve." },
  { level: 3, name: "Performance Drivers", blurb: "What drives those outcomes." },
  { level: 4, name: "Root Causes", blurb: "What causes performance problems." },
  { level: 5, name: "Leading Indicators", blurb: "What management can influence before the problem occurs." },
];

export const KPI_ROLES: { key: KpiRole; name: string }[] = [
  { key: "ceo", name: "CEO / Executive" },
  { key: "plant", name: "Plant Manager" },
  { key: "production", name: "Production Manager" },
  { key: "maintenance", name: "Maintenance Manager" },
  { key: "quality", name: "Quality Manager" },
];

type Raw = {
  k: string;
  n: string;
  c?: string;
  g: string;
  d: string;
  f?: string;
  u: string;
  dn?: 1; // lower is better
  fq?: KpiFrequency;
  o: string;
  s: string;
  lv: KpiLevel;
  i: KpiIndicator;
  r?: KpiRole[];
  core?: 1;
};

const RAW: Record<KpiCategoryKey, Raw[]> = {
  safety: [
    { k: "trir", n: "TRIR — Total Recordable Incident Rate", c: "TRIR", g: "Incident rates", d: "Number of OSHA-recordable injuries and illnesses per 200,000 hours worked.", f: "Recordable cases x 200,000 / Hours worked", u: "rate", dn: 1, o: "EHS Manager", s: "EHS incident log / HRIS hours", lv: 2, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "ltir", n: "LTIR — Lost Time Injury Rate", c: "LTIR", g: "Incident rates", d: "Number of injuries resulting in lost work time per 200,000 hours worked.", f: "Lost time injuries x 200,000 / Hours worked", u: "rate", dn: 1, o: "EHS Manager", s: "EHS incident log", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "dart", n: "DART Rate", c: "DART", g: "Incident rates", d: "Number of cases involving Days Away, Restricted Work, or Transfer per 200,000 hours worked.", f: "DART cases x 200,000 / Hours worked", u: "rate", dn: 1, o: "EHS Manager", s: "EHS incident log", lv: 2, i: "lagging", r: ["plant"] },
    { k: "ltifr", n: "Lost Time Injury Frequency Rate", c: "LTIFR", g: "Incident rates", d: "Number of lost-time injuries normalised against hours worked, commonly per 1 million hours.", f: "Lost time injuries x 1,000,000 / Hours worked", u: "rate", dn: 1, o: "EHS Manager", s: "EHS incident log", lv: 2, i: "lagging", r: ["plant"] },
    { k: "lti-severity", n: "Lost Time Injury Severity", g: "Incident rates", d: "Number of workdays lost as a result of occupational injuries.", u: "days", dn: 1, o: "EHS Manager", s: "EHS incident log / HR records", lv: 3, i: "lagging", r: ["plant"] },
    { k: "near-miss-rate", n: "Near-Miss Rate", g: "Leading behaviours", d: "Number of reported near misses normalised by hours worked or workforce size.", u: "count", o: "EHS Manager", s: "Near-miss reporting system", lv: 5, i: "leading", r: ["plant", "production"] },
    { k: "near-miss-closure", n: "Near-Miss Closure Rate", g: "Leading behaviours", d: "Percentage of identified near-miss corrective actions closed by their due date.", f: "Closed on time / Total due x 100", u: "%", o: "EHS Manager", s: "Action tracker", lv: 5, i: "leading", r: ["plant"], core: 1 },
    { k: "safety-observation-rate", n: "Safety Observation Rate", g: "Leading behaviours", d: "Number of proactive safety observations per employee or per hours worked.", u: "count", o: "Production Manager", s: "Observation cards / EHS system", lv: 5, i: "leading", r: ["production"] },
    { k: "safety-capa-closure", n: "Safety Corrective Action Closure Rate", g: "Leading behaviours", d: "Percentage of safety corrective actions closed on time.", f: "Actions closed on time / Actions due x 100", u: "%", o: "EHS Manager", s: "Action tracker", lv: 5, i: "leading", r: ["plant"] },
    { k: "days-since-recordable", n: "Days Since Last Recordable", g: "Incident rates", d: "Number of days since the most recent recordable safety incident.", u: "days", o: "EHS Manager", s: "EHS incident log", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "process-safety-incident-rate", n: "Process Safety Incident Rate", g: "Process safety", d: "Frequency of significant process-safety incidents, particularly relevant to chemical, energy and process industries.", u: "rate", dn: 1, o: "EHS Manager", s: "Process safety register", lv: 2, i: "lagging", r: ["plant"] },
    { k: "safety-audit-completion", n: "Safety Audit Completion", g: "Leading behaviours", d: "Percentage of planned safety audits and inspections completed on schedule.", f: "Audits completed / Audits planned x 100", u: "%", o: "EHS Manager", s: "Audit plan", lv: 5, i: "leading", r: ["plant"] },
    { k: "safety-training-compliance", n: "Safety Training Compliance", g: "Leading behaviours", d: "Percentage of required safety training completed and current across the workforce.", u: "%", o: "HR / EHS", s: "LMS / training matrix", lv: 5, i: "leading", r: ["plant"] },
    { k: "first-aid-cases", n: "First Aid Cases", g: "Incident rates", d: "Number of minor injuries treated with first aid and not classified as recordable.", u: "count", dn: 1, o: "EHS Manager", s: "EHS incident log", lv: 3, i: "lagging", r: ["production"] },
    { k: "ppe-compliance", n: "PPE Compliance", g: "Leading behaviours", d: "Percentage of observed work performed with correct personal protective equipment.", u: "%", o: "Production Manager", s: "Safety observations", lv: 5, i: "leading", r: ["production"] },
  ],
  quality: [
    { k: "fpy", n: "FPY — First Pass Yield", c: "FPY", g: "Yield", d: "Percentage of units that meet requirements the first time without rework, repair or retest.", f: "Units passing first time / Units started x 100", u: "%", o: "Quality Manager", s: "MES / production reporting", lv: 2, i: "lagging", r: ["ceo", "plant", "production", "quality"], core: 1 },
    { k: "ftq", n: "FTQ — First Time Quality", c: "FTQ", g: "Yield", d: "Percentage of production completed correctly without defects or subsequent correction.", u: "%", o: "Quality Manager", s: "MES / inspection records", lv: 2, i: "lagging", r: ["production", "quality"] },
    { k: "rty", n: "RTY — Rolled Throughput Yield", c: "RTY", g: "Yield", d: "Probability that a unit passes through every process step without defect or rework.", f: "Yield step 1 x Yield step 2 x ... x Yield step n", u: "%", o: "Quality Manager", s: "MES / process yields", lv: 3, i: "lagging", r: ["quality"] },
    { k: "scrap-rate", n: "Scrap Rate", g: "Defects", d: "Percentage of material or production discarded because it cannot be economically recovered.", f: "Scrapped units / Total units produced x 100", u: "%", dn: 1, o: "Production Manager", s: "MES / ERP scrap transactions", lv: 3, i: "lagging", r: ["plant", "production", "quality"], core: 1 },
    { k: "rework-rate", n: "Rework Rate", g: "Defects", d: "Percentage of production requiring additional processing to meet specifications.", f: "Reworked units / Total units produced x 100", u: "%", dn: 1, o: "Production Manager", s: "MES / rework orders", lv: 3, i: "lagging", r: ["plant", "production", "quality"] },
    { k: "defect-rate", n: "Defect Rate", g: "Defects", d: "Number of defects relative to total units produced.", f: "Defects / Units produced", u: "rate", dn: 1, o: "Quality Manager", s: "Inspection records", lv: 3, i: "lagging", r: ["quality"] },
    { k: "dpmo", n: "DPMO — Defects Per Million Opportunities", c: "DPMO", g: "Defects", d: "Number of defects per one million possible defect opportunities.", f: "Defects / (Units x Opportunities per unit) x 1,000,000", u: "ppm", dn: 1, o: "Quality Manager", s: "Inspection records", lv: 3, i: "lagging", r: ["quality"] },
    { k: "ppm-defective", n: "PPM Defective", c: "PPM", g: "Defects", d: "Number of defective parts per million parts produced.", f: "Defective parts / Parts produced x 1,000,000", u: "ppm", dn: 1, o: "Quality Manager", s: "Inspection records", lv: 3, i: "lagging", r: ["quality"] },
    { k: "customer-ppm", n: "Customer PPM", g: "Customer quality", d: "Number of defective parts identified by customers per million parts shipped.", f: "Customer rejects / Parts shipped x 1,000,000", u: "ppm", dn: 1, o: "Quality Manager", s: "Customer complaints / returns", lv: 2, i: "lagging", r: ["ceo", "plant", "quality"], core: 1 },
    { k: "customer-complaints", n: "Customer Complaints", g: "Customer quality", d: "Number of customer quality complaints during a defined period.", u: "count", dn: 1, o: "Quality Manager", s: "CRM / complaint log", lv: 2, i: "lagging", r: ["ceo", "quality"] },
    { k: "warranty-cost", n: "Warranty Cost", g: "Customer quality", d: "Cost associated with warranty claims, returns and field failures.", u: "currency", dn: 1, o: "Quality Manager", s: "Finance / warranty accruals", lv: 2, i: "lagging", r: ["ceo", "quality"] },
    { k: "copq", n: "COPQ — Cost of Poor Quality", c: "COPQ", g: "Cost of quality", d: "Total cost resulting from defects, failures, scrap, rework, inspection, returns and related quality problems.", f: "Internal failure + External failure + Appraisal + Prevention cost", u: "currency", dn: 1, o: "Quality Manager", s: "Finance / quality cost model", lv: 2, i: "lagging", r: ["ceo", "plant", "quality"], core: 1 },
    { k: "internal-failure-cost", n: "Internal Failure Cost", g: "Cost of quality", d: "Cost of defects detected before the product reaches the customer.", u: "currency", dn: 1, o: "Quality Manager", s: "Finance / quality cost model", lv: 3, i: "lagging", r: ["quality"] },
    { k: "external-failure-cost", n: "External Failure Cost", g: "Cost of quality", d: "Cost of defects detected after the product reaches the customer.", u: "currency", dn: 1, o: "Quality Manager", s: "Finance / quality cost model", lv: 3, i: "lagging", r: ["quality"] },
    { k: "quality-escape-rate", n: "Quality Escape Rate", g: "Customer quality", d: "Percentage of defects that escape internal quality controls and reach the customer.", f: "Escaped defects / Total defects x 100", u: "%", dn: 1, o: "Quality Manager", s: "Complaint log vs internal defects", lv: 3, i: "lagging", r: ["quality"] },
    { k: "capa-closure", n: "CAPA Closure Rate", g: "Quality system", d: "Percentage of corrective and preventive actions closed by their required deadline.", f: "CAPAs closed on time / CAPAs due x 100", u: "%", o: "Quality Manager", s: "QMS", lv: 5, i: "leading", r: ["quality"], core: 1 },
    { k: "audit-finding-closure", n: "Audit Finding Closure Rate", g: "Quality system", d: "Percentage of quality or compliance audit findings closed by their required deadline.", u: "%", o: "Quality Manager", s: "QMS / audit register", lv: 5, i: "leading", r: ["quality"] },
    { k: "cpk", n: "Process Capability (Cpk)", c: "Cpk", g: "Process control", d: "Statistical measure of how well a process fits within its specification limits.", u: "index", o: "Quality Manager", s: "SPC system", lv: 5, i: "leading", r: ["quality"] },
    { k: "spc-out-of-control", n: "Process Parameter Excursions", g: "Process control", d: "Number of statistical process control excursions outside defined control limits.", u: "count", dn: 1, o: "Quality Manager", s: "SPC system", lv: 5, i: "leading", r: ["quality", "production"] },
    { k: "supplier-quality-escapes", n: "Supplier Quality Escapes", g: "Quality system", d: "Number of defects reaching production that originated from supplied material.", u: "count", dn: 1, o: "Quality Manager", s: "Incoming inspection / NCR log", lv: 4, i: "lagging", r: ["quality"] },
    { k: "ncr-open", n: "Open Non-Conformance Reports", c: "NCR", g: "Quality system", d: "Number of non-conformance reports currently open and unresolved.", u: "count", dn: 1, o: "Quality Manager", s: "QMS", lv: 4, i: "lagging", r: ["quality"] },
    { k: "concession-rate", n: "Concession / Deviation Rate", g: "Quality system", d: "Percentage of production shipped under concession or deviation rather than to full specification.", u: "%", dn: 1, o: "Quality Manager", s: "QMS", lv: 4, i: "lagging", r: ["quality"] },
  ],
  delivery: [
    { k: "otif", n: "OTIF — On Time In Full", c: "OTIF", g: "Customer delivery", d: "Percentage of customer orders delivered on time and at the required quantity.", f: "Orders on time and complete / Total orders x 100", u: "%", o: "Supply Chain Manager", s: "ERP order/shipment data", lv: 2, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "otd", n: "OTD — On Time Delivery", c: "OTD", g: "Customer delivery", d: "Percentage of orders delivered by the promised date.", f: "Orders delivered on time / Total orders x 100", u: "%", o: "Supply Chain Manager", s: "ERP shipment data", lv: 2, i: "lagging", r: ["plant"] },
    { k: "schedule-adherence", n: "Schedule Adherence", g: "Production schedule", d: "Percentage of production completed according to the production schedule.", u: "%", o: "Planning Manager", s: "ERP / MES schedule vs actual", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "schedule-attainment", n: "Schedule Attainment", g: "Production schedule", d: "Actual production quantity divided by planned production quantity.", f: "Actual output / Planned output x 100", u: "%", o: "Production Manager", s: "MES / ERP", lv: 3, i: "lagging", r: ["plant", "production"], core: 1 },
    { k: "order-fill-rate", n: "Order Fill Rate", g: "Customer delivery", d: "Percentage of customer demand fulfilled from available inventory.", u: "%", o: "Supply Chain Manager", s: "ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "perfect-order-rate", n: "Perfect Order Rate", g: "Customer delivery", d: "Percentage of orders delivered on time, complete, damage-free and with correct documentation.", u: "%", o: "Supply Chain Manager", s: "ERP / logistics", lv: 2, i: "lagging", r: ["ceo"] },
    { k: "customer-lead-time", n: "Customer Lead Time", g: "Lead time", d: "Time between customer order receipt and customer delivery.", u: "days", dn: 1, o: "Supply Chain Manager", s: "ERP", lv: 3, i: "lagging", r: ["ceo", "plant"] },
    { k: "manufacturing-lead-time", n: "Manufacturing Lead Time", g: "Lead time", d: "Time required to manufacture an order.", u: "days", dn: 1, o: "Production Manager", s: "MES / ERP work orders", lv: 3, i: "lagging", r: ["production"] },
    { k: "past-due-orders", n: "Past Due Orders", g: "Customer delivery", d: "Orders that have not been completed by their required date.", u: "count", dn: 1, o: "Planning Manager", s: "ERP", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "order-backlog", n: "Backlog", g: "Customer delivery", d: "Outstanding customer orders that have not yet been fulfilled.", u: "currency", o: "Planning Manager", s: "ERP", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "expedite-rate", n: "Expedite Rate", g: "Customer delivery", d: "Percentage of orders requiring expedited production, logistics or processing.", u: "%", dn: 1, o: "Planning Manager", s: "ERP / freight records", lv: 4, i: "lagging", r: ["plant"] },
    { k: "customer-service-level", n: "Customer Service Level", g: "Customer delivery", d: "Degree to which customer demand is fulfilled according to agreed service requirements.", u: "%", o: "Supply Chain Manager", s: "ERP", lv: 2, i: "lagging", r: ["ceo"] },
    { k: "delivery-promise-accuracy", n: "Delivery Promise Accuracy", g: "Customer delivery", d: "Accuracy of the delivery date promised at order entry compared with the actual delivery date.", u: "%", o: "Customer Service", s: "ERP", lv: 4, i: "leading", r: ["plant"] },
  ],
  cost: [
    { k: "cogs", n: "COGS — Cost of Goods Sold", c: "COGS", g: "Cost base", d: "Cost associated with products sold during a defined period.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance / ERP", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "conversion-cost", n: "Conversion Cost", g: "Cost base", d: "Cost of transforming raw materials into finished products, typically including direct labour and manufacturing overhead.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance / ERP", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "mfg-cost-per-unit", n: "Manufacturing Cost per Unit", g: "Unit cost", d: "Total manufacturing cost divided by units produced.", f: "Total manufacturing cost / Units produced", u: "currency", dn: 1, o: "Plant Controller", s: "Finance / ERP", lv: 2, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "labor-cost-per-unit", n: "Direct Labour Cost per Unit", g: "Unit cost", d: "Direct labour cost divided by production volume.", u: "currency", dn: 1, o: "Plant Controller", s: "Payroll / ERP", lv: 3, i: "lagging", r: ["plant"], core: 1 },
    { k: "material-cost-per-unit", n: "Material Cost per Unit", g: "Unit cost", d: "Material consumption cost divided by production volume.", u: "currency", dn: 1, o: "Plant Controller", s: "ERP material issues", lv: 3, i: "lagging", r: ["plant"], core: 1 },
    { k: "overhead-cost-per-unit", n: "Overhead Cost per Unit", g: "Unit cost", d: "Manufacturing overhead divided by production volume.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance", lv: 3, i: "lagging", r: ["plant"] },
    { k: "scrap-cost", n: "Scrap Cost", g: "Waste cost", d: "Financial cost associated with material and products that are scrapped.", u: "currency", dn: 1, o: "Plant Controller", s: "ERP scrap transactions", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "rework-cost", n: "Rework Cost", g: "Waste cost", d: "Cost associated with correcting defective production.", u: "currency", dn: 1, o: "Plant Controller", s: "ERP rework orders", lv: 3, i: "lagging", r: ["production", "quality"] },
    { k: "downtime-cost", n: "Downtime Cost", g: "Waste cost", d: "Estimated financial impact associated with lost production capacity.", f: "Downtime hours x Contribution per hour", u: "currency", dn: 1, o: "Plant Controller", s: "MES downtime x finance rate", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "overtime-cost", n: "Overtime Cost", g: "Waste cost", d: "Labour cost associated with overtime work.", u: "currency", dn: 1, o: "Plant Controller", s: "Payroll", lv: 3, i: "lagging", r: ["plant"] },
    { k: "energy-cost-per-unit", n: "Energy Cost per Unit", g: "Unit cost", d: "Energy expenditure divided by production volume.", u: "currency", dn: 1, o: "Facilities Manager", s: "Utility invoices / meters", lv: 3, i: "lagging", r: ["plant"], core: 1 },
    { k: "maintenance-cost-per-unit", n: "Maintenance Cost per Unit", g: "Unit cost", d: "Maintenance spending divided by production volume.", u: "currency", dn: 1, o: "Maintenance Manager", s: "CMMS / finance", lv: 3, i: "lagging", r: ["plant", "maintenance"] },
    { k: "variance-to-standard", n: "Variance to Standard Cost", g: "Variance", d: "Difference between actual manufacturing cost and standard manufacturing cost.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance", lv: 3, i: "lagging", r: ["plant"] },
    { k: "manufacturing-variance", n: "Manufacturing Variance", g: "Variance", d: "Difference between actual manufacturing costs and planned or budgeted costs.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance", lv: 3, i: "lagging", r: ["plant"] },
    { k: "labor-variance", n: "Labour Variance", g: "Variance", d: "Difference between actual and standard or budgeted labour cost.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance / payroll", lv: 3, i: "lagging", r: ["plant"] },
    { k: "material-variance", n: "Material Variance", g: "Variance", d: "Difference between actual and standard or budgeted material cost.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance / ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "overhead-variance", n: "Overhead Variance", g: "Variance", d: "Difference between actual and budgeted manufacturing overhead.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance", lv: 3, i: "lagging", r: ["plant"] },
  ],
  productivity: [
    { k: "oee", n: "OEE — Overall Equipment Effectiveness", c: "OEE", g: "OEE", d: "Effectiveness of production equipment combining availability, performance and quality. Should be read alongside demand and schedule — high OEE while building the wrong product is not utilisation.", f: "Availability x Performance x Quality", u: "%", o: "Production Manager", s: "MES / PLC / production reporting", lv: 2, i: "lagging", r: ["ceo", "plant", "production"], core: 1 },
    { k: "oee-availability", n: "OEE Availability", g: "OEE", d: "Percentage of planned production time during which equipment is actually available to operate.", f: "Operating time / Planned production time", u: "%", o: "Production Manager", s: "MES / PLC", lv: 3, i: "lagging", r: ["production", "maintenance"] },
    { k: "oee-performance", n: "OEE Performance", g: "OEE", d: "Actual production speed compared with the theoretical ideal production speed.", f: "Actual output / Theoretical output at ideal cycle time", u: "%", o: "Production Manager", s: "MES / PLC", lv: 3, i: "lagging", r: ["production"] },
    { k: "oee-quality", n: "OEE Quality", g: "OEE", d: "Percentage of total production that is good product.", f: "Good units / Total units", u: "%", o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production", "quality"] },
    { k: "production-volume", n: "Production Volume", g: "Output", d: "Quantity of finished goods produced during a defined period.", u: "units", o: "Production Manager", s: "MES / ERP", lv: 2, i: "lagging", r: ["plant", "production"] },
    { k: "throughput", n: "Throughput", g: "Output", d: "Rate at which a process or plant produces acceptable output.", u: "units/hr", o: "Production Manager", s: "MES", lv: 2, i: "lagging", r: ["plant", "production"], core: 1 },
    { k: "units-per-hour", n: "Units per Hour", g: "Output", d: "Number of units produced per operating hour.", f: "Units produced / Operating hours", u: "units/hr", o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "units-per-labor-hour", n: "Units per Labour Hour", g: "Labour productivity", d: "Production output divided by direct labour hours.", f: "Units produced / Direct labour hours", u: "units/hr", o: "Production Manager", s: "MES / payroll", lv: 3, i: "lagging", r: ["production"] },
    { k: "labor-productivity", n: "Labour Productivity", g: "Labour productivity", d: "Output generated per labour hour or labour dollar.", u: "units/hr", o: "Plant Manager", s: "MES / payroll", lv: 2, i: "lagging", r: ["ceo", "plant", "production"], core: 1 },
    { k: "machine-productivity", n: "Machine Productivity", g: "Asset productivity", d: "Output generated per machine hour.", u: "units/hr", o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "value-added-per-labor-hour", n: "Value-Added per Labour Hour", g: "Labour productivity", d: "Manufacturing value added divided by labour hours.", u: "currency", o: "Plant Controller", s: "Finance / payroll", lv: 2, i: "lagging", r: ["ceo"] },
    { k: "capacity-utilization", n: "Capacity Utilisation", g: "Utilisation", d: "Actual production relative to available production capacity.", f: "Actual output / Available capacity x 100", u: "%", o: "Plant Manager", s: "ERP capacity model", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "line-utilization", n: "Line Utilisation", g: "Utilisation", d: "Percentage of available line capacity actually used.", u: "%", o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "takt-achievement", n: "Takt Achievement", g: "Flow", d: "Percentage of production periods in which actual production meets the required takt rate.", u: "%", fq: "daily", o: "Production Manager", s: "MES / hour-by-hour board", lv: 3, i: "lagging", r: ["production"] },
    { k: "cycle-time", n: "Cycle Time", g: "Flow", d: "Time required to produce one unit at a particular process step.", u: "minutes", dn: 1, o: "Production Manager", s: "MES / time study", lv: 3, i: "lagging", r: ["production"] },
    { k: "lead-time", n: "Lead Time", g: "Flow", d: "Total elapsed time from production or order initiation to completion.", u: "days", dn: 1, o: "Production Manager", s: "ERP / MES", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "throughput-rate", n: "Throughput Rate", g: "Output", d: "Good units produced per unit of time.", u: "units/hr", o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "bottleneck-utilization", n: "Bottleneck Utilisation", g: "Utilisation", d: "Utilisation of the resource that constrains overall production capacity.", u: "%", o: "Production Manager", s: "MES / constraint analysis", lv: 3, i: "lagging", r: ["production"] },
  ],
  maintenance: [
    { k: "pm-compliance", n: "PM Compliance", g: "Maintenance discipline", d: "Percentage of preventive maintenance tasks completed on time.", f: "PM tasks completed on time / PM tasks due x 100", u: "%", o: "Maintenance Manager", s: "CMMS", lv: 5, i: "leading", r: ["plant", "maintenance"], core: 1 },
    { k: "planned-maintenance-pct", n: "Planned Maintenance Percentage", g: "Maintenance discipline", d: "Percentage of maintenance work performed as planned rather than reactively.", u: "%", o: "Maintenance Manager", s: "CMMS", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "reactive-maintenance-pct", n: "Reactive Maintenance Percentage", g: "Maintenance discipline", d: "Percentage of maintenance hours spent responding to equipment failures.", u: "%", dn: 1, o: "Maintenance Manager", s: "CMMS", lv: 4, i: "lagging", r: ["maintenance"] },
    { k: "maintenance-schedule-compliance", n: "Maintenance Schedule Compliance", g: "Maintenance discipline", d: "Percentage of scheduled maintenance work completed according to plan.", u: "%", o: "Maintenance Manager", s: "CMMS", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "maintenance-backlog", n: "Maintenance Backlog", g: "Backlog", d: "Outstanding maintenance work that has not yet been completed.", u: "hours", dn: 1, o: "Maintenance Manager", s: "CMMS", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "critical-maintenance-backlog", n: "Critical Maintenance Backlog", g: "Backlog", d: "Outstanding maintenance work classified as critical based on safety, production, quality or asset risk.", u: "hours", dn: 1, o: "Maintenance Manager", s: "CMMS", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "emergency-work-pct", n: "Emergency Work Percentage", g: "Maintenance discipline", d: "Percentage of maintenance work performed on an emergency basis.", u: "%", dn: 1, o: "Maintenance Manager", s: "CMMS", lv: 4, i: "lagging", r: ["maintenance"] },
    { k: "mtbf", n: "MTBF — Mean Time Between Failures", c: "MTBF", g: "Reliability", d: "Average operating time between equipment failures.", f: "Operating time / Number of failures", u: "hours", o: "Maintenance Manager", s: "CMMS / MES", lv: 3, i: "lagging", r: ["plant", "maintenance"], core: 1 },
    { k: "mttr", n: "MTTR — Mean Time To Repair", c: "MTTR", g: "Reliability", d: "Average time required to restore equipment after failure.", f: "Total repair time / Number of repairs", u: "hours", dn: 1, o: "Maintenance Manager", s: "CMMS", lv: 3, i: "lagging", r: ["plant", "maintenance"], core: 1 },
    { k: "mttf", n: "MTTF — Mean Time To Failure", c: "MTTF", g: "Reliability", d: "Average operating time until failure, commonly used for non-repairable assets.", u: "hours", o: "Maintenance Manager", s: "CMMS", lv: 3, i: "lagging", r: ["maintenance"] },
    { k: "asset-availability", n: "Asset Availability", g: "Reliability", d: "Percentage of required time that equipment is operational and available.", u: "%", o: "Maintenance Manager", s: "CMMS / MES", lv: 3, i: "lagging", r: ["maintenance"] },
    { k: "maintenance-cost-per-asset", n: "Maintenance Cost per Asset", g: "Maintenance cost", d: "Maintenance spending associated with a specific asset.", u: "currency", dn: 1, o: "Maintenance Manager", s: "CMMS / finance", lv: 3, i: "lagging", r: ["maintenance"] },
    { k: "spare-parts-availability", n: "Spare Parts Availability", g: "Maintenance supply", d: "Percentage of required maintenance parts available when needed.", u: "%", o: "Maintenance Manager", s: "CMMS / stores", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "repeat-failure-rate", n: "Repeat Failure Rate", g: "Reliability", d: "Percentage of equipment failures that recur after previous repair.", u: "%", dn: 1, o: "Maintenance Manager", s: "CMMS", lv: 4, i: "lagging", r: ["maintenance"] },
    { k: "predictive-maintenance-yield", n: "Predictive Maintenance Yield", g: "Predictive", d: "Percentage of predictive maintenance alerts that result in an actionable finding.", u: "%", o: "Reliability Engineer", s: "Condition monitoring", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "predictive-alerts", n: "Predictive Maintenance Alerts", g: "Predictive", d: "Number of condition-monitoring alerts raised before failure occurs.", u: "count", o: "Reliability Engineer", s: "Condition monitoring", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "total-downtime", n: "Total Downtime", g: "Downtime", d: "Total time production assets are unavailable.", u: "hours", dn: 1, o: "Production Manager", s: "MES downtime log", lv: 3, i: "lagging", r: ["production", "maintenance"] },
    { k: "unplanned-downtime", n: "Unplanned Downtime", g: "Downtime", d: "Downtime caused by unexpected equipment or process failures.", u: "hours", dn: 1, o: "Maintenance Manager", s: "MES downtime log", lv: 3, i: "lagging", r: ["plant", "production", "maintenance"], core: 1 },
    { k: "planned-downtime", n: "Planned Downtime", g: "Downtime", d: "Scheduled maintenance, changeovers, planned shutdowns and other scheduled production stops.", u: "hours", dn: 1, o: "Production Manager", s: "MES / schedule", lv: 3, i: "lagging", r: ["production"] },
    { k: "downtime-pct", n: "Downtime Percentage", g: "Downtime", d: "Downtime as a percentage of scheduled or planned production time.", u: "%", dn: 1, o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "breakdown-frequency", n: "Breakdown Frequency", g: "Downtime", d: "Number of equipment breakdown events during a defined period.", u: "count", dn: 1, o: "Maintenance Manager", s: "CMMS / MES", lv: 4, i: "lagging", r: ["maintenance"] },
    { k: "changeover-time", n: "Changeover Time", g: "Downtime", d: "Time required to switch a machine, line or process from one product or configuration to another.", u: "minutes", dn: 1, o: "Production Manager", s: "MES / time study", lv: 3, i: "lagging", r: ["production"] },
    { k: "minor-stop-frequency", n: "Minor Stop Frequency", g: "Downtime", d: "Number of short-duration equipment interruptions.", u: "count", dn: 1, o: "Production Manager", s: "MES / PLC", lv: 4, i: "lagging", r: ["production"] },
    { k: "top-downtime-cause", n: "Top Downtime Cause Share", g: "Downtime", d: "Share of lost production time attributable to the largest single downtime cause.", u: "%", dn: 1, o: "Production Manager", s: "MES downtime Pareto", lv: 4, i: "lagging", r: ["production", "maintenance"] },
  ],
  environment: [
    { k: "energy-consumption", n: "Energy Consumption", g: "Energy", d: "Total electricity, natural gas, steam, fuel and other energy consumed.", u: "kWh", dn: 1, o: "Facilities Manager", s: "Utility meters / invoices", lv: 2, i: "lagging", r: ["plant"] },
    { k: "energy-per-unit", n: "Energy per Unit", g: "Energy", d: "Energy consumed per unit of production.", f: "Total energy consumed / Units produced", u: "kWh/unit", dn: 1, o: "Facilities Manager", s: "Meters / MES output", lv: 3, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "electricity-per-unit", n: "Electricity per Unit", g: "Energy", d: "Electricity consumed per unit produced.", u: "kWh/unit", dn: 1, o: "Facilities Manager", s: "Electricity meters", lv: 3, i: "lagging", r: ["plant"] },
    { k: "gas-per-unit", n: "Gas per Unit", g: "Energy", d: "Natural gas or other fuel consumed per unit produced.", u: "kWh/unit", dn: 1, o: "Facilities Manager", s: "Gas meters", lv: 3, i: "lagging", r: ["plant"] },
    { k: "co2e-emissions", n: "CO2e Emissions", g: "Emissions", d: "Greenhouse gas emissions expressed as carbon dioxide equivalent.", u: "tCO2e", dn: 1, o: "EHS Manager", s: "Energy data x emission factors", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "co2e-per-unit", n: "CO2e per Unit", g: "Emissions", d: "Carbon emissions per unit produced.", u: "kgCO2e/unit", dn: 1, o: "EHS Manager", s: "Energy data x emission factors", lv: 3, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "water-consumption", n: "Water Consumption", g: "Water", d: "Total water consumed.", u: "m3", dn: 1, o: "Facilities Manager", s: "Water meters", lv: 2, i: "lagging", r: ["plant"] },
    { k: "water-per-unit", n: "Water per Unit", g: "Water", d: "Water consumption per unit produced.", u: "m3/unit", dn: 1, o: "Facilities Manager", s: "Water meters / MES output", lv: 3, i: "lagging", r: ["plant"] },
    { k: "waste-generated", n: "Waste Generated", g: "Waste", d: "Total manufacturing waste generated.", u: "tonnes", dn: 1, o: "EHS Manager", s: "Waste contractor records", lv: 2, i: "lagging", r: ["plant"] },
    { k: "waste-per-unit", n: "Waste per Unit", g: "Waste", d: "Waste generated per unit produced.", u: "kg/unit", dn: 1, o: "EHS Manager", s: "Waste records / MES output", lv: 3, i: "lagging", r: ["plant"] },
    { k: "recycling-rate", n: "Recycling Rate", g: "Waste", d: "Percentage of waste diverted from disposal through recycling or recovery.", u: "%", o: "EHS Manager", s: "Waste contractor records", lv: 3, i: "lagging", r: ["plant"] },
    { k: "hazardous-waste", n: "Hazardous Waste", g: "Waste", d: "Quantity of hazardous waste generated.", u: "tonnes", dn: 1, o: "EHS Manager", s: "Waste manifests", lv: 3, i: "lagging", r: ["plant"] },
    { k: "renewable-energy-pct", n: "Renewable Energy Percentage", g: "Energy", d: "Percentage of total energy consumption sourced from renewable energy.", u: "%", o: "Facilities Manager", s: "Utility contracts / generation data", lv: 2, i: "lagging", r: ["ceo"] },
    { k: "environmental-incidents", n: "Environmental Incidents", g: "Compliance", d: "Number of reportable environmental incidents or permit exceedances.", u: "count", dn: 1, o: "EHS Manager", s: "EHS register", lv: 2, i: "lagging", r: ["ceo", "plant"] },
  ],
  people: [
    { k: "direct-labor-hours", n: "Direct Labour Hours", g: "Labour", d: "Hours spent directly producing the product.", u: "hours", o: "Production Manager", s: "Payroll / MES labour booking", lv: 3, i: "lagging", r: ["production"] },
    { k: "indirect-labor-hours", n: "Indirect Labour Hours", g: "Labour", d: "Hours spent on support activities rather than direct production.", u: "hours", dn: 1, o: "Plant Manager", s: "Payroll", lv: 3, i: "lagging", r: ["plant"] },
    { k: "labor-hours-per-unit", n: "Labour Hours per Unit", g: "Labour", d: "Direct labour hours required to produce one unit.", f: "Direct labour hours / Units produced", u: "hours/unit", dn: 1, o: "Production Manager", s: "Payroll / MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "standard-hours-earned", n: "Standard Hours Earned", g: "Labour", d: "Standard labour hours associated with completed production.", u: "hours", o: "Production Manager", s: "ERP routings", lv: 3, i: "lagging", r: ["production"] },
    { k: "labor-efficiency", n: "Labour Efficiency", g: "Labour", d: "Standard hours earned divided by actual hours worked.", f: "Standard hours earned / Actual hours worked x 100", u: "%", o: "Production Manager", s: "ERP / payroll", lv: 3, i: "lagging", r: ["production"] },
    { k: "overtime-pct", n: "Overtime Percentage", g: "Labour", d: "Overtime hours as a percentage of total labour hours.", u: "%", dn: 1, o: "Production Manager", s: "Payroll", lv: 4, i: "lagging", r: ["plant", "production"] },
    { k: "absenteeism", n: "Absenteeism", g: "Workforce", d: "Scheduled work hours missed because of employee absence.", u: "%", dn: 1, o: "HR Manager", s: "HRIS / time system", lv: 4, i: "lagging", r: ["plant"], core: 1 },
    { k: "employee-turnover", n: "Employee Turnover", g: "Workforce", d: "Percentage of employees leaving the organisation during a defined period.", u: "%", dn: 1, o: "HR Manager", s: "HRIS", lv: 2, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "training-compliance", n: "Training Compliance", g: "Capability", d: "Percentage of required employee training completed.", u: "%", o: "HR Manager", s: "LMS / training matrix", lv: 5, i: "leading", r: ["plant"], core: 1 },
    { k: "skill-coverage", n: "Skill Coverage", g: "Capability", d: "Percentage of required production skills covered by qualified employees.", u: "%", o: "Production Manager", s: "Skills matrix", lv: 5, i: "leading", r: ["plant", "production"] },
    { k: "cross-training-rate", n: "Cross-Training Rate", g: "Capability", d: "Percentage of employees qualified to perform multiple production roles.", u: "%", o: "Production Manager", s: "Skills matrix", lv: 5, i: "leading", r: ["production"] },
    { k: "labor-utilization", n: "Labour Utilisation", g: "Labour", d: "Productive labour hours relative to available labour hours.", u: "%", o: "Production Manager", s: "MES labour booking", lv: 3, i: "lagging", r: ["production"] },
    { k: "employee-engagement", n: "Employee Engagement", g: "Workforce", d: "Measured level of workforce engagement from survey results.", u: "score", fq: "quarterly", o: "HR Manager", s: "Engagement survey", lv: 1, i: "leading", r: ["ceo"] },
    { k: "open-positions", n: "Open Positions / Vacancy Rate", g: "Workforce", d: "Percentage of budgeted production roles currently unfilled.", u: "%", dn: 1, o: "HR Manager", s: "HRIS", lv: 4, i: "leading", r: ["plant"] },
    { k: "suggestions-per-employee", n: "Improvement Suggestions per Employee", g: "Capability", d: "Number of improvement ideas submitted per employee in the period.", u: "count", o: "CI Manager", s: "Improvement system", lv: 5, i: "leading", r: ["plant"] },
  ],
  inventory: [
    { k: "inventory-value", n: "Inventory Value", g: "Inventory levels", d: "Financial value of raw materials, WIP and finished goods.", u: "currency", dn: 1, o: "Supply Chain Manager", s: "ERP", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "raw-material-inventory", n: "Raw Material Inventory", g: "Inventory levels", d: "Inventory of materials and components awaiting production.", u: "currency", dn: 1, o: "Supply Chain Manager", s: "ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "wip", n: "WIP — Work in Process", c: "WIP", g: "Inventory levels", d: "Inventory currently undergoing manufacturing transformation.", u: "currency", dn: 1, o: "Production Manager", s: "ERP / MES", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "finished-goods-inventory", n: "Finished Goods Inventory", g: "Inventory levels", d: "Completed products awaiting shipment or customer consumption.", u: "currency", dn: 1, o: "Supply Chain Manager", s: "ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "inventory-turns", n: "Inventory Turns", g: "Inventory efficiency", d: "Cost of goods sold divided by average inventory.", f: "COGS / Average inventory", u: "turns", o: "Supply Chain Manager", s: "Finance / ERP", lv: 2, i: "lagging", r: ["ceo", "plant"], core: 1 },
    { k: "dio", n: "Days Inventory Outstanding", c: "DIO", g: "Inventory efficiency", d: "Approximate number of days of inventory held.", f: "Average inventory / COGS x 365", u: "days", dn: 1, o: "Supply Chain Manager", s: "Finance / ERP", lv: 2, i: "lagging", r: ["ceo"] },
    { k: "wip-days", n: "WIP Days", g: "Inventory efficiency", d: "Number of production days represented by current WIP inventory.", u: "days", dn: 1, o: "Production Manager", s: "ERP / MES", lv: 3, i: "lagging", r: ["plant", "production"], core: 1 },
    { k: "finished-goods-days", n: "Finished Goods Days", g: "Inventory efficiency", d: "Number of days of customer demand represented by finished goods inventory.", u: "days", dn: 1, o: "Supply Chain Manager", s: "ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "inventory-accuracy", n: "Inventory Accuracy", g: "Inventory control", d: "Accuracy of system-recorded inventory compared with physical inventory.", u: "%", o: "Supply Chain Manager", s: "Cycle count results", lv: 5, i: "leading", r: ["plant"] },
    { k: "obsolete-inventory-pct", n: "Obsolete Inventory Percentage", g: "Inventory control", d: "Percentage of inventory considered obsolete or unlikely to be consumed.", u: "%", dn: 1, o: "Supply Chain Manager", s: "ERP ageing report", lv: 3, i: "lagging", r: ["plant"] },
    { k: "slow-moving-inventory", n: "Slow-Moving Inventory", g: "Inventory control", d: "Inventory below a defined consumption or turnover threshold.", u: "currency", dn: 1, o: "Supply Chain Manager", s: "ERP ageing report", lv: 3, i: "lagging", r: ["plant"] },
    { k: "stockout-rate", n: "Stockout Rate", g: "Availability", d: "Frequency with which required materials are unavailable.", u: "%", dn: 1, o: "Supply Chain Manager", s: "ERP shortage report", lv: 4, i: "lagging", r: ["plant", "production"] },
    { k: "material-availability", n: "Material Availability", g: "Availability", d: "Percentage of production requirements for which required materials are available when needed.", u: "%", o: "Supply Chain Manager", s: "ERP kitting / shortage report", lv: 5, i: "leading", r: ["plant", "production"] },
  ],
  "supply-chain": [
    { k: "supplier-otif", n: "Supplier OTIF", g: "Supplier delivery", d: "Percentage of supplier deliveries received on time and in full.", u: "%", o: "Procurement Manager", s: "ERP goods receipts", lv: 3, i: "lagging", r: ["plant"], core: 1 },
    { k: "supplier-lead-time", n: "Supplier Lead Time", g: "Supplier delivery", d: "Time between purchase order placement and material receipt.", u: "days", dn: 1, o: "Procurement Manager", s: "ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "supplier-ppm", n: "Supplier Quality PPM", g: "Supplier quality", d: "Number of defective supplier parts per million received.", u: "ppm", dn: 1, o: "Supplier Quality Engineer", s: "Incoming inspection", lv: 3, i: "lagging", r: ["quality"], core: 1 },
    { k: "supplier-defect-rate", n: "Supplier Defect Rate", g: "Supplier quality", d: "Percentage of incoming supplier material that fails specifications.", u: "%", dn: 1, o: "Supplier Quality Engineer", s: "Incoming inspection", lv: 3, i: "lagging", r: ["quality"] },
    { k: "supplier-otd", n: "Supplier On-Time Delivery", g: "Supplier delivery", d: "Percentage of supplier deliveries received by the required date.", u: "%", o: "Procurement Manager", s: "ERP goods receipts", lv: 3, i: "lagging", r: ["plant"] },
    { k: "ppv", n: "PPV — Purchase Price Variance", c: "PPV", g: "Supplier cost", d: "Difference between actual purchase price and standard or budgeted purchase price.", u: "currency", dn: 1, o: "Procurement Manager", s: "ERP / finance", lv: 3, i: "lagging", r: ["plant"] },
    { k: "sc-material-availability", n: "Material Availability (Supply)", g: "Supply risk", d: "Ability to provide required material when production needs it.", u: "%", o: "Procurement Manager", s: "ERP shortage report", lv: 5, i: "leading", r: ["plant"] },
    { k: "single-source-exposure", n: "Single-Source Exposure", g: "Supply risk", d: "Percentage of critical materials or spend dependent on a single supplier.", u: "%", dn: 1, fq: "quarterly", o: "Procurement Manager", s: "Spend analysis", lv: 5, i: "leading", r: ["ceo", "plant"] },
    { k: "supplier-capacity-risk", n: "Supplier Capacity Risk", g: "Supply risk", d: "Risk that a supplier will be unable to meet future demand requirements.", u: "score", dn: 1, fq: "quarterly", o: "Procurement Manager", s: "Supplier capacity review", lv: 5, i: "leading", r: ["plant"] },
    { k: "inbound-freight-cost", n: "Inbound Freight Cost", g: "Supplier cost", d: "Transportation cost associated with incoming materials.", u: "currency", dn: 1, o: "Logistics Manager", s: "Freight invoices", lv: 3, i: "lagging", r: ["plant"] },
    { k: "supplier-scorecard", n: "Supplier Scorecard Score", g: "Supplier management", d: "Composite supplier performance score across quality, delivery, cost and responsiveness.", u: "score", fq: "quarterly", o: "Procurement Manager", s: "Supplier scorecards", lv: 3, i: "lagging", r: ["plant"] },
  ],
  planning: [
    { k: "production-plan-attainment", n: "Production Plan Attainment", g: "Plan execution", d: "Actual production compared with planned production.", f: "Actual production / Planned production x 100", u: "%", o: "Planning Manager", s: "ERP / MES", lv: 2, i: "lagging", r: ["plant", "production"] },
    { k: "planning-schedule-adherence", n: "Schedule Adherence (Planning)", g: "Plan execution", d: "Percentage of production performed according to the planned production schedule.", u: "%", o: "Planning Manager", s: "ERP / MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "schedule-stability", n: "Schedule Stability", g: "Plan quality", d: "Degree to which the production schedule remains unchanged after being released.", u: "%", o: "Planning Manager", s: "ERP schedule versions", lv: 5, i: "leading", r: ["plant", "production"] },
    { k: "schedule-changes", n: "Schedule Changes", g: "Plan quality", d: "Number or frequency of changes made to the production schedule.", u: "count", dn: 1, o: "Planning Manager", s: "ERP schedule versions", lv: 4, i: "lagging", r: ["production"] },
    { k: "forecast-accuracy", n: "Forecast Accuracy", g: "Demand", d: "Accuracy of demand forecasts compared with actual demand.", f: "100 - MAPE", u: "%", o: "Demand Planner", s: "Forecast vs actual", lv: 5, i: "leading", r: ["ceo", "plant"] },
    { k: "forecast-bias", n: "Forecast Bias", g: "Demand", d: "Systematic tendency of forecasts to overestimate or underestimate demand.", u: "%", o: "Demand Planner", s: "Forecast vs actual", lv: 5, i: "leading", r: ["plant"] },
    { k: "capacity-plan-accuracy", n: "Capacity Plan Accuracy", g: "Capacity", d: "Accuracy of planned capacity requirements compared with actual requirements.", u: "%", o: "Planning Manager", s: "Capacity plan vs actual", lv: 5, i: "leading", r: ["plant"] },
    { k: "planning-cycle-time", n: "Planning Cycle Time", g: "Plan quality", d: "Time required to create or revise production plans.", u: "days", dn: 1, o: "Planning Manager", s: "Planning process log", lv: 4, i: "lagging", r: ["plant"] },
    { k: "frozen-schedule-compliance", n: "Frozen Schedule Compliance", g: "Plan quality", d: "Percentage of frozen production schedules executed without changes.", u: "%", o: "Planning Manager", s: "ERP schedule versions", lv: 5, i: "leading", r: ["production"] },
  ],
  engineering: [
    { k: "npi-on-time-launch", n: "NPI On-Time Launch", g: "Launch", d: "Percentage of new products launched according to the approved schedule.", u: "%", fq: "quarterly", o: "NPI Manager", s: "Project gate reviews", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "time-to-market", n: "Time to Market", g: "Launch", d: "Time from product development initiation to commercial availability.", u: "months", dn: 1, fq: "quarterly", o: "Engineering Manager", s: "Project records", lv: 2, i: "lagging", r: ["ceo"] },
    { k: "time-to-production", n: "Time to Production", g: "Launch", d: "Time required to transition a product from design into stable production.", u: "months", dn: 1, fq: "quarterly", o: "NPI Manager", s: "Project records", lv: 3, i: "lagging", r: ["plant"] },
    { k: "eco-cycle-time", n: "Engineering Change Cycle Time", g: "Engineering change", d: "Time required to process and implement an engineering change.", u: "days", dn: 1, o: "Engineering Manager", s: "PLM / ECO system", lv: 3, i: "lagging", r: ["quality"] },
    { k: "eco-rate", n: "Engineering Change Rate", g: "Engineering change", d: "Number of engineering changes during a defined period.", u: "count", dn: 1, o: "Engineering Manager", s: "PLM / ECO system", lv: 4, i: "lagging", r: ["quality"] },
    { k: "first-time-right-design", n: "First-Time-Right Design", g: "Design maturity", d: "Percentage of designs entering production without significant redesign or correction.", u: "%", fq: "quarterly", o: "Engineering Manager", s: "PLM / NPI reviews", lv: 5, i: "leading", r: ["quality"] },
    { k: "production-ramp-rate", n: "Production Ramp Rate", g: "Launch", d: "Speed at which production reaches target volume following launch.", u: "%", o: "NPI Manager", s: "MES ramp data", lv: 3, i: "lagging", r: ["production"] },
    { k: "npi-yield", n: "NPI Yield", g: "Launch quality", d: "Production yield achieved during new product introduction.", u: "%", o: "NPI Manager", s: "MES", lv: 3, i: "lagging", r: ["quality", "production"] },
    { k: "launch-defect-rate", n: "Launch Defect Rate", g: "Launch quality", d: "Defect rate during the early production phase.", u: "%", dn: 1, o: "Quality Manager", s: "MES / inspection", lv: 3, i: "lagging", r: ["quality"] },
    { k: "design-to-cost", n: "Design-to-Cost Achievement", g: "Design maturity", d: "Degree to which product cost targets are achieved during product design.", u: "%", fq: "quarterly", o: "Engineering Manager", s: "Cost models vs target", lv: 3, i: "lagging", r: ["ceo"] },
    { k: "gate-review-on-time", n: "Gate Review On-Time Completion", g: "Launch", d: "Percentage of NPI gate reviews completed on the planned date with all deliverables closed.", u: "%", o: "NPI Manager", s: "Gate checklists", lv: 5, i: "leading", r: ["plant"] },
  ],
  digital: [
    { k: "machine-connectivity", n: "Machine Connectivity Percentage", g: "Connectivity", d: "Percentage of relevant production assets connected to manufacturing data systems.", u: "%", fq: "quarterly", o: "Digital Manufacturing Lead", s: "Asset register / IIoT platform", lv: 5, i: "leading", r: ["plant"] },
    { k: "data-availability", n: "Data Availability", g: "Data quality", d: "Percentage of required manufacturing data available for analysis and decision-making.", u: "%", o: "Digital Manufacturing Lead", s: "Data platform monitoring", lv: 5, i: "leading", r: ["plant"] },
    { k: "mes-adoption", n: "MES Adoption", g: "Systems", d: "Degree to which production activities are digitally captured through a Manufacturing Execution System.", u: "%", fq: "quarterly", o: "Digital Manufacturing Lead", s: "MES transaction coverage", lv: 5, i: "leading", r: ["plant"] },
    { k: "automated-inspection-pct", n: "Automated Inspection Percentage", g: "Automation", d: "Percentage of applicable inspections performed automatically.", u: "%", fq: "quarterly", o: "Quality Manager", s: "Inspection plan", lv: 5, i: "leading", r: ["quality"] },
    { k: "predictive-maintenance-coverage", n: "Predictive Maintenance Coverage", g: "Automation", d: "Percentage of critical assets covered by predictive monitoring.", u: "%", fq: "quarterly", o: "Reliability Engineer", s: "Asset register / condition monitoring", lv: 5, i: "leading", r: ["maintenance"] },
    { k: "digital-work-instruction-usage", n: "Digital Work Instruction Usage", g: "Systems", d: "Percentage of applicable production operations using digital work instructions.", u: "%", fq: "quarterly", o: "Manufacturing Engineer", s: "MES / work instruction system", lv: 5, i: "leading", r: ["production"] },
    { k: "system-downtime", n: "System Downtime", g: "Systems", d: "Time that manufacturing IT or OT systems are unavailable.", u: "hours", dn: 1, o: "IT Manager", s: "System monitoring", lv: 4, i: "lagging", r: ["plant"] },
    { k: "data-accuracy", n: "Data Accuracy", g: "Data quality", d: "Accuracy of digitally captured production information.", u: "%", o: "Digital Manufacturing Lead", s: "Data audits", lv: 5, i: "leading", r: ["plant"] },
    { k: "automation-utilization", n: "Automation Utilisation", g: "Automation", d: "Percentage of available automated production capacity actually used.", u: "%", o: "Production Manager", s: "MES / PLC", lv: 3, i: "lagging", r: ["production"] },
    { k: "touchless-transaction-rate", n: "Touchless Transaction Rate", g: "Automation", d: "Percentage of manufacturing transactions completed without manual data entry.", u: "%", o: "Digital Manufacturing Lead", s: "ERP / MES transaction logs", lv: 5, i: "leading", r: ["plant"] },
  ],
  lean: [
    { k: "lean-lead-time", n: "Lead Time (Value Stream)", g: "Flow", d: "Total elapsed time from order or process start to completion across the value stream.", u: "days", dn: 1, o: "CI Manager", s: "Value stream map / ERP", lv: 3, i: "lagging", r: ["plant"] },
    { k: "process-cycle-efficiency", n: "Process Cycle Efficiency", g: "Flow", d: "Value-added processing time divided by total lead time.", f: "Value-added time / Total lead time x 100", u: "%", o: "CI Manager", s: "Value stream map", lv: 3, i: "lagging", r: ["plant", "production"] },
    { k: "lean-wip", n: "WIP Between Steps", g: "Flow", d: "Work-in-process inventory sitting between production steps.", u: "units", dn: 1, o: "Production Manager", s: "Shop floor count / MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "queue-time", n: "Queue Time", g: "Flow", d: "Time material waits before being processed.", u: "hours", dn: 1, o: "Production Manager", s: "MES timestamps", lv: 4, i: "lagging", r: ["production"] },
    { k: "value-added-time", n: "Value-Added Time", g: "Flow", d: "Time during which the product is physically transformed in a way that creates customer value.", u: "minutes", o: "CI Manager", s: "Time study / VSM", lv: 3, i: "lagging", r: ["production"] },
    { k: "non-value-added-time", n: "Non-Value-Added Time", g: "Flow", d: "Time spent waiting, transporting, storing, inspecting or performing other activities that do not directly transform the product.", u: "minutes", dn: 1, o: "CI Manager", s: "Time study / VSM", lv: 3, i: "lagging", r: ["production"] },
    { k: "kaizen-implementation-rate", n: "Kaizen Implementation Rate", g: "Improvement", d: "Percentage of approved improvement actions successfully implemented.", u: "%", o: "CI Manager", s: "Improvement tracker", lv: 5, i: "leading", r: ["plant"] },
    { k: "five-s-score", n: "5S Audit Score", g: "Workplace discipline", d: "Score measuring workplace organisation, cleanliness, standardisation and discipline.", u: "score", o: "Production Manager", s: "5S audits", lv: 5, i: "leading", r: ["production"] },
    { k: "standard-work-compliance", n: "Standard Work Compliance", g: "Workplace discipline", d: "Percentage of observed processes that follow defined standard work.", u: "%", o: "Production Manager", s: "Layered process audits", lv: 5, i: "leading", r: ["plant", "production"] },
    { k: "smed-changeover", n: "SMED / Changeover Time", g: "Flow", d: "Time required to change from one product or setup to another.", u: "minutes", dn: 1, o: "Production Manager", s: "MES / time study", lv: 3, i: "lagging", r: ["production"] },
    { k: "kanban-adherence", n: "Kanban Adherence", g: "Pull system", d: "Degree to which production and replenishment follow defined pull-system rules.", u: "%", o: "Production Manager", s: "Kanban audits", lv: 5, i: "leading", r: ["production"] },
    { k: "andon-response-time", n: "Andon Response Time", g: "Response", d: "Time required to respond to a production abnormality.", u: "minutes", dn: 1, fq: "daily", o: "Production Manager", s: "Andon system", lv: 5, i: "leading", r: ["production"] },
    { k: "material-yield", n: "Material Yield", g: "Material efficiency", d: "Good output divided by material input.", f: "Good output / Material input x 100", u: "%", o: "Production Manager", s: "ERP / MES", lv: 3, i: "lagging", r: ["production"] },
    { k: "material-usage-variance", n: "Material Usage Variance", g: "Material efficiency", d: "Difference between standard material consumption and actual material consumption.", u: "currency", dn: 1, o: "Plant Controller", s: "ERP / finance", lv: 3, i: "lagging", r: ["plant"] },
    { k: "scrap-percentage-material", n: "Scrap Percentage (Material)", g: "Material efficiency", d: "Quantity of material or product scrapped relative to input or production.", u: "%", dn: 1, o: "Production Manager", s: "ERP scrap transactions", lv: 3, i: "lagging", r: ["production"] },
    { k: "trim-loss", n: "Trim Loss", g: "Material efficiency", d: "Material lost during cutting, trimming or sizing operations.", u: "%", dn: 1, o: "Production Manager", s: "MES / nesting reports", lv: 4, i: "lagging", r: ["production"] },
    { k: "process-yield", n: "Process Yield", g: "Material efficiency", d: "Good output relative to process input.", u: "%", o: "Production Manager", s: "MES", lv: 3, i: "lagging", r: ["production", "quality"] },
    { k: "recovery-rate", n: "Recovery Rate", g: "Material efficiency", d: "Percentage of material successfully recovered or reused.", u: "%", o: "Production Manager", s: "MES / waste records", lv: 4, i: "lagging", r: ["production"] },
    { k: "material-consumption-per-unit", n: "Material Consumption per Unit", g: "Material efficiency", d: "Quantity of raw material consumed per finished unit.", u: "kg/unit", dn: 1, o: "Production Manager", s: "ERP material issues", lv: 3, i: "lagging", r: ["production"] },
    { k: "material-efficiency", n: "Material Efficiency", g: "Material efficiency", d: "Useful output divided by total material input.", u: "%", o: "Production Manager", s: "ERP / MES", lv: 3, i: "lagging", r: ["plant"] },
  ],
  financial: [
    { k: "revenue", n: "Revenue", g: "Results", d: "Sales generated by the operation.", u: "currency", o: "CFO", s: "Finance / ERP", lv: 1, i: "lagging", r: ["ceo"], core: 1 },
    { k: "gross-margin", n: "Gross Margin", g: "Results", d: "Revenue minus cost of goods sold, expressed as a financial amount or percentage.", f: "(Revenue - COGS) / Revenue x 100", u: "%", o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"], core: 1 },
    { k: "ebitda", n: "EBITDA", c: "EBITDA", g: "Results", d: "Earnings before interest, taxes, depreciation and amortisation.", u: "currency", o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"], core: 1 },
    { k: "ebitda-margin", n: "EBITDA Margin", g: "Results", d: "EBITDA divided by revenue.", f: "EBITDA / Revenue x 100", u: "%", o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "manufacturing-cost", n: "Manufacturing Cost", g: "Cost", d: "Total cost attributable to manufacturing operations.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance", lv: 2, i: "lagging", r: ["ceo", "plant"] },
    { k: "cost-variance", n: "Cost Variance", g: "Cost", d: "Difference between actual and budgeted or standard cost.", u: "currency", dn: 1, o: "Plant Controller", s: "Finance", lv: 2, i: "lagging", r: ["plant"] },
    { k: "capex", n: "CapEx", c: "CapEx", g: "Capital", d: "Capital expenditure on equipment, machinery, facilities and other long-term assets.", u: "currency", fq: "quarterly", o: "CFO", s: "Finance / project register", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "roic", n: "ROIC — Return on Invested Capital", c: "ROIC", g: "Capital", d: "Return generated from the capital invested in the business.", u: "%", fq: "quarterly", o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "roa", n: "ROA — Return on Assets", c: "ROA", g: "Capital", d: "Profitability generated from the assets employed by the company.", u: "%", fq: "quarterly", o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "eva", n: "Economic Value Added", c: "EVA", g: "Capital", d: "Economic profit after accounting for the cost of invested capital.", u: "currency", fq: "quarterly", o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "cash-conversion-cycle", n: "Cash Conversion Cycle", c: "CCC", g: "Cash", d: "Time between cash being paid for inputs and cash being collected from customers.", f: "DIO + DSO - DPO", u: "days", dn: 1, o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"], core: 1 },
    { k: "working-capital", n: "Working Capital", g: "Cash", d: "Capital tied up in inventory, receivables and payables to run the operation.", u: "currency", dn: 1, o: "CFO", s: "Finance", lv: 1, i: "lagging", r: ["ceo"] },
    { k: "customer-satisfaction", n: "Customer Satisfaction", g: "Results", d: "Measured customer satisfaction, typically via survey score or NPS.", u: "score", fq: "quarterly", o: "Commercial Director", s: "Customer survey", lv: 1, i: "lagging", r: ["ceo"] },
  ],
};

function expand(category: KpiCategoryKey, raws: Raw[]): KpiLibraryEntry[] {
  return raws.map((r) => ({
    key: r.k,
    name: r.n,
    code: r.c ?? null,
    category,
    group: r.g,
    definition: r.d,
    formula: r.f ?? null,
    unit: r.u,
    higherIsBetter: r.dn !== 1,
    frequency: r.fq ?? "monthly",
    owner: r.o,
    dataSource: r.s,
    level: r.lv,
    indicator: r.i,
    roles: r.r ?? [],
    core: r.core === 1,
  }));
}

export const KPI_LIBRARY: KpiLibraryEntry[] = (
  Object.keys(RAW) as KpiCategoryKey[]
).flatMap((cat) => expand(cat, RAW[cat]));

export const KPI_LIBRARY_BY_KEY = new Map(KPI_LIBRARY.map((e) => [e.key, e]));

export function categoryLabel(key: string | null | undefined): string {
  return KPI_CATEGORIES.find((c) => c.key === key)?.name ?? "Uncategorised";
}

export function levelLabel(level: number | null | undefined): string {
  return KPI_LEVELS.find((l) => l.level === level)?.name ?? "Unlevelled";
}

export function roleLabel(role: KpiRole): string {
  return KPI_ROLES.find((r) => r.key === role)?.name ?? role;
}
