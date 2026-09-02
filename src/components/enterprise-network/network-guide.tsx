import type { ReactNode } from "react";
import { LAYERS, LINK_TYPES, HEALTH_COLORS } from "@/lib/enterprise-network";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Swatch({ color, dash }: { color: string; dash?: string | undefined }) {
  if (dash === undefined) return <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />;
  return (
    <svg width={34} height={8} className="shrink-0">
      <line x1={0} y1={4} x2={34} y2={4} stroke={color} strokeWidth={2.5} strokeDasharray={dash} />
    </svg>
  );
}

const LAYER_USE: Record<string, string> = {
  strategy: "The outcome the business has committed to — margin, on-time delivery, a new programme.",
  capability: "What the business must be good at to hit those objectives — machining, planning, supplier development.",
  value_stream: "The end-to-end flow that actually produces value for a customer.",
  function: "The team or department that runs part of the flow — procurement, scheduling, quality, finance.",
  decision: "A recurring decision point: who commits the schedule, who approves the spend, who releases the design.",
  resource: "The thing everything leans on — a supplier, a furnace, a skill pool, a licence.",
  kpi: "A measured outcome you already track elsewhere in the app, pulled in so cause and effect sit side by side.",
};

/** Static explainer for reading and using the enterprise network model. */
export function NetworkGuide() {
  return (
    <div className="space-y-4">
      <Block title="What this map is">
        <p className="text-muted-foreground">
          One picture of how the business actually works — objectives, capabilities, value streams, functions,
          decisions, resources and KPIs, plus the dependencies that connect them. It is deliberately not an org chart:
          it shows what depends on what, not who reports to whom. Most surprises in a plant come from a dependency
          nobody had drawn.
        </p>
      </Block>

      <Block title="Reading a node">
        <div className="grid gap-3 md:grid-cols-2">
          {LAYERS.map((l) => (
            <div key={l.key} className="flex items-start gap-2">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: l.ring }} />
              <div>
                <div className="font-medium">{l.label}</div>
                <div className="text-xs text-muted-foreground">{LAYER_USE[l.key]}</div>
              </div>
            </div>
          ))}
        </div>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Circle size = criticality (1–5).</span> How much of the
            business leans on that node. Big circles are where fragility hurts most.
          </li>
          <li>
            <span className="font-medium text-foreground">Health colour</span> shows the current state you set on the
            node:{" "}
            {Object.keys(HEALTH_COLORS).map((k, i) => (
              <span key={k}>
                {i > 0 ? ", " : ""}
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: HEALTH_COLORS[k] }} />
                  {k}
                </span>
              </span>
            ))}
            .
          </li>
          <li>
            <span className="font-medium text-foreground">Where nodes come from.</span> “Build from live data” seeds the
            model from your objectives, KPIs, value streams, functions and equipment. Anything missing you add by hand
            with “+ Node”, then drag it into place.
          </li>
        </ul>
      </Block>

      <Block title="Reading a link — which way do arrows point?">
        <p>
          An arrow runs <span className="font-medium">from the thing that is depended upon → to the thing that depends
          on it</span>. In other words, it points in the direction the effect travels. If the heat-treat furnace stops,
          the effect flows downstream:
        </p>
        <svg viewBox="0 0 620 70" className="w-full max-w-[620px]" role="img" aria-label="Furnace flows to treatments flows to on-time delivery">
          <defs>
            <marker id="en-guide-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="#059669" />
            </marker>
          </defs>
          {[
            { x: 10, label: "Furnace", color: "#e11d48" },
            { x: 230, label: "Treatments", color: "#0891b2" },
            { x: 450, label: "On-time delivery", color: "#2563eb" },
          ].map((n) => (
            <g key={n.label}>
              <rect x={n.x} y={18} width={160} height={34} rx={17} fill="none" stroke={n.color} strokeWidth={2} />
              <text x={n.x + 80} y={40} textAnchor="middle" fontSize={13} fill="currentColor">
                {n.label}
              </text>
            </g>
          ))}
          <line x1={175} y1={35} x2={222} y2={35} stroke="#059669" strokeWidth={2} markerEnd="url(#en-guide-arrow)" />
          <line x1={395} y1={35} x2={442} y2={35} stroke="#059669" strokeWidth={2} markerEnd="url(#en-guide-arrow)" />
        </svg>
        <p className="text-muted-foreground">
          Read it as “treatments depend on the furnace”. Follow arrows forward to answer “what breaks if this slips?”;
          follow them backward to answer “what has to work for this objective to land?”.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {LINK_TYPES.map((t) => (
            <div key={t.key} className="flex items-center gap-3 rounded-lg border p-2">
              <Swatch color={t.color} dash={t.dash ?? "none"} />
              <div>
                <span className="font-medium">{t.label}</span>{" "}
                <span className="text-xs text-muted-foreground">— {t.hint}</span>
              </div>
            </div>
          ))}
        </div>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Strength (0–1)</span> — how much of the downstream node's
            performance rides on this link. 1.0 means “if this fails, that fails”.
          </li>
          <li>
            <span className="font-medium text-foreground">Lag (weeks)</span> — how long before the effect shows up
            downstream. Long lags are why problems surface at the board meeting, not on the shop floor.
          </li>
          <li>
            <span className="font-medium text-foreground">Polarity S / O</span> — S means both move the same way (more
            of A, more of B); O means they move opposite (more of A, less of B).
          </li>
        </ul>
      </Block>

      <Block title="Reading each view">
        <ul className="space-y-2">
          <li>
            <span className="font-medium">Network map</span> — the full model. Click a node to inspect and edit it,
            drag to arrange, scroll to zoom. Set a focus node and a hop count to strip the picture down to one
            neighbourhood, or use “Path to…” to trace how two nodes are actually connected.
          </li>
          <li>
            <span className="font-medium">Layers</span> — the same model stacked strategy at the top down to resources
            at the bottom. Use it to check the thread is complete: a layer with almost no arrows crossing into it is a
            layer nobody is managing.
          </li>
          <li>
            <span className="font-medium">Dependency matrix</span> — every dependency as a grid cell.{" "}
            <span className="font-medium">Rows send, columns receive</span>: a filled cell at row A / column B means A
            → B. A dense row is a single point everything hangs off. An empty column is a node nothing depends on —
            either it is genuinely peripheral, or you have missed the links.
          </li>
          <li>
            <span className="font-medium">Ripple simulation</span> — shock one node by ±% and watch the effect spread
            along links, damped by strength and decay, delayed by lag. Output is which nodes move, by how much, and
            after how many weeks.
          </li>
          <li>
            <span className="font-medium">Insights</span> — computed structure: hubs (most connected), bottlenecks
            (high traffic, few alternatives), orphans (unconnected) and feedback loops.
          </li>
        </ul>
      </Block>

      <Block title="Turning the map into decisions">
        <div className="space-y-3">
          {[
            {
              q: "Where is the business fragile?",
              a: "Look for high criticality + many incoming arrows + no alternative path. That is a single point of failure: dual-source it, build buffer, or add a second capability.",
            },
            {
              q: "What breaks if this slips?",
              a: "Run a ripple from the node at a realistic shock (a supplier two weeks late, a machine at 70%). Read the lag column to know how much warning you actually get before the customer sees it.",
            },
            {
              q: "Where should the next improvement project go?",
              a: "Compare downstream reach per unit of effort. A small fix on a hub usually beats a large fix on a leaf.",
            },
            {
              q: "Is this objective actually supported?",
              a: "Trace paths backward from the objective. If nothing at capability or resource level feeds it, the objective has no delivery mechanism — it is a wish, not a plan.",
            },
            {
              q: "Why do the same problems keep coming back?",
              a: "Check the feedback loops in Insights. Reinforcing loops are your recurring firefights; balancing loops are the controls that already work — protect them.",
            },
            {
              q: "What should the board see?",
              a: "Two or three nodes: the one that carries the most, the one whose ripple reaches an objective fastest, and the one you are de-risking this quarter.",
            },
          ].map((r) => (
            <div key={r.q} className="rounded-lg border p-3">
              <div className="font-medium">{r.q}</div>
              <div className="mt-1 text-muted-foreground">{r.a}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Modelling habits that keep it useful">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Aim for 20–60 nodes. Beyond that the picture stops being a decision tool and becomes wallpaper.</li>
          <li>Name things exactly as the business names them, not as the system names them.</li>
          <li>Only draw a link if a real change in A would change B. Everything else is noise.</li>
          <li>Set strength honestly — inflated strengths make every ripple look catastrophic and nothing gets prioritised.</li>
          <li>Revisit after each board cycle: add what surprised you, delete what never mattered.</li>
        </ul>
      </Block>
    </div>
  );
}
