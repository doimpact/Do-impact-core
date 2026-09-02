import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Play, CheckCircle2, ArrowRight, Trash2, Settings, Factory, Timer, Hourglass, ScanBarcode, Gauge, Plane, MoreHorizontal, Pencil, Archive, ArchiveRestore, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { useActiveCompany } from "@/hooks/use-companies";
import { ValueStreamBar } from "@/components/oms/aps/value-stream-bar";
import { FloorView } from "@/components/floor/floor-view";
import type { ApsValueStream } from "@/lib/aps";


export const Route = createFileRoute("/_authenticated/oms/shopfloor")({
  head: () => ({ meta: [{ title: "Shop Floor — flow board & floor view | DO.Impact" }] }),
  component: ShopFloorPage,
});

type Line = ApsValueStream;
type Gate = { id: string; line_id: string; seq: number; name: string; wip_cap: number; yellow_wait_minutes: number; red_wait_minutes: number };
type Part = { id: string; line_id: string; part_number: string; current_gate_id: string | null; status: "waiting" | "in_progress" | "ready" | "completed"; status_since: string; completed_at: string | null };

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}
function fmtDuration(ms: number) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
function waitColor(minutes: number, yellow: number, red: number): { bg: string; ring: string; label: string } {
  if (minutes >= red) return { bg: "bg-red-500/15 border-red-500/60", ring: "bg-red-500", label: "red" };
  if (minutes >= yellow) return { bg: "bg-yellow-500/15 border-yellow-500/60", ring: "bg-yellow-500", label: "yellow" };
  return { bg: "bg-emerald-500/10 border-emerald-500/40", ring: "bg-emerald-500", label: "green" };
}

