// Bid & Contract Review — process content.
// Stable ids — do NOT rename; gate checklist progress and framework progress are keyed on them.

import type { Pillar } from "./compliance-part145";

export type GateCheckItem = { id: string; label: string; hint?: string };
export type GateSection = { id: string; title: string; items: GateCheckItem[] };
export type GateDef = {
  n: number;
  key: string;
  short: string;
  title: string;
  purpose: string;
  sections: GateSection[];
};

export const GATE_DECISIONS: Record<number, { value: string; label: string }[]> = {
  1: [
    { value: "go", label: "GO" },
    { value: "go_with_conditions", label: "GO with conditions" },
    { value: "no_go", label: "NO-GO" },
  ],
  2: [
    { value: "approved", label: "Approved" },
    { value: "approved_with_conditions", label: "Approved with conditions" },
    { value: "rejected", label: "Not approved" },
  ],
  3: [
    { value: "approved", label: "Approved" },
    { value: "approved_with_conditions", label: "Approved with conditions" },
    { value: "rejected", label: "Not approved" },
  ],
  4: [
    { value: "completed", label: "Handoff completed" },
    { value: "partial", label: "Partially transferred" },
  ],
  5: [
    { value: "current", label: "Up to date" },
    { value: "action_required", label: "Action required" },
  ],
};

