import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, Lock, Zap, ArrowUp, ArrowDown, PackageCheck, PackageX } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog, promptDialog } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";
import {
  type ApsComponent,
  type ApsWorkCenter,
  type ApsWorkOrder,
  type PriorityRule,
  PRIORITY_RULES,
  ZONES,
  kitStatus,
  sequenceOrders,
  weekOffset,
  workOrderHours,
  zoneFor,
} from "@/lib/aps";

type Common = {
  companyId: string;
  orders: ApsWorkOrder[];
  workCenters: ApsWorkCenter[];
  onEdit: (o: ApsWorkOrder) => void;
};

function useOrderMutations(companyId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["aps-orders"] });
    void qc.invalidateQueries({ queryKey: ["aps-log"] });
  };

  const setArchived = useMutation({
    mutationFn: async (v: { id: string; archived: boolean }) => {
      const { data, error } = await supabase
        .from("aps_work_orders")
        .update({ archived_at: v.archived ? new Date().toISOString() : null })
        .eq("id", v.id)
        .select("id");
      if (error) throw error;
      assertWrote(data, v.archived ? "archive" : "restore");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Work order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("aps_components").delete().eq("work_order_id", id);
      await supabase.from("aps_operations").delete().eq("work_order_id", id);
      const { data, error } = await supabase.from("aps_work_orders").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Work order deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async (v: { order: ApsWorkOrder; changes: Partial<ApsWorkOrder>; action: string; log?: boolean; reason?: string }) => {
      const { data, error } = await supabase.from("aps_work_orders").update(v.changes).eq("id", v.order.id).select("id");
      if (error) throw error;
      assertWrote(data, v.action);
      if (v.log) {
        await supabase.from("aps_schedule_log").insert({
          company_id: companyId,
          work_order_id: v.order.id,
          zone: zoneFor(v.order.scheduled_start),
          action: v.action,
          from_value: JSON.stringify(
            Object.fromEntries(Object.keys(v.changes).map((k) => [k, (v.order as unknown as Record<string, unknown>)[k]])),
          ),
          to_value: JSON.stringify(v.changes),
          reason: v.reason ?? null,
          override: !!v.reason,
        });
      }
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  return { setArchived, remove, patch };
}

function OrderMenu({ companyId, order, onEdit }: { companyId: string; order: ApsWorkOrder; onEdit: (o: ApsWorkOrder) => void }) {
  const { setArchived, remove } = useOrderMutations(companyId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 opacity-60 hover:opacity-100" aria-label={`Actions for ${order.wo_number}`}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(order)}>
          <Pencil className="mr-2 h-4 w-4" /> Open / edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setArchived.mutate({ id: order.id, archived: !order.archived_at })}>
          {order.archived_at ? (
            <>
              <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
            </>
          ) : (
            <>
              <Archive className="mr-2 h-4 w-4" /> Archive
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() =>
            void confirmDialog({
              title: `Delete ${order.wo_number}?`,
              description: "Its pegged components and operations are removed too.",
              destructive: true,
              confirmLabel: "Delete",
            }).then((ok) => ok && remove.mutate(order.id))
          }
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrderCard({
  companyId,
  order,
  workCenters,
  onEdit,
  short,
}: { companyId: string; order: ApsWorkOrder; workCenters: ApsWorkCenter[]; onEdit: (o: ApsWorkOrder) => void; short: boolean }) {
  const wc = workCenters.find((w) => w.id === order.work_center_id);
  return (
    <div className="rounded-md border bg-card p-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">
            {order.wo_number} {order.expedite && <Zap className="ml-1 inline h-3.5 w-3.5 text-amber-500" />}
          </div>
          <div className="text-xs text-muted-foreground">
            {order.part_number} · qty {order.qty} · {workOrderHours(order).toFixed(1)} h
          </div>
          <div className="text-xs text-muted-foreground">
            {wc?.name ?? "Unassigned"} · due {order.due_date}
          </div>
        </div>
        <OrderMenu companyId={companyId} order={order} onEdit={onEdit} />
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <Badge variant="outline" className="capitalize">
          {order.status.replace("_", " ")}
        </Badge>
        {short ? (
          <Badge variant="destructive">
            <PackageX className="mr-1 h-3 w-3" /> short
          </Badge>
        ) : (
          <Badge variant="secondary">
            <PackageCheck className="mr-1 h-3 w-3" /> kit ok
          </Badge>
        )}
        {order.family && <Badge variant="outline">{order.family}</Badge>}
      </div>
    </div>
  );
}

export function HorizonBoard({
  companyId,
  orders,
  workCenters,
  onEdit,
  shortIds,
}: Common & { shortIds: Set<string> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ZONES.map((z) => {
        const zoneOrders = orders
          .filter((o) => zoneFor(o.scheduled_start) === z.key)
          .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
        const hours = zoneOrders.reduce((s, o) => s + workOrderHours(o), 0);
        return (
          <div key={z.key} className={`rounded-lg border-2 p-3 ${z.accent}`}>
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">
                  {z.label} <span className="text-sm font-normal text-muted-foreground">{z.weeks}</span>
                </h4>
                {z.key === "frozen" && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">{z.logic}</p>
              <p className="text-xs text-muted-foreground">{z.flexibility}</p>
              <p className="mt-1 text-xs font-medium">
                {zoneOrders.length} orders · {hours.toFixed(0)} h
              </p>
            </div>
            <div className="space-y-2">
              {zoneOrders.map((o) => (
                <OrderCard key={o.id} companyId={companyId} order={o} workCenters={workCenters} onEdit={onEdit} short={shortIds.has(o.id)} />
              ))}
              {zoneOrders.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No work orders in this zone.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DispatchPanel({ companyId, orders, workCenters, onEdit, shortIds }: Common & { shortIds: Set<string> }) {
  const [rule, setRule] = useState<PriorityRule>("edd");
  const [family, setFamily] = useState(true);
  const [wcFilter, setWcFilter] = useState<string>("all");
  const { patch } = useOrderMutations(companyId);

  const live = orders.filter((o) => !o.archived_at && o.status !== "done" && weekOffset(o.scheduled_start) < 4);
  const groups = useMemo(() => {
    const list = wcFilter === "all" ? workCenters : workCenters.filter((w) => w.id === wcFilter);
    return list.map((wc) => ({
      wc,
      queue: sequenceOrders(
        live.filter((o) => o.work_center_id === wc.id),
        rule,
        family,
      ),
    }));
  }, [live, workCenters, rule, family, wcFilter]);

  const unassigned = live.filter((o) => !o.work_center_id);

  const release = (o: ApsWorkOrder) => {
    if (shortIds.has(o.id)) {
      void confirmDialog({
        title: `${o.wo_number} kit is short`,
        description: "Releasing an incomplete kit starves the line later. Release anyway?",
        destructive: true,
        confirmLabel: "Release anyway",
      }).then((ok) => {
        if (ok) patch.mutate({ order: o, changes: { status: "released", released_at: new Date().toISOString() }, action: "release", log: true });
      });
      return;
    }
    patch.mutate({ order: o, changes: { status: "released", released_at: new Date().toISOString() }, action: "release", log: true });
  };

  const move = async (o: ApsWorkOrder, delta: number) => {
    if (zoneFor(o.scheduled_start) === "frozen") {
      const reason = await promptDialog({
        title: "Frozen zone — supervisor override",
        description: "Re-sequencing inside the frozen zone needs a reason and is logged.",
        label: "Override reason",
      });
      if (!reason) return;
      patch.mutate({ order: o, changes: { sequence: o.sequence + delta }, action: "resequence", log: true, reason });
      return;
    }
    patch.mutate({ order: o, changes: { sequence: o.sequence + delta }, action: "resequence", log: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Rule:</span>
        {PRIORITY_RULES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRule(r.key)}
            title={r.hint}
            className={`rounded-full border px-3 py-1 text-sm ${rule === r.key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {r.label}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={family} onChange={(e) => setFamily(e.target.checked)} /> Group setup families
        </label>
        <select className="ml-auto rounded-md border bg-background px-2 py-1.5 text-sm" value={wcFilter} onChange={(e) => setWcFilter(e.target.value)} aria-label="Work center filter">
          <option value="all">All work centers</option>
          {workCenters.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map(({ wc, queue }) => (
          <div key={wc.id} className="rounded-lg border p-3">
            <h4 className="mb-2 font-medium">
              {wc.name} <span className="text-sm font-normal text-muted-foreground">{queue.length} in queue</span>
            </h4>
            <ol className="space-y-2">
              {queue.map((o, i) => (
                <li key={o.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                  <span className="w-5 text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {o.wo_number} {o.expedite && <Zap className="ml-1 inline h-3.5 w-3.5 text-amber-500" />}
                      {zoneFor(o.scheduled_start) === "frozen" && <Lock className="ml-1 inline h-3 w-3 text-muted-foreground" />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.part_number} · {workOrderHours(o).toFixed(1)} h · due {o.due_date}
                      {shortIds.has(o.id) && <span className="ml-1 text-destructive">· kit short</span>}
                    </div>
                  </div>
                  <button onClick={() => void move(o, -1)} aria-label="Move up" className="opacity-60 hover:opacity-100">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => void move(o, 1)} aria-label="Move down" className="opacity-60 hover:opacity-100">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  {o.status === "planned" ? (
                    <Button size="sm" variant="outline" onClick={() => release(o)}>
                      Release
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="capitalize">
                      {o.status.replace("_", " ")}
                    </Badge>
                  )}
                  <OrderMenu companyId={companyId} order={o} onEdit={onEdit} />
                </li>
              ))}
              {queue.length === 0 && <p className="py-3 text-center text-xs text-muted-foreground">Queue is clear.</p>}
            </ol>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-lg border border-dashed p-3">
          <h4 className="mb-2 font-medium text-amber-600">Unassigned — no work center</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((o) => (
              <OrderCard key={o.id} companyId={companyId} order={o} workCenters={workCenters} onEdit={onEdit} short={shortIds.has(o.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PeggingPanel({
  companyId,
  orders,
  onEdit,
  componentsByOrder,
}: {
  companyId: string;
  orders: ApsWorkOrder[];
  onEdit: (o: ApsWorkOrder) => void;
  componentsByOrder: Map<string, ApsComponent[]>;
}) {
  const { patch } = useOrderMutations(companyId);
  const live = orders.filter((o) => !o.archived_at && o.status !== "done");

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Kitting validation: a job should only be released when every component is free on hand. Long-lead shortages are escalated to S&amp;OE.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left font-medium">Work order</th>
              <th className="p-2 text-left font-medium">Zone</th>
              <th className="p-2 text-left font-medium">Start</th>
              <th className="p-2 text-left font-medium">Components</th>
              <th className="p-2 text-left font-medium">Shortages</th>
              <th className="p-2 text-left font-medium">Kit</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {live.map((o) => {
              const comps = componentsByOrder.get(o.id) ?? [];
              const kit = kitStatus(comps);
              return (
                <tr key={o.id} className="border-t">
                  <td className="p-2">
                    <button className="font-medium hover:underline" onClick={() => onEdit(o)}>
                      {o.wo_number}
                    </button>
                    <div className="text-xs text-muted-foreground">{o.part_number}</div>
                  </td>
                  <td className="p-2 capitalize">{zoneFor(o.scheduled_start)}</td>
                  <td className="p-2">{o.scheduled_start}</td>
                  <td className="p-2">{comps.length}</td>
                  <td className="p-2">
                    {kit.short.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="text-destructive">
                        {kit.short.map((c) => c.part_number).join(", ")}
                        {kit.longLead.length > 0 && <Badge variant="outline" className="ml-2">long lead</Badge>}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <Badge variant={o.kit_ready ? "default" : "secondary"}>{o.kit_ready ? "Ready" : "Not ready"}</Badge>
                  </td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => patch.mutate({ order: o, changes: { kit_ready: !o.kit_ready }, action: "kit" })}>
                      {o.kit_ready ? "Unmark" : "Mark ready"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {live.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                  No open work orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
