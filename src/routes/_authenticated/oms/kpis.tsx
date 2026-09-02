import { createFileRoute, Link } from "@tanstack/react-router";
import { useDemoNow } from "@/lib/demo-date";
import { queryOptions, useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllKpis, listArchivedKpis, listPillars, createKpi, createKpisFromLibrary, logKpiValue, deleteKpi, updateKpi, archiveKpi, restoreKpi } from "@/lib/oms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, ExternalLink, Pencil, Archive, ArchiveRestore, Star, Eye, EyeOff, BookOpen, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { confirmThen } from "@/components/confirm-dialog";
import { KpiFilterBar } from "@/components/oms/kpis/kpi-filter-bar";
import { KpiLibraryDialog } from "@/components/oms/kpis/kpi-library-dialog";
import { KpiDefinitionSheet } from "@/components/oms/kpis/kpi-definition-sheet";
import { KpiFrameworkTab } from "@/components/oms/kpis/kpi-framework-tab";
import { EMPTY_FILTERS, statusFor, type GroupBy, type KpiFilters, type KpiRow } from "@/components/oms/kpis/kpi-types";
import { KPI_CATEGORIES, KPI_LEVELS, categoryLabel, levelLabel } from "@/lib/kpi-library";
import { useProfiles, ownerLabel } from "@/components/owner-select";

export const allKpisQO = queryOptions({
  queryKey: ["kpis", "all"],
  queryFn: () => listAllKpis(),
});

