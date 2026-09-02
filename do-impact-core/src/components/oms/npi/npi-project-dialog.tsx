import { getCurrentUser } from "@/lib/auth-session";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { Trash2, Plus, Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { NpiProject, ChecklistItem, NpiRisk } from "./npi-types";
import { GATE_LABELS, GATE_COLORS, HEALTH_COLORS } from "./npi-types";
import { confirmThen } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";

export function NpiProjectDialog({
  project, onClose,
}: {
  project: NpiProject;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NpiProject>(project);
  useEffect(() => setForm(project), [project]);

  const checklistQ = useQuery({
    queryKey: ["npi_checklist", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("npi_gate_checklist")
        .select("*").eq("project_id", project.id).order("gate").order("sort_order");
      if (error) throw error;
      return (data ?? []) as ChecklistItem[];
    },
  });
  const risksQ = useQuery({
    queryKey: ["npi_risks", project.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("npi_risks")
        .select("*").eq("project_id", project.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as NpiRisk[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { id, created_at, updated_at, created_by, ...patch } = form;
      const { data, error } = await supabase.from("npi_projects").update(patch).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["npi_projects"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("npi_projects").delete().eq("id", project.id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["npi_projects"] }); toast.success("Deleted"); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleArchive = useMutation({
    mutationFn: async () => {
      const val = form.archived_at ? null : new Date().toISOString();
      const { data, error } = await supabase.from("npi_projects").update({ archived_at: val }).eq("id", project.id).select("id");
      if (error) throw error;
      assertWrote(data, "archive");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["npi_projects"] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = checklistQ.data ?? [];
  const perGate = useMemo(() => {
    const by: Record<number, ChecklistItem[]> = {1:[],2:[],3:[],4:[],5:[]};
    for (const it of items) by[it.gate]?.push(it);
    return by;
  }, [items]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{form.part_number}</span>
            {form.part_name && <span className="text-muted-foreground font-normal">— {form.part_name}</span>}
            <Badge className={cn("ml-2", GATE_COLORS[form.current_gate])}>Gate {form.current_gate}</Badge>
            {form.health && <span className={cn("h-3 w-3 rounded-full", HEALTH_COLORS[form.health])} />}
            {form.archived_at && <Badge variant="outline">Archived</Badge>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Gate checklist</TabsTrigger>
            <TabsTrigger value="risks">Risks ({risksQ.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-2">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Part number"><Input value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })} /></Field>
              <Field label="Part name"><Input value={form.part_name ?? ""} onChange={(e) => setForm({ ...form, part_name: e.target.value })} /></Field>
              <Field label="Customer"><Input value={form.customer ?? ""} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></Field>
              <Field label="Program"><Input value={form.program ?? ""} onChange={(e) => setForm({ ...form, program: e.target.value })} /></Field>
              <Field label="Platform"><Input value={form.platform ?? ""} onChange={(e) => setForm({ ...form, platform: e.target.value })} /></Field>
              <Field label="Material class"><Input value={form.material_class ?? ""} placeholder="e.g. Ti-6Al-4V, Inco 718" onChange={(e) => setForm({ ...form, material_class: e.target.value })} /></Field>

              <Field label="NPI Owner"><OwnerSelect value={form.owner_id} onChange={(v) => setForm({ ...form, owner_id: v })} /></Field>
              <Field label="Program Manager"><OwnerSelect value={form.program_manager_id} onChange={(v) => setForm({ ...form, program_manager_id: v })} /></Field>
              <Field label="Executive Sponsor"><OwnerSelect value={form.sponsor_id} onChange={(v) => setForm({ ...form, sponsor_id: v })} /></Field>

              <Field label="Current gate">
                <Select value={String(form.current_gate)} onValueChange={(v) => setForm({ ...form, current_gate: Number(v) as 1|2|3|4|5 })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map((g) => <SelectItem key={g} value={String(g)}>Gate {g} — {GATE_LABELS[g].short}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as NpiProject["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["planning","on_track","at_risk","delayed","on_hold","complete"].map((s) => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Health">
                <Select value={form.health ?? "none"} onValueChange={(v) => setForm({ ...form, health: v === "none" ? null : v as "green"|"yellow"|"red" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Customer milestones</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Contract award"><Input type="date" value={form.contract_award_date ?? ""} onChange={(e) => setForm({ ...form, contract_award_date: e.target.value || null })} /></Field>
                <Field label="PDR / CDR"><Input type="date" value={form.pdr_cdr_date ?? ""} onChange={(e) => setForm({ ...form, pdr_cdr_date: e.target.value || null })} /></Field>
                <Field label="PRR"><Input type="date" value={form.prr_date ?? ""} onChange={(e) => setForm({ ...form, prr_date: e.target.value || null })} /></Field>
                <Field label="FAI (AS9102)"><Input type="date" value={form.fai_date ?? ""} onChange={(e) => setForm({ ...form, fai_date: e.target.value || null })} /></Field>
                <Field label="EIS (actual)"><Input type="date" value={form.eis_date ?? ""} onChange={(e) => setForm({ ...form, eis_date: e.target.value || null })} /></Field>
                <Field label="EIS target"><Input type="date" value={form.target_eis_date ?? ""} onChange={(e) => setForm({ ...form, target_eis_date: e.target.value || null })} /></Field>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Bid economics</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Bid unit hours"><Input type="number" step="0.01" value={form.bid_unit_hours ?? ""} onChange={(e) => setForm({ ...form, bid_unit_hours: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Bid unit cost ($)"><Input type="number" step="0.01" value={form.bid_unit_cost ?? ""} onChange={(e) => setForm({ ...form, bid_unit_cost: e.target.value ? Number(e.target.value) : null })} /></Field>
              </div>
            </div>

            <Field label="Description"><Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Notes"><Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleArchive.mutate()}>
                  {form.archived_at ? <><ArchiveRestore className="h-4 w-4 mr-1" /> Restore</> : <><Archive className="h-4 w-4 mr-1" /> Archive</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { confirmThen("Delete permanently?", () => { del.mutate(); }) }}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>Save changes</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4 pt-2">
            {[1,2,3,4,5].map((g) => {
              const gitems = perGate[g] ?? [];
              const done = gitems.filter((i) => i.completed).length;
              const pct = gitems.length ? Math.round((done / gitems.length) * 100) : 0;
              return (
                <div key={g} className="rounded-md border">
                  <div className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2">
                    <Badge className={GATE_COLORS[g]}>Gate {g}</Badge>
                    <div className="font-semibold text-sm">{GATE_LABELS[g].full}</div>
                    <div className="text-xs text-muted-foreground">Customer: {GATE_LABELS[g].milestone}</div>
                    <div className="ml-auto flex items-center gap-2 min-w-[160px]">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs tabular-nums w-10 text-right">{done}/{gitems.length}</span>
                    </div>
                  </div>
                  <ul className="divide-y">
                    {gitems.map((it) => (
                      <ChecklistRow key={it.id} item={it} projectId={project.id} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="risks" className="pt-2">
            <RisksPanel projectId={project.id} risks={risksQ.data ?? []} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ChecklistRow({ item, projectId }: { item: ChecklistItem; projectId: string }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(item.notes ?? "");
  const [url, setUrl] = useState(item.evidence_url ?? "");
  const [dirty, setDirty] = useState(false);

  const toggle = useMutation({
    mutationFn: async (completed: boolean) => {
      const { data: u } = await getCurrentUser();
      const { data, error } = await supabase.from("npi_gate_checklist").update({
        completed, completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? u.user?.id ?? null : null,
      }).eq("id", item.id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["npi_checklist", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const saveMeta = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("npi_gate_checklist").update({ notes, evidence_url: url }).eq("id", item.id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => { setDirty(false); qc.invalidateQueries({ queryKey: ["npi_checklist", projectId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="p-3 flex items-start gap-3">
      <input type="checkbox" className="mt-1" checked={item.completed} onChange={(e) => toggle.mutate(e.target.checked)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm">{item.label}</div>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Evidence URL" value={url} onChange={(e) => { setUrl(e.target.value); setDirty(true); }} />
          <Input placeholder="Notes" value={notes} onChange={(e) => { setNotes(e.target.value); setDirty(true); }} />
          <Button size="sm" variant={dirty ? "default" : "ghost"} onClick={() => saveMeta.mutate()} disabled={!dirty}>Save</Button>
        </div>
        {item.completed && item.completed_at && (
          <div className="text-xs text-muted-foreground mt-1">Completed {new Date(item.completed_at).toLocaleDateString()}</div>
        )}
      </div>
    </li>
  );
}

function RisksPanel({ projectId, risks }: { projectId: string; risks: NpiRisk[] }) {
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<NpiRisk>>({ title: "", category: "technical", likelihood: 3, impact: 3, status: "open" });

  const add = useMutation({
    mutationFn: async () => {
      if (!draft.title) throw new Error("Title required");
      const { error } = await supabase.from("npi_risks").insert({ ...draft, project_id: projectId, title: draft.title });
      if (error) throw error;
    },
    onSuccess: () => { setAdding(false); setDraft({ title: "", category: "technical", likelihood: 3, impact: 3, status: "open" }); qc.invalidateQueries({ queryKey: ["npi_risks", projectId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const patch = useMutation({
    mutationFn: async (v: { id: string; patch: Partial<NpiRisk> }) => {
      const { data, error } = await supabase.from("npi_risks").update(v.patch).eq("id", v.id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["npi_risks", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("npi_risks").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["npi_risks", projectId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Add risk</Button>
      </div>
      {adding && (
        <div className="rounded-md border p-3 space-y-2 bg-muted/40">
          <Input placeholder="Risk title" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <div className="grid gap-2 md:grid-cols-4">
            <Select value={draft.category ?? "technical"} onValueChange={(v) => setDraft({ ...draft, category: v as NpiRisk["category"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["technical","schedule","supply_chain","quality","cost"].map((c) => <SelectItem key={c} value={c}>{c.replace("_"," ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <NumSelect label="Likelihood" value={draft.likelihood ?? 3} onChange={(v) => setDraft({ ...draft, likelihood: v })} />
            <NumSelect label="Impact" value={draft.impact ?? 3} onChange={(v) => setDraft({ ...draft, impact: v })} />
            <OwnerSelect value={draft.owner_id ?? null} onChange={(v) => setDraft({ ...draft, owner_id: v })} />
          </div>
          <Textarea placeholder="Mitigation" rows={2} value={draft.mitigation ?? ""} onChange={(e) => setDraft({ ...draft, mitigation: e.target.value })} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={() => add.mutate()}>Add</Button>
          </div>
        </div>
      )}
      {risks.length === 0 ? (
        <p className="text-sm text-muted-foreground italic p-4 text-center">No risks logged yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs bg-muted/60">
            <tr><th className="p-2 text-left">Risk</th><th className="p-2">Cat</th><th className="p-2">L</th><th className="p-2">I</th><th className="p-2">Score</th><th className="p-2">Owner</th><th className="p-2">Status</th><th /></tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{r.title}</div>
                  {r.mitigation && <div className="text-xs text-muted-foreground">{r.mitigation}</div>}
                </td>
                <td className="p-2 text-xs">{r.category}</td>
                <td className="p-2 text-center">{r.likelihood}</td>
                <td className="p-2 text-center">{r.impact}</td>
                <td className="p-2 text-center font-semibold">{(r.likelihood ?? 0) * (r.impact ?? 0)}</td>
                <td className="p-2 text-xs">{ownerLabel(profiles.find((p) => p.id === r.owner_id))}</td>
                <td className="p-2">
                  <Select value={r.status} onValueChange={(v) => patch.mutate({ id: r.id, patch: { status: v as NpiRisk["status"] } })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="mitigated">Mitigated</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2"><Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NumSelect({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>{[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{label}: {n}</SelectItem>)}</SelectContent>
    </Select>
  );
}
