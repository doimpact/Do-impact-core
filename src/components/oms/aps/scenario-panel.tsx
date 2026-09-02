import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";
import {
  type ApsScenario,
  type ApsScenarioChange,
  type ApsWorkCenter,
  type ApsWorkOrder,
  weeklyCapacityHours,
  weekOffset,
  workOrderHours,
} from "@/lib/aps";

type Props = {
  companyId: string;
  valueStreamId: string;
  orders: ApsWorkOrder[];
  workCenters: ApsWorkCenter[];
};

const CHANGE_TYPES = [
  { key: "machine_down", label: "Machine down (lose capacity)" },
  { key: "add_shift", label: "Add shift (gain capacity)" },
  { key: "expedite", label: "Expedite a work order" },
  { key: "qty_change", label: "Change work order quantity" },
];

export function ScenarioPanel({ companyId, valueStreamId, orders, workCenters }: Props) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const scenariosQ = useQuery({
    queryKey: ["aps-scenarios", valueStreamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aps_scenarios")
        .select("*")
        .eq("value_stream_id", valueStreamId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApsScenario[];
    },
  });
  const scenarios = scenariosQ.data ?? [];
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0] ?? null;

  const changesQ = useQuery({
    queryKey: ["aps-scenario-changes", active?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_scenario_changes").select("*").eq("scenario_id", active!.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as ApsScenarioChange[];
    },
    enabled: !!active?.id,
  });
  const changes = changesQ.data ?? [];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["aps-scenarios"] });
    void qc.invalidateQueries({ queryKey: ["aps-scenario-changes"] });
  };

  const createScenario = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name the scenario.");
      const { data, error } = await supabase
        .from("aps_scenarios")
        .insert({ company_id: companyId, value_stream_id: valueStreamId, name: name.trim(), status: "draft" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      invalidate();
      setActiveId(id);
      setName("");
      toast.success("Scenario created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeScenario = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("aps_scenario_changes").delete().eq("scenario_id", id);
      const { data, error } = await supabase.from("aps_scenarios").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      setActiveId(null);
      toast.success("Scenario deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [chg, setChg] = useState({ change_type: "machine_down", work_order_id: "", work_center_id: "", value: 8, note: "" });

  const addChange = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Create a scenario first.");
      const { error } = await supabase.from("aps_scenario_changes").insert({
        company_id: companyId,
        scenario_id: active.id,
        change_type: chg.change_type,
        work_order_id: chg.work_order_id || null,
        work_center_id: chg.work_center_id || null,
        payload: { value: Number(chg.value) },
        note: chg.note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Disruption added to scenario");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeChange = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("aps_scenario_changes").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  // Simulation: recompute 4-week load vs capacity with the scenario applied.
  const horizon = [0, 1, 2, 3];
  const simulate = () => {
    const rows = workCenters.map((wc) => {
      const baseCap = weeklyCapacityHours(wc);
      let capDelta = 0;
      for (const c of changes) {
        if (c.work_center_id !== wc.id) continue;
        const v = Number((c.payload as { value?: number }).value ?? 0);
        if (c.change_type === "machine_down") capDelta -= v;
        if (c.change_type === "add_shift") capDelta += v;
      }
      const load = (week: number, sim: boolean) =>
        orders
          .filter((o) => o.work_center_id === wc.id && !o.archived_at && weekOffset(o.scheduled_start) === week)
          .reduce((s, o) => {
            let qty = o.qty;
            if (sim) {
              const q = changes.find((c) => c.change_type === "qty_change" && c.work_order_id === o.id);
              if (q) qty = Number((q.payload as { value?: number }).value ?? qty);
            }
            return s + workOrderHours({ ...o, qty });
          }, 0);
      return {
        wc,
        weeks: horizon.map((w) => ({
          week: w,
          baseLoad: load(w, false),
          simLoad: load(w, true),
          baseCap,
          simCap: Math.max(baseCap + capDelta, 0),
        })),
      };
    });
    return rows;
  };
  const sim = simulate();
  const overloads = sim.flatMap((r) => r.weeks.filter((w) => w.simLoad > w.simCap)).length;
  const expedited = changes.filter((c) => c.change_type === "expedite").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FlaskConical className="h-4 w-4 text-muted-foreground" />
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={`rounded-full border px-3 py-1 text-sm ${active?.id === s.id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {s.name}
          </button>
        ))}
        <Input className="w-48" placeholder="New scenario name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" onClick={() => createScenario.mutate()}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
        {active && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() =>
              void confirmDialog({ title: `Delete scenario "${active.name}"?`, destructive: true, confirmLabel: "Delete" }).then(
                (ok) => ok && removeScenario.mutate(active.id),
              )
            }
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        )}
      </div>

      {!active ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Create a scenario to test a breakdown, an extra shift or an expedited order before you touch the live plan.
        </p>
      ) : (
        <>
          <div className="grid gap-2 md:grid-cols-6">
            <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={chg.change_type} onChange={(e) => setChg({ ...chg, change_type: e.target.value })} aria-label="Disruption type">
              {CHANGE_TYPES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={chg.work_center_id} onChange={(e) => setChg({ ...chg, work_center_id: e.target.value })} aria-label="Work center">
              <option value="">Work center…</option>
              {workCenters.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select className="rounded-md border bg-background px-2 py-1.5 text-sm" value={chg.work_order_id} onChange={(e) => setChg({ ...chg, work_order_id: e.target.value })} aria-label="Work order">
              <option value="">Work order…</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.wo_number}
                </option>
              ))}
            </select>
            <Input type="number" value={chg.value} onChange={(e) => setChg({ ...chg, value: Number(e.target.value) })} aria-label="Value (hours or quantity)" />
            <Input placeholder="Note" value={chg.note} onChange={(e) => setChg({ ...chg, note: e.target.value })} />
            <Button size="sm" onClick={() => addChange.mutate()}>
              Add disruption
            </Button>
          </div>

          <div className="space-y-1">
            {changes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                <span>
                  <Badge variant="outline" className="mr-2">
                    {CHANGE_TYPES.find((t) => t.key === c.change_type)?.label ?? c.change_type}
                  </Badge>
                  {workCenters.find((w) => w.id === c.work_center_id)?.name ?? ""}
                  {orders.find((o) => o.id === c.work_order_id)?.wo_number ?? ""} · value {String((c.payload as { value?: number }).value ?? "")}
                  {c.note && <span className="text-muted-foreground"> · {c.note}</span>}
                </span>
                <button className="text-muted-foreground hover:text-destructive" onClick={() => removeChange.mutate(c.id)} aria-label="Remove disruption">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {changes.length === 0 && <p className="text-sm text-muted-foreground">No disruptions in this scenario yet.</p>}
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex flex-wrap gap-3 text-sm">
              <span>
                Overloaded work-center weeks: <strong className={overloads ? "text-destructive" : ""}>{overloads}</strong>
              </span>
              <span>Expedites in scenario: {expedited}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Work center</th>
                    {horizon.map((w) => (
                      <th key={w} className="p-2 text-center font-medium">
                        W{w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sim.map((r) => (
                    <tr key={r.wc.id} className="border-t">
                      <td className="p-2 font-medium">{r.wc.name}</td>
                      {r.weeks.map((w) => {
                        const over = w.simLoad > w.simCap;
                        const delta = w.simLoad - w.baseLoad;
                        return (
                          <td key={w.week} className={`p-2 text-center ${over ? "text-destructive font-semibold" : ""}`}>
                            {w.simLoad.toFixed(0)} / {w.simCap.toFixed(0)} h
                            {delta !== 0 && <div className="text-[10px] text-muted-foreground">{delta > 0 ? "+" : ""}{delta.toFixed(0)} h vs live</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
