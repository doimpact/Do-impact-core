export type EquipmentStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type EquipmentProject = {
  id: string;
  company_id: string;
  asset_name: string;
  asset_tag: string | null;
  vendor: string | null;
  line_area: string | null;
  po_number: string | null;
  contract_value: number | null;
  currency: string;
  stage: EquipmentStage;
  status: string;
  health: "green" | "yellow" | "red" | null;
  po_date: string | null;
  fat_date: string | null;
  delivery_date: string | null;
  sat_date: string | null;
  pq_date: string | null;
  handover_date: string | null;
  target_handover_date: string | null;
  cpk_target: number;
  oee_target: number;
  sustain_shifts: number;
  owner_id: string | null;
  maintenance_owner_id: string | null;
  sponsor_id: string | null;
  description: string | null;
  notes: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentChecklistItem = {
  id: string;
  project_id: string;
  stage: EquipmentStage;
  sort_order: number;
  label: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  evidence_url: string | null;
  notes: string | null;
};

export type EquipmentPunchItem = {
  id: string;
  project_id: string;
  title: string;
  severity: "low" | "medium" | "high";
  owner_id: string | null;
  due_date: string | null;
  status: "open" | "in_progress" | "closed";
  notes: string | null;
};

export type EquipmentPayment = {
  id: string;
  project_id: string;
  label: string;
  gate: number | null;
  percent: number;
  amount: number | null;
  released_at: string | null;
  sort_order: number;
};

export type EquipmentRampEntry = {
  id: string;
  project_id: string;
  entry_date: string;
  planned_pct: number | null;
  actual_pct: number | null;
  availability: number | null;
  performance: number | null;
  quality: number | null;
  mtbf_hours: number | null;
  mttr_hours: number | null;
  note: string | null;
};

export const STAGE_LABELS: Record<number, { short: string; full: string; milestone: string; blurb: string }> = {
  1: {
    short: "Design Freeze",
    full: "Design Freeze & Virtual Commissioning",
    milestone: "Design review sign-off",
    blurb: "Freeze 3D models, schematics, utility drops and safety ergonomics with the OEM. Test PLC code, robotics kinematics and control logic on a digital twin before physical build. Finalise spares criticality and early PM routines.",
  },
  2: {
    short: "FAT",
    full: "Factory Acceptance Testing",
    milestone: "FAT sign-off releases shipment",
    blurb: "Verify the machine at the vendor site against URS and FDS. Run test or surrogate material at rated cycle time to prove tolerances, interlocks, sensor feedback and fault recovery. Hold shipment until FAT is 100% signed off.",
  },
  3: {
    short: "Install (IQ)",
    full: "Site Prep, Delivery & Installation (IQ)",
    milestone: "Installation Qualification complete",
    blurb: "Complete foundations, electrical drops, pneumatics/chilled water, exhaust and enclosures before delivery. Rig, level and optically align, then document that installation matches mechanical, electrical, environmental and EHS spec.",
  },
  4: {
    short: "SAT / OQ",
    full: "Site Acceptance Testing & Commissioning (OQ)",
    milestone: "SAT sign-off / conditional acceptance",
    blurb: "Power up and test all subsystems, motion axes, light curtains, E-stops and sensor networks in the production environment, then run production-grade material at standard speed to trigger conditional acceptance.",
  },
  5: {
    short: "Validation (PQ)",
    full: "Process Validation & Industrialization (PQ)",
    milestone: "PQ / FAI / PPAP approval",
    blurb: "Prove process capability on full production runs, complete FAI (AS9102) or PPAP, publish digital work instructions, certify operator and maintenance training, and register the asset in CMMS.",
  },
  6: {
    short: "Ramp & OEE",
    full: "Controlled Ramp-Up & OEE Optimization",
    milestone: "Target OEE achieved",
    blurb: "Scale volume along a planned S-curve (20 → 50 → 80 → 100%). Track daily OEE split into Availability, Performance and Quality plus MTBF and MTTR, and stream PLC/CNC data to MES/SCADA.",
  },
  7: {
    short: "Handover",
    full: "Handover to Operations & Closeout",
    milestone: "Formal transfer to Operations",
    blurb: "Transfer asset ownership from Capital Engineering to Plant Operations once target OEE is sustained, the punch list is clear and maintenance is self-sufficient. Close out with a 6-month post-investment review vs the business case.",
  },
};

export const STAGE_COLORS: Record<number, string> = {
  1: "bg-slate-500 text-white",
  2: "bg-blue-500 text-white",
  3: "bg-cyan-600 text-white",
  4: "bg-indigo-500 text-white",
  5: "bg-amber-500 text-white",
  6: "bg-orange-500 text-white",
  7: "bg-emerald-500 text-white",
};

export const HEALTH_COLORS: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  on_track: "On track",
  at_risk: "At risk",
  delayed: "Delayed",
  on_hold: "On hold",
  complete: "Complete",
};

export const PUNCH_SEVERITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PUNCH_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
};

export const RAMP_STEPS = [20, 50, 80, 100];

export const CRITICAL_DRIVERS: { title: string; body: string }[] = [
  {
    title: "Contractual alignment",
    body: "Structure vendor payments around hard gates — 30% PO, 30% FAT, 30% SAT, 10% final acceptance after PQ.",
  },
  {
    title: "Early maintenance involvement",
    body: "Bring shop-floor technicians into Design Freeze and FAT so ownership starts months before delivery, not on installation day.",
  },
  {
    title: "Traceability & telemetry",
    body: "Require open industrial protocols (OPC UA, MTConnect) in the PO so machine condition data connects to plant systems from day one.",
  },
];

export function oeeOf(r: EquipmentRampEntry): number | null {
  if (r.availability == null || r.performance == null || r.quality == null) return null;
  return Math.round((r.availability / 100) * (r.performance / 100) * (r.quality / 100) * 1000) / 10;
}

export function money(v: number | null | undefined, currency = "USD") {
  if (v == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}