export const GATES: GateDef[] = [
  {
    n: 1,
    key: "g1",
    short: "Bid / No-bid",
    title: "Gate 1 — Opportunity / bid-no-bid review",
    purpose: "Decide whether the company wants to pursue the opportunity at all.",
    sections: [
      {
        id: "g1-commercial",
        title: "Commercial",
        items: [
          { id: "g1-c1", label: "Strategic fit assessed" },
          { id: "g1-c2", label: "Customer attractiveness assessed" },
          { id: "g1-c3", label: "Expected revenue and profitability estimated" },
          { id: "g1-c4", label: "Competitive position understood" },
          { id: "g1-c5", label: "Payment and commercial risks identified" },
        ],
      },
      {
        id: "g1-technical",
        title: "Technical",
        items: [
          { id: "g1-t1", label: "Product feasibility assessed" },
          { id: "g1-t2", label: "Existing vs new technology identified" },
          { id: "g1-t3", label: "Engineering capability confirmed" },
          { id: "g1-t4", label: "Special technical requirements identified" },
        ],
      },
      {
        id: "g1-operations",
        title: "Operations",
        items: [
          { id: "g1-o1", label: "Manufacturing feasibility assessed" },
          { id: "g1-o2", label: "Available capacity checked" },
          { id: "g1-o3", label: "Equipment and tooling requirements identified" },
          { id: "g1-o4", label: "Facility requirements identified" },
          { id: "g1-o5", label: "Production ramp requirements understood" },
        ],
      },
      {
        id: "g1-quality",
        title: "Quality",
        items: [
          { id: "g1-q1", label: "Customer quality expectations identified" },
          { id: "g1-q2", label: "Special processes identified" },
          { id: "g1-q3", label: "Inspection and testing requirements identified" },
          { id: "g1-q4", label: "Certification requirements identified" },
          { id: "g1-q5", label: "Customer-specific quality requirements identified" },
        ],
      },
      {
        id: "g1-supply",
        title: "Supply chain",
        items: [
          { id: "g1-s1", label: "Material availability assessed" },
          { id: "g1-s2", label: "Supplier capability assessed" },
          { id: "g1-s3", label: "Lead times understood" },
          { id: "g1-s4", label: "Single-source risks identified" },
          { id: "g1-s5", label: "Commodity exposure identified" },
        ],
      },
      {
        id: "g1-legal",
        title: "Legal / contracts",
        items: [
          { id: "g1-l1", label: "Known contractual requirements reviewed" },
          { id: "g1-l2", label: "Liability concerns identified" },
          { id: "g1-l3", label: "Warranty exposure identified" },
          { id: "g1-l4", label: "IP requirements identified" },
          { id: "g1-l5", label: "Unusual customer terms flagged" },
        ],
      },
      {
        id: "g1-finance",
        title: "Finance",
        items: [
          { id: "g1-f1", label: "Preliminary cost and margin expectation set" },
          { id: "g1-f2", label: "Capital requirements identified" },
          { id: "g1-f3", label: "Cash-flow considerations reviewed" },
          { id: "g1-f4", label: "Currency and financial exposure reviewed" },
        ],
      },
    ],
  },
  {
    n: 2,
    key: "g2",
    short: "Bid approval",
    title: "Gate 2 — Bid approval",
    purpose: "Confirm the technical solution, cost, price, schedule, capacity and risk before the quotation goes out.",
    sections: [
      {
        id: "g2-a",
        title: "A. Requirements",
        items: [
          { id: "g2-a1", label: "All applicable customer requirements identified" },
          { id: "g2-a2", label: "Requirements technically understood" },
          { id: "g2-a3", label: "Conflicting or ambiguous requirements identified" },
          { id: "g2-a4", label: "Customer clarifications requested where necessary" },
        ],
      },
      {
        id: "g2-b",
        title: "B. Technical",
        items: [
          { id: "g2-b1", label: "Proposed product meets customer requirements" },
          { id: "g2-b2", label: "Engineering assumptions documented" },
          { id: "g2-b3", label: "Validation and testing requirements understood" },
          { id: "g2-b4", label: "Design responsibility clearly defined" },
        ],
      },
      {
        id: "g2-c",
        title: "C. Manufacturing",
        items: [
          { id: "g2-c1", label: "Process capability evaluated" },
          { id: "g2-c2", label: "Capacity available or planned" },
          { id: "g2-c3", label: "Tooling and equipment requirements identified" },
          { id: "g2-c4", label: "Manufacturing assumptions documented" },
        ],
      },
      {
        id: "g2-d",
        title: "D. Quality",
        items: [
          { id: "g2-d1", label: "Quality standards identified" },
          { id: "g2-d2", label: "Inspection and testing requirements understood" },
          { id: "g2-d3", label: "PPAP / APQP or equivalent requirements identified" },
          { id: "g2-d4", label: "Warranty and quality obligations understood" },
        ],
      },
      {
        id: "g2-e",
        title: "E. Supply chain",
        items: [
          { id: "g2-e1", label: "Key suppliers identified" },
          { id: "g2-e2", label: "Material availability evaluated" },
          { id: "g2-e3", label: "Long-lead materials identified" },
          { id: "g2-e4", label: "Supplier risks documented" },
        ],
      },
      {
        id: "g2-f",
        title: "F. Commercial / finance",
        items: [
          { id: "g2-f1", label: "Cost model complete" },
          { id: "g2-f2", label: "Pricing approved" },
          { id: "g2-f3", label: "Margin meets company requirements" },
          { id: "g2-f4", label: "Capital and tooling costs included" },
          { id: "g2-f5", label: "Payment terms understood" },
          { id: "g2-f6", label: "Escalation assumptions documented" },
          { id: "g2-f7", label: "Currency and other financial exposures evaluated" },
        ],
      },
      {
        id: "g2-g",
        title: "G. Schedule",
        items: [
          { id: "g2-g1", label: "Customer timing requirements achievable" },
          { id: "g2-g2", label: "Tooling and development timing achievable" },
          { id: "g2-g3", label: "Production ramp requirements achievable" },
          { id: "g2-g4", label: "Key customer milestones understood" },
        ],
      },
      {
        id: "g2-h",
        title: "H. Risks",
        items: [
          { id: "g2-h1", label: "Material risks documented" },
          { id: "g2-h2", label: "Risk mitigation plans have owners" },
          { id: "g2-h3", label: "Required management approvals obtained" },
        ],
      },
    ],
  },
  {
    n: 3,
    key: "g3",
    short: "Contract review",
    title: "Gate 3 — Contract review and approval",
    purpose: "Confirm every material contractual obligation is understood and approved before signature.",
    sections: [
      {
        id: "g3-scope",
        title: "Scope",
        items: [
          { id: "g3-sc1", label: "Products and services included are defined" },
          { id: "g3-sc2", label: "Specifications and referenced documents listed" },
          { id: "g3-sc3", label: "Customer responsibilities defined" },
          { id: "g3-sc4", label: "Supplier responsibilities defined" },
        ],
      },
      {
        id: "g3-price",
        title: "Price / commercial",
        items: [
          { id: "g3-p1", label: "Fixed or variable pricing understood" },
          { id: "g3-p2", label: "Price adjustment mechanisms reviewed" },
          { id: "g3-p3", label: "Minimum volumes reviewed" },
          { id: "g3-p4", label: "Forecast vs firm commitments understood" },
          { id: "g3-p5", label: "Payment terms reviewed" },
          { id: "g3-p6", label: "Taxes, duties and freight reviewed" },
        ],
      },
      {
        id: "g3-delivery",
        title: "Delivery",
        items: [
          { id: "g3-d1", label: "Delivery obligations understood" },
          { id: "g3-d2", label: "Lead times achievable" },
          { id: "g3-d3", label: "Customer schedules reviewed" },
          { id: "g3-d4", label: "Expediting obligations understood" },
          { id: "g3-d5", label: "Delivery penalties / liquidated damages reviewed" },
        ],
      },
      {
        id: "g3-quality",
        title: "Quality / warranty",
        items: [
          { id: "g3-q1", label: "Product acceptance criteria defined" },
          { id: "g3-q2", label: "Warranty duration reviewed" },
          { id: "g3-q3", label: "Warranty remedies reviewed" },
          { id: "g3-q4", label: "Inspection requirements reviewed" },
          { id: "g3-q5", label: "Audit rights reviewed" },
          { id: "g3-q6", label: "Recall / field-failure obligations reviewed" },
        ],
      },
      {
        id: "g3-liability",
        title: "Liability",
        items: [
          { id: "g3-l1", label: "Liability limits reviewed" },
          { id: "g3-l2", label: "Indemnification reviewed" },
          { id: "g3-l3", label: "Consequential damages position agreed" },
          { id: "g3-l4", label: "Product liability reviewed" },
          { id: "g3-l5", label: "Insurance requirements can be met" },
        ],
      },
      {
        id: "g3-ip",
        title: "Intellectual property",
        items: [
          { id: "g3-i1", label: "Background IP protected" },
          { id: "g3-i2", label: "Customer-owned IP identified" },
          { id: "g3-i3", label: "New / foreground IP ownership agreed" },
          { id: "g3-i4", label: "Design ownership defined" },
          { id: "g3-i5", label: "Manufacturing know-how protected" },
          { id: "g3-i6", label: "Software and data rights reviewed" },
        ],
      },
      {
        id: "g3-termination",
        title: "Termination",
        items: [
          { id: "g3-t1", label: "Termination for convenience reviewed" },
          { id: "g3-t2", label: "Termination for cause reviewed" },
          { id: "g3-t3", label: "Recovery of tooling and inventory addressed" },
          { id: "g3-t4", label: "Recovery of committed materials addressed" },
          { id: "g3-t5", label: "Post-termination obligations understood" },
        ],
      },
      {
        id: "g3-changes",
        title: "Changes",
        items: [
          { id: "g3-ch1", label: "Engineering change process defined" },
          { id: "g3-ch2", label: "Customer change process defined" },
          { id: "g3-ch3", label: "Regulatory change handling defined" },
          { id: "g3-ch4", label: "Material change handling defined" },
          { id: "g3-ch5", label: "Price adjustment mechanism for changes defined" },
          { id: "g3-ch6", label: "Approval requirements defined" },
        ],
      },
      {
        id: "g3-compliance",
        title: "Compliance",
        items: [
          { id: "g3-cp1", label: "Regulatory requirements identified" },
          { id: "g3-cp2", label: "Export controls reviewed" },
          { id: "g3-cp3", label: "Environmental requirements reviewed" },
          { id: "g3-cp4", label: "Cybersecurity requirements reviewed" },
          { id: "g3-cp5", label: "Data requirements reviewed" },
          { id: "g3-cp6", label: "Applicable industry standards identified" },
        ],
      },
      {
        id: "g3-approval",
        title: "Approval preconditions — all must be true",
        items: [
          { id: "g3-ap1", label: "Requirements reviewed" },
          { id: "g3-ap2", label: "Technical feasibility confirmed" },
          { id: "g3-ap3", label: "Manufacturing feasibility confirmed" },
          { id: "g3-ap4", label: "Quality requirements reviewed" },
          { id: "g3-ap5", label: "Supply-chain requirements reviewed" },
          { id: "g3-ap6", label: "Financial impact approved" },
          { id: "g3-ap7", label: "Contract exceptions resolved or formally accepted" },
          { id: "g3-ap8", label: "Material risks accepted by the appropriate authority" },
          { id: "g3-ap9", label: "Legal review completed" },
          { id: "g3-ap10", label: "Executive approval obtained where required" },
        ],
      },
    ],
  },
  {
    n: 4,
    key: "g4",
    short: "Handoff",
    title: "Gate 4 — Contract handoff / program launch",
    purpose: "Transfer the signed contract, requirements, assumptions, risks and commitments to the execution organisation.",
    sections: [
      {
        id: "g4-handoff",
        title: "Handoff checklist",
        items: [
          { id: "g4-h1", label: "Signed contract received" },
          { id: "g4-h2", label: "Final quotation archived" },
          { id: "g4-h3", label: "Requirements matrix transferred" },
          { id: "g4-h4", label: "Exceptions transferred" },
          { id: "g4-h5", label: "Assumptions transferred" },
          { id: "g4-h6", label: "Risk register transferred" },
          { id: "g4-h7", label: "Cost model transferred" },
          { id: "g4-h8", label: "Customer schedule transferred" },
          { id: "g4-h9", label: "Quality requirements transferred" },
          { id: "g4-h10", label: "Engineering requirements transferred" },
          { id: "g4-h11", label: "Tooling / capital commitments transferred" },
          { id: "g4-h12", label: "Supplier commitments transferred" },
          { id: "g4-h13", label: "Warranty requirements transferred" },
          { id: "g4-h14", label: "Program owner assigned" },
          { id: "g4-h15", label: "Customer communication plan established" },
          { id: "g4-h16", label: "Handoff meeting held and documented" },
        ],
      },
    ],
  },
  {
    n: 5,
    key: "g5",
    short: "Ongoing review",
    title: "Gate 5 — Ongoing contract review",
    purpose: "Monitor material changes, requirements, commercial performance, risks and obligations through the program.",
    sections: [
      {
        id: "g5-cadence",
        title: "Cadence and governance",
        items: [
          { id: "g5-c1", label: "Program review cadence agreed (monthly or quarterly by risk)" },
          { id: "g5-c2", label: "Risk register reviewed at each program review" },
          { id: "g5-c3", label: "Actual margin tracked against the approved business case" },
          { id: "g5-c4", label: "Contract amendments logged and approved" },
          { id: "g5-c5", label: "Customer issues and claims tracked to closure" },
        ],
      },
    ],
  },
];

