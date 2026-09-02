import type { ModuleTour } from "@/lib/help-registry";

export const MODULE_TOURS: ModuleTour[] = [
  {
    id: "daily-management",
    route: "/oms/daily",
    title: "Daily Management tour",
    description: "A 60-second walkthrough of SQDP boards, friction indicators, and 3C escalation.",
    steps: [
      {
        targetSelector: "[data-tour='daily-boards']",
        title: "Boards",
        body: "Each board is a separate SQDP view — for example Safety, Quality, Delivery, or a custom area board. The consolidated roll-up on top turns red if any board is red that day.",
        position: "bottom",
      },
      {
        targetSelector: "[data-tour='daily-calendar-grid']",
        title: "Full-month calendar",
        body: "Every day is a cell. Green means the indicator was met, yellow is a watch, red triggers a 3C escalation. Click a day to cycle Green → Red → Clear.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='daily-friction-band']",
        title: "Friction indicators",
        body: "These are leading signals — kit readiness, tool availability, RFI aging — the things that predict whether today will run smoothly.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='daily-3c-list']",
        title: "3C escalation",
        body: "A red cell becomes a closed-loop 3C. The owner, containment and countermeasure stay visible until the problem is solved.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='daily-gemba']",
        title: "Gemba walks",
        body: "Record what you saw on the floor, assign depth and owner, and link observations back to actions.",
        position: "left",
      },
    ],
  },
  {
    id: "siop",
    route: "/oms/siop",
    title: "SIOP tour",
    description: "How demand, capacity, supply and long-lead materials come together in one monthly cycle.",
    steps: [
      {
        targetSelector: "[data-tour='siop-cycle-list']",
        title: "SIOP cycles",
        body: "A cycle is one monthly SIOP run. Pick an existing cycle or create a new one to start the next review.",
        position: "right",
      },
      {
        targetSelector: "[data-tour='siop-steps']",
        title: "Five-step process",
        body: "The numbered steps guide the meeting cadence: Demand → Capacity → Scenarios → Executive S&OP → Execution, plus long-lead materials and OSP.",
        position: "bottom",
      },
      {
        targetSelector: "[data-tour='siop-step-1']",
        title: "Step 1 — Demand Review",
        body: "Capture firm inductions, weighted pipeline and expected unscheduled maintenance spikes by product line and workscope.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='siop-step-2']",
        title: "Step 2 — Capacity & Supply",
        body: "Match labor, facility, tooling and material constraints against the demand plan to find the bottleneck before it bites.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='siop-step-6']",
        title: "Step 6 — Long-Lead Materials",
        body: "Track parts with lead times longer than the planning horizon so procurement and engineering stay ahead of the curve.",
        position: "top",
      },
    ],
  },
  {
    id: "waterfall",
    route: "/strategy/waterfall",
    title: "Strategy Waterfall tour",
    description: "Bridge baseline to target with initiative-level value levers and linked actions.",
    steps: [
      {
        targetSelector: "[data-tour='waterfall-bridge-list']",
        title: "Bridges",
        body: "Each waterfall is a bridge from a baseline number to a target number — for example revenue, cost or cash.",
        position: "right",
      },
      {
        targetSelector: "[data-tour='waterfall-chart']",
        title: "Waterfall chart",
        body: "The bars show headwinds and gains in sequence. Risk-adjusted view applies realization probability so you see what is likely, not just planned.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='waterfall-levers']",
        title: "Value levers",
        body: "Each lever is an initiative or headwind with an owner, KPIs, monthly benefits and linked actions.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='waterfall-promote']",
        title: "Promote to objective",
        body: "When a lever is ready, promote it into a strategic objective so it gets tracked in the execution timeline and actions module.",
        position: "left",
      },
      {
        targetSelector: "[data-tour='waterfall-compare']",
        title: "Compare all bridges",
        body: "Switch on Compare all to see a rolled-up view across every active bridge in the company.",
        position: "bottom",
      },
    ],
  },
  {
    id: "problem-solver",
    route: "/actions/problem-solver",
    title: "Problem Solver tour",
    description: "Match the method to the pain, then work the problem inside one workspace.",
    steps: [
      {
        targetSelector: "[data-tour='ps-cards']",
        title: "Methods",
        body: "A3, 8D, DMAIC, Fishbone, 5 Whys and Aviation MRO — pick the structured method that fits the problem you are solving.",
        position: "bottom",
      },
      {
        targetSelector: "[data-tour='ps-toolkit']",
        title: "Which tool for which problem?",
        body: "Answer a few plain-English questions to narrow down the right method before you open a template.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='ps-symptom-matrix']",
        title: "Symptom → tool matrix",
        body: "See which tools are primary or supporting for the symptom you actually feel on the floor.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='ps-flows']",
        title: "Problem flows",
        body: "Flows connect a symptom through root cause to the right method and a linked action, so nothing gets lost between tools.",
        position: "left",
      },
    ],
  },
  {
    id: "contracts",
    route: "/commercial/contracts",
    title: "Contracts tour",
    description: "Agreements, bid review and governance in one place.",
    steps: [
      {
        targetSelector: "[data-tour='contracts-tabs']",
        title: "Contracts tabs",
        body: "Switch between signed contracts, bid and contract review, registers, and the process guide.",
        position: "bottom",
      },
      {
        targetSelector: "[data-tour='contracts-list']",
        title: "Contract register",
        body: "Signed and in-flight customer agreements with status, value, dates and linked documents.",
        position: "top",
      },
      {
        targetSelector: "[data-tour='contracts-tab-review']",
        title: "Bid & contract review",
        body: "Gate 0 to Gate 4: opportunity qualification, terms and risk review, cross-functional sign-off, exception handling and post-award handover.",
        position: "bottom",
      },
      {
        targetSelector: "[data-tour='contracts-tab-registers']",
        title: "Registers",
        body: "Decisions, risks, assumptions and issues are captured in registers so they survive any personnel change.",
        position: "bottom",
      },
    ],
  },
];

export function getTourForRoute(route: string): ModuleTour | undefined {
  return MODULE_TOURS.find((t) => t.route === route);
}

export function listTours(): ModuleTour[] {
  return MODULE_TOURS;
}
