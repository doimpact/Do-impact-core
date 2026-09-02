import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Settings = {
  id: string;
  name: string;
  anchor_week: string;
  opening_balance: number;
  currency: string;
  monthly_revenue: number | null;
  notes: string | null;
};

type Line = {
  id: string;
  settings_id: string | null;
  week_start_date: string;
  line_key: string;
  line_label: string;
  category: "inflow" | "outflow";
  plan: number;
  actual: number;
  sort_order: number;
};

const DEFAULT_LINES: { key: string; label: string; category: "inflow" | "outflow" }[] = [
  { key: "receipts", label: "Customer receipts", category: "inflow" },
  { key: "other_in", label: "Other inflows", category: "inflow" },
  { key: "payroll", label: "Payroll", category: "outflow" },
  { key: "suppliers", label: "Suppliers / materials", category: "outflow" },
  { key: "rent", label: "Rent & utilities", category: "outflow" },
  { key: "taxes", label: "Taxes", category: "outflow" },
  { key: "debt", label: "Debt service", category: "outflow" },
  { key: "capex", label: "Turnaround Finance outflows", category: "outflow" },
  { key: "other_out", label: "Other outflows", category: "outflow" },
];

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }
function addWeeks(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + 7 * n); return c; }
function fmtWeek(d: Date) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmt(n: number, ccy = "USD") {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  try { return sign + new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(abs); }
  catch { return `${sign}${abs.toFixed(0)}`; }
}