export const GATE_TOTALS = GATES.map((g) => g.sections.reduce((n, s) => n + s.items.length, 0));

export const ONGOING_TRIGGERS = [
  "Major engineering change",
  "Significant volume change",
  "Customer schedule change",
  "Material cost change",
  "New regulatory requirement",
  "New quality requirement",
  "Significant supplier change",
  "Capacity change",
  "Contract amendment",
  "New customer terms",
  "Warranty or field-performance issue",
  "Significant change to program economics",
];

export const ONGOING_DETERMINATIONS = [
  "Revised quotation",
  "Contract amendment",
  "Customer approval",
  "Management approval",
  "Revalidation of technical feasibility",
  "Reassessment of program profitability",
  "Update to the risk register",
  "No action required",
];

export const REQUIREMENT_STATUS = [
  { value: "compliant", label: "Compliant" },
  { value: "partial", label: "Partially compliant" },
  { value: "exception", label: "Compliant with exception" },
  { value: "not_compliant", label: "Not compliant" },
  { value: "tbd", label: "To be determined" },
];

export const EXCEPTION_STATUS = [
  { value: "open", label: "Open" },
  { value: "negotiating", label: "Negotiating" },
  { value: "accepted", label: "Accepted" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "rejected", label: "Rejected by customer" },
];