export const Route = createFileRoute("/_authenticated/oms/kpis")({
  head: () => ({ meta: [{ title: "Kpis — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  // No loader: listAllKpis requires the user bearer token, which only exists
  // client-side — fetching happens via useSuspenseQuery in the component.
  component: KpisPage,
  errorComponent: ({ error }) => <div className="p-8 text-red-600">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


function KpisPage() {
  const { data: kpis } = useSuspenseQuery(allKpisQO);
  const qc = useQueryClient();
  const logFn = useServerFn(logKpiValue);
  const deleteFn = useServerFn(deleteKpi);
  const updateFn = useServerFn(updateKpi);
  const createFn = useServerFn(createKpi);
  const pillarsFn = useServerFn(listPillars);
  const archiveFn = useServerFn(archiveKpi);
  const restoreFn = useServerFn(restoreKpi);
  const archivedFn = useServerFn(listArchivedKpis);

  const now = useDemoNow();
  const [year, setYear] = useState(now.getFullYear());
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const [open, setOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [detail, setDetail] = useState<KpiRow | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState<KpiFilters>({ ...EMPTY_FILTERS });
  const [groupBy, setGroupBy] = useState<GroupBy>("pillar");
  const [pillarId, setPillarId] = useState("");
  const [nName, setNName] = useState("");
  const [nUnit, setNUnit] = useState("");
  const [nTarget, setNTarget] = useState("");
  const [nHigher, setNHigher] = useState(true);
  const [nCategory, setNCategory] = useState("");
  const [nLevel, setNLevel] = useState("");
  const [nIndicator, setNIndicator] = useState("");

  const { data: people = [] } = useProfiles();
  const libraryFn = useServerFn(createKpisFromLibrary);


  const pillarsQ = useSuspenseQuery(queryOptions({ queryKey: ["pillars"], queryFn: async () => (await pillarsFn()) ?? [] }));
  const archivedQ = useQuery({
    queryKey: ["kpis", "archived"],
    queryFn: () => archivedFn(),
    enabled: showArchived,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["kpis"] });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: { pillarId, name: nName, unit: nUnit || null, target: nTarget ? Number(nTarget) : null, higherIsBetter: nHigher, category: nCategory || null, hierarchyLevel: nLevel ? Number(nLevel) : null, indicatorType: nIndicator || null } }),
    onSuccess: () => { toast.success("KPI created"); setOpen(false); setNName(""); setNUnit(""); setNTarget(""); setNCategory(""); setNLevel(""); setNIndicator(""); invalidate(); },

    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveFn({ data: { id } }),
    onSuccess: () => { toast.success("KPI archived"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to archive"),
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: () => { toast.success("KPI restored"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to restore"),
  });

  const list = kpis as KpiRow[];
  const keyCount = list.filter((k) => k.is_key).length;
  const hiddenCount = list.length - keyCount;

  const filtered = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return list.filter((k) => {
      if (!showAll && !k.is_key) return false;
      if (filters.category !== "all" && k.category !== filters.category) return false;
      if (filters.level !== "all" && String(k.hierarchy_level ?? "") !== filters.level) return false;
      if (filters.indicator !== "all" && k.indicator_type !== filters.indicator) return false;
      if (filters.pillar !== "all" && (k.pillars?.id ?? "unassigned") !== filters.pillar) return false;
      if (filters.owner !== "all" && (filters.owner === "none" ? !!k.owner_id : k.owner_id !== filters.owner)) return false;
      if (filters.frequency !== "all" && k.frequency !== filters.frequency) return false;
      if (filters.status !== "all" && statusFor(k, year) !== filters.status) return false;
      if (!needle) return true;
      return (
        k.name.toLowerCase().includes(needle) ||
        (k.code ?? "").toLowerCase().includes(needle) ||
        (k.description ?? "").toLowerCase().includes(needle) ||
        (k.formula ?? "").toLowerCase().includes(needle)
      );
    });
  }, [list, filters, showAll, year]);

  const visibleList = filtered;

  const sections = useMemo(() => {
    const map = new Map<string, { id: string; label: string; sort: number; pillarKey?: string; kpis: KpiRow[] }>();
    for (const k of filtered) {
      let id = "unassigned";
      let label = "Unassigned";
      let sort = 999;
      let pillarKey: string | undefined;
      if (groupBy === "pillar") {
        id = k.pillars?.id ?? "unassigned";
        label = k.pillars?.name ?? "Unassigned";
        sort = k.pillars?.sort_order ?? 999;
        pillarKey = k.pillars?.key;
      } else if (groupBy === "category") {
        id = k.category ?? "uncategorised";
        label = k.category ? categoryLabel(k.category) : "Uncategorised";
        sort = KPI_CATEGORIES.findIndex((c) => c.key === k.category);
        if (sort < 0) sort = 999;
      } else if (groupBy === "level") {
        id = String(k.hierarchy_level ?? "none");
        label = k.hierarchy_level ? levelLabel(k.hierarchy_level) : "No level set";
        sort = k.hierarchy_level ?? 999;
      } else if (groupBy === "indicator") {
        id = k.indicator_type ?? "none";
        label = k.indicator_type === "leading" ? "Leading indicators" : k.indicator_type === "lagging" ? "Lagging indicators" : "Not classified";
        sort = k.indicator_type === "leading" ? 0 : k.indicator_type === "lagging" ? 1 : 2;
      } else {
        id = k.owner_id ?? "none";
        label = k.owner_id ? ownerLabel(people.find((p) => p.id === k.owner_id)) : "Unassigned";
        sort = k.owner_id ? 0 : 999;
      }
      if (!map.has(id)) map.set(id, { id, label, sort, pillarKey, kpis: [] });
      map.get(id)!.kpis.push(k);
    }
    return [...map.values()].sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
  }, [filtered, groupBy, people]);

  const totals = { onTrack: 0, off: 0, noData: 0 };
  for (const k of list.filter((k) => k.is_key)) {
    const s = statusFor(k, year);
    if (s === "on") totals.onTrack++;
    else if (s === "off") totals.off++;
    else totals.noData++;
  }



  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">KPIs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            An SQDCPME-structured scorecard: every KPI carries a category, hierarchy level, leading/lagging type and a definition.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            title={showAll ? "Show only pinned key KPIs" : "Show every KPI"}
          >
            {showAll ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showAll ? `Key only (${keyCount})` : `Show all (${list.length})`}
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="h-4 w-4 mr-1" />
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
            <BookOpen className="h-4 w-4 mr-1" /> KPI library
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New KPI</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New KPI</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); if (nName && pillarId) createMut.mutate(); }} className="space-y-3">
                <Select value={pillarId} onValueChange={setPillarId}>
                  <SelectTrigger><SelectValue placeholder="Select pillar" /></SelectTrigger>
                  <SelectContent>{(pillarsQ.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="KPI name" value={nName} onChange={(e) => setNName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Unit (%, $, ...)" value={nUnit} onChange={(e) => setNUnit(e.target.value)} />
                  <Input placeholder="Target" type="number" step="any" value={nTarget} onChange={(e) => setNTarget(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select value={nCategory} onChange={(e) => setNCategory(e.target.value)} aria-label="Category" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="">Category…</option>
                    {KPI_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.letter ? `${c.letter} · ${c.name}` : c.name}</option>)}
                  </select>
                  <select value={nLevel} onChange={(e) => setNLevel(e.target.value)} aria-label="Hierarchy level" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="">Level…</option>
                    {KPI_LEVELS.map((l) => <option key={l.level} value={String(l.level)}>L{l.level} {l.name}</option>)}
                  </select>
                  <select value={nIndicator} onChange={(e) => setNIndicator(e.target.value)} aria-label="Indicator type" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="">Type…</option>
                    <option value="leading">Leading</option>
                    <option value="lagging">Lagging</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={nHigher} onChange={(e) => setNHigher(e.target.checked)} /> Higher is better</label>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="scorecard">
        <TabsList>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="framework">Framework</TabsTrigger>
        </TabsList>

        <TabsContent value="scorecard" className="space-y-6 mt-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="On Track" value={totals.onTrack} tone="green" />
        <StatCard label="Off Target" value={totals.off} tone="red" />
        <StatCard label="No Data" value={totals.noData} tone="neutral" />
      </div>

      <KpiFilterBar
        filters={filters}
        onChange={setFilters}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
        pillars={(pillarsQ.data ?? []).map((p) => ({ id: p.id, name: p.name }))}
        people={people}
        resultCount={filtered.length}
      />

      {list.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed rounded-lg space-y-3">
          <div>No KPIs yet.</div>
          <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
            <BookOpen className="h-4 w-4 mr-1" /> Browse the KPI library
          </Button>
        </div>
      ) : visibleList.length === 0 ? (
        <div className="text-center py-12 text-sm border border-dashed rounded-lg space-y-3">
          <div className="text-muted-foreground">
            {showAll
              ? "No KPIs match the current filters."
              : <>No key KPIs pinned yet. Click the <Star className="inline h-3.5 w-3.5 -mt-0.5" /> on any KPI to feature it here.</>}
          </div>
          {!showAll && (
            <Button size="sm" variant="outline" onClick={() => setShowAll(true)}>
              <Eye className="h-4 w-4 mr-1" /> Show all {list.length} KPIs
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {!showAll && hiddenCount > 0 && (
            <div className="flex items-center justify-between rounded-md bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-600">
              <span>Showing {keyCount} key KPI{keyCount === 1 ? "" : "s"} · {hiddenCount} hidden</span>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAll(true)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Show all
              </Button>
            </div>
          )}
          {sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold tracking-tight">{section.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {section.kpis.length} KPI{section.kpis.length === 1 ? "" : "s"}
                  </span>
                </div>
                {section.pillarKey && (
                  <Link
                    to="/oms/pillars/$pillarKey"
                    params={{ pillarKey: section.pillarKey }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
                  >
                    Open pillar <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {section.kpis.map((k) => (
                  <KpiTile
                    key={k.id}
                    kpi={k}
                    year={year}
                    onOpenDetail={() => setDetail(k)}
                    onSave={(periodStart, patch) =>
                      logFn({ data: { kpiId: k.id, periodStart, ...patch } })
                        .then(invalidate)
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to save"))
                    }
                    onUpdate={(patch) =>
                      updateFn({ data: { id: k.id, ...patch } })
                        .then(invalidate)
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to update"))
                    }
                    onTogglePin={() =>
                      updateFn({ data: { id: k.id, isKey: !k.is_key } })
                        .then(() => {
                          toast.success(k.is_key ? "Unpinned from key KPIs" : "Pinned as key KPI");
                          invalidate();
                        })
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to update"))
                    }

                    onDelete={() => {
                      confirmThen(`Delete KPI "${k.name}"? All logged values will be removed.`, () => {
                        deleteMut.mutate(k.id);
                      })
                    }}
                    onArchive={() => {
                      confirmThen(`Archive KPI "${k.name}"? It will be hidden but values are kept.`, () => {
                        archiveMut.mutate(k.id);
                      })
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="framework" className="mt-4">
          <KpiFrameworkTab />
        </TabsContent>
      </Tabs>

      <KpiLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        pillars={(pillarsQ.data ?? []).map((p) => ({ id: p.id, key: p.key, name: p.name }))}
        existingKeys={new Set(list.map((k) => k.library_key).filter((v): v is string => !!v))}
        onAdopt={async (items) => {
          const res = await libraryFn({ data: { items } });
          toast.success(`${res.created} KPI${res.created === 1 ? "" : "s"} added${res.skipped ? ` · ${res.skipped} skipped` : ""}`);
          invalidate();
        }}
      />

      <KpiDefinitionSheet
        kpi={detail}
        onOpenChange={(v) => { if (!v) setDetail(null); }}
        people={people}
        onEdit={() => setDetail(null)}
      />


      {showArchived && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight text-neutral-600">Archived</h2>
              <span className="text-xs text-muted-foreground">
                {archivedQ.data?.length ?? 0} KPI{(archivedQ.data?.length ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          {archivedQ.isLoading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
          ) : (archivedQ.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
              No archived KPIs.
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 divide-y bg-white">
              {(archivedQ.data as KpiRow[]).map((k) => (
                <div key={k.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{k.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {k.pillars?.name ?? "Unassigned"} · Target {k.target ?? "—"} {k.unit ?? ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => restoreMut.mutate(k.id)}>
                      <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-neutral-400 hover:text-red-600"
                      onClick={() => {
                        confirmThen(`Delete KPI "${k.name}" permanently? All logged values will be removed.`, () => {
                          deleteMut.mutate(k.id);
                        })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}




function StatCard({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "neutral" }) {
  const cls =
    tone === "green" ? "bg-green-50 text-green-700 border-green-200" :
    tone === "red" ? "bg-red-50 text-red-700 border-red-200" :
    "bg-neutral-50 text-neutral-600 border-neutral-200";
  return (
    <div className={"rounded-lg border p-4 " + cls}>
      <div className="text-xs uppercase tracking-wider font-semibold opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function KpiTile({
  kpi, year, onSave, onUpdate, onDelete, onArchive, onTogglePin, onOpenDetail,
}: {
  kpi: KpiRow;
  year: number;
  onSave: (periodStart: string, patch: { actual?: number | null; target?: number | null }) => Promise<unknown>;
  onUpdate: (patch: { name?: string; unit?: string | null; target?: number | null; higherIsBetter?: boolean; description?: string | null; category?: string | null; hierarchyLevel?: number | null; indicatorType?: string | null; formula?: string | null; dataSource?: string | null; scope?: string | null; exclusions?: string | null; reportingLevel?: string | null }) => Promise<unknown>;
  onDelete: () => void;
  onArchive: () => void;
  onTogglePin: () => Promise<unknown> | void;
  onOpenDetail: () => void;
}) {

  const [editOpen, setEditOpen] = useState(false);
  const byMonth = new Map<number, { actual: number | null; target: number | null }>();
  for (const v of kpi.kpi_values) {
    const d = new Date(v.period_start);
    if (d.getUTCFullYear() === year) byMonth.set(d.getUTCMonth(), { actual: v.actual, target: v.target });
  }
  const chartData = MONTHS.map((m, i) => {
    const r = byMonth.get(i);
    return { month: m, actual: r?.actual ?? null, target: r?.target ?? kpi.target ?? null };
  });

  const actualsWithVal = chartData.filter((r) => r.actual != null) as { month: string; actual: number; target: number | null }[];
  const latest = actualsWithVal.at(-1);
  const prev = actualsWithVal.at(-2);
  const trend = latest && prev ? (latest.actual > prev.actual ? "up" : latest.actual < prev.actual ? "down" : "flat") : null;

  const status = statusFor(kpi, year);
  const statusColor =
    status === "on" ? "bg-green-500" : status === "off" ? "bg-red-500" : "bg-neutral-300";

  const periodStartOf = (m: number) => `${year}-${String(m + 1).padStart(2, "0")}-01`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className={"mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 " + statusColor} />
          <div className="min-w-0">
            <button className="text-sm font-semibold truncate text-left hover:underline" onClick={onOpenDetail}>
              {kpi.name}
            </button>
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              {kpi.code && <Badge variant="outline" className="text-[10px] px-1 py-0">{kpi.code}</Badge>}
              {kpi.category && <Badge variant="secondary" className="text-[10px] px-1 py-0">{categoryLabel(kpi.category)}</Badge>}
              {kpi.hierarchy_level != null && <Badge variant="outline" className="text-[10px] px-1 py-0">L{kpi.hierarchy_level}</Badge>}
              {kpi.indicator_type && <Badge variant="outline" className="text-[10px] px-1 py-0">{kpi.indicator_type}</Badge>}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
              <span>Target: {kpi.target ?? "—"} {kpi.unit ?? ""}</span>
              {latest && (
                <span className="inline-flex items-center gap-0.5">
                  · Latest: <span className="font-medium text-neutral-800">{latest.actual}{kpi.unit ?? ""}</span>
                  {trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
                  {trend === "flat" && <Minus className="h-3 w-3 text-neutral-400" />}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-neutral-400 hover:text-neutral-900" onClick={onOpenDetail} title="KPI definition">
            <Info className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={"h-7 px-2 " + (kpi.is_key ? "text-amber-500 hover:text-amber-600" : "text-neutral-300 hover:text-amber-500")}
            onClick={() => onTogglePin()}
            title={kpi.is_key ? "Unpin key KPI" : "Pin as key KPI"}
          >
            <Star className={"h-3.5 w-3.5 " + (kpi.is_key ? "fill-current" : "")} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-neutral-400 hover:text-neutral-900" onClick={() => setEditOpen(true)} title="Edit KPI">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-neutral-400 hover:text-neutral-900" onClick={onArchive} title="Archive KPI">
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-neutral-400 hover:text-red-600" onClick={onDelete} title="Delete KPI">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="4 4" dot={false} connectNulls />
            <Line type="monotone" dataKey="actual" stroke="#e85d3a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-neutral-500 hover:text-neutral-900">Edit monthly values</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full table-fixed border-t border-neutral-200">
            <colgroup>
              <col style={{ width: "16%" }} />
              {MONTHS.map((m) => (<col key={m} style={{ width: "7%" }} />))}
            </colgroup>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 pr-2 font-medium">Metric</th>
                {MONTHS.map((m) => (<th key={m} className="py-1 px-1 font-medium text-center">{m}</th>))}
              </tr>
            </thead>
            <tbody>
              <MonthRow label="Target" field="target" values={chartData} onCommit={(m, n) => onSave(periodStartOf(m), { target: n })} />
              <MonthRow label="Actual" field="actual" values={chartData} onCommit={(m, n) => onSave(periodStartOf(m), { actual: n })} />
            </tbody>
          </table>
        </div>
      </details>

      <EditKpiDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        kpi={kpi}
        onSubmit={async (patch) => {
          try {
            await onUpdate(patch);
            toast.success("KPI updated");
            setEditOpen(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update");
          }
        }}
      />
    </div>
  );
}

function EditKpiDialog({
  open, onOpenChange, kpi, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kpi: KpiRow;
  onSubmit: (patch: {
    name: string; unit: string | null; target: number | null; higherIsBetter: boolean; description: string | null;
    category: string | null; hierarchyLevel: number | null; indicatorType: string | null; formula: string | null;
    dataSource: string | null; scope: string | null; exclusions: string | null; reportingLevel: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(kpi.name);
  const [unit, setUnit] = useState(kpi.unit ?? "");
  const [target, setTarget] = useState(kpi.target == null ? "" : String(kpi.target));
  const [description, setDescription] = useState(kpi.description ?? "");
  const [higherIsBetter, setHigherIsBetter] = useState(kpi.higher_is_better);
  const [category, setCategory] = useState(kpi.category ?? "");
  const [level, setLevel] = useState(kpi.hierarchy_level == null ? "" : String(kpi.hierarchy_level));
  const [indicator, setIndicator] = useState(kpi.indicator_type ?? "");
  const [formula, setFormula] = useState(kpi.formula ?? "");
  const [dataSource, setDataSource] = useState(kpi.data_source ?? "");
  const [scope, setScope] = useState(kpi.scope ?? "");
  const [exclusions, setExclusions] = useState(kpi.exclusions ?? "");
  const [reportingLevel, setReportingLevel] = useState(kpi.reporting_level ?? "");
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(kpi.name);
      setUnit(kpi.unit ?? "");
      setTarget(kpi.target == null ? "" : String(kpi.target));
      setDescription(kpi.description ?? "");
      setHigherIsBetter(kpi.higher_is_better);
      setCategory(kpi.category ?? "");
      setLevel(kpi.hierarchy_level == null ? "" : String(kpi.hierarchy_level));
      setIndicator(kpi.indicator_type ?? "");
      setFormula(kpi.formula ?? "");
      setDataSource(kpi.data_source ?? "");
      setScope(kpi.scope ?? "");
      setExclusions(kpi.exclusions ?? "");
      setReportingLevel(kpi.reporting_level ?? "");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit KPI</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, $, ..." />
            </div>
          </div>
          <div>
            <Label>Direction</Label>
            <select
              value={higherIsBetter ? "up" : "down"}
              onChange={(e) => setHigherIsBetter(e.target.value === "up")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="up">Higher is better</option>
              <option value="down">Lower is better</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">—</option>
                {KPI_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.letter ? `${c.letter} · ${c.name}` : c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Level</Label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">—</option>
                {KPI_LEVELS.map((l) => <option key={l.level} value={String(l.level)}>L{l.level} {l.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select value={indicator} onChange={(e) => setIndicator(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">—</option>
                <option value="leading">Leading</option>
                <option value="lagging">Lagging</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Formula</Label>
            <Input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="(Good units / Total units) × 100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data source</Label>
              <Input value={dataSource} onChange={(e) => setDataSource(e.target.value)} placeholder="ERP, MES, timesheets…" />
            </div>
            <div>
              <Label>Reporting level</Label>
              <Input value={reportingLevel} onChange={(e) => setReportingLevel(e.target.value)} placeholder="Site, line, cell…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Scope</Label>
              <Input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="What is counted" />
            </div>
            <div>
              <Label>Exclusions</Label>
              <Input value={exclusions} onChange={(e) => setExclusions(e.target.value)} placeholder="What is not counted" />
            </div>
          </div>
          <div>
            <Label>Definition / Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <Button
            disabled={!name || saving}
            className="w-full"
            onClick={async () => {
              setSaving(true);
              try {
                await onSubmit({
                  name,
                  unit: unit || null,
                  target: target === "" ? null : Number(target),
                  higherIsBetter,
                  description: description || null,
                  category: category || null,
                  hierarchyLevel: level === "" ? null : Number(level),
                  indicatorType: indicator || null,
                  formula: formula || null,
                  dataSource: dataSource || null,
                  scope: scope || null,
                  exclusions: exclusions || null,
                  reportingLevel: reportingLevel || null,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function MonthRow({
  label, field, values, onCommit,
}: {
  label: string;
  field: "actual" | "target";
  values: { month: string; actual: number | null; target: number | null }[];
  onCommit: (monthIndex: number, n: number | null) => Promise<unknown>;
}) {
  return (
    <tr className="border-t border-neutral-100">
      <td className="py-1 pr-2 font-medium text-neutral-700">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-0.5 py-1 text-center">
          <MonthCell initial={v[field]} onCommit={(n) => onCommit(i, n)} />
        </td>
      ))}
    </tr>
  );
}

function MonthCell({ initial, onCommit }: { initial: number | null; onCommit: (n: number | null) => Promise<unknown> }) {
  const [val, setVal] = useState<string>(initial == null ? "" : String(initial));
  const [saved, setSaved] = useState<string>(initial == null ? "" : String(initial));
  if (initial != null && String(initial) !== saved && val === saved) {
    setVal(String(initial));
    setSaved(String(initial));
  }
  return (
    <input
      type="number"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val === saved) return;
        const n = val === "" ? null : Number(val);
        if (val !== "" && Number.isNaN(n)) return;
        setSaved(val);
        onCommit(n);
      }}
      className="w-full h-7 text-center rounded border border-neutral-200 bg-white text-xs focus:border-neutral-400 focus:outline-none"
      placeholder="—"
    />
  );
}
