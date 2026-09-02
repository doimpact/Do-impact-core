import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/confirm-dialog";
import { saveBlob } from "@/lib/save-blob";
import { usePfmeaMutations, usePfmeaRows } from "./use-pfmea";
import { PfmeaRowDialog } from "./pfmea-row-dialog";
import {
  ACTION_STATUSES,
  AP_LABEL,
  actionPriority,
  apClasses,
  emptyDraftRow,
  rpn,
  type DraftRow,
  type PfmeaRow,
  type PfmeaStudy,
} from "./pfmea-types";

type Editable = Omit<DraftRow, "tempId">;

export function PfmeaWorksheet({ study, onBack }: { study: PfmeaStudy; onBack: () => void }) {
  const { data: rows = [], isLoading } = usePfmeaRows(study.id);
  const { saveRow, addRow, deleteRow } = usePfmeaMutations();
  const [editing, setEditing] = useState<{ id: string | null; row: Editable } | null>(null);
  const [q, setQ] = useState("");
  const [apFilter, setApFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"order" | "ap" | "rpn" | "severity">("order");

  const enriched = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        ap: actionPriority(r.severity, r.occurrence, r.detection),
        rpnValue: rpn(r.severity, r.occurrence, r.detection),
      })),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const apRank = { H: 3, M: 2, L: 1 } as const;
    return enriched
      .filter((r) => {
        if (apFilter !== "all" && r.ap !== apFilter) return false;
        if (statusFilter !== "all" && r.action_status !== statusFilter) return false;
        if (!needle) return true;
        return [r.step_name, r.failure_mode, r.effect, r.cause, r.action]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        if (sortBy === "ap") return (b.ap ? apRank[b.ap] : 0) - (a.ap ? apRank[a.ap] : 0);
        if (sortBy === "rpn") return (b.rpnValue ?? 0) - (a.rpnValue ?? 0);
        if (sortBy === "severity") return (b.severity ?? 0) - (a.severity ?? 0);
        return a.sort_order - b.sort_order;
      });
  }, [enriched, q, apFilter, statusFilter, sortBy]);

  const highAp = enriched.filter((r) => r.ap === "H").length;
  const openActions = enriched.filter((r) => r.action && (r.action_status === "open" || r.action_status === "in_progress")).length;

  async function handleSave(row: Editable) {
    try {
      if (editing?.id) await saveRow.mutateAsync({ id: editing.id, patch: row as Partial<PfmeaRow> });
      else await addRow.mutateAsync({ ...row, study_id: study.id, sort_order: rows.length + 1 });
      toast.success("Line saved");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the line");
    }
  }

  async function handleDelete(row: PfmeaRow) {
    const ok = await confirmDialog({
      title: "Delete this line?",
      description: `"${row.step_name}" will be permanently removed from this PFMEA.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteRow.mutateAsync(row.id);
      toast.success("Line deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the line");
    }
  }

  const exportName = `${study.part_number}-pfmea`.replace(/[^a-zA-Z0-9-_]/g, "-");

  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const aoa = [
        ["Step", "Process step", "Function / requirement", "Failure mode", "Effect", "S", "Class", "Cause", "O",
          "Prevention control", "Detection control", "D", "AP", "RPN", "Recommended action", "Status", "Due"],
        ...enriched.map((r) => [
          r.step_no ?? "", r.step_name, r.function_req ?? "", r.failure_mode ?? "", r.effect ?? "",
          r.severity ?? "", r.classification ?? "", r.cause ?? "", r.occurrence ?? "",
          r.prevention_control ?? "", r.detection_control ?? "", r.detection ?? "",
          r.ap ? AP_LABEL[r.ap] : "", r.rpnValue ?? "", r.action ?? "", r.action_status, r.due_date ?? "",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = aoa[0].map((_, i) => ({ wch: i === 1 || i > 2 ? 24 : 8 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PFMEA");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      await saveBlob(
        new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${exportName}.xlsx`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export the worksheet");
    }
  }

  async function exportPdf() {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
      doc.setFontSize(14);
      doc.text(study.title ?? `PFMEA — ${study.part_number}`, 32, 36);
      doc.setFontSize(9);
      doc.text(
        [study.part_number, study.part_name, study.customer, study.program, study.revision ? `Rev ${study.revision}` : null]
          .filter(Boolean)
          .join("  ·  "),
        32,
        52,
      );
      autoTable(doc, {
        startY: 66,
        styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [30, 39, 97] },
        head: [["Step", "Process step", "Failure mode", "Effect", "S", "Cause", "O", "Prevention", "Detection ctrl", "D", "AP", "RPN", "Action", "Status"]],
        body: enriched.map((r) => [
          r.step_no ?? "", r.step_name, r.failure_mode ?? "", r.effect ?? "", r.severity ?? "",
          r.cause ?? "", r.occurrence ?? "", r.prevention_control ?? "", r.detection_control ?? "", r.detection ?? "",
          r.ap ? AP_LABEL[r.ap] : "", r.rpnValue ?? "", r.action ?? "", r.action_status,
        ]),
      });
      await saveBlob(doc.output("blob"), `${exportName}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export the PDF");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All PFMEAs
          </Button>
          <h3 className="text-xl font-bold">{study.title ?? `PFMEA — ${study.part_number}`}</h3>
          <p className="text-sm text-muted-foreground">
            {[study.part_number, study.part_name, study.customer, study.program, study.revision ? `Rev ${study.revision}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={exportPdf}><Download className="h-4 w-4 mr-1" /> PDF</Button>
          <Button size="sm" onClick={() => setEditing({ id: null, row: { ...emptyDraftRow(rows.length + 1) } })}>
            <Plus className="h-4 w-4 mr-1" /> Add line
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">{rows.length} lines</Badge>
        <Badge variant="outline" className={apClasses("H")}>{highAp} high AP</Badge>
        <Badge variant="outline">{openActions} open actions</Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <Input placeholder="Search step, failure, cause…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={apFilter} onValueChange={setApFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All action priorities</SelectItem>
            <SelectItem value="H">High</SelectItem>
            <SelectItem value="M">Medium</SelectItem>
            <SelectItem value="L">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All action statuses</SelectItem>
            {ACTION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="order">Sort: process order</SelectItem>
            <SelectItem value="ap">Sort: action priority</SelectItem>
            <SelectItem value="rpn">Sort: RPN</SelectItem>
            <SelectItem value="severity">Sort: severity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              {["Step", "Process step / function", "Failure mode & effect", "S", "Cause", "O", "Controls", "D", "AP", "RPN", "Action", ""].map((h) => (
                <th key={h} className="px-2 py-2 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && visible.length === 0 && (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">No lines match these filters.</td></tr>
            )}
            {visible.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-2 py-2 font-mono text-muted-foreground">{r.step_no ?? r.sort_order}</td>
                <td className="px-2 py-2 max-w-[200px]">
                  <div className="font-medium">{r.step_name}</div>
                  <div className="text-muted-foreground">{r.function_req}</div>
                </td>
                <td className="px-2 py-2 max-w-[240px]">
                  <div>{r.failure_mode}</div>
                  <div className="text-muted-foreground">{r.effect}</div>
                </td>
                <td className="px-2 py-2 font-mono">{r.severity ?? "—"}{r.classification ? <div className="text-[10px] text-muted-foreground">{r.classification}</div> : null}</td>
                <td className="px-2 py-2 max-w-[180px]">{r.cause}</td>
                <td className="px-2 py-2 font-mono">{r.occurrence ?? "—"}</td>
                <td className="px-2 py-2 max-w-[220px]">
                  <div>{r.prevention_control}</div>
                  <div className="text-muted-foreground">{r.detection_control}</div>
                </td>
                <td className="px-2 py-2 font-mono">{r.detection ?? "—"}</td>
                <td className="px-2 py-2">
                  <Badge variant="outline" className={apClasses(r.ap)}>{r.ap ? AP_LABEL[r.ap] : "—"}</Badge>
                </td>
                <td className="px-2 py-2 font-mono">{r.rpnValue ?? "—"}</td>
                <td className="px-2 py-2 max-w-[200px]">
                  {r.action ? (
                    <>
                      <div>{r.action}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {ACTION_STATUSES.find((s) => s.value === r.action_status)?.label}
                        {r.due_date ? ` · due ${r.due_date}` : ""}
                      </div>
                    </>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                    const { id: _id, study_id: _sid, ...rest } = r as PfmeaRow;
                    void _id; void _sid;
                    setEditing({ id: r.id, row: rest as Editable });
                  }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => void handleDelete(r)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PfmeaRowDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing?.row ?? null}
        onSave={handleSave}
        saving={saveRow.isPending || addRow.isPending}
      />
    </div>
  );
}