export const RISK_STATUS = [
  { value: "open", label: "Open" },
  { value: "mitigating", label: "Mitigating" },
  { value: "accepted", label: "Accepted" },
  { value: "closed", label: "Closed" },
];

export const RISK_CATEGORIES = ["Commercial", "Technical", "Operational", "Supply chain", "Quality", "Contractual", "Regulatory", "Financial"];

export const FUNCTIONS = ["Sales", "Engineering", "Operations", "Quality", "Supply chain", "Finance", "Legal", "Executive"];

export function riskRating(p?: number | null, i?: number | null) {
  const score = (p ?? 0) * (i ?? 0);
  if (!score) return { score: 0, label: "Not scored", tone: "muted" as const };
  if (score >= 15) return { score, label: "High", tone: "high" as const };
  if (score >= 8) return { score, label: "Medium", tone: "medium" as const };
  return { score, label: "Low", tone: "low" as const };
}

export const REVIEW_STATUS = [
  { value: "in_review", label: "In review" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "no_bid", label: "No-bid" },
  { value: "handed_off", label: "Handed off" },
  { value: "closed", label: "Closed" },
];

// ---------------------------------------------------------------------------
// Reference content
// ---------------------------------------------------------------------------

export const RACI_ROLES = ["Sales", "Eng", "Ops", "Quality", "SCM", "Fin", "Legal", "Exec"];

