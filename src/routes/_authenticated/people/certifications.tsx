import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { SectionTabs, DEVELOPMENT_TABS } from "@/components/people/section-tabs";

export const Route = createFileRoute("/_authenticated/people/certifications")({
  head: () => ({ meta: [{ title: "Certifications — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CertsPage,
});

const EMPTY = { employee_id: "", name: "", cert_number: "", authority: "", issued_on: "", expires_on: "", skill_id: "", document_url: "" };

function CertsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data } = useQuery({
    queryKey: ["all-certs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("certifications").select("*, employees(id, first_name, last_name, employee_no)").order("expires_on", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: opts } = useQuery({
    queryKey: ["cert-form-opts"],
    queryFn: async () => {
      const [emps, skills] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name, employee_no").order("last_name"),
        supabase.from("skills").select("id, name").order("name"),
      ]);
      return { employees: emps.data ?? [], skills: skills.data ?? [] };
    },
  });

  const addCert = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.skill_id) payload.skill_id = null;
      if (!payload.issued_on) payload.issued_on = null;
      if (!payload.expires_on) payload.expires_on = null;
      if (!payload.cert_number) payload.cert_number = null;
      if (!payload.authority) payload.authority = null;
      if (!payload.document_url) payload.document_url = null;
      const { error } = await supabase.from("certifications").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Certification added");
      setOpen(false);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["all-certs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const s = search.toLowerCase();
    return (data ?? []).filter((c: any) => {
      const label = `${c.name} ${c.cert_number ?? ""} ${c.employees?.first_name} ${c.employees?.last_name}`.toLowerCase();
      if (s && !label.includes(s)) return false;
      const days = c.expires_on ? Math.ceil((new Date(c.expires_on).getTime() - Date.now()) / 86400000) : null;
      if (status === "expired" && !(days !== null && days < 0)) return false;
      if (status === "expiring" && !(days !== null && days >= 0 && days <= 90)) return false;
      if (status === "valid" && !(days === null || days > 90)) return false;
      return true;
    });
  }, [data, search, status]);

  return (
    <>
      <SectionTabs tabs={DEVELOPMENT_TABS} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Certifications</h1>
          <p className="text-muted-foreground mt-1">All employee certifications and expiries.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add certification</Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(EMPTY); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New certification</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {opts?.employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.last_name}, {e.first_name}{e.employee_no ? ` (${e.employee_no})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Cert #</Label><Input value={form.cert_number} onChange={(e) => setForm({ ...form, cert_number: e.target.value })} /></div>
            <div><Label>Authority</Label><Input value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} /></div>
            <div><Label>Issued on</Label><Input type="date" value={form.issued_on} onChange={(e) => setForm({ ...form, issued_on: e.target.value })} /></div>
            <div><Label>Expires on</Label><Input type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Label>Linked skill (optional)</Label>
              <Select value={form.skill_id} onValueChange={(v) => setForm({ ...form, skill_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {opts?.skills.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Document URL</Label><Input value={form.document_url} onChange={(e) => setForm({ ...form, document_url: e.target.value })} placeholder="https://…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addCert.mutate()} disabled={!form.employee_id || !form.name || addCert.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="expiring">Expiring ≤ 90 days</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Certification</TableHead><TableHead>Number</TableHead><TableHead>Authority</TableHead><TableHead>Issued</TableHead><TableHead>Expires</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((c: any) => {
                const days = c.expires_on ? Math.ceil((new Date(c.expires_on).getTime() - Date.now()) / 86400000) : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell><Link to="/people/employees/$id" params={{ id: c.employees.id }} className="hover:underline">{c.employees.last_name}, {c.employees.first_name}</Link></TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.cert_number ?? "—"}</TableCell>
                    <TableCell>{c.authority ?? "—"}</TableCell>
                    <TableCell>{c.issued_on ?? "—"}</TableCell>
                    <TableCell>
                      {c.expires_on ?? "—"}
                      {days !== null && <Badge variant={days < 0 ? "destructive" : days < 30 ? "destructive" : days < 90 ? "secondary" : "outline"} className="ml-2">{days < 0 ? "expired" : `${days}d`}</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!rows.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No certifications match.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
