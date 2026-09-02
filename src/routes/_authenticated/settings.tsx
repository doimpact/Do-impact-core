import { createFileRoute } from "@tanstack/react-router";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PILLARS, SUB_NAV, OVERVIEW_CARDS, EXTRA_MODULES, COMPLIANCE_SECTIONS, type PillarKey } from "@/lib/nav-registry";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DO.Impact Core" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

function ToggleGrid({
  items,
  isEnabled,
  setEnabled,
}: {
  items: { key: string; label: string }[];
  isEnabled: (key: string) => boolean;
  setEnabled: (key: string, enabled: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <label
          key={it.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
        >
          <span className="truncate">{it.label}</span>
          <Switch checked={isEnabled(it.key)} onCheckedChange={(v) => setEnabled(it.key, v)} />
        </label>
      ))}
    </div>
  );
}

function SettingsPage() {
  const { isEnabled, setEnabled, setHiddenKeys } = useUserPreferences();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which modules are visible in your workspace. Data is kept when a module is hidden.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { setHiddenKeys([]); toast.success("All modules shown"); }}>
          Show everything
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview cards</h2>
        <ToggleGrid items={OVERVIEW_CARDS} isEnabled={isEnabled} setEnabled={setEnabled} />
      </section>

      {(Object.keys(SUB_NAV) as PillarKey[]).map((pk) => {
        const items = [
          ...SUB_NAV[pk].map((s) => ({ key: s.key, label: s.label })),
          ...(EXTRA_MODULES[pk] ?? []).map((s) => ({ key: s.key, label: s.label })),
        ];
        const pillar = PILLARS.find((p) => p.key === pk);
        return (
          <section key={pk} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {pillar?.label ?? pk}
            </h2>
            <ToggleGrid items={items} isEnabled={isEnabled} setEnabled={setEnabled} />
          </section>
        );
      })}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Compliance</h2>
        <ToggleGrid
          items={COMPLIANCE_SECTIONS.map((s) => ({ key: s.key, label: s.label }))}
          isEnabled={isEnabled}
          setEnabled={setEnabled}
        />
      </section>
    </div>
  );
}
