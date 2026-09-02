import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Getting started — DO.Impact Core" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Getting started</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          DO.Impact Core — open-source edition.
        </p>
      </div>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Explore the sample company</h2>
        <p className="text-sm text-muted-foreground">
          The TitanScale Template workspace is pre-loaded with realistic data across
          every module — strategy trees, KPIs, SIOP, skills matrices, and more. Use it
          to learn how the pieces connect, then create your own workspace from the
          company switcher in the top bar.
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Find anything</h2>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="rounded border border-border px-1 text-xs">⌘K</kbd> (or
          the search button in the header) to search every page and help topic.
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Shop-floor kiosk</h2>
        <p className="text-sm text-muted-foreground">
          The <code>/floor</code> view is a minimal, touch-friendly screen for
          operators — raise andon alerts, log downtime, and see today's plan.
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Documentation & license</h2>
        <p className="text-sm text-muted-foreground">
          See <code>README.md</code> for setup details. This edition is licensed under
          AGPL-3.0 — see <code>LICENSE</code>. The hosted product with accounts,
          billing, and the AI Exec Team Room lives at{" "}
          <a href="https://www.doimpact.app" className="text-primary underline">doimpact.app</a>.
        </p>
      </section>
    </div>
  );
}
