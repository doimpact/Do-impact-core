import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { KPI_CATEGORIES, KPI_LEVELS } from "@/lib/kpi-library";
import { EMPTY_FILTERS, type GroupBy, type KpiFilters } from "./kpi-types";
import { ownerLabel, type LiteProfile } from "@/components/owner-select";

const FREQUENCIES = ["shift", "daily", "weekly", "monthly", "quarterly", "annual"];

function Picker({
  value, onChange, options, label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-700"
    >
      <option value="all">{label}: All</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function KpiFilterBar({
  filters, onChange, groupBy, onGroupBy, pillars, people, resultCount,
}: {
  filters: KpiFilters;
  onChange: (f: KpiFilters) => void;
  groupBy: GroupBy;
  onGroupBy: (g: GroupBy) => void;
  pillars: { id: string; name: string }[];
  people: LiteProfile[];
  resultCount: number;
}) {
  const set = (patch: Partial<KpiFilters>) => onChange({ ...filters, ...patch });

  const chips: { key: keyof KpiFilters; label: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.category !== "all") chips.push({ key: "category", label: KPI_CATEGORIES.find((c) => c.key === filters.category)?.name ?? filters.category });
  if (filters.level !== "all") chips.push({ key: "level", label: `Level ${filters.level}` });
  if (filters.indicator !== "all") chips.push({ key: "indicator", label: filters.indicator === "leading" ? "Leading" : "Lagging" });
  if (filters.pillar !== "all") chips.push({ key: "pillar", label: pillars.find((p) => p.id === filters.pillar)?.name ?? "Pillar" });
  if (filters.owner !== "all") chips.push({ key: "owner", label: filters.owner === "none" ? "Unassigned owner" : ownerLabel(people.find((p) => p.id === filters.owner)) });
  if (filters.frequency !== "all") chips.push({ key: "frequency", label: filters.frequency });
  if (filters.status !== "all") chips.push({ key: "status", label: filters.status === "on" ? "On track" : filters.status === "off" ? "Off target" : "No data" });

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search name, code or definition"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Picker label="Category" value={filters.category} onChange={(v) => set({ category: v })}
          options={KPI_CATEGORIES.map((c) => ({ value: c.key, label: c.letter ? `${c.letter} · ${c.name}` : c.name }))} />
        <Picker label="Level" value={filters.level} onChange={(v) => set({ level: v })}
          options={KPI_LEVELS.map((l) => ({ value: String(l.level), label: `L${l.level} ${l.name}` }))} />
        <Picker label="Indicator" value={filters.indicator} onChange={(v) => set({ indicator: v })}
          options={[{ value: "leading", label: "Leading" }, { value: "lagging", label: "Lagging" }]} />
        <Picker label="Pillar" value={filters.pillar} onChange={(v) => set({ pillar: v })}
          options={pillars.map((p) => ({ value: p.id, label: p.name }))} />
        <Picker label="Owner" value={filters.owner} onChange={(v) => set({ owner: v })}
          options={[{ value: "none", label: "Unassigned" }, ...people.map((p) => ({ value: p.id, label: ownerLabel(p) }))]} />
        <Picker label="Frequency" value={filters.frequency} onChange={(v) => set({ frequency: v })}
          options={FREQUENCIES.map((f) => ({ value: f, label: f }))} />
        <Picker label="Status" value={filters.status} onChange={(v) => set({ status: v })}
          options={[{ value: "on", label: "On track" }, { value: "off", label: "Off target" }, { value: "none", label: "No data" }]} />
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-muted-foreground">Group by</span>
          <select
            value={groupBy}
            onChange={(e) => onGroupBy(e.target.value as GroupBy)}
            aria-label="Group by"
            className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs"
          >
            <option value="pillar">Pillar</option>
            <option value="category">Category</option>
            <option value="level">Hierarchy level</option>
            <option value="indicator">Leading / lagging</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-100">
          <span className="text-xs text-muted-foreground">{resultCount} match{resultCount === 1 ? "" : "es"}</span>
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => set({ [c.key]: c.key === "q" ? "" : "all" } as Partial<KpiFilters>)}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-200"
            >
              {c.label} <X className="h-3 w-3" />
            </button>
          ))}
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange({ ...EMPTY_FILTERS })}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
