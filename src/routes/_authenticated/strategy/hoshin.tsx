import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Archive, ArchiveRestore, Download } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { ImportFromFoundationDialog } from "@/components/strategy/import-from-foundation-dialog";
import { confirmThen } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/strategy/hoshin")({
  head: () => ({ meta: [{ title: "Hoshin Kanri — DO.Impact" }] }),
  component: HoshinPage,
});

type Kind = "long_term" | "annual" | "priority" | "kpi";
type Strength = "strong" | "weak";

type Item = {
  id: string;
  kind: Kind;
  title: string;
  description: string | null;
  owner_id: string | null;
  target_value: string | null;
  current_value: string | null;
  horizon: string | null;
  sort_order: number;
  archived_at: string | null;
};
type Correlation = { id: string; from_id: string; to_id: string; strength: Strength };

const KIND_META: Record<Kind, { label: string; short: string; color: string; position: string }> = {
  long_term: { label: "Long-term Breakthrough (3–5 yr)", short: "Long-term", color: "hsl(220 70% 50%)", position: "South" },
  annual: { label: "Annual Objectives", short: "Annual", color: "hsl(150 60% 40%)", position: "West" },
  priority: { label: "Improvement Priorities", short: "Priority", color: "hsl(30 90% 50%)", position: "North" },
  kpi: { label: "KPIs / Targets to Improve", short: "KPI", color: "hsl(280 60% 50%)", position: "East" },
};

function HoshinPage() {
  const [showArchived, setShowArchived] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["hoshin_items", showArchived],
    queryFn: async () => {
      let q = supabase.from("hoshin_items").select("*").order("sort_order").order("created_at");
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const { data: correlations = [] } = useQuery({
    queryKey: ["hoshin_correlations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hoshin_correlations").select("*");
      if (error) throw error;
      return (data ?? []) as Correlation[];
    },
  });

  const byKind = useMemo(() => {
    const g: Record<Kind, Item[]> = { long_term: [], annual: [], priority: [], kpi: [] };
    for (const it of items) g[it.kind].push(it);
    return g;
  }, [items]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--color-accent)]">
            Strategy Deployment
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Hoshin Kanri X-Matrix</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Align long-term breakthroughs, annual objectives, improvement priorities and KPIs on a single
            page. Click any cell in the matrix to mark a strong (●) or weak (○) correlation between two items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportFromFoundationDialog>
            <Button size="sm" variant="outline">
              <Download className="mr-1 h-4 w-4" /> Import from Foundation
            </Button>
          </ImportFromFoundationDialog>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>
      </div>

      <XMatrix
        longTerm={byKind.long_term}
        annual={byKind.annual}
        priorities={byKind.priority}
        kpis={byKind.kpi}
        correlations={correlations}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ItemPanel kind="long_term" items={byKind.long_term} />
        <ItemPanel kind="annual" items={byKind.annual} />
        <ItemPanel kind="priority" items={byKind.priority} />
        <ItemPanel kind="kpi" items={byKind.kpi} />
      </div>
    </div>
  );
}

/* -------------------- X-Matrix -------------------- */

