import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Download, Eye, EyeOff, FileText, Loader2, Pencil, RotateCcw, Save, StickyNote, X } from "lucide-react";
import { generateBoardPptx } from "@/lib/board-pptx";
import { generateBoardPdf } from "@/lib/board-pdf";
import type { Block, DriverLever, KpiChart, Page, PlanRow } from "@/lib/board-report-blocks";
import { KPI_MONTHS, assignIds, blockLabel, tableRowKey } from "@/lib/board-report-blocks";
import { filterKeyKpis } from "@/lib/key-kpis";
import { EMPTY_LAYOUT, applyLayout, isLayoutEmpty, normalizeLayout, type ReportLayout } from "@/lib/board-report-layout";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { CustomWaterfallEditor } from "@/components/report/custom-waterfall-editor";
import { buildRows as buildWfRows, chartExtent as wfExtent, loadBridges, saveBridges, type CustomBridge } from "@/lib/custom-waterfall";
import { bridgesToCustomWaterfalls } from "@/lib/waterfall-report";
import { loadWfViewPrefs, saveWfViewPrefs, type WfViewPrefs } from "@/lib/waterfall-view-prefs";
import { isObjectiveNotStarted, isTaskNotStarted, isWorkstreamNotStarted, notStartedLeverIds } from "@/lib/not-started";

import { useActiveCompany } from "@/hooks/use-companies";




