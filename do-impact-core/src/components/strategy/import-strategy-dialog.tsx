import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Row = Record<string, unknown>;
type Kind = "themes" | "objectives";

const ALIAS: Record<Kind, Record<string, string[]>> = {
  themes: {
    title: ["title", "name", "theme", "theme name"],
    description: ["description", "desc", "notes", "summary"],
    color: ["color", "colour", "hex"],
    sort_order: ["sort_order", "order", "sort", "priority"],
  },
  objectives: {
    title: ["title", "name", "objective", "objective title"],
    description: ["description", "desc", "notes", "summary"],
    theme: ["theme", "theme title", "theme name", "strategic theme"],
    horizon_year: ["horizon_year", "horizon", "year", "yr", "horizon (1-3)"],
    target_metric: ["target_metric", "target", "metric", "kpi"],
    status: ["status", "state"],
  },
};

const STATUS = new Set(["not_started", "on_track", "at_risk", "done"]);
const DEFAULT_COLOR = "#e85d3a";

function normalize(kind: Kind, row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.trim().toLowerCase();
    let mapped = key;
    for (const [canonical, aliases] of Object.entries(ALIAS[kind])) {
      if (aliases.includes(key)) { mapped = canonical; break; }
    }
    out[mapped] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

export function ImportStrategyDialog({ kind, onDone }: { kind: Kind; onDone?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  const label = kind === "themes" ? "themes" : "objectives";

  function reset() { setRows([]); setFileName(""); setResult(null); }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const buf = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" }).map((r: Row) => normalize(kind, r));
    setRows(parsed);
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const sample =
      kind === "themes"
        ? [{ title: "Operational Excellence", description: "Lean, safe, on-time", color: "#0ea5e9", sort_order: 1 }]
        : [{ title: "Reduce turnaround time by 20%", description: "Focus on hangar throughput", theme: "Operational Excellence", horizon_year: 1, target_metric: "TAT days", status: "on_track" }];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kind);
    XLSX.writeFile(wb, `${kind}-template.xlsx`);
  }

  async function doImport() {
    setBusy(true);
    const errors: string[] = [];
    let ok = 0, failed = 0;

    if (kind === "themes") {
      const { data: existing } = await supabase.from("strategic_themes").select("id, title, sort_order");
      const map = new Map<string, string>();
      let maxSort = 0;
      for (const t of existing ?? []) {
        map.set(t.title.trim().toLowerCase(), t.id);
        if ((t.sort_order ?? 0) > maxSort) maxSort = t.sort_order ?? 0;
      }
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const title = String(r.title ?? "").trim();
        if (!title) { failed++; errors.push(`Row ${i + 2}: missing title`); continue; }
        if (map.has(title.toLowerCase())) { failed++; errors.push(`Row ${i + 2}: "${title}" already exists`); continue; }
        const sortRaw = Number(r.sort_order);
        const sort_order = Number.isFinite(sortRaw) && sortRaw > 0 ? sortRaw : ++maxSort;
        const color = String(r.color ?? "").trim() || DEFAULT_COLOR;
        const { error } = await supabase.from("strategic_themes").insert({
          title,
          description: String(r.description ?? "").trim() || null,
          color,
          sort_order,
        });
        if (error) { failed++; errors.push(`Row ${i + 2} (${title}): ${error.message}`); }
        else ok++;
      }
    } else {
      const { data: themes } = await supabase.from("strategic_themes").select("id, title, sort_order");
      const themeMap = new Map<string, string>();
      let maxSort = 0;
      for (const t of themes ?? []) {
        themeMap.set(t.title.trim().toLowerCase(), t.id);
        if ((t.sort_order ?? 0) > maxSort) maxSort = t.sort_order ?? 0;
      }
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const title = String(r.title ?? "").trim();
        if (!title) { failed++; errors.push(`Row ${i + 2}: missing title`); continue; }
        const yr = Number(r.horizon_year);
        if (!Number.isInteger(yr) || yr < 1 || yr > 3) { failed++; errors.push(`Row ${i + 2}: horizon_year must be 1, 2 or 3`); continue; }

        const themeName = String(r.theme ?? "").trim();
        let theme_id: string | null = null;
        if (themeName) {
          theme_id = themeMap.get(themeName.toLowerCase()) ?? null;
          if (!theme_id) {
            const { data: newTheme, error: tErr } = await supabase
              .from("strategic_themes")
              .insert({ title: themeName, color: DEFAULT_COLOR, sort_order: ++maxSort })
              .select("id").single();
            if (tErr || !newTheme) { failed++; errors.push(`Row ${i + 2}: could not create theme "${themeName}" — ${tErr?.message}`); continue; }
            theme_id = newTheme.id;
            themeMap.set(themeName.toLowerCase(), theme_id!);

          }
        }

        const status = String(r.status ?? "").trim().toLowerCase();
        const { error } = await supabase.from("strategic_objectives").insert({
          title,
          description: String(r.description ?? "").trim() || null,
          theme_id,
          horizon_year: yr,
          target_metric: String(r.target_metric ?? "").trim() || null,
          status: (STATUS.has(status) ? status : "not_started") as "not_started" | "on_track" | "at_risk" | "done",
        });
        if (error) { failed++; errors.push(`Row ${i + 2} (${title}): ${error.message}`); }
        else ok++;
      }
    }

    setBusy(false);
    setResult({ ok, failed, errors: errors.slice(0, 20) });
    if (ok > 0) {
      toast.success(`Imported ${ok} ${label}`);
      qc.invalidateQueries({ queryKey: ["strategy-themes"] });
      qc.invalidateQueries({ queryKey: ["strategy-objectives"] });
      onDone?.();
    }
  }

  const themeCols = "title, description, color, sort_order";
  const objCols = "title, description, theme, horizon_year (1-3), target_metric, status";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Import</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import {label} from Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Columns: <span className="font-mono text-xs">{kind === "themes" ? themeCols : objCols}</span>.
              {kind === "objectives" && " Missing themes are created automatically."}
            </p>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}><Download className="mr-1 h-4 w-4" />Template</Button>
          </div>

          <Input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} />

          {fileName && <p className="text-xs text-muted-foreground">{fileName} — {rows.length} row{rows.length === 1 ? "" : "s"} detected</p>}

          {rows.length > 0 && !result && (
            <Card className="max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/40"><tr>
                  <th className="px-2 py-1 text-left">Title</th>
                  {kind === "objectives" && <>
                    <th className="px-2 py-1 text-left">Theme</th>
                    <th className="px-2 py-1 text-left">Year</th>
                  </>}
                  <th className="px-2 py-1 text-left">Description</th>
                </tr></thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{String(r.title ?? "")}</td>
                      {kind === "objectives" && <>
                        <td className="px-2 py-1">{String(r.theme ?? "")}</td>
                        <td className="px-2 py-1">{String(r.horizon_year ?? "")}</td>
                      </>}
                      <td className="px-2 py-1 text-muted-foreground truncate max-w-[280px]">{String(r.description ?? "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {result && (
            <Card className="space-y-2 p-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" />{result.ok} imported</span>
                {result.failed > 0 && <span className="inline-flex items-center gap-1 text-destructive"><AlertCircle className="h-4 w-4" />{result.failed} failed</span>}
              </div>
              {result.errors.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-auto text-xs text-muted-foreground">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={doImport} disabled={busy || rows.length === 0 || !!result}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
