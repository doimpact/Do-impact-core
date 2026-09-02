import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Archive, ArchiveRestore, MoreHorizontal, Network, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ExecRoomLocked } from "@/components/exec-room/ExecRoomChat";


import { NetworkMap } from "@/components/enterprise-network/network-map";
import { DependencyMatrix, InsightsPanel, LayerLanes } from "@/components/enterprise-network/analysis-views";
import { NodeInspector } from "@/components/enterprise-network/inspector";
import { RipplePanel, type RippleState } from "@/components/enterprise-network/ripple-panel";
import { NetworkGuide } from "@/components/enterprise-network/network-guide";
import { useEnterpriseNetwork } from "@/hooks/use-enterprise-network";
import { useExecRoomAddon } from "@/hooks/use-exec-room";
import {
  DEFAULT_FILTERS,
  LAYERS,
  LINK_TYPES,
  applyFilters,
  layoutNodes,
  shortestPath,
  simulateRipple,
  type EnFilters,
  type EnLayer,
  type EnLinkType,
  type EnNode,
  type RippleResult,
} from "@/lib/enterprise-network";

export const Route = createFileRoute("/_authenticated/report/enterprise-network")({
  head: () => ({
    meta: [
      { title: "Enterprise Network — DO.Impact" },
      {
        name: "description",
        content:
          "Model the business as a living network of capabilities, value streams and decisions, and simulate how a change ripples across the enterprise.",
      },
      { property: "og:title", content: "Enterprise Network — DO.Impact" },
      {
        property: "og:description",
        content: "See the enterprise as one connected system and simulate the ripple of any change.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EnterpriseNetworkPage,
});

function EnterpriseNetworkPage() {
  const addon = useExecRoomAddon();
  const [modelId, setModelId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const net = useEnterpriseNetwork(modelId, { includeArchived: showArchived });
  const readOnly = net.isTemplate;

  const [filters, setFilters] = useState<EnFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [newModelOpen, setNewModelOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("Enterprise model");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addLayer, setAddLayer] = useState<EnLayer>("capability");
  const [scenarioName, setScenarioName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const [ripple, setRipple] = useState<RippleState>({
    sourceId: null,
    shockPct: 15,
    direction: "decrease",
    decay: 0.85,
    maxHops: 6,
    linkTypes: LINK_TYPES.map((t) => t.key),
  });

  const models = net.models.data ?? [];
  const currentModel = models.find((m) => m.id === modelId) ?? null;
  useEffect(() => {
    if (!models.length) return;
    if (!modelId || !models.some((m) => m.id === modelId)) setModelId(models[0]!.id);
  }, [models, modelId]);


  // local positions so dragging feels immediate; DB catches up on release
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const layoutKey = useRef("");
  const filtered = useMemo(() => applyFilters(net.nodes, net.links, filters), [net.nodes, net.links, filters]);

  useEffect(() => {
    const key = `${net.nodes.length}:${net.links.length}:${net.nodes.map((n) => n.id).join(",")}`;
    if (key === layoutKey.current || !net.nodes.length) return;
    layoutKey.current = key;
    setPositions(layoutNodes(net.nodes, net.links));
  }, [net.nodes, net.links]);

  const rippleResults: RippleResult[] = useMemo(() => {
    if (!ripple.sourceId) return [];
    return simulateRipple(net.nodes, net.links, ripple.sourceId, ripple.shockPct * (ripple.direction === "decrease" ? -1 : 1), {
      decay: ripple.decay,
      maxHops: ripple.maxHops,
      linkTypes: ripple.linkTypes,
    });
  }, [net.nodes, net.links, ripple]);

  const rippleMap = useMemo(() => {
    const m = new Map<string, RippleResult>();
    rippleResults.forEach((r) => m.set(r.nodeId, r));
    return m;
  }, [rippleResults]);

  const pathIds = useMemo(
    () =>
      filters.focusId && filters.pathToId ? shortestPath(net.links, filters.focusId, filters.pathToId) : null,
    [filters.focusId, filters.pathToId, net.links],
  );

  const selected = net.nodes.find((n) => n.id === selectedId) ?? null;

  if (addon.isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!addon.isActive) {
    return (
      <div className="p-6">
        <ExecRoomLocked reason={addon.lockReason ?? "inactive"} termEnd={addon.termEnd} />
      </div>
    );
  }

  const move = (id: string, x: number, y: number, commit: boolean) => {
    setPositions((p) => ({ ...p, [id]: { x, y } }));
    if (commit) void net.savePositions([{ id, x, y, pinned: true }]);
  };

  const handleLinkTarget = (targetId: string) => {
    if (!linkFrom) return;
    net.addLink.mutate({ from_node: linkFrom, to_node: targetId, link_type: "information", strength: 0.6, lag_weeks: 1 });
    setLinkFrom(null);
  };

  const relayout = () => {
    const fresh = layoutNodes(net.nodes.map((n) => ({ ...n, x: null, y: null, pinned: false })), net.links);
    setPositions(fresh);
    void net.savePositions(Object.entries(fresh).map(([id, p]) => ({ id, x: p.x, y: p.y, pinned: false })));
  };

  return (
    <div className="p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reports & meetings</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Network className="size-6 text-primary" /> Enterprise Network
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The business as one dynamic system: capabilities, value streams, decisions and resources joined by
            information, material, financial and governance flows. Change one thing and watch where it lands — and
            when.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {models.length > 0 && (
            <Select value={modelId ?? ""} onValueChange={setModelId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select a model" /></SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}{m.archived_at ? " (archived)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="sm"
            variant={showArchived ? "secondary" : "ghost"}
            onClick={() => setShowArchived((v) => !v)}
            title="Show archived models"
          >
            <Archive className="mr-1.5 h-4 w-4" /> {showArchived ? "Archived shown" : "Show archived"}
          </Button>
          {currentModel && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={readOnly}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Manage model</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditName(currentModel.name);
                    setEditDesc(currentModel.description ?? "");
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit details
                </DropdownMenuItem>
                {currentModel.archived_at ? (
                  <DropdownMenuItem
                    onClick={async () => {
                      await net.updateModel.mutateAsync({ id: currentModel.id, patch: { archived_at: null } });
                      toast.success("Model restored");
                    }}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={async () => {
                      await net.updateModel.mutateAsync({
                        id: currentModel.id,
                        patch: { archived_at: new Date().toISOString() },
                      });
                      toast.success("Model archived");
                      if (!showArchived) setModelId(models.find((m) => m.id !== currentModel.id)?.id ?? null);
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" variant="outline" disabled={readOnly} onClick={() => setNewModelOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New model
          </Button>
        </div>

      </header>

      {!modelId ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <h2 className="font-semibold">No model yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create a model, then build it in one click from the objectives, value streams, KPIs, suppliers and
            workstreams already in this workspace.
          </p>
          <Button className="mt-4" disabled={readOnly} onClick={() => setNewModelOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create the first model
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 w-[200px] pl-8"
                placeholder="Find a node…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <ChipGroup
              label="Layers"
              options={LAYERS.map((l) => ({ key: l.key, label: l.short, color: l.ring }))}
              selected={filters.layers}
              onToggle={(k) =>
                setFilters({
                  ...filters,
                  layers: filters.layers.includes(k as EnLayer)
                    ? filters.layers.filter((x) => x !== k)
                    : [...filters.layers, k as EnLayer],
                })
              }
            />

            <ChipGroup
              label="Flows"
              options={LINK_TYPES.map((l) => ({ key: l.key, label: l.label, color: l.color }))}
              selected={filters.linkTypes}
              onToggle={(k) =>
                setFilters({
                  ...filters,
                  linkTypes: filters.linkTypes.includes(k as EnLinkType)
                    ? filters.linkTypes.filter((x) => x !== k)
                    : [...filters.linkTypes, k as EnLinkType],
                })
              }
            />

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Min strength</Label>
              <div className="w-24">
                <Slider value={[filters.minStrength]} min={0} max={0.9} step={0.05} onValueChange={([v]) => setFilters({ ...filters, minStrength: v ?? 0 })} />
              </div>
            </div>

            <Select
              value={filters.focusId ?? "all"}
              onValueChange={(v) => setFilters({ ...filters, focusId: v === "all" ? null : v, pathToId: null })}
            >
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Focus node" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Whole network</SelectItem>
                {net.nodes.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {filters.focusId && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{filters.focusHops} hops</Label>
                  <div className="w-20">
                    <Slider value={[filters.focusHops]} min={1} max={5} step={1} onValueChange={([v]) => setFilters({ ...filters, focusHops: v ?? 2 })} />
                  </div>
                </div>
                <Select value={filters.pathToId ?? "none"} onValueChange={(v) => setFilters({ ...filters, pathToId: v === "none" ? null : v })}>
                  <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Path to…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No path trace</SelectItem>
                    {net.nodes.filter((n) => n.id !== filters.focusId).map((n) => <SelectItem key={n.id} value={n.id}>Path to {n.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset</Button>
              <Button size="sm" variant="outline" disabled={readOnly} onClick={relayout}>Re-layout</Button>
              <Button size="sm" variant="outline" disabled={readOnly} onClick={() => setAddOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Node
              </Button>
              <Button size="sm" disabled={readOnly || net.seedFromCompany.isPending} onClick={() => net.seedFromCompany.mutate()}>
                <RefreshCw className={`mr-1.5 h-4 w-4 ${net.seedFromCompany.isPending ? "animate-spin" : ""}`} />
                Build from live data
              </Button>
            </div>
          </div>

          <Tabs defaultValue="map" className="mt-4">
            <TabsList>
              <TabsTrigger value="map">Network map</TabsTrigger>
              <TabsTrigger value="lanes">Layers</TabsTrigger>
              <TabsTrigger value="matrix">Dependency matrix</TabsTrigger>
              <TabsTrigger value="ripple">Ripple simulation</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="guide">Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
                <div className="space-y-3">
                  <NetworkMap
                    nodes={filtered.nodes}
                    links={filtered.links}
                    positions={positions}
                    selectedId={selectedId}
                    linkFrom={linkFrom}
                    ripple={ripple.sourceId ? rippleMap : null}
                    pathIds={pathIds}
                    onSelect={setSelectedId}
                    onLinkTarget={handleLinkTarget}
                    onMove={move}
                    readOnly={readOnly}
                  />
                  <Legend />
                </div>
                <div>
                  {selected ? (
                    <NodeInspector
                      node={selected}
                      nodes={net.nodes}
                      links={net.links}
                      linkFrom={linkFrom}
                      readOnly={readOnly}
                      onPatchNode={(patch) => net.patchNode.mutate({ id: selected.id, patch })}
                      onDeleteNode={() => {
                        net.deleteNode.mutate(selected.id);
                        setSelectedId(null);
                      }}
                      onPatchLink={(id, patch) => net.patchLink.mutate({ id, patch })}
                      onDeleteLink={(id) => net.deleteLink.mutate(id)}
                      onStartLink={() => setLinkFrom(linkFrom === selected.id ? null : selected.id)}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                      Click a node to inspect it, edit its dependencies, or start a new one. Drag to arrange, scroll to
                      zoom, drag the background to pan.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lanes" className="mt-4">
              <LayerLanes nodes={filtered.nodes} links={filtered.links} selectedId={selectedId} onSelect={setSelectedId} />
            </TabsContent>

            <TabsContent value="matrix" className="mt-4">
              <DependencyMatrix nodes={filtered.nodes} links={filtered.links} onSelect={setSelectedId} />
            </TabsContent>

            <TabsContent value="ripple" className="mt-4">
              <RipplePanel
                nodes={net.nodes}
                state={ripple}
                setState={setRipple}
                results={rippleResults}
                scenarios={net.scenarios}
                readOnly={readOnly}
                onSave={() => {
                  setScenarioName(
                    `${ripple.direction === "decrease" ? "−" : "+"}${ripple.shockPct}% ${
                      net.nodes.find((n) => n.id === ripple.sourceId)?.label ?? ""
                    }`.trim(),
                  );
                  setSaveOpen(true);
                }}
                onLoad={(s) => {
                  const st = (s.settings ?? {}) as Record<string, unknown>;
                  setRipple({
                    sourceId: s.source_node,
                    shockPct: Number(s.shock_pct ?? 10),
                    direction: s.direction,
                    decay: Number(st['decay'] ?? 0.85),
                    maxHops: Number(st['maxHops'] ?? 6),
                    linkTypes: (st['linkTypes'] as EnLinkType[] | undefined) ?? LINK_TYPES.map((t) => t.key),
                  });
                }}
                onDelete={(id) => net.deleteScenario.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              <InsightsPanel nodes={filtered.nodes} links={filtered.links} onSelect={setSelectedId} />
            </TabsContent>

            <TabsContent value="guide" className="mt-4">
              <NetworkGuide />
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={newModelOpen} onOpenChange={setNewModelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New enterprise model</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder="Model name" />
            <Textarea
              value={newModelDesc}
              onChange={(e) => setNewModelDesc(e.target.value)}
              placeholder="What is this model for? (optional)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewModelOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const id = await net.createModel.mutateAsync({
                  name: newModelName.trim() || "Enterprise model",
                  description: newModelDesc.trim() || null,
                });
                setModelId(id);
                setNewModelDesc("");
                setNewModelOpen(false);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit model</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Model name" />
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!editName.trim() || !currentModel}
              onClick={async () => {
                if (!currentModel) return;
                await net.updateModel.mutateAsync({
                  id: currentModel.id,
                  patch: { name: editName.trim(), description: editDesc.trim() || null },
                });
                toast.success("Model updated");
                setEditOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{currentModel?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the model with all of its nodes, dependencies and scenarios. Archive it instead
              if you may need it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!currentModel) return;
                const rest = models.find((m) => m.id !== currentModel.id)?.id ?? null;
                await net.deleteModel.mutateAsync(currentModel.id);
                setModelId(rest);
                setSelectedId(null);
                setDeleteOpen(false);
                toast.success("Model deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a node</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="What is it called?" />
            <Select value={addLayer} onValueChange={(v) => setAddLayer(v as EnLayer)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LAYERS.map((l) => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!addLabel.trim()}
              onClick={async () => {
                const id = await net.addNode.mutateAsync({
                  label: addLabel.trim(),
                  layer: addLayer,
                  node_type: addLayer,
                  criticality: 0.5,
                } as Partial<EnNode> & { label: string; layer: EnLayer });
                setAddLabel("");
                setAddOpen(false);
                setSelectedId(id);
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save scenario</DialogTitle></DialogHeader>
          <Input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder="Scenario name" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!ripple.sourceId) return toast.error("Pick a starting point first");
                net.saveScenario.mutate({
                  name: scenarioName.trim() || "Scenario",
                  source_node: ripple.sourceId,
                  shock_pct: ripple.shockPct,
                  direction: ripple.direction,
                  settings: { decay: ripple.decay, maxHops: ripple.maxHops, linkTypes: ripple.linkTypes },
                  results: rippleResults,
                } as never);
                setSaveOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { key: string; label: string; color: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {options.map((o) => {
        const on = selected.includes(o.key);
        return (
          <button
            key={o.key}
            onClick={() => onToggle(o.key)}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition-opacity ${on ? "text-background" : "border-border text-muted-foreground opacity-70"}`}
            style={on ? { backgroundColor: o.color, borderColor: o.color } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
      {LINK_TYPES.map((t) => (
        <span key={t.key} className="flex items-center gap-1.5">
          <svg width="26" height="8" aria-hidden>
            <line x1="0" y1="4" x2="26" y2="4" stroke={t.color} strokeWidth="2" strokeDasharray={t.dash} />
          </svg>
          {t.label} — {t.hint}
        </span>
      ))}
    </div>
  );
}