export const Route = createFileRoute("/_authenticated/report/board")({
  head: () => ({ meta: [{ title: "Board — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ReportPage,
  errorComponent: ({ error }) => <div className="p-8 text-red-600">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type Section =
  | "cover"
  | "strategy"
  | "value_driver"
  | "hoshin"
  | "waterfall"
  | "custom_waterfall"
  | "restructuring"
  | "value_delivered"
  | "initiatives"
  | "a3"
  | "capex"
  | "commercial"
  | "plan_pipeline"
  | "stakeholders"
  | "voc"
  | "framework"
  | "sqdp"
  | "siop"
  | "siop_long_lead"
  | "supply_chain"
  | "npi"
  | "compliance"
  | "shopfloor"
  | "calendar"
  | "escalations"
  | "kpis"
  | "pillar_actions"
  | "pillar_retro"
  | "people"
  | "tasks";

const SECTION_META: { id: Section; label: string; desc: string }[] = [
  { id: "cover", label: "Cover", desc: "Title page with company and period." },
  // Strategy & Transformation
  { id: "strategy", label: "Strategy foundation", desc: "Themes and 3-year objectives roadmap." },
  { id: "value_driver", label: "Value-driver tree", desc: "Strategic themes as levers with linked objectives." },
  { id: "hoshin", label: "Hoshin Kanri X-Matrix", desc: "Long-term & annual objectives, KPIs and correlations." },
  { id: "waterfall", label: "Waterfall", desc: "Portfolio roll-up and per-bridge summary of value levers." },
  { id: "custom_waterfall", label: "Custom waterfall", desc: "Ad-hoc bridge chart(s) with levers and comments built here." },
  { id: "restructuring", label: "Restructuring", desc: "Active restructuring project(s), governance, milestones and risks." },
  { id: "value_delivered", label: "Value Delivered", desc: "36-month plan vs actual benefits from objectives." },
  { id: "initiatives", label: "Progress (Workstreams)", desc: "Kanban of workstreams by stage (L1 → L4) with progress and values." },
  { id: "a3", label: "A3 problem solving", desc: "Active A3s with status and problem." },
  { id: "capex", label: "Turnaround Finance portfolio", desc: "Projects by gate, spend vs budget, value realization." },
  // Commercial & Growth
  { id: "commercial", label: "Commercial pipeline", desc: "Pipeline vs budget and top opportunities." },
  { id: "plan_pipeline", label: "Plan vs pipeline", desc: "Monthly target vs booked backlog + weighted pipeline." },
  { id: "stakeholders", label: "Stakeholders & accounts", desc: "Accounts by criticality and recent touchpoints." },
  { id: "voc", label: "Voice of the Customer", desc: "NPS/CSAT trend, what works well, what can improve, open VoC actions." },
  // Operating Management System
  { id: "framework", label: "Operations framework status", desc: "Red/Yellow/Green status per pillar." },
  { id: "sqdp", label: "Operations SQDP", desc: "Green/red percentage per category (rolling window)." },
  { id: "siop", label: "SIOP cycle", desc: "Latest S&OP cycle decisions, capacity gaps, KPIs." },
  { id: "siop_long_lead", label: "SIOP long-lead & OSP", desc: "At-risk long-lead materials and outside-processing jobs." },
  { id: "supply_chain", label: "Supply chain", desc: "Spend by category, supplier performance, risk, contracts and escalations." },
  { id: "npi", label: "NPI portfolio", desc: "AS9145 gate distribution, checklist completion, risks." },
  { id: "compliance", label: "Compliance readiness", desc: "Part 145 checklist completion and latest snapshots." },
  { id: "shopfloor", label: "Shop-floor flow", desc: "WIP by line and gate, throughput and bottlenecks." },
  { id: "calendar", label: "Audit / events calendar", desc: "Upcoming audits and key events (next 60 days)." },
  { id: "escalations", label: "Operations 3C escalations", desc: "Open concerns, causes, countermeasures." },
  { id: "kpis", label: "Operations KPIs", desc: "Latest actuals vs targets by pillar." },
  { id: "pillar_actions", label: "Pillar actions", desc: "Open tasks grouped by pillar board." },
  { id: "pillar_retro", label: "Pillar retrospective", desc: "Working well / can improve notes." },
  // People
  { id: "people", label: "People capability", desc: "Coverage, expiring certifications, dev plans." },
  // Other
  { id: "tasks", label: "Tasks & actions", desc: "Filterable master list of tasks." },
];



function ReportPage() {
  const now = new Date();
  const [companyName, setCompanyName] = useState("DO.Impact");
  const [periodLabel, setPeriodLabel] = useState(
    now.toLocaleString("en-US", { month: "long", year: "numeric" }) + " Board Report",
  );
  const [sections, setSections] = useState<Record<Section, boolean>>(
    Object.fromEntries(SECTION_META.map((s) => [s.id, true])) as Record<Section, boolean>,
  );
  const [taskFilter, setTaskFilter] = useState<"open" | "all" | "closed">("open");
  const [sqdpDays, setSqdpDays] = useState(90);
  const [generating, setGenerating] = useState(false);
  const [generatingPptx, setGeneratingPptx] = useState(false);
  const [customBridges, setCustomBridges] = useState<CustomBridge[]>(() => loadBridges());
  useEffect(() => { saveBridges(customBridges); }, [customBridges]);
  const [wfPrefs, setWfPrefs] = useState<WfViewPrefs>(() => loadWfViewPrefs());
  const updateWfPref = <K extends keyof WfViewPrefs>(k: K, v: WfViewPrefs[K]) => {
    setWfPrefs((p) => { const next = { ...p, [k]: v }; saveWfViewPrefs(next); return next; });
  };


  // ---- editable-report layout (hidden blocks, deleted rows/cols, notes, order)
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState<ReportLayout>(EMPTY_LAYOUT);
  const [layoutRowId, setLayoutRowId] = useState<string | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("board_report_layouts")
        .select("id, layout")
        .eq("is_default", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      setLayoutRowId(data.id);
      setLayout(normalizeLayout(data.layout));
    })();
    return () => { cancelled = true; };
  }, []);

  const dmFrom = format(subDays(now, sqdpDays - 1), "yyyy-MM-dd");

  const dmTo = format(now, "yyyy-MM-dd");

  const pillarsQ = useQuery({
    queryKey: ["r-pillars"],
    queryFn: async () => (await supabase.from("pillars").select("id, key, name, health, tagline").order("sort_order")).data ?? [],
  });

  const strategyQ = useQuery({
    queryKey: ["r-strategy"],
    queryFn: async () => (await supabase.from("strategies").select("*").limit(1).maybeSingle()).data,
  });
  const themesQ = useQuery({
    queryKey: ["r-themes"],
    queryFn: async () => (await supabase.from("strategic_themes").select("*").is("archived_at", null).order("sort_order")).data ?? [],
  });
  const objectivesQ = useQuery({
    queryKey: ["r-objectives"],
    queryFn: async () => (await supabase.from("strategic_objectives").select("*, strategic_themes(title)").is("archived_at", null).order("horizon_year")).data ?? [],
  });
  const initiativesQ = useQuery({
    queryKey: ["s-initiatives"],
    queryFn: async () => (await supabase.from("initiatives").select("*").is("archived_at", null)).data ?? [],
  });
  const a3Q = useQuery({
    queryKey: ["r-a3"],
    queryFn: async () => (await supabase.from("a3_reports").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const oppsQ = useQuery({
    queryKey: ["s-opps"],
    queryFn: async () => (await supabase.from("opportunities").select("*, accounts(name)").eq("archived", false).order("value", { ascending: false })).data ?? [],
  });
  const targetsQ = useQuery({
    queryKey: ["r-targets-all"],
    queryFn: async () => (await supabase.from("growth_targets").select("*").order("year").order("month")).data ?? [],
  });
  const backlogQ = useQuery({
    queryKey: ["r-backlog"],
    queryFn: async () => (await supabase.from("booked_backlog").select("*").order("year").order("month")).data ?? [],
  });
  const oppMonthlyQ = useQuery({
    queryKey: ["r-opp-monthly"],
    queryFn: async () => (await supabase.from("opportunity_monthly_values").select("*")).data ?? [],
  });
  const dmMarksQ = useQuery({
    queryKey: ["r-sqdp", dmFrom, dmTo],
    queryFn: async () => (await supabase.from("dm_marks").select("*").gte("mark_date", dmFrom).lte("mark_date", dmTo)).data ?? [],
  });
  const escQ = useQuery({
    queryKey: ["r-3c"],
    queryFn: async () => (await supabase.from("dm_escalations").select("*").neq("status", "closed").order("occurred_on", { ascending: false })).data ?? [],
  });
  const kpisQ = useQuery({
    queryKey: ["s-kpis"],
    queryFn: async () => (await supabase.from("kpis").select("*, pillars(name)")).data ?? [],
  });
  const kpiValsQ = useQuery({
    queryKey: ["s-kpi-vals"],
    queryFn: async () => (await supabase.from("kpi_values").select("*").order("period_start", { ascending: false })).data ?? [],
  });
  const tasksQ = useQuery({
    queryKey: ["r-tasks"],
    queryFn: async () => (await supabase.from("tasks").select("*, pillars(name)").order("due_date", { ascending: true, nullsFirst: false })).data ?? [],
  });
  const notesQ = useQuery({
    queryKey: ["r-notes"],
    queryFn: async () => (await supabase.from("pillar_notes").select("*").order("position")).data ?? [],
  });
  const empQ = useQuery({
    queryKey: ["s-emp"],
    queryFn: async () => (await supabase.from("employees").select("id, role_id")).data ?? [],
  });
  const empSkQ = useQuery({
    queryKey: ["s-empsk"],
    queryFn: async () => (await supabase.from("employee_skills").select("employee_id, skill_id, level")).data ?? [],
  });
  const reqsQ = useQuery({
    queryKey: ["s-reqs"],
    queryFn: async () => (await supabase.from("role_requirements").select("role_id, skill_id, required_level")).data ?? [],
  });
  const certsQ = useQuery({
    queryKey: ["r-certs"],
    queryFn: async () => (await supabase.from("certifications").select("*, employees(first_name, last_name), skills(name)").not("expires_on", "is", null).order("expires_on")).data ?? [],
  });
  const devQ = useQuery({
    queryKey: ["r-dev"],
    queryFn: async () => (await supabase.from("development_plans").select("*, employees(first_name, last_name), skills(name)").neq("status", "completed").order("target_date", { ascending: true })).data ?? [],
  });

  const capexQ = useQuery({
    queryKey: ["r-capex"],
    queryFn: async () => (await supabase.from("capex_projects" as never).select("*").is("archived_at", null).order("created_at", { ascending: false })).data ?? [],
  });
  const capexVRQ = useQuery({
    queryKey: ["r-capex-vr"],
    queryFn: async () => (await supabase.from("capex_value_realization" as never).select("*")).data ?? [],
  });
  const siopCyclesQ = useQuery({
    queryKey: ["r-siop-cycles"],
    queryFn: async () => (await supabase.from("siop_cycles" as never).select("*").order("cycle_month", { ascending: false })).data ?? [],
  });
  const siopDecisionsQ = useQuery({
    queryKey: ["r-siop-decisions"],
    queryFn: async () => (await supabase.from("siop_decisions" as never).select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const siopKpisQ = useQuery({
    queryKey: ["r-siop-kpis"],
    queryFn: async () => (await supabase.from("siop_kpis" as never).select("*")).data ?? [],
  });
  const siopCapacityQ = useQuery({
    queryKey: ["r-siop-capacity"],
    queryFn: async () => (await supabase.from("siop_capacity" as never).select("*")).data ?? [],
  });
  const activeCompanyQ = useActiveCompany();
  const activeCompanyId = activeCompanyQ.data?.company_id ?? null;
  const waterfallBridgesQ = useQuery({
    queryKey: ["r-wf-bridges", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () =>
      (await supabase.from("waterfall_bridges" as never).select("*").eq("company_id", activeCompanyId!)).data ?? [],
  });
  const wfBridgeIds = ((waterfallBridgesQ.data ?? []) as { id: string }[]).map((b) => b.id);
  const waterfallItemsQ = useQuery({
    queryKey: ["r-wf-items", wfBridgeIds.join(",")],
    enabled: wfBridgeIds.length > 0,
    queryFn: async () =>
      (await supabase.from("waterfall_items" as never).select("*").in("bridge_id", wfBridgeIds)).data ?? [],
  });


  const hoshinItemsQ = useQuery({
    queryKey: ["r-hoshin-items"],
    queryFn: async () => (await supabase.from("hoshin_items" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const hoshinCorrQ = useQuery({
    queryKey: ["r-hoshin-corr"],
    queryFn: async () => (await supabase.from("hoshin_correlations" as never).select("*")).data ?? [],
  });
  const restructProjectsQ = useQuery({
    queryKey: ["s-rest-proj"],
    queryFn: async () => (await supabase.from("restructuring_projects" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const restructItemsQ = useQuery({
    queryKey: ["s-rest-items"],
    queryFn: async () => (await supabase.from("restructuring_items" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const restructMembersQ = useQuery({
    queryKey: ["r-rest-members"],
    queryFn: async () => (await supabase.from("restructuring_members" as never).select("*")).data ?? [],
  });
  const monthlyBenefitsQ = useQuery({
    queryKey: ["s-obj-benefits"],
    queryFn: async () => (await supabase.from("objective_monthly_benefits" as never).select("*")).data ?? [],
  });
  const accountsQ = useQuery({
    queryKey: ["r-accounts"],
    queryFn: async () => (await supabase.from("accounts" as never).select("*")).data ?? [],
  });
  const touchpointsQ = useQuery({
    queryKey: ["r-touchpoints"],
    queryFn: async () => (await supabase.from("stakeholder_touchpoints" as never).select("*").order("scheduled_at", { ascending: false }).limit(50)).data ?? [],
  });
  const vocNotesQ = useQuery({
    queryKey: ["r-voc-notes"],
    queryFn: async () => (await (supabase as any).from("voc_notes").select("*").is("archived_at", null).order("position", { ascending: true })).data ?? [],
  });
  const vocMetricsQ = useQuery({
    queryKey: ["r-voc-metrics"],
    queryFn: async () => (await (supabase as any).from("voc_metrics").select("*").is("archived_at", null).order("period", { ascending: true })).data ?? [],
  });
  const vocTasksQ = useQuery({
    queryKey: ["r-voc-tasks"],
    queryFn: async () => (await (supabase as any).from("voc_tasks").select("*").is("archived_at", null).order("position", { ascending: true })).data ?? [],
  });
  const calendarQ = useQuery({
    queryKey: ["r-calendar"],
    queryFn: async () => (await supabase.from("calendar_events" as never).select("*").order("event_date", { ascending: true })).data ?? [],
  });
  const wfActionsQ = useQuery({

    queryKey: ["r-wf-actions"],
    queryFn: async () => (await (supabase as any).from("objective_actions").select("status,archived_at,objective_id,waterfall_item_id")).data ?? [],
  });
  const wfLeverBenefitsQ = useQuery({
    queryKey: ["r-wf-lever-benefits"],
    queryFn: async () => (await (supabase as any).from("waterfall_item_monthly_benefits").select("item_id,actual")).data ?? [],
  });


  const npiProjectsQ = useQuery({
    queryKey: ["s-npi-proj"],
    queryFn: async () => (await supabase.from("npi_projects" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const npiChecklistQ = useQuery({
    queryKey: ["r-npi-check"],
    queryFn: async () => (await supabase.from("npi_gate_checklist" as never).select("*")).data ?? [],
  });
  const npiRisksQ = useQuery({
    queryKey: ["s-npi-risks"],
    queryFn: async () => (await supabase.from("npi_risks" as never).select("*")).data ?? [],
  });
  const complianceSnapsQ = useQuery({
    queryKey: ["s-compliance"],
    queryFn: async () => (await supabase.from("compliance_snapshots" as never).select("*").order("created_at", { ascending: false }).limit(5)).data ?? [],
  });
  const shopLinesQ = useQuery({
    queryKey: ["s-shop-lines"],
    queryFn: async () => (await supabase.from("aps_value_streams" as never).select("*")).data ?? [],
  });

  const shopGatesQ = useQuery({
    queryKey: ["s-shop-gates"],
    queryFn: async () => (await supabase.from("shop_floor_gates" as never).select("*")).data ?? [],
  });
  const shopPartsQ = useQuery({
    queryKey: ["s-shop-parts"],
    queryFn: async () => (await supabase.from("shop_floor_parts" as never).select("*")).data ?? [],
  });
  const siopLongLeadQ = useQuery({
    queryKey: ["s-siop-ll"],
    queryFn: async () => (await supabase.from("siop_long_lead_materials" as never).select("*")).data ?? [],
  });
  const siopOspQ = useQuery({
    queryKey: ["s-siop-osp"],
    queryFn: async () => (await supabase.from("siop_osp_jobs" as never).select("*")).data ?? [],
  });

  // ---- Supply chain (SPMS)
  const scCategoriesQ = useQuery({
    queryKey: ["r-sc-categories"],
    queryFn: async () => (await supabase.from("sc_categories" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const scSuppliersQ = useQuery({
    queryKey: ["r-sc-suppliers"],
    queryFn: async () => (await supabase.from("sc_suppliers" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const scSegmentsQ = useQuery({
    queryKey: ["r-sc-segments"],
    queryFn: async () => (await supabase.from("sc_segments" as never).select("*")).data ?? [],
  });
  const scScorecardsQ = useQuery({
    queryKey: ["r-sc-scorecards"],
    queryFn: async () => (await supabase.from("sc_scorecards" as never).select("*").is("archived_at", null).order("period_month", { ascending: false })).data ?? [],
  });
  const scScoresQ = useQuery({
    queryKey: ["r-sc-scores"],
    queryFn: async () => (await supabase.from("sc_scorecard_scores" as never).select("*")).data ?? [],
  });
  const scRiskTypesQ = useQuery({
    queryKey: ["r-sc-risk-types"],
    queryFn: async () => (await supabase.from("sc_risk_types" as never).select("*")).data ?? [],
  });
  const scRisksQ = useQuery({
    queryKey: ["r-sc-risks"],
    queryFn: async () => (await supabase.from("sc_risks" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const scContractsQ = useQuery({
    queryKey: ["r-sc-contracts"],
    queryFn: async () => (await supabase.from("sc_contracts" as never).select("*").is("archived_at", null)).data ?? [],
  });
  const scEscalationsQ = useQuery({
    queryKey: ["r-sc-escalations"],
    queryFn: async () => (await supabase.from("sc_escalations" as never).select("*").is("archived_at", null)).data ?? [],
  });

  const queries = [pillarsQ, strategyQ, themesQ, objectivesQ, initiativesQ, a3Q, oppsQ, targetsQ, backlogQ, oppMonthlyQ, dmMarksQ, escQ, kpisQ, kpiValsQ, tasksQ, notesQ, empQ, empSkQ, reqsQ, certsQ, devQ, capexQ, capexVRQ, siopCyclesQ, siopDecisionsQ, siopKpisQ, siopCapacityQ, waterfallBridgesQ, waterfallItemsQ, hoshinItemsQ, hoshinCorrQ, restructProjectsQ, restructItemsQ, restructMembersQ, monthlyBenefitsQ, accountsQ, touchpointsQ, calendarQ, npiProjectsQ, npiChecklistQ, npiRisksQ, complianceSnapsQ, shopLinesQ, shopGatesQ, shopPartsQ, siopLongLeadQ, siopOspQ, scCategoriesQ, scSuppliersQ, scSegmentsQ, scScorecardsQ, scScoresQ, scRiskTypesQ, scRisksQ, scContractsQ, scEscalationsQ, vocNotesQ, vocMetricsQ, vocTasksQ];

  const loading = queries.some((q) => q.isLoading);

  function toggle(s: Section) {
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  const hideNS = wfPrefs.hideNotStarted;
  const rawObjectives = (objectivesQ.data as any[]) ?? [];
  const rawInitiatives = (initiativesQ.data as any[]) ?? [];
  const rawTasks = (tasksQ.data as any[]) ?? [];
  const rawWfItems = (waterfallItemsQ.data as any[]) ?? [];

  const filteredObjectives = useMemo(
    () => (hideNS ? rawObjectives.filter((o) => !isObjectiveNotStarted(o)) : rawObjectives),
    [rawObjectives, hideNS],
  );
  const filteredInitiatives = useMemo(
    () => (hideNS ? rawInitiatives.filter((i) => !isWorkstreamNotStarted(i)) : rawInitiatives),
    [rawInitiatives, hideNS],
  );
  const filteredTasks = useMemo(
    () => (hideNS ? rawTasks.filter((t) => !isTaskNotStarted(t)) : rawTasks),
    [rawTasks, hideNS],
  );
  const filteredWfItems = useMemo(() => {
    if (!hideNS) return rawWfItems;
    const ids = rawWfItems.map((i) => i.id as string);
    const ns = notStartedLeverIds(ids, {
      items: rawWfItems,
      objectives: rawObjectives,
      actions: (wfActionsQ.data as any[]) ?? [],
      objectiveBenefits: (monthlyBenefitsQ.data as any[]) ?? [],
      leverBenefits: (wfLeverBenefitsQ.data as any[]) ?? [],
    });
    return rawWfItems.filter((i) => !ns.has(i.id));
  }, [rawWfItems, rawObjectives, wfActionsQ.data, monthlyBenefitsQ.data, wfLeverBenefitsQ.data, hideNS]);

  // Resolve owner/assignee user ids to display names for the report tables.
  const ownerIds = useMemo(() => {
    const ids = new Set<string>();
    const add = (v: unknown) => { if (typeof v === "string" && v) ids.add(v); };
    ((hoshinItemsQ.data as any[]) ?? []).forEach((r) => add(r.owner_id));
    ((restructItemsQ.data as any[]) ?? []).forEach((r) => add(r.owner_id));
    ((npiRisksQ.data as any[]) ?? []).forEach((r) => add(r.owner_id));
    ((calendarQ.data as any[]) ?? []).forEach((r) => add(r.assignee_id));
    return Array.from(ids).sort();
  }, [hoshinItemsQ.data, restructItemsQ.data, npiRisksQ.data, calendarQ.data]);

  const peopleQ = useQuery({
    queryKey: ["r-people", ownerIds.join(",")],
    enabled: ownerIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () =>
      (await supabase.from("profiles").select("id,display_name").in("id", ownerIds)).data ?? [],
  });

  const ownerNames = useMemo(() => {
    const m = new Map<string, string>();
    ((peopleQ.data as any[]) ?? []).forEach((p) => m.set(p.id, p.display_name || "User"));
    return m;
  }, [peopleQ.data]);


  const rawPreview = useMemo(() => buildPreview({
    sections, companyName, periodLabel, taskFilter, sqdpDays, now, ownerNames,
    pillars: pillarsQ.data ?? [], strategy: strategyQ.data ?? null,
    themes: themesQ.data ?? [], objectives: filteredObjectives,
    initiatives: filteredInitiatives, a3s: a3Q.data ?? [], opps: oppsQ.data ?? [], targets: targetsQ.data ?? [],
    backlog: backlogQ.data ?? [], oppMonthly: oppMonthlyQ.data ?? [],
    dmMarks: dmMarksQ.data ?? [], escs: escQ.data ?? [], kpis: kpisQ.data ?? [], kpiVals: kpiValsQ.data ?? [],
    tasks: filteredTasks, notes: notesQ.data ?? [], emp: empQ.data ?? [], empSk: empSkQ.data ?? [],
    reqs: reqsQ.data ?? [], certs: certsQ.data ?? [], dev: devQ.data ?? [],
    capex: (capexQ.data as any[]) ?? [], capexVR: (capexVRQ.data as any[]) ?? [],
    siopCycles: (siopCyclesQ.data as any[]) ?? [], siopDecisions: (siopDecisionsQ.data as any[]) ?? [],
    siopKpis: (siopKpisQ.data as any[]) ?? [], siopCapacity: (siopCapacityQ.data as any[]) ?? [],
    waterfallBridges: (waterfallBridgesQ.data as any[]) ?? [], waterfallItems: filteredWfItems,
    hoshinItems: (hoshinItemsQ.data as any[]) ?? [], hoshinCorr: (hoshinCorrQ.data as any[]) ?? [],
    restructProjects: (restructProjectsQ.data as any[]) ?? [], restructItems: (restructItemsQ.data as any[]) ?? [], restructMembers: (restructMembersQ.data as any[]) ?? [],
    monthlyBenefits: (monthlyBenefitsQ.data as any[]) ?? [],
    accounts: (accountsQ.data as any[]) ?? [], touchpoints: (touchpointsQ.data as any[]) ?? [],
    vocNotes: (vocNotesQ.data as any[]) ?? [], vocMetrics: (vocMetricsQ.data as any[]) ?? [], vocTasks: (vocTasksQ.data as any[]) ?? [],
    calendar: (calendarQ.data as any[]) ?? [],
    npiProjects: (npiProjectsQ.data as any[]) ?? [], npiChecklist: (npiChecklistQ.data as any[]) ?? [], npiRisks: (npiRisksQ.data as any[]) ?? [],
    complianceSnaps: (complianceSnapsQ.data as any[]) ?? [],
    shopLines: (shopLinesQ.data as any[]) ?? [], shopGates: (shopGatesQ.data as any[]) ?? [], shopParts: (shopPartsQ.data as any[]) ?? [],
    siopLongLead: (siopLongLeadQ.data as any[]) ?? [], siopOsp: (siopOspQ.data as any[]) ?? [],
    scCategories: (scCategoriesQ.data as any[]) ?? [], scSuppliers: (scSuppliersQ.data as any[]) ?? [],
    scSegments: (scSegmentsQ.data as any[]) ?? [], scScorecards: (scScorecardsQ.data as any[]) ?? [],
    scScores: (scScoresQ.data as any[]) ?? [], scRiskTypes: (scRiskTypesQ.data as any[]) ?? [],
    scRisks: (scRisksQ.data as any[]) ?? [], scContracts: (scContractsQ.data as any[]) ?? [],
    scEscalations: (scEscalationsQ.data as any[]) ?? [],
    customBridges,
    wfPrefs,
  }), [sections, companyName, periodLabel, taskFilter, sqdpDays, now, pillarsQ.data, strategyQ.data, themesQ.data, filteredObjectives, filteredInitiatives, a3Q.data, oppsQ.data, targetsQ.data, backlogQ.data, oppMonthlyQ.data, dmMarksQ.data, escQ.data, kpisQ.data, kpiValsQ.data, filteredTasks, notesQ.data, empQ.data, empSkQ.data, reqsQ.data, certsQ.data, devQ.data, capexQ.data, capexVRQ.data, siopCyclesQ.data, siopDecisionsQ.data, siopKpisQ.data, siopCapacityQ.data, waterfallBridgesQ.data, filteredWfItems, hoshinItemsQ.data, hoshinCorrQ.data, restructProjectsQ.data, restructItemsQ.data, restructMembersQ.data, monthlyBenefitsQ.data, accountsQ.data, touchpointsQ.data, vocNotesQ.data, vocMetricsQ.data, vocTasksQ.data, calendarQ.data, npiProjectsQ.data, npiChecklistQ.data, npiRisksQ.data, complianceSnapsQ.data, shopLinesQ.data, shopGatesQ.data, shopPartsQ.data, siopLongLeadQ.data, siopOspQ.data, scCategoriesQ.data, scSuppliersQ.data, scSegmentsQ.data, scScorecardsQ.data, scScoresQ.data, scRiskTypesQ.data, scRisksQ.data, scContractsQ.data, scEscalationsQ.data, customBridges, wfPrefs, ownerNames]);


  /* ---------- editable overlay: preview = generated report + user edits ---------- */
  const preview = useMemo(() => applyLayout(assignIds(rawPreview), layout), [rawPreview, layout]);
  const edited = !isLayoutEmpty(layout);

  const patch = (fn: (l: ReportLayout) => ReportLayout) => setLayout((l) => fn(l));

  const hideBlock = (id: string) =>
    patch((l) => ({ ...l, hiddenBlocks: l.hiddenBlocks.includes(id) ? l.hiddenBlocks : [...l.hiddenBlocks, id] }));

  const hideRow = (id: string, key: string) =>
    patch((l) => ({ ...l, hiddenTableRows: { ...l.hiddenTableRows, [id]: [...(l.hiddenTableRows[id] ?? []), key] } }));

  const hideCol = (id: string, ci: number) =>
    patch((l) => ({ ...l, hiddenTableCols: { ...l.hiddenTableCols, [id]: [...(l.hiddenTableCols[id] ?? []), ci] } }));

  const setText = (id: string, p: { text?: string; sub?: string; title?: string }) =>
    patch((l) => ({ ...l, textOverrides: { ...l.textOverrides, [id]: { ...(l.textOverrides[id] ?? {}), ...p } } }));

  const moveBlock = (pageId: string, id: string, dir: -1 | 1) => {
    const page = preview.find((p) => (p.id ?? "") === pageId);
    if (!page) return;
    const ids = page.blocks.map((b) => b.id ?? "");
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = ids.slice();
    [next[i], next[j]] = [next[j], next[i]];
    patch((l) => ({ ...l, blockOrder: { ...l.blockOrder, [pageId]: next } }));
  };

  const addNote = (pageId: string, afterBlockId: string | null) => {
    const id = `note:${Math.random().toString(36).slice(2, 9)}`;
    patch((l) => ({
      ...l,
      extraBlocks: [
        ...l.extraBlocks,
        { pageId, afterBlockId, block: { id, type: "note", title: "Board note", text: "Write your commentary here." } },
      ],
    }));
  };

  async function saveLayout() {
    setSavingLayout(true);
    try {
      if (layoutRowId) {
        const { error } = await supabase
          .from("board_report_layouts")
          .update({ layout: layout as never, updated_at: new Date().toISOString() })
          .eq("id", layoutRowId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("board_report_layouts")
          .insert({ name: "Board cut", is_default: true, layout: layout as never })
          .select("id")
          .single();
        if (error) throw error;
        setLayoutRowId(data.id);
      }
      toast.success("Report layout saved for this company");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save layout");
    } finally {
      setSavingLayout(false);
    }
  }


  async function generate() {
    if (loading) { toast.error("Data is still loading"); return; }
    setGenerating(true);
    try {
      await generateBoardPdf({
        companyName,
        periodLabel,
        pages: preview,
        generatedOn: now,
        fileName: `${companyName.replace(/\s+/g, "_")}_Board_Report_${format(now, "yyyy-MM-dd")}.pdf`,
      });
      toast.success("Report generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }


  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          Full board pack
        </span>
        <Link
          to="/report/owner"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          Owner dashboard
        </Link>
        <Link
          to="/report/business-health"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          Business health
        </Link>
        <Link
          to="/report/industrial-strategy"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          Industrial Strategy
        </Link>

      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Board Report</h1>
        <p className="text-sm text-muted-foreground">Assemble a branded PDF from strategy, initiatives, commercial, Operations and people data. Toggle sections, preview, download.</p>
      </div>


      <div className="grid gap-6 lg:grid-cols-[380px_1fr] [&>*]:min-w-0">
        {/* Controls */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report details</h2>
            <div>
              <label className="text-xs font-medium">Company name</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Report title</label>
              <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">SQDP window (days)</label>
                <Input type="number" min={7} max={365} value={sqdpDays} onChange={(e) => setSqdpDays(Number(e.target.value) || 90)} />
              </div>
              <div>
                <label className="text-xs font-medium">Task filter</label>
                <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value as "open" | "all" | "closed")} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="open">Open</option>
                  <option value="all">All</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={wfPrefs.hideNotStarted}
                onChange={(e) => updateWfPref("hideNotStarted", e.target.checked)}
              />
              <span>Hide not-started items (objectives, levers, workstreams, tasks)</span>
            </label>

          </div>

          <div className={`rounded-lg border border-border bg-card p-5 space-y-3 ${sections.waterfall ? "" : "opacity-50"}`}>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Waterfall view</h2>
              <p className="text-[11px] text-muted-foreground mt-1">Following your Strategy → Waterfall settings. Overrides here apply to this report only.</p>
            </div>
            <label className="flex items-center justify-between text-sm">
              <span>Rollup: <span className="font-medium">{wfPrefs.rollupMode === "delta" ? "Δ by bridge" : "Sum of components"}</span></span>
              <button
                type="button"
                onClick={() => updateWfPref("rollupMode", wfPrefs.rollupMode === "delta" ? "sum" : "delta")}
                className="px-2 py-1 text-xs rounded border border-input hover:bg-muted"
              >
                Switch
              </button>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={wfPrefs.compareAll} onChange={(e) => updateWfPref("compareAll", e.target.checked)} />
              <span>Compare all (rollup + sub-bridges)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={wfPrefs.riskAdjusted} onChange={(e) => updateWfPref("riskAdjusted", e.target.checked)} />
              <span>Risk-adjusted lever amounts</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={wfPrefs.showArchived} onChange={(e) => updateWfPref("showArchived", e.target.checked)} />
              <span>Include archived bridges</span>
            </label>
          </div>


          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</h2>
            {SECTION_META.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50">
                <input type="checkbox" className="mt-0.5" checked={sections[s.id]} onChange={() => toggle(s.id)} />
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <CustomWaterfallEditor bridges={customBridges} onChange={setCustomBridges} />



          <Button onClick={generate} disabled={loading || generating || generatingPptx} className="w-full" size="lg">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {generating ? "Generating…" : "Download PDF"}
          </Button>
          <Button
            onClick={async () => {
              if (loading) { toast.error("Data is still loading"); return; }
              setGeneratingPptx(true);
              try {
                await generateBoardPptx({
                  companyName,
                  periodLabel,
                  pages: preview,
                  fileName: `${companyName.replace(/\s+/g, "_")}_${periodLabel.replace(/\s+/g, "_")}.pptx`,
                });
                toast.success("PowerPoint downloaded");
              } catch (e) {
                console.error(e);
                toast.error("Failed to generate PowerPoint");
              } finally {
                setGeneratingPptx(false);
              }
            }}
            disabled={loading || generating || generatingPptx}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {generatingPptx ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {generatingPptx ? "Generating…" : "Download PowerPoint"}
          </Button>
          {loading && <p className="text-xs text-muted-foreground">Loading report data…</p>}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={editing ? "default" : "outline"} onClick={() => setEditing((v) => !v)}>
                {editing ? <Eye className="mr-1.5 h-3.5 w-3.5" /> : <Pencil className="mr-1.5 h-3.5 w-3.5" />}
                {editing ? "Done editing" : "Edit report"}
              </Button>
              <Button size="sm" variant="outline" onClick={saveLayout} disabled={savingLayout}>
                {savingLayout ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Save layout
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setLayout(EMPTY_LAYOUT)} disabled={!edited}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset edits
              </Button>
            </div>
          </div>
          {editing && (
            <p className="rounded-md border border-dashed border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
              Hover any block to hide it, reorder it, retitle it or add a board note. Tables get per-row and per-column delete buttons.
              Every edit here flows into both the PDF and the PowerPoint export.
            </p>
          )}
          {edited && !editing && (
            <p className="text-xs text-muted-foreground">
              This report has manual edits applied. Use “Save layout” to keep them for everyone in this company.
            </p>
          )}
          <div className="space-y-4 overflow-x-auto">
            {preview.map((page, idx) => (

              <div key={idx} className="mx-auto bg-white text-black shadow-md" style={{ width: 595, minHeight: 842, padding: page.dark ? 0 : 40 }}>
                {page.dark ? (
                  <div className="relative flex h-[842px] flex-col justify-center overflow-hidden bg-[#171b21] p-10 text-white">
                    <div className="absolute left-0 top-1/2 h-1.5 w-24 -translate-y-24 bg-[#e85d3a]" />
                    <div className="absolute bottom-24 right-10 h-1 w-32 bg-[#e85d3a]" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-black/40" />
                    <div className="text-[10px] font-bold tracking-[0.3em] text-neutral-400">BOARD REPORT</div>
                    <div className="mt-4 text-4xl font-bold leading-tight">{companyName}</div>
                    <div className="mt-2 text-xl font-medium text-[#e85d3a]">{periodLabel}</div>
                    <div className="mt-3 text-xs text-neutral-300">Prepared for the Board of Directors</div>
                    <div className="mt-auto flex items-end justify-between text-[10px]">
                      <div className="text-neutral-400">Generated {now.toLocaleDateString()}</div>
                      <div className="font-semibold text-white">DO.Impact Operating System</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-[10px]">
                    {page.blocks.map((b, i) => (
                    <BlockFrame
                      key={b.id ?? i}
                      block={b}
                      editing={editing}
                      canUp={i > 0}
                      canDown={i < page.blocks.length - 1}
                      onHide={() => hideBlock(b.id ?? "")}
                      onUp={() => moveBlock(page.id ?? "", b.id ?? "", -1)}
                      onDown={() => moveBlock(page.id ?? "", b.id ?? "", 1)}
                      onAddNote={() => addNote(page.id ?? "", b.id ?? null)}
                      onText={(p) => setText(b.id ?? "", p)}
                    >
                    {editing && b.type === "table" ? (
                      <EditableTable
                        block={b}
                        onHideRow={(key) => hideRow(b.id ?? "", key)}
                        onHideCol={(ci) => hideCol(b.id ?? "", ci)}
                      />
                    ) : (() => {

                      if (b.type === "h1") return (
                        <div key={i} className="mb-2 flex items-stretch overflow-hidden rounded bg-[#171b21] text-white">
                          <div className="w-1 bg-[#e85d3a]" />
                          <div className="flex-1 px-3 py-2">
                            <div className="text-sm font-bold leading-tight">{b.text}</div>
                            {b.sub && <div className="mt-0.5 text-[9px] text-neutral-300">{b.sub}</div>}
                          </div>
                        </div>
                      );
                      if (b.type === "h2") return (
                        <div key={i} className="pt-1">
                          <div className="text-[11px] font-semibold text-neutral-900">{b.text}</div>
                          <div className="mt-0.5 h-[2px] w-6 bg-[#e85d3a]" />
                        </div>
                      );
                      if (b.type === "p") return <div key={i} className="whitespace-pre-wrap text-[10px] text-neutral-700">{b.text}</div>;
                      if (b.type === "note") return (
                        <div key={i} className="flex items-stretch overflow-hidden rounded border border-neutral-200 bg-neutral-50">
                          <div className="w-1 bg-[#e85d3a]" />
                          <div className="flex-1 px-2.5 py-2">
                            {b.title && <div className="text-[10px] font-semibold text-neutral-900">{b.title}</div>}
                            <div className="whitespace-pre-wrap text-[10px] text-neutral-700">{b.text}</div>
                          </div>
                        </div>
                      );

                      if (b.type === "stats") return (
                        <div key={i} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${b.items.length}, minmax(0, 1fr))` }}>
                          {b.items.map((it, ii) => (
                            <div key={ii} className="flex items-stretch overflow-hidden rounded border border-neutral-200 bg-neutral-50">
                              <div className="w-1" style={{ background: it.color ?? "#e85d3a" }} />
                              <div className="flex-1 px-2 py-1.5">
                                <div className="text-[8px] font-semibold uppercase tracking-wider text-neutral-500">{it.label}</div>
                                <div className="text-sm font-bold text-neutral-900">{it.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                      if (b.type === "table") {
                        const rygCols = b.rygColumns ?? [];
                        const pctCols = b.pctColumns ?? [];
                        const cellStyle = (val: string, ci: number): string => {
                          if (rygCols.includes(ci)) {
                            const v = val.toLowerCase();
                            if (v.startsWith("red")) return "bg-red-500 text-white font-bold text-center";
                            if (v.startsWith("yel")) return "bg-amber-500 text-white font-bold text-center";
                            if (v.startsWith("gre")) return "bg-emerald-500 text-white font-bold text-center";
                          }
                          if (pctCols.includes(ci)) {
                            const pct = parseInt(val, 10);
                            if (!isNaN(pct)) {
                              const cls = pct >= 85 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
                              return `${cls} text-white font-bold text-center`;
                            }
                          }
                          return "";
                        };
                        return (
                          <table key={i} className="w-full border-collapse text-[9px]">
                            <thead><tr>{b.head.map((h, hi) => <th key={hi} className="border border-neutral-300 bg-[#171b21] px-1.5 py-1 text-left font-semibold text-white">{h}</th>)}</tr></thead>
                            <tbody>{b.rows.map((r, ri) => (
                              <tr key={ri} className={ri % 2 ? "bg-neutral-50" : ""}>
                                {r.map((c, ci) => <td key={ci} className={`border border-neutral-200 px-1.5 py-1 align-top ${cellStyle(String(c), ci)}`}>{c}</td>)}
                              </tr>
                            ))}</tbody>
                          </table>
                        );
                      }
                      if (b.type === "retro") return (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <div className="rounded border border-emerald-200 bg-emerald-50 p-2">
                            <div className="text-[10px] font-semibold text-emerald-800">Working well</div>
                            <ul className="mt-1 space-y-0.5 text-[9px] text-neutral-800">
                              {(b.working.length ? b.working : ["—"]).map((t, ti) => <li key={ti}>• {t}</li>)}
                            </ul>
                          </div>
                          <div className="rounded border border-amber-200 bg-amber-50 p-2">
                            <div className="text-[10px] font-semibold text-amber-800">Can be improved</div>
                            <ul className="mt-1 space-y-0.5 text-[9px] text-neutral-800">
                              {(b.improve.length ? b.improve : ["—"]).map((t, ti) => <li key={ti}>• {t}</li>)}
                            </ul>
                          </div>
                        </div>
                      );
                      if (b.type === "plan_chart") {
                        const maxV = Math.max(1, ...b.rows.map((r) => Math.max(r.target, r.booked + r.weighted)));
                        const w = 515, h = 180, padL = 36, padR = 8, padT = 8, padB = 22;
                        const plotW = w - padL - padR, plotH = h - padT - padB;
                        const barW = plotW / b.rows.length;
                        const bw = Math.max(1.5, barW * 0.6);
                        const step = Math.max(1, Math.ceil(b.rows.length / 12));
                        const linePts = b.rows.map((r, i) => {
                          const cx = padL + i * barW + barW / 2;
                          const py = padT + plotH - (r.target / maxV) * plotH;
                          return `${cx},${py}`;
                        }).join(" ");
                        return (
                          <div key={i}>
                            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
                              {[0,1,2,3,4].map((gi) => {
                                const gy = padT + (plotH * gi) / 4;
                                const v = maxV * (1 - gi / 4);
                                return (
                                  <g key={gi}>
                                    <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#e5e7eb" strokeWidth={0.5} />
                                    <text x={padL - 3} y={gy + 3} textAnchor="end" fontSize={7} fill="#6b7280">{Math.round(v/1000)}k</text>
                                  </g>
                                );
                              })}
                              {b.rows.map((r, ri) => {
                                const cx = padL + ri * barW + (barW - bw) / 2;
                                const bookedH = (r.booked / maxV) * plotH;
                                const weightedH = (r.weighted / maxV) * plotH;
                                return (
                                  <g key={ri}>
                                    <rect x={cx} y={padT + plotH - bookedH} width={bw} height={bookedH} fill="#22c55e" />
                                    <rect x={cx} y={padT + plotH - bookedH - weightedH} width={bw} height={weightedH} fill="#eab308" />
                                    {ri % step === 0 && <text x={cx + bw/2} y={padT + plotH + 10} textAnchor="middle" fontSize={6} fill="#6b7280">{r.label}</text>}
                                  </g>
                                );
                              })}
                              <polyline points={linePts} fill="none" stroke="#ef4444" strokeWidth={1.3} />
                            </svg>
                            <div className="mt-1 flex gap-3 text-[8px] text-neutral-700">
                              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-emerald-500" />Booked</span>
                              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-amber-500" />Weighted pipeline</span>
                              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-red-500" />Plan target</span>
                            </div>
                          </div>
                        );
                      }
                      if (b.type === "driver_tree") {
                        return (
                          <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                            <div className="mx-auto max-w-md rounded-md border-2 border-[#e85d3a]/50 bg-[#e85d3a]/5 p-2 text-center">
                              <div className="text-[7px] font-semibold uppercase tracking-widest text-neutral-500">Strategic objective</div>
                              <div className="mt-0.5 text-[10px] font-semibold leading-snug text-neutral-900">{b.vision}</div>
                              <div className="mt-1 flex justify-center gap-3 text-[8px]">
                                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{b.totals.onTrack} on track</span>
                                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{b.totals.atRisk} at risk</span>
                                <span className="text-neutral-500">· {b.totals.total} objectives</span>
                              </div>
                            </div>
                            <div className="mx-auto my-2 h-3 w-px bg-neutral-300" />
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, b.levers.length))}, minmax(0, 1fr))` }}>
                              {b.levers.map((lv, li) => (
                                <div key={li} className="flex flex-col overflow-hidden rounded border border-neutral-200 bg-white">
                                  <div className="px-2 py-1 text-white" style={{ background: lv.color }}>
                                    <div className="text-[7px] font-semibold uppercase tracking-widest opacity-80">Lever</div>
                                    <div className="text-[9px] font-semibold leading-tight">{lv.title}</div>
                                  </div>
                                  <div className="flex-1 space-y-1 p-1.5">
                                    {lv.items.length === 0 ? (
                                      <div className="rounded border border-dashed p-1.5 text-center text-[8px] text-neutral-500">No objectives linked.</div>
                                    ) : lv.items.map((it, ii) => {
                                      const dot = it.status === "on_track" || it.status === "done" ? "bg-emerald-500" : it.status === "at_risk" ? "bg-amber-500" : it.status === "off_track" ? "bg-red-500" : "bg-neutral-300";
                                      return (
                                        <div key={ii} className="rounded border border-neutral-200 p-1.5">
                                          <div className="flex items-start gap-1">
                                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: lv.color }} />
                                            <div className="min-w-0 flex-1">
                                              <div className="text-[9px] font-medium leading-tight text-neutral-900">{it.title}</div>
                                              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[7px] text-neutral-500">
                                                {it.horizon_year != null && <span>Y{it.horizon_year}</span>}
                                                {it.target_metric && <span>· 🎯 {it.target_metric}</span>}
                                                <span className="inline-flex items-center gap-0.5">· <span className={`h-1 w-1 rounded-full ${dot}`} /></span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      if (b.type === "kpi_charts") {
                        return (
                          <div key={i} className="space-y-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600">{b.pillar}</div>
                            <div className="grid grid-cols-2 gap-2">
                              {b.kpis.map((kp, ki) => {
                                const nums = kp.points.flatMap((p) => [p.actual, p.target]).filter((v): v is number => v != null);
                                const maxV = nums.length ? Math.max(...nums) * 1.1 : 1;
                                const minV = nums.length ? Math.min(0, Math.min(...nums)) : 0;
                                const w = 250, h = 90, padL = 22, padR = 6, padT = 6, padB = 14;
                                const plotW = w - padL - padR, plotH = h - padT - padB;
                                const xAt = (idx: number) => padL + (idx / 11) * plotW;
                                const yAt = (v: number) => padT + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;
                                const actualPts = kp.points.map((p, pi) => p.actual != null ? `${xAt(pi)},${yAt(p.actual)}` : null).filter(Boolean).join(" ");
                                const targetPts = kp.points.map((p, pi) => p.target != null ? `${xAt(pi)},${yAt(p.target)}` : null).filter(Boolean).join(" ");
                                const dot = kp.status === "on" ? "bg-emerald-500" : kp.status === "off" ? "bg-red-500" : "bg-neutral-300";
                                return (
                                  <div key={ki} className="rounded border border-neutral-200 bg-white p-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-1.5 min-w-0">
                                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                                        <div className="min-w-0">
                                          <div className="truncate text-[9px] font-semibold text-neutral-900">{kp.name}</div>
                                          <div className="text-[7px] text-neutral-500">Target {kp.target ?? "—"} {kp.unit}</div>
                                        </div>
                                      </div>
                                      <div className="text-right text-[9px] font-bold text-neutral-900">{kp.latest ?? "—"}<span className="text-[7px] font-normal text-neutral-500"> {kp.unit}</span></div>
                                    </div>
                                    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full" style={{ height: h }}>
                                      {[0,1,2].map((gi) => {
                                        const gy = padT + (plotH * gi) / 2;
                                        const v = maxV - ((maxV - minV) * gi) / 2;
                                        return (
                                          <g key={gi}>
                                            <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#e5e7eb" strokeWidth={0.4} />
                                            <text x={padL - 2} y={gy + 2} textAnchor="end" fontSize={5} fill="#9ca3af">{Math.round(v)}</text>
                                          </g>
                                        );
                                      })}
                                      {targetPts && <polyline points={targetPts} fill="none" stroke="#e85d3a" strokeWidth={0.9} strokeDasharray="2 2" />}
                                      {actualPts && <polyline points={actualPts} fill="none" stroke="#171b21" strokeWidth={1.2} />}
                                      {kp.points.map((p, pi) => p.actual != null ? <circle key={pi} cx={xAt(pi)} cy={yAt(p.actual)} r={1.4} fill="#171b21" /> : null)}
                                      {KPI_MONTHS.map((m, mi) => mi % 2 === 0 ? <text key={mi} x={xAt(mi)} y={h - 3} textAnchor="middle" fontSize={5} fill="#9ca3af">{m}</text> : null)}
                                    </svg>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      if (b.type === "custom_waterfall") {
                        const rows = b.rows;
                        let mn = 0, mx = 0;
                        for (const r of rows) { mn = Math.min(mn, r.range[0], r.range[1]); mx = Math.max(mx, r.range[0], r.range[1]); }
                        if (mx === mn) mx = mn + 1;
                        const w = 320, h = 200, padL = 8, padR = 8, padT = 18, padB = 28;
                        const plotW = w - padL - padR, plotH = h - padT - padB;
                        const barW = plotW / Math.max(1, rows.length);
                        const bw = Math.max(2, barW * 0.7);
                        const yAt = (v: number) => padT + plotH - ((v - mn) / (mx - mn || 1)) * plotH;
                        return (
                          <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                            <div className="mb-1 text-[10px] font-semibold text-neutral-900">{b.title}</div>
                            <div className="grid grid-cols-[3fr_2fr] gap-2">
                              <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded border border-neutral-200 bg-white" style={{ height: h }}>
                                {rows.map((r, ri) => {
                                  const x = padL + ri * barW + (barW - bw) / 2;
                                  const y1 = yAt(Math.max(r.range[0], r.range[1]));
                                  const y2 = yAt(Math.min(r.range[0], r.range[1]));
                                  const barH = Math.max(1, y2 - y1);
                                  return (
                                    <g key={ri}>
                                      <rect x={x} y={y1} width={bw} height={barH} fill={r.fill} rx={1.5} />
                                      <text x={x + bw / 2} y={y1 - 2} textAnchor="middle" fontSize={7} fill="#171b21" fontWeight={600}>{r.label}</text>
                                      <text x={x + bw / 2} y={h - 12} textAnchor="middle" fontSize={7} fill="#374151">
                                        {r.name.length > 12 ? r.name.slice(0, 11) + "…" : r.name}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                              <div className="rounded border border-neutral-200 bg-white p-2 text-[9px] text-neutral-800">
                                {b.comment && <div className="mb-1 whitespace-pre-wrap text-[9px] text-neutral-700">{b.comment}</div>}
                                <div className="text-[8px] font-semibold uppercase tracking-wider text-neutral-500">Levers</div>
                                {b.levers.length === 0 && <div className="text-neutral-500">—</div>}
                                <ul className="space-y-0.5">
                                  {b.levers.map((l, li) => (
                                    <li key={li} className="flex items-start gap-1">
                                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${l.delta >= 0 ? "bg-blue-500" : "bg-red-500"}`} />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-1">
                                          <span className="truncate font-medium">{l.label}</span>
                                          <span className={l.delta >= 0 ? "text-blue-700" : "text-red-700"}>
                                            {l.delta >= 0 ? "+" : "−"}{Math.abs(l.delta).toLocaleString()}
                                          </span>
                                        </div>
                                        {l.comment && <div className="text-neutral-500">{l.comment}</div>}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    </BlockFrame>
                    ))}
                  </div>


                )}
              </div>
            ))}
            {!preview.length && <p className="text-sm text-muted-foreground">Toggle a section to see the preview.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Editing chrome ---------- */

const ICON_BTN =
  "rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-500";

function BlockFrame(props: {
  block: Block;
  editing: boolean;
  canUp: boolean;
  canDown: boolean;
  onHide: () => void;
  onUp: () => void;
  onDown: () => void;
  onAddNote: () => void;
  onText: (patch: { text?: string; sub?: string; title?: string }) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const b = props.block;
  if (!props.editing) return <>{props.children}</>;

  const textValue =
    b.type === "h1" || b.type === "h2" || b.type === "p" || b.type === "note"
      ? b.text
      : b.type === "custom_waterfall"
        ? b.title
        : b.type === "kpi_charts"
          ? b.pillar
          : null;
  const titleValue = b.type === "note" ? (b.title ?? "") : null;
  const subValue = b.type === "h1" ? (b.sub ?? "") : null;

  return (
    <div className="group relative rounded border border-dashed border-transparent p-0.5 hover:border-sky-400">
      <div className="absolute -top-3 right-0 z-10 hidden items-center gap-0.5 rounded bg-white/95 px-1.5 py-0.5 shadow ring-1 ring-neutral-200 group-hover:flex">
        <span className="mr-1 max-w-[150px] truncate text-[8px] font-semibold uppercase tracking-wider text-neutral-400">
          {blockLabel(b)}
        </span>
        {textValue != null && (
          <button type="button" title="Edit text" className={ICON_BTN} onClick={() => setOpen((v) => !v)}>
            <Pencil className="h-3 w-3" />
          </button>
        )}
        <button type="button" title="Add a board note below" className={ICON_BTN} onClick={props.onAddNote}>
          <StickyNote className="h-3 w-3" />
        </button>
        <button type="button" title="Move up" className={ICON_BTN} disabled={!props.canUp} onClick={props.onUp}>
          <ArrowUp className="h-3 w-3" />
        </button>
        <button type="button" title="Move down" className={ICON_BTN} disabled={!props.canDown} onClick={props.onDown}>
          <ArrowDown className="h-3 w-3" />
        </button>
        <button type="button" title="Remove from report" className={ICON_BTN} onClick={props.onHide}>
          <EyeOff className="h-3 w-3" />
        </button>
      </div>
      {open && textValue != null && (
        <div className="mb-1.5 space-y-1.5 rounded border border-sky-200 bg-sky-50 p-2">
          {titleValue != null && (
            <Input
              className="h-7 text-xs"
              value={titleValue}
              placeholder="Note title"
              onChange={(e) => props.onText({ title: e.target.value })}
            />
          )}
          {b.type === "note" ? (
            <Textarea
              className="min-h-[70px] text-xs"
              value={textValue}
              onChange={(e) => props.onText({ text: e.target.value })}
            />
          ) : (
            <Input className="h-7 text-xs" value={textValue} onChange={(e) => props.onText({ text: e.target.value })} />
          )}
          {subValue != null && (
            <Input
              className="h-7 text-xs"
              value={subValue}
              placeholder="Subtitle"
              onChange={(e) => props.onText({ sub: e.target.value })}
            />
          )}
        </div>
      )}
      {props.children}
    </div>
  );
}

function EditableTable(props: {
  block: Extract<Block, { type: "table" }>;
  onHideRow: (key: string) => void;
  onHideCol: (ci: number) => void;
}) {
  const { block } = props;
  return (
    <table className="w-full border-collapse text-[9px]">
      <thead>
        <tr>
          <th className="w-4" />
          {block.head.map((h, hi) => (
            <th key={hi} className="border border-neutral-300 bg-[#171b21] px-1.5 py-1 text-left font-semibold text-white">
              <span className="flex items-center justify-between gap-1">
                {h}
                <button
                  type="button"
                  title="Remove column"
                  className="rounded bg-white/20 p-0.5 hover:bg-red-500"
                  onClick={() => props.onHideCol(hi)}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((r, ri) => (
          <tr key={ri} className={ri % 2 ? "bg-neutral-50" : ""}>
            <td className="pr-1 text-center align-middle">
              <button
                type="button"
                title="Remove row"
                className="rounded p-0.5 text-neutral-400 hover:bg-red-500 hover:text-white"
                onClick={() => props.onHideRow(tableRowKey(r))}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </td>
            {r.map((c, ci) => (
              <td key={ci} className="border border-neutral-200 px-1.5 py-1 align-top">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- Preview builder (mirrors PDF section order) ---------- */




const OPP_STAGE_PROB: Record<string, number> = { prospect: 0.2, proposal: 0.6, won: 1, lost: 0 };
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function computePlanRows(targets: any[], backlog: any[], opps: any[], oppMonthly: any[]): PlanRow[] {
  if (!targets?.length) return [];
  const backlogMap = new Map<string, number>();
  for (const b of backlog ?? []) backlogMap.set(`${b.year}-${b.month}`, Number(b.amount || 0));
  const monthlyByOpp = new Map<string, { year: number; month: number; amount: number }[]>();
  for (const m of oppMonthly ?? []) {
    const arr = monthlyByOpp.get(m.opportunity_id) ?? [];
    arr.push({ year: m.year, month: m.month, amount: Number(m.amount || 0) });
    monthlyByOpp.set(m.opportunity_id, arr);
  }
  const weightedMap = new Map<string, number>();
  for (const o of opps ?? []) {
    if (o.stage === "won" || o.stage === "lost") continue;
    const prob = o.probability != null ? Number(o.probability) / 100 : (OPP_STAGE_PROB[o.stage as string] ?? 0);
    const monthly = monthlyByOpp.get(o.id);
    if (monthly && monthly.length) {
      for (const m of monthly) {
        const k = `${m.year}-${m.month}`;
        weightedMap.set(k, (weightedMap.get(k) ?? 0) + m.amount * prob);
      }
    } else if (o.expected_close_date) {
      const d = new Date(o.expected_close_date);
      const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
      weightedMap.set(k, (weightedMap.get(k) ?? 0) + Number(o.value || 0) * prob);
    }
  }
  return targets.map((t) => {
    const k = `${t.year}-${t.month}`;
    return {
      year: t.year, month: t.month,
      label: `${MONTH_ABBR[t.month - 1]} ${String(t.year).slice(2)}`,
      target: Number(t.amount || 0),
      booked: backlogMap.get(k) ?? 0,
      weighted: weightedMap.get(k) ?? 0,
    };
  });
}

/* ---------- Preview builder (mirrors PDF section order) ---------- */

function buildDriverTree(strategy: any, themes: any[], objectives: any[]) {
  const active = (objectives ?? []).filter((o: any) => !o.archived_at);
  const activeThemes = (themes ?? []).filter((t: any) => !t.archived_at);
  const levers: DriverLever[] = activeThemes.map((t: any) => ({
    title: t.title,
    description: t.description,
    color: t.color ?? "#9ca3af",
    items: active
      .filter((o: any) => o.theme_id === t.id || o.strategic_themes?.title === t.title)
      .map((o: any) => ({ title: o.title, horizon_year: o.horizon_year, target_metric: o.target_metric, status: o.status })),
  }));
  const unassigned = active.filter((o: any) => !o.theme_id && !activeThemes.some((t: any) => t.title === o.strategic_themes?.title));
  if (unassigned.length) {
    levers.push({
      title: "Unassigned",
      description: "Objectives without a strategic theme",
      color: "#9ca3af",
      items: unassigned.map((o: any) => ({ title: o.title, horizon_year: o.horizon_year, target_metric: o.target_metric, status: o.status })),
    });
  }
  return {
    vision: strategy?.vision ?? "Set a vision to anchor the tree.",
    totals: {
      total: active.length,
      onTrack: active.filter((o: any) => o.status === "on_track" || o.status === "done").length,
      atRisk: active.filter((o: any) => o.status === "at_risk").length,
    },
    levers,
  };
}




function buildKpiChart(k: any, vals: any[], year: number): KpiChart {
  const byMonth = new Map<number, { actual: number | null; target: number | null }>();
  for (const v of vals) {
    if (v.kpi_id !== k.id) continue;
    const d = new Date(v.period_start);
    if (d.getUTCFullYear() !== year) continue;
    byMonth.set(d.getUTCMonth(), { actual: v.actual != null ? Number(v.actual) : null, target: v.target != null ? Number(v.target) : null });
  }
  const points = KPI_MONTHS.map((m, i) => {
    const r = byMonth.get(i);
    return { month: m, actual: r?.actual ?? null, target: r?.target ?? (k.target != null ? Number(k.target) : null) };
  });
  const withActuals = points.filter((p) => p.actual != null);
  const latest = withActuals.length ? withActuals[withActuals.length - 1].actual : null;
  let status: "on" | "off" | "none" = "none";
  if (latest != null && k.target != null) {
    const meets = k.higher_is_better ? latest >= Number(k.target) : latest <= Number(k.target);
    status = meets ? "on" : "off";
  }
  return { name: k.name, unit: k.unit ?? "", target: k.target != null ? Number(k.target) : null, higherIsBetter: !!k.higher_is_better, status, points, latest };
}


function ownerName(map: Map<string, string>, id: unknown): string {
  if (typeof id !== "string" || !id) return "Unassigned";
  return map.get(id) ?? "Unknown user";
}

function buildPreview(ctx: {
  sections: Record<Section, boolean>;
  companyName: string; periodLabel: string; taskFilter: "open" | "all" | "closed"; sqdpDays: number; now: Date;
  ownerNames: Map<string, string>;
  pillars: any[]; strategy: any | null; themes: any[]; objectives: any[]; initiatives: any[]; a3s: any[];
  opps: any[]; targets: any[]; backlog: any[]; oppMonthly: any[];
  dmMarks: any[]; escs: any[]; kpis: any[]; kpiVals: any[];
  tasks: any[]; notes: any[]; emp: any[]; empSk: any[]; reqs: any[]; certs: any[]; dev: any[];
  capex: any[]; capexVR: any[]; siopCycles: any[]; siopDecisions: any[]; siopKpis: any[]; siopCapacity: any[];
  waterfallBridges: any[]; waterfallItems: any[];
  hoshinItems: any[]; hoshinCorr: any[];
  restructProjects: any[]; restructItems: any[]; restructMembers: any[];
  monthlyBenefits: any[];
  accounts: any[]; touchpoints: any[];
  vocNotes: any[]; vocMetrics: any[]; vocTasks: any[];
  calendar: any[];
  npiProjects: any[]; npiChecklist: any[]; npiRisks: any[];
  complianceSnaps: any[];
  shopLines: any[]; shopGates: any[]; shopParts: any[];
  siopLongLead: any[]; siopOsp: any[];
  scCategories: any[]; scSuppliers: any[]; scSegments: any[]; scScorecards: any[]; scScores: any[];
  scRiskTypes: any[]; scRisks: any[]; scContracts: any[]; scEscalations: any[];
  customBridges: CustomBridge[];
  wfPrefs: WfViewPrefs;

}): Page[] {

  const { sections, taskFilter, sqdpDays, now } = ctx;
  const pages: Page[] = [];
  const page = (): Page => { const p: Page = { blocks: [] }; pages.push(p); return p; };
  let cur: Page | null = null;
  const startPage = () => { cur = page(); };
  const push = (b: Block) => { if (!cur) startPage(); cur!.blocks.push(b); };
  const GREEN = "#22c55e", YELLOW = "#eab308", RED = "#ef4444";
  if (sections.cover) pages.push({ dark: true, blocks: [] });
  if (sections.strategy) {
    startPage();
    push({ type: "h1", text: "Strategy Foundation", sub: "Themes and 3-year objectives roadmap" });
    push({ type: "stats", items: [
      { label: "Themes", value: String(ctx.themes.length) },
      { label: "Objectives", value: String(ctx.objectives.length) },
      { label: "Horizon", value: `${now.getFullYear()}–${now.getFullYear() + 2}` },
    ] });
    if (ctx.themes.length) {
      push({ type: "h2", text: "Strategic themes" });
      push({ type: "table", head: ["Theme", "Description"], rows: ctx.themes.map((t) => [t.title, t.description ?? ""]) });
    }
    if (ctx.objectives.length) {
      push({ type: "h2", text: "3-year roadmap" });
      push({ type: "table", head: ["Year","Objective","Theme","Target","Status"], rows: ctx.objectives.map((o) => [String(o.horizon_year ?? ""), o.title, o.strategic_themes?.title ?? "", o.target_metric ?? "", o.status ?? ""]) });
    }
    if (!ctx.themes.length && !ctx.objectives.length) push({ type: "p", text: "No strategy content defined." });
  }
  if (sections.value_driver) {
    startPage();
    push({ type: "h1", text: "Value-Driver Tree", sub: "Strategic themes as levers, objectives as value drivers" });
    const tree = buildDriverTree(ctx.strategy, ctx.themes, ctx.objectives);
    if (!tree.levers.length && !tree.totals.total) {
      push({ type: "p", text: "No strategic themes or objectives defined." });
    } else {
      push({ type: "driver_tree", vision: tree.vision, totals: tree.totals, levers: tree.levers });
    }
  }
  if (sections.hoshin) {
    startPage();
    push({ type: "h1", text: "Hoshin Kanri X-Matrix", sub: "Long-term & annual objectives, KPIs, correlations" });
    if (!ctx.hoshinItems.length) push({ type: "p", text: "No Hoshin items defined." });
    else {
      const byQ: Record<string, any[]> = {};
      ctx.hoshinItems.forEach((h) => { (byQ[h.kind] ??= []).push(h); });
      push({ type: "stats", items: [
        { label: "Long-term", value: String((byQ.long_term ?? []).length) },
        { label: "Annual", value: String((byQ.annual ?? []).length) },
        { label: "Improvements", value: String((byQ.improvement ?? []).length) },
        { label: "KPIs / correlations", value: `${(byQ.kpi ?? []).length} / ${ctx.hoshinCorr.length}` },
      ] });
      Object.entries(byQ).forEach(([q, rows]) => {
        if (!rows.length) return;
        push({ type: "h2", text: q.replace("_"," ").toUpperCase() });
        push({ type: "table", head: ["Title","Owner","Target","Horizon"], rows: rows.map((r) => [r.title, ownerName(ctx.ownerNames, r.owner_id), r.target_value ?? "—", r.horizon ?? "—"]) });
      });
    }
  }
  if (sections.waterfall) {
    startPage();
    push({ type: "h1", text: "Waterfall", sub: "Portfolio roll-up of value levers by bridge" });
    const wfBridgesVis = ctx.wfPrefs.showArchived ? ctx.waterfallBridges : ctx.waterfallBridges.filter((b) => !b.archived_at);
    const visIds = new Set(wfBridgesVis.map((b) => b.id));
    const wfItemsVis = ctx.waterfallItems.filter((i) => visIds.has(i.bridge_id));
    if (!wfBridgesVis.length) push({ type: "p", text: "No waterfall bridges defined." });
    else {
      const totalBaseline = wfBridgesVis.reduce((s, b) => s + Number(b.baseline_value ?? 0), 0);
      const totalTarget = wfBridgesVis.reduce((s, b) => s + Number(b.target_value ?? 0), 0);
      const gap = totalTarget - totalBaseline;
      push({ type: "stats", items: [
        { label: "Bridges", value: String(wfBridgesVis.length) },
        { label: "Portfolio baseline", value: totalBaseline.toLocaleString() },
        { label: "Portfolio target", value: totalTarget.toLocaleString() },
        { label: "Gap to close", value: gap.toLocaleString(), color: gap >= 0 ? YELLOW : GREEN },
      ] });
      push({ type: "h2", text: "Bridges" });
      push({ type: "table", head: ["Bridge","Metric","Baseline","Target","Delta"], rows: wfBridgesVis.map((b) => {
        const d = Number(b.target_value ?? 0) - Number(b.baseline_value ?? 0);
        return [b.title + (b.archived_at ? " (archived)" : ""), b.metric ?? "", Number(b.baseline_value ?? 0).toLocaleString(), Number(b.target_value ?? 0).toLocaleString(), (d >= 0 ? "+" : "") + d.toLocaleString()];
      }) });
      if (wfItemsVis.length) {
        push({ type: "h2", text: "Value levers" });
        const bMap = new Map(wfBridgesVis.map((b) => [b.id, b.title]));
        push({ type: "table", head: ["Bridge","Lever","Category","Gross impact","Realization %"], rows: wfItemsVis.slice(0, 40).map((i) => [bMap.get(i.bridge_id) ?? "—", i.label, i.category ?? "", Number(i.gross_impact ?? 0).toLocaleString(), `${Number(i.realization_pct ?? 0)}%`]) });
      }
      const derived = bridgesToCustomWaterfalls(wfBridgesVis, wfItemsVis, {
        includeRollup: true,
        rollupMode: ctx.wfPrefs.rollupMode,
        riskAdjusted: ctx.wfPrefs.riskAdjusted,
        includeArchived: ctx.wfPrefs.showArchived,
      });
      const toRender = ctx.wfPrefs.compareAll ? derived : derived.slice(0, 1);
      if (toRender.length) {
        const modeLabel = ctx.wfPrefs.rollupMode === "delta" ? "Δ" : "sum";
        const heading = ctx.wfPrefs.compareAll
          ? `Compare all — consolidated (${modeLabel}) & sub-bridges`
          : `Consolidated (${modeLabel})`;
        push({ type: "h2", text: heading });
        for (const b of toRender) {
          const rows = buildWfRows(b);
          push({
            type: "custom_waterfall",
            title: b.title,
            comment: b.comment,
            rows,
            levers: b.levers.map((l) => ({ label: l.label, delta: l.delta, comment: l.comment })),
          });
        }
      }
    }
  }


  if (sections.custom_waterfall && ctx.customBridges.length) {
    startPage();
    push({ type: "h1", text: "Custom Waterfall", sub: "Ad-hoc bridges built for this report" });
    for (const b of ctx.customBridges) {
      const rows = buildWfRows(b);
      push({
        type: "custom_waterfall",
        title: b.title,
        comment: b.comment,
        rows,
        levers: b.levers.map((l) => ({ label: l.label, delta: l.delta, comment: l.comment })),
      });
    }
  }
  if (sections.restructuring) {
    startPage();
    push({ type: "h1", text: "Restructuring", sub: "Projects, governance and workstream execution" });
    if (!ctx.restructProjects.length) push({ type: "p", text: "No restructuring projects." });
    else {
      push({ type: "table", head: ["Project","Status","Start","Target"], rows: ctx.restructProjects.map((p) => [p.name, p.status ?? "—", p.start_date ? format(new Date(p.start_date), "d MMM yy") : "—", p.target_date ? format(new Date(p.target_date), "d MMM yy") : "—"]) });
      const items = ctx.restructItems;
      const byCat: Record<string, any[]> = {};
      items.forEach((i) => { (byCat[i.section ?? "misc"] ??= []).push(i); });
      Object.entries(byCat).forEach(([cat, rows]) => {
        push({ type: "h2", text: cat.replace(/_/g," ").toUpperCase() });
        push({ type: "table", head: ["Title","Owner","Progress","Status"], rows: rows.slice(0, 15).map((r) => [r.title, ownerName(ctx.ownerNames, r.owner_id), `${r.progress ?? 0}%`, r.status ?? "—"]) });
      });
      if (ctx.restructMembers.length) {
        push({ type: "h2", text: "Teams" });
        push({ type: "table", head: ["Team","Name","Role"], rows: ctx.restructMembers.slice(0, 30).map((m) => [m.workstream_name ?? "—", m.name, m.role ?? "—"]) });
      }
    }
  }
  if (sections.value_delivered) {
    startPage();
    push({ type: "h1", text: "Value Delivered", sub: "Plan vs actual benefits from 3-year objectives" });
    const totalPlan = ctx.monthlyBenefits.reduce((s, m) => s + Number(m.value ?? 0), 0);
    const totalActual = ctx.monthlyBenefits.reduce((s, m) => s + Number(m.actual ?? 0), 0);
    const pct = totalPlan ? Math.round((totalActual / totalPlan) * 100) : 0;
    push({ type: "stats", items: [
      { label: "Plan", value: totalPlan.toLocaleString() },
      { label: "Actual", value: totalActual.toLocaleString(), color: totalActual >= totalPlan ? GREEN : YELLOW },
      { label: "Realization", value: `${pct}%`, color: pct >= 90 ? GREEN : pct >= 60 ? YELLOW : RED },
    ] });
    const byObj = new Map<string, { plan: number; actual: number }>();
    ctx.monthlyBenefits.forEach((m) => {
      const cur = byObj.get(m.objective_id) ?? { plan: 0, actual: 0 };
      cur.plan += Number(m.value ?? 0); cur.actual += Number(m.actual ?? 0);
      byObj.set(m.objective_id, cur);
    });
    const objMap = new Map(ctx.objectives.map((o) => [o.id, o.title]));
    if (byObj.size) {
      push({ type: "h2", text: "By objective" });
      push({ type: "table", head: ["Objective","Plan","Actual","%"], rows: Array.from(byObj.entries()).map(([id, v]) => [objMap.get(id) ?? "—", v.plan.toLocaleString(), v.actual.toLocaleString(), `${v.plan ? Math.round((v.actual / v.plan) * 100) : 0}%`]) });
    }
  }
  if (sections.initiatives) {
    startPage();
    push({ type: "h1", text: "Initiatives", sub: "Transformation pipeline value creation" });
    const stages = ["L0","L1","L2","L3","L4","L5"];
    const byStage: Record<string, any[]> = {};
    ctx.initiatives.forEach((i) => { (byStage[i.current_stage || "L0"] ??= []).push(i); });
    const totalL1 = ctx.initiatives.reduce((s, i) => s + Number(i.gross_value_l1 ?? 0), 0);
    const totalL2 = ctx.initiatives.reduce((s, i) => s + Number(i.validated_value_l2 ?? 0), 0);
    push({ type: "stats", items: [
      { label: "Total initiatives", value: String(ctx.initiatives.length) },
      { label: "L1 gross value", value: totalL1.toLocaleString() },
      { label: "L2 validated", value: totalL2.toLocaleString(), color: GREEN },
    ] });
    push({ type: "h2", text: "Pipeline by stage" });
    push({ type: "table", head: ["Stage","Count"], rows: stages.map((s) => [s, String((byStage[s] ?? []).length)]) });
    if (ctx.initiatives.length) {
      push({ type: "h2", text: "Top initiatives" });
      const top = [...ctx.initiatives].sort((a, b) => Number(b.validated_value_l2 ?? 0) - Number(a.validated_value_l2 ?? 0)).slice(0, 15);
      push({ type: "table", head: ["Title","Stage","L1","L2"], rows: top.map((i) => [i.title, i.current_stage ?? "L0", Number(i.gross_value_l1 ?? 0).toLocaleString(), Number(i.validated_value_l2 ?? 0).toLocaleString()]) });
    }
  }
  if (sections.a3) {
    startPage();
    push({ type: "h1", text: "A3 Problem Solving", sub: "Structured problem-solving log" });
    if (!ctx.a3s.length) push({ type: "p", text: "No A3s recorded." });
    else push({ type: "table", head: ["Title","Status","Problem"], rows: ctx.a3s.map((a) => [a.title, a.status ?? "", a.problem_statement ?? ""]) });
  }
  if (sections.capex) {
    startPage();
    push({ type: "h1", text: "Turnaround Finance Portfolio", sub: "Projects by gate, spend vs budget, value realization" });
    const totalBudget = ctx.capex.reduce((s, c) => s + Number(c.total_cost ?? 0), 0);
    const totalActual = ctx.capex.reduce((s, c) => s + Number(c.actual_cost ?? 0), 0);
    const realized = ctx.capexVR.reduce((s, v) => s + Number(v.financial_impact ?? 0), 0);
    push({ type: "stats", items: [
      { label: "Projects", value: String(ctx.capex.length) },
      { label: "Total budget", value: totalBudget.toLocaleString() },
      { label: "Actual", value: totalActual.toLocaleString(), color: totalActual <= totalBudget ? GREEN : RED },
      { label: "Realized", value: realized.toLocaleString(), color: GREEN },
    ] });
    if (ctx.capex.length) {
      push({ type: "h2", text: "Projects" });
      push({ type: "table", head: ["#","Title","Gate","Budget","Actual","Score","Status"], rows: ctx.capex.map((c) => [c.number ?? "—", c.title, c.stage ?? "—", Number(c.total_cost ?? 0).toLocaleString(), Number(c.actual_cost ?? 0).toLocaleString(), String(c.total_score ?? "—"), c.status ?? ""]) });
    }
    if (ctx.capexVR.length) {
      const capexMap = new Map(ctx.capex.map((c) => [c.id, c.title]));
      push({ type: "h2", text: "Value realization" });
      push({ type: "table", head: ["Project","Metric","Category","Phase","Impact","Status"], rows: ctx.capexVR.map((v) => [capexMap.get(v.capex_project_id) ?? "—", v.metric_name, v.category ?? "", v.review_phase ?? "", Number(v.financial_impact ?? 0).toLocaleString(), v.status ?? ""]) });
    }
    if (!ctx.capex.length && !ctx.capexVR.length) push({ type: "p", text: "No Turnaround Finance projects yet." });
  }
  if (sections.commercial) {
    startPage();
    push({ type: "h1", text: "Commercial Pipeline", sub: `Order book and pipeline vs ${now.getFullYear()} budget` });
    const stageAgg: Record<string, { count: number; value: number }> = {};
    ctx.opps.forEach((o) => { stageAgg[o.stage] ??= { count: 0, value: 0 }; stageAgg[o.stage].count++; stageAgg[o.stage].value += Number(o.value ?? 0); });
    const targetYear = ctx.targets.reduce((s, t) => s + Number(t.amount ?? 0), 0);
    const pipeTotal = ctx.opps.reduce((s, o) => s + Number(o.value ?? 0), 0);
    const delta = pipeTotal - targetYear;
    push({ type: "stats", items: [
      { label: `Budget ${now.getFullYear()}`, value: targetYear.toLocaleString() },
      { label: "Pipeline total", value: pipeTotal.toLocaleString() },
      { label: "Delta", value: delta.toLocaleString(), color: delta >= 0 ? GREEN : RED },
    ] });
    push({ type: "h2", text: "Stage summary" });
    push({ type: "table", head: ["Stage","#","Value"], rows: Object.entries(stageAgg).map(([s, v]) => [s, String(v.count), v.value.toLocaleString()]) });
    const top = ctx.opps.slice(0, 15);
    if (top.length) {
      push({ type: "h2", text: "Top opportunities" });
      push({ type: "table", head: ["Opportunity","Account","Stage","Value","Close"], rows: top.map((o) => [o.name, o.accounts?.name ?? "", o.stage, Number(o.value ?? 0).toLocaleString(), o.expected_close_date ? format(new Date(o.expected_close_date), "d MMM yy") : ""]) });
    }
  }
  if (sections.plan_pipeline) {
    startPage();
    push({ type: "h1", text: "Plan vs Pipeline", sub: "Monthly target vs booked backlog and weighted pipeline" });
    const rows = computePlanRows(ctx.targets, ctx.backlog, ctx.opps, ctx.oppMonthly);
    if (!rows.length) push({ type: "p", text: "No plan or pipeline data available." });
    else {
      const totalTarget = rows.reduce((s, r) => s + r.target, 0);
      const totalBooked = rows.reduce((s, r) => s + r.booked, 0);
      const totalWeighted = rows.reduce((s, r) => s + r.weighted, 0);
      const coverage = totalTarget > 0 ? Math.round(((totalBooked + totalWeighted) / totalTarget) * 100) : 0;
      push({ type: "stats", items: [
        { label: "Plan target", value: totalTarget.toLocaleString() },
        { label: "Booked", value: totalBooked.toLocaleString(), color: GREEN },
        { label: "Weighted", value: totalWeighted.toLocaleString(), color: YELLOW },
        { label: "Coverage", value: `${coverage}%`, color: coverage >= 100 ? GREEN : coverage >= 80 ? YELLOW : RED },
      ] });
      push({ type: "plan_chart", rows });
      const byYear = new Map<number, { target: number; booked: number; weighted: number }>();
      rows.forEach((r) => {
        const cur = byYear.get(r.year) ?? { target: 0, booked: 0, weighted: 0 };
        cur.target += r.target; cur.booked += r.booked; cur.weighted += r.weighted;
        byYear.set(r.year, cur);
      });
      push({ type: "h2", text: "Year rollup" });
      push({ type: "table", head: ["Year","Target","Booked","Weighted","Coverage"], rows: Array.from(byYear.entries()).map(([yr, v]) => {
        const cov = v.target > 0 ? Math.round(((v.booked + v.weighted) / v.target) * 100) : 0;
        return [String(yr), v.target.toLocaleString(), v.booked.toLocaleString(), v.weighted.toLocaleString(), `${cov}%`];
      }) });
    }
  }
  if (sections.stakeholders) {
    startPage();
    push({ type: "h1", text: "Stakeholders & Accounts", sub: "Portfolio criticality and recent engagement" });
    const byCrit: Record<string, number> = {};
    ctx.accounts.forEach((a) => { const c = a.tier ?? "unrated"; byCrit[c] = (byCrit[c] ?? 0) + 1; });
    push({ type: "stats", items: [
      { label: "Accounts", value: String(ctx.accounts.length) },
      { label: "Recent touchpoints", value: String(ctx.touchpoints.length) },
      { label: "Critical", value: String(byCrit["a"] ?? 0), color: RED },
    ] });
    if (ctx.accounts.length) {
      push({ type: "h2", text: "Accounts by criticality" });
      push({ type: "table", head: ["Criticality","#"], rows: Object.entries(byCrit).map(([c, n]) => [c, String(n)]) });
    }
    if (ctx.touchpoints.length) {
      push({ type: "h2", text: "Recent touchpoints" });
      push({ type: "table", head: ["Date","Stakeholder","Type","Summary"], rows: ctx.touchpoints.slice(0, 20).map((t) => [t.scheduled_at ? format(new Date(t.scheduled_at), "d MMM yy") : "—", t.subject ?? "—", t.type ?? "—", t.notes ?? ""]) });
    }
  }
  if (sections.voc) {
    const accName = (id: string | null | undefined) =>
      id ? (ctx.accounts.find((a) => a.id === id)?.name ?? "—") : "Company-wide";
    const metrics = [...ctx.vocMetrics].sort((a, b) => String(a.period).localeCompare(String(b.period)));
    const lastNps = [...metrics].reverse().find((m) => m.nps != null);
    const lastCsat = [...metrics].reverse().find((m) => m.csat != null);
    const openTasks = ctx.vocTasks.filter((t) => t.status !== "done");
    const works = ctx.vocNotes.filter((n) => n.kind === "works_well");
    const improve = ctx.vocNotes.filter((n) => n.kind === "can_improve");
    const feedbackAccounts = new Set(
      ctx.vocNotes.map((n) => n.account_id).filter((x: string | null) => !!x),
    );
    if (metrics.length || ctx.vocNotes.length || ctx.vocTasks.length) {
      startPage();
      push({ type: "h1", text: "Voice of the Customer", sub: "Customer sentiment, feedback themes and follow-up actions" });
      push({ type: "stats", items: [
        { label: "NPS", value: lastNps?.nps != null ? String(lastNps.nps) : "—" },
        { label: "CSAT", value: lastCsat?.csat != null ? `${lastCsat.csat}%` : "—" },
        { label: "Open actions", value: String(openTasks.length), color: openTasks.length ? YELLOW : GREEN },
        { label: "Accounts with feedback", value: String(feedbackAccounts.size) },
      ] });
      if (metrics.length) {
        push({ type: "h2", text: "NPS / CSAT trend" });
        push({ type: "table", head: ["Period","Customer","NPS","CSAT"], rows: metrics.slice(-12).map((m) => [
          m.period ?? "—", accName(m.account_id), m.nps != null ? String(m.nps) : "—", m.csat != null ? `${m.csat}%` : "—",
        ]) });
      }
      if (works.length) {
        push({ type: "h2", text: "What works well" });
        push({ type: "table", head: ["Customer","Feedback"], rows: works.slice(0, 15).map((n) => [accName(n.account_id), n.content ?? ""]) });
      }
      if (improve.length) {
        push({ type: "h2", text: "What can improve" });
        push({ type: "table", head: ["Customer","Feedback"], rows: improve.slice(0, 15).map((n) => [accName(n.account_id), n.content ?? ""]) });
      }
      if (openTasks.length) {
        push({ type: "h2", text: "Open VoC actions" });
        push({ type: "table", head: ["Action","Customer","Owner","Due","Status"], rows: openTasks.slice(0, 20).map((t) => [
          t.title ?? "—", accName(t.account_id), ownerName(ctx.ownerNames, t.owner_id),
          t.due_date ? format(new Date(t.due_date), "d MMM yy") : "—", t.status ?? "—",
        ]) });
      }
    }
  }
  if (sections.framework) {
    startPage();
    push({ type: "h1", text: "Operations Framework Status", sub: "Red / Yellow / Green health per pillar" });
    const counts = { green: 0, yellow: 0, red: 0 } as Record<string, number>;
    ctx.pillars.forEach((p) => { const h = (p.health || "green") as string; if (counts[h] != null) counts[h]++; });
    push({ type: "stats", items: [
      { label: "Green", value: String(counts.green), color: GREEN },
      { label: "Yellow", value: String(counts.yellow), color: YELLOW },
      { label: "Red", value: String(counts.red), color: RED },
    ] });
    push({ type: "table", head: ["Pillar","Status","Focus"], rows: ctx.pillars.map((p) => [p.name, (p.health || "green").toUpperCase(), p.tagline ?? ""]), rygColumns: [1] });
  }
  if (sections.sqdp) {
    startPage();
    push({ type: "h1", text: "Operations Daily Management", sub: `Rolling ${sqdpDays}-day SQDP performance` });
    const cats = ["safety","quality","delivery","productivity","people"];
    push({ type: "table", head: ["Category","Days","Green","Red","% Green"], rows: cats.map((c) => {
      const r = ctx.dmMarks.filter((m) => m.category === c);
      const green = r.filter((m) => m.status === "green").length;
      const red = r.filter((m) => m.status === "red").length;
      const pct = r.length ? Math.round((green / r.length) * 100) : 0;
      return [c.toUpperCase(), String(r.length), String(green), String(red), `${pct}%`];
    }), pctColumns: [4] });
  }
  if (sections.siop) {
    startPage();
    push({ type: "h1", text: "SIOP Cycle", sub: "Latest S&OP cycle — decisions, capacity gaps, KPIs" });
    const latest = ctx.siopCycles[0];
    if (!latest) push({ type: "p", text: "No SIOP cycles defined." });
    else {
      push({ type: "p", text: `Cycle: ${latest.title ?? latest.cycle_month} · Step ${latest.current_step ?? "—"} · Status: ${latest.status ?? "—"}` });
      const cd = ctx.siopDecisions.filter((d: any) => d.cycle_id === latest.id);
      const ck = ctx.siopKpis.filter((k: any) => k.cycle_id === latest.id);
      const cc = ctx.siopCapacity.filter((c: any) => c.cycle_id === latest.id);
      const bottlenecks = cc.filter((c: any) => c.status !== "green");
      push({ type: "stats", items: [
        { label: "Decisions", value: String(cd.length) },
        { label: "Capacity gaps", value: String(bottlenecks.length), color: bottlenecks.length ? RED : GREEN },
        { label: "KPIs", value: String(ck.length) },
      ] });
      if (bottlenecks.length) {
        push({ type: "h2", text: "Capacity bottlenecks" });
        push({ type: "table", head: ["Resource","Type","Available","Required","Gap","Status"], rows: bottlenecks.map((c: any) => {
          const gap = Number(c.available_capacity ?? 0) - Number(c.required_capacity ?? 0);
          return [c.resource_name, c.resource_type, `${Number(c.available_capacity ?? 0).toLocaleString()} ${c.unit ?? ""}`, `${Number(c.required_capacity ?? 0).toLocaleString()} ${c.unit ?? ""}`, gap.toLocaleString(), (c.status ?? "").toUpperCase()];
        }), rygColumns: [5] });
      }
      if (cd.length) {
        push({ type: "h2", text: "Executive decisions" });
        push({ type: "table", head: ["Decision","Rationale","Due","Status"], rows: cd.map((d: any) => [d.decision, d.rationale ?? "", d.due_date ? format(new Date(d.due_date), "d MMM yy") : "—", d.status ?? ""]) });
      }
      if (ck.length) {
        push({ type: "h2", text: "KPI dashboard" });
        push({ type: "table", head: ["KPI","Category","Plan","Actual","Variance","Status"], rows: ck.map((k: any) => [k.kpi_name, k.category ?? "", k.plan_value != null ? String(k.plan_value) : "—", k.actual_value != null ? String(k.actual_value) : "—", k.variance != null ? String(k.variance) : "—", (k.status ?? "").toUpperCase()]), rygColumns: [5] });
      }
    }
  }
  if (sections.siop_long_lead) {
    startPage();
    push({ type: "h1", text: "SIOP — Long-lead & OSP", sub: "At-risk long-lead materials and outside-processing jobs" });
    const atRiskLL = ctx.siopLongLead.filter((m) => m.risk === "high" || m.status !== "on_track");
    const atRiskOsp = ctx.siopOsp.filter((j) => j.status !== "on_track");
    push({ type: "stats", items: [
      { label: "Long-lead items", value: String(ctx.siopLongLead.length) },
      { label: "At risk", value: String(atRiskLL.length), color: atRiskLL.length ? RED : GREEN },
      { label: "OSP jobs", value: String(ctx.siopOsp.length) },
      { label: "OSP at risk", value: String(atRiskOsp.length), color: atRiskOsp.length ? RED : GREEN },
    ] });
    if (atRiskLL.length) {
      push({ type: "h2", text: "Long-lead materials at risk" });
      push({ type: "table", head: ["Material","Supplier","Expected","Risk","Status"], rows: atRiskLL.slice(0, 25).map((m) => [m.material, m.supplier ?? "—", m.expected_date ? format(new Date(m.expected_date), "d MMM yy") : "—", (m.risk ?? "—").toUpperCase(), m.status ?? "—"]) });
    }
    if (atRiskOsp.length) {
      push({ type: "h2", text: "OSP jobs off-track" });
      push({ type: "table", head: ["Job","Vendor","Due","Status"], rows: atRiskOsp.slice(0, 25).map((j) => [j.part_number ?? "—", j.supplier ?? "—", j.promised_return_date ? format(new Date(j.promised_return_date), "d MMM yy") : "—", j.status ?? "—"]) });
    }
  }
  if (sections.supply_chain) {
    startPage();
    push({ type: "h1", text: "Supply Chain", sub: "Spend, supplier performance, risk, contracts and escalations" });

    const suppliers = ctx.scSuppliers;
    const categories = ctx.scCategories;
    const anyData = suppliers.length || categories.length || ctx.scRisks.length || ctx.scContracts.length || ctx.scEscalations.length;
    if (!anyData) {
      push({ type: "p", text: "No supply chain data recorded. Add categories and suppliers in Operations → Supply chain." });
    } else {
      const catName = new Map(categories.map((c) => [c.id, c.name]));
      const segName = new Map(ctx.scSegments.map((s: any) => [s.id, s.name]));
      const supName = new Map(suppliers.map((s) => [s.id, s.name]));
      const riskTypeName = new Map(ctx.scRiskTypes.map((t: any) => [t.id, t.name]));
      const money = (v: any) => (v == null ? "—" : `$${Math.round(Number(v)).toLocaleString()}`);

      // Latest scorecard score per supplier
      const scoresByCard = new Map<string, number[]>();
      ctx.scScores.forEach((s: any) => {
        if (s.score == null) return;
        const arr = scoresByCard.get(s.scorecard_id) ?? [];
        arr.push(Number(s.score));
        scoresByCard.set(s.scorecard_id, arr);
      });
      const latestBySupplier = new Map<string, { period: string; avg: number | null }>();
      [...ctx.scScorecards]
        .sort((a: any, z: any) => String(z.period_month ?? "").localeCompare(String(a.period_month ?? "")))
        .forEach((c: any) => {
          if (latestBySupplier.has(c.supplier_id)) return;
          const arr = scoresByCard.get(c.id) ?? [];
          latestBySupplier.set(c.supplier_id, {
            period: c.period_month ? format(new Date(c.period_month), "MMM yy") : "—",
            avg: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null,
          });
        });

      const totalSpend = suppliers.reduce((s, x) => s + Number(x.annual_spend ?? 0), 0);
      const soleSource = suppliers.filter((s) => s.sole_source).length;
      const openRisks = ctx.scRisks.filter((r) => r.status !== "closed");
      const highRisks = openRisks.filter((r) => Number(r.likelihood ?? 0) * Number(r.impact ?? 0) >= 12);
      const openEscs = ctx.scEscalations.filter((e) => e.status !== "closed" && !e.closed_at);
      push({ type: "stats", items: [
        { label: "Suppliers", value: String(suppliers.length) },
        { label: "Annual spend", value: money(totalSpend) },
        { label: "Sole-source", value: String(soleSource), color: soleSource ? YELLOW : GREEN },
        { label: "High risks", value: String(highRisks.length), color: highRisks.length ? RED : GREEN },
        { label: "Open escalations", value: String(openEscs.length), color: openEscs.length ? YELLOW : GREEN },
      ] });

      if (categories.length) {
        const rows = [...categories]
          .sort((a, z) => Number(z.annual_spend ?? 0) - Number(a.annual_spend ?? 0))
          .slice(0, 15)
          .map((c) => {
            const sup = suppliers.filter((s) => s.category_id === c.id);
            return [
              c.name ?? "—",
              money(c.annual_spend),
              String(sup.length || c.supplier_count || 0),
              sup.some((s) => s.sole_source) ? "Yes" : "No",
              c.strategy_status ?? "—",
            ];
          });
        push({ type: "h2", text: "Spend by category" });
        push({ type: "table", head: ["Category", "Annual spend", "Suppliers", "Sole-source", "Strategy status"], rows });
      }

      if (suppliers.length) {
        const rows = [...suppliers]
          .sort((a, z) => Number(z.annual_spend ?? 0) - Number(a.annual_spend ?? 0))
          .slice(0, 20)
          .map((s) => {
            const sc = latestBySupplier.get(s.id);
            return [
              s.name ?? "—",
              catName.get(s.category_id) ?? "—",
              segName.get(s.segment_id) ?? "—",
              money(s.annual_spend),
              sc?.avg != null ? `${sc.avg.toFixed(1)} (${sc.period})` : "—",
              s.status ?? "—",
            ];
          });
        push({ type: "h2", text: "Top suppliers by spend" });
        push({ type: "table", head: ["Supplier", "Category", "Segment", "Annual spend", "Latest score", "Status"], rows });
      }

      if (openRisks.length) {
        const rows = [...openRisks]
          .sort((a, z) => Number(z.likelihood ?? 0) * Number(z.impact ?? 0) - Number(a.likelihood ?? 0) * Number(a.impact ?? 0))
          .slice(0, 20)
          .map((r) => [
            supName.get(r.supplier_id) ?? "—",
            riskTypeName.get(r.risk_type_id) ?? "—",
            r.title ?? "—",
            `${r.likelihood ?? "—"}×${r.impact ?? "—"} = ${Number(r.likelihood ?? 0) * Number(r.impact ?? 0)}`,
            r.mitigation ?? "—",
            r.review_date ? format(new Date(r.review_date), "d MMM yy") : "—",
          ]);
        push({ type: "h2", text: "Open supplier risks" });
        push({ type: "table", head: ["Supplier", "Risk type", "Risk", "Severity", "Mitigation", "Review"], rows });
      }

      const horizon = new Date(now); horizon.setDate(horizon.getDate() + 180);
      const expiring = ctx.scContracts
        .filter((c) => c.end_date && new Date(c.end_date) <= horizon)
        .sort((a, z) => String(a.end_date).localeCompare(String(z.end_date)));
      if (expiring.length) {
        push({ type: "h2", text: "Contracts expiring within 180 days" });
        push({ type: "table", head: ["Supplier", "Contract", "Type", "Ends", "Status"], rows: expiring.slice(0, 20).map((c) => [
          supName.get(c.supplier_id) ?? "—",
          c.title ?? "—",
          c.contract_type ?? "—",
          c.end_date ? format(new Date(c.end_date), "d MMM yy") : "—",
          c.status ?? "—",
        ]) });
      }

      if (openEscs.length) {
        push({ type: "h2", text: "Open supplier escalations" });
        push({ type: "table", head: ["Level", "Supplier", "Issue", "Opened", "Due", "Status"], rows: openEscs.slice(0, 20).map((e) => [
          `L${e.level_no ?? "—"}`,
          supName.get(e.supplier_id) ?? "—",
          e.title ?? "—",
          e.opened_at ? format(new Date(e.opened_at), "d MMM yy") : "—",
          e.due_date ? format(new Date(e.due_date), "d MMM yy") : "—",
          e.status ?? "—",
        ]) });
      }
    }
  }
  if (sections.npi) {
    startPage();
    push({ type: "h1", text: "NPI Portfolio", sub: "AS9145 gate distribution, checklist completion, risks" });
    if (!ctx.npiProjects.length) push({ type: "p", text: "No NPI projects." });
    else {
      const byGate: Record<string, number> = {};
      ctx.npiProjects.forEach((p) => { const g = p.current_gate ?? "G0"; byGate[g] = (byGate[g] ?? 0) + 1; });
      const openRisks = ctx.npiRisks.filter((r) => r.status !== "closed");
      const done = ctx.npiChecklist.filter((c) => c.completed).length;
      push({ type: "stats", items: [
        { label: "Projects", value: String(ctx.npiProjects.length) },
        { label: "Checklist done", value: `${done} / ${ctx.npiChecklist.length}` },
        { label: "Open risks", value: String(openRisks.length), color: openRisks.length ? RED : GREEN },
      ] });
      push({ type: "h2", text: "Gate distribution" });
      push({ type: "table", head: ["Gate","#"], rows: Object.entries(byGate).map(([g, n]) => [g, String(n)]) });
      push({ type: "h2", text: "Projects" });
      push({ type: "table", head: ["Part #","Name","Customer","Gate","Health","Status"], rows: ctx.npiProjects.slice(0, 20).map((p) => [p.part_number ?? "—", p.part_name ?? "—", p.customer ?? "—", p.current_gate ?? "—", (p.health ?? "—").toUpperCase(), p.status ?? "—"]), rygColumns: [4] });
      if (openRisks.length) {
        push({ type: "h2", text: "Top open risks" });
        push({ type: "table", head: ["Risk","Severity","Owner","Status"], rows: openRisks.slice(0, 15).map((r) => [r.title ?? "—", r.impact ?? "—", ownerName(ctx.ownerNames, r.owner_id), r.status ?? "—"]) });
      }
    }
  }
  if (sections.compliance) {
    startPage();
    push({ type: "h1", text: "Compliance Readiness", sub: "Part 145 pillar snapshots and audit history" });
    if (!ctx.complianceSnaps.length) push({ type: "p", text: "No compliance snapshots saved. Save one from Operations → Compliance." });
    else {
      push({ type: "table", head: ["Date","Saved by","Score","Pillars complete","Notes"], rows: ctx.complianceSnaps.map((s) => [s.created_at ? format(new Date(s.created_at), "d MMM yy") : "—", s.created_by_email ?? "—", s.percent != null ? `${s.percent}%` : "—", String(s.state ?? "—"), s.label ?? ""]) });
    }
  }
  if (sections.shopfloor) {
    startPage();
    push({ type: "h1", text: "Shop-floor Flow", sub: "WIP by line and gate, bottlenecks" });
    if (!ctx.shopLines.length) push({ type: "p", text: "No shop floor lines configured." });
    else {
      push({ type: "table", head: ["Line","Gates","Parts in WIP"], rows: ctx.shopLines.map((l) => {
        const g = ctx.shopGates.filter((x) => x.line_id === l.id).length;
        const p = ctx.shopParts.filter((x) => x.line_id === l.id).length;
        return [l.name, String(g), String(p)];
      }) });
      const wipByGate = new Map<string, number>();
      ctx.shopParts.forEach((p) => { wipByGate.set(p.current_gate_id, (wipByGate.get(p.current_gate_id) ?? 0) + 1); });
      const bottlenecks = ctx.shopGates.map((g) => ({ g, wip: wipByGate.get(g.id) ?? 0, over: (wipByGate.get(g.id) ?? 0) > Number(g.wip_cap ?? Infinity) })).filter((x) => x.over);
      if (bottlenecks.length) {
        push({ type: "h2", text: "Gates over WIP cap" });
        push({ type: "table", head: ["Gate","WIP","Cap"], rows: bottlenecks.map((b) => [b.g.name, String(b.wip), String(b.g.wip_cap ?? "—")]) });
      }
    }
  }
  if (sections.calendar) {
    startPage();
    push({ type: "h1", text: "Audit / Events Calendar", sub: "Next 60 days" });
    const from = new Date(now); from.setDate(from.getDate() - 7);
    const to = new Date(now); to.setDate(to.getDate() + 60);
    const upcoming = ctx.calendar.filter((e) => e.event_date && new Date(e.event_date) >= from && new Date(e.start_date) <= to);
    if (!upcoming.length) push({ type: "p", text: "No events scheduled in the next 60 days." });
    else push({ type: "table", head: ["Date","Type","Title","Owner","Status"], rows: upcoming.slice(0, 40).map((e) => [format(new Date(e.event_date), "d MMM yy"), e.event_type ?? "—", e.title ?? "—", ownerName(ctx.ownerNames, e.assignee_id), e.status ?? "—"]) });
  }
  if (sections.escalations) {
    startPage();
    push({ type: "h1", text: "Open 3C Escalations", sub: "Concerns, causes and countermeasures in flight" });
    if (!ctx.escs.length) push({ type: "p", text: "No open escalations." });
    else push({ type: "table", head: ["Date","Cat","Concern","Cause","Countermeasure","Status"], rows: ctx.escs.map((e) => [format(new Date(e.occurred_on), "d MMM"), e.category, e.concern ?? "", e.cause ?? "", e.countermeasure ?? "", e.status ?? ""]) });
  }
  if (sections.kpis) {
    startPage();
    push({ type: "h1", text: "Key KPIs", sub: "Key KPIs only — star a KPI on the KPIs page to include it" });
    const year = now.getFullYear();
    const keyKpis = filterKeyKpis(ctx.kpis);
    if (!keyKpis.length) {
      push({ type: "p", text: "No key KPIs pinned. Star a KPI on the KPIs page to feature it in the board report." });
    } else {
      const byPillar = new Map<string, any[]>();
      keyKpis.forEach((k: any) => {
        const pname = k.pillars?.name ?? "Unassigned";
        if (!byPillar.has(pname)) byPillar.set(pname, []);
        byPillar.get(pname)!.push(k);
      });
      for (const [pname, ks] of byPillar) {
        const charts = ks.map((k) => buildKpiChart(k, ctx.kpiVals, year));
        push({ type: "kpi_charts", pillar: pname, kpis: charts });
      }
    }
  }
  if (sections.pillar_actions) {
    startPage();
    push({ type: "h1", text: "Pillar Actions", sub: "Open tasks grouped by pillar board" });
    const openTasks = ctx.tasks.filter((t) => t.status !== "done");
    ctx.pillars.forEach((p) => {
      const rows = openTasks.filter((t) => t.pillar_id === p.id);
      if (!rows.length) return;
      push({ type: "h2", text: p.name });
      push({ type: "table", head: ["Task","Status","Priority","Due"], rows: rows.map((t) => [t.title, t.status ?? "", t.priority ?? "", t.due_date ? format(new Date(t.due_date), "d MMM") : ""]) });
    });
  }
  if (sections.pillar_retro) {
    startPage();
    push({ type: "h1", text: "Pillar Retrospective", sub: "What is working — and what to improve" });
    ctx.pillars.forEach((p) => {
      const pn = ctx.notes.filter((n) => n.pillar_id === p.id);
      if (!pn.length) return;
      push({ type: "h2", text: p.name });
      push({
        type: "retro",
        working: pn.filter((n) => n.kind === "working_well").map((n) => n.content || "—"),
        improve: pn.filter((n) => n.kind === "can_improve").map((n) => n.content || "—"),
      });
    });
  }
  if (sections.people) {
    startPage();
    push({ type: "h1", text: "People Capability", sub: "Skill coverage, expiring certifications, dev plans" });
    let met = 0, totalReq = 0;
    ctx.emp.forEach((e) => {
      if (!e.role_id) return;
      const rr = ctx.reqs.filter((r) => r.role_id === e.role_id);
      rr.forEach((r) => {
        totalReq++;
        const es = ctx.empSk.find((s) => s.employee_id === e.id && s.skill_id === r.skill_id);
        if (es && Number(es.level ?? 0) >= Number(r.required_level ?? 0)) met++;
      });
    });
    const pct = totalReq ? Math.round((met / totalReq) * 100) : 0;
    push({ type: "p", text: `Coverage: ${pct}% (${met} / ${totalReq})` });
    const horizon = subDays(now, -90);
    const expiring = ctx.certs.filter((c) => c.expires_on && new Date(c.expires_on) <= horizon);
    if (expiring.length) {
      push({ type: "h2", text: "Certifications expiring (90d)" });
      push({ type: "table", head: ["Employee","Certification","Expires"], rows: expiring.map((c) => [c.employees ? `${c.employees.first_name} ${c.employees.last_name}` : "—", c.name || c.skills?.name || "—", format(new Date(c.expires_on), "d MMM yy")]) });
    }
    if (ctx.dev.length) {
      push({ type: "h2", text: "Development plans" });
      push({ type: "table", head: ["Employee","Skill","Current → Target","Due","Status"], rows: ctx.dev.map((p) => [p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : "—", p.skills?.name ?? "—", `${p.current_level ?? "—"} → ${p.target_level ?? "—"}`, p.target_date ? format(new Date(p.target_date), "d MMM yy") : "—", p.status ?? "—"]) });
    }
  }
  if (sections.tasks) {
    startPage();
    push({ type: "h1", text: "Tasks & Actions", sub: `Filter: ${taskFilter}` });
    const filtered = ctx.tasks.filter((t) => {
      if (taskFilter === "open") return t.status !== "done";
      if (taskFilter === "closed") return t.status === "done";
      return true;
    });
    push({ type: "p", text: `Filter: ${taskFilter} · ${filtered.length} tasks` });
    push({ type: "table", head: ["Task","Pillar","Status","Priority","Due"], rows: filtered.map((t) => [t.title, t.pillars?.name ?? "", t.status ?? "", t.priority ?? "", t.due_date ? format(new Date(t.due_date), "d MMM") : ""]) });
  }

  return pages;
}

