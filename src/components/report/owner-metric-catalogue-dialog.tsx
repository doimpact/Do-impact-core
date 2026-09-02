import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Plus } from "lucide-react";
import { OWNER_SECTIONS, type OwnerSectionId, type TileUnit } from "@/lib/owner-dashboard";
import {
  OWNER_METRICS,
  OWNER_PACKS,
  OWNER_SOURCES,
  metricsForPack,
  type OwnerCustomMetric,
  type OwnerMetricDef,
  type OwnerMetricSource,
} from "@/lib/owner-metric-catalogue";

const SOURCE_LABEL: Record<OwnerMetricSource, string> = {
  auto: "Auto",
  kpi: "KPI library",
  manual: "Manual entry",
};

const UNITS: { id: TileUnit; label: string }[] = [
  { id: "money", label: "Money" },
  { id: "pct", label: "Percent" },
  { id: "num", label: "Number" },
  { id: "days", label: "Days" },
  { id: "x", label: "Multiple (x)" },
];

export function OwnerMetricCatalogueDialog({
  open,
  onOpenChange,
  selected,
  custom,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Metric ids currently on the board. */
  selected: string[];
  custom: OwnerCustomMetric[];
  onApply: (next: { selected: string[]; custom: OwnerCustomMetric[] }) => void;
}) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [draft, setDraft] = useState<string[]>(selected);
  const [draftCustom, setDraftCustom] = useState<OwnerCustomMetric[]>(custom);
  const [creating, setCreating] = useState(false);
  const [newMetric, setNewMetric] = useState<OwnerCustomMetric>({
    id: "",
    label: "",
    section: "financial",
    unit: "num",
    higherIsBetter: true,
    target: null,
  });

  // Re-sync when the dialog is reopened with a different template.
  const key = `${selected.join(",")}|${custom.map((c) => c.id).join(",")}`;
  const [syncKey, setSyncKey] = useState(key);
  if (open && syncKey !== key) {
    setSyncKey(key);
    setDraft(selected);
    setDraftCustom(custom);
  }

  const all: OwnerMetricDef[] = useMemo(
    () => [
      ...OWNER_METRICS,
      ...draftCustom.map<OwnerMetricDef>((c) => ({
        id: c.id,
        section: c.section,
        label: c.label,
        definition: c.definition || "Your own metric, entered with the monthly financials.",
        unit: c.unit,
        higherIsBetter: c.higherIsBetter,
        source: "manual",
        defaultTarget: c.target ?? null,
        packs: [],
      })),
    ],
    [draftCustom],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((m) => {
      if (section !== "all" && m.section !== section) return false;
      if (source !== "all" && m.source !== source) return false;
      if (!needle) return true;
      return m.label.toLowerCase().includes(needle) || m.definition.toLowerCase().includes(needle);
    });
  }, [all, q, section, source]);

  const grouped = useMemo(() => {
    const map = new Map<OwnerSectionId, OwnerMetricDef[]>();
    for (const m of filtered) {
      const arr = map.get(m.section) ?? [];
      arr.push(m);
      map.set(m.section, arr);
    }
    return OWNER_SECTIONS.filter((s) => map.has(s.id)).map((s) => ({ meta: s, items: map.get(s.id)! }));
  }, [filtered]);

  const toggle = (id: string, on: boolean) =>
    setDraft((prev) => (on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));

  const addMany = (ids: string[]) => setDraft((prev) => Array.from(new Set([...prev, ...ids])));

  function createCustom() {
    const label = newMetric.label.trim();
    if (!label) return;
    const id = `custom.${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    if (!id.replace("custom.", "")) return;
    const metric: OwnerCustomMetric = { ...newMetric, id, label };
    setDraftCustom((prev) => [...prev.filter((m) => m.id !== id), metric]);
    setDraft((prev) => Array.from(new Set([...prev, id])));
    setNewMetric({ id: "", label: "", section: "financial", unit: "num", higherIsBetter: true, target: null });
    setCreating(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Owner metric catalogue — {OWNER_METRICS.length} metrics to choose from</DialogTitle>
          <DialogDescription>
            Pick the metrics that build your board. Auto metrics calculate themselves, KPI metrics read the KPIs page,
            manual metrics you type in with the monthly financials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search metrics or definitions"
                className="h-8 pl-7 text-xs"
              />
            </div>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              aria-label="Section"
              className="h-8 rounded border border-border bg-background px-2 text-xs"
            >
              <option value="all">All sections</option>
              {OWNER_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              aria-label="Source"
              className="h-8 rounded border border-border bg-background px-2 text-xs"
            >
              <option value="all">All sources</option>
              {OWNER_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Sparkles className="size-3.5" /> Starter packs:
            </span>
            {OWNER_PACKS.map((p) => (
              <Button key={p.id} size="sm" variant="outline" className="h-7 text-xs" onClick={() => addMany(metricsForPack(p.id))}>
                {p.name}
              </Button>
            ))}
            {draft.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDraft([])}>
                Clear board
              </Button>
            )}
          </div>

          <ScrollArea className="h-[420px] rounded-lg border border-border">
            <div className="divide-y divide-border">
              {grouped.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No metrics match those filters.</div>
              )}
              {grouped.map(({ meta, items }) => (
                <div key={meta.id}>
                  <div className="sticky top-0 flex items-center justify-between bg-muted/60 px-3 py-1.5 backdrop-blur">
                    <div className="text-xs font-semibold">
                      {meta.label} <span className="font-normal text-muted-foreground">· {meta.question}</span>
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => addMany(items.map((i) => i.id))}
                    >
                      Select all ({items.length})
                    </button>
                  </div>
                  {items.map((m) => {
                    const on = draft.includes(m.id);
                    return (
                      <label key={m.id} className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-muted/30">
                        <Checkbox className="mt-1" checked={on} onCheckedChange={(v) => toggle(m.id, v === true)} aria-label={`Select ${m.label}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{m.label}</span>
                            <Badge variant="outline" className="text-[10px]">{SOURCE_LABEL[m.source]}</Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {m.unit === "pct" ? "%" : m.unit === "money" ? "$" : m.unit}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {m.higherIsBetter ? "higher is better" : "lower is better"}
                            </span>
                            {m.id.startsWith("custom.") && <Badge className="text-[10px]">custom</Badge>}
                            {on && <span className="text-[10px] text-primary">on board</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.definition}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Create your own */}
          {creating ? (
            <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-5">
              <Input
                className="h-8 text-xs sm:col-span-2"
                placeholder="Metric name"
                value={newMetric.label}
                onChange={(e) => setNewMetric((m) => ({ ...m, label: e.target.value }))}
              />
              <select
                className="h-8 rounded border border-border bg-background px-2 text-xs"
                value={newMetric.section}
                aria-label="Section for the new metric"
                onChange={(e) => setNewMetric((m) => ({ ...m, section: e.target.value as OwnerSectionId }))}
              >
                {OWNER_SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <select
                className="h-8 rounded border border-border bg-background px-2 text-xs"
                value={newMetric.unit}
                aria-label="Unit for the new metric"
                onChange={(e) => setNewMetric((m) => ({ ...m, unit: e.target.value as TileUnit }))}
              >
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
              <select
                className="h-8 rounded border border-border bg-background px-2 text-xs"
                value={newMetric.higherIsBetter ? "up" : "down"}
                aria-label="Direction for the new metric"
                onChange={(e) => setNewMetric((m) => ({ ...m, higherIsBetter: e.target.value === "up" }))}
              >
                <option value="up">Higher is better</option>
                <option value="down">Lower is better</option>
              </select>
              <Input
                className="h-8 text-xs"
                type="number"
                placeholder="Target (optional)"
                value={newMetric.target ?? ""}
                onChange={(e) => setNewMetric((m) => ({ ...m, target: e.target.value === "" ? null : Number(e.target.value) }))}
              />
              <div className="flex items-center gap-2 sm:col-span-4">
                <Button size="sm" className="h-8 text-xs" onClick={createCustom} disabled={!newMetric.label.trim()}>
                  Add metric
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-3.5" /> Create your own metric
            </Button>
          )}

          <Button
            className="w-full"
            onClick={() => {
              const used = new Set(draft);
              onApply({ selected: draft, custom: draftCustom.filter((c) => used.has(c.id)) });
              onOpenChange(false);
            }}
          >
            Build board with {draft.length} metric{draft.length === 1 ? "" : "s"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