export const RACI_ROWS: { activity: string; cells: string[] }[] = [
  { activity: "Opportunity intake", cells: ["R", "C", "C", "C", "C", "C", "C", "I"] },
  { activity: "Bid / no-bid review", cells: ["A", "C", "C", "C", "C", "C", "C", "I"] },
  { activity: "Requirements review", cells: ["R", "A", "C", "C", "C", "I", "C", "I"] },
  { activity: "Cost / pricing", cells: ["R", "C", "C", "C", "C", "A", "I", "I"] },
  { activity: "Technical feasibility", cells: ["C", "A", "C", "C", "C", "I", "I", "I"] },
  { activity: "Manufacturing feasibility", cells: ["C", "C", "A", "C", "C", "I", "I", "I"] },
  { activity: "Quality review", cells: ["C", "C", "C", "A", "I", "I", "C", "I"] },
  { activity: "Supply-chain review", cells: ["C", "I", "C", "C", "A", "C", "I", "I"] },
  { activity: "Contract review", cells: ["C", "I", "I", "C", "I", "C", "A", "I"] },
  { activity: "Risk review", cells: ["R", "C", "C", "C", "C", "C", "C", "A"] },
  { activity: "Final bid approval", cells: ["R", "C", "C", "C", "C", "A", "C", "A*"] },
  { activity: "Contract approval", cells: ["C", "I", "I", "C", "I", "C", "A", "A*"] },
  { activity: "Contract handoff", cells: ["A", "C", "A", "C", "C", "C", "C", "I"] },
  { activity: "Ongoing contract review", cells: ["A", "C", "C", "C", "C", "C", "C", "I"] },
];

export const RACI_NOTE =
  "R = Responsible · A = Accountable · C = Consulted · I = Informed. *A = executive approval is required when the opportunity exceeds delegated authority, contains material risk, or falls outside approved company thresholds.";

export const CADENCE: { meeting: string; timing: string; purpose: string[] }[] = [
  {
    meeting: "Bid kickoff",
    timing: "Within 1–3 business days of a significant RFQ",
    purpose: ["Review the opportunity", "Assign functional owners", "Set the bid schedule", "Identify initial risks and information gaps"],
  },
  {
    meeting: "Bid review",
    timing: "Before significant engineering / costing effort, and before the final quotation",
    purpose: ["Confirm requirements", "Review the technical solution", "Review cost and pricing", "Review capacity and schedule", "Review risks and exceptions"],
  },
  {
    meeting: "Final bid approval",
    timing: "Before quotation submission",
    purpose: ["Approve the final commercial position", "Confirm assumptions and exceptions", "Confirm required management approvals"],
  },
  {
    meeting: "Contract review",
    timing: "Before contract acceptance or signature",
    purpose: ["Review the final contract", "Resolve exceptions", "Approve risks", "Confirm commercial and operational commitments"],
  },
  {
    meeting: "Contract handoff",
    timing: "Within 5–10 business days of award, or before execution begins",
    purpose: ["Transfer commitments to the execution organisation", "Confirm ownership and milestones"],
  },
  {
    meeting: "Program / contract review",
    timing: "Monthly or quarterly depending on risk and complexity",
    purpose: ["Review performance, risks, changes, financials, customer issues and contractual obligations"],
  },
];

