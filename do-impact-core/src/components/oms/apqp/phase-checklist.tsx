import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APQP_PHASES, ITEM_STATUSES, type ApqpItemStatus, type ApqpPhaseItem } from "@/lib/apqp";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader } from "lucide-react";

interface Props {
  items: ApqpPhaseItem[];
  currentPhase: number;
  onUpdateItem: (id: string, patch: Partial<ApqpPhaseItem>) => void;
}

function statusIcon(status: ApqpItemStatus) {
  if (status === "complete") return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  if (status === "in_progress") return <Loader className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function ApqpPhaseChecklist({ items, currentPhase, onUpdateItem }: Props) {
  const [phase, setPhase] = useState(String(currentPhase));

  const byPhase = useMemo(() => {
    const m = new Map<number, ApqpPhaseItem[]>();
    for (const it of items) {
      const arr = m.get(it.phase) ?? [];
      arr.push(it);
      m.set(it.phase, arr);
    }
    return m;
  }, [items]);

  const progressFor = (p: number) => {
    const list = (byPhase.get(p) ?? []).filter((i) => i.status !== "na");
    const done = list.filter((i) => i.status === "complete").length;
    return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  };

  return (
    <Tabs value={phase} onValueChange={setPhase}>
      <TabsList className="flex flex-wrap h-auto gap-1">
        {APQP_PHASES.map((p) => {
          const prog = progressFor(p.phase);
          return (
            <TabsTrigger key={p.phase} value={String(p.phase)} className="text-xs">
              {p.phase}. {p.short}
              <Badge variant="secondary" className="ml-1 text-[10px]">{prog.pct}%</Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {APQP_PHASES.map((p) => {
        const list = byPhase.get(p.phase) ?? [];
        const prog = progressFor(p.phase);
        return (
          <TabsContent key={p.phase} value={String(p.phase)} className="space-y-3 pt-3">
            <div className="rounded-md border bg-muted/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Phase {p.phase} — {p.name}</p>
                <span className="text-xs text-muted-foreground">{prog.done}/{prog.total} complete</span>
              </div>
              <Progress value={prog.pct} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">{p.purpose}</p>
              <p className="mt-1 text-xs"><span className="font-medium">Exit criteria:</span> {p.exit}</p>
            </div>
            <ul className="space-y-1">
              {list.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-md border p-2 flex flex-col gap-2 sm:flex-row sm:items-center",
                    item.status === "complete" && "bg-green-50/60 dark:bg-green-950/20",
                    item.status === "na" && "opacity-60",
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {statusIcon(item.status)}
                    <span className={cn("text-sm", item.status === "complete" && "line-through text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                  <Select
                    value={item.status}
                    onValueChange={(val) =>
                      onUpdateItem(item.id, {
                        status: val as ApqpItemStatus,
                        completed_at: val === "complete" ? new Date().toISOString() : null,
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ITEM_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={1}
                    className="sm:w-[220px] text-xs min-h-[32px]"
                    placeholder="Evidence / notes"
                    defaultValue={item.evidence ?? ""}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val !== (item.evidence ?? "")) onUpdateItem(item.id, { evidence: val || null });
                    }}
                  />
                </li>
              ))}
              {list.length === 0 && (
                <li className="text-sm text-muted-foreground py-4 text-center">No deliverables for this phase.</li>
              )}
            </ul>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
