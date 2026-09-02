// Autonomous & Preventive Maintenance programme — tickable maturity checklist.
// Stable ids — do NOT rename; user progress is keyed on them.

import type { Pillar } from "./compliance-part145";

export const AMPM_PILLARS: Pillar[] = [
  {
    id: "ampm1",
    n: 1,
    title: "Purpose, Scope & Ownership",
    items: [
      {
        id: "ampm1-purpose",
        title: "AM/PM purpose defined and communicated",
        description:
          "Equipment reliability and availability are maximised, unplanned downtime and breakdowns reduced, equipment life extended, safe and stable operating conditions ensured, quality problems caused by equipment prevented, and operators and maintenance work as one team. The cycle is CLEAN → INSPECT → DETECT → PLAN → MAINTAIN → VERIFY → IMPROVE.",
      },
      {
        id: "ampm1-scope",
        title: "Scope covers all production and support equipment",
        description:
          "Production machines, tooling and fixtures, material handling, utilities and support systems, quality and measurement equipment, safety systems and facility equipment are all in scope.",
      },
      {
        id: "ampm1-split",
        title: "AM / PM / Engineering split is unambiguous",
        description:
          "AM: operators own basic equipment care and early detection. PM: maintenance owns planned technical maintenance and equipment reliability. Engineering: eliminates chronic problems and improves equipment. Everyone knows which side of the line each task sits on.",
      },
      {
        id: "ampm1-roles",
        title: "Role responsibilities documented",
        description:
          "Operators clean, inspect, detect and report and perform authorised basic care. Maintenance plans and executes PM, repairs, analyses failures and trains operators. Engineering improves design and eliminates chronic losses. Production leadership provides time and priority. Site leadership funds and reviews the programme.",
      },
    ],
  },
  {
    id: "ampm2",
    n: 2,
    title: "Equipment Register & Criticality",
    items: [
      {
        id: "ampm2-register",
        title: "Master equipment register complete",
        description:
          "Every asset has an ID, name, department, location, manufacturer, model, serial number, process, installation date, primary operator and maintenance owner.",
      },
      {
        id: "ampm2-criticality",
        title: "Criticality classification applied (A–D)",
        description:
          "A: failure significantly affects safety, major customers, production, quality or continuity. B: significantly reduces capability but alternatives exist. C: manageable disruption. D: limited impact. Criticality drives PM frequency, spares, monitoring and response priority.",
      },
      {
        id: "ampm2-failure-modes",
        title: "Key failure modes recorded per asset",
        description:
          "Known and expected failure modes are captured on the equipment record and used to design AM checks, PM tasks and spare holdings.",
      },
      {
        id: "ampm2-backup",
        title: "Backup equipment and service providers identified",
        description:
          "For critical assets, the alternative route, the external service provider and the response arrangement are known before the failure, not after.",
      },
    ],
  },
  {
    id: "ampm3",
    n: 3,
    title: "Autonomous Maintenance (Operators)",
    items: [
      {
        id: "ampm3-levels",
        title: "AM levels 1–5 defined and assigned per asset",
        description:
          "L1 basic condition (clean, remove contamination, spot leaks, loose parts, damaged guards, noise, heat, buildup). L2 inspection (belts, chains, bearings, sensors, gauges, hydraulics, pneumatics, coolant, lubrication, fasteners). L3 basic care where authorised (lubrication, tightening, filter cleaning, approved fluids, basic adjustment). L4 early detection of change from normal. L5 standardised care to documented standards.",
      },
      {
        id: "ampm3-daily",
        title: "Daily operator check sheet in use on every critical asset",
        description:
          "The 15-point check runs at start of shift: clean, no oil/coolant/air leaks, guards secure, e-stop accessible, sensors normal, gauges in range, lubrication level, no unusual noise/vibration/heat, no loose components, area clear, abnormalities reported.",
      },
      {
        id: "ampm3-boundaries",
        title: "Operator boundaries are explicit",
        description:
          "Operators do NOT perform electrical work, major mechanical repair, hydraulic or pneumatic repair, safety-system work, calibration or programme changes. Anything beyond authorised basic care goes to maintenance.",
      },
      {
        id: "ampm3-training",
        title: "Operators trained and competence recorded",
        description:
          "Basic equipment function, safe cleaning, inspection points, abnormality recognition, lubrication basics, reporting, and safety and lockout requirements are trained and signed off.",
      },
      {
        id: "ampm3-standards",
        title: "One-point lessons and visual standards at the machine",
        description:
          "Cleaning and inspection standards, lubrication charts, gauge normal ranges and one-point lessons are visible at the asset — not filed in a folder.",
      },
    ],
  },
  {
    id: "ampm4",
    n: 4,
    title: "Abnormality Detection & Tagging",
    items: [
      {
        id: "ampm4-tags",
        title: "Red / yellow / green tagging system operating",
        description:
          "RED — immediate attention, potential safety issue or major failure. YELLOW — requires planned maintenance. GREEN — monitor, minor issue. Tags are physically applied and logged.",
      },
      {
        id: "ampm4-flow",
        title: "Abnormality flow is followed end to end",
        description:
          "Operator detects → tags and reports → maintenance assesses → decides run / plan / stop → corrective action → verification → tag removed and record closed.",
      },
      {
        id: "ampm4-response",
        title: "Response times defined by tag colour",
        description:
          "Red tags trigger an immediate maintenance assessment and a documented safe-to-run decision; yellow tags enter the planned schedule with an owner and due date; green tags are monitored and reviewed.",
      },
      {
        id: "ampm4-backlog",
        title: "Open tag backlog reviewed weekly",
        description:
          "Ageing of open tags is visible, overdue items are escalated and the backlog trend is a reviewed KPI rather than a hidden queue.",
      },
    ],
  },
  {
    id: "ampm5",
    n: 5,
    title: "Preventive Maintenance (Maintenance)",
    items: [
      {
        id: "ampm5-plan",
        title: "PM plan exists for every A and B asset",
        description:
          "Each PM task states type (inspection, cleaning, lubrication, adjustment, replacement, calibration, testing, predictive), frequency, owner, estimated hours, required parts, downtime need and safety requirements.",
      },
      {
        id: "ampm5-frequency",
        title: "Frequency framework applied consistently",
        description:
          "Shift/daily operator checks; weekly detailed inspection and lubrication; monthly mechanical/electrical, safety devices, belts, sensors, filters; quarterly detailed inspection, alignment, condition monitoring; semiannual major inspection, component replacement, calibration; annual overhaul and OEM inspections.",
      },
      {
        id: "ampm5-schedule",
        title: "PM schedule is planned, released and protected",
        description:
          "PM is scheduled with production, not squeezed into gaps. Work orders are released ahead of time with parts staged, and planned downtime is agreed rather than negotiated on the day.",
      },
      {
        id: "ampm5-wo",
        title: "Work orders record findings, parts and result",
        description:
          "Every PM work order captures technician, labour hours, parts replaced, findings, additional repairs required, equipment condition (pass / conditional / fail), next PM due and supervisor verification.",
      },
      {
        id: "ampm5-compliance",
        title: "PM compliance measured and >90%",
        description:
          "PM completion versus schedule is measured monthly. Missed PMs are treated as a deviation with a reason code, not silently rescheduled.",
      },
    ],
  },
  {
    id: "ampm6",
    n: 6,
    title: "Lubrication & Spare Parts",
    items: [
      {
        id: "ampm6-lube",
        title: "Lubrication programme documented per asset",
        description:
          "Each lubrication point lists location, lubricant and grade, quantity, frequency, application method, responsible person and last completion. Wrong lubricant, wrong quantity and missed points are the classic silent failure causes.",
      },
      {
        id: "ampm6-spares",
        title: "Critical spares identified and stocked",
        description:
          "Part name and number, criticality, min and current quantity, supplier, lead time, storage location and alternate part are recorded. Critical spares for A assets are held or contractually guaranteed.",
      },
      {
        id: "ampm6-minmax",
        title: "Min/max levels reviewed and stock-outs tracked",
        description:
          "Stock below minimum is visible and actioned. Stock-outs that extended a breakdown are logged as a finding, not absorbed.",
      },
    ],
  },
  {
    id: "ampm7",
    n: 7,
    title: "Breakdowns, Root Cause & Reliability",
    items: [
      {
        id: "ampm7-log",
        title: "Every breakdown is logged",
        description:
          "Occurrence time, reporter, failure mode, immediate cause, classification, downtime, response time, repair time, parts used and whether the fix was temporary or permanent.",
      },
      {
        id: "ampm7-classification",
        title: "Failures classified consistently",
        description:
          "Safety, quality, functional, minor, repeat and chronic. Repeat and chronic failures trigger engineering involvement rather than another repair.",
      },
      {
        id: "ampm7-rca",
        title: "Root-cause analysis performed where required",
        description:
          "Safety-related, repeat, chronic and high-downtime failures get a documented root cause, corrective action, owner, due date and verification of effectiveness.",
      },
      {
        id: "ampm7-temporary",
        title: "Temporary fixes have a permanent-fix due date",
        description:
          "A temporary repair is recorded as such with a planned permanent action. Temporary fixes without a due date are treated as open risk.",
      },
      {
        id: "ampm7-kpis",
        title: "Reliability KPIs reviewed monthly",
        description:
          "MTBF, MTTR, availability, planned versus emergency maintenance hours, PM compliance, open tag backlog, breakdown count and downtime hours are trended and reviewed by operations and maintenance together.",
      },
    ],
  },
  {
    id: "ampm8",
    n: 8,
    title: "Verification, Improvement & Governance",
    items: [
      {
        id: "ampm8-verify",
        title: "Work is verified before the asset returns to production",
        description:
          "Function test, safety devices checked, quality confirmed on first pieces, area cleaned, tags removed and supervisor sign-off recorded.",
      },
      {
        id: "ampm8-improve",
        title: "Chronic losses drive engineering improvement",
        description:
          "Recurring failures generate design, component or standard changes — improved parts, condition monitoring, error-proofing or revised operating conditions — and the change is verified over time.",
      },
      {
        id: "ampm8-standards",
        title: "AM and PM standards updated from findings",
        description:
          "Findings from breakdowns, tags and PM work orders feed back into check sheets, PM task content and frequency. The standards are living documents.",
      },
      {
        id: "ampm8-audit",
        title: "AM/PM audit performed at least annually",
        description:
          "Register accuracy, criticality, AM adoption, PM compliance, tag closure, spares, lubrication, RCA quality and KPI trends are audited with findings tracked to closure.",
      },
      {
        id: "ampm8-review",
        title: "Programme reviewed in the management review",
        description:
          "Equipment reliability performance, resourcing, spare investment and improvement pipeline are reviewed by site leadership with decisions recorded.",
      },
    ],
  },
];

export const AMPM_TOTAL_ITEMS = AMPM_PILLARS.reduce((n, p) => n + p.items.length, 0);
