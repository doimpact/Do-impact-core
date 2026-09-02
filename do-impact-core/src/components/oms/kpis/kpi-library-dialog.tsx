import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles } from "lucide-react";
import {
  KPI_CATEGORIES, KPI_LEVELS, KPI_LIBRARY, KPI_ROLES,
  categoryLabel, type KpiLibraryEntry, type KpiRole,
} from "@/lib/kpi-library";
import { coreScorecard, scorecardForRole, suggestPillarId } from "@/lib/kpi-framework";

type Pillar = { id: string; key: string; name: string };

export function KpiLibraryDialog({
  open, onOpenChange, pillars, existingKeys, onAdopt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pillars: Pillar[];
  existingKeys: Set<string>;
  onAdopt: (items: { pillarId: string; libraryKey: string }[]) => Promise<unknown>;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [indicator, setIndicator] = useState("all");
  const [selected, setSelected] = useState<Record<string, string>>({}); // libraryKey -> pillarId
  const [saving, setSaving] = useState(false);

  const defaultPillar = pillars[0]?.id ?? "";

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return KPI_LIBRARY.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (level !== "all" && String(e.level) !== level) return false;
      if (indicator !== "all" && e.indicator !== indicator) return false;
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        (e.code ?? "").toLowerCase().includes(needle) ||
        e.definition.toLowerCase().includes(needle) ||
        e.group.toLowerCase().includes(needle)
      );
    });
  }, [q, category, level, indicator]);

  const grouped = useMemo(() => {
    const map = new Map<string, KpiLibraryEntry[]>();
    for (const e of filtered) {
      const k = `${e.category}||${e.group}`;
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const toggle = (e: KpiLibraryEntry, on: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (on) next[e.key] = suggestPillarId(e.category, pillars) ?? defaultPillar;
      else delete next[e.key];
      return next;
    });
  };

  const bulkSelect = (entries: KpiLibraryEntry[]) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const e of entries) {
        if (existingKeys.has(e.key)) continue;
        next[e.key] = suggestPillarId(e.category, pillars) ?? defaultPillar;
      }
      return next;
    });
  };

  const count = Object.keys(selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>KPI library — {KPI_LIBRARY.length} industrial manufacturing metrics</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search KPIs, codes or definitions" className="h-8 pl-7 text-xs" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs">
              <option value="all">All categories</option>
              {KPI_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.letter ? `${c.letter} · ${c.name}` : c.name}</option>)}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level" className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs">
              <option value="all">All levels</option>
              {KPI_LEVELS.map((l) => <option key={l.level} value={String(l.level)}>L{l.level} {l.name}</option>)}
            </select>
            <select value={indicator} onChange={(e) => setIndicator(e.target.value)} aria-label="Indicator" className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs">
              <option value="all">Leading + lagging</option>
              <option value="leading">Leading</option>
              <option value="lagging">Lagging</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Starter packs:</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkSelect(coreScorecard())}>
              Core scorecard
            </Button>
            {KPI_ROLES.map((r) => (
              <Button key={r.key} size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkSelect(scorecardForRole(r.key as KpiRole))}>
                {r.name}
              </Button>
            ))}
            {count > 0 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected({})}>Clear selection</Button>
            )}
          </div>

          <ScrollArea className="h-[420px] rounded-lg border border-neutral-200">
            <div className="divide-y">
              {grouped.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No KPIs match those filters.</div>
              )}
              {grouped.map(([key, entries]) => {
                const [cat, group] = key.split("||");
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between bg-neutral-50 px-3 py-1.5 sticky top-0">
                      <div className="text-xs font-semibold text-neutral-700">
                        {categoryLabel(cat)} · {group}
                      </div>
                      <button className="text-xs text-neutral-500 hover:text-neutral-900" onClick={() => bulkSelect(entries)}>
                        Select all ({entries.length})
                      </button>
                    </div>
                    {entries.map((e) => {
                      const already = existingKeys.has(e.key);
                      const checked = !!selected[e.key];
                      return (
                        <div key={e.key} className={"flex items-start gap-3 px-3 py-2 " + (already ? "opacity-50" : "")}>
                          <Checkbox
                            className="mt-1"
                            disabled={already}
                            checked={checked}
                            onCheckedChange={(v) => toggle(e, v === true)}
                            aria-label={`Select ${e.name}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{e.name}</span>
                              {e.code && <Badge variant="outline" className="text-[10px]">{e.code}</Badge>}
                              <Badge variant="secondary" className="text-[10px]">L{e.level}</Badge>
                              <Badge variant="outline" className="text-[10px]">{e.indicator}</Badge>
                              {already && <span className="text-[10px] text-neutral-500">already added</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{e.definition}</div>
                            {e.formula && <div className="text-[11px] text-neutral-500 mt-0.5">Formula: {e.formula}</div>}
                          </div>
                          {checked && (
                            <select
                              value={selected[e.key]}
                              onChange={(ev) => setSelected((p) => ({ ...p, [e.key]: ev.target.value }))}
                              aria-label={`Pillar for ${e.name}`}
                              className="h-7 rounded border border-neutral-200 bg-white px-1.5 text-xs"
                            >
                              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Button
            className="w-full"
            disabled={count === 0 || saving || pillars.length === 0}
            onClick={async () => {
              setSaving(true);
              try {
                await onAdopt(Object.entries(selected).map(([libraryKey, pillarId]) => ({ libraryKey, pillarId })));
                setSelected({});
                onOpenChange(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {pillars.length === 0 ? "Create a pillar first" : `Add ${count} KPI${count === 1 ? "" : "s"} to my scorecard`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
