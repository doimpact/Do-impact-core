import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { OwnerSelect } from "@/components/owner-select";
import { Plus, Trash2, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { assertWrote } from "@/lib/write-guard";
import type {
  EolProgram, EolChecklistItem, EolReadinessItem, EolLtbItem, EolAssetItem, EolMigrationItem, EolPhase,
} from "./types";
import {
  PHASE_LABELS, PHASE_COLORS, HEALTH_COLORS, EOL_STATUS_LABELS, RISK_TIER_LABELS, HOLDING_LABELS,
  DISPOSITION_LABELS, ASSET_STATUS_LABELS, MIGRATION_STATUS_LABELS, READINESS_DOMAINS, money, pct, eolKpis,
} from "./types";

const PHASES: EolPhase[] = [1, 2, 3, 4, 5];

export function EolProgramDialog({ program, onClose }: { program: EolProgram; onClose: () => void }) {
  const qc = useQueryClient();
  const [phaseTab, setPhaseTab] = useState<EolPhase>(program.phase);
  const [newItem, setNewItem] = useState("");

  useEffect(() => { setPhaseTab(program.phase); }, [program.phase]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["eol_programs"] });
    qc.invalidateQueries({ queryKey: ["eol_checklist_all"] });
    for (const k of ["eol_checklist", "eol_readiness", "eol_ltb", "eol_assets", "eol_migration"]) {
      qc.invalidateQueries({ queryKey: [k, program.id] });
    }
  };

  const checklistQ = useQuery({
    queryKey: ["eol_checklist", program.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("eol_gate_checklist")
        .select("*").eq("program_id", program.id).order("phase").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EolChecklistItem[];
    },
  });

  const readinessQ = useQuery({
    queryKey: ["eol_readiness", program.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("eol_readiness")
        .select("*").eq("program_id", program.id).order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EolReadinessItem[];
    },
  });

  const ltbQ = useQuery({
    queryKey: ["eol_ltb", program.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("eol_ltb_items")
        .select("*").eq("program_id", program.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as EolLtbItem[];
    },
  });

  const assetsQ = useQuery({
    queryKey: ["eol_assets", program.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("eol_asset_disposition")
        .select("*").eq("program_id", program.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as EolAssetItem[];
    },
  });

  const migrationQ = useQuery({
    queryKey: ["eol_migration", program.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("eol_customer_migration")
        .select("*").eq("program_id", program.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as EolMigrationItem[];
    },
  });

  const patchProgram = useMutation({
    mutationFn: async (patch: Partial<EolProgram>) => {
      const { data, error } = await supabase.from("eol_programs").update(patch as never).eq("id", program.id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const rowMutation = <T,>(table: "eol_gate_checklist" | "eol_readiness" | "eol_ltb_items" | "eol_asset_disposition" | "eol_customer_migration") => ({
    add: async (values: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert({ ...values, program_id: program.id } as never).select("id");
      if (error) throw error;
      assertWrote(data, "insert");
    },
    patch: async (id: string, values: Partial<T>) => {
      const { data, error } = await supabase.from(table).update(values as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    remove: async (id: string) => {
      const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
  });

  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => { await fn(); },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const go = (fn: () => Promise<void>) => run.mutate(fn);

  const checklist = checklistQ.data ?? [];
  const readiness = readinessQ.data ?? [];
  const ltb = ltbQ.data ?? [];
  const assets = assetsQ.data ?? [];
  const migration = migrationQ.data ?? [];
  const k = eolKpis(program, ltb, assets, migration);

  const cl = rowMutation<EolChecklistItem>("eol_gate_checklist");
  const rd = rowMutation<EolReadinessItem>("eol_readiness");
  const lt = rowMutation<EolLtbItem>("eol_ltb_items");
  const ad = rowMutation<EolAssetItem>("eol_asset_disposition");
  const cm = rowMutation<EolMigrationItem>("eol_customer_migration");

  const phaseItems = checklist.filter((c) => c.phase === phaseTab);
  const phasePct = phaseItems.length ? Math.round((phaseItems.filter((c) => c.completed).length / phaseItems.length) * 100) : 0;

  const advance = () => {
    if (program.phase >= 5) return;
    const current = checklist.filter((c) => c.phase === program.phase);
    const open = current.filter((c) => !c.completed).length;
    if (open > 0 && !window.confirm(`${open} item(s) in ${PHASE_LABELS[program.phase].code} are still open. Advance anyway?`)) return;
    patchProgram.mutate({ phase: (program.phase + 1) as EolPhase });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <Badge className={PHASE_COLORS[program.phase]}>{PHASE_LABELS[program.phase].code}</Badge>
            {program.product_name}
            {program.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_COLORS[program.health])} />}
            <Button size="sm" variant="outline" className="ml-auto" onClick={advance} disabled={program.phase >= 5}>
              Advance phase <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gates">
          <TabsList className="flex-wrap">
            <TabsTrigger value="gates">Gate checklist</TabsTrigger>
            <TabsTrigger value="readiness">Readiness matrix</TabsTrigger>
            <TabsTrigger value="ltb">Last Time Buy</TabsTrigger>
            <TabsTrigger value="assets">Asset disposition</TabsTrigger>
            <TabsTrigger value="migration">Customer migration</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Gate checklist */}
          <TabsContent value="gates" className="space-y-3 pt-3">
            <div className="flex flex-wrap gap-1">
              {PHASES.map((g) => (
                <button
                  key={g}
                  onClick={() => setPhaseTab(g)}
                  className={cn("rounded-md border px-2 py-1 text-xs", phaseTab === g ? "border-primary bg-primary/10 font-semibold" : "text-muted-foreground")}
                >
                  {PHASE_LABELS[g].code} — {PHASE_LABELS[g].short}
                </button>
              ))}
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="font-semibold">{PHASE_LABELS[phaseTab].full} <span className="font-normal text-muted-foreground">· {PHASE_LABELS[phaseTab].window}</span></div>
              <p className="mt-1 text-muted-foreground">{PHASE_LABELS[phaseTab].blurb}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Phase progress</span><span>{phasePct}%</span></div>
              <Progress value={phasePct} className="h-1.5" />
            </div>
            <div className="space-y-2">
              {phaseItems.map((it) => (
                <div key={it.id} className="rounded-lg border p-2">
                  <div className="flex items-start gap-1">
                    <label className="flex flex-1 cursor-pointer items-start gap-3 rounded-md p-1.5 hover:bg-muted/50">
                      <Checkbox
                        className="mt-0.5 h-5 w-5 shrink-0"
                        aria-label={it.label}
                        checked={it.completed}
                        onCheckedChange={(v) => go(() => cl.patch(it.id, {
                          completed: v === true,
                          completed_at: v === true ? new Date().toISOString() : null,
                        } as Partial<EolChecklistItem>))}
                      />
                      <span className={cn("flex-1 text-sm", it.completed && "text-muted-foreground line-through")}>{it.label}</span>
                    </label>
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => go(() => cl.remove(it.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Evidence link"
                      defaultValue={it.evidence_url ?? ""}
                      onBlur={(e) => e.target.value !== (it.evidence_url ?? "") && go(() => cl.patch(it.id, { evidence_url: e.target.value || null } as Partial<EolChecklistItem>))}
                    />
                    <Input
                      placeholder="Notes"
                      defaultValue={it.notes ?? ""}
                      onBlur={(e) => e.target.value !== (it.notes ?? "") && go(() => cl.patch(it.id, { notes: e.target.value || null } as Partial<EolChecklistItem>))}
                    />
                  </div>
                </div>
              ))}
              {phaseItems.length === 0 && <EmptyRow text="No checklist items in this phase yet." />}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add checklist item" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
              <Button
                onClick={() => {
                  if (!newItem.trim()) return;
                  const label = newItem.trim();
                  setNewItem("");
                  go(() => cl.add({ phase: phaseTab, label, sort_order: phaseItems.length + 1 } as Partial<EolChecklistItem>));
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </TabsContent>

          {/* Readiness matrix */}
          <TabsContent value="readiness" className="space-y-3 pt-3">
            {READINESS_DOMAINS.map((dom) => {
              const rows = readiness.filter((r) => r.domain === dom);
              if (rows.length === 0) return null;
              return (
                <div key={dom} className="rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2 text-sm font-semibold">
                    {dom}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {rows.filter((r) => r.complete).length}/{rows.length} deliverables
                    </span>
                  </div>
                  <div className="divide-y">
                    {rows.map((r) => (
                      <div key={r.id} className="grid items-center gap-2 p-2 md:grid-cols-[1fr_180px_130px_auto]">
                        <label className="flex cursor-pointer items-center gap-3 rounded-md p-1.5 hover:bg-muted/50">
                          <Checkbox
                            className="h-5 w-5 shrink-0"
                            aria-label={r.deliverable}
                            checked={r.complete}
                            onCheckedChange={(v) => go(() => rd.patch(r.id, { complete: v === true } as Partial<EolReadinessItem>))}
                          />
                          <span className={cn("text-sm", r.complete && "text-muted-foreground line-through")}>{r.deliverable}</span>
                        </label>
                        <OwnerSelect value={r.owner_id} onChange={(v) => go(() => rd.patch(r.id, { owner_id: v } as Partial<EolReadinessItem>))} />
                        <Select value={r.rag ?? "none"} onValueChange={(v) => go(() => rd.patch(r.id, { rag: v === "none" ? null : (v as "green") } as Partial<EolReadinessItem>))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">RAG —</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="yellow">Yellow</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => go(() => rd.remove(r.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <AddRow
              fields={[
                { key: "domain", label: "Domain", type: "select", options: READINESS_DOMAINS.map((d) => ({ value: d, label: d })) },
                { key: "deliverable", label: "Deliverable", type: "text" },
              ]}
              onAdd={(v) => go(() => rd.add({ domain: String(v.domain ?? READINESS_DOMAINS[0]), deliverable: String(v.deliverable ?? "") } as Partial<EolReadinessItem>))}
            />
          </TabsContent>

          {/* LTB */}
          <TabsContent value="ltb" className="space-y-3 pt-3">
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <Stat label="Committed LTB spend" value={money(k.ltbSpend, program.currency)} />
              <Stat label="Forecast vs consumed variance" value={pct(k.ltbVariance)} tone={k.ltbVariance != null && Math.abs(k.ltbVariance) > 5 ? "bad" : "good"} />
              <Stat label="Lines" value={String(ltb.length)} />
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs">
                  <tr>
                    <th className="p-2 text-left">Part</th>
                    <th className="p-2 text-left">Risk tier</th>
                    <th className="p-2 text-left">Holding</th>
                    <th className="p-2 text-right">Forecast</th>
                    <th className="p-2 text-right">Ordered</th>
                    <th className="p-2 text-right">Consumed</th>
                    <th className="p-2 text-right">Unit cost</th>
                    <th className="p-2 text-right">Extended</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ltb.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-1">
                        <Input className="h-8" defaultValue={r.part_number} onBlur={(e) => e.target.value !== r.part_number && go(() => lt.patch(r.id, { part_number: e.target.value } as Partial<EolLtbItem>))} />
                      </td>
                      <td className="p-1">
                        <Select value={r.risk_tier} onValueChange={(v) => go(() => lt.patch(r.id, { risk_tier: v } as Partial<EolLtbItem>))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(RISK_TIER_LABELS).map(([k2, l]) => <SelectItem key={k2} value={k2}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="p-1">
                        <Select value={r.holding_strategy} onValueChange={(v) => go(() => lt.patch(r.id, { holding_strategy: v } as Partial<EolLtbItem>))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(HOLDING_LABELS).map(([k2, l]) => <SelectItem key={k2} value={k2}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <NumCell v={r.forecast_qty} onSave={(n) => go(() => lt.patch(r.id, { forecast_qty: n } as Partial<EolLtbItem>))} />
                      <NumCell v={r.ordered_qty} onSave={(n) => go(() => lt.patch(r.id, { ordered_qty: n } as Partial<EolLtbItem>))} />
                      <NumCell v={r.consumed_qty} onSave={(n) => go(() => lt.patch(r.id, { consumed_qty: n } as Partial<EolLtbItem>))} />
                      <NumCell v={r.unit_cost} onSave={(n) => go(() => lt.patch(r.id, { unit_cost: n } as Partial<EolLtbItem>))} />
                      <td className="p-2 text-right">{money((r.ordered_qty ?? 0) * (r.unit_cost ?? 0), program.currency)}</td>
                      <td className="p-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => go(() => lt.remove(r.id))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}
                  {ltb.length === 0 && <tr><td colSpan={9}><EmptyRow text="No LTB lines yet." /></td></tr>}
                </tbody>
              </table>
            </div>
            <AddRow
              fields={[{ key: "part_number", label: "Part number", type: "text" }, { key: "description", label: "Description", type: "text" }]}
              onAdd={(v) => go(() => lt.add({ part_number: String(v.part_number ?? ""), description: (v.description as string) || null } as Partial<EolLtbItem>))}
            />
          </TabsContent>

          {/* Asset disposition */}
          <TabsContent value="assets" className="space-y-3 pt-3">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs">
                  <tr>
                    <th className="p-2 text-left">Tooling / asset</th>
                    <th className="p-2 text-left">Disposition</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Book value</th>
                    <th className="p-2 text-right">Realized</th>
                    <th className="p-2 text-left">Location</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {assets.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-1"><Input className="h-8" defaultValue={r.asset_name} onBlur={(e) => e.target.value !== r.asset_name && go(() => ad.patch(r.id, { asset_name: e.target.value } as Partial<EolAssetItem>))} /></td>
                      <td className="p-1">
                        <Select value={r.disposition} onValueChange={(v) => go(() => ad.patch(r.id, { disposition: v } as Partial<EolAssetItem>))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(DISPOSITION_LABELS).map(([k2, l]) => <SelectItem key={k2} value={k2}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="p-1">
                        <Select value={r.status} onValueChange={(v) => go(() => ad.patch(r.id, { status: v } as Partial<EolAssetItem>))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(ASSET_STATUS_LABELS).map(([k2, l]) => <SelectItem key={k2} value={k2}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <NumCell v={r.book_value} onSave={(n) => go(() => ad.patch(r.id, { book_value: n } as Partial<EolAssetItem>))} />
                      <NumCell v={r.realized_value} onSave={(n) => go(() => ad.patch(r.id, { realized_value: n } as Partial<EolAssetItem>))} />
                      <td className="p-1"><Input className="h-8" defaultValue={r.location ?? ""} onBlur={(e) => e.target.value !== (r.location ?? "") && go(() => ad.patch(r.id, { location: e.target.value || null } as Partial<EolAssetItem>))} /></td>
                      <td className="p-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => go(() => ad.remove(r.id))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}
                  {assets.length === 0 && <tr><td colSpan={7}><EmptyRow text="No tooling or assets registered yet." /></td></tr>}
                </tbody>
              </table>
            </div>
            <AddRow
              fields={[{ key: "asset_name", label: "Asset / tooling", type: "text" }, { key: "asset_tag", label: "Tag", type: "text" }]}
              onAdd={(v) => go(() => ad.add({ asset_name: String(v.asset_name ?? ""), asset_tag: (v.asset_tag as string) || null } as Partial<EolAssetItem>))}
            />
          </TabsContent>

          {/* Customer migration */}
          <TabsContent value="migration" className="space-y-3 pt-3">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs">
                  <tr>
                    <th className="p-2 text-left">Customer</th>
                    <th className="p-2 text-left">Current product</th>
                    <th className="p-2 text-left">Target product</th>
                    <th className="p-2 text-left">Notice</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Revenue at risk</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {migration.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-1"><Input className="h-8" defaultValue={r.customer} onBlur={(e) => e.target.value !== r.customer && go(() => cm.patch(r.id, { customer: e.target.value } as Partial<EolMigrationItem>))} /></td>
                      <td className="p-1"><Input className="h-8" defaultValue={r.current_product ?? ""} onBlur={(e) => e.target.value !== (r.current_product ?? "") && go(() => cm.patch(r.id, { current_product: e.target.value || null } as Partial<EolMigrationItem>))} /></td>
                      <td className="p-1"><Input className="h-8" defaultValue={r.target_product ?? ""} onBlur={(e) => e.target.value !== (r.target_product ?? "") && go(() => cm.patch(r.id, { target_product: e.target.value || null } as Partial<EolMigrationItem>))} /></td>
                      <td className="p-1"><Input type="date" className="h-8" defaultValue={r.notice_date ?? ""} onBlur={(e) => e.target.value !== (r.notice_date ?? "") && go(() => cm.patch(r.id, { notice_date: e.target.value || null } as Partial<EolMigrationItem>))} /></td>
                      <td className="p-1">
                        <Select value={r.status} onValueChange={(v) => go(() => cm.patch(r.id, { status: v } as Partial<EolMigrationItem>))}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(MIGRATION_STATUS_LABELS).map(([k2, l]) => <SelectItem key={k2} value={k2}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <NumCell v={r.revenue_at_risk} onSave={(n) => go(() => cm.patch(r.id, { revenue_at_risk: n } as Partial<EolMigrationItem>))} />
                      <td className="p-1"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => go(() => cm.remove(r.id))}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}
                  {migration.length === 0 && <tr><td colSpan={7}><EmptyRow text="No customers listed yet." /></td></tr>}
                </tbody>
              </table>
            </div>
            <AddRow
              fields={[{ key: "customer", label: "Customer", type: "text" }, { key: "current_product", label: "Current product", type: "text" }]}
              onAdd={(v) => go(() => cm.add({ customer: String(v.customer ?? ""), current_product: (v.current_product as string) || null } as Partial<EolMigrationItem>))}
            />
          </TabsContent>

          {/* KPIs */}
          <TabsContent value="kpis" className="pt-3">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Kpi
                title="Inventory obsolescence ratio"
                value={pct(k.obsolescenceRatio, 2)}
                target="Target < 0.5% of lifetime revenue"
                good={k.obsolescenceRatio == null ? null : k.obsolescenceRatio < 0.5}
                hint={`Unplanned scrap write-down ${money(k.scrapValue, program.currency)} ÷ lifetime revenue ${money(program.lifetime_revenue, program.currency)}`}
              />
              <Kpi
                title="LTB demand variance"
                value={pct(k.ltbVariance)}
                target="Target within ±5%"
                good={k.ltbVariance == null ? null : Math.abs(k.ltbVariance) <= 5}
                hint="Actual long-tail consumption vs initial LTB forecast"
              />
              <Kpi
                title="Factory floor velocity"
                value={k.floorVelocity == null ? "—" : `${k.floorVelocity} days`}
                target="Target < 30 days"
                good={k.floorVelocity == null ? null : k.floorVelocity < 30}
                hint="Final Time Ship to line cleared and re-allocated"
              />
              <Kpi
                title="Customer migration rate"
                value={pct(k.migrationRate, 0)}
                target="Target > 90%"
                good={k.migrationRate == null ? null : k.migrationRate > 90}
                hint={`${migration.filter((m) => m.status === "migrated").length} of ${migration.length} accounts migrated`}
              />
              <Kpi
                title="Asset value recovered"
                value={money(k.realized, program.currency)}
                target="Maximise via repurpose / transfer / monetize"
                good={null}
                hint="Realized value across the disposition register"
              />
              <Kpi
                title="EOL reserve consumed"
                value={pct(k.reserveUse, 0)}
                target={`Reserve ${money(program.reserve_budget, program.currency)}`}
                good={k.reserveUse == null ? null : k.reserveUse <= 100}
                hint="Scrap write-down against the approved reserve"
              />
            </div>
          </TabsContent>

          {/* Details */}
          <TabsContent value="details" className="space-y-3 pt-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Product / part"><Input defaultValue={program.product_name} onBlur={(e) => e.target.value !== program.product_name && patchProgram.mutate({ product_name: e.target.value })} /></Field>
              <Field label="Platform"><Input defaultValue={program.platform ?? ""} onBlur={(e) => patchProgram.mutate({ platform: e.target.value || null })} /></Field>
              <Field label="Product family"><Input defaultValue={program.family ?? ""} onBlur={(e) => patchProgram.mutate({ family: e.target.value || null })} /></Field>
              <Field label="Status">
                <Select value={program.status} onValueChange={(v) => patchProgram.mutate({ status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EOL_STATUS_LABELS).map(([k2, l]) => <SelectItem key={k2} value={k2}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Health">
                <Select value={program.health ?? "none"} onValueChange={(v) => patchProgram.mutate({ health: v === "none" ? null : (v as "green") })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phase">
                <Select value={String(program.phase)} onValueChange={(v) => patchProgram.mutate({ phase: Number(v) as EolPhase })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PHASES.map((g) => <SelectItem key={g} value={String(g)}>{PHASE_LABELS[g].code} — {PHASE_LABELS[g].short}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="EOS announcement"><Input type="date" defaultValue={program.eos_announce_date ?? ""} onBlur={(e) => patchProgram.mutate({ eos_announce_date: e.target.value || null })} /></Field>
              <Field label="LTB cutoff"><Input type="date" defaultValue={program.ltb_cutoff_date ?? ""} onBlur={(e) => patchProgram.mutate({ ltb_cutoff_date: e.target.value || null })} /></Field>
              <Field label="Final Time Ship (FTS)"><Input type="date" defaultValue={program.fts_date ?? ""} onBlur={(e) => patchProgram.mutate({ fts_date: e.target.value || null })} /></Field>
              <Field label="Line cleared"><Input type="date" defaultValue={program.line_clear_date ?? ""} onBlur={(e) => patchProgram.mutate({ line_clear_date: e.target.value || null })} /></Field>
              <Field label="Closeout"><Input type="date" defaultValue={program.closeout_date ?? ""} onBlur={(e) => patchProgram.mutate({ closeout_date: e.target.value || null })} /></Field>
              <Field label="EOL reserve budget"><Input type="number" defaultValue={program.reserve_budget ?? ""} onBlur={(e) => patchProgram.mutate({ reserve_budget: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
              <Field label="Lifetime revenue"><Input type="number" defaultValue={program.lifetime_revenue ?? ""} onBlur={(e) => patchProgram.mutate({ lifetime_revenue: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
              <Field label="Programme owner"><OwnerSelect value={program.program_owner_id} onChange={(v) => patchProgram.mutate({ program_owner_id: v })} /></Field>
              <Field label="Engineering owner"><OwnerSelect value={program.engineering_owner_id} onChange={(v) => patchProgram.mutate({ engineering_owner_id: v })} /></Field>
              <Field label="Supply chain owner"><OwnerSelect value={program.supply_chain_owner_id} onChange={(v) => patchProgram.mutate({ supply_chain_owner_id: v })} /></Field>
              <Field label="Aftermarket / MRO owner"><OwnerSelect value={program.aftermarket_owner_id} onChange={(v) => patchProgram.mutate({ aftermarket_owner_id: v })} /></Field>
              <Field label="Finance owner"><OwnerSelect value={program.finance_owner_id} onChange={(v) => patchProgram.mutate({ finance_owner_id: v })} /></Field>
            </div>
            <Field label="Business case / description">
              <Textarea rows={3} defaultValue={program.description ?? ""} onBlur={(e) => patchProgram.mutate({ description: e.target.value || null })} />
            </Field>
            <Field label="Notes">
              <Textarea rows={3} defaultValue={program.notes ?? ""} onBlur={(e) => patchProgram.mutate({ notes: e.target.value || null })} />
            </Field>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}

function EmptyRow({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function NumCell({ v, onSave }: { v: number | null; onSave: (n: number | null) => void }) {
  return (
    <td className="p-1">
      <Input
        type="number"
        className="h-8 text-right"
        defaultValue={v ?? ""}
        onBlur={(e) => {
          const n = e.target.value === "" ? null : Number(e.target.value);
          if (n !== v) onSave(n);
        }}
      />
    </td>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("font-semibold", tone === "bad" && "text-destructive")}>{value}</div>
    </div>
  );
}

function Kpi({ title, value, target, good, hint }: { title: string; value: string; target: string; good: boolean | null; hint: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {good === true && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        {title}
      </div>
      <div className={cn("mt-1 text-2xl font-bold", good === false && "text-destructive")}>{value}</div>
      <div className="text-xs text-muted-foreground">{target}</div>
      <div className="mt-2 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function AddRow({ fields, onAdd }: {
  fields: { key: string; label: string; type: "text" | "select"; options?: { value: string; label: string }[] }[];
  onAdd: (values: Record<string, string>) => void;
}) {
  const [v, setV] = useState<Record<string, string>>({});
  return (
    <div className="flex flex-wrap items-end gap-2">
      {fields.map((f) => (
        <div key={f.key} className="min-w-[180px] flex-1">
          <Label className="text-xs">{f.label}</Label>
          {f.type === "select" ? (
            <Select value={v[f.key] ?? f.options?.[0]?.value ?? ""} onValueChange={(x) => setV({ ...v, [f.key]: x })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(f.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
          )}
        </div>
      ))}
      <Button
        onClick={() => {
          const first = fields[0];
          const value = v[first.key] ?? (first.type === "select" ? first.options?.[0]?.value : "");
          if (!value) return toast.error(`${first.label} required`);
          onAdd({ ...v, [first.key]: value });
          setV({});
        }}
      >
        <Plus className="mr-1 h-4 w-4" /> Add
      </Button>
    </div>
  );
}