export const FORMS: { n: number; title: string; fields: string[] }[] = [
  {
    n: 1,
    title: "Bid / no-bid review",
    fields: ["Customer", "Opportunity", "Product / program", "Estimated revenue", "Estimated volume", "Bid due date", "Program timing", "Strategic rationale", "Key technical requirements", "Key manufacturing requirements", "Key quality requirements", "Key supply-chain requirements", "Preliminary commercial assessment", "Preliminary risks", "Required capital / tooling", "GO / GO WITH CONDITIONS / NO-GO", "Approvals"],
  },
  {
    n: 2,
    title: "Requirements compliance matrix",
    fields: ["Requirement ID", "Customer requirement", "Source document", "Applicable product", "Responsible function", "Compliance status", "Assumption / exception", "Cost impact", "Schedule impact", "Risk", "Customer clarification required", "Owner", "Disposition"],
  },
  {
    n: 3,
    title: "Bid assumptions and exceptions register",
    fields: ["Item", "Requirement", "Company assumption", "Reason", "Financial impact", "Technical impact", "Schedule impact", "Customer approval required", "Owner", "Status"],
  },
  {
    n: 4,
    title: "Contract review checklist",
    fields: ["Contract identification", "Scope", "Price", "Payment", "Volume", "Forecast", "Delivery", "Incoterms", "Quality", "Warranty", "Liability", "Indemnification", "Insurance", "IP", "Confidentiality", "Cybersecurity", "Regulatory", "Termination", "Changes", "Tooling", "Inventory", "Customer audits", "Dispute resolution", "Governing law", "Exceptions", "Required approvals"],
  },
  {
    n: 5,
    title: "Contract risk register",
    fields: ["Risk ID", "Risk description", "Category", "Probability", "Impact", "Risk rating", "Mitigation", "Owner", "Due date", "Residual risk", "Management approval"],
  },
  {
    n: 6,
    title: "Contract handoff checklist",
    fields: ["Signed contract received", "Final quotation archived", "Requirements matrix transferred", "Exceptions transferred", "Assumptions transferred", "Risk register transferred", "Cost model transferred", "Customer schedule transferred", "Quality requirements transferred", "Engineering requirements transferred", "Tooling / capital commitments transferred", "Supplier commitments transferred", "Warranty requirements transferred", "Program owner assigned", "Customer communication plan established", "Handoff completed"],
  },
];

export const AUTHORITY_CRITERIA = [
  "Total contract value",
  "Expected annual revenue",
  "Gross / contribution margin",
  "Capital expenditure",
  "Customer concentration",
  "Liability exposure",
  "Warranty exposure",
  "Contract duration",
  "Unusual contractual terms",
  "Geographic / regulatory risk",
  "Strategic importance",
  "Risk rating",
];

export const RETENTION_RECORDS = [
  "RFQ / RFP",
  "Customer specifications and drawings",
  "Bid / no-bid review",
  "Requirements compliance matrix",
  "Cost model",
  "Approved quotation",
  "Assumptions and exceptions",
  "Contract review checklist",
  "Contract risk register",
  "Negotiation records",
  "Final signed contract",
  "Contract handoff record",
  "Approved amendments and change orders",
  "Subsequent contract reviews",
];

export const PROCESS_KPIS = [
  "% of significant bids formally reviewed before submission",
  "% of contracts reviewed before signature",
  "% of bids won",
  "Quoted versus actual margin",
  "Number of post-award commercial surprises",
  "Number of missed contractual obligations",
  "Number of contract exceptions accepted",
  "Number of customer disputes / claims",
  "% of contract handoffs completed on time",
  "Post-award changes caused by misunderstood requirements",
  "Actual program profitability versus approved business case",
];

export const GOVERNANCE_PRINCIPLE =
  "Do not commit the company to a customer requirement, cost, schedule, quality obligation, warranty obligation, capacity commitment or contractual risk unless the function responsible for delivering that commitment has reviewed and accepted it.";

export const CHAIN_OF_CONTROL = [
  "Customer requirement",
  "Bid / no-bid",
  "Requirements review",
  "Technical & operational feasibility",
  "Cost / price approval",
  "Risk & contract review",
  "Management approval",
  "Contract signature",
  "Contract handoff",
  "Program execution",
  "Ongoing contract review",
];

export const SCOPE_TRIGGERS = [
  "New customer RFQs and bids",
  "New products or programs",
  "Significant changes to existing customer business",
  "New customers or markets with material commercial or contractual risk",
  "Long-term supply agreements",
  "Fixed-price or cost-plus contracts",
  "Contracts requiring significant capital, tooling, engineering or capacity commitment",
  "Material amendments, change orders or extensions",
];

