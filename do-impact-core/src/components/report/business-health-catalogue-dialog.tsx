import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Plus } from "lucide-react";
import type { TileUnit } from "@/lib/owner-dashboard";
import {
  BH_GROUPS,
  BH_METRICS,
  BH_PACKS,
  BH_SECTIONS,
  BH_SOURCES,
  bhMetricsForPack,
  type BhCustomMetric,
  type BhMetricDef,
  type BhMetricSource,
  type BhSectionId,
} from "@/lib/business-health-catalogue";

const SOURCE_LABEL: Record<BhMetricSource, string> = {
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

export function BusinessHealthCatalogueDialog({
  open,
  onOpenChange,
  selected,
  custom,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: string[];
  custom: BhCustomMetric[];
  onApply: (next: { selected: string[]; custom: BhCustomMetric[] }) => void;
}) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [draft, setDraft] = useState<string[]>(selected);
  const [draftCustom, setDraftCustom] = useState<BhCustomMetric[]>(custom);
  const [creating, setCreating] = useState(false);
  const [newMetric, setNewMetric] = useState<BhCustomMetric>({
    id: "",
    label: "",
    section: "financial",
    group: BH_GROUPS[0].id,
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

  const all: BhMetricDef[] = useMemo(
    () => [
      ...BH_METRICS,
      ...draftCustom.map<BhMetricDef>((c) => ({
        id: c.id,
        section: c.section,
        group: c.group,
        label: c.label,
        definition: c.definition || "Your own measure, entered with the monthly figures.",
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
    return all.filter((x) => {
      if (section !== "all" && x.section !== section) return false;
      if (source !== "all" && x.source !== source) return false;
      if (!needle) return true;
      return x.label.toLowerCase().includes(needle) || x.definition.toLowerCase().includes(needle);
    });
  }, [all, q, section, source]);

  const grouped = useMemo(() => {
    return BH_SECTIONS.map((s) => ({
      meta: s,
      groups: BH_GROUPS.filter((g) => g.section === s.id)
        .map((g) => ({ meta: g, items: filtered.filter((x) => x.group === g.id) }))
        .filter((g) => g.items.length > 0),
    })).filter((s) => s.groups.length > 0);
  }, [filtered]);

  const toggle = (id: string, on: boolean) =>
    setDraft((prev) => (on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));

  const addMany = (ids: string[]) => setDraft((prev) => Array.from(new Set([...prev, ...ids])));

  function createCustom() {
    const label = newMetric.label.trim();
    if (!label) return;
    const id = `bhcustom.${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    if (!id.replace("bhcustom.", "")) return;
    const metric: BhCustomMetric = { ...newMetric, id, label };
    setDraftCustom((prev) => [...prev.filter((x) => x.id !== id), metric]);
    setDraft((prev) => Array.from(new Set([...prev, id])));
    setNewMetric({ id: "", label: "", section: "financial", group: BH_GROUPS[0].id, unit: "num", higherIsBetter: true, target: null });
    setCreating(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Business health catalogue — {BH_METRICS.length} measures to choose from</DialogTitle>
          <DialogDescription>
            Build the review from the four pillars plus financial health. Auto measures calculate themselves, KPI
            measures read the KPIs page, manual measures you type in with the monthly figures.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search measures or definitions"
                className="h-8 pl-7 text-xs"
              />
            </div>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              aria-label="Pillar"
              className="h-8 rounded border border-border bg-background px-2 text-xs"
            >
              <option value="all">All pillars</option>
              {BH_SECTIONS.map((s) => (
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
              {BH_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Sparkles className="size-3.5" /> Starter packs:
            </span>
            {BH_PACKS.map((p) => (
              <Button key={p.id} size="sm" variant="outline" className="h-7 text-xs" onClick={() => addMany(bhMetricsForPack(p.id))}>
                {p.name}
              </Button>
            ))}
            {draft.length > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDraft([])}>
                Clear review
              </Button>
            )}
          </div>

          <ScrollArea className="h-[420px] rounded-lg border border-border">
            <div className="divide-y divide-border">
              {grouped.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No measures match those filters.</div>
              )}
              {grouped.map(({ meta, groups }) => (
                <div key={meta.id}>
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-muted/80 px-3 py-1.5 backdrop-blur">
                    <div className="text-xs font-semibold">
                      {meta.label} <span className="font-normal text-muted-foreground">· {meta.question}</span>
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => addMany(groups.flatMap((g) => g.items.map((i) => i.id)))}
                    >
                      Select all
                    </button>
                  </div>
                  {groups.map((g) => (
                    <div key={g.meta.id}>
                      <div className="flex items-center justify-between bg-muted/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <span>{g.meta.label}</span>
                        <button className="normal-case hover:text-foreground" onClick={() => addMany(g.items.map((i) => i.id))}>
                          Add {g.items.length}
                        </button>
                      </div>
                      {g.items.map((x) => {
                        const on = draft.includes(x.id);
                        return (
                          <label key={x.id} className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-muted/30">
                            <Checkbox className="mt-1" checked={on} onCheckedChange={(v) => toggle(x.id, v === true)} aria-label={`Select ${x.label}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{x.label}</span>
                                <Badge variant="outline" className="text-[10px]">{SOURCE_LABEL[x.source]}</Badge>
                                <Badge variant="secondary" className="text-[10px]">
                                  {x.unit === "pct" ? "%" : x.unit === "money" ? "$" : x.unit}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {x.higherIsBetter ? "higher is better" : "lower is better"}
                                </span>
                                {x.id.startsWith("bhcustom.") && <Badge className="text-[10px]">custom</Badge>}
                                {on && <span className="text-[10px] text-primary">in review</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">{x.definition}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>

          {creating ? (
            <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-5">
              <Input
                className="h-8 text-xs sm:col-span-2"
                placeholder="Measure name"
                value={newMetric.label}
                onChange={(e) => setNewMetric((x) => ({ ...x, label: e.target.value }))}
              />
              <select
                className="h-8 rounded border border-border bg-background px-2 text-xs sm:col-span-2"
                value={newMetric.group}
                aria-label="Section for the new measure"
                onChange={(e) => {
                  const g = BH_GROUPS.find((x) => x.id === e.target.value)!;
                  setNewMetric((x) => ({ ...x, group: g.id, section: g.section as BhSectionId }));
                }}
              >
                {BH_SECTIONS.map((s) => (
                  <optgroup key={s.id} label={s.label}>
                    {BH_GROUPS.filter((g) => g.section === s.id).map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                className="h-8 rounded border border-border bg-background px-2 text-xs"
                value={newMetric.unit}
                aria-label="Unit for the new measure"
                onChange={(e) => setNewMetric((x) => ({ ...x, unit: e.target.value as TileUnit }))}
              >
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
              <select
                className="h-8 rounded border border-border bg-background px-2 text-xs"
                value={newMetric.higherIsBetter ? "up" : "down"}
                aria-label="Direction for the new measure"
                onChange={(e) => setNewMetric((x) => ({ ...x, higherIsBetter: e.target.value === "up" }))}
              >
                <option value="up">Higher is better</option>
                <option value="down">Lower is better</option>
              </select>
              <Input
                className="h-8 text-xs"
                type="number"
                placeholder="Target (optional)"
                value={newMetric.target ?? ""}
                onChange={(e) => setNewMetric((x) => ({ ...x, target: e.target.value === "" ? null : Number(e.target.value) }))}
              />
              <div className="flex items-center gap-2 sm:col-span-3">
                <Button size="sm" className="h-8 text-xs" onClick={createCustom} disabled={!newMetric.label.trim()}>
                  Add measure
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCreating(true)}>
              <Plus className="mr-1.5 size-3.5" /> Create your own measure
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
            Build review with {draft.length} measure{draft.length === 1 ? "" : "s"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
