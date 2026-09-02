import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, startOfMonth } from "date-fns";
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
  Pencil,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateBoardPdf } from "@/lib/board-pdf";
import { generateBoardPptx } from "@/lib/board-pptx";
import { assignIds } from "@/lib/board-report-blocks";
import {
  DEFAULT_OWNER_CONFIG,
  OWNER_SECTIONS,
  applyOwnerConfig,
  buildOwnerPages,
  computeOwnerTiles,
  formatTileTrend,
  formatTileValue,
  normalizeOwnerConfig,
  selectedMetricIds,
  type OwnerFinancialRow,
  type OwnerKpiPoint,
  type OwnerSectionId,
  type OwnerTemplateConfig,
  type OwnerTile,
} from "@/lib/owner-dashboard";
import { OWNER_METRICS, type OwnerCustomMetric } from "@/lib/owner-metric-catalogue";
import { OwnerMetricCatalogueDialog } from "@/components/report/owner-metric-catalogue-dialog";

export const Route = createFileRoute("/_authenticated/report/owner")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — DO.Impact" },
      {
        name: "description",
        content:
          "A one-page owner view of the business: money, growth, delivery, cash, people, risk and shareholder value.",
      },
      { property: "og:title", content: "Owner dashboard — DO.Impact" },
      {
        property: "og:description",
        content: "The short board view — targets, trends and status across seven owner questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OwnerDashboardPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type TemplateRow = { id: string; name: string; is_default: boolean; config: unknown };

const MONEY_FIELDS: { key: keyof OwnerFinancialRow; label: string; group: string }[] = [
  { key: "revenue", label: "Revenue", group: "Profit & loss" },
  { key: "revenue_budget", label: "Revenue budget", group: "Profit & loss" },
  { key: "revenue_py", label: "Revenue last year", group: "Profit & loss" },
  { key: "cogs", label: "Cost of goods sold", group: "Profit & loss" },
  { key: "opex", label: "Operating expense", group: "Profit & loss" },
  { key: "ebitda", label: "EBITDA", group: "Profit & loss" },
  { key: "ebitda_budget", label: "EBITDA budget", group: "Profit & loss" },
  { key: "ebitda_py", label: "EBITDA last year", group: "Profit & loss" },
  { key: "cash", label: "Cash on hand", group: "Cash & balance sheet" },
  { key: "debt", label: "Total debt", group: "Cash & balance sheet" },
  { key: "operating_cash_flow", label: "Operating cash flow", group: "Cash & balance sheet" },
  { key: "free_cash_flow", label: "Free cash flow", group: "Cash & balance sheet" },
  { key: "ar_total", label: "Receivables total", group: "Working capital" },
  { key: "ar_over_60", label: "Receivables over 60 days", group: "Working capital" },
  { key: "ap_total", label: "Payables total", group: "Working capital" },
  { key: "inventory", label: "Inventory value", group: "Working capital" },
  { key: "headcount", label: "Headcount", group: "People & risk" },
  { key: "labor_cost", label: "Labour cost", group: "People & risk" },
  { key: "overtime_pct", label: "Overtime %", group: "People & risk" },
  { key: "turnover_pct", label: "Turnover %", group: "People & risk" },
  { key: "safety_incidents", label: "Safety incidents", group: "People & risk" },
  { key: "valuation_multiple", label: "Valuation multiple (x EBITDA)", group: "People & risk" },
];

function statusClasses(s: OwnerTile["status"]): string {
  if (s === "green") return "border-emerald-500/40 bg-emerald-500/5";
  if (s === "amber") return "border-amber-500/40 bg-amber-500/5";
  if (s === "red") return "border-destructive/40 bg-destructive/5";
  return "border-border bg-card";
}

function dotClasses(s: OwnerTile["status"]): string {
  if (s === "green") return "bg-emerald-500";
  if (s === "amber") return "bg-amber-500";
  if (s === "red") return "bg-destructive";
  return "bg-muted-foreground/40";
}

function OwnerDashboardPage() {
  const qc = useQueryClient();
  const { data: active } = useActiveCompany();
  const companyName = active?.companies?.name ?? "Company";
  const readOnly = !!active?.companies?.is_template;

  const now = useMemo(() => new Date(), []);
  const [periodLabel, setPeriodLabel] = useState(format(now, "MMMM yyyy"));
  const [headline, setHeadline] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [config, setConfig] = useState<OwnerTemplateConfig>(DEFAULT_OWNER_CONFIG);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pptxBusy, setPptxBusy] = useState(false);

  // ── data ────────────────────────────────────────────────────────────
  const { data: fins = [], isLoading: finsLoading } = useQuery({
    queryKey: ["owner-financials", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () =>
      ((await (supabase as never as { from: (t: string) => any }).from("owner_financials")
        .select("*")
        .order("month", { ascending: true })).data ?? []) as OwnerFinancialRow[],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["owner-templates", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () =>
      ((await (supabase as never as { from: (t: string) => any }).from("owner_dashboard_templates")
        .select("id, name, is_default, config")
        .order("created_at", { ascending: true })).data ?? []) as TemplateRow[],
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ["owner-kpis", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () =>
      (await supabase.from("kpis").select("id, name, unit, target, higher_is_better, library_key").is("archived_at", null)).data ?? [],
  });
  const { data: kpiValues = [] } = useQuery({
    queryKey: ["owner-kpi-values", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () =>
      (await supabase.from("kpi_values").select("kpi_id, period_start, actual").order("period_start", { ascending: false })).data ?? [],
  });
  const { data: backlog = [] } = useQuery({
    queryKey: ["owner-backlog", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () => (await supabase.from("booked_backlog").select("year, month, amount")).data ?? [],
  });
  const { data: targets = [] } = useQuery({
    queryKey: ["owner-growth-targets", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () => (await supabase.from("growth_targets").select("year, month, amount")).data ?? [],
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["owner-opps", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () =>
      (await supabase.from("opportunities").select("account_id, value, probability, stage").eq("archived", false)).data ?? [],
  });
  const { data: risk } = useQuery({
    queryKey: ["owner-risk", active?.company_id],
    enabled: !!active?.company_id,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const in90 = format(addMonths(new Date(), 3), "yyyy-MM-dd");
      const [esc, overdue, certs, blocked] = await Promise.all([
        supabase.from("dm_escalations").select("id", { count: "exact", head: true }).neq("status", "closed"),
        supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", today).neq("status", "done"),
        supabase.from("certifications").select("id", { count: "exact", head: true }).gte("expires_on", today).lte("expires_on", in90),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "blocked"),

      ]);
      return {
        openEscalations: esc.count ?? 0,
        overdueActions: overdue.count ?? 0,
        expiringCerts: certs.count ?? 0,
        atRiskInitiatives: blocked.count ?? 0,
      };
    },
  });

  // Load the default template once available.
  useEffect(() => {
    if (!templates.length || activeTemplateId) return;
    const def = templates.find((t) => t.is_default) ?? templates[0];
    setActiveTemplateId(def.id);
    setConfig(normalizeOwnerConfig(def.config));
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
    return (kpis as any[]).map((k) => {
      const series = byKpi.get(k.id) ?? [];
      return {
        libraryKey: k.library_key ?? null,
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
    const inWindow = (r: { year: number; month: number }) =>
      window.some((w) => w.y === r.year && w.m === r.month);
    const backlog12 = (backlog as any[]).filter(inWindow).reduce((a, r) => a + Number(r.amount ?? 0), 0);
    const target12 = (targets as any[]).filter(inWindow).reduce((a, r) => a + Number(r.amount ?? 0), 0);
    const open = (opps as any[]).filter((o) => o.stage !== "won" && o.stage !== "lost");
    const weightedPipeline = open.reduce((a, o) => a + Number(o.value ?? 0) * (Number(o.probability ?? 0) / 100), 0);
    const byAccount = new Map<string, number>();
    for (const o of open) byAccount.set(o.account_id, (byAccount.get(o.account_id) ?? 0) + Number(o.value ?? 0));
    const totalOpen = open.reduce((a, o) => a + Number(o.value ?? 0), 0);
    const top = Math.max(0, ...Array.from(byAccount.values()));
    const won = (opps as any[]).filter((o) => o.stage === "won");
    const lost = (opps as any[]).filter((o) => o.stage === "lost");
    return {
      backlog12,
      weightedPipeline,
      target12,
      topAccountShare: totalOpen > 0 ? (top / totalOpen) * 100 : null,
      openPipeline: totalOpen,
      openCount: open.length,
      wonValue: won.reduce((a, o) => a + Number(o.value ?? 0), 0),
      wonCount: won.length,
      lostCount: lost.length,
    };
  }, [backlog, targets, opps]);

  const tiles = useMemo(
    () =>
      computeOwnerTiles(
        {
          fins,
          kpis: kpiPoints,
          custom: config.custom,
          commercial,
          risk: risk ?? { openEscalations: 0, overdueActions: 0, expiringCerts: 0, atRiskInitiatives: 0 },
        },
        config.targets,
      ),
    [fins, kpiPoints, commercial, risk, config.targets, config.custom],
  );
  const manualFields = useMemo(() => {
    const chosen = new Set(selectedMetricIds(config));
    const fromCatalogue = OWNER_METRICS.filter((m) => m.source === "manual" && chosen.has(m.id)).map((m) => ({
      id: m.id,
      label: m.label,
    }));
    const fromCustom = config.custom.filter((c) => chosen.has(c.id)).map((c) => ({ id: c.id, label: `${c.label} (custom)` }));
    return [...fromCatalogue, ...fromCustom];
  }, [config]);


  const sections = useMemo(() => applyOwnerConfig(tiles, config), [tiles, config]);
  const pages = useMemo(
    () => assignIds(buildOwnerPages(companyName, periodLabel, sections, headline)),
    [companyName, periodLabel, sections, headline],
  );

  // ── template actions ────────────────────────────────────────────────
  function patch(next: Partial<OwnerTemplateConfig>) {
    setConfig((c) => ({ ...c, ...next }));
  }
  function toggleTile(id: string) {
    setConfig((c) => ({
      ...c,
      hiddenTiles: c.hiddenTiles.includes(id) ? c.hiddenTiles.filter((x) => x !== id) : [...c.hiddenTiles, id],
    }));
  }
  function moveTile(section: OwnerSectionId, id: string, dir: -1 | 1) {
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
  function moveSection(id: OwnerSectionId, dir: -1 | 1) {
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
    const name = asNew ? window.prompt("Template name", "Owner dashboard")?.trim() : undefined;
    if (asNew && !name) return;
    setSaving(true);
    try {
      const db = (supabase as never as { from: (t: string) => any }).from("owner_dashboard_templates");
      if (asNew || !activeTemplateId) {
        const { data, error } = await db
          .insert({ name: name ?? "Owner dashboard", config, is_default: templates.length === 0 })
          .select("id")
          .single();
        if (error) throw error;
        setActiveTemplateId(data.id);
      } else {
        const { error } = await db.update({ config }).eq("id", activeTemplateId);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["owner-templates"] });
      toast.success("Template saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault() {
    if (!activeTemplateId || readOnly) return;
    try {
      const db = (supabase as never as { from: (t: string) => any }).from("owner_dashboard_templates");
      await db.update({ is_default: false }).neq("id", activeTemplateId);
      const { error } = await db.update({ is_default: true }).eq("id", activeTemplateId);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["owner-templates"] });
      toast.success("Default template set");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set default");
    }
  }

  async function deleteTemplate() {
    if (!activeTemplateId || readOnly) return;
    if (!window.confirm("Delete this template?")) return;
    try {
      const { error } = await (supabase as never as { from: (t: string) => any })
        .from("owner_dashboard_templates").delete().eq("id", activeTemplateId);
      if (error) throw error;
      setActiveTemplateId(null);
      setConfig(DEFAULT_OWNER_CONFIG);
      await qc.invalidateQueries({ queryKey: ["owner-templates"] });
      toast.success("Template deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete template");
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
        fileName: `${companyName.replace(/\s+/g, "_")}_Owner_Dashboard_${format(now, "yyyy-MM-dd")}.pdf`,
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
        fileName: `${companyName.replace(/\s+/g, "_")}_Owner_Dashboard_${format(now, "yyyy-MM-dd")}.pptx`,
      });
      toast.success("PowerPoint downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PowerPoint");
    } finally {
      setPptxBusy(false);
    }
  }

  const latestMonth = fins.length ? fins[fins.length - 1].month : null;

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          to="/report/board"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50"
        >
          Full board pack
        </Link>
        <span className="rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          Owner dashboard
        </span>
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


      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Owner dashboard</h1>
          <p className="text-sm text-muted-foreground">
            The short version — seven questions, each with actual, target, trend and status.
            {latestMonth ? ` Latest month entered: ${format(new Date(latestMonth), "MMMM yyyy")}.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 w-40"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            aria-label="Period label"
          />
          <Button variant="outline" size="sm" onClick={() => setEntryOpen(true)}>
            <Pencil className="mr-1.5 size-4" /> Monthly financials
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCatalogueOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Add metrics
          </Button>
          <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
            {editMode ? "Done editing" : "Customise"}
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
              setConfig(normalizeOwnerConfig(t.config));
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
          <Button variant="ghost" size="sm" onClick={() => setConfig(DEFAULT_OWNER_CONFIG)}>
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

      <div className="mb-6">
        <label className="text-xs font-medium text-muted-foreground">Owner's view (appears at the top of the export)</label>
        <Textarea
          rows={2}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="One paragraph: what happened, what it means, what we are doing about it."
        />
      </div>

      {finsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : !fins.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">No monthly financials entered yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one month of revenue, EBITDA and cash and the dashboard fills itself in.
          </p>
          <Button className="mt-4" onClick={() => setEntryOpen(true)}>
            <Pencil className="mr-1.5 size-4" /> Enter monthly financials
          </Button>
        </div>
      ) : null}

      <div className="space-y-6">
        {sections.map((s, si) => (
          <section key={s.section}>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider">{s.label}</h2>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {s.tiles.map((t, ti) => (
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
                      {t.trend == null ? (
                        <Minus className="size-3" />
                      ) : t.trend > 0 ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )}
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
                        disabled={ti === s.tiles.length - 1}
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
          </section>
        ))}
      </div>

      {editMode && config.hiddenTiles.length > 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-border p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hidden tiles</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.hiddenTiles.map((id) => {
              const t = tiles.find((x) => x.id === id);
              return (
                <button
                  key={id}
                  onClick={() => toggleTile(id)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted/50"
                >
                  <Eye className="size-3.5" /> {config.renames[id] ?? t?.label ?? id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <OwnerMetricCatalogueDialog
        open={catalogueOpen}
        onOpenChange={setCatalogueOpen}
        selected={selectedMetricIds(config)}
        custom={config.custom}
        onApply={({ selected, custom }) => patch({ selected, custom, hiddenTiles: [] })}
      />

      <FinancialEntryDialog
        open={entryOpen}
        onOpenChange={setEntryOpen}
        rows={fins}
        readOnly={readOnly}
        manualFields={manualFields}
        onSaved={() => qc.invalidateQueries({ queryKey: ["owner-financials"] })}
      />

    </div>
  );
}

// ── monthly financial entry ─────────────────────────────────────────────

function FinancialEntryDialog({
  open,
  onOpenChange,
  rows,
  readOnly,
  manualFields,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rows: OwnerFinancialRow[];
  readOnly: boolean;
  /** Manual-source metrics currently on the board — stored in owner_financials.extras. */
  manualFields: { id: string; label: string }[];
  onSaved: () => void;
}) {
  const [month, setMonth] = useState(format(startOfMonth(new Date()), "yyyy-MM"));
  const [values, setValues] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const existing = useMemo(() => rows.find((r) => r.month.slice(0, 7) === month) ?? null, [rows, month]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of MONEY_FIELDS) {
      const v = existing ? (existing[f.key] as number | null | undefined) : null;
      next[f.key as string] = v == null ? "" : String(v);
    }
    setValues(next);
    const ex = (existing?.extras ?? {}) as Record<string, number | null>;
    const nextExtras: Record<string, string> = {};
    for (const f of manualFields) nextExtras[f.id] = ex[f.id] == null ? "" : String(ex[f.id]);
    setExtras(nextExtras);
    setNotes(existing?.notes ?? "");
  }, [existing, month, open, manualFields]);


  async function save() {
    if (readOnly) {
      toast.error("TitanScale Template is read-only. Duplicate it to edit.");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { month: `${month}-01`, notes: notes || null };
      for (const f of MONEY_FIELDS) {
        const raw = (values[f.key as string] ?? "").trim();
        payload[f.key as string] = raw === "" ? null : Number(raw);
      }
      const extrasPayload: Record<string, number | null> = {
        ...((existing?.extras ?? {}) as Record<string, number | null>),
      };
      for (const f of manualFields) {
        const raw = (extras[f.id] ?? "").trim();
        extrasPayload[f.id] = raw === "" ? null : Number(raw);
      }
      payload.extras = extrasPayload;
      const { error } = await (supabase as never as { from: (t: string) => any })
        .from("owner_financials")
        .upsert(payload, { onConflict: "company_id,month" });
      if (error) throw error;
      toast.success(`${format(new Date(`${month}-01`), "MMMM yyyy")} saved`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  const groups = Array.from(new Set(MONEY_FIELDS.map((f) => f.group)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monthly financials</DialogTitle>
          <DialogDescription>
            Enter the closed month once. Everything else on the dashboard is calculated or pulled from the app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Month</label>
          <Input type="month" className="w-44" value={month} onChange={(e) => setMonth(e.target.value)} />
          {existing && <span className="text-xs text-muted-foreground">Editing an existing entry</span>}
        </div>

        {groups.map((g) => (
          <div key={g}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {MONEY_FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key as string}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input
                    type="number"
                    value={values[f.key as string] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key as string]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {manualFields.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Manual metrics on your board
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {manualFields.map((f) => (
                <div key={f.id}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input
                    type="number"
                    value={extras[f.id] ?? ""}
                    onChange={(e) => setExtras((v) => ({ ...v, [f.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}


        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || readOnly}>
            {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
            Save month
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