// ---------------------------------------------------------------------------
// Maturity framework (tickable, audit-ready)
// ---------------------------------------------------------------------------

export const BID_REVIEW_PILLARS: Pillar[] = [
  {
    id: "bcr1",
    n: 1,
    title: "Purpose, Scope & Applicability",
    items: [
      { id: "bcr1-purpose", title: "Purpose defined and communicated", description: "A cross-functional method exists to review new customer bids and contracts before the company commits to pricing, delivery, technical, quality, commercial or contractual obligations." },
      { id: "bcr1-scope", title: "Scope of mandatory review is written down", description: "New RFQs, new products or programs, significant changes to existing business, new customers or markets, long-term agreements, fixed-price or cost-plus contracts, contracts needing capital/tooling/engineering/capacity, and material amendments all trigger formal review." },
      { id: "bcr1-routine", title: "Routine quotations have a defined light path", description: "Quotations inside standard commercial and contractual terms run through the standard quotation process, subject to the delegation of authority." },
      { id: "bcr1-owners", title: "Document and process owners named", description: "Sales / Commercial owns the document. Sales, Engineering, Operations, Quality, Supply Chain, Finance and Legal own the process together." },
      { id: "bcr1-gates", title: "Five gates are recognised across the business", description: "Bid/no-bid, bid approval, contract review and approval, contract handoff, ongoing contract review. No bid or contract requiring formal review passes a gate without the required approvals." },
    ],
  },
  {
    id: "bcr2",
    n: 2,
    title: "Gate 1 — Opportunity / Bid-No-Bid",
    items: [
      { id: "bcr2-inputs", title: "Standard input pack is collected", description: "RFQ/RFP, drawings and specifications, statement of work, forecast and volumes, required delivery dates, customer quality requirements, applicable standards, draft commercial terms, customer-specific requirements, and known tooling/capital/engineering needs." },
      { id: "bcr2-crossfn", title: "All seven functions assess the opportunity", description: "Commercial, Technical, Operations, Quality, Supply chain, Legal/Contracts and Finance each record a view before the decision is taken." },
      { id: "bcr2-decision", title: "Decision is explicit: GO, GO WITH CONDITIONS or NO-GO", description: "The outcome is recorded, not assumed. Conditions and actions are written into the bid review record with owners." },
      { id: "bcr2-timing", title: "Kickoff happens within 1–3 business days of a significant RFQ", description: "Functional owners are assigned, the bid schedule is set, and initial risks and information gaps are identified." },
    ],
  },
  {
    id: "bcr3",
    n: 3,
    title: "Gate 2 — Bid Approval",
    items: [
      { id: "bcr3-reqs", title: "Requirements are identified and understood before pricing", description: "Conflicting or ambiguous requirements are surfaced and customer clarifications requested rather than assumed away." },
      { id: "bcr3-feas", title: "Technical and manufacturing feasibility confirmed", description: "Process capability evaluated, capacity available or planned, tooling and equipment identified, and all assumptions documented." },
      { id: "bcr3-quality", title: "Quality and regulatory obligations priced in", description: "Standards, inspection and testing, PPAP/APQP or equivalent, and warranty obligations are understood before the number goes out." },
      { id: "bcr3-cost", title: "Cost model complete and margin approved", description: "Pricing approved, margin meets company requirements, capital and tooling included, payment terms understood, escalation and currency exposures documented." },
      { id: "bcr3-schedule", title: "Schedule commitments are achievable", description: "Customer timing, tooling and development timing, and ramp requirements have been checked against the real plan." },
      { id: "bcr3-risk", title: "Risks documented with owners before submission", description: "Material risks recorded, mitigations owned, and required management approvals obtained. The approved quotation is retained with the bid review record." },
    ],
  },
  {
    id: "bcr4",
    n: 4,
    title: "Gate 3 — Contract Review & Approval",
    items: [
      { id: "bcr4-checklist", title: "Standard contract review checklist is used", description: "Scope, price/commercial, delivery, quality/warranty, liability, IP, termination, changes and compliance are each reviewed by the accountable function." },
      { id: "bcr4-deviations", title: "Deviations from standard positions are identified", description: "The review explicitly names every material deviation from the company's standard commercial and contractual position." },
      { id: "bcr4-preconditions", title: "All ten approval preconditions satisfied before signature", description: "Requirements, technical feasibility, manufacturing feasibility, quality, supply chain, financial impact, exceptions, risks, legal review and executive approval." },
      { id: "bcr4-authority", title: "Nobody signs outside delegated authority", description: "A delegation of authority matrix exists and is applied to contract value, margin, capital, liability, duration and risk rating." },
    ],
  },
  {
    id: "bcr5",
    n: 5,
    title: "Exceptions, Assumptions & Contract Risk",
    items: [
      { id: "bcr5-exceptions", title: "Contract exceptions register maintained", description: "Each exception records the clause, customer requirement, company concern, business impact, proposed position, fallback, owner, negotiation status, final disposition and required approval." },
      { id: "bcr5-noauthority", title: "No material exception accepted outside delegated authority", description: "Acceptance is a documented approval, not an email reply from whoever answered first." },
      { id: "bcr5-risk", title: "Contract risk register maintained for material programs", description: "Risks scored on probability and impact, with financial, operational, customer and legal dimensions considered, and an owner on every line." },
      { id: "bcr5-high", title: "High risks receive documented management disposition", description: "High or unacceptable risks are dispositioned by the appropriate authority before contract acceptance." },
    ],
  },
  {
    id: "bcr6",
    n: 6,
    title: "Gate 4 — Contract Handoff",
    items: [
      { id: "bcr6-meeting", title: "Formal handoff meeting held after signature", description: "Held within 5–10 business days of award, or before execution activities begin." },
      { id: "bcr6-pack", title: "Complete handoff pack transferred", description: "Signed contract, final quotation, requirements matrix, exceptions, assumptions, risk register, cost model, customer schedule, quality and engineering requirements, tooling and supplier commitments, warranty obligations, reporting requirements and key milestones." },
      { id: "bcr6-owner", title: "Program owner named and accepts the commitments", description: "The program manager or business owner confirms the execution organisation understands what has been promised." },
      { id: "bcr6-record", title: "Handoff is documented", description: "The handoff record is retained with the contract file." },
    ],
  },
  {
    id: "bcr7",
    n: 7,
    title: "Gate 5 — Ongoing Contract Review",
    items: [
      { id: "bcr7-triggers", title: "Change triggers are defined and monitored", description: "Engineering changes, volume changes, schedule changes, material cost changes, regulatory or quality changes, supplier and capacity changes, amendments, new terms, warranty issues and changes to program economics." },
      { id: "bcr7-determination", title: "Each change gets an explicit determination", description: "Revised quotation, contract amendment, customer approval, management approval, revalidation of feasibility, reassessment of profitability, or risk register update." },
      { id: "bcr7-cadence", title: "Program review cadence matches risk", description: "Monthly or quarterly depending on program risk and complexity, covering performance, risks, changes, financials, customer issues and obligations." },
      { id: "bcr7-margin", title: "Actual profitability tracked against the approved business case", description: "Quoted versus actual margin is reviewed, and material variance triggers action rather than explanation." },
    ],
  },
  {
    id: "bcr8",
    n: 8,
    title: "Records, Measurement & Governance",
    items: [
      { id: "bcr8-records", title: "All required records retained and retrievable", description: "From RFQ through signed contract, handoff record, amendments and subsequent reviews, held in the controlled document system." },
      { id: "bcr8-kpis", title: "Process performance measured", description: "Review coverage before submission and signature, win rate, quoted vs actual margin, post-award surprises, missed obligations, exceptions accepted, disputes, on-time handoffs and actual vs business-case profitability." },
      { id: "bcr8-principle", title: "Governance principle is understood and applied", description: "Bid and contract review is not a Sales or Legal activity alone. No commitment is made unless the function responsible for delivering it has reviewed and accepted it." },
      { id: "bcr8-chain", title: "Unbroken chain of control is visible end to end", description: "Customer requirement → bid/no-bid → requirements review → technical & operational feasibility → cost/price approval → risk & contract review → management approval → signature → handoff → execution → ongoing review." },
    ],
  },
];

export const BID_REVIEW_TOTAL_ITEMS = BID_REVIEW_PILLARS.reduce((n, p) => n + p.items.length, 0);
