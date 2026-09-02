// Shared value-tracking dialogs (monthly $ benefits + leading/lagging KPIs).
// Used by strategic objectives (/strategy) and waterfall value levers
// (/strategy/waterfall) so both surfaces render exactly the same forms.

import { useState } from "react";
import { formatMoney } from "@/lib/number-format";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { OwnerSelect } from "@/components/owner-select";
import { confirmDialog } from "@/components/confirm-dialog";

export type VtConfig = {
  /** Foreign key column on the child tables ("objective_id" | "item_id"). */
  fk: string;
  benefitsTable: string;
  kpisTable: string;
  kpiValuesTable: string;
  /** Prefix for react-query keys, e.g. "obj" or "wf-item". */
  keyPrefix: string;
};

export const OBJECTIVE_VT: VtConfig = {
  fk: "objective_id",
  benefitsTable: "objective_monthly_benefits",
  kpisTable: "objective_kpis",
  kpiValuesTable: "objective_kpi_values",
  keyPrefix: "obj",
};

export const WATERFALL_ITEM_VT: VtConfig = {
  fk: "item_id",
  benefitsTable: "waterfall_item_monthly_benefits",
  kpisTable: "waterfall_item_kpis",
  kpiValuesTable: "waterfall_item_kpi_values",
  keyPrefix: "wf-item",
};

export type VtKpi = {
  id: string;
  name: string;
  unit: string | null;
  kind: "leading" | "lagging";
  target: number | null;
  higher_is_better: boolean;
  frequency: string;
  owner_id: string | null;
  archived_at: string | null;
  [k: string]: any;
};

