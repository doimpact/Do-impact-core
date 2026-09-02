// Manufacturing site safety management framework — tickable maturity checklist.
// Stable ids — do NOT rename; user progress is keyed on them.

import type { Pillar } from "./compliance-part145";

export const SAFETY_PILLARS: Pillar[] = [
  {
    id: "saf1",
    n: 1,
    title: "Leadership & Accountability",
    items: [
      {
        id: "saf1-expectations",
        title: "Safety expectations set by the site leader",
        description:
          "The site leader owns overall safety performance, sets expectations publicly, reviews performance monthly, provides resources for corrective actions and holds leaders accountable for overdue actions.",
      },
      {
        id: "saf1-stopwork",
        title: "Stop-work authority reinforced",
        description:
          "Every employee has, and knows they have, stop-work authority for imminent danger. Leaders reinforce it rather than second-guess it. Restart decisions are documented.",
      },
      {
        id: "saf1-roles",
        title: "Roles and responsibilities documented",
        description:
          "Site leader, EHS/safety manager, supervisors and employees each have written safety responsibilities. Supervisors own safety performance in their areas.",
      },
      {
        id: "saf1-resources",
        title: "Safety considered in operational decisions",
        description:
          "Production, staffing, layout and capital decisions include a safety review. Resources are released to close high-risk actions without a business case debate.",
      },
    ],
  },
  {
    id: "saf2",
    n: 2,
    title: "Hazard Identification",
    items: [
      {
        id: "saf2-reporting",
        title: "One simple reporting mechanism exists",
        description:
          "A single route covers unsafe conditions, unsafe behaviour, near misses, injuries, environmental concerns, equipment issues, fire/life safety, ergonomics, chemical exposure and improvement suggestions.",
      },
      {
        id: "saf2-fields",
        title: "Reports capture the required detail",
        description:
          "Date/time, location, department, reporter, description, photo, immediate action, potential consequence, risk rating, corrective action, owner, due date, completion date and verification of effectiveness.",
      },
      {
        id: "saf2-anonymous",
        title: "Anonymous reporting available",
        description: "Employees can report without naming themselves where that is practical for the site.",
      },
      {
        id: "saf2-top10",
        title: "Top site risks identified and maintained",
        description: "The top 10 site risks are known, ranked by potential severity, and refreshed as conditions change.",
      },
    ],
  },
  {
    id: "saf3",
    n: 3,
    title: "Risk Assessment",
    items: [
      {
        id: "saf3-matrix",
        title: "One consistent risk matrix across the site",
        description:
          "Risk = Severity (1–5) × Likelihood (1–5). 1–4 Low, 5–9 Moderate, 10–16 High, 17–25 Critical. Thresholds calibrated to site hazards and applicable regulatory requirements.",
      },
      {
        id: "saf3-jsa",
        title: "JSAs completed for high-risk work",
        description:
          "Machine operation and setup, maintenance, LOTO, hot work, chemicals, forklifts, confined space, electrical, working at heights, heavy lifting, difficult ergonomics, non-routine work and new processes.",
      },
      {
        id: "saf3-jsa-review",
        title: "JSAs reviewed on triggers",
        description:
          "Reviewed whenever equipment, process, materials or work methods change, after an incident or near miss, and when employees identify a new hazard.",
      },
      {
        id: "saf3-moc",
        title: "Management of Change in force",
        description:
          "Safety review is mandatory before new equipment, machine modification, rate changes, new chemicals or materials, layout or electrical changes, staffing/method changes, automation, guarding changes, outsourcing or a new process goes live.",
      },
    ],
  },
  {
    id: "saf4",
    n: 4,
    title: "Hazard Controls",
    items: [
      {
        id: "saf4-hierarchy",
        title: "Hierarchy of controls applied to every action",
        description:
          "Elimination, substitution, engineering, administrative, then PPE. Ask \"can we engineer this hazard out?\" before \"let's train people to be careful.\"",
      },
      {
        id: "saf4-interim",
        title: "Interim controls used while permanent fixes are built",
        description: "High-risk findings get an immediate control (barricade, restriction, exclusion zone) the same day.",
      },
      {
        id: "saf4-specific",
        title: "Actions are specific, not exhortations",
        description:
          "\"Install fixed pedestrian barrier between forklift aisle and pedestrian walkway by 15 September\" — not \"be careful\".",
      },
    ],
  },
  {
    id: "saf5",
    n: 5,
    title: "Employee Reporting & Engagement",
    items: [
      {
        id: "saf5-champions",
        title: "Safety champions in each department",
        description: "An hourly safety representative per department, visible to the workforce.",
      },
      {
        id: "saf5-committee",
        title: "Safety committee meets monthly",
        description: "Operations, maintenance, engineering, quality, EHS, hourly employees and management represented.",
      },
      {
        id: "saf5-recognition",
        title: "Recognition reinforces risk reduction",
        description:
          "Employees are recognised for reporting serious hazards, identifying near misses, improving processes and helping others work safely — not simply for rule-following or for zero reports.",
      },
      {
        id: "saf5-feedback",
        title: "Reporters get feedback",
        description: "Every reporter learns what happened to their report. Nothing kills a reporting rate faster than silence.",
      },
    ],
  },
  {
    id: "saf6",
    n: 6,
    title: "Inspections & Safety Walks",
    items: [
      {
        id: "saf6-daily",
        title: "Daily supervisor walk (5–15 min)",
        description:
          "Immediate hazards, machine guarding, PPE, housekeeping, material storage, walking/working surfaces, exits, LOTO conditions, chemical storage, forklift/pedestrian interactions, ergonomics and recent changes.",
      },
      {
        id: "saf6-weekly",
        title: "Weekly department walk (30–60 min)",
        description:
          "Led by the supervisor with at least one operator. Conditions, work practices, previous actions, near misses, repeated hazards, new equipment, employee concerns and emergency preparedness.",
      },
      {
        id: "saf6-monthly",
        title: "Monthly leadership walk",
        description:
          "Site leader, operations, EHS, maintenance, engineering, quality, department supervisor and an hourly employee. Purpose is to find system weaknesses, not to catch people out.",
      },
      {
        id: "saf6-outputs",
        title: "Every walk produces four outputs",
        description: "Good practices captured, hazards documented, risk rated, and corrective actions with owner, due date and verification.",
      },
    ],
  },
  {
    id: "saf7",
    n: 7,
    title: "Incident Management",
    items: [
      {
        id: "saf7-nearmiss",
        title: "Near-miss programme live",
        description:
          "Near misses are treated as free lessons and investigated: what happened, what could have happened, why, what prevented a worse outcome, what control changes, and could it happen elsewhere.",
      },
      {
        id: "saf7-investigation",
        title: "Investigation process defined and used",
        description:
          "Secure area, medical response, preserve evidence, interview, document facts, direct and contributing causes, root/system causes, corrective actions, owners, due dates, effectiveness verification.",
      },
      {
        id: "saf7-systemcause",
        title: "Investigations go past \"failed to follow procedure\"",
        description:
          "Was the procedure available, practical, trained? Was the machine different? Was there production pressure? Was supervision adequate? Were engineering controls available? Had the hazard been reported before?",
      },
      {
        id: "saf7-spread",
        title: "Lessons spread to similar equipment and areas",
        description: "If one machine has a guarding problem, every similar machine is inspected.",
      },
      {
        id: "saf7-escalation",
        title: "Four-level escalation understood",
        description:
          "L1 immediate correction, L2 department corrective action, L3 high-risk escalation with stop/restrict plus interim controls, L4 critical risk — stop work until adequately controlled.",
      },
    ],
  },
  {
    id: "saf8",
    n: 8,
    title: "Metrics & Continuous Improvement",
    items: [
      {
        id: "saf8-leading",
        title: "Leading indicators tracked",
        description:
          "Walks completed, hazards reported, near misses reported, actions closed on time, high-risk hazards eliminated, JSAs completed, training completion, PM completion, guarding inspections, LOTO audits, drills, suggestions, repeat findings.",
      },
      {
        id: "saf8-lagging",
        title: "Lagging indicators tracked",
        description: "Recordables, lost-time cases, restricted duty, first aid, near misses, property damage and workers' compensation cost.",
      },
      {
        id: "saf8-dashboard",
        title: "Monthly dashboard reviewed with leadership",
        description:
          "Performance plus leading indicators, top 5 risks and repeat findings. Leadership focuses on repeat findings and open high-risk actions.",
      },
      {
        id: "saf8-incentives",
        title: "No incentives that suppress reporting",
        description:
          "\"Zero incidents\" is not the only measure of success. A department reporting more hazards may have a healthier culture than one reporting none.",
      },
      {
        id: "saf8-rhythm",
        title: "Operating rhythm in place",
        description:
          "Weekly (Mon review, Tue–Thu walks and corrections, Fri lessons), monthly (leadership review, focused risk assessment, management walk, trend analysis), quarterly programme review and an annual safety strategy with objectives and a roadmap.",
      },
      {
        id: "saf8-training",
        title: "Training matrix maintained by job",
        description:
          "General safety, PPE, emergency response, machine guarding, LOTO, forklift, hazard communication, ergonomics, incident reporting and job-specific procedures, with initial, refresher and expiry tracking.",
      },
    ],
  },
];

export const SAFETY_TOTAL_ITEMS = SAFETY_PILLARS.reduce((n, p) => n + p.items.length, 0);
