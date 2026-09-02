import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, format, startOfMonth, subDays } from "date-fns";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateBoardPdf } from "@/lib/board-pdf";
import { generateBoardPptx } from "@/lib/board-pptx";
import { assignIds } from "@/lib/board-report-blocks";
import {
  formatTileTrend,
  formatTileValue,
  type OwnerFinancialRow,
  type OwnerKpiPoint,
  type Ryg,
} from "@/lib/owner-dashboard";
import {
  DEFAULT_BH_CONFIG,
  applyBhConfig,
  bhScorecard,
  bhSelectedMetricIds,
  buildBhPages,
  computeBhTiles,
  normalizeBhConfig,
  type BhTemplateConfig,
} from "@/lib/business-health";
import { BH_SECTIONS, type BhSectionId } from "@/lib/business-health-catalogue";
import { BusinessHealthCatalogueDialog } from "@/components/report/business-health-catalogue-dialog";

export const Route = createFileRoute("/_authenticated/report/business-health")({
  head: () => ({
    meta: [
      { title: "Business health review — DO.Impact" },
      {
        name: "description",
        content:
          "A structured business health and operational excellence review across financial health, strategy, commercial, operations and people.",
      },
      { property: "og:title", content: "Business health review — DO.Impact" },
      {
        property: "og:description",
        content: "Pick your measures, add the commentary, export the review as PDF or PowerPoint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessHealthPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type TemplateRow = { id: string; name: string; is_default: boolean; config: unknown };

const db = (t: string) => (supabase as never as { from: (t: string) => any }).from(t);

function statusClasses(s: Ryg) {
  if (s === "red") return "border-destructive/40 bg-destructive/5";
  if (s === "amber") return "border-amber-500/40 bg-amber-500/5";
  if (s === "green") return "border-emerald-500/40 bg-emerald-500/5";
  return "border-border bg-card";
}
function dotClasses(s: Ryg) {
  if (s === "red") return "bg-destructive";
  if (s === "amber") return "bg-amber-500";
  if (s === "green") return "bg-emerald-500";
  return "bg-muted-foreground/40";
}

function BusinessHealthPage() {
  const qc = useQueryClient();
  const { data: active } = useActiveCompany();
  const companyId = active?.company_id;
  const companyName = active?.companies?.name ?? "Company";
  const readOnly = !!active?.companies?.is_template;

  const now = useMemo(() => new Date(), []);
  const [periodLabel, setPeriodLabel] = useState(format(now, "MMMM yyyy"));
  const [headline, setHeadline] = useState("");
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);
  const [config, setConfig] = useState<BhTemplateConfig>(DEFAULT_BH_CONFIG);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pptxBusy, setPptxBusy] = useState(false);

  // ── data ────────────────────────────────────────────────────────────
  const { data: fins = [] } = useQuery({
    queryKey: ["bh-financials", companyId],
    enabled: !!companyId,
    queryFn: async () =>
      ((await db("owner_financials").select("*").order("month", { ascending: true })).data ?? []) as OwnerFinancialRow[],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["bh-templates", companyId],
    enabled: !!companyId,
    queryFn: async () =>
      ((await db("business_health_templates")
        .select("id, name, is_default, config")
        .order("created_at", { ascending: true })).data ?? []) as TemplateRow[],
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ["bh-kpis", companyId],
    enabled: !!companyId,
    queryFn: async () =>
      (await supabase.from("kpis").select("id, name, unit, target, higher_is_better, is_key").is("archived_at", null)).data ?? [],
  });
  const { data: kpiValues = [] } = useQuery({
    queryKey: ["bh-kpi-values", companyId],
    enabled: !!companyId,
    queryFn: async () =>
      (await supabase.from("kpi_values").select("kpi_id, period_start, actual").order("period_start", { ascending: false })).data ?? [],
  });

  const { data: commercialRaw } = useQuery({
    queryKey: ["bh-commercial", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const in180 = format(addDays(new Date(), 180), "yyyy-MM-dd");
      const [backlog, targets, opps, accounts, quotes, contractsActive, contractsExp, voc] = await Promise.all([
        supabase.from("booked_backlog").select("year, month, amount"),
        supabase.from("growth_targets").select("year, month, amount"),
        supabase.from("opportunities").select("account_id, value, probability, stage").eq("archived", false),
        supabase.from("accounts").select("id", { count: "exact", head: true }).is("archived_at", null),
        supabase.from("quotes").select("id", { count: "exact", head: true }).in("status", ["draft", "sent", "negotiating"]),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", "active").gte("end_date", today).lte("end_date", in180),
        supabase.from("voc_tasks").select("id", { count: "exact", head: true }).is("archived_at", null).neq("status", "done"),
      ]);
      return {
        backlog: backlog.data ?? [],
        targets: targets.data ?? [],
        opps: opps.data ?? [],
        accounts: accounts.count ?? 0,
        quotesOpen: quotes.count ?? 0,
        contractsActive: contractsActive.count ?? 0,
        contractsExpiring: contractsExp.count ?? 0,
        vocOpen: voc.count ?? 0,
      };
    },
  });

  const { data: strategyRaw } = useQuery({
    queryKey: ["bh-strategy", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const in90 = format(addMonths(new Date(), 3), "yyyy-MM-dd");
      const [objectives, hoshin, initiatives, waterfall, a3, overdue, open, blocked, certs] = await Promise.all([
        supabase.from("strategic_objectives").select("status").is("archived_at", null),
        supabase.from("hoshin_items").select("id", { count: "exact", head: true }).is("archived_at", null),
        supabase.from("initiatives").select("current_stage").is("archived_at", null),
        supabase.from("waterfall_items").select("gross_impact, realization_pct").is("archived_at", null),
        supabase.from("a3_reports").select("id", { count: "exact", head: true }).in("status", ["draft", "active"]),
        supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", today).neq("status", "done"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "done"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "blocked"),
        supabase.from("certifications").select("id", { count: "exact", head: true }).gte("expires_on", today).lte("expires_on", in90),
      ]);
      const objs = (objectives.data ?? []) as { status: string | null }[];
      const inits = (initiatives.data ?? []) as { current_stage: string | null }[];
      const wf = (waterfall.data ?? []) as { gross_impact: number | null; realization_pct: number | null }[];
      const plan = wf.reduce((a, r) => a + Number(r.gross_impact ?? 0), 0);
      const actual = wf.reduce((a, r) => a + (Number(r.gross_impact ?? 0) * Number(r.realization_pct ?? 0)) / 100, 0);
      return {
        objectives: objs.length,
        onTrack: objs.filter((o) => o.status === "on_track" || o.status === "done").length,
        atRisk: objs.filter((o) => o.status === "at_risk").length,
        notStarted: objs.filter((o) => o.status === "not_started").length,
        hoshinItems: hoshin.count ?? 0,
        initiatives: inits.filter((i) => i.current_stage !== "L5").length,
        initiativesDone: inits.filter((i) => i.current_stage === "L5").length,
        benefitPlan: wf.length ? plan : null,
        benefitActual: wf.length ? actual : null,
        a3Open: a3.count ?? 0,
        overdueActions: overdue.count ?? 0,
        openActions: open.count ?? 0,
        blockedActions: blocked.count ?? 0,
        expiringCerts: certs.count ?? 0,
      };
    },
  });

  const { data: operationsRaw } = useQuery({
    queryKey: ["bh-operations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const since = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const yearStart = format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd");
      const [esc, marks, downtime, copq, suppliers, risks, longLead, npi, gates, capex, capexRisk] = await Promise.all([
        supabase.from("dm_escalations").select("id", { count: "exact", head: true }).neq("status", "closed").is("archived_at", null),
        supabase.from("dm_marks").select("id", { count: "exact", head: true }).eq("status", "red").gte("mark_date", since),
        supabase.from("aps_downtime").select("hours, planned").gte("start_date", since),
        supabase.from("copq_entries").select("cost").gte("month", yearStart),
        supabase.from("sc_suppliers").select("id", { count: "exact", head: true }).is("archived_at", null),
        supabase.from("sc_risks").select("id", { count: "exact", head: true }).is("archived_at", null).neq("status", "closed"),
        supabase.from("siop_long_lead_materials").select("id", { count: "exact", head: true }).in("risk", ["high", "red", "critical"]),
        supabase.from("npi_projects").select("id", { count: "exact", head: true }).is("archived_at", null),
        supabase.from("npi_gate_checklist").select("id", { count: "exact", head: true }).eq("completed", false),
        supabase.from("capex_projects").select("id", { count: "exact", head: true }).is("archived_at", null).neq("stage", "closed"),
        supabase.from("capex_projects").select("id", { count: "exact", head: true }).is("archived_at", null).eq("health", "red"),
      ]);
      const dt = (downtime.data ?? []) as { hours: number | null; planned: boolean | null }[];
      const copqRows = (copq.data ?? []) as { cost: number | null }[];
      return {
        openEscalations: esc.count ?? 0,
        redMarks: marks.count ?? 0,
        downtimeHours: dt.length ? dt.filter((d) => !d.planned).reduce((a, d) => a + Number(d.hours ?? 0), 0) : null,
        copqTotal: copqRows.length ? copqRows.reduce((a, r) => a + Number(r.cost ?? 0), 0) : null,
        suppliers: suppliers.count ?? 0,
        suppliersAtRisk: risks.count ?? 0,
        longLeadAtRisk: longLead.count ?? 0,
        npiProjects: npi.count ?? 0,
        npiGatesLate: gates.count ?? 0,
        capexProjects: capex.count ?? 0,
        capexAtRisk: capexRisk.count ?? 0,
      };
    },
  });

  const { data: peopleRaw } = useQuery({
    queryKey: ["bh-people", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [employees, skills, requirements, roles, devPlans, training] = await Promise.all([
        supabase.from("employees").select("id, role_id").is("archived_at", null).neq("status", "left"),
        supabase.from("employee_skills").select("employee_id, skill_id, level"),
        supabase.from("role_requirements").select("role_id, skill_id, required_level"),
        supabase.from("job_roles").select("id"),
        supabase.from("development_plans").select("id", { count: "exact", head: true }).neq("status", "done"),
        supabase.from("training_actions").select("id", { count: "exact", head: true }),
      ]);
      const emps = (employees.data ?? []) as { id: string; role_id: string | null }[];
      const reqs = (requirements.data ?? []) as { role_id: string; skill_id: string; required_level: number }[];
      const have = new Map<string, number>();
      for (const s of (skills.data ?? []) as { employee_id: string; skill_id: string; level: number }[]) {
        have.set(`${s.employee_id}|${s.skill_id}`, Number(s.level ?? 0));
      }
      let required = 0;
      let met = 0;
      for (const e of emps) {
        if (!e.role_id) continue;
        for (const r of reqs.filter((x) => x.role_id === e.role_id)) {
          required += 1;
          if ((have.get(`${e.id}|${r.skill_id}`) ?? 0) >= Number(r.required_level ?? 0)) met += 1;
        }
      }
      const filledRoles = new Set(emps.map((e) => e.role_id).filter(Boolean));
      return {
        employees: emps.length,
        skillsCoverage: required ? (met / required) * 100 : null,
        openRoles: Math.max(0, ((roles.data ?? []).length || 0) - filledRoles.size),
        devPlans: devPlans.count ?? 0,
        trainingOpen: training.count ?? 0,
      };
    },
  });

  // Load the default template once available.
  useEffect(() => {
    if (!templates.length || activeTemplateId) return;
    const def = templates.find((t) => t.is_default) ?? templates[0];
    setActiveTemplateId(def.id);
    setConfig(normalizeBhConfig(def.config));
  }, [templates, activeTemplateId]);

  // ── derived ─────────────────────────────────────────────────────────
  const kpiPoints: OwnerKpiPoint[] = useMemo(() => {
    const byKpi = new Map<string, number[]>();
    for (const v of kpiValues as { kpi_id: string; actual: number | null }[]) {
      if (v.actual == null) continue;
      const arr = byKpi.get(v.kpi_id) ?? [];
      if (arr.length < 2) arr.push(Number(v.actual));
      byKpi.set(v.kpi_id, arr);
    }
    // Key KPIs first so the review binds to the headline measure when several match.
    return [...(kpis as any[])]
      .sort((a, b) => Number(b.is_key === true) - Number(a.is_key === true))
      .map((k) => {
        const series = byKpi.get(k.id) ?? [];
        return {
          libraryKey: null,
          name: k.name as string,
          unit: k.unit ?? null,
          target: k.target == null ? null : Number(k.target),
          higherIsBetter: k.higher_is_better !== false,
          latest: series[0] ?? null,
          previous: series[1] ?? null,
        };
      });
  }, [kpis, kpiValues]);

  const commercial = useMemo(() => {
    const start = startOfMonth(new Date());
    const window = Array.from({ length: 12 }, (_, i) => addMonths(start, i)).map((d) => ({
      y: d.getFullYear(),
      m: d.getMonth() + 1,
    }));
    const inWindow = (r: { year: number; month: number }) => window.some((w) => w.y === r.year && w.m === r.month);
    const backlog12 = (commercialRaw?.backlog ?? []).filter(inWindow).reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);
    const target12 = (commercialRaw?.targets ?? []).filter(inWindow).reduce((a: number, r: any) => a + Number(r.amount ?? 0), 0);
    const opps = (commercialRaw?.opps ?? []) as any[];
    const open = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");
    const weightedPipeline = open.reduce((a, o) => a + Number(o.value ?? 0) * (Number(o.probability ?? 0) / 100), 0);
    const byAccount = new Map<string, number>();
    for (const o of open) byAccount.set(o.account_id, (byAccount.get(o.account_id) ?? 0) + Number(o.value ?? 0));
    const totalOpen = open.reduce((a, o) => a + Number(o.value ?? 0), 0);
    const top = Math.max(0, ...Array.from(byAccount.values()));
    return {
      backlog12,
      target12,
      weightedPipeline,
      openPipeline: totalOpen,
      openCount: open.length,
      wonCount: opps.filter((o) => o.stage === "won").length,
      lostCount: opps.filter((o) => o.stage === "lost").length,
      topAccountShare: totalOpen > 0 ? (top / totalOpen) * 100 : null,
      accounts: commercialRaw?.accounts ?? 0,
      quotesOpen: commercialRaw?.quotesOpen ?? 0,
      contractsActive: commercialRaw?.contractsActive ?? 0,
      contractsExpiring: commercialRaw?.contractsExpiring ?? 0,
      vocOpen: commercialRaw?.vocOpen ?? 0,
    };
  }, [commercialRaw]);

  const tiles = useMemo(
    () =>
      computeBhTiles(
        {
          fins,
          kpis: kpiPoints,
          custom: config.custom,
          commercial,
          strategy: strategyRaw ?? {
            objectives: 0, onTrack: 0, atRisk: 0, notStarted: 0, hoshinItems: 0, initiatives: 0,
            initiativesDone: 0, benefitPlan: null, benefitActual: null, a3Open: 0, overdueActions: 0,
            openActions: 0, blockedActions: 0, expiringCerts: 0,
          },
          operations: operationsRaw ?? {
            openEscalations: 0, redMarks: 0, downtimeHours: null, copqTotal: null, suppliers: 0,
            suppliersAtRisk: 0, longLeadAtRisk: 0, npiProjects: 0, npiGatesLate: 0, capexProjects: 0, capexAtRisk: 0,
          },
          people: peopleRaw ?? { employees: 0, skillsCoverage: null, openRoles: 0, devPlans: 0, trainingOpen: 0 },
        },
        config.targets,
      ),
    [fins, kpiPoints, commercial, strategyRaw, operationsRaw, peopleRaw, config.targets, config.custom],
  );

  const sections = useMemo(() => applyBhConfig(tiles, config), [tiles, config]);
  const score = useMemo(() => bhScorecard(sections), [sections]);
  const pages = useMemo(
    () => assignIds(buildBhPages(companyName, periodLabel, sections, narratives, headline)),
    [companyName, periodLabel, sections, narratives, headline],
  );

  // ── config actions ──────────────────────────────────────────────────
  function patch(next: Partial<BhTemplateConfig>) {
    setConfig((c) => ({ ...c, ...next }));
  }
  function toggleTile(id: string) {
    setConfig((c) => ({
      ...c,
      hiddenTiles: c.hiddenTiles.includes(id) ? c.hiddenTiles.filter((x) => x !== id) : [...c.hiddenTiles, id],
    }));
  }
  function moveTile(section: BhSectionId, id: string, dir: -1 | 1) {
    setConfig((c) => {
      const currentOrder = c.tileOrder[section] ?? tiles.filter((t) => t.section === section).map((t) => t.id);
      const list = [...currentOrder];
      const i = list.indexOf(id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...c, tileOrder: { ...c.tileOrder, [section]: list } };
    });
  }
  function moveSection(id: BhSectionId, dir: -1 | 1) {
    setConfig((c) => {
      const list = [...c.sections];
      const i = list.indexOf(id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...c, sections: list };
    });
  }

  async function saveTemplate(asNew: boolean) {
    if (readOnly) {
      toast.error("TitanScale Template is read-only. Duplicate it to edit.");
      return;
    }
    const name = asNew ? window.prompt("Template name", "Business health review")?.trim() : undefined;
    if (asNew && !name) return;
    setSaving(true);
    try {
      if (asNew || !activeTemplateId) {
        const { data, error } = await db("business_health_templates")
          .insert({ name: name ?? "Business health review", config, is_default: !templates.length })
          .select("id")
          .single();
        if (error) throw error;
        setActiveTemplateId(data.id);
      } else {
        const { error } = await db("business_health_templates").update({ config }).eq("id", activeTemplateId);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["bh-templates", companyId] });
      toast.success("Template saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the template");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault() {
    if (!activeTemplateId || readOnly) return;
    try {
      await db("business_health_templates").update({ is_default: false }).neq("id", activeTemplateId);
      const { error } = await db("business_health_templates").update({ is_default: true }).eq("id", activeTemplateId);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["bh-templates", companyId] });
      toast.success("Default template set");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set the default");
    }
  }

  async function deleteTemplate() {
    if (!activeTemplateId || readOnly) return;
    if (!window.confirm("Delete this template?")) return;
    try {
      const { error } = await db("business_health_templates").delete().eq("id", activeTemplateId);
      if (error) throw error;
      setActiveTemplateId(null);
      setConfig(DEFAULT_BH_CONFIG);
      await qc.invalidateQueries({ queryKey: ["bh-templates", companyId] });
      toast.success("Template deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the template");
    }
  }

  async function saveReview() {
    if (readOnly) {
      toast.error("TitanScale Template is read-only. Duplicate it to edit.");
      return;
    }
    try {
      const { error } = await db("business_health_reviews").insert({
        period_label: periodLabel,
        headline,
        narratives,
        config,
      });
      if (error) throw error;
      toast.success("Review saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the review");
    }
  }

  async function exportPdf() {
    setPdfBusy(true);
    try {
      await generateBoardPdf({
        companyName,
        periodLabel,
        pages,
        generatedOn: now,
        fileName: `${companyName.replace(/\s+/g, "_")}_Business_Health_${format(now, "yyyy-MM-dd")}.pdf`,
      });
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setPdfBusy(false);
    }
  }

  async function exportPptx() {
    setPptxBusy(true);
    try {
      await generateBoardPptx({
        companyName,
        periodLabel,
        pages,
        fileName: `${companyName.replace(/\s+/g, "_")}_Business_Health_${format(now, "yyyy-MM-dd")}.pptx`,
      });

      toast.success("PowerPoint downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PowerPoint");
    } finally {
      setPptxBusy(false);
    }
  }

  const hiddenTiles = tiles.filter((t) => config.hiddenTiles.includes(t.id));

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link to="/report/board" className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          Full board pack
        </Link>
        <Link to="/report/owner" className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          Owner dashboard
        </Link>
        <span className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          Business health
        </span>
        <Link to="/report/industrial-strategy" className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50">
          Industrial Strategy
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Business health & operational excellence review</h1>
          <p className="text-sm text-muted-foreground">
            Financial health up front, then the four pillars — strategy, commercial, operations and people. Pick the
            measures you want from the catalogue and add the commentary.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-9 w-40" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} aria-label="Period label" />
          <Button variant="outline" size="sm" onClick={() => setCatalogueOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Add measures
          </Button>
          <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
            {editMode ? "Done editing" : "Customise"}
          </Button>
          <Button variant="outline" size="sm" onClick={saveReview} disabled={readOnly}>
            <Save className="mr-1.5 size-4" /> Save review
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Download className="mr-1.5 size-4" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportPptx} disabled={pptxBusy}>
            {pptxBusy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <FileText className="mr-1.5 size-4" />}
            PowerPoint
          </Button>
        </div>
      </div>

      {/* Template bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</span>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTemplateId(t.id);
              setConfig(normalizeBhConfig(t.config));
            }}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              activeTemplateId === t.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
            }`}
          >
            {t.name}
            {t.is_default ? " ·  default" : ""}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfig(DEFAULT_BH_CONFIG)}>
            <RotateCcw className="mr-1.5 size-4" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveTemplate(false)} disabled={saving || readOnly}>
            <Save className="mr-1.5 size-4" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveTemplate(true)} disabled={saving || readOnly}>
            <Plus className="mr-1.5 size-4" /> Save as new
          </Button>
          {activeTemplateId && (
            <>
              <Button variant="ghost" size="sm" onClick={makeDefault} disabled={readOnly}>
                Set default
              </Button>
              <Button variant="ghost" size="sm" onClick={deleteTemplate} disabled={readOnly}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Executive summary */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Executive summary (appears at the top of the export)</label>
          <Textarea
            rows={3}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Where the business stands, what changed this period, and the three things we are doing about it."
          />
        </div>
        <div className="grid grid-cols-4 gap-2 self-end">
          {[
            { label: "Measures", value: score.total, cls: "text-foreground" },
            { label: "On target", value: score.green, cls: "text-emerald-500" },
            { label: "Watch", value: score.amber, cls: "text-amber-500" },
            { label: "Off target", value: score.red, cls: "text-destructive" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
              <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((s, si) => (
          <section key={s.section}>
            <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
              <h2 className="text-base font-semibold">{s.label}</h2>
              <span className="text-xs text-muted-foreground">{s.question}</span>
              {editMode && (
                <span className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => moveSection(s.section, -1)} disabled={si === 0}>
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => moveSection(s.section, 1)}
                    disabled={si === sections.length - 1}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </span>
              )}
            </div>

            {s.groups.map((g) => (
              <div key={g.id} className="mb-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {g.tiles.map((t, ti) => (
                    <div key={t.id} className={`rounded-lg border p-4 ${statusClasses(t.status)}`}>
                      <div className="flex items-start justify-between gap-2">
                        {editMode ? (
                          <Input
                            className="h-7 text-xs"
                            value={t.label}
                            onChange={(e) => patch({ renames: { ...config.renames, [t.id]: e.target.value } })}
                          />
                        ) : (
                          <div className="text-xs font-medium text-muted-foreground">{t.label}</div>
                        )}
                        <span className={`mt-1 size-2 shrink-0 rounded-full ${dotClasses(t.status)}`} />
                      </div>
                      <div className="mt-2 text-2xl font-bold">{formatTileValue(t.value, t.unit)}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Target {t.target == null ? "—" : formatTileValue(t.target, t.unit)}</span>
                        <span className="flex items-center gap-0.5">
                          {t.trend == null ? <Minus className="size-3" /> : t.trend > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                          {formatTileTrend(t.trend, t.unit)}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground/80">{t.hint ?? t.trendLabel}</div>
                      {editMode && (
                        <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
                          <Input
                            className="h-7 w-24 text-xs"
                            placeholder="Target"
                            defaultValue={config.targets[t.id] ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              const next = { ...config.targets };
                              if (!v) delete next[t.id];
                              else next[t.id] = Number(v);
                              patch({ targets: next });
                            }}
                          />
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => moveTile(s.section, t.id, -1)} disabled={ti === 0}>
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => moveTile(s.section, t.id, 1)}
                            disabled={ti === g.tiles.length - 1}
                          >
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="ml-auto size-7" onClick={() => toggleTile(t.id)}>
                            <EyeOff className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Textarea
              rows={2}
              value={narratives[s.section] ?? ""}
              onChange={(e) => setNarratives((v) => ({ ...v, [s.section]: e.target.value }))}
              placeholder={`Commentary on ${s.label.toLowerCase()} — what the numbers mean and what we are doing.`}
            />
          </section>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">No measures in this review yet</p>
          <Button className="mt-4" onClick={() => setCatalogueOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Choose measures
          </Button>
        </div>
      )}

      {editMode && hiddenTiles.length > 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hidden measures</div>
          <div className="flex flex-wrap gap-2">
            {hiddenTiles.map((t) => (
              <Button key={t.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleTile(t.id)}>
                <Eye className="mr-1.5 size-3.5" /> {t.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <BusinessHealthCatalogueDialog
        open={catalogueOpen}
        onOpenChange={setCatalogueOpen}
        selected={bhSelectedMetricIds(config)}
        custom={config.custom}
        onApply={({ selected, custom }) => patch({ selected, custom })}
      />
    </div>
  );
}

/** Sections available for empty-state hints. */
export const BH_SECTION_LABELS = BH_SECTIONS.map((s) => s.label);
