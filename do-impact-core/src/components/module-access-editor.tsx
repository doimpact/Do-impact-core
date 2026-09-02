import { OVERVIEW_CARDS, PILLARS, SUB_NAV, type PillarKey } from "@/lib/nav-registry";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export function allModuleKeys(): string[] {
  const keys: string[] = [];
  for (const p of PILLARS) {
    keys.push(p.navKey);
    for (const s of SUB_NAV[p.key]) keys.push(s.key);
  }
  for (const c of OVERVIEW_CARDS) keys.push(c.key);
  return keys;
}


/**
 * Edits the module grant list for one membership.
 * `value === null` means "all modules".
 */
export function ModuleAccessEditor({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (next: string[] | null) => void;
}) {
  const all = value === null;
  const selected = new Set(value ?? allModuleKeys());

  const toggle = (key: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(key);
    else next.delete(key);
    onChange(Array.from(next));
  };

  const togglePillar = (pk: PillarKey, on: boolean) => {
    const keys = [PILLARS.find((p) => p.key === pk)!.navKey, ...SUB_NAV[pk].map((s) => s.key)];
    const next = new Set(selected);
    for (const k of keys) {
      if (on) next.add(k);
      else next.delete(k);
    }
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3">
        <span className="text-sm">
          {all ? "Full access to every module" : `${selected.size} module(s) granted`}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={all ? "default" : "outline"} onClick={() => onChange(null)}>
            Grant all
          </Button>
          <Button size="sm" variant="outline" onClick={() => onChange([])}>
            Clear all
          </Button>
        </div>
      </div>

      <div className={all ? "pointer-events-none opacity-50" : ""}>
        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const subs = SUB_NAV[p.key];
            const pillarOn = selected.has(p.navKey);
            return (
              <div key={p.key} className="rounded-md border border-border p-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <Checkbox
                    checked={pillarOn}
                    onCheckedChange={(v) => togglePillar(p.key, v === true)}
                  />
                  {p.label}
                </label>
                {subs.length > 0 && (
                  <div className="mt-2 space-y-1 pl-6">
                    {subs.map((s) => (
                      <label key={s.key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.has(s.key)}
                          onCheckedChange={(v) => toggle(s.key, v === true)}
                        />
                        <span className="text-muted-foreground">{s.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-md border border-border p-3">
            <p className="text-sm font-semibold">Reporting, meetings &amp; add-ons</p>
            <div className="mt-2 space-y-1 pl-1">
              {OVERVIEW_CARDS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.has(c.key)}
                    onCheckedChange={(v) => toggle(c.key, v === true)}
                  />
                  <span className="text-muted-foreground">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

