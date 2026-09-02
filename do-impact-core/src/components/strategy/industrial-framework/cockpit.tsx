import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COCKPIT_LAYERS, MONTHLY_REVIEW } from "@/lib/industrial-strategy-framework";
import { EntryField } from "./entry-field";

type KpiRow = { id: string; name: string; unit: string | null };
type KpiValue = { kpi_id: string; period_start: string; actual: number | null };

/** Industrial Strategy Cockpit — one page, layered, monthly. */
export function Cockpit({ canEdit }: { canEdit: boolean }) {
  const { data: kpis = [] } = useQuery({
    queryKey: ["isf-cockpit-kpis"],
    queryFn: async () =>
      ((await supabase.from("kpis").select("id,name,unit").is("archived_at", null)).data ?? []) as KpiRow[],
  });
  const { data: values = [] } = useQuery({
    queryKey: ["isf-cockpit-kpi-values"],
    queryFn: async () =>
      ((await supabase
        .from("kpi_values")
        .select("kpi_id,period_start,actual")
        .order("period_start", { ascending: false })).data ?? []) as KpiValue[],
  });

  const latestFor = (matches?: string[]) => {
    if (!matches?.length) return null;
    const kpi = kpis.find((k) => matches.some((m) => k.name.toLowerCase().includes(m)));
    if (!kpi) return null;
    const v = values.find((x) => x.kpi_id === kpi.id && x.actual !== null);
    if (!v) return null;
    return { name: kpi.name, text: `${v.actual}${kpi.unit ? ` ${kpi.unit}` : ""}` };
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Gauge className="h-3.5 w-3.5" /> Industrial Strategy Cockpit
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          One page, reviewed monthly. Values matched from the KPI library are shown automatically; everything
          else is entered here.
        </p>

        <div className="mt-5 space-y-3">
          {COCKPIT_LAYERS.map((layer, i) => (
            <div key={layer.key}>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground">{layer.label}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {layer.metrics.map((m) => {
                    const live = latestFor(m.kpiMatch);
                    return (
                      <div key={m.key} className="rounded-md border border-border bg-background p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                          {live && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              {live.text}
                            </span>
                          )}
                        </div>
                        <EntryField
                          sectionKey="cockpit"
                          itemKey={m.key}
                          rows={2}
                          canEdit={canEdit}
                          className="mt-2 text-sm"
                          placeholder={live ? `From KPIs: ${live.name}` : "Value / commentary"}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              {i < COCKPIT_LAYERS.length - 1 && (
                <div className="flex justify-center py-1 text-muted-foreground/60">
                  <ArrowDown className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold">Monthly Industrial Strategy Review</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Do not put the strategy on a shelf — review these every month.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MONTHLY_REVIEW.map((g) => (
            <div key={g.key} className="rounded-lg border border-border p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</div>
              <ul className="mt-2 space-y-1 text-sm">
                {g.items.map((i) => (
                  <li key={i} className="text-foreground/80">• {i}</li>
                ))}
              </ul>
              <EntryField
                sectionKey="monthly-review"
                itemKey={g.key}
                rows={2}
                canEdit={canEdit}
                className="mt-2 text-sm"
                placeholder="This month's read-out"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
