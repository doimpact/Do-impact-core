import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Factory } from "lucide-react";
import { toast } from "sonner";
import { useSandbox } from "@/hooks/use-sandbox";
import { useMyAccess } from "@/hooks/use-access";
import { useActiveCompany } from "@/hooks/use-companies";
import type { ApsDowntime, ApsValueStream, ApsWorkCenter, ApsWorkOrder } from "@/lib/aps";
import {
  type ApsOperationLite,
  type RolledWorkCenter,
  horizonMonthKeys,
  rollupWorkCenters,
} from "@/lib/siop-aps-rollup";

const STATUS_COLOR: Record<string, string> = { green: "#22c55e", yellow: "#f59e0b", red: "#ef4444" };
const fmt = (n: number) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const monthLabel = (k: string) => {
  const [y, m] = k.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

type SyncedRow = { id: string; source_ref: string | null };

export function SiopApsRollup({ cycleId }: { cycleId: string }) {
  const qc = useQueryClient();
  const { isSandbox } = useSandbox();
  const { canWrite } = useMyAccess();
  const activeCompanyQ = useActiveCompany();
  const isTemplate = Boolean(activeCompanyQ.data?.companies?.is_template);
  const canSync = canWrite && !isSandbox && !isTemplate && !activeCompanyQ.isLoading;
  const [streamId, setStreamId] = useState<string>("all");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const streamsQ = useQuery({
    queryKey: ["aps-value-streams", "siop"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_value_streams").select("*").is("archived_at", null).order("sort_order");
      if (error) throw error;
      return (data ?? []) as ApsValueStream[];
    },
  });
  const streams = streamsQ.data ?? [];

  const wcQ = useQuery({
    queryKey: ["aps-work-centers", "siop"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_work_centers").select("*").is("archived_at", null).order("sort_order");
      if (error) throw error;
      return (data ?? []) as ApsWorkCenter[];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["aps-orders", "siop"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_work_orders").select("*").is("archived_at", null);
      if (error) throw error;
      return (data ?? []) as ApsWorkOrder[];
    },
  });

  const opsQ = useQuery({
    queryKey: ["aps-operations", "siop"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_operations").select("id, work_order_id, work_center_id, setup_minutes, run_minutes");
      if (error) throw error;
      return (data ?? []) as ApsOperationLite[];
    },
  });

  const dtQ = useQuery({
    queryKey: ["aps-downtime", "siop"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_downtime").select("*");
      if (error) throw error;
      return (data ?? []) as ApsDowntime[];
    },
  });

  const loading = wcQ.isLoading || ordersQ.isLoading || dtQ.isLoading;

  const workCenters = useMemo(
    () => (wcQ.data ?? []).filter((w) => streamId === "all" || w.value_stream_id === streamId),
    [wcQ.data, streamId],
  );

  const rolled: RolledWorkCenter[] = useMemo(
    () =>
      rollupWorkCenters({
        workCenters,
        orders: ordersQ.data ?? [],
        operations: opsQ.data ?? [],
        downtime: dtQ.data ?? [],
      }),
    [workCenters, ordersQ.data, opsQ.data, dtQ.data],
  );

  const months = useMemo(() => horizonMonthKeys(), []);

  const sync = useMutation({
    mutationFn: async () => {
      const { data: existing, error: exErr } = await supabase
        .from("siop_capacity" as any)
        .select("id, source_ref")
        .eq("cycle_id", cycleId)
        .eq("source", "aps");
      if (exErr) throw exErr;
      const byRef = new Map<string, string>();
      for (const r of (existing ?? []) as unknown as SyncedRow[]) if (r.source_ref) byRef.set(r.source_ref, r.id);

      for (const row of rolled) {
        const payload = {
          resource_type: "facility",
          resource_name: `${row.name} (Scheduling)`,
          unit: "hrs",
          available_capacity: row.available,
          required_capacity: row.required,
          status: row.status,
          monthly_values: row.monthly_values,
          source: "aps",
          source_ref: row.work_center_id,
        };
        const id = byRef.get(row.work_center_id);
        if (id) {
          const { error } = await supabase.from("siop_capacity" as any).update(payload).eq("id", id);
          if (error) throw error;
          byRef.delete(row.work_center_id);
        } else {
          const { error } = await supabase.from("siop_capacity" as any).insert({ ...payload, cycle_id: cycleId });
          if (error) throw error;
        }
      }
      // Remove synced rows whose work center no longer exists.
      const stale = [...byRef.values()];
      if (stale.length) {
        const { error } = await supabase.from("siop_capacity" as any).delete().in("id", stale);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setSyncedAt(new Date());
      void qc.invalidateQueries({ queryKey: ["siop_capacity", cycleId] });
    },
  });

  // Auto-sync whenever the rolled-up numbers change.
  const signature = useMemo(() => JSON.stringify(rolled.map((r) => [r.work_center_id, r.monthly_values])), [rolled]);
  const lastSig = useRef<string | null>(null);
  const syncMut = sync.mutate;
  useEffect(() => {
    if (loading || !canSync || streamId !== "all") return;
    if (lastSig.current === signature) return;
    lastSig.current = signature;
    syncMut();
  }, [signature, loading, canSync, streamId, syncMut]);

  if (!loading && rolled.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-center justify-between gap-3 flex-wrap">
        <span>No work centers in Scheduling (0–12 weeks) yet — add them to feed this step automatically.</span>
        <Button asChild size="sm" variant="outline"><Link to="/oms/scheduling">Open Scheduling <ExternalLink className="h-3 w-3 ml-1" /></Link></Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="px-3 py-2 bg-muted flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Factory className="h-4 w-4" /> From Scheduling (0–12 weeks)
          <Badge variant="secondary" className="font-normal">Auto-synced</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={streamId} onValueChange={setStreamId}>
            <SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All value streams</SelectItem>
              {streams.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => sync.mutate(undefined, { onSuccess: () => toast.success("Capacity synced from Scheduling"), onError: (e: any) => toast.error(e.message) })} disabled={sync.isPending || !canSync}>
            <RefreshCw className={`h-4 w-4 mr-1 ${sync.isPending ? "animate-spin" : ""}`} /> Sync now
          </Button>
          <Button asChild size="sm" variant="ghost"><Link to="/oms/scheduling">Open <ExternalLink className="h-3 w-3 ml-1" /></Link></Button>
        </div>
      </div>
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-b">
        Work-center capacity net of planned downtime vs released work-order load, rolled to months. Covers {months.map(monthLabel).join(", ")} only — later months stay blank.
        {syncedAt && <> · Last synced {syncedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Work center</th>
              {months.map((m) => <th key={m} className="p-2 text-right whitespace-nowrap">{monthLabel(m)}</th>)}
              <th className="p-2 text-right">Available</th>
              <th className="p-2 text-right">Required</th>
              <th className="p-2 text-right">Gap</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rolled.map((r) => (
              <tr key={r.work_center_id} className="border-t">
                <td className="p-2 font-medium">{r.name}</td>
                {months.map((m) => {
                  const cell = r.monthly_values[m];
                  const gap = cell ? cell.available - cell.required : 0;
                  return (
                    <td key={m} className="p-2 text-right whitespace-nowrap">
                      {cell ? (
                        <span className={gap < 0 ? "text-red-600" : ""}>{fmt(cell.required)} / {fmt(cell.available)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="p-2 text-right">{fmt(r.available)} hrs</td>
                <td className="p-2 text-right">{fmt(r.required)} hrs</td>
                <td className={`p-2 text-right font-semibold ${r.gap < 0 ? "text-red-600" : "text-green-600"}`}>{r.gap >= 0 ? "+" : ""}{fmt(r.gap)}</td>
                <td className="p-2 text-center"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[r.status] }} /></td>
              </tr>
            ))}
            {loading && <tr><td colSpan={months.length + 5} className="p-3 text-center text-muted-foreground text-xs">Loading shop floor data…</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-t">Required / Available hours per month. Edit work centers, downtime and work orders in Scheduling — these rows are read-only here.</div>
    </div>
  );
}
