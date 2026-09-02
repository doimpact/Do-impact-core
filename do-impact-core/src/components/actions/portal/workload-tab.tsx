import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActionRow, addDaysISO, isOverdue, todayISO } from "@/lib/execution-actions";
import { ProgressBar } from "@/lib/execution-rollups";

export function WorkloadTab({ rows, onSelectOwner }: { rows: ActionRow[]; onSelectOwner: (ownerId: string) => void }) {
  const today = todayISO();
  const in7 = addDaysISO(today, 7);
  const in30 = addDaysISO(today, 30);

  const owners = useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; open: number; in_progress: number; blocked: number; done: number; overdue: number; d7: number; d30: number }>();
    for (const r of rows) {
      const id = r.owner_id ?? "none";
      const name = r.owner_name ?? "Unassigned";
      if (!map.has(id)) map.set(id, { id, name, total: 0, open: 0, in_progress: 0, blocked: 0, done: 0, overdue: 0, d7: 0, d30: 0 });
      const o = map.get(id)!;
      o.total++;
      o[r.status]++;
      if (isOverdue(r, today)) o.overdue++;
      if (r.due_date && r.status !== "done" && r.due_date >= today && r.due_date <= in7) o.d7++;
      if (r.due_date && r.status !== "done" && r.due_date >= today && r.due_date <= in30) o.d30++;
    }
    return Array.from(map.values()).sort((a, b) => b.overdue - a.overdue || b.total - a.total);
  }, [rows, today, in7, in30]);

  const max = Math.max(1, ...owners.map((o) => o.total));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-xs text-muted-foreground border-b bg-muted/20">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Owner</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-3 py-2 text-right font-medium">Overdue</th>
                <th className="px-3 py-2 text-right font-medium">Due 7d</th>
                <th className="px-3 py-2 text-right font-medium">Due 30d</th>
                <th className="px-3 py-2 text-left font-medium w-[160px]">% complete</th>
                <th className="px-3 py-2 text-left font-medium w-[280px]">Status mix</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {owners.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => onSelectOwner(o.id === "none" ? "none" : o.id)}
                >
                  <td className="px-3 py-2 font-medium">{o.name}</td>
                  <td className="px-3 py-2 text-right">{o.total}</td>
                  <td className={`px-3 py-2 text-right ${o.overdue > 0 ? "text-red-700 font-semibold" : "text-muted-foreground"}`}>{o.overdue || "—"}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{o.d7 || "—"}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{o.d30 || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ProgressBar pct={o.total ? Math.round((o.done / o.total) * 100) : 0} className="flex-1" />
                      <span className="text-[11px] text-muted-foreground tabular-nums w-16 text-right">
                        {o.total ? Math.round((o.done / o.total) * 100) : 0}% · {o.done}/{o.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex h-2.5 rounded overflow-hidden bg-muted" style={{ width: `${Math.max(12, (o.total / max) * 100)}%` }}>
                      <Seg n={o.blocked} total={o.total} className="bg-red-500" />
                      <Seg n={o.in_progress} total={o.total} className="bg-blue-500" />
                      <Seg n={o.open} total={o.total} className="bg-neutral-400" />
                      <Seg n={o.done} total={o.total} className="bg-emerald-500" />
                    </div>
                  </td>
                </tr>
              ))}
              {owners.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">No actions match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 px-3 py-2 border-t text-[11px] text-muted-foreground">
          <Legend className="bg-red-500" label="Blocked" />
          <Legend className="bg-blue-500" label="In progress" />
          <Legend className="bg-neutral-400" label="Open" />
          <Legend className="bg-emerald-500" label="Done" />
          <span className="ml-auto">Click a row to filter the portal by that owner.</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Seg({ n, total, className }: { n: number; total: number; className: string }) {
  if (!n) return null;
  return <div className={className} style={{ width: `${(n / total) * 100}%` }} />;
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-4 rounded ${className}`} /> {label}
    </span>
  );
}
