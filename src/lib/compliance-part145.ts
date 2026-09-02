// Canonical Part 145 / EASA compliance checklist.
// Stable ids — do NOT rename; user progress is keyed on them.

export type ChecklistItem = {
  id: string;
  title: string;
  ref?: string; // regulatory reference (e.g. "§ 145.215")
  description: string;
};

export type Pillar = {
  id: string;
  n: number;
  title: string;
  items: ChecklistItem[];
};

export const PART145_PILLARS: Pillar[] = [
  {
    id: "p1",
    n: 1,
    title: "Regulatory Certificates & Operating Scope",
    items: [
      {
        id: "p1-cert-opspecs",
        title: "Air Agency Certificate & Operations Specifications (OpSpecs)",
        description:
          "Valid Part 145 certificate displayed publicly on site. OpSpecs explicitly define authorized rating classes (Airframe, Powerplant, Propeller, Radio, Instrument, Accessory) or Limited Ratings.",
      },
      {
        id: "p1-capability-list",
        title: "Capability List",
        ref: "§ 145.215",
        description:
          "Documented procedures for self-evaluation before adding new part numbers or components to the station's capability list. Includes FAA notification protocols and review frequencies.",
      },
      {
        id: "p1-basa-mag",
        title: "Bilateral Aviation Safety Agreements (BASA) & MAG",
        description:
          "If servicing foreign-registered aircraft or components (EASA, TCCA Canada, UK CAA, CAAC China), compliance with the relevant Maintenance Annex Guidance (MAG) and local authority supplements (e.g. EASA Supplement to RSM).",
      },
      {
        id: "p1-offsite",
        title: "Off-Site Work Authorizations",
        ref: "§ 145.203",
        description:
          "Written procedures and authorization in OpSpecs for performing maintenance away from the fixed location (e.g. mobile repair teams, field service).",
      },
    ],
  },
  {
    id: "p2",
    n: 2,
    title: "Core Operating Manuals & Governance",
    items: [
      {
        id: "p2-rsm",
        title: "Repair Station Manual (RSM)",
        ref: "§ 145.207 / § 145.209",
        description:
          "Approved manual covering organizational hierarchy, duties of key personnel, roster updates, facility descriptions, and operational procedures.",
      },
      {
        id: "p2-qcm",
        title: "Quality Control Manual (QCM)",
        ref: "§ 145.211",
        description:
          "Detailed policies governing incoming inspections, tool calibration, material handling, final inspection sign-offs, and return-to-service protocols.",
      },
      {
        id: "p2-tpm",
        title: "Training Program Manual (TPM)",
        ref: "§ 145.163",
        description:
          "FAA-approved training curriculum detailing initial, recurrent, specialized, and technical training tracks for all operational employees.",
      },
      {
        id: "p2-moe",
        title: "Maintenance Organisation Exposition (MOE)",
        description:
          "Required if holding direct EASA Part 145 certification (or combined RSM/MOE document for dual-certified stations).",
      },
    ],
  },
  {
    id: "p3",
    n: 3,
    title: "Personnel, Qualifications & Mandated Programs",
    items: [
      {
        id: "p3-accountable-manager",
        title: "Designated Accountable Manager",
        ref: "§ 145.151",
        description:
          "Formally assigned executive with corporate financial authority and operational accountability for maintaining airworthiness standards.",
      },
      {
        id: "p3-roster",
        title: "Management & Supervisory Roster",
        ref: "§ 145.161",
        description:
          "Active, audit-ready rosters for management, supervisory personnel, inspection staff, and individuals authorized to approve articles for Return to Service (RTS).",
      },
      {
        id: "p3-drug-alcohol",
        title: "DOT/FAA Anti-Drug & Alcohol Misuse Prevention Program",
        ref: "14 CFR Part 120",
        description:
          "Mandatory pre-employment, random, and post-accident drug/alcohol testing program registered with the FAA for employees performing safety-sensitive maintenance functions on commercial aircraft (Part 121/135).",
      },
      {
        id: "p3-hazmat",
        title: "Hazardous Materials (HazMat) Training Program",
        ref: "§ 145.165",
        description:
          "Compliant HazMat/Dangerous Goods training under 49 CFR / IATA for all receiving, handling, and shipping personnel.",
      },
      {
        id: "p3-human-factors",
        title: "Human Factors (HF) Training",
        description:
          "Initial and recurrent training addressing human performance, fatigue management, situational awareness, and error prevention.",
      },
    ],
  },
  {
    id: "p4",
    n: 4,
    title: "Facilities, Technical Data & Tooling Controls",
    items: [
      {
        id: "p4-housing",
        title: "Housing & Environmental Controls",
        ref: "§ 145.103",
        description:
          "Adequate work bays, environmental controls (temperature/humidity monitoring for composites, paint, or cleanrooms), and physical segregation of work areas.",
      },
      {
        id: "p4-parts-segregation",
        title: "Parts Segregation & Storage",
        description:
          "Secured quarantine areas for incoming parts, strict physical separation between serviceable, unserviceable, non-conforming, and scrapped articles. Shelf-life monitoring for rubber, sealants, and chemicals.",
      },
      {
        id: "p4-tech-data",
        title: "Approved Technical Data Currency",
        ref: "§ 145.109",
        description:
          "Real-time access to current OEM Maintenance Manuals, Component Maintenance Manuals (CMMs), Airworthiness Directives (ADs), Service Bulletins (SBs), and Instructions for Continued Airworthiness (ICA).",
      },
      {
        id: "p4-tooling",
        title: "Calibrated Tooling & Test Equipment",
        ref: "§ 145.109",
        description:
          "Calibrated tool tracking system with physical calibration tags, serial number logging, NIST-traceable calibration standards, and formal out-of-tolerance assessment procedures.",
      },
    ],
  },
  {
    id: "p5",
    n: 5,
    title: "Quality Assurance, Supply Chain & Work Execution",
    items: [
      {
        id: "p5-traceability",
        title: "Parts Traceability & Receiving Inspection",
        description:
          "Validation of airworthiness documentation (FAA Form 8130-3, EASA Form 1, Certificate of Conformity) on incoming materials. Active tracking and reporting of Suspect Unapproved Parts (SUPs) per FAA AC 21-29.",
      },
      {
        id: "p5-contract-oversight",
        title: "Contract Maintenance Oversight",
        ref: "§ 145.217",
        description:
          "Formally approved vendor list (AVL). Written procedures and audit oversight for maintenance contracted to both certificated and non-certificated subcontractors.",
      },
      {
        id: "p5-work-order",
        title: "Work Order Execution & Handover",
        description:
          "Standardized traveler packages, progressive sign-offs, NDT technique sheets, and formal shift-turnover communication logs.",
      },
      {
        id: "p5-rts",
        title: "Return to Service (RTS) Protocols",
        ref: "§ 145.213",
        description:
          "Authorized RTS signatures, complete maintenance record generation, and issuance of FAA Form 8130-3 / EASA Form 1 authorized release certificates.",
      },
      {
        id: "p5-records",
        title: "Records Retention",
        ref: "§ 145.219",
        description:
          "Complete maintenance records maintained for a minimum of 2 years from the RTS date (note: EASA and air carrier customer contracts frequently require 3 to 5 years retention).",
      },
    ],
  },
  {
    id: "p6",
    n: 6,
    title: "Safety Management System (SMS) & Internal Oversight",
    items: [
      {
        id: "p6-sms",
        title: "Safety Management System (SMS) Compliance",
        description:
          "EASA: fully mandatory under Part-145.A.200. FAA: mandatory if dual-certificated under MAG/EASA or participating in SMSVP. Covers the 4 SMS pillars — Safety Policy, Safety Risk Management (SRM), Safety Assurance (SA), and Safety Promotion.",
      },
      {
        id: "p6-sdr",
        title: "Service Difficulty Reporting (SDR)",
        ref: "§ 145.221",
        description:
          "Formal procedures to report serious defects, unairworthy conditions, or structural failures to the FAA/authority within 96 hours of discovery.",
      },
      {
        id: "p6-iep",
        title: "Internal Evaluation Program (IEP) & Audits",
        ref: "AC 145-5",
        description:
          "Regular internal audit schedules covering all operational departments, root-cause analysis protocols, and corrective action request (CAR) tracking.",
      },
    ],
  },
];

export const PART145_TOTAL_ITEMS = PART145_PILLARS.reduce((n, p) => n + p.items.length, 0);
