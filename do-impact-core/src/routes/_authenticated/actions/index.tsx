import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Search, GanttChartSquare, LayoutList, LayoutGrid, Users, Gauge, Filter, Bookmark, BookmarkPlus, X, RotateCcw, History,
} from "lucide-react";
import {
  ACTION_MODULES, ActionFilters, ActionModule, ActionRow, DEFAULT_FILTERS,
  filterActions, todayISO, useExecutionActions,
} from "@/lib/execution-actions";
import { useActionViews } from "@/hooks/use-action-views";
import { OverviewTab } from "@/components/actions/portal/overview-tab";
import { BoardTab } from "@/components/actions/portal/board-tab";
import { TimelineTab, GanttGroupBy } from "@/components/actions/portal/timeline-tab";
import { HistoryTimelineTab, HistoryZoom } from "@/components/actions/portal/history-timeline-tab";
import { TableTab } from "@/components/actions/portal/table-tab";
import { WorkloadTab } from "@/components/actions/portal/workload-tab";
import { ActionDrawer } from "@/components/actions/portal/action-drawer";


export const Route = createFileRoute("/_authenticated/actions/")({
  head: () => ({
    meta: [
      { title: "Execution portal — track every action | DO.Impact" },
      { name: "description", content: "One portal for every action across strategy, operations, commercial and problem solving: KPIs, board, timeline, table and owner workload." },
      { property: "og:title", content: "Execution portal — DO.Impact" },
      { property: "og:description", content: "Track actions and progress across all modules in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExecutionPortalPage,
});

type TabKey = "overview" | "board" | "timeline" | "table" | "workload" | "history";

function ExecutionPortalPage() {
  const today = todayISO();
  const { data: rows = [], isLoading } = useExecutionActions();
  const { views, addView, removeView } = useActionViews();

  const [tab, setTab] = useState<TabKey>("overview");
  const [filters, setFilters] = useState<ActionFilters>(DEFAULT_FILTERS);
  const [zoom, setZoom] = useState<"week" | "month" | "quarter">("month");
  const [groupBy, setGroupBy] = useState<GanttGroupBy>("module");
  const [historyZoom, setHistoryZoom] = useState<HistoryZoom>("quarter");

  const [swimlane, setSwimlane] = useState<"none" | "module" | "owner">("none");
  const [selected, setSelected] = useState<ActionRow | null>(null);
  const [viewName, setViewName] = useState("");

  const set = <K extends keyof ActionFilters>(k: K, v: ActionFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) if (r.owner_id) map.set(r.owner_id, r.owner_name ?? r.owner_id.slice(0, 8));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filtered = useMemo(() => filterActions(rows, filters, today), [rows, filters, today]);

  // Overview KPIs ignore status/date-range so the tiles stay a true summary
  const scoped = useMemo(
    () => filterActions(rows, { ...filters, status: "all", range: "all", noDueDate: false, includeClosed: true }, today),
    [rows, filters, today],
  );

  const activeFilterCount =
    (filters.modules.length > 0 ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.owner !== "all" ? 1 : 0) +
    (filters.range !== "all" ? 1 : 0) +
    (filters.noDueDate ? 1 : 0) +
    (filters.includeClosed ? 1 : 0) +
    (filters.q ? 1 : 0);

  const drill = (preset: "overdue" | "week" | "blocked" | "open" | "done") => {
    if (preset === "overdue") setFilters((f) => ({ ...f, status: "overdue", range: "all", includeClosed: false }));
    if (preset === "week") setFilters((f) => ({ ...f, status: "all", range: "week", includeClosed: false }));
    if (preset === "blocked") setFilters((f) => ({ ...f, status: "blocked", range: "all", includeClosed: false }));
    if (preset === "open") setFilters((f) => ({ ...f, status: "all", range: "all", includeClosed: false }));
    if (preset === "done") setFilters((f) => ({ ...f, status: "done", range: "all", includeClosed: true }));
    setTab("table");
  };

  const toggleModule = (m: ActionModule) =>
    setFilters((f) => ({
      ...f,
      modules: f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m],
    }));

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1500px] mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Execution portal</h1>
          <p className="text-sm text-muted-foreground">
            Every action across Strategy, Progress, Commercial, Operations, Daily Management and Problem Solver — in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{filtered.length} shown</Badge>
          <Badge variant="outline">{rows.length} total</Badge>
        </div>
      </header>

      {/* filter bar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search action, parent or owner…"
              className="pl-8 h-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-4 w-4" />
                Modules
                {filters.modules.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{filters.modules.length}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1.5">
                {ACTION_MODULES.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-muted cursor-pointer">
                    <Checkbox checked={filters.modules.includes(m)} onCheckedChange={() => toggleModule(m)} />
                    {m}
                  </label>
                ))}
                <Button variant="ghost" size="sm" className="w-full h-7 mt-1" onClick={() => set("modules", [])}>Clear</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={filters.status} onValueChange={(v) => set("status", v as ActionFilters["status"])}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.owner} onValueChange={(v) => set("owner", v)}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              <SelectItem value="none">Unassigned</SelectItem>
              {owners.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.range} onValueChange={(v) => set("range", v as ActionFilters["range"])}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Due" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any due date</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="week">Next 7 days</SelectItem>
              <SelectItem value="next30">Next 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          {filters.range === "custom" && (
            <>
              <Input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} className="h-9 w-[145px]" />
              <Input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} className="h-9 w-[145px]" />
            </>
          )}

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
            <Checkbox checked={filters.includeClosed} onCheckedChange={(v) => set("includeClosed", !!v)} /> Show done
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
            <Checkbox checked={filters.noDueDate} onCheckedChange={(v) => set("noDueDate", !!v)} /> No due date
          </label>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={() => setFilters(DEFAULT_FILTERS)}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}

          {/* saved views */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Bookmark className="h-4 w-4" /> Views
                {views.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{views.length}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 space-y-3" align="end">
              <div className="space-y-1">
                {views.length === 0 && <p className="text-xs text-muted-foreground">No saved views yet.</p>}
                {views.map((v) => (
                  <div key={v.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex-1 text-left text-sm px-2 py-1 rounded hover:bg-muted truncate"
                      onClick={() => { setFilters(v.filters); setTab(v.tab as TabKey); }}
                    >
                      {v.name}
                    </button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeView(v.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 border-t pt-2">
                <Label className="text-xs">Save current filters</Label>
                <div className="flex gap-1.5">
                  <Input value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="View name" className="h-8" />
                  <Button
                    size="sm"
                    className="h-8 gap-1"
                    disabled={!viewName.trim()}
                    onClick={() => { addView(viewName.trim(), tab, filters); setViewName(""); }}
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5"><Gauge className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="board" className="gap-1.5"><LayoutGrid className="h-4 w-4" /> Board</TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5"><GanttChartSquare className="h-4 w-4" /> Gantt</TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5"><LayoutList className="h-4 w-4" /> Table</TabsTrigger>
            <TabsTrigger value="workload" className="gap-1.5"><Users className="h-4 w-4" /> Workload</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-4 w-4" /> Timeline</TabsTrigger>
          </TabsList>

          {tab === "history" && (
            <Select value={historyZoom} onValueChange={(v) => setHistoryZoom(v as HistoryZoom)}>
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Months</SelectItem>
                <SelectItem value="quarter">Quarters</SelectItem>
                <SelectItem value="year">Years</SelectItem>
              </SelectContent>
            </Select>
          )}


          {tab === "timeline" && (
            <div className="flex items-center gap-2">
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GanttGroupBy)}>
                <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="module">Group: module</SelectItem>
                  <SelectItem value="owner">Group: owner</SelectItem>
                  <SelectItem value="status">Group: status</SelectItem>
                  <SelectItem value="parent">Group: parent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={zoom} onValueChange={(v) => setZoom(v as "week" | "month" | "quarter")}>
                <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Weeks</SelectItem>
                  <SelectItem value="month">Months</SelectItem>
                  <SelectItem value="quarter">Quarters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {tab === "board" && (
            <Select value={swimlane} onValueChange={(v) => setSwimlane(v as "none" | "module" | "owner")}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No swimlanes</SelectItem>
                <SelectItem value="module">Swimlane: module</SelectItem>
                <SelectItem value="owner">Swimlane: owner</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading actions…</div>
        ) : (
          <>
            <TabsContent value="overview" className="mt-4">
              <OverviewTab scoped={scoped} all={filtered} onDrill={drill} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="board" className="mt-4">
              <BoardTab rows={filtered} swimlane={swimlane} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <TimelineTab rows={filtered} groupBy={groupBy} zoom={zoom} today={today} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="table" className="mt-4">
              <TableTab rows={filtered} onSelect={setSelected} />
            </TabsContent>
            <TabsContent value="workload" className="mt-4">
              <WorkloadTab rows={filtered} onSelectOwner={(id) => { set("owner", id); setTab("table"); }} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HistoryTimelineTab rows={filtered} zoom={historyZoom} today={today} onSelect={setSelected} />
            </TabsContent>

          </>
        )}
      </Tabs>

      <ActionDrawer row={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
