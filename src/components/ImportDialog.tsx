import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportColumn = { key: string; required?: boolean; example?: string; hint?: string };
export type ParsedRow<T> = { rowNumber: number; raw: Record<string, unknown>; data: T | null; errors: string[]; warning?: string };

export type ImportDialogProps<T> = {
  trigger: React.ReactNode;
  title: string;
  entity: string;
  templateName: string;
  columns: ImportColumn[];
  parseRow: (raw: Record<string, unknown>, rowNumber: number) => { data: T | null; errors: string[]; warning?: string };
  onImport: (rows: T[]) => Promise<{ inserted: number; failed: number }>;
  extraControls?: React.ReactNode;
  onDone?: () => void;
};

export function ImportDialog<T>({ trigger, title, entity, templateName, columns, parseRow, onImport, extraControls, onDone }: ImportDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow<T>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const valid = useMemo(() => rows.filter((r) => r.errors.length === 0 && r.data), [rows]);
  const invalid = rows.length - valid.length;

  function reset() {
    setRows([]); setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function downloadTemplate() {
    try {
      const XLSX = await import("xlsx");
      const header = columns.map((c) => c.key);
      const example = columns.map((c) => c.example ?? "");
      const ws = XLSX.utils.aoa_to_sheet([header, example]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entity);
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const { saveBlob } = await import("@/lib/save-blob");
      await saveBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), templateName);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download template");
    }
  }

  async function handleFile(f: File) {
    setFileName(f.name);
    const XLSX = await import("xlsx");
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
    const normalized = json.map((raw: Record<string, unknown>, i: number) => {
      const lower: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) lower[k.trim().toLowerCase()] = typeof v === "string" ? v.trim() : v;
      const result = parseRow(lower, i + 2);
      return { rowNumber: i + 2, raw: lower, ...result };
    });
    setRows(normalized);
  }

  async function runImport() {
    if (valid.length === 0) return;
    setBusy(true);
    try {
      const res = await onImport(valid.map((r) => r.data as T));
      toast.success(`Imported ${res.inserted} ${entity}${res.failed ? ` · ${res.failed} failed` : ""}`);
      onDone?.();
      setOpen(false);
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" /> {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-2">
            <div className="font-medium">Expected columns</div>
            <div className="flex flex-wrap gap-1.5">
              {columns.map((c) => (
                <Badge key={c.key} variant={c.required ? "default" : "outline"} className="font-mono text-[10px]">
                  {c.key}{c.required && " *"}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5" /> Download template
            </Button>
          </div>
          <div>
            <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/40 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">{fileName || "Choose a .xlsx or .csv file"}</div>
                <div className="text-xs text-muted-foreground">Parsed in your browser — no upload until you confirm.</div>
              </div>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
            </label>
          </div>
          {extraControls && rows.length > 0 && (<div className="rounded-md border p-3">{extraControls}</div>)}
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-500">
                  <CheckCircle2 className="w-4 h-4" /> {valid.length} valid
                </span>
                {invalid > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="w-4 h-4" /> {invalid} with errors
                  </span>
                )}
                <span className="text-muted-foreground">· {rows.length} total</span>
              </div>
              <div className="max-h-72 overflow-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium w-10">#</th>
                      {columns.map((c) => (<th key={c.key} className="px-2 py-1.5 text-left font-medium">{c.key}</th>))}
                      <th className="px-2 py-1.5 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r) => (
                      <tr key={r.rowNumber} className={cn("border-t", r.errors.length && "bg-destructive/5")}>
                        <td className="px-2 py-1 text-muted-foreground">{r.rowNumber}</td>
                        {columns.map((c) => (
                          <td key={c.key} className="px-2 py-1 truncate max-w-[140px]">{String(r.raw[c.key] ?? "")}</td>
                        ))}
                        <td className="px-2 py-1">
                          {r.errors.length > 0 ? (<span className="text-destructive">{r.errors.join("; ")}</span>)
                            : r.warning ? (<span className="text-amber-600 dark:text-amber-500">{r.warning}</span>)
                            : (<span className="text-green-600 dark:text-green-500">OK</span>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (<div className="px-2 py-1.5 text-[11px] text-muted-foreground border-t bg-muted/30">Showing first 50 of {rows.length} rows.</div>)}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
          <Button onClick={runImport} disabled={busy || valid.length === 0}>
            {busy ? "Importing…" : `Import ${valid.length} ${entity}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
