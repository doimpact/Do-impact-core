import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_TYPES, STATUSES, isOverdue, riskBand, statusLabel, typeLabel, type SafetyReport } from "@/lib/safety";

const ALL = "__all";

export function SafetyRegister({
  reports,
  onOpen,
}: {
  reports: SafetyReport[];
  onOpen: (r: SafetyReport) => void;
}) {
  const [status, setStatus] = useState<string>("open_only");
  const [type, setType] = useState<string>(ALL);
  const [risk, setRisk] = useState<string>(ALL);
  const [dept, setDept] = useState<string>(ALL);
  const [q, setQ] = useState("");

  const departments = useMemo(
    () => Array.from(new Set(reports.map((r) => r.department).filter(Boolean) as string[])).sort(),
    [reports],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return reports.filter((r) => {
      if (status === "open_only" && r.status === "closed") return false;
      if (status === "overdue" && !isOverdue(r)) return false;
      if (status !== "open_only" && status !== "overdue" && status !== ALL && r.status !== status) return false;
      if (type !== ALL && r.report_type !== type) return false;
      if (dept !== ALL && (r.department || "") !== dept) return false;
      if (risk !== ALL && riskBand(r.risk_score).key !== risk) return false;
      if (needle && !`${r.ref ?? ""} ${r.description} ${r.location ?? ""} ${r.department ?? ""}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [reports, status, type, risk, dept, q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search register…" className="pl-8" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open_only">Open items</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={risk} onValueChange={setRisk}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All risk</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {REPORT_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {departments.length > 0 && (
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Ref</TableHead>
              <TableHead>Finding</TableHead>
              <TableHead className="w-[150px]">Type</TableHead>
              <TableHead className="w-[90px]">Risk</TableHead>
              <TableHead className="w-[120px]">Due</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nothing here yet. Use “Report a hazard” to add the first entry.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => {
              const band = riskBand(r.risk_score);
              const overdue = isOverdue(r);
              return (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => onOpen(r)}>
                  <TableCell className="font-mono text-xs">{r.ref ?? "—"}</TableCell>
                  <TableCell>
                    <div className="max-w-[420px] truncate font-medium">{r.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.department || "—"} · {r.location || "—"} · {new Date(r.occurred_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{typeLabel(r.report_type)}</TableCell>
                  <TableCell>
                    <Badge className={cn("border-0", band.className)}>{r.risk_score} {band.label}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-sm", overdue && "font-semibold text-destructive")}>
                    {r.due_date ? (
                      <span className="inline-flex items-center gap-1">
                        {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                        {r.due_date}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "closed" ? "secondary" : "outline"}>{statusLabel(r.status)}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{rows.length} of {reports.length} records</span>
        <Button variant="ghost" size="sm" onClick={() => { setStatus(ALL); setType(ALL); setRisk(ALL); setDept(ALL); setQ(""); }}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
