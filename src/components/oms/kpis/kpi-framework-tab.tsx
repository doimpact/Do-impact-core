import { KPI_CATEGORIES, KPI_LEVELS } from "@/lib/kpi-library";
import { CAUSAL_TREE, OEE_LOSS_TREE, OEE_NOTE, type TreeNode } from "@/lib/kpi-framework";

function Node({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div className={depth === 0 ? "" : "border-l border-neutral-200 pl-3 ml-1"}>
      <div className={depth === 0 ? "text-sm font-semibold text-neutral-900 py-0.5" : "text-sm text-neutral-700 py-0.5"}>
        {node.label}
      </div>
      {node.children?.map((c, i) => <Node key={i} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function KpiFrameworkTab() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold tracking-tight">SQDCPME categories</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Every KPI belongs to one category. Safety, Quality, Delivery, Cost, Productivity, Maintenance and Environment
          form the daily scorecard; the remaining categories cover cross-functional areas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {KPI_CATEGORIES.map((c) => (
            <div key={c.key} className="rounded border border-neutral-200 p-2.5">
              <div className="flex items-center gap-2">
                {c.letter && (
                  <span className="h-5 w-5 rounded bg-neutral-900 text-white text-[11px] font-bold grid place-items-center">{c.letter}</span>
                )}
                <span className="text-sm font-semibold">{c.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.blurb}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold tracking-tight">Hierarchy levels</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          A mature system connects strategic, tactical and operational metrics. Level 1 is what the board sees; level 5 is what the line sees.
        </p>
        <div className="mt-3 divide-y">
          {KPI_LEVELS.map((l) => (
            <div key={l.level} className="flex gap-3 py-2">
              <span className="h-5 w-8 flex-shrink-0 rounded bg-neutral-100 text-[11px] font-bold grid place-items-center">L{l.level}</span>
              <div>
                <div className="text-sm font-semibold">{l.name}</div>
                <div className="text-xs text-muted-foreground">{l.blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold tracking-tight">Causal chains</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Lagging results are driven by leading behaviours. Use these chains to pick the driver metric behind each result.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {CAUSAL_TREE.map((n, i) => <Node key={i} node={n} />)}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold tracking-tight">OEE loss tree</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{OEE_NOTE}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {OEE_LOSS_TREE.map((b) => (
            <div key={b.label} className="rounded border border-neutral-200 p-3">
              <div className="text-sm font-semibold">{b.label}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">{b.formula}</div>
              <ul className="mt-2 space-y-1">
                {b.losses.map((l) => (
                  <li key={l} className="text-xs text-neutral-700 flex gap-1.5">
                    <span className="text-neutral-300">•</span>{l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
