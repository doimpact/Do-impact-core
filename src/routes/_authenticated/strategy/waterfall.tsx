import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { NumberFormatMenu } from "@/components/number-format-menu";
import { useNumberFormat } from "@/lib/number-format";
import { useEffect, useMemo, useState } from "react";
import { loadWfViewPrefs, saveWfViewPrefs } from "@/lib/waterfall-view-prefs";
import { notStartedLeverIds } from "@/lib/not-started";


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Archive, ArchiveRestore, Trash2, Pencil, TrendingUp, Sparkles, ListChecks, AlertCircle, ExternalLink, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { useActiveCompany } from "@/hooks/use-companies";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList, ReferenceLine } from "recharts";
import { formatUSD } from "@/lib/finance";
import { DollarSign } from "lucide-react";
import {
  MonthlyBenefitsDialog, KpisDialog, WATERFALL_ITEM_VT,
} from "@/components/strategy/value-tracking-dialogs";

export const Route = createFileRoute("/_authenticated/strategy/waterfall")({
  head: () => ({
    meta: [
      { title: "Waterfall — DO.Impact" },
      { name: "description", content: "Strategic waterfall bridging baseline to target with initiative-level value levers." },
      { property: "og:title", content: "Waterfall — DO.Impact" },
      { property: "og:description", content: "Strategic waterfall bridging baseline to target with initiative-level value levers." },
    ],
  }),
  component: WaterfallPage,
});

type Metric = "sales" | "ebit" | "ebitda" | "free_cash_flow" | "other";
type Category = "headwind" | "organic_growth" | "new_strategy" | "efficiency" | "investment" | "other";

type Bridge = {
  id: string;
  title: string;
  metric: Metric;
  metric_label: string | null;
  currency: string;
  baseline_value: number;
  baseline_label: string;
  target_value: number | null;
  target_label: string;
  start_period: string | null;
  end_period: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  owner_id: string | null;
  company_id: string;
  archived_at: string | null;
};

type Item = {
  id: string;
  bridge_id: string;
  sort_order: number;
  label: string;
  category: Category;
  gross_impact: number;
  realization_pct: number;
  owner_id: string | null;
  program_manager: string | null;
  kpi: string | null;
  milestone_quarter: string | null;
  target_month: string | null;
  notes: string | null;
  archived_at: string | null;
  strategic_theme_id: string | null;
};

type Theme = { id: string; title: string };


type WfAction = {
  id: string;
  title: string;
  owner_id: string | null;
  due_date: string | null;
  status: "open" | "in_progress" | "done" | "blocked";
  archived_at: string | null;
};

const METRIC_LABEL: Record<Metric, string> = {
  sales: "Sales",
  ebit: "EBIT",
  ebitda: "EBITDA",
  free_cash_flow: "Free Cash Flow",
  other: "Custom",
};

const CATEGORY_META: Record<Category, { label: string; sign: 1 | -1; color: string }> = {
  headwind:        { label: "Headwind",             sign: -1, color: "#ef4444" },
  organic_growth:  { label: "Organic Growth",       sign:  1, color: "#22c55e" },
  new_strategy:    { label: "New Strategy",         sign:  1, color: "#3b82f6" },
  efficiency:      { label: "Operational Efficiency", sign: 1, color: "#10b981" },
  investment:      { label: "Strategic Investment", sign: -1, color: "#f97316" },
  other:           { label: "Other",                sign:  1, color: "#6b7280" },
};

function metricTitle(b: Bridge) {
  return b.metric === "other" ? (b.metric_label || "Custom metric") : METRIC_LABEL[b.metric];
}

function effective(i: Item) {
  const signed = CATEGORY_META[i.category].sign * Math.abs(Number(i.gross_impact) || 0);
  // If gross_impact stored negative, respect explicit sign
  const raw = Number(i.gross_impact) || 0;
  const value = raw === 0 ? 0 : (Math.sign(raw) !== 0 ? raw : signed);
  const useValue = raw !== 0 ? raw : signed;
  void value; void signed;
  return useValue * (Number(i.realization_pct) || 0) / 100;
}

function grossEffective(i: Item) {
  const raw = Number(i.gross_impact) || 0;
  const value = raw !== 0 ? raw : CATEGORY_META[i.category].sign * Math.abs(raw);
  return value;
}