export function CapexCashFlow() {
  const qc = useQueryClient();

  const { data: settingsRow } = useQuery({
    queryKey: ["cash_flow_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cash_flow_settings" as never).select("*").order("created_at").limit(1);
      if (error) throw error;
      if ((data as unknown as Settings[])?.length) return (data as unknown as Settings[])[0];
      const { data: ins, error: e2 } = await supabase.from("cash_flow_settings" as never).insert({ name: "Default" } as never).select().single();
      if (e2) throw e2;
      return ins as unknown as Settings;
    },
  });

  const { data: lines = [] } = useQuery({
    queryKey: ["cash_flow_weeks", settingsRow?.id],
    enabled: !!settingsRow,
    queryFn: async () => {
      const { data, error } = await supabase.from("cash_flow_weeks" as never).select("*").eq("settings_id", settingsRow!.id);
      if (error) throw error;
      return (data ?? []) as unknown as Line[];
    },
  });

  const anchor = settingsRow ? new Date(settingsRow.anchor_week) : new Date();
  const weeks = useMemo(() => Array.from({ length: 13 }, (_, i) => toISODate(addWeeks(anchor, i))), [anchor]);

  // Ensure default line templates exist for the current settings
  useEffect(() => {
    if (!settingsRow) return;
    const existingKeys = new Set(lines.map(l => l.line_key));
    const missing = DEFAULT_LINES.filter(d => !existingKeys.has(d.key));
    if (missing.length === 0) return;
    (async () => {
      const rows = missing.flatMap((d, idx) =>
        weeks.map(w => ({
          settings_id: settingsRow.id,
          week_start_date: w,
          line_key: d.key,
          line_label: d.label,
          category: d.category,
          plan: 0,
          actual: 0,
          sort_order: idx,
        }))
      );
      await supabase.from("cash_flow_weeks" as never).insert(rows as never);
      qc.invalidateQueries({ queryKey: ["cash_flow_weeks", settingsRow.id] });
    })();
  }, [settingsRow, lines, weeks, qc]);

  const updateSettings = useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const { error } = await supabase.from("cash_flow_settings" as never).update(patch as never).eq("id", settingsRow!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cash_flow_settings"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCell = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Line> }) => {
      const { error } = await supabase.from("cash_flow_weeks" as never).update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cash_flow_weeks", settingsRow?.id] }),
  });

  const insertCell = useMutation({
    mutationFn: async (row: Partial<Line>) => {
      const { data, error } = await supabase.from("cash_flow_weeks" as never).insert(row as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cash_flow_weeks", settingsRow?.id] }),
  });

  // Group by line_key
  const grouped = useMemo(() => {
    const byKey = new Map<string, { label: string; category: "inflow" | "outflow"; sort: number; byWeek: Map<string, Line> }>();
    for (const l of lines) {
      if (!byKey.has(l.line_key)) byKey.set(l.line_key, { label: l.line_label, category: l.category, sort: l.sort_order, byWeek: new Map() });
      byKey.get(l.line_key)!.byWeek.set(l.week_start_date, l);
    }
    return Array.from(byKey.entries()).sort((a, b) => a[1].sort - b[1].sort || a[1].label.localeCompare(b[1].label));
  }, [lines]);

  const inflowRows = grouped.filter(([, v]) => v.category === "inflow");
  const outflowRows = grouped.filter(([, v]) => v.category === "outflow");

  const weekTotals = useMemo(() => {
    const opening = Number(settingsRow?.opening_balance ?? 0);
    let running = opening;
    return weeks.map(w => {
      const inflow = inflowRows.reduce((s, [, v]) => s + Number(v.byWeek.get(w)?.actual || v.byWeek.get(w)?.plan || 0), 0);
      const outflow = outflowRows.reduce((s, [, v]) => s + Number(v.byWeek.get(w)?.actual || v.byWeek.get(w)?.plan || 0), 0);
      const net = inflow - outflow;
      const open = running;
      running = running + net;
      return { week: w, inflow, outflow, net, open, close: running };
    });
  }, [weeks, inflowRows, outflowRows, settingsRow]);

  const minBalance = Math.min(...weekTotals.map(w => w.close));
  const ccy = settingsRow?.currency ?? "USD";

  async function ensureCell(key: string, label: string, category: "inflow" | "outflow", week: string, patch: Partial<Line>) {
    const existing = grouped.find(([k]) => k === key)?.[1].byWeek.get(week);
    if (existing) {
      updateCell.mutate({ id: existing.id, patch });
    } else {
      await insertCell.mutateAsync({ settings_id: settingsRow!.id, week_start_date: week, line_key: key, line_label: label, category, plan: 0, actual: 0, sort_order: 99, ...patch });
    }
  }

  if (!settingsRow) return <div className="text-sm text-muted-foreground">Loading cash flow…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">13-week cash flow forecast</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Rolling weekly cash view — the heartbeat of any turnaround. Enter plan and actuals per week; running balance updates live.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] uppercase text-muted-foreground">Anchor week</label>
            <Input type="date" className="w-40" defaultValue={settingsRow.anchor_week} onBlur={e => updateSettings.mutate({ anchor_week: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-muted-foreground">Opening balance</label>
            <Input type="number" className="w-36" defaultValue={settingsRow.opening_balance} onBlur={e => updateSettings.mutate({ opening_balance: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-muted-foreground">Currency</label>
            <Input className="w-20" defaultValue={settingsRow.currency} onBlur={e => updateSettings.mutate({ currency: e.target.value || "USD" })} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Opening balance" value={fmt(Number(settingsRow.opening_balance), ccy)} />
        <MiniStat label="Ending balance (wk 13)" value={fmt(weekTotals.at(-1)?.close ?? 0, ccy)} />
        <MiniStat label="Min weekly balance" value={fmt(minBalance, ccy)} accent={minBalance < 0 ? "rose" : "emerald"} />
        <MiniStat label="Net 13-wk change" value={fmt((weekTotals.at(-1)?.close ?? 0) - Number(settingsRow.opening_balance), ccy)} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-[1200px] text-xs">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 bg-muted/50 px-2 py-2 text-left w-56">Line</th>
              {weeks.map((w, i) => (
                <th key={w} className="px-2 py-2 text-right">W{i + 1}<div className="font-normal">{fmtWeek(new Date(w))}</div></th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SectionHeader label="Inflows" span={weeks.length + 1} />
            {inflowRows.map(([key, v]) => (
              <LineRow key={key} lineKey={key} lineLabel={v.label} category="inflow" weeks={weeks} byWeek={v.byWeek} onChange={(w, patch) => ensureCell(key, v.label, "inflow", w, patch)} />
            ))}
            <TotalRow label="Total inflows" values={weekTotals.map(t => t.inflow)} ccy={ccy} />

            <SectionHeader label="Outflows" span={weeks.length + 1} />
            {outflowRows.map(([key, v]) => (
              <LineRow key={key} lineKey={key} lineLabel={v.label} category="outflow" weeks={weeks} byWeek={v.byWeek} onChange={(w, patch) => ensureCell(key, v.label, "outflow", w, patch)} />
            ))}
            <TotalRow label="Total outflows" values={weekTotals.map(t => t.outflow)} ccy={ccy} />

            <tr className="border-t-2 border-border bg-muted/30 font-semibold">
              <td className="sticky left-0 z-10 bg-muted/30 px-2 py-2">Net cash</td>
              {weekTotals.map(t => (
                <td key={t.week} className={cn("px-2 py-2 text-right tabular-nums", t.net < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>{fmt(t.net, ccy)}</td>
              ))}
            </tr>
            <tr className="bg-muted/20">
              <td className="sticky left-0 z-10 bg-muted/20 px-2 py-2 text-muted-foreground">Opening</td>
              {weekTotals.map(t => <td key={t.week} className="px-2 py-2 text-right tabular-nums text-muted-foreground">{fmt(t.open, ccy)}</td>)}
            </tr>
            <tr className="border-t border-border bg-primary/5 font-semibold">
              <td className="sticky left-0 z-10 bg-primary/5 px-2 py-2">Closing balance</td>
              {weekTotals.map(t => (
                <td key={t.week} className={cn("px-2 py-2 text-right tabular-nums", t.close < 0 && "text-rose-600 dark:text-rose-400")}>{fmt(t.close, ccy)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeader({ label, span }: { label: string; span: number }) {
  return (
    <tr>
      <td colSpan={span} className="bg-muted/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</td>
    </tr>
  );
}

function TotalRow({ label, values, ccy }: { label: string; values: number[]; ccy: string }) {
  return (
    <tr className="border-t border-border bg-muted/10 text-xs font-medium">
      <td className="sticky left-0 z-10 bg-muted/10 px-2 py-1">{label}</td>
      {values.map((v, i) => <td key={i} className="px-2 py-1 text-right tabular-nums">{fmt(v, ccy)}</td>)}
    </tr>
  );
}

function LineRow({
  lineKey, lineLabel, weeks, byWeek, onChange,
}: {
  lineKey: string; lineLabel: string; category: "inflow" | "outflow"; weeks: string[]; byWeek: Map<string, Line>;
  onChange: (week: string, patch: Partial<Line>) => void;
}) {
  return (
    <tr className="border-t border-border">
      <td className="sticky left-0 z-10 bg-background px-2 py-1 font-medium">{lineLabel}<div className="text-[9px] uppercase text-muted-foreground">{lineKey}</div></td>
      {weeks.map(w => {
        const cell = byWeek.get(w);
        const plan = cell?.plan ?? 0;
        const actual = cell?.actual ?? 0;
        return (
          <td key={w} className="px-1 py-1 align-top">
            <input
              type="number"
              className="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-right tabular-nums hover:border-border focus:border-primary focus:outline-none"
              defaultValue={plan || ""}
              placeholder="plan"
              onBlur={e => { const n = Number(e.target.value) || 0; if (n !== plan) onChange(w, { plan: n }); }}
            />
            <input
              type="number"
              className={cn("w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-right font-semibold tabular-nums hover:border-border focus:border-primary focus:outline-none", actual !== 0 && "text-primary")}
              defaultValue={actual || ""}
              placeholder="actual"
              onBlur={e => { const n = Number(e.target.value) || 0; if (n !== actual) onChange(w, { actual: n }); }}
            />
          </td>
        );
      })}
    </tr>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: "emerald" | "rose" }) {
  const tint = accent === "rose" ? "border-l-rose-500" : accent === "emerald" ? "border-l-emerald-500" : "border-l-primary";
  return (
    <div className={cn("rounded-lg border border-l-4 border-border bg-card p-3", tint)}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
