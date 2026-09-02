// Lazy-load xlsx (large, browser-only) to avoid SSR eval and to keep the
// route's initial chunk small enough that stale-chunk reloads don't blank the page.
const loadXLSX = () => import("xlsx");


export type Row = Record<string, unknown>;

const normHeader = (h: string) =>
  h.toString().trim().toLowerCase().replace(/[\s_\-]+/g, "_");

export async function parseWorkbook(file: File): Promise<Row[]> {
  const XLSX = await loadXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null, raw: false });
  return rows.map((r: Row) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) out[normHeader(k)] = v;
    return out;
  });
}


const str = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

export type EmployeeRow = {
  employee_no: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  hire_date: string | null;
  status: string;
  _error?: string;
};

export function mapEmployees(rows: Row[]): EmployeeRow[] {
  return rows.map((r) => {
    const first = str(r.first_name ?? r.firstname ?? r.given_name);
    const last = str(r.last_name ?? r.lastname ?? r.surname ?? r.family_name);
    const row: EmployeeRow = {
      employee_no: str(r.employee_no ?? r.employee ?? r.emp_no ?? r.id),
      first_name: first ?? "",
      last_name: last ?? "",
      email: str(r.email ?? r.mail),
      role: str(r.role ?? r.job_role ?? r.title),
      department: str(r.department ?? r.dept),
      hire_date: str(r.hire_date ?? r.start_date ?? r.hired_on),
      status: (str(r.status) ?? "active").toLowerCase(),
    };
    if (!first || !last) row._error = "Missing first_name or last_name";
    return row;
  });
}

export type SkillRow = {
  category: string | null;
  name: string;
  description: string | null;
  is_certification: boolean;
  _error?: string;
};

export function mapSkills(rows: Row[]): SkillRow[] {
  return rows.map((r) => {
    const name = str(r.name ?? r.skill ?? r.skill_name);
    const isCert = String(r.is_certification ?? r.certification ?? "").toLowerCase();
    const row: SkillRow = {
      category: str(r.category ?? r.skill_category ?? r.group),
      name: name ?? "",
      description: str(r.description ?? r.desc),
      is_certification: ["true", "yes", "1", "y"].includes(isCert),
    };
    if (!name) row._error = "Missing name";
    return row;
  });
}

export type RoleRow = {
  name: string;
  department: string | null;
  description: string | null;
  _error?: string;
};

export function mapRoles(rows: Row[]): RoleRow[] {
  return rows.map((r) => {
    const name = str(r.name ?? r.role ?? r.role_name ?? r.title);
    const row: RoleRow = {
      name: name ?? "",
      department: str(r.department ?? r.dept),
      description: str(r.description ?? r.desc),
    };
    if (!name) row._error = "Missing name";
    return row;
  });
}

export async function downloadTemplate(kind: "employees" | "skills" | "roles") {
  const XLSX = await loadXLSX();
  const headers: Record<typeof kind, string[]> = {
    employees: ["employee_no", "first_name", "last_name", "email", "role", "department", "hire_date", "status"],
    skills: ["category", "name", "description", "is_certification"],
    roles: ["name", "department", "description"],
  } as const;
  const examples: Record<typeof kind, unknown[][]> = {
    employees: [["E001", "Jane", "Doe", "jane@example.com", "Technician", "Maintenance", "2024-01-15", "active"]],
    skills: [["NDT", "Ultrasonic Testing Level 2", "UT-2 per EN 4179", "true"]],
    roles: [["Line Maintenance Technician", "Maintenance", "Performs line checks and defects"]],
  } as const;
  const ws = XLSX.utils.aoa_to_sheet([headers[kind], ...examples[kind]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, kind);
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;

  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const filename = `${kind}-template.xlsx`;

  // Preferred path: File System Access API save dialog (works in sandboxed iframes).
  const w = window as unknown as {
    showSaveFilePicker?: (opts: unknown) => Promise<{
      createWritable: () => Promise<{ write: (d: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Excel Workbook", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return;
      // fall through to anchor/newtab fallback
    }
  }

  const url = URL.createObjectURL(blob);
  // Anchor download — works in top-level windows; may be blocked in sandboxed iframes.
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Fallback for sandboxed iframes (e.g. Lovable preview) where the anchor click is silently dropped.
  // Open the blob in a new tab so the user can save it manually.
  setTimeout(() => {
    try { window.open(url, "_blank", "noopener"); } catch { /* ignore */ }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, 100);
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