function XMatrix({
  longTerm,
  annual,
  priorities,
  kpis,
  correlations,
}: {
  longTerm: Item[];
  annual: Item[];
  priorities: Item[];
  kpis: Item[];
  correlations: Correlation[];
}) {
  const qc = useQueryClient();
  const activeLT = longTerm.filter((i) => !i.archived_at);
  const activeAn = annual.filter((i) => !i.archived_at);
  const activePr = priorities.filter((i) => !i.archived_at);
  const activeKp = kpis.filter((i) => !i.archived_at);

  const corrMap = useMemo(() => {
    const m = new Map<string, Strength>();
    for (const c of correlations) {
      const key = [c.from_id, c.to_id].sort().join("|");
      m.set(key, c.strength);
    }
    return m;
  }, [correlations]);

  const cycle = useMutation({
    mutationFn: async ({ a, b, current }: { a: string; b: string; current: Strength | undefined }) => {
      const [from, to] = [a, b].sort();
      if (current === "strong") {
        const { error } = await supabase
          .from("hoshin_correlations")
          .delete()
          .eq("from_id", from)
          .eq("to_id", to);
        if (error) throw error;
      } else if (current === "weak") {
        const { error } = await supabase
          .from("hoshin_correlations")
          .update({ strength: "strong" })
          .eq("from_id", from)
          .eq("to_id", to);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hoshin_correlations")
          .insert({ from_id: from, to_id: to, strength: "weak" });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hoshin_correlations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const Dot = ({ strength }: { strength?: Strength }) => {
    if (strength === "strong") return <span className="block h-3 w-3 rounded-full bg-foreground shadow-[0_0_0_3px_hsl(var(--background))]" />;
    if (strength === "weak") return <span className="block h-3 w-3 rounded-full border-[2px] border-foreground/70" />;
    return <span className="block h-1 w-1 rounded-full bg-border opacity-0 transition-opacity group-hover/cell:opacity-100" />;
  };

  const DotCell = ({ a, b }: { a: string; b: string }) => {
    const key = [a, b].sort().join("|");
    const val = corrMap.get(key);
    return (
      <button
        onClick={() => cycle.mutate({ a, b, current: val })}
        className="group/cell flex h-11 w-full items-center justify-center transition-colors hover:bg-foreground/[0.04]"
        title="Click to cycle: none → weak → strong → none"
      >
        <Dot strength={val} />
      </button>
    );
  };

  const priCols = Math.max(activePr.length, 1);

  const cornerBadge = (label: string, dir: "N" | "S" | "E" | "W", color: string) => (
    <div
      className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm"
      style={{ background: color }}
    >
      <span className="grid h-4 w-4 place-items-center rounded-sm bg-white/20 text-[9px] font-black">{dir}</span>
      {label}
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Strategy Execution</p>
          <h3 className="mt-0.5 text-base font-bold tracking-tight">Correlation Matrix</h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-foreground" /> Strong</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-[2px] border-foreground/70" /> Weak</span>
          <span className="hidden text-muted-foreground sm:inline">Click any cell to cycle</span>
        </div>
      </div>

      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="border-collapse" style={{ minWidth: 900, width: "100%" }}>
          <tbody>
            {/* NORTH header band */}
            <tr>
              <td className="w-56" />
              <td colSpan={priCols} className="pb-2 text-center">
                {cornerBadge("North · Improvement Priorities", "N", KIND_META.priority.color)}
              </td>
              <td className="w-56" />
            </tr>

            {/* NORTH: vertical priority labels */}
            <tr>
              <td />
              {activePr.length === 0 ? (
                <td className="border border-dashed border-border bg-muted/20 p-3 text-center text-xs italic text-muted-foreground">
                  Add improvement priorities to populate columns
                </td>
              ) : (
                activePr.map((p, i) => (
                  <td
                    key={p.id}
                    className="border-b-2 border-border bg-orange-50/40 align-bottom dark:bg-orange-950/15"
                    style={{
                      width: 56,
                      minWidth: 52,
                      height: 150,
                      borderLeft: "1px solid var(--border)",
                      borderRight: i === activePr.length - 1 ? "1px solid var(--border)" : undefined,
                      borderTop: "1px solid var(--border)",
                    }}
                    title={p.title}
                  >
                    <div className="flex h-full items-end justify-center px-1 pb-2">
                      <div className="[writing-mode:vertical-rl] rotate-180 max-h-[130px] overflow-hidden text-[11px] font-semibold leading-tight text-foreground">
                        {p.title}
                      </div>
                    </div>
                  </td>
                ))
              )}
              <td />
            </tr>

            {/* WEST + EAST header row */}
            <tr>
              <td className="pt-4 pb-2 text-right">
                {cornerBadge("West · Annual Objectives", "W", KIND_META.annual.color)}
              </td>
              <td colSpan={priCols} />
              <td className="pt-4 pb-2 pl-3">
                {cornerBadge("East · KPIs / Targets", "E", KIND_META.kpi.color)}
              </td>
            </tr>

            {/* ANNUAL rows */}
            {activeAn.length === 0 ? (
              <tr>
                <td colSpan={2 + priCols} className="border border-dashed border-border bg-muted/20 p-4 text-center text-xs italic text-muted-foreground">
                  Add annual objectives to see correlations
                </td>
              </tr>
            ) : (
              activeAn.map((an, rowIdx) => (
                <tr key={an.id} className="group/row">
                  <td
                    className="bg-emerald-50/50 px-3 py-2 text-right align-middle text-[12px] font-semibold leading-tight text-emerald-900 transition-colors group-hover/row:bg-emerald-100/70 dark:bg-emerald-950/20 dark:text-emerald-100 dark:group-hover/row:bg-emerald-900/30"
                    style={{
                      borderTop: rowIdx === 0 ? "1px solid var(--border)" : undefined,
                      borderBottom: "1px solid var(--border)",
                      borderLeft: "1px solid var(--border)",
                      borderRight: "1px solid var(--border)",
                    }}
                  >
                    <span className="line-clamp-2 block" title={an.title}>{an.title}</span>
                  </td>
                  {activePr.length === 0 ? (
                    <td />
                  ) : (
                    activePr.map((p, ci) => (
                      <td
                        key={p.id}
                        className="p-0 transition-colors group-hover/row:bg-muted/30"
                        style={{
                          borderLeft: "1px solid var(--border)",
                          borderRight: ci === activePr.length - 1 ? "1px solid var(--border)" : undefined,
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <DotCell a={an.id} b={p.id} />
                      </td>
                    ))
                  )}
                  <td />
                </tr>
              ))
            )}

            {/* EAST KPI list — one panel spanning */}
            {activeKp.length > 0 && activeAn.length > 0 && (
              <tr>
                <td />
                <td colSpan={priCols} />
                <td className="pl-3 pt-2">
                  <div className="rounded-lg border border-purple-200/70 bg-purple-50/40 p-2 dark:border-purple-800/60 dark:bg-purple-950/20">
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300">KPI Catalog</p>
                    <div className="space-y-1">
                      {activeKp.map((k) => (
                        <div key={k.id} className="rounded-md bg-white/70 px-2 py-1 text-[11px] shadow-sm dark:bg-background/40">
                          <div className="font-semibold leading-tight text-purple-900 dark:text-purple-100" title={k.title}>{k.title}</div>
                          {(k.target_value || k.current_value) && (
                            <div className="text-[10px] text-muted-foreground">
                              {k.current_value ?? "—"} <span className="opacity-40">/</span> {k.target_value ?? "—"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* SOUTH header band */}
            {activeLT.length > 0 && (
              <>
                <tr>
                  <td className="pt-6 pb-2 text-right">
                    {cornerBadge("South · Long-term Breakthrough", "S", KIND_META.long_term.color)}
                  </td>
                  <td colSpan={priCols} />
                  <td />
                </tr>

                {activeLT.map((lt, rowIdx) => (
                  <tr key={lt.id} className="group/row">
                    <td
                      className="bg-blue-50/50 px-3 py-2 text-right align-middle text-[12px] font-semibold leading-tight text-blue-900 transition-colors group-hover/row:bg-blue-100/70 dark:bg-blue-950/20 dark:text-blue-100 dark:group-hover/row:bg-blue-900/30"
                      style={{
                        borderTop: rowIdx === 0 ? "1px solid var(--border)" : undefined,
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                      }}
                    >
                      <span className="line-clamp-2 block" title={lt.title}>{lt.title}</span>
                    </td>
                    {activePr.map((p, ci) => (
                      <td
                        key={p.id}
                        className="p-0 transition-colors group-hover/row:bg-muted/30"
                        style={{
                          borderLeft: "1px solid var(--border)",
                          borderRight: ci === activePr.length - 1 ? "1px solid var(--border)" : undefined,
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <DotCell a={lt.id} b={p.id} />
                      </td>
                    ))}
                    <td
                      className="bg-purple-50/30 p-2 align-middle dark:bg-purple-950/15"
                      style={{
                        borderTop: rowIdx === 0 ? "1px solid var(--border)" : undefined,
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex flex-wrap gap-1">
                        {activeKp.length === 0 && (
                          <span className="text-[10px] italic text-muted-foreground">Add KPIs</span>
                        )}
                        {activeKp.map((k) => {
                          const key = [lt.id, k.id].sort().join("|");
                          const val = corrMap.get(key);
                          return (
                            <button
                              key={k.id}
                              onClick={() => cycle.mutate({ a: lt.id, b: k.id, current: val })}
                              className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-2 py-0.5 text-[10px] font-medium text-purple-900 shadow-sm transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-background dark:text-purple-100 dark:hover:bg-purple-900/40"
                              title={`${lt.title} ↔ ${k.title}`}
                            >
                              <span className="max-w-[90px] truncate">{k.title}</span>
                              {val === "strong" && <span className="h-2 w-2 rounded-full bg-foreground" />}
                              {val === "weak" && <span className="h-2 w-2 rounded-full border-[1.5px] border-foreground/70" />}
                              {!val && <span className="h-2 w-2 rounded-full border border-dashed border-border" />}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Item panel + CRUD -------------------- */

function ItemPanel({ kind, items }: { kind: Kind; items: Item[] }) {
  const meta = KIND_META[kind];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
          <h2 className="text-lg font-semibold">{meta.label}</h2>
        </div>
        <ItemDialog kind={kind}>
          <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </ItemDialog>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing added yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const owner = profiles.find((p) => p.id === item.owner_id);

  const archive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("hoshin_items")
        .update({ archived_at: item.archived_at ? null : new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hoshin_items"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hoshin_items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hoshin_items"] });
      qc.invalidateQueries({ queryKey: ["hoshin_correlations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className={`rounded-lg border border-border bg-background p-3 ${item.archived_at ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{item.title}</div>
          {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {item.horizon && <span>Horizon: {item.horizon}</span>}
            {(item.target_value || item.current_value) && (
              <span>
                Value: <b className="text-foreground">{item.current_value ?? "—"}</b> / target {item.target_value ?? "—"}
              </span>
            )}
            <span>Owner: {ownerLabel(owner)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ItemDialog kind={item.kind} existing={item}>
            <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
          </ItemDialog>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => archive.mutate()}>
            {item.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => confirmThen("Delete this item? Correlations linked to it will also be removed.", () => del.mutate())}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function ItemDialog({
  kind,
  existing,
  children,
}: {
  kind: Kind;
  existing?: Item;
  children: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    owner_id: existing?.owner_id ?? null,
    target_value: existing?.target_value ?? "",
    current_value: existing?.current_value ?? "",
    horizon: existing?.horizon ?? "",
    kind: existing?.kind ?? kind,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        kind: form.kind,
        title: form.title.trim(),
        description: form.description || null,
        owner_id: form.owner_id,
        target_value: form.target_value || null,
        current_value: form.current_value || null,
        horizon: form.horizon || null,
      };
      if (!payload.title) throw new Error("Title is required");
      if (existing) {
        const { error } = await supabase.from("hoshin_items").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hoshin_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hoshin_items"] });
      setOpen(false);
      toast.success(existing ? "Updated" : "Created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit" : "New"} {KIND_META[form.kind].short}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as Kind })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Owner</label>
              <OwnerSelect value={form.owner_id} onChange={(v) => setForm({ ...form, owner_id: v })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Horizon (e.g. 2027, FY26)</label>
              <Input value={form.horizon ?? ""} onChange={(e) => setForm({ ...form, horizon: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Current value</label>
              <Input value={form.current_value ?? ""} onChange={(e) => setForm({ ...form, current_value: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Target value</label>
              <Input value={form.target_value ?? ""} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
