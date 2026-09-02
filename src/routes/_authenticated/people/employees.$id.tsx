import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LEVEL_LABELS, LEVEL_COLORS, LevelBadge } from "@/lib/proficiency";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/people/employees/$id")({
  head: () => ({ meta: [{ title: "Employees — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EmployeeDetailPage,
});

function EmployeeDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["employee-detail", id],
    queryFn: async () => {
      const [emp, skills, es, certs, plans, actions, roles, req] = await Promise.all([
        supabase.from("employees").select("*, job_roles(id,name)").eq("id", id).single(),
        supabase.from("skills").select("*, skill_categories(name)").order("name"),
        supabase.from("employee_skills").select("*").eq("employee_id", id),
        supabase.from("certifications").select("*").eq("employee_id", id).order("expires_on"),
        supabase.from("development_plans").select("*, skills(name), training_actions(name)").eq("employee_id", id),
        supabase.from("training_actions").select("*").order("name"),
        supabase.from("job_roles").select("*").order("name"),
        supabase.from("role_requirements").select("*, skills(id,name,skill_categories(name))"),
      ]);
      if (emp.error) throw emp.error;
      const skillLevels = new Map<string, number>();
      (es.data ?? []).forEach((r) => skillLevels.set(r.skill_id, r.level));
      return {
        employee: emp.data,
        skills: skills.data ?? [],
        skillLevels,
        certs: certs.data ?? [],
        plans: plans.data ?? [],
        actions: actions.data ?? [],
        roles: roles.data ?? [],
        requirements: (req.data ?? []).filter((r) => r.role_id === emp.data.role_id),
      };
    },
  });

  const updateSkill = useMutation({
    mutationFn: async ({ skill_id, level }: { skill_id: string; level: number }) => {
      const { error } = await supabase.from("employee_skills").upsert({ employee_id: id, skill_id, level, assessed_on: new Date().toISOString().slice(0, 10) }, { onConflict: "employee_id,skill_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-detail", id] }),
  });

  const [certOpen, setCertOpen] = useState(false);
  const [certForm, setCertForm] = useState({ name: "", cert_number: "", authority: "", issued_on: "", expires_on: "", skill_id: "", document_url: "" });
  const addCert = useMutation({
    mutationFn: async () => {
      const payload: any = { ...certForm, employee_id: id };
      if (!payload.skill_id) payload.skill_id = null;
      if (!payload.issued_on) payload.issued_on = null;
      if (!payload.expires_on) payload.expires_on = null;
      const { error } = await supabase.from("certifications").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setCertOpen(false);
      setCertForm({ name: "", cert_number: "", authority: "", issued_on: "", expires_on: "", skill_id: "", document_url: "" });
      qc.invalidateQueries({ queryKey: ["employee-detail", id] });
      toast.success("Certification added");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const delCert = useMutation({
    mutationFn: async (cid: string) => { await supabase.from("certifications").delete().eq("id", cid); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-detail", id] }),
  });

  const [planOpen, setPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ skill_id: "", target_level: "3", action_id: "", target_date: "", status: "open", notes: "" });
  const addPlan = useMutation({
    mutationFn: async () => {
      const current = data?.skillLevels.get(planForm.skill_id) ?? 0;
      const payload: any = { employee_id: id, skill_id: planForm.skill_id, current_level: current, target_level: Number(planForm.target_level), action_id: planForm.action_id || null, target_date: planForm.target_date || null, status: planForm.status, notes: planForm.notes || null };
      const { error } = await supabase.from("development_plans").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setPlanOpen(false);
      setPlanForm({ skill_id: "", target_level: "3", action_id: "", target_date: "", status: "open", notes: "" });
      qc.invalidateQueries({ queryKey: ["employee-detail", id] });
      toast.success("Development plan added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateEmployee = useMutation({
    mutationFn: async (patch: { role_id?: string | null; department?: string | null; status?: string }) => {
      const { error } = await supabase.from("employees").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employee-detail", id] }); qc.invalidateQueries({ queryKey: ["employees-list"] }); toast.success("Saved"); },
  });

  if (!data) return <div className="text-muted-foreground">Loading…</div>;
  const emp = data.employee;

  const gaps = data.requirements
    .map((r: any) => ({ req: r, current: data.skillLevels.get(r.skill_id) ?? 0 }))
    .filter((g: any) => g.current < g.req.required_level);

  const skillsByCat = new Map<string, any[]>();
  data.skills.forEach((s: any) => {
    const key = s.skill_categories?.name ?? "Other";
    if (!skillsByCat.has(key)) skillsByCat.set(key, []);
    skillsByCat.get(key)!.push(s);
  });

  return (
    <div className="space-y-6">
      <Link to="/people/employees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to employees
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{emp.first_name} {emp.last_name}</h1>
          <p className="text-sm text-muted-foreground">
            {emp.employee_no ?? "—"} · {emp.job_roles?.name ?? "No role"} · {emp.department ?? "—"}
          </p>
          {emp.email && <p className="text-sm text-muted-foreground">{emp.email}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Role</Label>
          <Select value={emp.role_id ?? ""} onValueChange={(v) => updateEmployee.mutate({ role_id: v })}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Assign role" /></SelectTrigger>
            <SelectContent>
              {data.roles.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills ({data.skillLevels.size})</TabsTrigger>
          <TabsTrigger value="gaps">Gaps ({gaps.length})</TabsTrigger>
          <TabsTrigger value="certs">Certifications ({data.certs.length})</TabsTrigger>
          <TabsTrigger value="dev">Development ({data.plans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-4 space-y-4">
          {Array.from(skillsByCat.entries()).map(([cat, list]) => (
            <Card key={cat}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{cat}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {list.map((s) => {
                    const current = data.skillLevels.get(s.id) ?? 0;
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border p-2">
                        <div className="text-sm">{s.name}</div>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map((lvl) => (
                            <button key={lvl} onClick={() => updateSkill.mutate({ skill_id: s.id, level: lvl })}
                              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium text-slate-900 transition-all ${current === lvl ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"}`}
                              style={{ backgroundColor: LEVEL_COLORS[lvl] }} title={LEVEL_LABELS[lvl]}>
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {!gaps.length ? <p className="p-6 text-sm text-muted-foreground">No skill gaps against current role requirements.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Skill</TableHead><TableHead>Category</TableHead><TableHead>Current</TableHead><TableHead>Required</TableHead><TableHead>Gap</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {gaps.map((g: any) => (
                      <TableRow key={g.req.id}>
                        <TableCell className="font-medium">{g.req.skills.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.req.skills.skill_categories?.name}</TableCell>
                        <TableCell><LevelBadge level={g.current} /></TableCell>
                        <TableCell><LevelBadge level={g.req.required_level} /></TableCell>
                        <TableCell><Badge variant="destructive">-{g.req.required_level - g.current}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certs" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={certOpen} onOpenChange={setCertOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add certification</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New certification</DialogTitle></DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label>Name *</Label><Input value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} /></div>
                  <div><Label>Cert #</Label><Input value={certForm.cert_number} onChange={(e) => setCertForm({ ...certForm, cert_number: e.target.value })} /></div>
                  <div><Label>Authority</Label><Input value={certForm.authority} onChange={(e) => setCertForm({ ...certForm, authority: e.target.value })} /></div>
                  <div><Label>Issued on</Label><Input type="date" value={certForm.issued_on} onChange={(e) => setCertForm({ ...certForm, issued_on: e.target.value })} /></div>
                  <div><Label>Expires on</Label><Input type="date" value={certForm.expires_on} onChange={(e) => setCertForm({ ...certForm, expires_on: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Linked skill (optional)</Label>
                    <Select value={certForm.skill_id} onValueChange={(v) => setCertForm({ ...certForm, skill_id: v })}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{data.skills.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2"><Label>Document URL</Label><Input value={certForm.document_url} onChange={(e) => setCertForm({ ...certForm, document_url: e.target.value })} placeholder="https://…" /></div>
                </div>
                <DialogFooter><Button onClick={() => addCert.mutate()} disabled={!certForm.name}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Number</TableHead><TableHead>Authority</TableHead><TableHead>Issued</TableHead><TableHead>Expires</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {data.certs.map((c: any) => {
                  const days = c.expires_on ? Math.ceil((new Date(c.expires_on).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.cert_number ?? "—"}</TableCell>
                      <TableCell>{c.authority ?? "—"}</TableCell>
                      <TableCell>{c.issued_on ?? "—"}</TableCell>
                      <TableCell>
                        {c.expires_on ?? "—"}
                        {days !== null && (<Badge variant={days < 0 ? "destructive" : days < 30 ? "destructive" : days < 90 ? "secondary" : "outline"} className="ml-2">{days < 0 ? "expired" : `${days}d`}</Badge>)}
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => delCert.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  );
                })}
                {!data.certs.length && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No certifications yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="dev" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add development plan</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New development plan</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Skill *</Label>
                    <Select value={planForm.skill_id} onValueChange={(v) => setPlanForm({ ...planForm, skill_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger>
                      <SelectContent>{data.skills.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Target level</Label>
                    <Select value={planForm.target_level} onValueChange={(v) => setPlanForm({ ...planForm, target_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4].map((l) => <SelectItem key={l} value={String(l)}>{l} — {LEVEL_LABELS[l]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Training action (optional)</Label>
                    <Select value={planForm.action_id} onValueChange={(v) => setPlanForm({ ...planForm, action_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pick from catalog" /></SelectTrigger>
                      <SelectContent>{data.actions.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Target date</Label><Input type="date" value={planForm.target_date} onChange={(e) => setPlanForm({ ...planForm, target_date: e.target.value })} /></div>
                  <div><Label>Notes</Label><Input value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={() => addPlan.mutate()} disabled={!planForm.skill_id}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Skill</TableHead><TableHead>Target</TableHead><TableHead>Action</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.plans.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.skills?.name}</TableCell>
                    <TableCell><LevelBadge level={p.current_level} /> → <LevelBadge level={p.target_level} /></TableCell>
                    <TableCell>{p.training_actions?.name ?? "—"}</TableCell>
                    <TableCell>{p.target_date ?? "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {!data.plans.length && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No development plans yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
