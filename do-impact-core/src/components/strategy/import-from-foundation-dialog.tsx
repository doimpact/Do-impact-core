import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";

type Kind = "long_term" | "annual" | "priority" | "kpi";
type Theme = { id: string; title: string; description: string | null; archived_at: string | null };
type Objective = {
  id: string;
  title: string;
  description: string | null;
  target_metric: string | null;
  horizon_year: number | null;
  owner_id: string | null;
  archived_at: string | null;
};
type KpiRow = {
  id: string;
  name: string;
  unit: string | null;
  target: number | null;
  description: string | null;
  pillars: { name: string } | null;
};

const KIND_LABEL: Record<Kind, string> = {
  long_term: "Long-term",
  annual: "Annual",
  priority: "Priority",
  kpi: "KPI",
};

type Source = "theme" | "objective" | "kpi";

export function ImportFromFoundationDialog({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, { kind: Kind; source: Source; ref: Theme | Objective | KpiRow }>>({});

  const themesQ = useQuery({
    queryKey: ["foundation-themes"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_themes")
        .select("id, title, description, archived_at")
        .is("archived_at", null)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Theme[];
    },
  });
  const objectivesQ = useQuery({
    queryKey: ["foundation-objectives"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_objectives")
        .select("id, title, description, target_metric, horizon_year, owner_id, archived_at")
        .is("archived_at", null)
        .order("horizon_year");
      if (error) throw error;
      return (data ?? []) as Objective[];
    },
  });
  const kpisQ = useQuery({
    queryKey: ["foundation-kpis"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kpis")
        .select("id, name, unit, target, description, pillars(name)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as KpiRow[];
    },
  });

  const objectivesByYear = useMemo(() => {
    const g = new Map<number, Objective[]>();
    for (const o of objectivesQ.data ?? []) {
      const y = o.horizon_year ?? 0;
      if (!g.has(y)) g.set(y, []);
      g.get(y)!.push(o);
    }
    return Array.from(g.entries()).sort((a, b) => a[0] - b[0]);
  }, [objectivesQ.data]);

  function defaultKind(source: Source, horizon?: number | null): Kind {
    if (source === "kpi") return "kpi";
    if (source === "theme") return "long_term";
    if (horizon && horizon >= 3) return "long_term";
    if (horizon === 1) return "priority";
    return "annual";
  }

  function toggle(key: string, source: Source, ref: Theme | Objective | KpiRow, horizon?: number | null) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { kind: defaultKind(source, horizon), source, ref };
      return next;
    });
  }

  function changeKind(key: string, kind: Kind) {
    setSelected((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], kind } } : prev));
  }

  const importMut = useMutation({
    mutationFn: async () => {
      const entries = Object.values(selected);
      if (!entries.length) throw new Error("Select at least one item to import");
      const rows = entries.map((e, i) => {
        if (e.source === "kpi") {
          const k = e.ref as KpiRow;
          return {
            kind: e.kind,
            title: k.name,
            description: k.description ?? (k.pillars?.name ? `Pillar: ${k.pillars.name}` : null),
            owner_id: null,
            target_value: k.target != null ? `${k.target}${k.unit ? ` ${k.unit}` : ""}` : null,
            current_value: null,
            horizon: null,
            sort_order: i,
          };
        }
        const isObj = e.source === "objective";
        const ref = e.ref as Objective;
        const t = e.ref as Theme | Objective;
        return {
          kind: e.kind,
          title: t.title,
          description: t.description ?? null,
          owner_id: isObj ? ref.owner_id ?? null : null,
          target_value: isObj ? ref.target_metric ?? null : null,
          current_value: null,
          horizon: isObj && ref.horizon_year ? `Year ${ref.horizon_year}` : null,
          sort_order: i,
        };
      });
      const { error } = await supabase.from("hoshin_items").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`Imported ${n} item${n === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["hoshin_items"] });
      setSelected({});
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const themes = themesQ.data ?? [];
  const count = Object.keys(selected).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Strategy Foundation</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground">
            Pick strategic themes and 3-year objectives to bring into the X-matrix. Adjust the target quadrant for each.
          </p>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Strategic themes
            </h3>
            {themes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No themes in Foundation.</p>
            ) : (
              <ul className="space-y-1">
                {themes.map((t) => {
                  const key = `t:${t.id}`;
                  const sel = selected[key];
                  return (
                    <li key={t.id} className="flex items-center gap-2 rounded border border-border p-2">
                      <input
                        type="checkbox"
                        checked={!!sel}
                        onChange={() => toggle(key, "theme", t)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.title}</div>
                        {t.description && (
                          <div className="truncate text-xs text-muted-foreground">{t.description}</div>
                        )}
                      </div>
                      {sel && <KindPicker value={sel.kind} onChange={(k) => changeKind(key, k)} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3-year objectives
            </h3>
            {objectivesByYear.length === 0 ? (
              <p className="text-xs text-muted-foreground">No objectives in Foundation.</p>
            ) : (
              objectivesByYear.map(([year, objs]) => (
                <div key={year} className="mb-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    {year ? `Year ${year}` : "No horizon"}
                  </div>
                  <ul className="space-y-1">
                    {objs.map((o) => {
                      const key = `o:${o.id}`;
                      const sel = selected[key];
                      return (
                        <li key={o.id} className="flex items-center gap-2 rounded border border-border p-2">
                          <input
                            type="checkbox"
                            checked={!!sel}
                            onChange={() => toggle(key, "objective", o, o.horizon_year)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{o.title}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {o.target_metric ?? o.description ?? "—"}
                            </div>
                          </div>
                          {sel && <KindPicker value={sel.kind} onChange={(k) => changeKind(key, k)} />}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Operations KPIs
            </h3>
            {(kpisQ.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No KPIs defined in Operations.</p>
            ) : (
              <ul className="space-y-1">
                {(kpisQ.data ?? []).map((k) => {
                  const key = `k:${k.id}`;
                  const sel = selected[key];
                  return (
                    <li key={k.id} className="flex items-center gap-2 rounded border border-border p-2">
                      <input
                        type="checkbox"
                        checked={!!sel}
                        onChange={() => toggle(key, "kpi", k)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{k.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {k.pillars?.name ? `${k.pillars.name} · ` : ""}
                          {k.target != null ? `Target ${k.target}${k.unit ? ` ${k.unit}` : ""}` : "No target"}
                        </div>
                      </div>
                      {sel && <KindPicker value={sel.kind} onChange={(kd) => changeKind(key, kd)} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => importMut.mutate()} disabled={!count || importMut.isPending}>
            <Download className="mr-1 h-4 w-4" />
            Import {count ? `(${count})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KindPicker({ value, onChange }: { value: Kind; onChange: (k: Kind) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Kind)}>
      <SelectTrigger className="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
          <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