export type VtKpiValue = {
  id: string;
  kpi_id: string;
  period_start: string;
  actual: number | null;
  note: string | null;
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─────────────────────────────────────────────────────────────
// Monthly benefits ($)

export function MonthlyBenefitsDialog({
  cfg,
  parentId,
  parentTitle,
  startYear,
  trigger,
  onSaved,
  extraFooter,
}: {
  cfg: VtConfig;
  parentId: string;
  parentTitle: string;
  startYear: number;
  trigger: React.ReactNode;
  onSaved: () => void;
  /** Optional extra action rendered in the footer, receives the 3-year plan total. */
  extraFooter?: (planTotal: number) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, { plan: string; actual: string }>>({});
  const [loading, setLoading] = useState(false);

  const years = [startYear, startYear + 1, startYear + 2];
  const cellKey = (y: number, m: number) => `${y}-${m}`;

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from(cfg.benefitsTable)
      .select("year,month,value,actual")
      .eq(cfg.fk, parentId);
    setLoading(false);
    if (error) return toast.error(error.message);
    const next: Record<string, { plan: string; actual: string }> = {};
    (data ?? []).forEach((r: any) => {
      next[cellKey(r.year, r.month)] = { plan: String(r.value ?? 0), actual: String(r.actual ?? 0) };
    });
    setRows(next);
  };

  const setCell = (k: string, field: "plan" | "actual", v: string) =>
    setRows((r) => ({ ...r, [k]: { plan: r[k]?.plan ?? "", actual: r[k]?.actual ?? "", [field]: v } as { plan: string; actual: string } }));

  const save = async () => {
    const payload = years.flatMap((y) =>
      MONTH_NAMES.map((_, i) => {
        const m = i + 1;
        const cell = rows[cellKey(y, m)];
        return {
          [cfg.fk]: parentId,
          year: y,
          month: m,
          value: Number(cell?.plan ?? 0) || 0,
          actual: Number(cell?.actual ?? 0) || 0,
        };
      }),
    );
    const { error } = await (supabase as any)
      .from(cfg.benefitsTable)
      .upsert(payload, { onConflict: `${cfg.fk},year,month` });
    if (error) return toast.error(error.message);
    toast.success("Benefits saved");
    onSaved();
    setOpen(false);
  };

  const yearTotals = (y: number) => {
    let plan = 0, actual = 0;
    for (let i = 0; i < 12; i++) {
      const c = rows[cellKey(y, i + 1)];
      plan += Number(c?.plan ?? 0) || 0;
      actual += Number(c?.actual ?? 0) || 0;
    }
    return { plan, actual };
  };
  const grand = years.reduce(
    (s, y) => {
      const t = yearTotals(y);
      return { plan: s.plan + t.plan, actual: s.actual + t.actual };
    },
    { plan: 0, actual: 0 },
  );
  const fmt = (n: number) => formatMoney(n);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) load();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Monthly benefits · {parentTitle}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-5">
            {years.map((y) => {
              const t = yearTotals(y);
              return (
                <div key={y}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <div className="text-sm font-semibold">{y}</div>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      Plan: <span className="font-medium text-foreground">{fmt(t.plan)}</span>
                      <span className="mx-2">·</span>
                      Actual: <span className="font-medium text-emerald-700">{fmt(t.actual)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {MONTH_NAMES.map((mn, i) => {
                      const m = i + 1;
                      const k = cellKey(y, m);
                      const c = rows[k];
                      return (
                        <div key={k} className="flex flex-col">
                          <span className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground text-center">{mn}</span>
                          <Input
                            type="number"
                            title="Planned"
                            className="h-7 px-1 text-xs tabular-nums text-right"
                            value={c?.plan ?? ""}
                            onChange={(e) => setCell(k, "plan", e.target.value)}
                            placeholder="Plan"
                          />
                          <Input
                            type="number"
                            title="Actual"
                            className="mt-1 h-7 px-1 text-xs tabular-nums text-right border-emerald-300 focus-visible:ring-emerald-400"
                            value={c?.actual ?? ""}
                            onChange={(e) => setCell(k, "actual", e.target.value)}
                            placeholder="Actual"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">3-year totals</span>
              <span className="tabular-nums font-semibold">
                Plan <span className="text-foreground">{fmt(grand.plan)}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                Actual <span className="text-emerald-700">{fmt(grand.actual)}</span>
              </span>
            </div>
          </div>
        )}
        <DialogFooter>
          {extraFooter?.(grand.plan)}
          <Button onClick={save} disabled={loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Leading & lagging KPIs

export function KpisDialog({
  cfg,
  parentId,
  parentTitle,
  canEdit,
  trigger,
  onChanged,
}: {
  cfg: VtConfig;
  parentId: string;
  parentTitle: string;
  canEdit: boolean;
  trigger: React.ReactNode;
  onChanged?: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const kpisQ = useQuery({
    queryKey: [`${cfg.keyPrefix}-kpis`, parentId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(cfg.kpisTable)
        .select("*")
        .eq(cfg.fk, parentId)
        .order("kind")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VtKpi[];
    },
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [`${cfg.keyPrefix}-kpis`, parentId] });
    onChanged?.();
  };
  const kpis = (kpisQ.data ?? []).filter((k) => !k.archived_at);
  const leading = kpis.filter((k) => k.kind === "leading");
  const lagging = kpis.filter((k) => k.kind === "lagging");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{parentTitle} — Leading &amp; lagging KPIs</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {canEdit && (
            <div className="flex justify-end">
              <KpiEditDialog cfg={cfg} parentId={parentId} onSaved={invalidate} />
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <KpiGroup cfg={cfg} parentId={parentId} title="Leading" items={leading} canEdit={canEdit} onChanged={invalidate} />
            <KpiGroup cfg={cfg} parentId={parentId} title="Lagging" items={lagging} canEdit={canEdit} onChanged={invalidate} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KpiGroup({
  cfg, parentId, title, items, canEdit, onChanged,
}: {
  cfg: VtConfig;
  parentId: string;
  title: string;
  items: VtKpi[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No {title.toLowerCase()} KPIs yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((k) => (
            <KpiRow key={k.id} cfg={cfg} parentId={parentId} kpi={k} canEdit={canEdit} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

export function KpiRow({
  cfg, parentId, kpi, canEdit, onChanged,
}: {
  cfg: VtConfig;
  parentId: string;
  kpi: VtKpi;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [valuesOpen, setValuesOpen] = useState(false);

  const valuesQ = useQuery({
    queryKey: [`${cfg.keyPrefix}-kpi-values`, kpi.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(cfg.kpiValuesTable)
        .select("*")
        .eq("kpi_id", kpi.id)
        .order("period_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VtKpiValue[];
    },
  });
  const values = valuesQ.data ?? [];
  const latest = values[0];
  const prev = values[1];

  const trend = (() => {
    if (!latest || latest.actual == null) return "flat" as const;
    if (!prev || prev.actual == null) return "flat" as const;
    if (latest.actual === prev.actual) return "flat" as const;
    const up = latest.actual > prev.actual;
    const good = kpi.higher_is_better ? up : !up;
    return good ? ("up-good" as const) : ("down-bad" as const);
  })();

  const onTarget = (() => {
    if (!latest || latest.actual == null || kpi.target == null) return null;
    return kpi.higher_is_better ? latest.actual >= kpi.target : latest.actual <= kpi.target;
  })();

  return (
    <div className="rounded-md border border-neutral-200 bg-card p-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{kpi.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            <span>
              Target {kpi.target ?? "—"}
              {kpi.unit ? ` ${kpi.unit}` : ""}
            </span>
            <span>
              · Latest{" "}
              <span className={onTarget == null ? "" : onTarget ? "text-emerald-700" : "text-red-700"}>
                {latest?.actual ?? "—"}
                {latest && kpi.unit ? ` ${kpi.unit}` : ""}
              </span>
            </span>
            {trend === "up-good" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
            {trend === "down-bad" && <TrendingDown className="h-3 w-3 text-red-600" />}
            {trend === "flat" && <Minus className="h-3 w-3 text-neutral-400" />}
            <span>· {kpi.frequency}</span>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setValuesOpen(true)}>
          Log
        </Button>
        {canEdit && (
          <>
            <KpiEditDialog
              cfg={cfg}
              parentId={parentId}
              initial={kpi}
              onSaved={onChanged}
              trigger={
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-600"
              onClick={async () => {
                if (!(await confirmDialog(`Delete KPI "${kpi.name}"?`))) return;
                const { error } = await (supabase as any).from(cfg.kpisTable).delete().eq("id", kpi.id);
                if (error) toast.error(error.message);
                else onChanged();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      <KpiValuesDialog
        cfg={cfg}
        open={valuesOpen}
        onOpenChange={setValuesOpen}
        kpi={kpi}
        values={values}
        canEdit={canEdit}
        onChanged={() => qc.invalidateQueries({ queryKey: [`${cfg.keyPrefix}-kpi-values`, kpi.id] })}
      />
    </div>
  );
}

export function KpiEditDialog({
  cfg, parentId, initial, trigger, onSaved,
}: {
  cfg: VtConfig;
  parentId: string;
  initial?: VtKpi;
  trigger?: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [kind, setKind] = useState<VtKpi["kind"]>(initial?.kind ?? "leading");
  const [target, setTarget] = useState<string>(initial?.target != null ? String(initial.target) : "");
  const [higherBetter, setHigherBetter] = useState<boolean>(initial?.higher_is_better ?? true);
  const [frequency, setFrequency] = useState<string>(initial?.frequency ?? "monthly");
  const [ownerId, setOwnerId] = useState<string | null>(initial?.owner_id ?? null);

  const save = async () => {
    if (!name.trim()) return toast.error("Name required");
    const payload: Record<string, unknown> = {
      [cfg.fk]: parentId,
      name,
      unit: unit || null,
      kind,
      target: target === "" ? null : Number(target),
      higher_is_better: higherBetter,
      frequency,
      owner_id: ownerId,
    };
    if (initial) {
      const { error } = await (supabase as any).from(cfg.kpisTable).update(payload).eq("id", initial.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await (supabase as any).from(cfg.kpisTable).insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    onSaved();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-3.5 w-3.5" /> New KPI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit KPI" : "New KPI"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Type</label>
              <Select value={kind} onValueChange={(v) => setKind(v as VtKpi["kind"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leading">Leading</SelectItem>
                  <SelectItem value="lagging">Lagging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Frequency</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Target</label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Unit</label>
              <Input value={unit ?? ""} onChange={(e) => setUnit(e.target.value)} placeholder="%, x, €…" />
            </div>
            <div>
              <label className="text-xs font-medium">Direction</label>
              <Select value={higherBetter ? "up" : "down"} onValueChange={(v) => setHigherBetter(v === "up")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="up">Higher is better</SelectItem>
                  <SelectItem value="down">Lower is better</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Owner</label>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function KpiValuesDialog({
  cfg, open, onOpenChange, kpi, values, canEdit, onChanged,
}: {
  cfg: VtConfig;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kpi: VtKpi;
  values: VtKpiValue[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [periodStart, setPeriodStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [actual, setActual] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const save = async () => {
    if (!periodStart) return toast.error("Period required");
    if (actual === "") return toast.error("Actual value required");
    const { error } = await (supabase as any)
      .from(cfg.kpiValuesTable)
      .upsert(
        { kpi_id: kpi.id, period_start: periodStart, actual: Number(actual), note: note || null },
        { onConflict: "kpi_id,period_start" },
      );
    if (error) return toast.error(error.message);
    toast.success("Logged");
    setActual("");
    setNote("");
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kpi.name} — log values</DialogTitle>
        </DialogHeader>
        {canEdit && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Period start</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium">Actual {kpi.unit ? `(${kpi.unit})` : ""}</label>
                <Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Note</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={save}>Save value</Button>
            </div>
          </div>
        )}
        <div className="max-h-72 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="p-2 text-left">Period</th>
                <th className="p-2 text-right">Actual</th>
                <th className="p-2 text-left">Note</th>
                {canEdit && <th className="p-2" />}
              </tr>
            </thead>
            <tbody>
              {values.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="p-4 text-center text-xs text-muted-foreground">
                    No values logged yet.
                  </td>
                </tr>
              )}
              {values.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-2">{v.period_start}</td>
                  <td className="p-2 text-right">
                    {v.actual ?? "—"}
                    {v.actual != null && kpi.unit ? ` ${kpi.unit}` : ""}
                  </td>
                  <td className="p-2 text-muted-foreground">{v.note}</td>
                  {canEdit && (
                    <td className="p-2 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-600"
                        onClick={async () => {
                          const { error } = await (supabase as any).from(cfg.kpiValuesTable).delete().eq("id", v.id);
                          if (error) toast.error(error.message);
                          else onChanged();
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
