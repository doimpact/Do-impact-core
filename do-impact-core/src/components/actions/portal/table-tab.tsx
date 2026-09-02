import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ArrowUpDown } from "lucide-react";
import { ActionRow, ActionStatus, MODULE_TONE, STATUS_LABEL, STATUS_TONE, daysBetween, todayISO } from "@/lib/execution-actions";
import { ProgressBar, rollup } from "@/lib/execution-rollups";
import { editCaps, statusOptions, useUpdateAction } from "@/lib/execution-mutations";

type SortKey = "module" | "title" | "parent" | "owner" | "start" | "due" | "status" | "late";

export function TableTab({ rows, onSelect }: { rows: ActionRow[]; onSelect: (r: ActionRow) => void }) {
  const today = todayISO();
  const [sort, setSort] = useState<SortKey>("due");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const update = useUpdateAction();

  const lateDays = (r: ActionRow) =>
    r.due_date && r.due_date < today && r.status !== "done" ? daysBetween(r.due_date, today) : 0;

  const sorted = useMemo(() => {
    const val = (r: ActionRow): string | number => {
      switch (sort) {
        case "module": return r.module;
        case "title": return r.title.toLowerCase();
        case "parent": return (r.parent ?? "").toLowerCase();
        case "owner": return (r.owner_name ?? "zzz").toLowerCase();
        case "start": return r.start_date ?? "9999";
        case "due": return r.due_date ?? "9999";
        case "status": return r.status;
        case "late": return lateDays(r);
      }
    };
    const out = [...rows].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return dir === "asc" ? out : out.reverse();
  }, [rows, sort, dir, today]);

  const roll = useMemo(() => rollup(rows, today), [rows, today]);

  const toggle = (k: SortKey) => {
    if (k === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(k); setDir("asc"); }
  };

  const exportCsv = () => {
    const head = ["Module", "Title", "Parent", "Owner", "Start", "Due", "Status", "Days late"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [head.join(",")].concat(
      sorted.map((r) =>
        [r.module, r.title, r.parent ?? "", r.owner_name ?? "", r.start_date ?? "", r.due_date ?? "", STATUS_LABEL[r.status], String(lateDays(r))]
          .map(esc)
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `execution-actions-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Th = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <th className={`px-3 py-2 text-left font-medium ${className ?? ""}`}>
      <button type="button" onClick={() => toggle(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sort === k ? "text-foreground" : "text-muted-foreground/40"}`} />
      </button>
    </th>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b bg-muted/30">
          <span className="text-xs text-muted-foreground">{sorted.length} actions</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-muted-foreground tabular-nums">{roll.pct}% complete · {roll.done}/{roll.total}</span>
            <div className="w-24"><ProgressBar pct={roll.pct} /></div>
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[940px]">
            <thead className="text-xs text-muted-foreground border-b bg-muted/20">
              <tr>
                <Th k="module" label="Module" />
                <Th k="title" label="Action" />
                <Th k="parent" label="Parent" />
                <Th k="owner" label="Owner" />
                <Th k="start" label="Start" />
                <Th k="due" label="Due" />
                <Th k="status" label="Status" />
                <Th k="late" label="Days late" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map((r) => {
                const late = lateDays(r);
                const caps = editCaps(r.source);
                return (
                  <tr key={r.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onSelect(r)}>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${MODULE_TONE[r.module]}`}>{r.module}</span>
                    </td>
                    <td className="px-3 py-2 font-medium max-w-[280px] truncate">{r.title || "(untitled)"}</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[180px] truncate">{r.parent ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.owner_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.start_date ?? "—"}</td>
                    <td className={`px-3 py-2 ${late > 0 ? "text-red-700 font-medium" : "text-muted-foreground"}`} onClick={(e) => e.stopPropagation()}>
                      {caps.due_date ? (
                        <Input
                          type="date"
                          value={r.due_date ?? ""}
                          onChange={(e) => update.mutate({ row: r, patch: { due_date: e.target.value || null } })}
                          className="h-7 w-[140px] text-xs"
                        />
                      ) : (r.due_date ?? "—")}
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {caps.status ? (
                        <Select value={r.status} onValueChange={(v) => update.mutate({ row: r, patch: { status: v as ActionStatus } })}>
                          <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {statusOptions(r.source).map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 ${late > 0 ? "text-red-700 font-medium" : "text-muted-foreground"}`}>{late > 0 ? late : "—"}</td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">No actions match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-3 py-2 border-t text-[11px] text-muted-foreground">
          Status and due date are editable inline; click a row to edit the owner too.
        </p>
      </CardContent>
    </Card>
  );
}
