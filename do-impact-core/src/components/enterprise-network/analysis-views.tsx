import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  LAYER_ORDER,
  layerMeta,
  linkMeta,
  analyseCriticality,
  findClusters,
  findFeedbackLoops,
  findGaps,
  type EnLink,
  type EnNode,
} from "@/lib/enterprise-network";

/* ------------------------------------------------------------------ lanes */

/** Layered view: one lane per abstraction level, dependencies drawn between. */
export function LayerLanes({
  nodes,
  links,
  selectedId,
  onSelect,
}: {
  nodes: EnNode[];
  links: EnLink[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const lanes = LAYER_ORDER.map((layer) => ({
    layer,
    meta: layerMeta(layer),
    items: nodes.filter((n) => n.layer === layer),
  })).filter((l) => l.items.length);

  const degree = useMemo(() => {
    const d = new Map<string, number>();
    links.forEach((l) => {
      d.set(l.from_node, (d.get(l.from_node) ?? 0) + 1);
      d.set(l.to_node, (d.get(l.to_node) ?? 0) + 1);
    });
    return d;
  }, [links]);

  const related = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    links.forEach((l) => {
      if (l.from_node === selectedId) s.add(l.to_node);
      if (l.to_node === selectedId) s.add(l.from_node);
    });
    return s;
  }, [selectedId, links]);

  if (!lanes.length) return <Empty>Nothing to show in these lanes yet.</Empty>;

  return (
    <div className="space-y-3">
      {lanes.map((lane) => (
        <div key={lane.layer} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: lane.meta.ring }} />
            <h3 className="text-sm font-semibold">{lane.meta.label}</h3>
            <span className="text-xs text-muted-foreground">{lane.items.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {lane.items.map((n) => {
              const dim = related && !related.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => onSelect(n.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    selectedId === n.id ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"
                  } ${dim ? "opacity-35" : ""}`}
                  style={{ borderLeftColor: lane.meta.ring, borderLeftWidth: 4 }}
                >
                  <span className="font-medium">{n.label}</span>
                  <span className="ml-2 text-muted-foreground">{degree.get(n.id) ?? 0} links</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- matrix */

/** Dependency matrix — rows depend on columns. Colour = flow type, opacity = strength. */
export function DependencyMatrix({
  nodes,
  links,
  onSelect,
}: {
  nodes: EnNode[];
  links: EnLink[];
  onSelect: (id: string) => void;
}) {
  const ordered = useMemo(
    () => [...nodes].sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer) || a.label.localeCompare(b.label)),
    [nodes],
  );
  const cell = useMemo(() => {
    const m = new Map<string, EnLink>();
    links.forEach((l) => m.set(`${l.from_node}|${l.to_node}`, l));
    return m;
  }, [links]);

  if (!ordered.length) return <Empty>No nodes match the current filters.</Empty>;

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-[11px] text-muted-foreground">
        Rows depend on columns · scroll sideways to see every column
      </p>
      <div className="overflow-auto">
        <table className="border-separate border-spacing-0 text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-56 min-w-56 bg-card p-1 text-left align-bottom font-medium text-muted-foreground">
                From ↓ / To →
              </th>
              {ordered.map((c) => (
                <th key={c.id} className="relative h-44 w-7 min-w-7 p-0 align-bottom" title={c.label}>
                  <div
                    className="absolute bottom-1 overflow-hidden whitespace-nowrap text-left font-medium text-muted-foreground"
                    style={{
                      left: "50%",
                      marginLeft: 7,
                      width: 168,
                      transform: "rotate(-90deg)",
                      transformOrigin: "left bottom",
                    }}
                  >
                    {c.label}
                  </div>
                </th>
              ))}

            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={r.id}>
                <th
                  className="sticky left-0 z-10 w-56 min-w-56 max-w-56 cursor-pointer truncate bg-card p-1 text-left font-medium hover:underline"
                  onClick={() => onSelect(r.id)}
                  title={r.label}
                  style={{ borderLeft: `3px solid ${layerMeta(r.layer).ring}` }}
                >
                  {r.label}
                </th>
                {ordered.map((c) => {
                  const l = r.id === c.id ? null : cell.get(`${r.id}|${c.id}`);
                  return (
                    <td key={c.id} className="h-7 w-7 border border-border/40 p-0">
                      {l && (
                        <div
                          title={`${r.label} → ${c.label} · ${linkMeta(l.link_type).label} · strength ${l.strength.toFixed(2)} · lag ${l.lag_weeks}w`}
                          className="h-full w-full"
                          style={{ backgroundColor: linkMeta(l.link_type).color, opacity: 0.25 + l.strength * 0.75 }}
                        />
                      )}
                      {r.id === c.id && <div className="h-full w-full bg-muted" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* --------------------------------------------------------------- insights */

export function InsightsPanel({
  nodes,
  links,
  onSelect,
}: {
  nodes: EnNode[];
  links: EnLink[];
  onSelect: (id: string) => void;
}) {
  const criticality = useMemo(() => analyseCriticality(nodes, links).slice(0, 8), [nodes, links]);
  const loops = useMemo(() => findFeedbackLoops(nodes, links).slice(0, 8), [nodes, links]);
  const clusters = useMemo(() => findClusters(nodes, links), [nodes, links]);
  const gaps = useMemo(() => findGaps(nodes, links).slice(0, 12), [nodes, links]);
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? "?";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Critical nodes" hint="Where most dependency paths run through — fail here and the business feels it everywhere.">
        {criticality.length === 0 ? (
          <Empty>Add dependencies to rank criticality.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {criticality.map((c) => (
              <li key={c.nodeId}>
                <button onClick={() => onSelect(c.nodeId)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-muted">
                  <span className="w-9 text-right text-xs font-semibold tabular-nums">{c.score}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded bg-muted">
                    <span className="block h-full rounded" style={{ width: `${c.score}%`, backgroundColor: layerMeta(c.layer).ring }} />
                  </span>
                  <span className="w-1/2 truncate">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.reach} downstream</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Feedback loops" hint="Reinforcing loops accelerate; balancing loops push back and cause the plan to oscillate.">
        {loops.length === 0 ? (
          <Empty>No closed loop yet — the model is still a chain, not a system.</Empty>
        ) : (
          <ul className="space-y-2">
            {loops.map((l, i) => (
              <li key={l.key} className="rounded-lg border border-border p-2">
                <Badge className={l.type === "R" ? "bg-rose-600 text-white" : "bg-sky-600 text-white"}>
                  {l.type}
                  {i + 1} — {l.type === "R" ? "Reinforcing" : "Balancing"}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">{l.nodes.map(label).join(" → ")} →</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Silos" hint="Groups with no dependency path between them — organisational islands.">
        {clusters.length <= 1 ? (
          <p className="text-sm text-muted-foreground">The model is one connected system — no isolated groups.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {clusters.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums">{c.nodeIds.length}</span>
                <span className="truncate">{c.label}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Structural gaps" hint="Missing owners, unmeasured value streams and decision rights nobody holds.">
        {gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No structural gaps found.</p>
        ) : (
          <ul className="space-y-1.5">
            {gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    g.severity === "high"
                      ? "bg-destructive/15 text-destructive"
                      : g.severity === "medium"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {g.kind}
                </span>
                <button className="flex-1 text-left hover:underline" onClick={() => g.nodeId && onSelect(g.nodeId)}>
                  {g.message}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{hint}</p>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="p-4 text-sm text-muted-foreground">{children}</p>;
}
