import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import { assertWrote } from "@/lib/write-guard";
import type { EnLink, EnNode, EnScenario, EnLayer, EnLinkType } from "@/lib/enterprise-network";

const db = supabase as any;

export type EnModel = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  archived_at: string | null;
  created_at: string;
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function useEnterpriseNetwork(modelId: string | null, opts?: { includeArchived?: boolean }) {
  const qc = useQueryClient();
  const { data: active } = useActiveCompany();
  const companyId = active?.company_id ?? null;
  const isTemplate = Boolean(active?.companies?.is_template);
  const includeArchived = Boolean(opts?.includeArchived);

  const models = useQuery({
    queryKey: ["en-models", companyId, includeArchived],
    enabled: !!companyId,
    queryFn: async () => {
      let q = db.from("en_models").select("*").eq("company_id", companyId);
      if (!includeArchived) q = q.is("archived_at", null);
      const { data, error } = await q.order("created_at");
      if (error) throw error;
      return (data ?? []) as EnModel[];
    },
  });


  const nodes = useQuery({
    queryKey: ["en-nodes", modelId],
    enabled: !!modelId,
    queryFn: async () => {
      const { data, error } = await db.from("en_nodes").select("*").eq("model_id", modelId).order("sort_order");
      if (error) throw error;
      return (data ?? []).map(normaliseNode) as EnNode[];
    },
  });

  const links = useQuery({
    queryKey: ["en-links", modelId],
    enabled: !!modelId,
    queryFn: async () => {
      const { data, error } = await db.from("en_links").select("*").eq("model_id", modelId);
      if (error) throw error;
      return (data ?? []).map(normaliseLink) as EnLink[];
    },
  });

  const scenarios = useQuery({
    queryKey: ["en-scenarios", modelId],
    enabled: !!modelId,
    queryFn: async () => {
      const { data, error } = await db
        .from("en_scenarios")
        .select("*")
        .eq("model_id", modelId)
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EnScenario[];
    },
  });

  const invalidateGraph = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["en-nodes", modelId] });
    qc.invalidateQueries({ queryKey: ["en-links", modelId] });
  }, [qc, modelId]);

  const createModel = useMutation({
    mutationFn: async (input: { name: string; description?: string | null }) => {
      const { data, error } = await db
        .from("en_models")
        .insert({ company_id: companyId, name: input.name, description: input.description ?? null })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["en-models", companyId] }),
    onError: (e) => toast.error(`Could not create the model: ${errMsg(e)}`),
  });

  const updateModel = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await db.from("en_models").update(patch).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["en-models", companyId] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  const deleteModel = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("en_models").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["en-models", companyId] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  const addNode = useMutation({
    mutationFn: async (row: Partial<EnNode> & { label: string; layer: EnLayer }) => {
      const { data, error } = await db
        .from("en_nodes")
        .insert({ ...row, model_id: modelId, company_id: companyId })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: invalidateGraph,
    onError: (e) => toast.error(`Could not add the node: ${errMsg(e)}`),
  });

  const patchNode = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await db.from("en_nodes").update(patch).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: invalidateGraph,
    onError: (e) => toast.error(errMsg(e)),
  });

  /** Position saves are frequent and silent — never toast, never invalidate. */
  const savePositions = useCallback(
    async (updates: { id: string; x: number; y: number; pinned?: boolean }[]) => {
      if (isTemplate || !updates.length) return;
      await Promise.all(
        updates.map((u) =>
          db.from("en_nodes").update({ x: u.x, y: u.y, ...(u.pinned == null ? {} : { pinned: u.pinned }) }).eq("id", u.id),
        ),
      );
    },
    [isTemplate],
  );

  const deleteNode = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("en_nodes").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: invalidateGraph,
    onError: (e) => toast.error(errMsg(e)),
  });

  const addLink = useMutation({
    mutationFn: async (row: {
      from_node: string;
      to_node: string;
      link_type: EnLinkType;
      strength?: number;
      lag_weeks?: number;
      polarity?: "S" | "O";
      note?: string | null;
    }) => {
      const { data, error } = await db
        .from("en_links")
        .insert({ ...row, model_id: modelId, company_id: companyId })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: invalidateGraph,
    onError: (e) => toast.error(`Could not add the dependency: ${errMsg(e)}`),
  });

  const patchLink = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await db.from("en_links").update(patch).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: invalidateGraph,
    onError: (e) => toast.error(errMsg(e)),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("en_links").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: invalidateGraph,
    onError: (e) => toast.error(errMsg(e)),
  });

  const saveScenario = useMutation({
    mutationFn: async (row: Partial<EnScenario> & { name: string }) => {
      const { id, ...rest } = row as Record<string, unknown> & { id?: string };
      if (id) {
        const { data, error } = await db.from("en_scenarios").update(rest).eq("id", id).select("id");
        if (error) throw error;
        assertWrote(data, "edit");
        return id;
      }
      const { data, error } = await db
        .from("en_scenarios")
        .insert({ ...rest, model_id: modelId, company_id: companyId })
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["en-scenarios", modelId] });
      toast.success("Scenario saved");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const deleteScenario = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db.from("en_scenarios").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["en-scenarios", modelId] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  /** Build (or top up) the model from what the company already has in DO.Impact. */
  const seedFromCompany = useMutation({
    mutationFn: async () => {
      if (!modelId || !companyId) throw new Error("No model selected");
      const built = await buildSeed(companyId, modelId);
      if (!built.nodes.length) throw new Error("There is no strategy, KPI or value-stream data to model yet.");

      const existing = (nodes.data ?? []).filter((n) => n.source_id);
      const existingKeys = new Set(existing.map((n) => `${n.source_table}:${n.source_id}`));
      const fresh = built.nodes.filter((n) => !existingKeys.has(`${n.source_table}:${n.source_id}`));

      const { data: inserted, error } = await db
        .from("en_nodes")
        .insert(fresh.map((n) => ({ ...n, company_id: companyId })))
        .select("id, source_table, source_id");
      if (error) throw error;

      const idFor = new Map<string, string>();
      existing.forEach((n) => idFor.set(`${n.source_table}:${n.source_id}`, n.id));
      (inserted ?? []).forEach((n: { id: string; source_table: string; source_id: string }) =>
        idFor.set(`${n.source_table}:${n.source_id}`, n.id),
      );

      const linkRows = built.links
        .map((l) => {
          const from = idFor.get(l.from);
          const to = idFor.get(l.to);
          if (!from || !to || from === to) return null;
          return { ...l, from_node: from, to_node: to, from: undefined, to: undefined, model_id: modelId, company_id: companyId };
        })
        .filter(Boolean)
        .map((l) => {
          const { from, to, ...rest } = l as Record<string, unknown>;
          return rest;
        });

      const seenPairs = new Set((links.data ?? []).map((l) => `${l.from_node}>${l.to_node}>${l.link_type}`));
      const freshLinks = linkRows.filter((l) => {
        const key = `${l['from_node']}>${l['to_node']}>${l['link_type']}`;
        if (seenPairs.has(key)) return false;
        seenPairs.add(key);
        return true;
      });

      if (freshLinks.length) {
        const { error: le } = await db.from("en_links").insert(freshLinks);
        if (le) throw le;
      }
      return { nodes: fresh.length, links: freshLinks.length };
    },
    onSuccess: (r) => {
      invalidateGraph();
      toast.success(`Model refreshed — ${r.nodes} node${r.nodes === 1 ? "" : "s"} and ${r.links} dependenc${r.links === 1 ? "y" : "ies"} added`);
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return {
    companyId,
    isTemplate,
    models,
    nodes: useMemo(() => nodes.data ?? [], [nodes.data]),
    links: useMemo(() => links.data ?? [], [links.data]),
    scenarios: useMemo(() => scenarios.data ?? [], [scenarios.data]),
    isLoading: models.isLoading || nodes.isLoading || links.isLoading,
    createModel,
    updateModel,
    deleteModel,
    addNode,
    patchNode,
    deleteNode,
    savePositions,
    addLink,
    patchLink,
    deleteLink,
    saveScenario,
    deleteScenario,
    seedFromCompany,
  };
}

function normaliseNode(r: Record<string, unknown>): EnNode {
  return {
    ...(r as unknown as EnNode),
    criticality: Number(r['criticality'] ?? 0.5),
    x: r['x'] == null ? null : Number(r['x']),
    y: r['y'] == null ? null : Number(r['y']),
  };
}

function normaliseLink(r: Record<string, unknown>): EnLink {
  return {
    ...(r as unknown as EnLink),
    strength: Number(r['strength'] ?? 0.5),
    lag_weeks: Number(r['lag_weeks'] ?? 0),
  };
}

// ------------------------------------------------------------------ seeding

type SeedNode = {
  model_id: string;
  layer: EnLayer;
  node_type: string;
  label: string;
  pillar: string | null;
  owner_id: string | null;
  criticality: number;
  health: string | null;
  source_table: string;
  source_id: string;
  sort_order: number;
};
type SeedLink = {
  model_id: string;
  from: string;
  to: string;
  link_type: EnLinkType;
  strength: number;
  lag_weeks: number;
  polarity: "S" | "O";
  note: string | null;
};

const healthFromStatus = (s: string | null | undefined) =>
  s === "at_risk" ? "red" : s === "on_track" ? "green" : s === "done" ? "green" : "yellow";

/**
 * Reads the live company model and translates it into nodes and links.
 * Deterministic: re-running only adds what is missing.
 */
async function buildSeed(companyId: string, modelId: string): Promise<{ nodes: SeedNode[]; links: SeedLink[] }> {
  const [objectives, pillars, streams, kpis, suppliers, workstreams] = await Promise.all([
    db.from("strategic_objectives").select("id, title, status, owner_id").eq("company_id", companyId).is("archived_at", null).limit(10),
    db.from("pillars").select("id, name, health, owner_id").eq("company_id", companyId).is("archived_at", null).limit(8),
    db.from("aps_value_streams").select("id, name, owner_id").eq("company_id", companyId).is("archived_at", null).limit(8),
    db.from("kpis").select("id, name, is_key, pillar_id").eq("company_id", companyId).is("archived_at", null).limit(30),
    db.from("sc_suppliers").select("id, name, sole_source, annual_spend").eq("company_id", companyId).is("archived_at", null).limit(30),
    db.from("workstreams").select("id, name").eq("company_id", companyId).is("archived_at", null).limit(8),
  ]);

  const nodes: SeedNode[] = [];
  const links: SeedLink[] = [];
  const key = (t: string, id: string) => `${t}:${id}`;
  let order = 0;

  const push = (n: Omit<SeedNode, "model_id" | "sort_order">) => {
    nodes.push({ ...n, model_id: modelId, sort_order: order++ });
    return key(n.source_table, n.source_id);
  };
  const link = (from: string, to: string, link_type: EnLinkType, strength: number, lag_weeks = 0, note: string | null = null) =>
    links.push({ model_id: modelId, from, to, link_type, strength, lag_weeks, polarity: "S", note });

  const objIds: string[] = ((objectives.data ?? []) as any[]).map((o: any) =>
    push({
      layer: "strategy",
      node_type: "objective",
      label: o.title,
      pillar: "strategy",
      owner_id: o.owner_id ?? null,
      criticality: 0.9,
      health: healthFromStatus(o.status),
      source_table: "strategic_objectives",
      source_id: o.id,
    }),
  );

  const wsIds: string[] = ((workstreams.data ?? []) as any[]).map((w: any) =>
    push({
      layer: "capability",
      node_type: "workstream",
      label: w.name,
      pillar: "strategy",
      owner_id: null,
      criticality: 0.7,
      health: null,
      source_table: "workstreams",
      source_id: w.id,
    }),
  );

  const pillarIds = new Map<string, string>();
  (pillars.data ?? []).forEach((p: any) => {
    pillarIds.set(
      p.id,
      push({
        layer: "function",
        node_type: "pillar",
        label: p.name,
        pillar: "oms",
        owner_id: p.owner_id ?? null,
        criticality: 0.6,
        health: p.health ?? null,
        source_table: "pillars",
        source_id: p.id,
      }),
    );
  });

  const streamIds: string[] = ((streams.data ?? []) as any[]).map((s: any) =>
    push({
      layer: "value_stream",
      node_type: "value_stream",
      label: s.name,
      pillar: "oms",
      owner_id: s.owner_id ?? null,
      criticality: 0.8,
      health: null,
      source_table: "aps_value_streams",
      source_id: s.id,
    }),
  );

  const kpiRows = [...(kpis.data ?? [])].sort((a: any, b: any) => Number(b.is_key) - Number(a.is_key)).slice(0, 8);
  const kpiIds: { id: string; pillar_id: string | null }[] = kpiRows.map((k: any) => ({
    id: push({
      layer: "kpi",
      node_type: "kpi",
      label: k.name,
      pillar: "oms",
      owner_id: null,
      criticality: k.is_key ? 0.8 : 0.5,
      health: null,
      source_table: "kpis",
      source_id: k.id,
    }),
    pillar_id: k.pillar_id as string | null,
  }));

  const supplierRows = [...(suppliers.data ?? [])]
    .sort((a: any, b: any) => Number(b.sole_source) - Number(a.sole_source) || Number(b.annual_spend ?? 0) - Number(a.annual_spend ?? 0))
    .slice(0, 6);
  const supplierIds: string[] = supplierRows.map((s: any) =>
    push({
      layer: "resource",
      node_type: "supplier",
      label: s.name,
      pillar: "oms",
      owner_id: null,
      criticality: s.sole_source ? 0.9 : 0.6,
      health: s.sole_source ? "red" : null,
      source_table: "sc_suppliers",
      source_id: s.id,
    }),
  );

  // Canonical decision spine — the four calls every manufacturer actually makes.
  const decisions = [
    { id: "00000000-0000-4000-8000-0000000000d1", label: "Demand / forecast commit" },
    { id: "00000000-0000-4000-8000-0000000000d2", label: "Capacity & schedule commit" },
    { id: "00000000-0000-4000-8000-0000000000d3", label: "Supply & procurement commit" },
    { id: "00000000-0000-4000-8000-0000000000d4", label: "Investment gate" },
  ].map((d): string =>
    push({
      layer: "decision",
      node_type: "decision",
      label: d.label,
      pillar: "strategy",
      owner_id: null,
      criticality: 0.85,
      health: null,
      source_table: "decision_spine",
      source_id: d.id,
    }),
  );

  const [forecast, capacity, supply, investment] = decisions as [string, string, string, string];

  link(forecast, capacity, "information", 0.9, 1, "Forecast drives the production plan");
  link(capacity, supply, "information", 0.85, 1, "Plan drives material and capacity buys");
  link(supply, capacity, "material", 0.7, 4, "Material availability constrains the plan");
  streamIds.forEach((s) => {
    link(capacity, s, "decision", 0.8, 1);
    link(supply, s, "material", 0.75, 3);
  });
  supplierIds.forEach((sup) => {
    link(sup, supply, "material", 0.8, 4);
    streamIds.slice(0, 3).forEach((s) => link(sup, s, "material", 0.6, 4));
  });
  streamIds.forEach((s) =>
    kpiIds.slice(0, 4).forEach((k) => link(s, k.id, "information", 0.7, 1)),
  );
  kpiIds.forEach((k) => {
    if (k.pillar_id && pillarIds.get(k.pillar_id)) link(pillarIds.get(k.pillar_id)!, k.id, "governance", 0.5, 0);
    objIds.slice(0, 3).forEach((o) => link(k.id, o, "information", 0.55, 2));
  });
  [...pillarIds.values()].forEach((p) => streamIds.slice(0, 3).forEach((s) => link(p, s, "governance", 0.45, 0)));
  wsIds.forEach((w, i) => {
    link(investment, w, "financial", 0.7, 2);
    const target = objIds[i % Math.max(1, objIds.length)];
    if (target) link(w, target, "financial", 0.65, 6);
  });
  objIds.forEach((o) => link(o, investment, "governance", 0.6, 0));

  return { nodes, links };
}
