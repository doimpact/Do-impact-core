import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { confirmThen } from "@/components/confirm-dialog";
import { Switch } from "@/components/ui/switch";


export const Route = createFileRoute("/_authenticated/people/employees")({
  head: () => ({ meta: [{ title: "Employees — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: EmployeesPage,
});

type EmployeeForm = {
  employee_no: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  department: string;
  hire_date: string;
  status: string;
};

const EMPTY: EmployeeForm = { employee_no: "", first_name: "", last_name: "", email: "", role_id: "", department: "", hire_date: "", status: "active" };

function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY);

  const { data } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const [emps, roles] = await Promise.all([
        supabase.from("employees").select("*, job_roles(id,name), archived_at").order("last_name"),
        supabase.from("job_roles").select("*").order("name"),
      ]);
      if (emps.error) throw emps.error;
      return { employees: emps.data ?? [], roles: roles.data ?? [] };
    },
  });


  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form };
      if (!payload.role_id) payload.role_id = null;
      if (!payload.hire_date) payload.hire_date = null;
      if (!payload.email) payload.email = null;
      if (!payload.employee_no) payload.employee_no = null;
      if (!payload.department) payload.department = null;
      if (editingId) {
        const { error } = await supabase.from("employees").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Employee updated" : "Employee added");
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["employees-list"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (e: any) => { console.error("employee save failed", e); toast.error(e.message ?? "Save failed"); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Employee removed"); qc.invalidateQueries({ queryKey: ["employees-list"] }); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data: rows, error } = await supabase.from("employees")
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!rows || rows.length === 0) throw new Error("Nothing was changed — this workspace is read-only or you don't have permission.");
    },
    onSuccess: (_, vars) => { toast.success(vars.archived ? "Employee archived" : "Employee restored"); qc.invalidateQueries({ queryKey: ["employees-list"] }); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e: any) => toast.error(e.message),
  });


  const openAdd = () => { setEditingId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (e: any) => {
    setEditingId(e.id);
    setForm({
      employee_no: e.employee_no ?? "",
      first_name: e.first_name ?? "",
      last_name: e.last_name ?? "",
      email: e.email ?? "",
      role_id: e.role_id ?? "",
      department: e.department ?? "",
      hire_date: e.hire_date ?? "",
      status: e.status ?? "active",
    });
    setOpen(true);
  };

  const filtered = (data?.employees ?? []).filter((e: any) => {
    if (!showArchived && e.archived_at) return false;
    const s = search.toLowerCase();
    return !s || `${e.first_name} ${e.last_name} ${e.employee_no ?? ""} ${e.email ?? ""}`.toLowerCase().includes(s);
  });


  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">
            {(data?.employees ?? []).filter((e: any) => !e.archived_at).length} active
            {(data?.employees ?? []).filter((e: any) => e.archived_at).length > 0 && (
              <span className="ml-1 text-muted-foreground">
                · {(data?.employees ?? []).filter((e: any) => e.archived_at).length} archived
              </span>
            )}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="flex items-center gap-2">
            <Switch id="show-archived-employees" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="show-archived-employees" className="text-sm text-muted-foreground">Show archived</Label>
          </div>
          <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add employee</Button>
        </div>
      </div>


      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm(EMPTY); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit employee" : "New employee"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Employee #"><Input value={form.employee_no} onChange={(e) => setForm({ ...form, employee_no: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="First name *"><Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Last name *"><Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Hire date"><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></Field>
            <div>
              <Label>Role</Label>
              <Select
                value={form.role_id || "__none"}
                onValueChange={(v) => setForm({ ...form, role_id: v === "__none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {data?.roles.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!form.first_name || !form.last_name || save.isPending}>
              {editingId ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Hire date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e: any) => (
              <TableRow key={e.id} className={e.archived_at ? "opacity-60" : ""}>
                <TableCell className="font-mono text-xs">{e.employee_no ?? "—"}</TableCell>
                <TableCell>
                  <Link to="/people/employees/$id" params={{ id: e.id }} className="font-medium hover:underline">
                    {e.archived_at ? <span className="line-through">{e.last_name}, {e.first_name}</span> : <>{e.last_name}, {e.first_name}</>}
                  </Link>
                  {e.email && <div className="text-xs text-muted-foreground">{e.email}</div>}
                </TableCell>
                <TableCell>{e.job_roles?.name ?? "—"}</TableCell>
                <TableCell>{e.department ?? "—"}</TableCell>
                <TableCell>{e.hire_date ?? "—"}</TableCell>
                <TableCell>{e.archived_at ? "Archived" : e.status}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(e)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => archive.mutate({ id: e.id, archived: !e.archived_at })} title={e.archived_at ? "Restore" : "Archive"}>
                    {e.archived_at ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { confirmThen(`Remove ${e.first_name} ${e.last_name}?`, () => { remove.mutate(e.id); }) }} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No employees yet.</TableCell></TableRow>}
          </TableBody>

        </Table>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
