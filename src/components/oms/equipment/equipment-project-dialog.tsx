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
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { Plus, Trash2, ChevronRight, Archive, CheckCircle2 } from "lucide-react";
import { RowActions } from "@/components/commercial/row-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  EquipmentProject, EquipmentChecklistItem, EquipmentPunchItem, EquipmentPayment, EquipmentRampEntry, EquipmentStage,
} from "./types";
import {
  STAGE_LABELS, STAGE_COLORS, HEALTH_COLORS, EQUIPMENT_STATUS_LABELS, PUNCH_SEVERITY_LABELS, PUNCH_STATUS_LABELS,
  RAMP_STEPS, oeeOf, money,
} from "./types";
import { confirmDialog } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";


const STAGES: EquipmentStage[] = [1, 2, 3, 4, 5, 6, 7];

export function EquipmentProjectDialog({ project, onClose }: { project: EquipmentProject; onClose: () => void }) {
  const qc = useQueryClient();
  const [stageTab, setStageTab] = useState<EquipmentStage>(project.stage);
  const { data: profiles = [] } = useProfiles();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["equipment_projects"] });
    qc.invalidateQueries({ queryKey: ["equipment_checklist_all"] });
    qc.invalidateQueries({ queryKey: ["equipment_checklist", project.id] });
    qc.invalidateQueries({ queryKey: ["equipment_punch", project.id] });
    qc.invalidateQueries({ queryKey: ["equipment_payments", project.id] });
    qc.invalidateQueries({ queryKey: ["equipment_ramp", project.id] });
  };

  const checklistQ = useQuery({
    queryKey: ["equipment_checklist", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_gate_checklist")
        .select("*").eq("project_id", project.id).order("stage").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentChecklistItem[];
    },
  });

  const punchQ = useQuery({
    queryKey: ["equipment_punch", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_punch_items")
        .select("*").eq("project_id", project.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentPunchItem[];
    },
  });

  const paymentsQ = useQuery({
    queryKey: ["equipment_payments", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_payment_milestones")
        .select("*").eq("project_id", project.id).order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentPayment[];
    },
  });

  const rampQ = useQuery({
    queryKey: ["equipment_ramp", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment_ramp_log")
        .select("*").eq("project_id", project.id).order("entry_date");
      if (error) throw error;
      return (data ?? []) as unknown as EquipmentRampEntry[];
    },
  });

  useEffect(() => { setStageTab(project.stage); }, [project.stage]);

  const patchProject = useMutation({
    mutationFn: async (patch: Partial<EquipmentProject>) => {
      const { data, error } = await supabase.from("equipment_projects").update(patch as never).eq("id", project.id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("This project could not be updated — it may be read-only in this workspace.");
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProject = useMutation({
    mutationFn: async () => {
      for (const t of ["equipment_gate_checklist", "equipment_punch_items", "equipment_payment_milestones", "equipment_ramp_log"] as const) {
        const { error } = await supabase.from(t).delete().eq("project_id", project.id);
        if (error) throw error;
      }
      const { data, error } = await supabase.from("equipment_projects").delete().eq("id", project.id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Equipment project deleted");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeProject = async () => {
    const ok = await confirmDialog({
      title: `Delete "${project.asset_name}"?`,
      description: "This permanently removes the project with its gate checklist, punch list, payment milestones and ramp log. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) deleteProject.mutate();
  };

  const patchItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<EquipmentChecklistItem> }) => {
      const { error } = await supabase.from("equipment_gate_checklist").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });


  const items = checklistQ.data ?? [];
  const stageItems = items.filter((i) => i.stage === stageTab);
  const stageDone = stageItems.filter((i) => i.completed).length;
  const stagePct = stageItems.length ? Math.round((stageDone / stageItems.length) * 100) : 0;
  const openPunch = (punchQ.data ?? []).filter((p) => p.status !== "closed").length;

  const advance = async () => {
    if (project.stage >= 7) return;
    const cur = items.filter((i) => i.stage === project.stage);
    const incomplete = cur.filter((i) => !i.completed).length;
    if (incomplete > 0 && !(await confirmDialog({ title: `${incomplete} item(s) in ${STAGE_LABELS[project.stage].short} are not complete.`, description: "Advance anyway?", confirmLabel: "Advance", destructive: false }))) return;
    const next = (project.stage + 1) as EquipmentStage;
    patchProject.mutate({ stage: next }, {
      onSuccess: () => {
        setStageTab(next);
        toast.success(`Advanced to S${next} — ${STAGE_LABELS[next].short}`);
      },
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
            <Badge className={STAGE_COLORS[project.stage]}>S{project.stage} — {STAGE_LABELS[project.stage].short}</Badge>
            <span>{project.asset_name}</span>
            {project.health && <span className={cn("h-2.5 w-2.5 rounded-full", HEALTH_COLORS[project.health])} />}
            {project.archived_at && <Badge variant="outline">Archived</Badge>}
            <span className="ml-auto">
              <RowActions
                label={project.asset_name}
                archived={!!project.archived_at}
                onArchiveToggle={(next) => patchProject.mutate(
                  { archived_at: next ? new Date().toISOString() : null },
                  { onSuccess: () => toast.success(next ? "Equipment project archived" : "Equipment project restored") },
                )}
                onDelete={() => deleteProject.mutate()}
                deleteDescription="This permanently removes the project with its gate checklist, punch list, payment milestones and ramp log. This cannot be undone."
                size="sm"
              />
            </span>
          </DialogTitle>

        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{project.vendor ?? "No vendor"}</span>
          <span>· {project.line_area ?? "No line/area"}</span>
          <span>· PO {project.po_number ?? "—"}</span>
          <span>· {money(project.contract_value, project.currency)}</span>
          <span>· {openPunch} open punch item{openPunch === 1 ? "" : "s"}</span>
        </div>

        <Tabs defaultValue="checklist">
          <TabsList className="flex-wrap">
            <TabsTrigger value="checklist">Stage checklist</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="punch">Punch list</TabsTrigger>
            <TabsTrigger value="payments">Payment gates</TabsTrigger>
            <TabsTrigger value="ramp">Ramp &amp; OEE</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-3 pt-3">
            <div className="flex flex-wrap gap-1">
              {STAGES.map((s) => {
                const all = items.filter((i) => i.stage === s);
                const done = all.filter((i) => i.completed).length;
                return (
                  <button
                    key={s}
                    onClick={() => setStageTab(s)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs",
                      stageTab === s ? "border-primary bg-primary/10 font-semibold" : "hover:border-primary/50",
                    )}
                  >
                    S{s} {STAGE_LABELS[s].short}
                    <span className="ml-1 text-muted-foreground">{done}/{all.length}</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-sm font-semibold">{STAGE_LABELS[stageTab].full}</div>
              <p className="mt-1 text-xs text-muted-foreground">{STAGE_LABELS[stageTab].blurb}</p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={stagePct} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{stagePct}%</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Gate milestone: {STAGE_LABELS[stageTab].milestone}</div>
            </div>

            <div className="space-y-2">
              {stageItems.map((it) => (
                <div key={it.id} className="rounded-md border p-2">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={it.completed}
                      onChange={(e) => patchItem.mutate({
                        id: it.id,
                        patch: { completed: e.target.checked, completed_at: e.target.checked ? new Date().toISOString() : null },
                      })}
                    />
                    <span className={cn(it.completed && "text-muted-foreground line-through")}>{it.label}</span>
                  </label>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Evidence link"
                      defaultValue={it.evidence_url ?? ""}
                      onBlur={(e) => e.target.value !== (it.evidence_url ?? "") && patchItem.mutate({ id: it.id, patch: { evidence_url: e.target.value || null } })}
                    />
                    <Input
                      placeholder="Notes"
                      defaultValue={it.notes ?? ""}
                      onBlur={(e) => e.target.value !== (it.notes ?? "") && patchItem.mutate({ id: it.id, patch: { notes: e.target.value || null } })}
                    />
                  </div>
                </div>
              ))}
              <AddChecklistItem projectId={project.id} stage={stageTab} nextOrder={items.length + 1} onDone={invalidate} />
            </div>

            {project.stage < 7 && (
              <Button onClick={advance} className="w-full">
                <ChevronRight className="mr-1 h-4 w-4" /> Advance to S{project.stage + 1} — {STAGE_LABELS[project.stage + 1].short}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="details" className="pt-3">
            <DetailsForm project={project} onSave={(patch) => patchProject.mutate(patch)} />
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                onClick={() => patchProject.mutate(
                  { archived_at: project.archived_at ? null : new Date().toISOString() },
                  { onSuccess: () => toast.success(project.archived_at ? "Equipment project restored" : "Equipment project archived") },
                )}
              >
                <Archive className="mr-1 h-4 w-4" /> {project.archived_at ? "Restore" : "Archive"}
              </Button>
              <Button variant="destructive" onClick={removeProject} disabled={deleteProject.isPending}>
                <Trash2 className="mr-1 h-4 w-4" /> {deleteProject.isPending ? "Deleting…" : "Delete project"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Archive keeps the record for history. Delete permanently removes the project and all its gate, punch, payment and ramp data.
            </p>

          </TabsContent>

          <TabsContent value="punch" className="space-y-2 pt-3">
            {(punchQ.data ?? []).map((p) => (
              <PunchRow key={p.id} item={p} profiles={profiles} onChange={invalidate} />
            ))}
            <AddPunchItem projectId={project.id} onDone={invalidate} />
          </TabsContent>

          <TabsContent value="payments" className="space-y-2 pt-3">
            <p className="text-xs text-muted-foreground">
              Release each milestone only when its gate is signed off. Recommended split: 30% PO, 30% FAT, 30% SAT, 10% final acceptance post-PQ.
            </p>
            {(paymentsQ.data ?? []).map((m) => (
              <PaymentRow key={m.id} milestone={m} currency={project.currency} onChange={invalidate} />
            ))}
            <div className="text-xs text-muted-foreground">
              Total scheduled: {(paymentsQ.data ?? []).reduce((a, m) => a + Number(m.percent || 0), 0)}% ·
              Released: {money((paymentsQ.data ?? []).filter((m) => m.released_at).reduce((a, m) => a + Number(m.amount || 0), 0), project.currency)}
            </div>
          </TabsContent>

          <TabsContent value="ramp" className="space-y-3 pt-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {RAMP_STEPS.map((s) => <Badge key={s} variant="outline">S-curve step {s}%</Badge>)}
              <Badge variant="outline">OEE target {project.oee_target}%</Badge>
              <Badge variant="outline">Sustain {project.sustain_shifts} shifts</Badge>
              <Badge variant="outline">Cpk target {project.cpk_target}</Badge>
            </div>
            <RampTable entries={rampQ.data ?? []} target={project.oee_target} onChange={invalidate} />
            <AddRampEntry projectId={project.id} onDone={invalidate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function DetailsForm({ project, onSave }: { project: EquipmentProject; onSave: (patch: Partial<EquipmentProject>) => void }) {
  const [f, setF] = useState<Partial<EquipmentProject>>(project);
  const set = (patch: Partial<EquipmentProject>) => setF({ ...f, ...patch });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div><Label className="text-xs">Asset name</Label><Input value={f.asset_name ?? ""} onChange={(e) => set({ asset_name: e.target.value })} /></div>
        <div><Label className="text-xs">Asset tag</Label><Input value={f.asset_tag ?? ""} onChange={(e) => set({ asset_tag: e.target.value })} /></div>
        <div><Label className="text-xs">Vendor / OEM</Label><Input value={f.vendor ?? ""} onChange={(e) => set({ vendor: e.target.value })} /></div>
        <div><Label className="text-xs">Line / area</Label><Input value={f.line_area ?? ""} onChange={(e) => set({ line_area: e.target.value })} /></div>
        <div><Label className="text-xs">PO number</Label><Input value={f.po_number ?? ""} onChange={(e) => set({ po_number: e.target.value })} /></div>
        <div><Label className="text-xs">Contract value</Label><Input type="number" value={f.contract_value ?? ""} onChange={(e) => set({ contract_value: e.target.value === "" ? null : Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Status</Label>
          <Select value={f.status ?? "planning"} onValueChange={(v) => set({ status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(EQUIPMENT_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Health</Label>
          <Select value={f.health ?? "none"} onValueChange={(v) => set({ health: v === "none" ? null : (v as EquipmentProject["health"]) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not set</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Project owner</Label><OwnerSelect value={f.owner_id ?? null} onChange={(v) => set({ owner_id: v })} /></div>
        <div><Label className="text-xs">Maintenance owner</Label><OwnerSelect value={f.maintenance_owner_id ?? null} onChange={(v) => set({ maintenance_owner_id: v })} /></div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {([
          ["po_date", "PO date"], ["fat_date", "FAT"], ["delivery_date", "Delivery"], ["sat_date", "SAT"],
          ["pq_date", "PQ"], ["handover_date", "Handover"], ["target_handover_date", "Target handover"],
        ] as [keyof EquipmentProject, string][]).map(([k, label]) => (
          <div key={k as string}>
            <Label className="text-xs">{label}</Label>
            <Input type="date" value={(f[k] as string | null) ?? ""} onChange={(e) => set({ [k]: e.target.value || null } as Partial<EquipmentProject>)} />
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div><Label className="text-xs">Cpk target</Label><Input type="number" step="0.01" value={f.cpk_target ?? 1.67} onChange={(e) => set({ cpk_target: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">OEE target %</Label><Input type="number" value={f.oee_target ?? 85} onChange={(e) => set({ oee_target: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Sustain shifts</Label><Input type="number" value={f.sustain_shifts ?? 30} onChange={(e) => set({ sustain_shifts: Number(e.target.value) })} /></div>
      </div>

      <div><Label className="text-xs">Notes</Label><Textarea rows={3} value={f.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} /></div>

      <Button onClick={() => {
        const { id, company_id, created_at, updated_at, created_by, ...patch } = f as EquipmentProject;
        onSave(patch);
        toast.success("Saved");
      }}>Save details</Button>
    </div>
  );
}

function AddChecklistItem({ projectId, stage, nextOrder, onDone }: { projectId: string; stage: EquipmentStage; nextOrder: number; onDone: () => void }) {
  const [label, setLabel] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("equipment_gate_checklist").insert({ project_id: projectId, stage, label, sort_order: nextOrder } as never);
      if (error) throw error;
    },
    onSuccess: () => { setLabel(""); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex gap-2">
      <Input placeholder="Add checklist item" value={label} onChange={(e) => setLabel(e.target.value)} />
      <Button variant="outline" disabled={!label.trim()} onClick={() => add.mutate()}><Plus className="h-4 w-4" /></Button>
    </div>
  );
}

function PunchRow({ item, profiles, onChange }: { item: EquipmentPunchItem; profiles: { id: string }[]; onChange: () => void }) {
  const patch = useMutation({
    mutationFn: async (p: Partial<EquipmentPunchItem>) => {
      const { error } = await supabase.from("equipment_punch_items").update(p as never).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("equipment_punch_items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid items-center gap-2 rounded-md border p-2 md:grid-cols-[1fr_120px_140px_130px_40px]">
      <Input defaultValue={item.title} onBlur={(e) => e.target.value !== item.title && patch.mutate({ title: e.target.value })} />
      <Select value={item.severity} onValueChange={(v) => patch.mutate({ severity: v as EquipmentPunchItem["severity"] })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(PUNCH_SEVERITY_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={item.status} onValueChange={(v) => patch.mutate({ status: v as EquipmentPunchItem["status"] })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(PUNCH_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
      </Select>
      <Input type="date" defaultValue={item.due_date ?? ""} onBlur={(e) => patch.mutate({ due_date: e.target.value || null })} />
      <Button variant="ghost" size="icon" onClick={() => del.mutate()}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

function AddPunchItem({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("equipment_punch_items").insert({ project_id: projectId, title } as never);
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex gap-2">
      <Input placeholder="Add punch item" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Button variant="outline" disabled={!title.trim()} onClick={() => add.mutate()}><Plus className="h-4 w-4" /></Button>
    </div>
  );
}

function PaymentRow({ milestone, currency, onChange }: { milestone: EquipmentPayment; currency: string; onChange: () => void }) {
  const patch = useMutation({
    mutationFn: async (p: Partial<EquipmentPayment>) => {
      const { error } = await supabase.from("equipment_payment_milestones").update(p as never).eq("id", milestone.id);
      if (error) throw error;
    },
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid items-center gap-2 rounded-md border p-2 md:grid-cols-[1fr_90px_140px_150px]">
      <div className="text-sm">
        {milestone.label}
        {milestone.gate != null && <span className="ml-2 text-xs text-muted-foreground">Gate S{milestone.gate}</span>}
      </div>
      <Input type="number" defaultValue={milestone.percent} onBlur={(e) => patch.mutate({ percent: Number(e.target.value) })} />
      <div className="text-sm text-muted-foreground">{money(milestone.amount, currency)}</div>
      {milestone.released_at ? (
        <Button variant="outline" size="sm" onClick={() => patch.mutate({ released_at: null })}>
          <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-500" /> Released {milestone.released_at}
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => patch.mutate({ released_at: new Date().toISOString().slice(0, 10) })}>
          Release payment
        </Button>
      )}
    </div>
  );
}

function RampTable({ entries, target, onChange }: { entries: EquipmentRampEntry[]; target: number; onChange: () => void }) {
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_ramp_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  });
  if (entries.length === 0) return <p className="p-4 text-center text-sm italic text-muted-foreground">No ramp entries yet.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-xs">
          <tr>
            <th className="p-2 text-left">Date</th><th className="p-2 text-right">Plan %</th><th className="p-2 text-right">Actual %</th>
            <th className="p-2 text-right">A</th><th className="p-2 text-right">P</th><th className="p-2 text-right">Q</th>
            <th className="p-2 text-right">OEE</th><th className="p-2 text-right">MTBF</th><th className="p-2 text-right">MTTR</th><th />
          </tr>
        </thead>
        <tbody>
          {entries.map((r) => {
            const oee = oeeOf(r);
            return (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.entry_date}</td>
                <td className="p-2 text-right">{r.planned_pct ?? "—"}</td>
                <td className="p-2 text-right">{r.actual_pct ?? "—"}</td>
                <td className="p-2 text-right">{r.availability ?? "—"}</td>
                <td className="p-2 text-right">{r.performance ?? "—"}</td>
                <td className="p-2 text-right">{r.quality ?? "—"}</td>
                <td className={cn("p-2 text-right font-medium", oee != null && oee < target && "text-destructive")}>{oee ?? "—"}</td>
                <td className="p-2 text-right">{r.mtbf_hours ?? "—"}</td>
                <td className="p-2 text-right">{r.mttr_hours ?? "—"}</td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddRampEntry({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const empty = { entry_date: new Date().toISOString().slice(0, 10), planned_pct: "", actual_pct: "", availability: "", performance: "", quality: "", mtbf_hours: "", mttr_hours: "" };
  const [f, setF] = useState<Record<string, string>>(empty);
  const add = useMutation({
    mutationFn: async () => {
      const num = (v: string) => (v === "" ? null : Number(v));
      const { error } = await supabase.from("equipment_ramp_log").insert({
        project_id: projectId,
        entry_date: f.entry_date,
        planned_pct: num(f.planned_pct), actual_pct: num(f.actual_pct),
        availability: num(f.availability), performance: num(f.performance), quality: num(f.quality),
        mtbf_hours: num(f.mtbf_hours), mttr_hours: num(f.mttr_hours),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { setF(empty); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const field = (k: string, label: string, type = "number") => (
    <div key={k}>
      <Label className="text-[10px]">{label}</Label>
      <Input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </div>
  );
  return (
    <div className="rounded-lg border p-3">
      <div className="grid gap-2 md:grid-cols-9">
        {field("entry_date", "Date", "date")}
        {field("planned_pct", "Plan %")}
        {field("actual_pct", "Actual %")}
        {field("availability", "Avail %")}
        {field("performance", "Perf %")}
        {field("quality", "Qual %")}
        {field("mtbf_hours", "MTBF h")}
        {field("mttr_hours", "MTTR h")}
        <div className="flex items-end"><Button className="w-full" onClick={() => add.mutate()}><Plus className="h-4 w-4" /></Button></div>
      </div>
    </div>
  );
}