function fmtMonth(d: string | null | undefined) {
  if (!d) return "";
  const dt = new Date(d + (d.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}
function toMonthInput(d: string | null | undefined) {
  if (!d) return "";
  return d.slice(0, 7); // YYYY-MM
}
function fromMonthInput(m: string | null | undefined) {
  if (!m) return null;
  return `${m}-01`;
}

function WaterfallPage() {
  const moneyPrefs = useNumberFormat(); // re-render when the money display setting changes
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(() => loadWfViewPrefs().showArchived);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bridgeDialog, setBridgeDialog] = useState<{ open: boolean; editing?: Bridge | null }>({ open: false });
  const [itemDialog, setItemDialog] = useState<{ open: boolean; editing?: Item | null }>({ open: false });
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "bridge" | "item"; id: string } | null>(null);
  const [riskAdjusted, setRiskAdjusted] = useState(() => loadWfViewPrefs().riskAdjusted);
  const [compareAll, setCompareAll] = useState(() => loadWfViewPrefs().compareAll);
  const [rollupMode, setRollupMode] = useState<"sum" | "delta">(() => loadWfViewPrefs().rollupMode);
  const [hideNotStarted, setHideNotStarted] = useState(() => loadWfViewPrefs().hideNotStarted);

  useEffect(() => {
    saveWfViewPrefs({ rollupMode, riskAdjusted, showArchived, compareAll, hideNotStarted });
  }, [rollupMode, riskAdjusted, showArchived, compareAll, hideNotStarted]);





  const activeCompanyQ = useActiveCompany();
  const activeCompanyId = activeCompanyQ.data?.company_id ?? null;

  const bridgesQ = useQuery({
    queryKey: ["waterfall-bridges", showArchived, activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      let q = supabase.from("waterfall_bridges").select("*")
        .eq("company_id", activeCompanyId!)
        .order("created_at", { ascending: false });
      const { data, error } = showArchived ? await q : await q.is("archived_at", null);
      if (error) throw error;
      return (data ?? []) as Bridge[];
    },
  });

  const themesQ = useQuery({
    queryKey: ["strategic-themes-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_themes").select("id,title")
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Theme[];
    },
  });
  const themes = themesQ.data ?? [];
  const themeMap = useMemo(() => new Map(themes.map((t) => [t.id, t])), [themes]);


  const bridges = bridgesQ.data ?? [];
  const currentBridge = bridges.find((b) => b.id === activeId) ?? bridges[0] ?? null;
  const currentId = currentBridge?.id ?? null;

  const itemsQ = useQuery({
    queryKey: ["waterfall-items", currentId],
    enabled: !!currentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waterfall_items").select("*")
        .eq("bridge_id", currentId as string)
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
  const allItems = itemsQ.data ?? [];

  const bridgeIds = bridges.map((b) => b.id);
  const allItemsQ = useQuery({
    queryKey: ["waterfall-items-all", bridgeIds.join(",")],
    enabled: compareAll && bridgeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waterfall_items").select("*")
        .in("bridge_id", bridgeIds)
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  // items across current + all bridges, used to resolve "not started" levers
  const scopeItems = useMemo(() => {
    const byId = new Map<string, Item>();
    for (const it of allItems) byId.set(it.id, it);
    for (const it of allItemsQ.data ?? []) byId.set(it.id, it);
    return Array.from(byId.values());
  }, [allItems, allItemsQ.data]);
  const scopeItemIds = useMemo(() => scopeItems.map((item) => item.id), [scopeItems]);
  const realizationSignature = useMemo(
    () => scopeItems.map((item) => `${item.id}:${Number(item.realization_pct) || 0}`).join(","),
    [scopeItems],
  );

  const notStartedQ = useQuery({
    queryKey: ["waterfall-not-started", scopeItemIds.join(","), realizationSignature],
    enabled: hideNotStarted && scopeItemIds.length > 0,
    queryFn: async () => {
      const objRes = await (supabase as any)
        .from("strategic_objectives").select("id,status,source_waterfall_item_id").in("source_waterfall_item_id", scopeItemIds);
      const objectives = (objRes.data ?? []) as { id: string; status: string | null; source_waterfall_item_id: string }[];
      const objIds = objectives.map((o) => o.id);
      const [actRes, objBenRes, leverBenRes] = await Promise.all([
        objIds.length
          ? (supabase as any).from("objective_actions").select("status,archived_at,objective_id,waterfall_item_id").or(`objective_id.in.(${objIds.join(",")}),waterfall_item_id.in.(${scopeItemIds.join(",")})`)
          : (supabase as any).from("objective_actions").select("status,archived_at,objective_id,waterfall_item_id").in("waterfall_item_id", scopeItemIds),
        objIds.length
          ? (supabase as any).from("objective_monthly_benefits").select("objective_id,actual").in("objective_id", objIds)
          : Promise.resolve({ data: [] }),
        (supabase as any).from("waterfall_item_monthly_benefits").select("item_id,actual").in("item_id", scopeItemIds),
      ]);
      return notStartedLeverIds(scopeItemIds, {
        items: scopeItems,
        objectives,
        actions: actRes.data ?? [],
        objectiveBenefits: objBenRes.data ?? [],
        leverBenefits: leverBenRes.data ?? [],
      });
    },
  });
  const notStartedSet = notStartedQ.data ?? new Set<string>();
  const hideLever = (id: string) => hideNotStarted && notStartedSet.has(id);


  const items = useMemo(
    () => (hideNotStarted ? allItems.filter((i) => !notStartedSet.has(i.id)) : allItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allItems, hideNotStarted, notStartedQ.data],
  );

  const itemsByBridge = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of allItemsQ.data ?? []) {
      if (hideLever(it.id)) continue;
      const arr = m.get(it.bridge_id) ?? [];
      arr.push(it);
      m.set(it.bridge_id, arr);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItemsQ.data, hideNotStarted, notStartedQ.data]);

  const hiddenCount = useMemo(() => {
    if (!hideNotStarted) return 0;
    const scope = compareAll ? (allItemsQ.data ?? allItems) : allItems;
    return scope.filter((i) => notStartedSet.has(i.id)).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideNotStarted, compareAll, allItems, allItemsQ.data, notStartedQ.data]);




  function buildChartData(b: Bridge, its: Item[]): ChartRow[] {
    let cum = Number(b.baseline_value) || 0;
    const rows: ChartRow[] = [];
    const ANCHOR = "#22c55e", POS = "#3b82f6", NEG = "#ef4444";
    rows.push({ name: b.baseline_label || "Start", base: 0, delta: cum, range: [0, cum], signed: cum, label: formatUSD(cum), cumulative: cum, fill: ANCHOR, isAnchor: true, gross: cum, realization: 100 });
    for (const it of its) {
      const g = grossEffective(it);
      const d = riskAdjusted ? g * (Number(it.realization_pct) || 0) / 100 : g;
      const start = cum; cum += d;
      const base = d >= 0 ? start : cum;
      const range: [number, number] = d >= 0 ? [start, cum] : [cum, start];
      rows.push({ name: it.label, base, delta: Math.abs(d), range, signed: d, label: (d >= 0 ? "+" : "−") + formatUSD(Math.abs(d)).replace("-", ""), cumulative: cum, fill: d >= 0 ? POS : NEG, isAnchor: false, gross: g, realization: Number(it.realization_pct) || 0 });
    }
    const targetShown = b.target_value ?? cum;
    rows.push({ name: b.target_label || "End", base: 0, delta: targetShown, range: [0, targetShown], signed: targetShown, label: formatUSD(targetShown), cumulative: targetShown, fill: ANCHOR, isAnchor: true, gross: targetShown, realization: 100 });
    return rows;
  }


  function bridgeSummary(b: Bridge, its: Item[]) {
    let headwinds = 0, gains = 0;
    for (const it of its) {
      const d = riskAdjusted ? effective(it) : grossEffective(it);
      if (d < 0) headwinds += d; else gains += d;
    }
    const baseline = Number(b.baseline_value) || 0;
    return { baseline, headwinds, gains, net: headwinds + gains, computedTarget: baseline + headwinds + gains, statedTarget: b.target_value };
  }

  const rollup = useMemo(() => {
    if (!compareAll) return null;
    const active = bridges.filter((b) => !b.archived_at);
    let baseline = 0, headwinds = 0, gains = 0, statedTarget = 0, hasStated = false;
    const perBridge: Array<{ id: string; title: string; net: number }> = [];
    for (const b of active) {
      const s = bridgeSummary(b, itemsByBridge.get(b.id) ?? []);
      baseline += s.baseline; headwinds += s.headwinds; gains += s.gains;
      if (b.target_value != null) { statedTarget += Number(b.target_value); hasStated = true; }
      perBridge.push({ id: b.id, title: b.title, net: s.net });
    }
    return { count: active.length, baseline, headwinds, gains, net: headwinds + gains, computedTarget: baseline + headwinds + gains, statedTarget: hasStated ? statedTarget : null, perBridge };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareAll, bridges, itemsByBridge, riskAdjusted]);


  const { profiles } = { profiles: useProfiles().data ?? [] };
  const profMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const itemIds = items.map((i) => i.id);
  const linkedInitiativesQ = useQuery({
    queryKey: ["waterfall-linked-objectives", currentId, itemIds.join(",")],
    enabled: itemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("strategic_objectives")
        .select("id,title,stage,status,source_waterfall_item_id")
        .in("source_waterfall_item_id", itemIds);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; stage: string | null; status: string | null; source_waterfall_item_id: string }>;
    },
  });
  const linkedByItem = useMemo(() => {
    const m = new Map<string, { id: string; title: string; stage: string | null; status: string | null }>();
    for (const o of linkedInitiativesQ.data ?? []) m.set(o.source_waterfall_item_id, o);
    return m;
  }, [linkedInitiativesQ.data]);

  const actionCountsQ = useQuery({
    queryKey: ["waterfall-action-counts", currentId, itemIds.join(",")],
    enabled: itemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objective_actions")
        .select("id,status,archived_at,waterfall_item_id")
        .in("waterfall_item_id", itemIds);
      if (error) throw error;
      const counts = new Map<string, { open: number; total: number }>();
      for (const a of (data ?? []) as Array<{ waterfall_item_id: string; status: string; archived_at: string | null }>) {
        const key = a.waterfall_item_id;
        const c = counts.get(key) ?? { open: 0, total: 0 };
        if (!a.archived_at) {
          c.total++;
          if (a.status !== "done") c.open++;
        }
        counts.set(key, c);
      }
      return counts;
    },
  });

  // Monthly benefit plan totals + KPI counts per lever
  const benefitTotalsQ = useQuery({
    queryKey: ["waterfall-item-benefits", currentId, itemIds.join(",")],
    enabled: itemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("waterfall_item_monthly_benefits")
        .select("item_id,value")
        .in("item_id", itemIds);
      if (error) throw error;
      const m = new Map<string, number>();
      for (const r of (data ?? []) as Array<{ item_id: string; value: number }>) {
        m.set(r.item_id, (m.get(r.item_id) ?? 0) + (Number(r.value) || 0));
      }
      return m;
    },
  });

  const kpiCountsQ = useQuery({
    queryKey: ["waterfall-item-kpi-counts", currentId, itemIds.join(",")],
    enabled: itemIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("waterfall_item_kpis")
        .select("id,item_id,archived_at")
        .in("item_id", itemIds);
      if (error) throw error;
      const m = new Map<string, number>();
      for (const r of (data ?? []) as Array<{ item_id: string; archived_at: string | null }>) {
        if (!r.archived_at) m.set(r.item_id, (m.get(r.item_id) ?? 0) + 1);
      }
      return m;
    },
  });

  const leverStartYear = currentBridge?.start_date
    ? new Date(currentBridge.start_date).getFullYear()
    : new Date().getFullYear();

  async function applyPlanTotalToGross(itemId: string, planTotal: number) {
    const { error } = await supabase
      .from("waterfall_items")
      .update({ gross_impact: planTotal })
      .eq("id", itemId);
    if (error) return toast.error(error.message);
    toast.success("Gross impact updated from plan total");
    qc.invalidateQueries({ queryKey: ["waterfall-items", currentId] });
    qc.invalidateQueries({ queryKey: ["waterfall-items-all"] });
  }



  // Chart data: baseline anchor + items + target anchor
  const chartData = useMemo(() => {
    if (!currentBridge) return [];
    let cum = Number(currentBridge.baseline_value) || 0;
    const rows: Array<{ name: string; base: number; delta: number; range: [number, number]; signed: number; label: string; cumulative: number; fill: string; isAnchor: boolean; gross: number; realization: number }> = [];
    const ANCHOR = "#22c55e";
    const POS = "#3b82f6";
    const NEG = "#ef4444";
    rows.push({
      name: currentBridge.baseline_label || "Start",
      base: 0,
      delta: cum,
      range: [0, cum],
      signed: cum,
      label: formatUSD(cum),
      cumulative: cum,
      fill: ANCHOR,
      isAnchor: true,
      gross: cum,
      realization: 100,
    });
    for (const it of items) {
      const g = grossEffective(it);
      const d = riskAdjusted ? g * (Number(it.realization_pct) || 0) / 100 : g;
      const start = cum;
      cum = cum + d;
      const base = d >= 0 ? start : cum;
      const range: [number, number] = d >= 0 ? [start, cum] : [cum, start];
      rows.push({
        name: it.label,
        base,
        delta: Math.abs(d),
        range,
        signed: d,
        label: (d >= 0 ? "+" : "−") + formatUSD(Math.abs(d)).replace("-", ""),
        cumulative: cum,
        fill: d >= 0 ? POS : NEG,
        isAnchor: false,
        gross: g,
        realization: Number(it.realization_pct) || 0,
      });
    }
    const computedTarget = cum;
    const targetShown = currentBridge.target_value ?? computedTarget;
    rows.push({
      name: currentBridge.target_label || "End",
      base: 0,
      delta: targetShown,
      range: [0, targetShown],
      signed: targetShown,
      label: formatUSD(targetShown),
      cumulative: targetShown,
      fill: ANCHOR,
      isAnchor: true,
      gross: targetShown,
      realization: 100,
    });

    return rows;
  }, [currentBridge, items, riskAdjusted, moneyPrefs.unit, moneyPrefs.decimals]);



  const summary = useMemo(() => {
    if (!currentBridge) return null;
    let headwinds = 0, gains = 0;
    for (const it of items) {
      const d = riskAdjusted ? effective(it) : grossEffective(it);
      if (d < 0) headwinds += d; else gains += d;
    }
    const baseline = Number(currentBridge.baseline_value) || 0;
    const computedTarget = baseline + headwinds + gains;
    const statedTarget = currentBridge.target_value;
    return { baseline, headwinds, gains, net: headwinds + gains, computedTarget, statedTarget, gap: statedTarget == null ? 0 : (computedTarget - statedTarget) };
  }, [currentBridge, items, riskAdjusted]);

  const upsertBridge = useMutation({
    mutationFn: async (payload: Partial<Bridge> & { id?: string }) => {
      const { data: user } = await getCurrentUser();
      const row = { ...payload, created_by: payload.id ? undefined : user.user?.id };
      const { data, error } = payload.id
        ? await supabase.from("waterfall_bridges").update(row).eq("id", payload.id).select().single()
        : await supabase.from("waterfall_bridges").insert(row as any).select().single();
      if (error) throw error;
      return data as Bridge;
    },
    onSuccess: (b) => {
      toast.success("Bridge saved");
      setBridgeDialog({ open: false });
      setActiveId(b.id);
      qc.invalidateQueries({ queryKey: ["waterfall-bridges"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  const setArchivedBridge = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase.from("waterfall_bridges")
        .update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["waterfall-bridges"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deleteBridge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waterfall_bridges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waterfall-bridges"] });
      setActiveId(null);
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const upsertItem = useMutation({
    mutationFn: async (payload: Partial<Item> & { id?: string; bridge_id?: string }) => {
      const row = { ...payload } as any;
      const { data, error } = payload.id
        ? await supabase.from("waterfall_items").update(row).eq("id", payload.id).select().single()
        : await supabase.from("waterfall_items").insert(row).select().single();
      if (error) throw error;
      const saved = data as Item;
      // Keep a linked strategic objective in sync with the lever it came from.
      if (payload.id) {
        const eff = grossEffective(saved) * (Number(saved.realization_pct) || 0) / 100;
        const patch: Record<string, unknown> = {
          title: saved.label,
          theme_id: saved.strategic_theme_id ?? null,
          target_metric: `${eff >= 0 ? "+" : ""}${formatUSD(eff)}`,
        };
        if (saved.owner_id) patch.owner_id = saved.owner_id;
        await (supabase as any)
          .from("strategic_objectives")
          .update(patch)
          .eq("source_waterfall_item_id", saved.id);
      }
      return saved;
    },
    onSuccess: () => {
      toast.success("Item saved");
      setItemDialog({ open: false });
      qc.invalidateQueries({ queryKey: ["waterfall-items", currentId] });
      qc.invalidateQueries({ queryKey: ["waterfall-items-all"] });
      qc.invalidateQueries({ queryKey: ["waterfall-linked-objectives"] });
      qc.invalidateQueries({ queryKey: ["strategy-objectives"] });
      qc.invalidateQueries({ queryKey: ["initiatives"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });



  const archiveItem = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase.from("waterfall_items")
        .update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["waterfall-items", currentId] }); },
    onError: (e: any) => toast.error(e.message ?? "Update failed"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("waterfall_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["waterfall-items", currentId] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Delete failed"),
  });

  const reorderItems = useMutation({
    mutationFn: async (ordered: Item[]) => {
      const updates = ordered
        .map((it, idx) => ({ it, idx }))
        .filter(({ it, idx }) => Number(it.sort_order) !== idx);
      for (const { it, idx } of updates) {
        const { error } = await supabase.from("waterfall_items")
          .update({ sort_order: idx }).eq("id", it.id);
        if (error) throw error;
      }
    },
    onMutate: async (ordered: Item[]) => {
      const key = ["waterfall-items", currentId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Item[]>(key);
      qc.setQueryData<Item[]>(key, ordered.map((it, idx) => ({ ...it, sort_order: idx })));
      return { prev, key };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(e?.message ?? "Reorder failed");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["waterfall-items", currentId] });
      qc.invalidateQueries({ queryKey: ["waterfall-items-all"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleLeverDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    reorderItems.mutate(arrayMove(items, from, to));
  }

  function moveLever(id: string, dir: -1 | 1) {
    const from = items.findIndex((i) => i.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= items.length) return;
    reorderItems.mutate(arrayMove(items, from, to));
  }


  const [actionsForItem, setActionsForItem] = useState<Item | null>(null);
  const [promoteObjItem, setPromoteObjItem] = useState<Item | null>(null);
  const [promoteObjYear, setPromoteObjYear] = useState<number>(1);

  const promoteToObjective = useMutation({
    mutationFn: async ({ item, year }: { item: Item; year: number }) => {
      const { data: userData } = await getCurrentUser();
      const eff = grossEffective(item) * (Number(item.realization_pct) || 0) / 100;
      const bridgeTitle = currentBridge?.title ?? "waterfall";
      const desc = [`From waterfall: ${bridgeTitle}`, item.notes].filter(Boolean).join("\n\n");
      const payload: any = {
        title: item.label,
        description: desc,
        target_metric: `${eff >= 0 ? "+" : ""}${formatUSD(eff)}`,
        theme_id: item.strategic_theme_id ?? null,
        horizon_year: year,
        status: "not_started",
        stage: "L1",
        owner_id: item.owner_id ?? userData.user?.id ?? null,
        source_waterfall_item_id: item.id,
        company_id: currentId,
      };
      const { error } = await (supabase as any).from("strategic_objectives").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Added as 3-year roadmap objective");
      setPromoteObjItem(null);
      qc.invalidateQueries({ queryKey: ["waterfall-linked-objectives"] });
      qc.invalidateQueries({ queryKey: ["strategy-objectives"] });
      qc.invalidateQueries({ queryKey: ["workstreams"] });
      qc.invalidateQueries({ queryKey: ["initiatives"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Promote failed"),
  });


  const loadExample = useMutation({
    mutationFn: async () => {
      const { data: b, error } = await supabase.from("waterfall_bridges").insert({
        title: "3-Year EBIT Expansion",
        metric: "ebit",
        baseline_value: 50_000_000,
        baseline_label: "Current EBIT",
        target_value: 80_000_000,
        target_label: "Target EBIT",
        start_period: "FY25",
        end_period: "FY28",
      } as any).select().single();
      if (error) throw error;
      const rows = [
        { label: "Labor & Raw Material Inflation", category: "headwind", gross_impact: -4_000_000, realization_pct: 100 },
        { label: "Contract Rolloffs / Churn",       category: "headwind", gross_impact: -2_000_000, realization_pct: 100 },
        { label: "Pricing Optimization & Value Tiering", category: "organic_growth", gross_impact: 12_000_000, realization_pct: 90 },
        { label: "Next-Gen Product Line Launch",    category: "new_strategy",  gross_impact: 15_000_000, realization_pct: 60 },
        { label: "Strategic Sourcing & Procurement Redesign", category: "efficiency", gross_impact: 6_000_000, realization_pct: 85 },
        { label: "Back-Office Automation & Process Redesign", category: "efficiency", gross_impact: 8_000_000, realization_pct: 75 },
        { label: "Digital Infrastructure & AI Capability Spend", category: "investment", gross_impact: -5_000_000, realization_pct: 100 },
      ].map((r, i) => ({ ...r, bridge_id: b.id, sort_order: i }));
      const { error: e2 } = await supabase.from("waterfall_items").insert(rows as any);
      if (e2) throw e2;
      return b as Bridge;
    },
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ["waterfall-bridges"] });
      qc.invalidateQueries({ queryKey: ["waterfall-items"] });
      setActiveId(b.id);
      toast.success("Worked example loaded");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" /> Waterfall
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Translate strategy into concrete financial outcomes. Bridge baseline → target with quantified initiatives, realization haircuts, and owners.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex items-center gap-2 text-xs" data-tour="waterfall-compare">
            <Switch checked={compareAll} onCheckedChange={setCompareAll} id="wf-compare" />
            <Label htmlFor="wf-compare" className="text-xs">Compare all</Label>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} id="wf-archived" />
            <Label htmlFor="wf-archived" className="text-xs">Show archived</Label>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={hideNotStarted} onCheckedChange={setHideNotStarted} id="wf-hide-ns" />
            <Label htmlFor="wf-hide-ns" className="text-xs">
              Hide not started{hideNotStarted && hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
            </Label>

          </div>

          <Button variant="outline" size="sm" onClick={() => loadExample.mutate()} disabled={loadExample.isPending}>
            <Sparkles className="mr-1 h-4 w-4" /> Load worked example
          </Button>
          <Button size="sm" onClick={() => setBridgeDialog({ open: true, editing: null })}>
            <Plus className="mr-1 h-4 w-4" /> New bridge
          </Button>
        </div>

      </header>

      {bridges.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No bridges yet. Create one, or load the worked example to get started.
        </div>
      ) : compareAll ? (
        <CompareAllView
          bridges={bridges.filter((b) => showArchived || !b.archived_at)}
          itemsByBridge={itemsByBridge}
          buildChartData={buildChartData}
          bridgeSummary={bridgeSummary}
          rollup={rollup}
          riskAdjusted={riskAdjusted}
          onRiskAdjusted={setRiskAdjusted}
          rollupMode={rollupMode}
          onRollupMode={setRollupMode}
          onOpen={(id) => { setCompareAll(false); setActiveId(id); }}
        />
      ) : (
        <>

          <div className="flex flex-wrap items-center gap-2" data-tour="waterfall-bridge-list">
            <Label className="text-xs">Bridge</Label>
            <Select value={currentId ?? ""} onValueChange={(v) => setActiveId(v)}>
              <SelectTrigger className="w-[320px]"><SelectValue placeholder="Select bridge" /></SelectTrigger>
              <SelectContent>
                {bridges.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title} {b.archived_at ? " (archived)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentBridge && (() => {
              const isReadOnly = !!activeCompanyId && currentBridge.company_id !== activeCompanyId;
              return (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem disabled={isReadOnly} onClick={() => setBridgeDialog({ open: true, editing: currentBridge })}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isReadOnly} onClick={() => setArchivedBridge.mutate({ id: currentBridge.id, archive: !currentBridge.archived_at })}>
                        {currentBridge.archived_at
                          ? <><ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive</>
                          : <><Archive className="mr-2 h-4 w-4" /> Archive</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isReadOnly} onClick={() => setConfirmDelete({ kind: "bridge", id: currentBridge.id })} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isReadOnly && (
                    <span className="text-[11px] text-muted-foreground">Read-only template — duplicate to edit</span>
                  )}
                </>
              );
            })()}
            <div className="ml-auto flex items-center gap-2 text-xs">
              <Switch checked={riskAdjusted} onCheckedChange={setRiskAdjusted} id="wf-risk" />
              <Label htmlFor="wf-risk" className="text-xs">Risk-adjusted</Label>
            </div>
          </div>

          {currentBridge && (
            <>
              <section className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {metricTitle(currentBridge)} · {currentBridge.start_period || "—"} → {currentBridge.end_period || "—"}
                    </div>
                    <h2 className="text-lg font-semibold">{currentBridge.title}</h2>
                    {currentBridge.owner_id && (
                      <div className="text-xs text-muted-foreground">Owner: {ownerLabel(profMap.get(currentBridge.owner_id))}</div>
                    )}
                  </div>
                  {summary && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <Kpi label="Baseline" value={formatUSD(summary.baseline)} />
                      <Kpi label="Headwinds" value={formatUSD(summary.headwinds)} tone="neg" />
                      <Kpi label="Gains" value={formatUSD(summary.gains)} tone="pos" />
                      <Kpi label="Net Δ" value={formatUSD(summary.net)} tone={summary.net >= 0 ? "pos" : "neg"} />
                      <Kpi
                        label={summary.statedTarget == null ? "Computed target" : "Computed vs stated"}
                        value={summary.statedTarget == null
                          ? formatUSD(summary.computedTarget)
                          : `${formatUSD(summary.computedTarget)} / ${formatUSD(summary.statedTarget)}`}
                        tone={summary.statedTarget != null && Math.abs(summary.gap) > 0.01 ? "warn" : undefined}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 h-96 w-full" data-demo="waterfall-chart" data-tour="waterfall-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 24, right: 16, left: 8, bottom: 56 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatUSD(Number(v))} width={72} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                        formatter={(_v, _n, entry: any) => {
                          const p = entry?.payload;
                          if (!p) return "";
                          if (p.isAnchor) return [formatUSD(p.cumulative), "Total"];
                          return [
                            `${formatUSD(p.gross)} gross · ${p.realization}% · ${formatUSD(p.gross * p.realization / 100)} effective`,
                            "Impact",
                          ];
                        }}
                        labelFormatter={(l) => l}
                      />
                      <Bar dataKey="range" isAnimationActive={false} radius={[2, 2, 0, 0]} minPointSize={2}>
                        {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        <LabelList
                          dataKey="label"
                          position="center"
                          style={{ fontSize: 11, fontWeight: 600, fill: "#ffffff" }}
                        />
                      </Bar>

                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#22c55e" }} /> Baseline / Target</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#3b82f6" }} /> Gain</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#ef4444" }} /> Headwind</span>
                </div>
              </section>

              <section className="rounded-xl border bg-card p-4" data-tour="waterfall-levers">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Value levers</h3>
                  <Button size="sm" onClick={() => setItemDialog({ open: true, editing: null })}>
                    <Plus className="mr-1 h-4 w-4" /> Add item
                  </Button>
                </div>
                {items.length === 0 ? (
                  <div className="rounded border border-dashed p-6 text-center text-xs text-muted-foreground">
                    No items yet. Add headwinds and initiatives to build the bridge.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={handleLeverDragEnd}
                    >
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr className="border-b">
                          <th className="w-6 py-2"></th>
                          <th className="py-2 text-left">Lever</th>
                          <th className="py-2 text-left">Category</th>
                          <th className="py-2 text-right">Gross</th>
                          <th className="py-2 text-right">Real. %</th>
                          <th className="py-2 text-right">Effective</th>
                          <th className="py-2 text-left">Owner</th>
                          <th className="py-2 text-left">KPI</th>
                          <th className="py-2 text-left">Target month</th>
                          <th className="py-2 text-left">Linked</th>
                          <th className="py-2 text-center">Value tracking</th>
                          <th className="py-2 text-center">Actions</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {items.map((it, idx) => {
                          const g = grossEffective(it);
                          const eff = g * (Number(it.realization_pct) || 0) / 100;
                          const linked = linkedByItem.get(it.id);
                          const counts = actionCountsQ.data?.get(it.id);
                          return (
                            <SortableLeverRow key={it.id} id={it.id}>
                              {(handleProps) => (<>
                              <td className="py-2 pr-1">
                                <button
                                  type="button"
                                  aria-label={`Reorder ${it.label}`}
                                  className="cursor-grab touch-none rounded p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground active:cursor-grabbing"
                                  {...handleProps}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                              </td>
                              <td className="py-2">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-sm" style={{ background: CATEGORY_META[it.category].color }} />
                                  <span className="font-medium">{it.label}</span>
                                </div>
                              </td>
                              <td className="py-2 text-xs">{it.strategic_theme_id ? (themeMap.get(it.strategic_theme_id)?.title ?? CATEGORY_META[it.category].label) : CATEGORY_META[it.category].label}</td>
                              <td className={`py-2 text-right tabular-nums ${g < 0 ? "text-red-500" : "text-emerald-500"}`}>{formatUSD(g)}</td>
                              <td className="py-2 text-right tabular-nums">{Number(it.realization_pct).toFixed(0)}%</td>
                              <td className={`py-2 text-right tabular-nums font-medium ${eff < 0 ? "text-red-500" : "text-emerald-500"}`}>{formatUSD(eff)}</td>
                              <td className="py-2 text-xs">{it.owner_id ? ownerLabel(profMap.get(it.owner_id)) : "—"}</td>
                              <td className="py-2 text-xs">{it.kpi || "—"}</td>
                              <td className="py-2 text-xs">{fmtMonth(it.target_month) || it.milestone_quarter || "—"}</td>
                              <td className="py-2 text-xs">
                                {linked ? (
                                  <Link to="/strategy" className="inline-flex max-w-[180px] items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 hover:bg-violet-200" title={linked.title}>
                                    <TrendingUp className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{linked.title}</span>
                                    {linked.stage ? <span className="shrink-0 opacity-70">· {linked.stage}</span> : null}
                                    <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <MonthlyBenefitsDialog
                                    cfg={WATERFALL_ITEM_VT}
                                    parentId={it.id}
                                    parentTitle={it.label}
                                    startYear={leverStartYear}
                                    onSaved={() => {
                                      qc.invalidateQueries({ queryKey: ["waterfall-item-benefits", currentId, itemIds.join(",")] });
                                    }}
                                    extraFooter={(planTotal) => (
                                      <Button
                                        variant="outline"
                                        onClick={() => applyPlanTotalToGross(it.id, planTotal)}
                                        disabled={!planTotal}
                                      >
                                        Use plan total as gross impact
                                      </Button>
                                    )}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" title="Monthly benefits ($)">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        {(benefitTotalsQ.data?.get(it.id) ?? 0) > 0
                                          ? <span className="tabular-nums text-emerald-600">{formatUSD(benefitTotalsQ.data!.get(it.id)!)}</span>
                                          : "Plan"}
                                      </Button>
                                    }
                                  />
                                  <KpisDialog
                                    cfg={WATERFALL_ITEM_VT}
                                    parentId={it.id}
                                    parentTitle={it.label}
                                    canEdit
                                    onChanged={() => {
                                      qc.invalidateQueries({ queryKey: ["waterfall-item-kpi-counts", currentId, itemIds.join(",")] });
                                    }}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" title="Leading & lagging KPIs">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        {kpiCountsQ.data?.get(it.id) ?? 0}
                                      </Button>
                                    }
                                  />
                                </div>
                              </td>
                              <td className="py-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 px-2 text-xs"
                                  onClick={() => setActionsForItem(it)}
                                >
                                  <ListChecks className="h-3.5 w-3.5" />
                                  {counts && counts.total > 0 ? `${counts.open}/${counts.total}` : "Add"}
                                </Button>
                              </td>
                              <td className="py-2 text-right" data-tour="waterfall-promote">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem disabled={idx === 0} onClick={() => moveLever(it.id, -1)}>
                                      <ArrowUp className="mr-2 h-4 w-4" /> Move up
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={idx === items.length - 1} onClick={() => moveLever(it.id, 1)}>
                                      <ArrowDown className="mr-2 h-4 w-4" /> Move down
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemDialog({ open: true, editing: it })}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    {linked ? (
                                      <DropdownMenuItem disabled>
                                        <TrendingUp className="mr-2 h-4 w-4" /> Already an objective
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => { setPromoteObjYear(1); setPromoteObjItem(it); }}>
                                        <TrendingUp className="mr-2 h-4 w-4" /> Add to 3-year roadmap
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => archiveItem.mutate({ id: it.id, archive: true })}>
                                      <Archive className="mr-2 h-4 w-4" /> Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setConfirmDelete({ kind: "item", id: it.id })} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                              </>)}
                            </SortableLeverRow>
                          );
                        })}
                      </tbody>
                      </SortableContext>
                    </table>
                    </DndContext>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      {bridgeDialog.open && (
        <BridgeDialog
          bridge={bridgeDialog.editing ?? null}
          onClose={() => setBridgeDialog({ open: false })}
          onSave={(p) => upsertBridge.mutate(p)}
          saving={upsertBridge.isPending}
        />
      )}
      {itemDialog.open && currentId && (
        <ItemDialog
          item={itemDialog.editing ?? null}
          bridgeId={currentId}
          nextSort={items.length}
          themes={themes}
          onClose={() => setItemDialog({ open: false })}
          onSave={(p) => upsertItem.mutate(p)}
          saving={upsertItem.isPending}
        />
      )}

      {actionsForItem && (
        <ItemActionsDialog
          item={actionsForItem}
          onClose={() => setActionsForItem(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["waterfall-action-counts"] })}
        />
      )}

      <Dialog open={!!promoteObjItem} onOpenChange={(o) => !o && setPromoteObjItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to 3-year roadmap</DialogTitle>
          </DialogHeader>
          {promoteObjItem && (
            <div className="space-y-3 text-sm">
              <div className="rounded border bg-muted/40 p-2 text-xs">
                <div className="font-medium">{promoteObjItem.label}</div>
                <div className="text-muted-foreground">
                  Creates a new roadmap objective (auto-mirrored to Progress).
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Horizon year</Label>
                <Select value={String(promoteObjYear)} onValueChange={(v) => setPromoteObjYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteObjItem(null)}>Cancel</Button>
            <Button
              disabled={promoteToObjective.isPending}
              onClick={() => promoteObjItem && promoteToObjective.mutate({ item: promoteObjItem, year: promoteObjYear })}
            >
              Add objective
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.kind === "bridge") deleteBridge.mutate(confirmDelete.id);
                else deleteItem.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ChartRow = { name: string; base: number; delta: number; range: [number, number]; signed: number; label: string; cumulative: number; fill: string; isAnchor: boolean; gross: number; realization: number };
type SummaryT = { baseline: number; headwinds: number; gains: number; net: number; computedTarget: number; statedTarget: number | null };

function CompareAllView(props: {
  bridges: Bridge[];
  itemsByBridge: Map<string, Item[]>;
  buildChartData: (b: Bridge, its: Item[]) => ChartRow[];
  bridgeSummary: (b: Bridge, its: Item[]) => SummaryT;
  rollup: { count: number; baseline: number; headwinds: number; gains: number; net: number; computedTarget: number; statedTarget: number | null; perBridge: Array<{ id: string; title: string; net: number }> } | null;
  riskAdjusted: boolean;
  onRiskAdjusted: (v: boolean) => void;
  rollupMode: "sum" | "delta";
  onRollupMode: (m: "sum" | "delta") => void;
  onOpen: (id: string) => void;
}) {
  const { bridges, itemsByBridge, buildChartData, bridgeSummary, rollup, riskAdjusted, onRiskAdjusted, rollupMode, onRollupMode, onOpen } = props;
  const moneyPrefs = useNumberFormat();

  const rollupChart = useMemo<ChartRow[]>(() => {
    if (!rollup) return [];
    const ANCHOR = "#22c55e", POS = "#3b82f6", NEG = "#ef4444";
    const rows: ChartRow[] = [];

    if (rollupMode === "delta") {
      let cum = 0;
      rows.push({ name: "Start", base: 0, delta: 0, range: [0, 0], signed: 0, label: formatUSD(0), cumulative: 0, fill: ANCHOR, isAnchor: true, gross: 0, realization: 100 });
      for (const b of rollup.perBridge) {
        const d = b.net;
        const start = cum; cum += d;
        const range: [number, number] = d >= 0 ? [start, cum] : [cum, start];
        rows.push({
          name: b.title,
          base: Math.min(start, cum),
          delta: Math.abs(d),
          range,
          signed: d,
          label: (d >= 0 ? "+" : "−") + formatUSD(Math.abs(d)).replace("-", ""),
          cumulative: cum,
          fill: d >= 0 ? POS : NEG,
          isAnchor: false,
          gross: d,
          realization: 100,
        });
      }
      rows.push({ name: "Total Δ", base: 0, delta: cum, range: [0, cum], signed: cum, label: formatUSD(cum), cumulative: cum, fill: ANCHOR, isAnchor: true, gross: cum, realization: 100 });
      return rows;
    }

    let cum = rollup.baseline;
    rows.push({ name: "Total Baseline", base: 0, delta: cum, range: [0, cum], signed: cum, label: formatUSD(cum), cumulative: cum, fill: ANCHOR, isAnchor: true, gross: cum, realization: 100 });
    if (rollup.headwinds !== 0) {
      const d = rollup.headwinds; const start = cum; cum += d;
      rows.push({ name: "Headwinds", base: cum, delta: Math.abs(d), range: [cum, start], signed: d, label: "−" + formatUSD(Math.abs(d)).replace("-", ""), cumulative: cum, fill: NEG, isAnchor: false, gross: d, realization: 100 });
    }
    if (rollup.gains !== 0) {
      const d = rollup.gains; const start = cum; cum += d;
      rows.push({ name: "Gains", base: start, delta: Math.abs(d), range: [start, cum], signed: d, label: "+" + formatUSD(Math.abs(d)), cumulative: cum, fill: POS, isAnchor: false, gross: d, realization: 100 });
    }
    const target = rollup.statedTarget ?? cum;
    rows.push({ name: "Total Target", base: 0, delta: target, range: [0, target], signed: target, label: formatUSD(target), cumulative: target, fill: ANCHOR, isAnchor: true, gross: target, realization: 100 });

    return rows;
  }, [rollup, rollupMode, moneyPrefs.unit, moneyPrefs.decimals]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-muted-foreground">{bridges.length} bridge(s)</div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <Switch checked={riskAdjusted} onCheckedChange={onRiskAdjusted} id="wf-risk-all" />
          <Label htmlFor="wf-risk-all" className="text-xs">Risk-adjusted</Label>
        </div>
      </div>

      {rollup && rollup.count > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Portfolio rollup · {rollup.count} bridges</div>
              <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                Total waterfall <span className="text-xs font-normal text-muted-foreground">— {rollupMode === "sum" ? "sum of components" : "Δ by bridge"}</span>
                <NumberFormatMenu variant="inline" />
              </h2>
              <div className="mt-2 inline-flex rounded-md border bg-muted/30 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => onRollupMode("sum")}
                  className={`px-2.5 py-1 rounded ${rollupMode === "sum" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                >
                  Sum
                </button>
                <button
                  type="button"
                  onClick={() => onRollupMode("delta")}
                  className={`px-2.5 py-1 rounded ${rollupMode === "delta" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                >
                  Delta
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Kpi label="Baseline" value={formatUSD(rollup.baseline)} />
              <Kpi label="Headwinds" value={formatUSD(rollup.headwinds)} tone="neg" />
              <Kpi label="Gains" value={formatUSD(rollup.gains)} tone="pos" />
              <Kpi label="Net Δ" value={formatUSD(rollup.net)} tone={rollup.net >= 0 ? "pos" : "neg"} />
              <Kpi
                label={rollup.statedTarget == null ? "Computed target" : "Computed vs stated"}
                value={rollup.statedTarget == null
                  ? formatUSD(rollup.computedTarget)
                  : `${formatUSD(rollup.computedTarget)} / ${formatUSD(rollup.statedTarget)}`}
              />
            </div>
          </div>
          <div className="mt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rollupChart} margin={{ top: 24, right: 16, left: 8, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatUSD(Number(v))} width={72} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="range" isAnimationActive={false} radius={[2, 2, 0, 0]} minPointSize={2}>
                  {rollupChart.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  <LabelList dataKey="label" position="center" style={{ fontSize: 11, fontWeight: 600, fill: "#ffffff" }} />
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {bridges.map((b) => {
          const its = itemsByBridge.get(b.id) ?? [];
          const data = buildChartData(b, its);
          const s = bridgeSummary(b, its);
          return (
            <section key={b.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {metricTitle(b)} · {b.start_period || "—"} → {b.end_period || "—"}
                    {b.archived_at ? " · archived" : ""}
                  </div>
                  <button className="text-sm font-semibold hover:underline" onClick={() => onOpen(b.id)}>
                    {b.title}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <NumberFormatMenu variant="inline" />
                  <div className="text-right text-xs">
                    <div className="text-muted-foreground">Net Δ</div>
                    <div className={`font-semibold tabular-nums ${s.net >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatUSD(s.net)}</div>
                  </div>
                </div>
              </div>
              {its.length === 0 ? (
                <div className="mt-3 flex h-64 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  All levers in this bridge are not started
                </div>
              ) : (
              <div className="mt-3 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={64} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatUSD(Number(v))} width={64} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Bar dataKey="range" isAnimationActive={false} radius={[2, 2, 0, 0]} minPointSize={2}>
                      {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      <LabelList dataKey="label" position="center" style={{ fontSize: 10, fontWeight: 600, fill: "#ffffff" }} />
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>
              </div>
              )}

            </section>
          );
        })}
      </div>
    </div>
  );
}



function Kpi({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | "warn" }) {
  const color = tone === "pos" ? "text-emerald-500" : tone === "neg" ? "text-red-500" : tone === "warn" ? "text-amber-500" : "";
  return (
    <div className="rounded-lg border p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function BridgeDialog({
  bridge, onClose, onSave, saving,
}: {
  bridge: Bridge | null;
  onClose: () => void;
  onSave: (p: Partial<Bridge> & { id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Bridge>>(() => bridge ?? {
    title: "", metric: "ebit", baseline_value: 0, baseline_label: "Baseline",
    target_label: "Target", currency: "USD",
  } as Partial<Bridge>);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{bridge ? "Edit bridge" : "New bridge"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Title">
            <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="3-Year EBIT Expansion" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Metric">
              <Select value={form.metric ?? "ebit"} onValueChange={(v) => setForm({ ...form, metric: v as Metric })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
                    <SelectItem key={m} value={m}>{METRIC_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Owner">
              <OwnerSelect value={form.owner_id ?? null} onChange={(v) => setForm({ ...form, owner_id: v })} />
            </Field>
          </div>
          {form.metric === "other" && (
            <Field label="Custom metric name">
              <Input value={form.metric_label ?? ""} onChange={(e) => setForm({ ...form, metric_label: e.target.value })} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Baseline label">
              <Input value={form.baseline_label ?? ""} onChange={(e) => setForm({ ...form, baseline_label: e.target.value })} />
            </Field>
            <Field label="Baseline value ($)">
              <Input type="number" value={form.baseline_value ?? 0} onChange={(e) => setForm({ ...form, baseline_value: Number(e.target.value) })} />
            </Field>
            <Field label="Target label">
              <Input value={form.target_label ?? ""} onChange={(e) => setForm({ ...form, target_label: e.target.value })} />
            </Field>
            <Field label="Target value ($, optional)">
              <Input type="number" value={form.target_value ?? ""} onChange={(e) => setForm({ ...form, target_value: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Start period (label)">
              <Input value={form.start_period ?? ""} onChange={(e) => setForm({ ...form, start_period: e.target.value })} placeholder="FY25" />
            </Field>
            <Field label="End period (label)">
              <Input value={form.end_period ?? ""} onChange={(e) => setForm({ ...form, end_period: e.target.value })} placeholder="FY28" />
            </Field>
            <Field label="Start month">
              <Input type="month" value={toMonthInput(form.start_date)} onChange={(e) => setForm({ ...form, start_date: fromMonthInput(e.target.value) })} />
            </Field>
            <Field label="End month">
              <Input type="month" value={toMonthInput(form.end_date)} onChange={(e) => setForm({ ...form, end_date: fromMonthInput(e.target.value) })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.title} onClick={() => onSave({ ...form, id: bridge?.id })}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({
  item, bridgeId, nextSort, themes, onClose, onSave, saving,
}: {
  item: Item | null;
  bridgeId: string;
  nextSort: number;
  themes: Theme[];
  onClose: () => void;
  onSave: (p: Partial<Item> & { id?: string; bridge_id?: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Item>>(() => item ?? {
    label: "", category: "organic_growth", gross_impact: 0, realization_pct: 100, sort_order: nextSort,
    strategic_theme_id: null,
  } as Partial<Item>);

  const selectValue = form.strategic_theme_id
    ? `theme:${form.strategic_theme_id}`
    : `cat:${form.category ?? "organic_growth"}`;

  function onCategoryChange(v: string) {
    if (v.startsWith("theme:")) {
      setForm({ ...form, strategic_theme_id: v.slice(6), category: "new_strategy" });
    } else {
      setForm({ ...form, strategic_theme_id: null, category: v.slice(4) as Category });
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Edit lever" : "Add lever"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Label">
            <Input value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Pricing Optimization" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={selectValue} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-full min-w-0"><SelectValue className="truncate" /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</div>
                  {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                    <SelectItem key={`cat:${c}`} value={`cat:${c}`}>{CATEGORY_META[c].label}</SelectItem>
                  ))}
                  {themes.length > 0 && (
                    <>
                      <div className="mt-1 border-t px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strategic themes</div>
                      {themes.map((t) => (
                        <SelectItem key={`theme:${t.id}`} value={`theme:${t.id}`}>{t.title}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Gross impact ($, signed)">
              <Input type="number" value={form.gross_impact ?? 0} onChange={(e) => setForm({ ...form, gross_impact: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label={`Realization: ${Number(form.realization_pct ?? 100).toFixed(0)}%`}>
            <Slider
              min={0} max={100} step={5}
              value={[Number(form.realization_pct ?? 100)]}
              onValueChange={(v) => setForm({ ...form, realization_pct: v[0] })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Owner">
              <OwnerSelect value={form.owner_id ?? null} onChange={(v) => setForm({ ...form, owner_id: v })} />
            </Field>
            <Field label="Program manager">
              <Input value={form.program_manager ?? ""} onChange={(e) => setForm({ ...form, program_manager: e.target.value })} />
            </Field>
            <Field label="Tracking KPI">
              <Input value={form.kpi ?? ""} onChange={(e) => setForm({ ...form, kpi: e.target.value })} />
            </Field>
            <Field label="Milestone quarter (label)">
              <Input value={form.milestone_quarter ?? ""} onChange={(e) => setForm({ ...form, milestone_quarter: e.target.value })} placeholder="Q2 FY26" />
            </Field>
            <Field label="Target month">
              <Input type="month" value={toMonthInput(form.target_month)} onChange={(e) => setForm({ ...form, target_month: fromMonthInput(e.target.value) })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.label} onClick={() => onSave({ ...form, id: item?.id, bridge_id: bridgeId })}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function ItemActionsDialog({
  item, onClose, onChanged,
}: {
  item: { id: string; label: string };
  onClose: () => void;
  onChanged?: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [due, setDue] = useState<string>("");

  const actionsQ = useQuery({
    queryKey: ["waterfall-item-actions", item.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objective_actions")
        .select("id,title,owner_id,due_date,status,archived_at")
        .eq("waterfall_item_id", item.id)
        .is("archived_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WfAction[];
    },
  });

  const { data: profiles = [] } = useProfiles();
  const profMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const addAction = useMutation({
    mutationFn: async () => {
      const { data: user } = await getCurrentUser();
      const { error } = await (supabase as any).from("objective_actions").insert({
        title,
        owner_id: ownerId,
        due_date: due || null,
        status: "open",
        waterfall_item_id: item.id,
        objective_id: null,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setOwnerId(null); setDue("");
      actionsQ.refetch();
      onChanged?.();
      toast.success("Action added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAction = useMutation({
    mutationFn: async (payload: { id: string; patch: Partial<WfAction> }) => {
      const { error } = await (supabase as any).from("objective_actions").update(payload.patch).eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => { actionsQ.refetch(); onChanged?.(); },
  });

  const removeAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("objective_actions").update({ archived_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { actionsQ.refetch(); onChanged?.(); },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Actions · {item.label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_180px_140px_auto] gap-2">
            <Input placeholder="New action…" value={title} onChange={(e) => setTitle(e.target.value)} />
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <Button size="sm" disabled={!title || addAction.isPending} onClick={() => addAction.mutate()}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto rounded border">
            {(actionsQ.data ?? []).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No actions yet.</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(actionsQ.data ?? []).map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="p-2">
                        <Select value={a.status} onValueChange={(v) => updateAction.mutate({ id: a.id, patch: { status: v as WfAction["status"] } })}>
                          <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 font-medium">{a.title}</td>
                      <td className="p-2 text-xs text-muted-foreground">{a.owner_id ? ownerLabel(profMap.get(a.owner_id)) : "—"}</td>
                      <td className="p-2 text-xs">{a.due_date ?? "—"}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeAction.mutate(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type HandleProps = Record<string, any>;

function SortableLeverRow({
  id,
  children,
}: {
  id: string;
  children: (handleProps: HandleProps) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-b last:border-0 hover:bg-muted/40 ${isDragging ? "relative z-10 bg-muted/60 shadow-sm" : ""}`}
    >
      {children({ ...attributes, ...listeners })}
    </tr>
  );
}