function ShopFloorPage() {
  const activeCompanyQ = useActiveCompany();
  const companyId = activeCompanyQ.data?.company_id ?? null;
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const linesQ = useQuery({
    queryKey: ["aps-value-streams", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_value_streams").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Line[];
    },
    enabled: !!companyId,
  });
  const allLines = linesQ.data ?? [];
  const lines = showArchived ? allLines : allLines.filter((l) => !l.archived_at);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  useEffect(() => {
    const live = allLines.filter((l) => !l.archived_at);
    if (live.length && (!activeLineId || !live.some((l) => l.id === activeLineId))) setActiveLineId(live[0].id);
    if (!live.length && activeLineId) setActiveLineId(null);
  }, [allLines, activeLineId]);

  const invalidateLines = () => qc.invalidateQueries({ queryKey: ["aps-value-streams"] });

  const createLine = useMutation({
    mutationFn: async (v: { name: string }) => {
      const { data, error } = await supabase
        .from("aps_value_streams")
        .insert({ company_id: companyId!, name: v.name, sort_order: allLines.length })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => { void invalidateLines(); setActiveLineId(id); toast.success("Value stream created"); },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Factory className="h-7 w-7" /> Shop Floor</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Flow is the pull-system tracker: each part is pulled forward only when the next gate has room.
            Floor View is the team screen — today's board, barriers and the running shift.
          </p>
        </div>
      </header>

      <Tabs defaultValue="flow">
        <TabsList>
          <TabsTrigger value="flow"><Factory className="h-4 w-4 mr-1" /> Flow</TabsTrigger>
          <TabsTrigger value="floor"><Gauge className="h-4 w-4 mr-1" /> Floor View</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-4 space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              Pull system
            </span>
            <Link to="/oms/sic" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              <Gauge className="mr-1 inline h-3.5 w-3.5" /> SIC boards
            </Link>
            <Link to="/oms/critical-path" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              <Plane className="mr-1 inline h-3.5 w-3.5" /> Critical Path Pulse
            </Link>
            <Link to="/oms/scheduling" className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              <CalendarRange className="mr-1 inline h-3.5 w-3.5" /> Scheduling (0–12wk)
            </Link>
          </div>

          {companyId && (
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Line / Value stream — shared with Scheduling (0–12wk)
              </div>
              <ValueStreamBar
                companyId={companyId}
                streams={lines}
                activeId={activeLineId}
                onSelect={setActiveLineId}
                showArchived={showArchived}
                onToggleArchived={() => setShowArchived((v) => !v)}
              />
            </div>
          )}

          {allLines.length === 0 ? (
            <EmptyState onCreate={() => createLine.mutate({ name: "Line 1" })} />
          ) : (
            activeLineId && <LineBoard lineId={activeLineId} />
          )}
        </TabsContent>

        <TabsContent value="floor" className="mt-4">
          <FloorView embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center space-y-4">
      <Factory className="h-10 w-10 mx-auto text-muted-foreground" />
      <div className="text-lg font-semibold">No lines / value streams yet</div>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        A line (value stream) is a relay of 2–20 gates. Parts flow gate to gate; a station only receives a new part when it has open capacity.
        The same list is shared with Scheduling (0–12wk).
      </p>
      <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Create your first line</Button>
    </div>
  );
}




function LineBoard({ lineId }: { lineId: string }) {
  const qc = useQueryClient();
  const gatesQ = useQuery({
    queryKey: ["sf-gates", lineId],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_floor_gates").select("*").eq("line_id", lineId).order("seq");
      if (error) throw error; return (data ?? []) as Gate[];
    },
  });
  const partsQ = useQuery({
    queryKey: ["sf-parts", lineId],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_floor_parts").select("*").eq("line_id", lineId).neq("status", "completed").order("status_since");
      if (error) throw error; return (data ?? []) as Part[];
    },
  });
  const gates = gatesQ.data ?? [];
  const parts = partsQ.data ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sf-gates", lineId] });
    qc.invalidateQueries({ queryKey: ["sf-parts", lineId] });
  };

  useEffect(() => {
    const filter = `line_id=eq.${lineId}`;
    const channel = supabase
      .channel(`shopfloor:${lineId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_floor_parts", filter }, () => {
        qc.invalidateQueries({ queryKey: ["sf-parts", lineId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_floor_gates", filter }, () => {
        qc.invalidateQueries({ queryKey: ["sf-gates", lineId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [lineId, qc]);


  const useSummary = gates.length > 10;

  return (
    <Tabs defaultValue="board">
      <TabsList>
        <TabsTrigger value="board"><ScanBarcode className="h-4 w-4 mr-1" /> Live Board</TabsTrigger>
        <TabsTrigger value="config"><Settings className="h-4 w-4 mr-1" /> Gates</TabsTrigger>
      </TabsList>

      <TabsContent value="board" className="mt-4 space-y-4">
        {gates.length === 0 ? (
          <div className="rounded border border-dashed p-6 text-sm text-muted-foreground">Add gates in the <b>Gates</b> tab to start tracking parts.</div>
        ) : (
          <>
            <ScanBar gates={gates} lineId={lineId} onDone={invalidate} />
            {useSummary
              ? <SummaryView gates={gates} parts={parts} onAction={invalidate} />
              : <ColumnView gates={gates} parts={parts} onAction={invalidate} />}
          </>
        )}
      </TabsContent>

      <TabsContent value="config" className="mt-4">
        <GatesConfig lineId={lineId} gates={gates} />
      </TabsContent>
    </Tabs>
  );
}

function ScanBar({ gates, lineId, onDone }: { gates: Gate[]; lineId: string; onDone: () => void }) {
  const [partNumber, setPartNumber] = useState("");
  const [gateId, setGateId] = useState(gates[0]?.id ?? "");
  useEffect(() => { if (!gateId && gates[0]) setGateId(gates[0].id); }, [gates, gateId]);

  const scan = useMutation({
    mutationFn: async () => {
      const pn = partNumber.trim(); if (!pn || !gateId) return;
      const { data: existing } = await supabase.from("shop_floor_parts")
        .select("*").eq("line_id", lineId).eq("part_number", pn).neq("status", "completed").maybeSingle();
      const now = new Date().toISOString();
      if (!existing) {
        const { error } = await supabase.from("shop_floor_parts").insert({
          line_id: lineId, part_number: pn, current_gate_id: gateId, status: "waiting", status_since: now,
        });
        if (error) throw error;
      } else if (existing.current_gate_id === gateId) {
        if (existing.status === "waiting") {
          const { error } = await supabase.from("shop_floor_parts").update({ status: "in_progress", status_since: now }).eq("id", existing.id);
          if (error) throw error;
        } else if (existing.status === "in_progress") {
          const { error } = await supabase.from("shop_floor_parts").update({ status: "ready", status_since: now }).eq("id", existing.id);
          if (error) throw error;
        } else {
          toast.info("Part is ready — pull to next gate from its card"); return;
        }
      } else {
        const { error } = await supabase.from("shop_floor_parts").update({ current_gate_id: gateId, status: "waiting", status_since: now }).eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { setPartNumber(""); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs">Scan / enter part #</Label>
        <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") scan.mutate(); }} placeholder="PN-00123" />
      </div>
      <div className="min-w-[180px]">
        <Label className="text-xs">At gate</Label>
        <Select value={gateId} onValueChange={setGateId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {gates.map((g) => <SelectItem key={g.id} value={g.id}>{g.seq}. {g.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => scan.mutate()} disabled={!partNumber.trim() || !gateId}>
        <ScanBarcode className="h-4 w-4 mr-1" /> Scan
      </Button>
      <div className="text-xs text-muted-foreground w-full">
        Scan cycles a part through <b>Waiting → In Progress → Ready</b>. Scan the part at a new gate to pull it forward.
      </div>
    </div>
  );
}

function ColumnView({ gates, parts, onAction }: { gates: Gate[]; parts: Part[]; onAction: () => void }) {
  const byGate = useMemo(() => {
    const m = new Map<string, Part[]>();
    for (const g of gates) m.set(g.id, []);
    for (const p of parts) if (p.current_gate_id) m.get(p.current_gate_id)?.push(p);
    return m;
  }, [gates, parts]);

  return (
    <div
      className="grid gap-3 grid-cols-1 md:[grid-template-columns:var(--gate-cols)]"
      style={{ ["--gate-cols" as string]: `repeat(${gates.length}, minmax(200px, 1fr))` }}
    >
      {gates.map((g, i) => {
        const list = byGate.get(g.id) ?? [];
        const nextGate = gates[i + 1];
        const atCap = nextGate ? (byGate.get(nextGate.id)?.length ?? 0) >= nextGate.wip_cap : true;
        return (
          <div key={g.id} className="rounded-lg border bg-card p-2 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="text-sm font-semibold">{g.seq}. {g.name}</div>
              <Badge variant="outline" className="text-xs">{list.length}/{g.wip_cap}</Badge>
            </div>
            <div className="flex flex-col gap-2 min-h-[80px]">
              {list.map((p) => (
                <PartCard key={p.id} part={p} gate={g} nextGate={nextGate} nextAtCap={atCap} onAction={onAction} />
              ))}
              {list.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartCard({ part, gate, nextGate, nextAtCap, onAction }: { part: Part; gate: Gate; nextGate: Gate | undefined; nextAtCap: boolean; onAction: () => void }) {
  const now = useNow(1000);
  const elapsedMs = now - new Date(part.status_since).getTime();
  const elapsedMin = elapsedMs / 60000;
  const isWait = part.status === "waiting" || part.status === "ready";
  const c = isWait ? waitColor(elapsedMin, gate.yellow_wait_minutes, gate.red_wait_minutes) : { bg: "bg-blue-500/10 border-blue-500/50", ring: "bg-blue-500", label: "work" };

  const start = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shop_floor_parts").update({ status: "in_progress", status_since: new Date().toISOString() }).eq("id", part.id);
      if (error) throw error;
    },
    onSuccess: onAction,
  });
  const complete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shop_floor_parts").update({ status: "ready", status_since: new Date().toISOString() }).eq("id", part.id);
      if (error) throw error;
    },
    onSuccess: onAction,
  });
  const pull = useMutation({
    mutationFn: async () => {
      if (!nextGate) {
        const { error } = await supabase.from("shop_floor_parts").update({ status: "completed", completed_at: new Date().toISOString(), current_gate_id: null }).eq("id", part.id);
        if (error) throw error; return;
      }
      const { error } = await supabase.from("shop_floor_parts").update({ current_gate_id: nextGate.id, status: "waiting", status_since: new Date().toISOString() }).eq("id", part.id);
      if (error) throw error;
    },
    onSuccess: onAction,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shop_floor_parts").delete().eq("id", part.id);
      if (error) throw error;
    },
    onSuccess: onAction,
  });

  return (
    <div className={`rounded border p-2 ${c.bg}`}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm font-semibold truncate">{part.part_number}</div>
        <span className={`h-2 w-2 rounded-full ${c.ring}`} />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {part.status === "in_progress" ? <Timer className="h-3 w-3" /> : <Hourglass className="h-3 w-3" />}
          {fmtDuration(elapsedMs)}
        </span>
        <span className="uppercase tracking-wide text-[10px] text-muted-foreground">
          {part.status === "waiting" ? "Waiting" : part.status === "in_progress" ? "In progress" : "Ready"}
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        {part.status === "waiting" && <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={() => start.mutate()}><Play className="h-3 w-3 mr-1" />Start</Button>}
        {part.status === "in_progress" && <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={() => complete.mutate()}><CheckCircle2 className="h-3 w-3 mr-1" />Done</Button>}
        {part.status === "ready" && (
          <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={() => pull.mutate()} disabled={!!nextGate && nextAtCap} title={nextGate && nextAtCap ? "Next gate full" : "Pull forward"}>
            <ArrowRight className="h-3 w-3 mr-1" />{nextGate ? "Pull" : "Finish"}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-6 text-xs px-1 ml-auto text-muted-foreground" onClick={() => del.mutate()}><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

function SummaryView({ gates, parts, onAction }: { gates: Gate[]; parts: Part[]; onAction: () => void }) {
  const now = useNow(1000);
  const rows = gates.map((g) => {
    const list = parts.filter((p) => p.current_gate_id === g.id);
    const waits = list.filter((p) => p.status === "waiting" || p.status === "ready").map((p) => (now - new Date(p.status_since).getTime()) / 60000);
    const avgWait = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0;
    const oldest = waits.length ? Math.max(...waits) : 0;
    return { gate: g, count: list.length, avgWait, oldest, parts: list };
  });
  const worstAvg = Math.max(0, ...rows.map((r) => r.avgWait));
  const worstOld = Math.max(0, ...rows.map((r) => r.oldest));

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-3 py-2">Gate</th>
            <th className="text-right px-3 py-2">Parts (WIP/Cap)</th>
            <th className="text-right px-3 py-2">Avg wait</th>
            <th className="text-right px-3 py-2">Oldest part</th>
            <th className="text-left px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isBottleneck = (r.avgWait > 0 && r.avgWait === worstAvg) || (r.oldest > 0 && r.oldest === worstOld);
            const c = waitColor(r.oldest, r.gate.yellow_wait_minutes, r.gate.red_wait_minutes);
            return (
              <tr key={r.gate.id} className={`border-t ${isBottleneck && r.oldest >= r.gate.yellow_wait_minutes ? "bg-red-500/10" : ""}`}>
                <td className="px-3 py-2 font-medium">{r.gate.seq}. {r.gate.name}</td>
                <td className="px-3 py-2 text-right">{r.count} / {r.gate.wip_cap}</td>
                <td className="px-3 py-2 text-right">{fmtDuration(r.avgWait * 60000)}</td>
                <td className="px-3 py-2 text-right">{fmtDuration(r.oldest * 60000)}</td>
                <td className="px-3 py-2"><span className={`inline-block h-2 w-2 rounded-full mr-2 ${c.ring}`} />{c.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <details className="border-t bg-muted/20">
        <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">Show all parts by gate</summary>
        <div className="p-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.gate.id} className="rounded border p-2">
              <div className="text-xs font-semibold mb-2">{r.gate.seq}. {r.gate.name}</div>
              <div className="flex flex-col gap-1">
                {r.parts.length === 0 && <div className="text-xs text-muted-foreground">empty</div>}
                {r.parts.map((p) => (
                  <PartCard key={p.id} part={p} gate={r.gate} nextGate={gates[gates.findIndex(g => g.id === r.gate.id) + 1]}
                    nextAtCap={(() => { const n = gates[gates.findIndex(g => g.id === r.gate.id) + 1]; return n ? parts.filter(pp => pp.current_gate_id === n.id).length >= n.wip_cap : true; })()}
                    onAction={onAction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function GatesConfig({ lineId, gates }: { lineId: string; gates: Gate[] }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["sf-gates", lineId] });

  const add = useMutation({
    mutationFn: async () => {
      if (gates.length >= 20) throw new Error("Maximum 20 gates per line");
      const seq = (gates[gates.length - 1]?.seq ?? 0) + 1;
      const { error } = await supabase.from("shop_floor_gates").insert({
        line_id: lineId, seq, name: `Gate ${seq}`, wip_cap: 3, yellow_wait_minutes: 30, red_wait_minutes: 60,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async (g: Partial<Gate> & { id: string }) => {
      const { id, ...patch } = g;
      const { error } = await supabase.from("shop_floor_gates").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("shop_floor_gates").delete().eq("id", id); if (error) throw error; },
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{gates.length} gate{gates.length === 1 ? "" : "s"} (2–20 recommended)</div>
        <Button size="sm" onClick={() => add.mutate()}><Plus className="h-4 w-4 mr-1" /> Add gate</Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase">
            <tr>
              <th className="px-2 py-2 w-12 text-left">#</th>
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 w-24 text-right">WIP cap</th>
              <th className="px-2 py-2 w-32 text-right">Yellow (min)</th>
              <th className="px-2 py-2 w-32 text-right">Red (min)</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-2 py-1"><Input className="h-8" type="number" defaultValue={g.seq} onBlur={(e) => update.mutate({ id: g.id, seq: Number(e.target.value) })} /></td>
                <td className="px-2 py-1"><Input className="h-8" defaultValue={g.name} onBlur={(e) => update.mutate({ id: g.id, name: e.target.value })} /></td>
                <td className="px-2 py-1"><Input className="h-8 text-right" type="number" defaultValue={g.wip_cap} onBlur={(e) => update.mutate({ id: g.id, wip_cap: Number(e.target.value) })} /></td>
                <td className="px-2 py-1"><Input className="h-8 text-right" type="number" defaultValue={g.yellow_wait_minutes} onBlur={(e) => update.mutate({ id: g.id, yellow_wait_minutes: Number(e.target.value) })} /></td>
                <td className="px-2 py-1"><Input className="h-8 text-right" type="number" defaultValue={g.red_wait_minutes} onBlur={(e) => update.mutate({ id: g.id, red_wait_minutes: Number(e.target.value) })} /></td>
                <td className="px-2 py-1 text-right"><Button size="sm" variant="ghost" onClick={() => del.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {gates.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">No gates yet — add your first station.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
