import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  parseWorkbook,
  mapEmployees,
  mapSkills,
  mapRoles,
  downloadTemplate,
  chunk,
  type EmployeeRow,
  type SkillRow,
  type RoleRow,
} from "@/lib/xlsx-import";

export const Route = createFileRoute("/_authenticated/people/import")({
  head: () => ({ meta: [{ title: "Import — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ImportPage,
});

function ImportPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bulk import</h1>
        <p className="text-muted-foreground mt-1">
          Upload Excel or CSV files for employees, skills, and roles. Download a template to see the expected columns.
        </p>
      </div>
      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-4"><EmployeesTab /></TabsContent>
        <TabsContent value="skills" className="mt-4"><SkillsTab /></TabsContent>
        <TabsContent value="roles" className="mt-4"><RolesTab /></TabsContent>
      </Tabs>
    </>
  );
}

function UploadBar({
  kind,
  onFile,
  disabled,
}: {
  kind: "employees" | "skills" | "roles";
  onFile: (f: File) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="file"
        accept=".xlsx,.xls,.csv"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }}
        className="max-w-xs"
      />
      <Button variant="outline" size="sm" onClick={() => downloadTemplate(kind)}>
        <Download className="mr-2 h-4 w-4" /> Template
      </Button>
    </div>
  );
}

function Summary({ total, errors }: { total: number; errors: number }) {
  return (
    <div className="flex gap-2 text-sm">
      <Badge variant="outline">{total} rows</Badge>
      {errors > 0 && <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />{errors} invalid</Badge>}
    </div>
  );
}

// ---------- EMPLOYEES ----------

function EmployeesTab() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [createRoles, setCreateRoles] = useState(true);

  const { data: roles = [] } = useQuery({
    queryKey: ["roles-lookup"],
    queryFn: async () => {
      const { data } = await supabase.from("job_roles").select("id,name");
      return data ?? [];
    },
  });

  const roleMap = new Map(roles.map((r) => [r.name.toLowerCase(), r.id]));

  const handleFile = async (f: File) => {
    try {
      const raw = await parseWorkbook(f);
      setRows(mapEmployees(raw));
    } catch (e: any) { toast.error(e.message ?? "Failed to parse file"); }
  };

  const importMut = useMutation({
    mutationFn: async () => {
      const valid = rows.filter((r) => !r._error);
      // Auto-create missing roles
      if (createRoles) {
        const wanted = new Set(valid.map((r) => r.role?.toLowerCase()).filter(Boolean) as string[]);
        const missing = [...wanted].filter((n) => !roleMap.has(n));
        if (missing.length) {
          const { data, error } = await supabase.from("job_roles").insert(missing.map((n) => ({ name: n }))).select("id,name");
          if (error) throw error;
          for (const r of data ?? []) roleMap.set(r.name.toLowerCase(), r.id);
        }
      }
      let ok = 0, fail = 0;
      for (const batch of chunk(valid, 200)) {
        const payload = batch.map((r) => ({
          employee_no: r.employee_no,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
          department: r.department,
          hire_date: r.hire_date,
          status: r.status || "active",
          role_id: r.role ? roleMap.get(r.role.toLowerCase()) ?? null : null,
        }));
        const { error } = await supabase.from("employees").insert(payload);
        if (error) { fail += batch.length; console.error(error); }
        else ok += batch.length;
      }
      return { ok, fail };
    },
    onSuccess: ({ ok, fail }) => {
      toast.success(`Imported ${ok} employees${fail ? `, ${fail} failed` : ""}`);
      setRows([]);
      qc.invalidateQueries({ queryKey: ["employees-list"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["roles-lookup"] });
    },
    onError: (e: any) => { toast.error(e.message); console.error(e); },
  });

  const errors = rows.filter((r) => r._error).length;
  const valid = rows.length - errors;

  return (
    <Card><CardContent className="p-4 space-y-4">
      <UploadBar kind="employees" onFile={handleFile} disabled={importMut.isPending} />
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <Summary total={rows.length} errors={errors} />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={createRoles} onCheckedChange={(v) => setCreateRoles(!!v)} />
                Auto-create missing roles
              </label>
              <Button onClick={() => importMut.mutate()} disabled={!valid || importMut.isPending}>
                <Upload className="mr-2 h-4 w-4" /> Import {valid} employees
              </Button>
            </div>
          </div>
          <PreviewTable
            headers={["#", "First", "Last", "Email", "Role", "Department", "Hire date", "Status"]}
            rows={rows.slice(0, 50)}
            render={(r) => [r.employee_no, r.first_name, r.last_name, r.email, r.role, r.department, r.hire_date, r.status]}
          />
        </>
      )}
    </CardContent></Card>
  );
}

// ---------- SKILLS ----------

