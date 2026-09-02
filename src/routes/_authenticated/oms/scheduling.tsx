import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CalendarRange, Factory, Gauge, Plane } from "lucide-react";
import { useActiveCompany } from "@/hooks/use-companies";
import { ValueStreamBar } from "@/components/oms/aps/value-stream-bar";
import { CapacityPanel } from "@/components/oms/aps/capacity-panel";
import { WorkOrderDialog } from "@/components/oms/aps/work-order-dialog";
import { HorizonBoard, DispatchPanel, PeggingPanel } from "@/components/oms/aps/orders-panel";
import { ScenarioPanel } from "@/components/oms/aps/scenario-panel";
import {
  type ApsComponent,
  type ApsTooling,
  type ApsValueStream,
  type ApsWorkCenter,
  type ApsWorkOrder,
  computeMetrics,
  kitStatus,
} from "@/lib/aps";

export const Route = createFileRoute("/_authenticated/oms/scheduling")({
  head: () => ({
    meta: [
      { title: "Shop Floor Scheduling (0–12 weeks) — DO.Impact" },
      {
        name: "description",
        content: "Finite-capacity shop floor scheduling: frozen, firm and flexible horizons, dispatch lists, kitting validation and what-if simulation.",
      },
      { property: "og:title", content: "Shop Floor Scheduling (0–12 weeks) — DO.Impact" },
      {
        property: "og:description",
        content: "Turn the tactical plan into sequence-specific work for every machine and operator over a rolling 12-week horizon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulingPage,
});

function SchedulingPage() {
  const activeCompanyQ = useActiveCompany();
  const companyId = activeCompanyQ.data?.company_id ?? null;

  const [showArchivedStreams, setShowArchivedStreams] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const streamsQ = useQuery({
    queryKey: ["aps-value-streams", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_value_streams").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as ApsValueStream[];
    },
    enabled: !!companyId,
  });
  const streams = streamsQ.data ?? [];

  useEffect(() => {
    const live = streams.filter((s) => !s.archived_at);
    if (live.length && (!activeStreamId || !live.some((s) => s.id === activeStreamId))) setActiveStreamId(live[0].id);
    if (!live.length && activeStreamId) setActiveStreamId(null);
  }, [streams, activeStreamId]);

  const wcQ = useQuery({
    queryKey: ["aps-work-centers", activeStreamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_work_centers").select("*").eq("value_stream_id", activeStreamId!).order("sort_order");
      if (error) throw error;
      return (data ?? []) as ApsWorkCenter[];
    },
    enabled: !!activeStreamId,
  });
  const workCenters = wcQ.data ?? [];
  const liveWorkCenters = workCenters.filter((w) => !w.archived_at);

  const ordersQ = useQuery({
    queryKey: ["aps-orders", activeStreamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_work_orders").select("*").eq("value_stream_id", activeStreamId!).order("scheduled_start");
      if (error) throw error;
      return (data ?? []) as ApsWorkOrder[];
    },
    enabled: !!activeStreamId,
  });
  const orders = useMemo(() => (ordersQ.data ?? []).filter((o) => !o.archived_at), [ordersQ.data]);

  const toolingQ = useQuery({
    queryKey: ["aps-tooling", activeStreamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_tooling").select("*").is("archived_at", null).order("name");
      if (error) throw error;
      return (data ?? []) as ApsTooling[];
    },
    enabled: !!activeStreamId,
  });
  const tooling = toolingQ.data ?? [];

  const orderIds = orders.map((o) => o.id);
  const componentsQ = useQuery({
    queryKey: ["aps-components", "all", activeStreamId, orderIds.length],
    queryFn: async () => {
      if (!orderIds.length) return [] as ApsComponent[];
      const { data, error } = await supabase.from("aps_components").select("*").in("work_order_id", orderIds);
      if (error) throw error;
      return (data ?? []) as ApsComponent[];
    },
    enabled: !!activeStreamId,
  });

  const componentsByOrder = useMemo(() => {
    const m = new Map<string, ApsComponent[]>();
    for (const c of componentsQ.data ?? []) {
      const list = m.get(c.work_order_id) ?? [];
      list.push(c);
      m.set(c.work_order_id, list);
    }
    return m;
  }, [componentsQ.data]);

  const shortIds = useMemo(() => {
    const s = new Set<string>();
    for (const o of orders) {
      const comps = componentsByOrder.get(o.id) ?? [];
      if (comps.length > 0 && kitStatus(comps).short.length > 0) s.add(o.id);
    }
    return s;
  }, [orders, componentsByOrder]);

  const opsQ = useQuery({
    queryKey: ["aps-operations", activeStreamId, orderIds.length],
    queryFn: async () => {
      if (!orderIds.length) return [];
      const { data, error } = await supabase
        .from("aps_operations")
        .select("status, completed_on_time, queue_minutes, run_minutes, setup_minutes")
        .in("work_order_id", orderIds);
      if (error) throw error;
      return (data ?? []) as { status: string; completed_on_time: boolean | null; queue_minutes: number; run_minutes: number; setup_minutes: number }[];
    },
    enabled: !!activeStreamId,
  });

  const metrics = computeMetrics(orders, opsQ.data ?? []);
  const editingOrder = orders.find((o) => o.id === editingOrderId) ?? null;

  const openNew = () => {
    setEditingOrderId(null);
    setOrderOpen(true);
  };
  const openEdit = (o: ApsWorkOrder) => {
    setEditingOrderId(o.id);
    setOrderOpen(true);
  };

  const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)}%`);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarRange className="h-7 w-7" /> Shop Floor Scheduling
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Finite-capacity execution engine for a rolling 0–12 week horizon. SIOP sets the aggregate plan; this turns it into deterministic,
            sequence-specific work for machines, work centers and operators.
          </p>
        </div>
        {activeStreamId && (
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Work order
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <Link to="/oms/shopfloor" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Factory className="mr-1 inline h-3.5 w-3.5" /> Pull system
        </Link>
        <Link to="/oms/sic" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Gauge className="mr-1 inline h-3.5 w-3.5" /> SIC boards
        </Link>
        <Link to="/oms/critical-path" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
          <Plane className="mr-1 inline h-3.5 w-3.5" /> Critical Path Pulse
        </Link>
        <span className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          Scheduling (0–12wk)
        </span>
      </div>

      {companyId && (
        <ValueStreamBar
          companyId={companyId}
          streams={streams}
          activeId={activeStreamId}
          onSelect={setActiveStreamId}
          showArchived={showArchivedStreams}
          onToggleArchived={() => setShowArchivedStreams((v) => !v)}
        />
      )}

      {!activeStreamId || !companyId ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Add a value stream / shop area above to start scheduling.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Schedule adherence", value: pct(metrics.scheduleAdherence) },
              { label: "On-time delivery", value: pct(metrics.otd) },
              { label: "Queue time / WIP", value: pct(metrics.queueRatio) },
              { label: "Setup-to-run", value: pct(metrics.setupToRun) },
              { label: "Orders at late risk", value: String(metrics.lateRisk) },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-2xl font-semibold">{m.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="horizon">
            <TabsList>
              <TabsTrigger value="horizon">Horizon board</TabsTrigger>
              <TabsTrigger value="capacity">Capacity &amp; constraints</TabsTrigger>
              <TabsTrigger value="dispatch">Dispatch lists</TabsTrigger>
              <TabsTrigger value="pegging">Material pegging</TabsTrigger>
              <TabsTrigger value="whatif">What-if simulator</TabsTrigger>
            </TabsList>

            <TabsContent value="horizon" className="mt-4">
              <HorizonBoard companyId={companyId} orders={orders} workCenters={workCenters} onEdit={openEdit} shortIds={shortIds} />
            </TabsContent>

            <TabsContent value="capacity" className="mt-4">
              <CapacityPanel companyId={companyId} valueStreamId={activeStreamId} workCenters={workCenters} orders={orders} tooling={tooling} />
            </TabsContent>

            <TabsContent value="dispatch" className="mt-4">
              <DispatchPanel companyId={companyId} orders={orders} workCenters={liveWorkCenters} onEdit={openEdit} shortIds={shortIds} />
            </TabsContent>

            <TabsContent value="pegging" className="mt-4">
              <PeggingPanel companyId={companyId} orders={orders} onEdit={openEdit} componentsByOrder={componentsByOrder} />
            </TabsContent>

            <TabsContent value="whatif" className="mt-4">
              <ScenarioPanel companyId={companyId} valueStreamId={activeStreamId} orders={orders} workCenters={liveWorkCenters} />
            </TabsContent>
          </Tabs>

          <WorkOrderDialog
            companyId={companyId}
            valueStreamId={activeStreamId}
            workCenters={liveWorkCenters}
            tooling={tooling}
            order={editingOrder}
            open={orderOpen}
            onOpenChange={setOrderOpen}
          />
        </>
      )}
    </div>
  );
}
