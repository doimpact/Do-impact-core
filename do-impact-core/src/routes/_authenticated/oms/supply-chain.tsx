import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Gauge, ShieldAlert, Factory } from "lucide-react";
import { scClient, weightedScore, ratingBand, riskBand, money, SELECTION_STAGES, monthLabel, type Metric, type Score, type ScRow } from "@/lib/supply-chain";
import { CrudTable, type Option } from "@/components/oms/supply-chain/crud-table";
import {
  Panel, RiskHeatMap, SpendDonut, SegmentMix, ScoreTrend, EscalationStrip, BarList, CategoryScatter,
} from "@/components/oms/supply-chain/charts";

import { ScorecardsTab } from "@/components/oms/supply-chain/scorecards-tab";
import { useActiveCompany } from "@/hooks/use-companies";
import { useMyAccess } from "@/hooks/use-access";
import { useDemoNow } from "@/lib/demo-date";
import { useProfiles } from "@/components/owner-select";

export const Route = createFileRoute("/_authenticated/oms/supply-chain")({
  head: () => ({
    meta: [
      { title: "Supply Chain — supplier performance & supply management | DO.Impact" },
      { name: "description", content: "Category strategy, supplier segmentation, weighted scorecards, risk, capacity, contracts, development and escalation — one supply management system." },
      { property: "og:title", content: "Supply Chain — supplier performance & supply management | DO.Impact" },
      { property: "og:description", content: "Run category strategy, supplier scorecards, risk, capacity and escalations in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupplyChainPage,
});

const useList = (table: string, order = "sort_order") =>
  useQuery({
    queryKey: ["sc", table, {}],
    queryFn: async () => {
      const { data, error } = await scClient.from(table).select("*").order(order, { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScRow[];
    },
  });

function SupplyChainPage() {
  const activeCompany = useActiveCompany();
  const isTemplate = activeCompany.data?.companies?.is_template === true;
  const { isReadOnly } = useMyAccess();
  const readOnly = isReadOnly || isTemplate;
  const now = useDemoNow();
  const [levelFilter, setLevelFilter] = useState<number | null>(null);

  const categoriesQ = useList("sc_categories");
  const segmentsQ = useList("sc_segments");
  const riskTypesQ = useList("sc_risk_types");
  const levelsQ = useList("sc_escalation_levels");
  const metricsQ = useList("sc_score_metrics");
  const reviewTypesQ = useList("sc_review_types");
  const clausesQ = useList("sc_contract_clauses");
  const onboardTplQ = useList("sc_onboarding_templates");
  const suppliersQ = useList("sc_suppliers", "name");
  const { data: profiles = [] } = useProfiles();

  const categories = categoriesQ.data ?? [];
  const segments = segmentsQ.data ?? [];
  const suppliers = (suppliersQ.data ?? []).filter((s) => !s.archived_at);
  const metrics = (metricsQ.data ?? []) as unknown as Metric[];
  const riskTypes = riskTypesQ.data ?? [];

  const opt = (rows: ScRow[], labelKey = "name"): Option[] =>
    rows.filter((r) => !r.archived_at).map((r) => ({ value: String(r.id), label: String(r[labelKey] ?? "Untitled") }));
  const ownerOptions: Option[] = (profiles as ScRow[]).map((p) => ({
    value: String(p.id), label: String(p.display_name ?? p.email ?? "Person"),
  }));

  const scorecardsQ = useQuery({
    queryKey: ["sc", "sc_scorecards", "all"],
    queryFn: async () => {
      const { data, error } = await scClient.from("sc_scorecards").select("*").order("period_month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ScRow[];
    },
  });
  const scoresQ = useQuery({
    queryKey: ["sc", "sc_scorecard_scores", "all"],
    queryFn: async () => {
      const { data, error } = await scClient.from("sc_scorecard_scores").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as Score[];
    },
  });
  const candidates = useListData("sc_selection_candidates");
  const risksQ = useList("sc_risks", "created_at");
  const contractsQ = useList("sc_contracts", "created_at");
  const escalationsQ = useList("sc_escalations", "created_at");

  const latestBySupplier = useMemo(() => {
    const map = new Map<string, number | null>();
    const cards = scorecardsQ.data ?? [];
    const scores = scoresQ.data ?? [];
    for (const s of suppliers) {
      const card = cards.find((c) => c.supplier_id === s.id);
      map.set(String(s.id), card ? weightedScore(scores.filter((x) => x.scorecard_id === card.id), metrics) : null);
    }
    return map;
  }, [scorecardsQ.data, scoresQ.data, suppliers, metrics]);

  const spendByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of suppliers) {
      const key = String(s.category_id ?? "none");
      m.set(key, (m.get(key) ?? 0) + (Number(s.annual_spend) || 0));
    }
    return [...m.entries()]
      .map(([id, total]) => ({ label: categories.find((c) => c.id === id)?.name ?? "Uncategorised", total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [suppliers, categories]);

  const openEscalations = (escalationsQ.data ?? []).filter((e) => !e.archived_at && e.status !== "closed");
  const highRisks = (risksQ.data ?? []).filter((r) => !r.archived_at && (Number(r.likelihood) * Number(r.impact)) >= 15);
  const totalSpend = suppliers.reduce((a, s) => a + (Number(s.annual_spend) || 0), 0);

  const riskPoints = useMemo(
    () => (risksQ.data ?? [])
      .filter((r) => !r.archived_at)
      .map((r) => ({
        likelihood: Number(r.likelihood) || 1,
        impact: Number(r.impact) || 1,
        label: `${suppliers.find((s) => s.id === r.supplier_id)?.name ?? "Supplier"} — ${String(r.title ?? r.risk_type ?? "Risk")}`,
      })),
    [risksQ.data, suppliers],
  );

  const risksByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of (risksQ.data ?? []).filter((x) => !x.archived_at)) {
      const label = riskTypes.find((t) => t.id === r.risk_type_id)?.name ?? String(r.risk_type ?? "Unclassified");
      m.set(String(label), (m.get(String(label)) ?? 0) + 1);
    }
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [risksQ.data, riskTypes]);

  const segmentMix = useMemo(() => {
    const live = segments.filter((s) => !s.archived_at);
    const rows = live.map((seg) => {
      const mine = suppliers.filter((s) => String(s.segment_id ?? "") === String(seg.id));
      return {
        label: String(seg.name ?? "Segment"),
        count: mine.length,
        spend: mine.reduce((a, s) => a + (Number(s.annual_spend) || 0), 0),
      };
    });
    const unassigned = suppliers.filter((s) => !live.some((seg) => String(seg.id) === String(s.segment_id ?? "")));
    if (unassigned.length) {
      rows.push({
        label: "Unassigned",
        count: unassigned.length,
        spend: unassigned.reduce((a, s) => a + (Number(s.annual_spend) || 0), 0),
      });
    }
    return rows.filter((r) => r.count > 0);
  }, [segments, suppliers]);

  const scoreTrend = useMemo(() => {
    const cards = scorecardsQ.data ?? [];
    const scores = scoresQ.data ?? [];
    const m = new Map<string, number[]>();
    for (const c of cards) {
      const v = weightedScore(scores.filter((x) => x.scorecard_id === c.id), metrics);
      if (v === null) continue;
      const key = String(c.period_month ?? "").slice(0, 7);
      if (!key) continue;
      m.set(key, [...(m.get(key) ?? []), v]);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, vals]) => ({
        month: monthLabel(`${key}-01`),
        score: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      }));
  }, [scorecardsQ.data, scoresQ.data, metrics]);

  const escalationByLevel = useMemo(() => {
    const live = (escalationsQ.data ?? []).filter((e) => !e.archived_at);
    const levels = (levelsQ.data ?? []).filter((l) => !l.archived_at);
    const keys = levels.length
      ? levels.map((l) => ({ no: Number(l.level_no) || 0, name: String(l.name ?? `L${l.level_no}`) }))
      : [...new Set(live.map((e) => Number(e.level_no) || 0))].map((no) => ({ no, name: `L${no}` }));
    return keys.map(({ no, name }) => {
      const mine = live.filter((e) => (Number(e.level_no) || 0) === no);
      return {
        level: name,
        open: mine.filter((e) => e.status === "open").length,
        recovering: mine.filter((e) => e.status === "recovering").length,
        closed: mine.filter((e) => e.status === "closed").length,
      };
    });
  }, [escalationsQ.data, levelsQ.data]);

  const contractExpiry = useMemo(() => {
    const live = (contractsQ.data ?? []).filter((c) => !c.archived_at && c.end_date);
    const buckets = [
      { label: "Next 3 months", months: 3 },
      { label: "3–6 months", months: 6 },
      { label: "6–12 months", months: 12 },
      { label: "Beyond 12 months", months: Infinity },
    ];
    const monthsAway = (iso: string) => {
      const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
      return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
    };
    return buckets.map((b, i) => {
      const lower = i === 0 ? -Infinity : buckets[i - 1].months;
      return {
        label: b.label,
        value: live.filter((c) => {
          const m = monthsAway(String(c.end_date));
          return m > lower && m <= b.months;
        }).length,
      };
    });
  }, [contractsQ.data, now]);

  const categoryScatter = useMemo(() => {
    return categories.filter((c) => !c.archived_at).map((c) => {
      const mine = suppliers.filter((s) => String(s.category_id ?? "") === String(c.id));
      return {
        label: String(c.name ?? "Category"),
        suppliers: mine.length,
        spend: mine.reduce((a, s) => a + (Number(s.annual_spend) || 0), 0),
      };
    }).filter((c) => c.suppliers > 0 || c.spend > 0);
  }, [categories, suppliers]);


  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><Truck className="h-7 w-7" /> Supply Chain</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          The supplier performance & supply management system: category strategy, segmentation, selection, onboarding,
          weighted scorecards, risk, capacity, contracts, development and escalation. Demand planning stays in{" "}
          <Link to="/oms/siop" className="underline">SIOP</Link>.
        </p>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1 [&>*]:px-3 [&>*]:py-1.5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Category strategy</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="selection">Selection</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="scorecards">Scorecards</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="escalations">Escalation</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Active suppliers" value={String(suppliers.length)} icon={<Factory className="h-4 w-4" />} />
            <Kpi label="Annual spend" value={money(totalSpend)} icon={<Truck className="h-4 w-4" />} />
            <Kpi label="Open escalations" value={String(openEscalations.length)} icon={<ShieldAlert className="h-4 w-4" />} />
            <Kpi label="High risks" value={String(highRisks.length)} icon={<Gauge className="h-4 w-4" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Risk heat map" hint="Likelihood × impact across the live risk register.">
              <RiskHeatMap risks={riskPoints} />
            </Panel>

            <Panel title="Spend by category" hint="Share of annual spend across the top categories.">
              <SpendDonut data={spendByCategory} />
            </Panel>

            <Panel title="Supplier segment mix" hint="How suppliers and spend split across segments.">
              <SegmentMix data={segmentMix} />
            </Panel>

            <Panel title="Average supplier score" hint="Weighted scorecard average by month.">
              <ScoreTrend data={scoreTrend} />
            </Panel>

            <Panel title="Escalations by level" hint="Open, recovering and closed at each level.">
              <EscalationStrip data={escalationByLevel} />
            </Panel>

            <Panel title="Contracts expiring" hint="Agreements reaching their end date.">
              <BarList data={contractExpiry} />
            </Panel>

            <Panel title="Spend ranking" hint="Largest categories by annual spend." className="lg:col-span-2">
              <BarList data={spendByCategory.map((c) => ({ label: c.label, value: c.total }))} format={money} />
            </Panel>
          </div>

          <Panel title="Latest supplier ratings" hint="Most recent weighted score per supplier.">
            {suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add suppliers to start scoring them.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {suppliers.slice(0, 12).map((s) => {
                  const score = latestBySupplier.get(String(s.id)) ?? null;
                  const b = ratingBand(score);
                  return (
                    <li key={String(s.id)} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{String(s.name)}</span>
                      <Badge className={`${b.className} shrink-0`}>{score === null ? "No score" : `${score} · ${b.label}`}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </TabsContent>


        {/* ---------------- Category strategy ---------------- */}
        <TabsContent value="categories" className="mt-4 space-y-6">
          <Panel title="Spend vs supplier count" hint="Categories high on spend but low on supplier count are concentration risks.">
            <CategoryScatter data={categoryScatter} />
          </Panel>
          <CrudTable
            table="sc_categories"
            title="Category & commodity strategy"
            description="One strategy per category: spend, market, current vs future state, KPIs and the refresh date."
            orderBy="sort_order"
            readOnly={readOnly}
            fields={[
              { name: "name", label: "Category", required: true },
              { name: "code", label: "Code" },
              { name: "parent_id", label: "Parent category", type: "select", options: opt(categories), inTable: false },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "annual_spend", label: "Annual spend", type: "number", render: (r) => money(r.annual_spend) },
              { name: "supplier_count", label: "Suppliers", type: "number" },
              { name: "strategy_status", label: "Status", type: "select", defaultValue: "draft",
                options: [
                  { value: "draft", label: "Draft" }, { value: "approved", label: "Approved" },
                  { value: "in_delivery", label: "In delivery" }, { value: "review", label: "Needs review" },
                ] },
              { name: "refresh_date", label: "Refresh date", type: "date" },
              { name: "market_assessment", label: "Market assessment", type: "textarea" },
              { name: "spend_analysis", label: "Spend analysis", type: "textarea" },
              { name: "current_state", label: "Current state", type: "textarea" },
              { name: "future_state", label: "Future state (3 years)", type: "textarea" },
              { name: "kpis", label: "KPIs", type: "textarea" },
              { name: "sort_order", label: "Order", type: "number", defaultValue: 0, inTable: false },
            ]}
          />
        </TabsContent>

        {/* ---------------- Suppliers ---------------- */}
        <TabsContent value="suppliers" className="mt-4">
          <CrudTable
            table="sc_suppliers"
            title="Suppliers"
            description="The supplier master: segment, category, spend, approvals and ownership."
            orderBy="name"
            readOnly={readOnly}
            searchKeys={["name", "code", "site", "country"]}
            fields={[
              { name: "name", label: "Supplier", required: true },
              { name: "code", label: "Code" },
              { name: "category_id", label: "Category", type: "select", options: opt(categories),
                render: (r) => categories.find((c) => c.id === r.category_id)?.name ?? "—" },
              { name: "segment_id", label: "Segment", type: "select", options: opt(segments),
                render: (r) => segments.find((c) => c.id === r.segment_id)?.name ?? "—" },
              { name: "site", label: "Site" },
              { name: "country", label: "Country" },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "annual_spend", label: "Annual spend", type: "number", render: (r) => money(r.annual_spend) },
              { name: "status", label: "Status", type: "select", defaultValue: "active", options: [
                { value: "prospect", label: "Prospect" }, { value: "onboarding", label: "Onboarding" },
                { value: "active", label: "Active" }, { value: "probation", label: "Probation" },
                { value: "exit", label: "Exit plan" },
              ] },
              { name: "sole_source", label: "Sole source", type: "boolean", inTable: false },
              { name: "as9100", label: "AS9100", type: "boolean", inTable: false },
              { name: "nadcap", label: "NADCAP", type: "boolean", inTable: false },
              { name: "export_controlled", label: "Export controlled", type: "boolean", inTable: false },
              { name: "notes", label: "Notes", type: "textarea", inTable: false },
            ]}
          />
        </TabsContent>

        {/* ---------------- Selection ---------------- */}
        <TabsContent value="selection" className="mt-4 space-y-8">
          <CrudTable
            table="sc_selection_candidates"
            title="Selection pipeline"
            description="Need → market scan → RFI/RFQ → capability & risk assessment → audit → award → onboarding."
            orderBy="created_at"
            readOnly={readOnly}
            fields={[
              { name: "name", label: "Candidate", required: true },
              { name: "category_id", label: "Category", type: "select", options: opt(categories),
                render: (r) => categories.find((c) => c.id === r.category_id)?.name ?? "—" },
              { name: "stage", label: "Stage", type: "select", defaultValue: "need", options: SELECTION_STAGES },
              { name: "country", label: "Country" },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "score", label: "Assessment score", type: "number" },
              { name: "need", label: "Need / specification", type: "textarea" },
              { name: "decision", label: "Decision", type: "textarea" },
            ]}
          />
          <CrudTable
            table="sc_selection_gates"
            title="Selection gates"
            description="Evidence and decision per gate for a candidate."
            orderBy="seq"
            readOnly={readOnly}
            fields={[
              { name: "candidate_id", label: "Candidate", type: "select", required: true,
                options: opt(candidates),
                render: (r) => candidates.find((c) => c.id === r.candidate_id)?.name ?? "—" },
              { name: "seq", label: "#", type: "number", defaultValue: 1 },
              { name: "name", label: "Gate", required: true },
              { name: "status", label: "Status", type: "select", defaultValue: "pending", options: [
                { value: "pending", label: "Pending" }, { value: "passed", label: "Passed" },
                { value: "failed", label: "Failed" }, { value: "waived", label: "Waived" },
              ] },
              { name: "score", label: "Score", type: "number" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Onboarding ---------------- */}
        <TabsContent value="onboarding" className="mt-4">
          <CrudTable
            table="sc_onboarding_items"
            title="Supplier onboarding"
            description="Quality approvals, ERP setup, PPAP/FAI, documentation, portal access, packaging, logistics, EDI, forecast sharing and training."
            orderBy="sort_order"
            readOnly={readOnly}
            fields={[
              { name: "supplier_id", label: "Supplier", type: "select", required: true, options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "label", label: "Step", required: true,
                help: `Templates available: ${(onboardTplQ.data ?? []).filter((t) => !t.archived_at).map((t) => t.label).join(" · ") || "add them in Setup"}` },
              { name: "status", label: "Status", type: "select", defaultValue: "todo", options: [
                { value: "todo", label: "To do" }, { value: "in_progress", label: "In progress" },
                { value: "blocked", label: "Blocked" }, { value: "done", label: "Done" },
              ] },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "due_date", label: "Due", type: "date" },
              { name: "notes", label: "Notes", type: "textarea" },
              { name: "sort_order", label: "Order", type: "number", defaultValue: 0, inTable: false },
            ]}
          />
        </TabsContent>

        {/* ---------------- Scorecards ---------------- */}
        <TabsContent value="scorecards" className="mt-4">
          <ScorecardsTab suppliers={suppliers} metrics={metrics} readOnly={readOnly} now={now} />
        </TabsContent>

        {/* ---------------- Risk ---------------- */}
        <TabsContent value="risk" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Risk heat map" hint="Likelihood × impact for every live risk.">
              <RiskHeatMap risks={riskPoints} />
            </Panel>
            <Panel title="Risks by type" hint="Where the exposure is concentrated.">
              <BarList data={risksByType} />
            </Panel>
          </div>
          <CrudTable
            table="sc_risks"
            title="Supplier risk register"
            description="Financial, capacity, geographic, political, cyber, natural-disaster, single-source, obsolescence and special-process risk with mitigation."
            orderBy="created_at"
            readOnly={readOnly}
            fields={[
              { name: "supplier_id", label: "Supplier", type: "select", required: true, options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "title", label: "Risk", required: true },
              { name: "risk_type_id", label: "Type", type: "select", options: opt(riskTypesQ.data ?? []),
                render: (r) => (riskTypesQ.data ?? []).find((t) => t.id === r.risk_type_id)?.name ?? "—" },
              { name: "likelihood", label: "Likelihood 1–5", type: "number", defaultValue: 3 },
              { name: "impact", label: "Impact 1–5", type: "number", defaultValue: 3,
                render: (r) => {
                  const b = riskBand(Number(r.likelihood), Number(r.impact));
                  return <Badge className={b.className}>{r.impact} · {b.label}</Badge>;
                } },
              { name: "status", label: "Status", type: "select", defaultValue: "open", options: [
                { value: "open", label: "Open" }, { value: "mitigating", label: "Mitigating" },
                { value: "accepted", label: "Accepted" }, { value: "closed", label: "Closed" },
              ] },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "review_date", label: "Review", type: "date" },
              { name: "mitigation", label: "Mitigation / contingency", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Capacity ---------------- */}
        <TabsContent value="capacity" className="mt-4">
          <CrudTable
            table="sc_capacity"
            title="Supplier capacity"
            description="What each supplier can actually deliver against our demand — bottlenecks, tooling, labour and investment plans. Feeds the SIOP supply review."
            orderBy="period"
            readOnly={readOnly}
            fields={[
              { name: "supplier_id", label: "Supplier", type: "select", required: true, options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "period", label: "Period", type: "date", required: true },
              { name: "demand_units", label: "Our demand", type: "number" },
              { name: "available_units", label: "Available", type: "number" },
              { name: "max_units", label: "Max capacity", type: "number" },
              { name: "unit", label: "Unit" },
              { name: "bottleneck", label: "Bottleneck", type: "textarea" },
              { name: "tooling_constraints", label: "Tooling constraints", type: "textarea" },
              { name: "labour_constraints", label: "Labour constraints", type: "textarea" },
              { name: "investment_plan", label: "Investment plan", type: "textarea" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Contracts ---------------- */}
        <TabsContent value="contracts" className="mt-4">
          <CrudTable
            table="sc_contracts"
            title="Contracts & commercial framework"
            description={`Standard clauses to cover: ${(clausesQ.data ?? []).filter((c) => !c.archived_at).map((c) => c.label).join(" · ") || "add them in Setup"}.`}
            orderBy="end_date"
            readOnly={readOnly}
            fields={[
              { name: "supplier_id", label: "Supplier", type: "select", required: true, options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "title", label: "Contract", required: true },
              { name: "contract_type", label: "Type", type: "select", options: [
                { value: "msa", label: "Master supply agreement" }, { value: "ltA", label: "Long-term agreement" },
                { value: "spot", label: "Spot / PO terms" }, { value: "nda", label: "NDA" },
              ] },
              { name: "start_date", label: "Start", type: "date" },
              { name: "end_date", label: "End", type: "date" },
              { name: "review_date", label: "Review", type: "date" },
              { name: "status", label: "Status", type: "select", defaultValue: "draft", options: [
                { value: "draft", label: "Draft" }, { value: "active", label: "Active" },
                { value: "renewal", label: "In renewal" }, { value: "expired", label: "Expired" },
              ] },
              { name: "pricing_model", label: "Pricing model", type: "textarea" },
              { name: "capacity_reservation", label: "Capacity reservation", type: "textarea" },
              { name: "escalation_mechanism", label: "Escalation mechanism", type: "textarea" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Development ---------------- */}
        <TabsContent value="development" className="mt-4">
          <CrudTable
            table="sc_development_plans"
            title="Supplier development"
            description="Joint improvement plans: objective, activities, owner, target date and the benefit."
            orderBy="target_date"
            readOnly={readOnly}
            fields={[
              { name: "supplier_id", label: "Supplier", type: "select", required: true, options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "objective", label: "Objective", required: true },
              { name: "year", label: "Year", type: "number", defaultValue: now.getFullYear() },
              { name: "status", label: "Status", type: "select", defaultValue: "not_started", options: [
                { value: "not_started", label: "Not started" }, { value: "in_progress", label: "In progress" },
                { value: "at_risk", label: "At risk" }, { value: "done", label: "Done" },
              ] },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "target_date", label: "Target", type: "date" },
              { name: "activities", label: "Activities", type: "textarea" },
              { name: "benefit", label: "Benefit", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Reviews ---------------- */}
        <TabsContent value="reviews" className="mt-4">
          <CrudTable
            table="sc_reviews"
            title="Supplier & commodity reviews"
            description="Operational, business, executive, commodity and risk reviews — with decisions captured."
            orderBy="review_date"
            readOnly={readOnly}
            fields={[
              { name: "title", label: "Review", required: true },
              { name: "supplier_id", label: "Supplier", type: "select", options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "review_type_id", label: "Type", type: "select", options: opt(reviewTypesQ.data ?? []),
                render: (r) => (reviewTypesQ.data ?? []).find((t) => t.id === r.review_type_id)?.name ?? "—" },
              { name: "review_date", label: "Date", type: "date" },
              { name: "status", label: "Status", type: "select", defaultValue: "planned", options: [
                { value: "planned", label: "Planned" }, { value: "held", label: "Held" }, { value: "cancelled", label: "Cancelled" },
              ] },
              { name: "attendees", label: "Attendees", type: "textarea" },
              { name: "notes", label: "Notes", type: "textarea" },
              { name: "decisions", label: "Decisions", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Escalation ---------------- */}
        <TabsContent value="escalations" className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(levelsQ.data ?? []).filter((l) => !l.archived_at).map((l) => {
              const no = Number(l.level_no) || 0;
              const active = levelFilter === no;
              return (
                <button
                  key={String(l.id)}
                  type="button"
                  onClick={() => setLevelFilter(active ? null : no)}
                  className={`rounded-lg border p-4 text-left transition hover:border-primary/60 hover:bg-muted/40 ${active ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0 tabular-nums">L{no}</Badge>
                    <span className="min-w-0 truncate text-sm font-semibold">{String(l.name)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {l.owner_role && <span className="rounded-full bg-muted px-2 py-0.5">{String(l.owner_role)}</span>}
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      Respond within {String(l.response_hours ?? "—")}h
                    </span>
                  </div>
                  {l.required_actions && (
                    <p className="mt-3 rounded-md bg-muted/50 p-2 text-xs leading-relaxed text-muted-foreground">
                      {String(l.required_actions)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {levelFilter !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Filtered to level {levelFilter}</Badge>
              <Button variant="ghost" size="sm" onClick={() => setLevelFilter(null)}>Clear filter</Button>
            </div>
          )}

          <CrudTable
            table="sc_escalations"
            title="Escalations"
            description="Structured escalation with a defined owner, response time and closure criteria at every level."
            orderBy="created_at"
            scope={levelFilter !== null ? { level_no: String(levelFilter) } : undefined}
            queryKeyExtra={[levelFilter]}

            readOnly={readOnly}
            fields={[
              { name: "title", label: "Issue", required: true },
              { name: "supplier_id", label: "Supplier", type: "select", options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "level_no", label: "Level", type: "number", defaultValue: 0 },
              { name: "status", label: "Status", type: "select", defaultValue: "open", options: [
                { value: "open", label: "Open" }, { value: "recovering", label: "Recovering" }, { value: "closed", label: "Closed" },
              ] },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "opened_at", label: "Opened", type: "date" },
              { name: "due_date", label: "Due", type: "date" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "actions", label: "Required actions", type: "textarea" },
              { name: "closure_criteria", label: "Closure criteria", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Actions ---------------- */}
        <TabsContent value="actions" className="mt-4">
          <CrudTable
            table="sc_actions"
            title="Supply chain actions"
            description="Everything agreed in a review, scorecard or escalation, with an owner and a date."
            orderBy="due_date"
            readOnly={readOnly}
            fields={[
              { name: "title", label: "Action", required: true },
              { name: "supplier_id", label: "Supplier", type: "select", options: opt(suppliers),
                render: (r) => suppliers.find((s) => s.id === r.supplier_id)?.name ?? "—" },
              { name: "source_type", label: "Source", type: "select", options: [
                { value: "review", label: "Review" }, { value: "scorecard", label: "Scorecard" },
                { value: "risk", label: "Risk" }, { value: "escalation", label: "Escalation" },
                { value: "development", label: "Development" }, { value: "audit", label: "Audit" },
              ] },
              { name: "owner_id", label: "Owner", type: "select", options: ownerOptions, inTable: false },
              { name: "due_date", label: "Due", type: "date" },
              { name: "status", label: "Status", type: "select", defaultValue: "open", options: [
                { value: "open", label: "Open" }, { value: "in_progress", label: "In progress" },
                { value: "blocked", label: "Blocked" }, { value: "done", label: "Done" },
              ] },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </TabsContent>

        {/* ---------------- Setup ---------------- */}
        <TabsContent value="setup" className="mt-4">
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            The reference lists behind the module. Pick a list on the left — each one is fully add, edit, archive and delete.
          </p>
          <Tabs defaultValue="sc_segments" className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <TabsList className="flex h-auto w-full flex-col gap-1 bg-transparent p-0 lg:sticky lg:top-4">
              <TabsTrigger
                value="sc_segments"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Supplier segments
              </TabsTrigger>
              <TabsTrigger
                value="sc_score_metrics"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Scorecard metrics
              </TabsTrigger>
              <TabsTrigger
                value="sc_risk_types"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Risk types
              </TabsTrigger>
              <TabsTrigger
                value="sc_escalation_levels"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Escalation levels
              </TabsTrigger>
              <TabsTrigger
                value="sc_onboarding_templates"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Onboarding checklist
              </TabsTrigger>
              <TabsTrigger
                value="sc_contract_clauses"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Contract clauses
              </TabsTrigger>
              <TabsTrigger
                value="sc_review_types"
                className="w-full justify-start rounded-md px-3 py-2 text-left text-sm data-[state=active]:bg-muted"
              >
                Review types
              </TabsTrigger>
            </TabsList>
            <div className="min-w-0">
            <TabsContent value="sc_segments" className="mt-0">
              <CrudTable
                table="sc_segments" title="Supplier segments" orderBy="sort_order" readOnly={readOnly}
                description="How each tier is governed — strategic, preferred, transactional, high risk."
                fields={[
                  { name: "name", label: "Segment", required: true },
                  { name: "description", label: "Description", type: "textarea" },
                  { name: "governance", label: "Governance", type: "textarea" },
                  { name: "color", label: "Colour" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            <TabsContent value="sc_score_metrics" className="mt-0">
              <CrudTable
                table="sc_score_metrics" title="Scorecard metrics & weightings" orderBy="sort_order" readOnly={readOnly}
                description="Quality, delivery, commercial, engineering and risk metrics. Weightings should total 100%."
                fields={[
                  { name: "name", label: "Metric", required: true },
                  { name: "dimension", label: "Dimension", type: "select", defaultValue: "quality", options: [
                    { value: "quality", label: "Quality" }, { value: "delivery", label: "Delivery" },
                    { value: "commercial", label: "Commercial" }, { value: "engineering", label: "Engineering" },
                    { value: "risk", label: "Risk" },
                  ] },
                  { name: "weight_pct", label: "Weight %", type: "number", defaultValue: 10 },
                  { name: "description", label: "Description", type: "textarea" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            <TabsContent value="sc_risk_types" className="mt-0">
              <CrudTable
                table="sc_risk_types" title="Risk types" orderBy="sort_order" readOnly={readOnly}
                fields={[
                  { name: "name", label: "Risk type", required: true },
                  { name: "description", label: "Description", type: "textarea" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            <TabsContent value="sc_escalation_levels" className="mt-0">
              <CrudTable
                table="sc_escalation_levels" title="Escalation levels" orderBy="sort_order" readOnly={readOnly}
                description="Owner, response time, required actions and closure criteria per level."
                fields={[
                  { name: "level_no", label: "Level", type: "number", defaultValue: 0 },
                  { name: "name", label: "Name", required: true },
                  { name: "owner_role", label: "Owner role" },
                  { name: "response_hours", label: "Response (h)", type: "number" },
                  { name: "required_actions", label: "Required actions", type: "textarea" },
                  { name: "closure_criteria", label: "Closure criteria", type: "textarea" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            <TabsContent value="sc_onboarding_templates" className="mt-0">
              <CrudTable
                table="sc_onboarding_templates" title="Onboarding checklist template" orderBy="sort_order" readOnly={readOnly}
                fields={[
                  { name: "label", label: "Step", required: true },
                  { name: "description", label: "Description", type: "textarea" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            <TabsContent value="sc_contract_clauses" className="mt-0">
              <CrudTable
                table="sc_contract_clauses" title="Standard contract clauses" orderBy="sort_order" readOnly={readOnly}
                fields={[
                  { name: "label", label: "Clause", required: true },
                  { name: "description", label: "Description", type: "textarea" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            <TabsContent value="sc_review_types" className="mt-0">
              <CrudTable
                table="sc_review_types" title="Review types & cadence" orderBy="sort_order" readOnly={readOnly}
                fields={[
                  { name: "name", label: "Review", required: true },
                  { name: "cadence", label: "Cadence", type: "select", options: [
                    { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" },
                    { value: "quarterly", label: "Quarterly" }, { value: "annual", label: "Annual" },
                  ] },
                  { name: "agenda", label: "Agenda", type: "textarea" },
                  { name: "sort_order", label: "Order", type: "number", defaultValue: 0 },
                ]}
              />
            </TabsContent>
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function useListData(table: string): ScRow[] {
  const q = useQuery({
    queryKey: ["sc", table, {}],
    queryFn: async () => {
      const { data, error } = await scClient.from(table).select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScRow[];
    },
  });
  return q.data ?? [];
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
