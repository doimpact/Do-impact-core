import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveBlob } from "@/lib/save-blob";

type Row = Record<string, unknown>;

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "contact", "contact name", "stakeholder"],
  account: ["account", "account name", "company", "customer", "organization", "organisation"],
  title: ["title", "job title", "role", "position"],
  email: ["email", "e-mail", "mail"],
  phone: ["phone", "phone number", "mobile", "tel"],
  decision_role: ["decision role", "decision", "buying role", "buyer role"],
  influence: ["influence", "influence level"],
  relationship_strength: ["relationship", "relationship strength", "strength"],
  is_primary: ["primary", "is primary", "primary contact"],
  notes: ["notes", "note", "comments"],
};

function normalizeHeaders(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.trim().toLowerCase();
    let mapped = key;
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key)) { mapped = canonical; break; }
    }
    out[mapped] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

const INFLUENCE = new Set(["low", "medium", "high"]);
const STRENGTH = new Set(["weak", "neutral", "strong", "champion"]);

function truthy(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "x";
}

export function ImportStakeholdersDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  function reset() {
    setRows([]); setFileName(""); setResult(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const buf = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" }).map(normalizeHeaders);
    setRows(parsed);
  }

  async function downloadTemplate() {
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet([{
        name: "Jane Doe", account: "Acme Aerospace", title: "Director of Maintenance",
        email: "jane@acme.com", phone: "+1 555 0100", decision_role: "Decision maker",
        influence: "high", relationship_strength: "strong", is_primary: "yes", notes: "",
      }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Stakeholders");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      await saveBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "stakeholders-template.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download template");
    }
  }

  async function doImport() {
    setBusy(true);
    const errors: string[] = [];
    let ok = 0, failed = 0;

    // Fetch existing accounts
    const { data: accs } = await supabase.from("accounts").select("id, name");
    const accountMap = new Map<string, string>();
    for (const a of accs ?? []) accountMap.set(a.name.trim().toLowerCase(), a.id);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = String(r.name ?? "").trim();
      const accountName = String(r.account ?? "").trim();
      if (!name || !accountName) { failed++; errors.push(`Row ${i + 2}: missing name or account`); continue; }

      let accountId = accountMap.get(accountName.toLowerCase());
      if (!accountId) {
        const { data: newAcc, error: accErr } = await supabase.from("accounts")
          .insert({ name: accountName }).select("id").single();
        if (accErr || !newAcc) { failed++; errors.push(`Row ${i + 2}: could not create account "${accountName}" — ${accErr?.message}`); continue; }
        accountId = newAcc.id;
        accountMap.set(accountName.toLowerCase(), accountId!);

      }

      const influence = String(r.influence ?? "").trim().toLowerCase();
      const strength = String(r.relationship_strength ?? "").trim().toLowerCase();

      const payload = {
        account_id: accountId,
        name,
        title: String(r.title ?? "").trim() || null,
        email: String(r.email ?? "").trim() || null,
        phone: String(r.phone ?? "").trim() || null,
        decision_role: String(r.decision_role ?? "").trim() || null,
        influence: INFLUENCE.has(influence) ? influence : null,
        relationship_strength: STRENGTH.has(strength) ? strength : null,
        is_primary: truthy(r.is_primary),
        notes: String(r.notes ?? "").trim() || null,
      };
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) { failed++; errors.push(`Row ${i + 2} (${name}): ${error.message}`); }
      else ok++;
    }

    setBusy(false);
    setResult({ ok, failed, errors: errors.slice(0, 20) });
    if (ok > 0) {
      toast.success(`Imported ${ok} stakeholder${ok === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["stakeholders-all"] });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Import</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import stakeholders from Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Columns: <span className="font-mono text-xs">name, account, title, email, phone, decision_role, influence, relationship_strength, is_primary, notes</span>. Missing accounts are created automatically.
            </p>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Template</Button>
          </div>

          <Input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} />

          {fileName && <p className="text-xs text-muted-foreground">{fileName} — {rows.length} row{rows.length === 1 ? "" : "s"} detected</p>}

          {rows.length > 0 && !result && (
            <Card className="max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 sticky top-0"><tr>
                  <th className="px-2 py-1 text-left">Name</th><th className="px-2 py-1 text-left">Account</th>
                  <th className="px-2 py-1 text-left">Title</th><th className="px-2 py-1 text-left">Email</th>
                </tr></thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1">{String(r.name ?? "")}</td>
                      <td className="px-2 py-1">{String(r.account ?? "")}</td>
                      <td className="px-2 py-1 text-muted-foreground">{String(r.title ?? "")}</td>
                      <td className="px-2 py-1 text-muted-foreground">{String(r.email ?? "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {result && (
            <Card className="p-3 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" />{result.ok} imported</span>
                {result.failed > 0 && <span className="inline-flex items-center gap-1 text-destructive"><AlertCircle className="w-4 h-4" />{result.failed} failed</span>}
              </div>
              {result.errors.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={doImport} disabled={busy || rows.length === 0 || !!result}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} row${rows.length === 1 ? "" : "s"}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