function SkillsTab() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<SkillRow[]>([]);
  const [createCats, setCreateCats] = useState(true);

  const { data: cats = [] } = useQuery({
    queryKey: ["skill-cats-lookup"],
    queryFn: async () => {
      const { data } = await supabase.from("skill_categories").select("id,name");
      return data ?? [];
    },
  });
  const catMap = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]));

  const handleFile = async (f: File) => {
    try {
      const raw = await parseWorkbook(f);
      setRows(mapSkills(raw));
    } catch (e: any) { toast.error(e.message ?? "Failed to parse file"); }
  };

  const importMut = useMutation({
    mutationFn: async () => {
      const valid = rows.filter((r) => !r._error);
      if (createCats) {
        const wanted = new Set(valid.map((r) => r.category?.toLowerCase()).filter(Boolean) as string[]);
        const missing = [...wanted].filter((n) => !catMap.has(n));
        if (missing.length) {
          const { data, error } = await supabase.from("skill_categories").insert(missing.map((n) => ({ name: n }))).select("id,name");
          if (error) throw error;
          for (const c of data ?? []) catMap.set(c.name.toLowerCase(), c.id);
        }
      }
      let ok = 0, fail = 0;
      for (const batch of chunk(valid, 200)) {
        const payload = batch.map((r) => ({
          name: r.name,
          description: r.description,
          is_certification: r.is_certification,
          category_id: r.category ? catMap.get(r.category.toLowerCase()) ?? null : null,
        }));
        const { error } = await supabase.from("skills").insert(payload);
        if (error) { fail += batch.length; console.error(error); } else ok += batch.length;
      }
      return { ok, fail };
    },
    onSuccess: ({ ok, fail }) => {
      toast.success(`Imported ${ok} skills${fail ? `, ${fail} failed` : ""}`);
      setRows([]);
      qc.invalidateQueries({ queryKey: ["skills-catalog"] });
      qc.invalidateQueries({ queryKey: ["skill-catalog"] });
      qc.invalidateQueries({ queryKey: ["skill-cats-lookup"] });
    },
    onError: (e: any) => { toast.error(e.message); console.error(e); },
  });

  const errors = rows.filter((r) => r._error).length;
  const valid = rows.length - errors;

  return (
    <Card><CardContent className="p-4 space-y-4">
      <UploadBar kind="skills" onFile={handleFile} disabled={importMut.isPending} />
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <Summary total={rows.length} errors={errors} />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={createCats} onCheckedChange={(v) => setCreateCats(!!v)} />
                Auto-create missing categories
              </label>
              <Button onClick={() => importMut.mutate()} disabled={!valid || importMut.isPending}>
                <Upload className="mr-2 h-4 w-4" /> Import {valid} skills
              </Button>
            </div>
          </div>
          <PreviewTable
            headers={["Category", "Name", "Description", "Cert?"]}
            rows={rows.slice(0, 50)}
            render={(r) => [r.category, r.name, r.description, r.is_certification ? "yes" : ""]}
          />
        </>
      )}
    </CardContent></Card>
  );
}

// ---------- ROLES ----------

function RolesTab() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<RoleRow[]>([]);

  const handleFile = async (f: File) => {
    try {
      const raw = await parseWorkbook(f);
      setRows(mapRoles(raw));
    } catch (e: any) { toast.error(e.message ?? "Failed to parse file"); }
  };

  const importMut = useMutation({
    mutationFn: async () => {
      const valid = rows.filter((r) => !r._error);
      let ok = 0, fail = 0;
      for (const batch of chunk(valid, 200)) {
        const payload = batch.map((r) => ({ name: r.name, department: r.department, description: r.description }));
        const { error } = await supabase.from("job_roles").insert(payload);
        if (error) { fail += batch.length; console.error(error); } else ok += batch.length;
      }
      return { ok, fail };
    },
    onSuccess: ({ ok, fail }) => {
      toast.success(`Imported ${ok} roles${fail ? `, ${fail} failed` : ""}`);
      setRows([]);
      qc.invalidateQueries({ queryKey: ["roles-page"] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["roles-lookup"] });
    },
    onError: (e: any) => { toast.error(e.message); console.error(e); },
  });

  const errors = rows.filter((r) => r._error).length;
  const valid = rows.length - errors;

  return (
    <Card><CardContent className="p-4 space-y-4">
      <UploadBar kind="roles" onFile={handleFile} disabled={importMut.isPending} />
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <Summary total={rows.length} errors={errors} />
            <Button onClick={() => importMut.mutate()} disabled={!valid || importMut.isPending}>
              <Upload className="mr-2 h-4 w-4" /> Import {valid} roles
            </Button>
          </div>
          <PreviewTable
            headers={["Name", "Department", "Description"]}
            rows={rows.slice(0, 50)}
            render={(r) => [r.name, r.department, r.description]}
          />
        </>
      )}
    </CardContent></Card>
  );
}

function PreviewTable<T extends { _error?: string }>({
  headers,
  rows,
  render,
}: {
  headers: string[];
  rows: T[];
  render: (r: T) => (string | number | null | undefined)[];
}) {
  return (
    <div className="rounded border overflow-x-auto">
      <Table>
        <TableHeader><TableRow>{headers.map((h) => <TableHead key={h}>{h}</TableHead>)}<TableHead>Issue</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((r, i) => {
            const cells = render(r);
            return (
              <TableRow key={i} className={r._error ? "bg-destructive/5" : ""}>
                {cells.map((c, j) => <TableCell key={j} className="text-xs">{c ?? "—"}</TableCell>)}
                <TableCell className="text-xs text-destructive">{r._error ?? ""}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
