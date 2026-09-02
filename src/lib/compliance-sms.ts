// Safety Management System (SMS) compliance checklist.
// ICAO Annex 19 (4 components / 12 elements), aligned with 14 CFR Part 5 and EASA (ORO.GEN.200 / Part-145 A.200).
// Stable ids — do NOT rename; user progress is keyed on them.

import type { Pillar } from "./compliance-part145";

export const SMS_PILLARS: Pillar[] = [
  {
    id: "sms1",
    n: 1,
    title: "Safety Policy & Objectives",
    items: [
      {
        id: "sms1-policy",
        title: "Management Commitment & Safety Policy",
        ref: "14 CFR § 5.21 / ICAO 1.1",
        description:
          "A written safety policy signed and dated by the Accountable Executive, defining the organisation's safety commitment, safety objectives, and the conditions under which disciplinary action would/would not apply (just culture). Communicated to all personnel and reviewed at defined intervals.",
      },
      {
        id: "sms1-accountability",
        title: "Safety Accountability & Responsibilities",
        ref: "14 CFR § 5.23 / ICAO 1.2",
        description:
          "Documented accountability of the Accountable Executive (final authority over operations, control of financial and human resources). Safety responsibilities, authorities and interfaces defined for all managers and staff in job descriptions and the SMS manual.",
      },
      {
        id: "sms1-key-personnel",
        title: "Appointment of Key Safety Personnel",
        ref: "14 CFR § 5.25 / ICAO 1.3",
        description:
          "A qualified Safety Manager (or equivalent) appointed as the focal point for SMS implementation and maintenance. Safety Review Board (SRB) and Safety Action Group (SAG) established with defined membership, terms of reference and meeting cadence; minutes retained.",
      },
      {
        id: "sms1-erp",
        title: "Emergency Response / Contingency Planning",
        ref: "ICAO 1.4",
        description:
          "Emergency Response Plan (ERP) covering accident/serious incident, AOG, fire, hazmat release and business continuity. Roles, call trees, notification of the authority, and coordination with customers and airport/site emergency services. Exercised and debriefed periodically.",
      },
      {
        id: "sms1-documentation",
        title: "SMS Documentation & Records",
        ref: "14 CFR § 5.95 / ICAO 1.5",
        description:
          "An SMS manual (or exposition chapter) describing scope, policy, processes and interfaces, under revision control. Records of hazards, risk assessments, safety reports, SPI data, training, meetings and audits retained for the required period and retrievable on request.",
      },
    ],
  },
  {
    id: "sms2",
    n: 2,
    title: "Safety Risk Management",
    items: [
      {
        id: "sms2-hazard-id",
        title: "Hazard Identification",
        ref: "14 CFR § 5.53 / ICAO 2.1",
        description:
          "A defined process capturing hazards reactively (occurrences, defects, escapes, injuries), proactively (audits, inspections, employee reports, surveys) and predictively (trend/flight-safety data, supplier and human-factors analysis). A live hazard register with source, owner and status.",
      },
      {
        id: "sms2-reporting",
        title: "Confidential Safety Reporting System",
        ref: "14 CFR § 5.71(a)(6)",
        description:
          "An accessible voluntary and confidential (non-punitive) reporting channel for all personnel, including contractors. Defined acknowledgement, triage, feedback-to-reporter and de-identification rules, with reporting rates monitored as a health indicator.",
      },
      {
        id: "sms2-risk-assessment",
        title: "Safety Risk Assessment & Acceptability Criteria",
        ref: "14 CFR § 5.55 / ICAO 2.2",
        description:
          "A documented severity/likelihood risk matrix with defined acceptable, tolerable and intolerable regions, and who may accept residual risk at each level. Assessments recorded, with the rationale and the data used.",
      },
      {
        id: "sms2-mitigation",
        title: "Risk Control & Mitigation Tracking",
        ref: "14 CFR § 5.55(c)",
        description:
          "Controls selected using the hierarchy (eliminate, substitute, engineer, administrate, PPE), assigned to an owner with a due date, verified as effective after implementation, and re-assessed for residual and secondary risk before closure.",
      },
      {
        id: "sms2-moc",
        title: "Management of Change (Risk Side)",
        ref: "14 CFR § 5.71(a)(5) / ICAO 3.3",
        description:
          "Changes to organisation, scope of work, key personnel, facilities, tooling, suppliers, IT systems or processes screened for safety impact before implementation, with a risk assessment and documented approval.",
      },
    ],
  },
  {
    id: "sms3",
    n: 3,
    title: "Safety Assurance",
    items: [
      {
        id: "sms3-spi",
        title: "Safety Performance Monitoring & Measurement (SPIs / SPTs)",
        ref: "14 CFR § 5.71 / ICAO 3.1",
        description:
          "Defined safety performance indicators with alert and target levels (e.g. escapes per 1,000 work orders, tool control discrepancies, rework, injuries, reporting rate). Data collected at a stated cadence, trended, and reviewed by the SRB with actions raised on breach.",
      },
      {
        id: "sms3-internal-audit",
        title: "Internal Audit / Internal Evaluation of the SMS",
        ref: "14 CFR § 5.73 / ICAO 3.2",
        description:
          "A risk-based annual internal audit schedule covering every SMS element and operational area, performed by personnel independent of the audited activity. Findings classified, with root-cause analysis, corrective/preventive action, due dates and verified closure.",
      },
      {
        id: "sms3-investigation",
        title: "Occurrence Investigation & External Reporting",
        ref: "14 CFR § 5.71(a)(4)",
        description:
          "Investigation procedure proportionate to severity, using a structured root-cause method and covering human and organisational factors. Mandatory occurrence/SDR reporting to the authority and customers within the required timescales, with evidence of submission.",
      },
      {
        id: "sms3-supplier",
        title: "Oversight of Contracted & Supplier Activities",
        ref: "14 CFR § 5.71(a)(2)",
        description:
          "Safety performance of subcontractors, contract maintenance providers and staffing agencies monitored through approval criteria, audits, surveillance and performance data. Interface responsibilities documented in contracts.",
      },
      {
        id: "sms3-continuous",
        title: "Continuous Improvement & Management Review",
        ref: "14 CFR § 5.75 / ICAO 3.3",
        description:
          "Periodic management review of SMS effectiveness by the Accountable Executive, using SPI trends, audit findings, investigation outcomes and resource adequacy. Decisions, actions and improvements recorded and tracked to closure.",
      },
    ],
  },
  {
    id: "sms4",
    n: 4,
    title: "Safety Promotion",
    items: [
      {
        id: "sms4-training",
        title: "SMS Training & Competence",
        ref: "14 CFR § 5.91 / ICAO 4.1",
        description:
          "Role-based initial and recurrent SMS training for all staff, including the Accountable Executive, managers, safety personnel and contractors. Syllabus, attendance records, competence checks and a training matrix showing currency.",
      },
      {
        id: "sms4-human-factors",
        title: "Human Factors & Just Culture Integration",
        ref: "EASA 145.A.30(e) / ICAO 4.1",
        description:
          "Human-factors training (Dirty Dozen, error management, fatigue, shift handover) integrated with SMS. Just-culture principles applied consistently and demonstrably in investigations and disciplinary decisions.",
      },
      {
        id: "sms4-communication",
        title: "Safety Communication",
        ref: "14 CFR § 5.93 / ICAO 4.2",
        description:
          "Two-way communication of safety information: safety bulletins, alerts, toolbox talks, boards, and feedback on reported hazards so personnel see the outcome. Evidence that safety-critical information reaches all shifts and locations.",
      },
      {
        id: "sms4-lessons",
        title: "Lessons Learned & Safety Culture Measurement",
        ref: "ICAO 4.2",
        description:
          "Lessons learned from internal occurrences and industry events captured, shared, and fed into procedures and training. Safety culture assessed periodically (surveys, interviews) with actions arising from the results.",
      },
    ],
  },
];

export const SMS_TOTAL_ITEMS = SMS_PILLARS.reduce((n, p) => n + p.items.length, 0);
