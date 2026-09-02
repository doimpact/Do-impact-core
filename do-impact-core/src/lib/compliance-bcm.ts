// Business Continuity Management programme — tickable maturity checklist.
// Stable ids — do NOT rename; user progress is keyed on them.

import type { Pillar } from "./compliance-part145";

export const BCM_PILLARS: Pillar[] = [
  {
    id: "bcm1",
    n: 1,
    title: "Policy, Scope & Responsibilities",
    items: [
      {
        id: "bcm1-policy",
        title: "Business continuity policy approved and current",
        description:
          "A written policy commits the company to protect people first, identify critical processes and risks, set recovery priorities and times, maintain contingency plans, train people and exercise the plan. Safety, environmental, legal, regulatory and quality requirements always take priority over production.",
      },
      {
        id: "bcm1-scope",
        title: "Scope covers every function and critical partner",
        description:
          "Manufacturing, maintenance, engineering, quality, supply chain, warehouse, IT, HR, finance, facilities, sales/customer service and critical contractors and suppliers are all in scope.",
      },
      {
        id: "bcm1-owner",
        title: "Site leader owns the programme; a BCM coordinator maintains it",
        description:
          "The site leader activates the plan, sets priorities, allocates resources and makes recovery decisions. The BCM coordinator (Operations or EHS) maintains risk assessments, plans, contacts, exercises and corrective actions.",
      },
      {
        id: "bcm1-functions",
        title: "Functional responsibilities defined",
        description:
          "Operations owns production recovery priorities; Maintenance/Engineering owns critical equipment and spares; Supply Chain owns alternate sources and inventory; IT owns backups and recovery; Quality controls affected product and approves restart; HR owns contacts, staffing and cross-training; every employee follows emergency instructions and reports disruptions.",
      },
      {
        id: "bcm1-priorities",
        title: "Response priority order published",
        description:
          "Life safety → emergency response → environmental protection → stabilise the facility → protect critical assets → protect product and customer property → maintain critical operations → communicate → restore normal operations → capture lessons learned.",
      },
    ],
  },
  {
    id: "bcm2",
    n: 2,
    title: "Business Impact Analysis & Recovery Objectives",
    items: [
      {
        id: "bcm2-processes",
        title: "Critical processes identified with owners",
        description:
          "Every department has identified its critical processes and named a process owner. Processes are classified CRITICAL, HIGH or MEDIUM/LOW.",
      },
      {
        id: "bcm2-bia",
        title: "BIA completed for every critical process",
        description:
          "Each BIA records customers affected, employees, equipment, IT systems, utilities and materials required, critical suppliers, minimum operating level, financial/customer/quality impact, dependencies, single points of failure and current backups.",
      },
      {
        id: "bcm2-mtd",
        title: "MTD, RTO and RPO established",
        description:
          "Maximum tolerable downtime (how long the company survives without the process), recovery time objective (target restoration time) and — for IT/data — recovery point objective (maximum acceptable data loss) are defined and agreed. Example: ERP RTO 8 hours, RPO 4 hours.",
      },
      {
        id: "bcm2-spof",
        title: "Single points of failure identified and addressed",
        description:
          "Each single point of failure has either an accepted risk decision or a defined mitigation with an owner and due date.",
      },
    ],
  },
  {
    id: "bcm3",
    n: 3,
    title: "Risk Assessment & Register",
    items: [
      {
        id: "bcm3-method",
        title: "Risk method applied consistently",
        description:
          "Risk = likelihood (1 rare … 5 almost certain) × business impact (1 minimal … 5 severe). 1–4 low, 5–9 moderate, 10–16 high, 17–25 critical.",
      },
      {
        id: "bcm3-register",
        title: "Risk register current and complete",
        description:
          "Every risk records cause, potential consequence, affected process, score, existing controls, preventive action, recovery action, owner, due date, status and residual risk.",
      },
      {
        id: "bcm3-coverage",
        title: "All major risk families assessed",
        description:
          "Facility (fire, earthquake, flood, structural damage, loss of access), utilities (power, gas, water, compressed air, HVAC, telecoms), equipment, supply chain, people, technology/cyber and quality.",
      },
      {
        id: "bcm3-actions",
        title: "High and critical risks have mitigation and recovery actions",
        description:
          "No high or critical risk sits in the register without a defined mitigation, a recovery action, an owner and a due date. Overdue actions are escalated.",
      },
    ],
  },
  {
    id: "bcm4",
    n: 4,
    title: "Continuity Strategies & Registers",
    items: [
      {
        id: "bcm4-equipment",
        title: "Critical equipment register maintained",
        description:
          "Criticality, failure consequence, expected recovery time, critical spares and their location, service provider and contact, alternate equipment or process, required utilities and personnel, PM status and recovery strategy.",
      },
      {
        id: "bcm4-suppliers",
        title: "Critical supplier register maintained",
        description:
          "Material/service, part number, criticality, single-source flag, alternate supplier and material, lead time, minimum and current inventory, emergency contact, transportation backup and quality approval requirement.",
      },
      {
        id: "bcm4-people",
        title: "Critical skills and backup personnel identified",
        description:
          "Every critical skill has a primary, a backup and — where justified — a second backup, with cross-training priorities, minimum staffing and external resources identified.",
      },
      {
        id: "bcm4-it",
        title: "Critical IT systems protected and recoverable",
        description:
          "Regular backups including off-site/cloud copies, documented recovery procedures, cybersecurity controls, alternate communications and manual procedures for each critical system.",
      },
      {
        id: "bcm4-production",
        title: "Production continuity options defined",
        description:
          "Alternate machines and processes, overtime, outside processing, alternate manufacturing location and production prioritisation rules are pre-agreed rather than improvised.",
      },
      {
        id: "bcm4-facility",
        title: "Facility contingency considered",
        description:
          "Alternate work areas, alternate warehouse, emergency power where justified and backup utilities are evaluated and documented.",
      },
    ],
  },
  {
    id: "bcm5",
    n: 5,
    title: "Activation, Incident Command & Communication",
    items: [
      {
        id: "bcm5-levels",
        title: "Activation levels understood",
        description:
          "Level 0 normal · Level 1 department disruption · Level 2 site disruption · Level 3 major disruption with the continuity team activated · Level 4 crisis with executive and external involvement.",
      },
      {
        id: "bcm5-team",
        title: "Business continuity team named",
        description:
          "Incident commander/site leader, operations, EHS, maintenance/engineering, quality, supply chain, IT, HR, finance and communications. Not every member is required for every event.",
      },
      {
        id: "bcm5-checklist",
        title: "Activation checklist available and used",
        description:
          "Protect people, call emergency services, stop unsafe operations, account for employees, stabilise hazards, notify the site leader, set the activation level and incident commander, assemble the team, assess facility/equipment/IT/people/suppliers/customers, set recovery priorities, implement the strategy, communicate, document decisions and set the next review time.",
      },
      {
        id: "bcm5-comms",
        title: "Communication plan and templates ready",
        description:
          "Internal (employees, supervisors, management, contractors) and external (customers, suppliers, emergency services, utilities, insurance, landlord, regulators, service providers). Only designated personnel communicate externally. Employee, customer and supplier templates are pre-written; recovery dates are never promised until Operations has validated them.",
      },
      {
        id: "bcm5-logs",
        title: "Incident and decision logs maintained during events",
        description:
          "Every activation records impacts by area, immediate actions, decisions with reasons and owners, communications, recovery actions, resolution and lessons learned.",
      },
    ],
  },
  {
    id: "bcm6",
    n: 6,
    title: "Response Playbooks",
    items: [
      {
        id: "bcm6-equipment",
        title: "Critical equipment failure response documented",
        description:
          "Protect personnel, safely stop equipment, apply LOTO, notify maintenance, determine the failure and repair time, check spares, contact the service provider, identify alternate equipment/process or outside processing, prioritise production, communicate customer impact, repair, test, obtain quality validation, resume and complete root-cause review.",
      },
      {
        id: "bcm6-it",
        title: "IT / cyber disruption response documented",
        description:
          "Determine whether cybersecurity is involved, notify IT/security, do not reconnect potentially compromised systems without authorisation, preserve evidence, identify affected systems, activate manual procedures, verify backups, prioritise recovery, validate data integrity and business processes, and capture lessons learned.",
      },
      {
        id: "bcm6-manual",
        title: "Manual operations plan available",
        description:
          "For each critical process: the normal IT system, the manual backup, the paper form, the responsible person, the maximum manual operating period, whether data re-entry is required and who approves. Covers travellers, inventory, receiving, shipping, inspection, maintenance work orders, scheduling and employee communication.",
      },
      {
        id: "bcm6-facility",
        title: "Facility loss plan documented",
        description:
          "Protect and account for employees, contact emergency services, secure the site, assess damage, protect inventory and customer property, contact landlord and insurance, determine an alternate facility and warehouse, set a temporary production strategy, communicate with customers and establish a recovery timeline.",
      },
      {
        id: "bcm6-prioritisation",
        title: "Production prioritisation rules agreed",
        description:
          "When capacity is limited, prioritise by safety, critical customer requirements, contractual commitments, required ship dates, customer criticality, revenue impact, available material and capacity, and quality status — with a named approver.",
      },
      {
        id: "bcm6-quality",
        title: "Quality continuity requirements defined",
        description:
          "After a disruption Quality determines requalification, calibration status, material and environmental effects, process parameter changes, inspection capability and additional inspection. Affected product is quarantined and not released until checks are complete.",
      },
    ],
  },
  {
    id: "bcm7",
    n: 7,
    title: "Recovery, Exercises & Improvement",
    items: [
      {
        id: "bcm7-return",
        title: "Return-to-normal checklist applied",
        description:
          "Emergency resolved, facility safe, equipment inspected and repaired, utilities stable, IT validated, quality satisfied, materials available, staffing adequate, customer commitments and backlog reviewed, employees informed, temporary controls documented, root cause initiated and lessons captured.",
      },
      {
        id: "bcm7-review",
        title: "Post-incident review completed after every significant disruption",
        description:
          "What happened, business impact, what worked, what failed, clarity of responsibilities, communication effectiveness, employee preparedness, backup effectiveness, availability of alternates, whether recovery met target, and what must change. Every action has an owner and a due date.",
      },
      {
        id: "bcm7-exercises",
        title: "Exercises conducted periodically",
        description:
          "Tabletop discussions, functional tests of a single capability, and multi-department simulations across scenarios such as power outage, fire/facility loss, critical machine failure, cyberattack, supplier failure, earthquake and major quality event.",
      },
      {
        id: "bcm7-training",
        title: "People with continuity responsibilities are trained",
        description:
          "Training completion is tracked for the continuity team, supervisors and anyone operating a manual fallback procedure.",
      },
      {
        id: "bcm7-annual",
        title: "Annual programme review completed",
        description:
          "Policy, BIA, top risks, critical equipment, suppliers, personnel, IT recovery, facility recovery and contact lists reviewed; an exercise conducted; lessons learned reviewed; corrective actions closed; recovery strategies updated; management approval obtained.",
      },
      {
        id: "bcm7-control",
        title: "Master plan and document control maintained",
        description:
          "A single controlled BCM plan holds purpose and scope, policy, roles, activation, BIA, risk register, recovery plans, supplier/personnel/IT/facility continuity, communications, prioritisation, quality recovery, return to normal, exercises, post-incident review, emergency contacts and revision history with owner, approver, version, effective date and next review date.",
      },
    ],
  },
];

export const BCM_TOTAL_ITEMS = BCM_PILLARS.reduce((n, p) => n + p.items.length, 0);
