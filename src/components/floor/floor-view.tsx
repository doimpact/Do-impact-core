import { useDemoNow } from "@/lib/demo-date";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Gauge, LifeBuoy, CalendarDays, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  listDmBoards,
  listDmCategories,
  listDmReasonCodes,
  listDailyManagement,
  listDmCategoryTargets,
  upsertDmCategoryTarget,
  upsertDmMark,
  upsertDmEscalation,
  type DmCategory,
} from "@/lib/oms.functions";
import type { Board, Category, CategoryTarget, Escalation, Mark, ReasonCode } from "@/components/oms/daily/types";
import { FloorToday } from "@/components/floor/floor-today";
import { FloorHelpDialog, FloorHelpList, type HelpDraft } from "@/components/floor/floor-help";
import { SicBoard } from "@/components/oms/sic/sic-board";
import type { SicShift } from "@/components/oms/sic/types";
import { useActiveCompany } from "@/hooks/use-companies";
import { useMyAccess } from "@/hooks/use-access";
import { useProfiles } from "@/components/owner-select";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function FloorView({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const activeCompany = useActiveCompany();
  const companyId = activeCompany.data?.company_id ?? "";
  const isTemplate = activeCompany.data?.companies?.is_template === true;
  const { isReadOnly } = useMyAccess();
  const readOnly = isReadOnly || isTemplate;

  const now = useDemoNow();
  const today = isoDay(now);
  const monthStart = isoDay(new Date(now.getFullYear(), now.getMonth(), 1));

  const listBoardsFn = useServerFn(listDmBoards);
  const listCatsFn = useServerFn(listDmCategories);
  const listReasonsFn = useServerFn(listDmReasonCodes);
  const listDmFn = useServerFn(listDailyManagement);
  const listTargetsFn = useServerFn(listDmCategoryTargets);
  const markFn = useServerFn(upsertDmMark);
  const targetFn = useServerFn(upsertDmCategoryTarget);
  const escFn = useServerFn(upsertDmEscalation);

  const { data: boards = [] } = useQuery({
    queryKey: ["dm_boards", false],
    queryFn: () => listBoardsFn({ data: { includeArchived: false } }) as Promise<Board[]>,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["dm_categories"],
    queryFn: () => listCatsFn({ data: { includeArchived: false } }) as Promise<Category[]>,
  });
  const { data: reasonCodes = [] } = useQuery({
    queryKey: ["dm_reason_codes"],
    queryFn: () => listReasonsFn({ data: {} }) as Promise<ReasonCode[]>,
  });
  const { data: dm } = useQuery({
    queryKey: ["dm", monthStart, today],
    queryFn: () => listDmFn({ data: { from: monthStart, to: today } }) as Promise<{ marks: Mark[]; escalations: Escalation[] }>,
  });
  const { data: targets = [] } = useQuery({
    queryKey: ["dm_category_targets", monthStart, today],
    queryFn: () => listTargetsFn({ data: { from: monthStart, to: today } }) as Promise<CategoryTarget[]>,
  });
  const { data: profiles = [] } = useProfiles();

  // ---- device-remembered team ----
  const storageKey = `floor.board.${companyId}`;
  const [boardId, setBoardId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  useEffect(() => {
    if (!companyId) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      setBoardId(saved);
    } catch { /* ignore */ }
  }, [companyId, storageKey]);
  const chooseBoard = (id: string) => {
    setBoardId(id);
    try { window.localStorage.setItem(storageKey, id); } catch { /* ignore */ }
    setPicking(false);
  };
  const board = boards.find(b => b.id === boardId) ?? null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dm"] });
    qc.invalidateQueries({ queryKey: ["dm_category_targets"] });
  };

  const setMark = useMutation({
    mutationFn: (v: { categoryKey: string; status: "green" | "red" | null }) =>
      markFn({ data: { boardId: board!.id, category: v.categoryKey as DmCategory, markDate: today, status: v.status } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message || "Could not save that"),
  });
  const setReason = useMutation({
    mutationFn: (v: { categoryKey: string; reasonCodeId: string | null }) =>
      markFn({ data: { boardId: board!.id, category: v.categoryKey as DmCategory, markDate: today, status: "red", reasonCodeId: v.reasonCodeId } }),
    onSuccess: () => { invalidate(); toast.success("Thanks — barrier logged"); },
    onError: (e: Error) => toast.error(e.message || "Could not save that"),
  });
  const setActual = useMutation({
    mutationFn: (v: { categoryKey: string; actual: number | null }) =>
      targetFn({ data: { boardId: board!.id, categoryKey: v.categoryKey, valueDate: today, actualValue: v.actual } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message || "Could not save that"),
  });
  const saveHelp = useMutation({
    mutationFn: (d: HelpDraft) =>
      escFn({ data: {
        boardId: board!.id,
        category: d.category as DmCategory,
        occurredOn: today,
        concern: d.concern,
        cause: d.cause || null,
        countermeasure: d.countermeasure || null,
        ownerId: d.ownerId,
      } }),
    onSuccess: () => { invalidate(); toast.success("Sent — someone owns this now"); setHelpFor(null); },
    onError: (e: Error) => toast.error(e.message || "Could not send that"),
  });

  const [helpFor, setHelpFor] = useState<string | null>(null);

  const marks = useMemo(() => (dm?.marks ?? []).filter(m => m.board_id === board?.id), [dm, board]);
  const escalations = useMemo(
    () => (dm?.escalations ?? []).filter(e => e.board_id === board?.id && !e.archived_at && e.status !== "closed"),
    [dm, board],
  );
  const boardTargets = useMemo(() => targets.filter(t => t.board_id === board?.id), [targets, board]);

  const redMarks = marks.filter(m => m.status === "red");
  const clearedCount = (dm?.escalations ?? []).filter(
    e => e.board_id === board?.id && (e.status === "closed" || e.loop_state === "closed" || e.loop_state === "standardised"),
  ).length;

  const topBarriers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of redMarks) {
      if (!m.reason_code_id) continue;
      counts.set(m.reason_code_id, (counts.get(m.reason_code_id) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, n]) => ({ label: reasonCodes.find(r => r.id === id)?.label ?? "Other", count: n }));
  }, [redMarks, reasonCodes]);

  // ---- SIC ----
  const { data: shifts = [] } = useQuery({
    queryKey: ["sic-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sic_shifts")
        .select("*")
        .order("shift_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as unknown as (SicShift & { archived_at: string | null })[];
    },
  });
  const openShifts = shifts.filter(s => !s.archived_at);
  const [shiftId, setShiftId] = useState<string | null>(null);
  useEffect(() => {
    if (openShifts.length && (!shiftId || !openShifts.some(s => s.id === shiftId))) setShiftId(openShifts[0].id);
  }, [openShifts, shiftId]);
  const shift = openShifts.find(s => s.id === shiftId) ?? null;

  const needsPick = !board || picking;

  const body = (
    <>
      {needsPick ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Which team is this screen for?</h2>
          <p className="text-sm text-muted-foreground">We'll remember it on this device.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {boards.map(b => (
              <Button key={b.id} variant="outline" className="h-16 justify-start text-base" onClick={() => chooseBoard(b.id)}>
                {b.name}
              </Button>
            ))}
          </div>
        </section>
      ) : (
        <>
          {embedded && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Team board: <span className="font-medium text-foreground">{board.name}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>
                  <Settings2 className="mr-1.5 h-4 w-4" /> Change team
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/floor">Open kiosk mode</Link>
                </Button>
              </div>
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Today</h2>
            </div>
            <FloorToday
              categories={categories}
              marks={marks}
              reasonCodes={reasonCodes}
              targets={boardTargets}
              today={today}
              readOnly={readOnly}
              onCycle={(categoryKey, next) => setMark.mutate({ categoryKey, status: next })}
              onReason={(categoryKey, reasonCodeId) => setReason.mutate({ categoryKey, reasonCodeId })}
              onActual={(categoryKey, actual) => setActual.mutate({ categoryKey, actual })}
              onAskHelp={(categoryKey) => setHelpFor(categoryKey)}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Barriers we've asked help with</h2>
            </div>
            <FloorHelpList escalations={escalations} categories={categories} profiles={profiles} />
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span className="font-medium">{redMarks.length}</span> barrier{redMarks.length === 1 ? "" : "s"} raised this month ·{" "}
              <span className="font-medium">{clearedCount}</span> already cleared. Every one of these started here, on this board.
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">This shift</h2>
              </div>
              {openShifts.length > 1 && (
                <Select value={shiftId ?? ""} onValueChange={setShiftId}>
                  <SelectTrigger className="h-10 w-64"><SelectValue placeholder="Pick a shift" /></SelectTrigger>
                  <SelectContent>
                    {openShifts.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shift_date} · {s.shift_label}{s.line_name ? ` · ${s.line_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {shift ? (
              <SicBoard shift={shift} />
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No shift is running. A team leader can open one from Operations → Short Interval Control.
              </p>
            )}
          </section>

          {topBarriers.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">What's blocked us most this month</h2>
              <ul className="space-y-2">
                {topBarriers.map((b) => (
                  <li key={b.label} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm">{b.label}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${Math.round((b.count / topBarriers[0].count) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm tabular-nums">{b.count}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                This is the list the business works from. The more precisely we name it, the faster it goes away.
              </p>
            </section>
          )}
        </>
      )}
    </>
  );

  const helpDialog = (
    <FloorHelpDialog
      open={!!helpFor}
      category={helpFor}
      categories={categories}
      readOnly={readOnly}
      onClose={() => setHelpFor(null)}
      onSave={(d) => saveHelp.mutate(d)}
    />
  );

  if (embedded) {
    return (
      <div className="space-y-8">
        {readOnly && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            This workspace is read-only — you can look around, but entries won't be saved.
          </div>
        )}
        {body}
        {helpDialog}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {board ? board.name : "Floor view"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              Our board — what's getting in our way today
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Change team" onClick={() => setPicking(true)}>
              <Settings2 className="h-5 w-5" />
            </Button>
            <Link to="/oms/daily" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Back to the full app" title="Back to the full app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {readOnly && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-2 text-center text-sm text-amber-700 dark:text-amber-400">
          This workspace is read-only — you can look around, but entries won't be saved.
        </div>
      )}

      <main className="mx-auto max-w-4xl space-y-8 px-5 py-6 pb-24">{body}</main>

      {helpDialog}
    </div>
  );
}
