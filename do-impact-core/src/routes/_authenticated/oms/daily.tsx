import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDemoNow } from "@/lib/demo-date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import {
  listDailyManagement,
  upsertDmMark,
  upsertDmEscalation,
  deleteDmEscalation,
  archiveDmEscalation,
  escalateDmToA3,
  escalateDmTo8D,
  listDmBoards,
  createDmBoard,
  renameDmBoard,
  archiveDmBoard,
  deleteDmBoard,
  listDmCategories,
  listDmReasonCodes,
  createDmReasonCode,
  updateDmReasonCode,
  deleteDmReasonCode,
  createDmCategory,
  updateDmCategory,
  deleteDmCategory,
  listDmFriction,
  upsertDmMetricDef,
  createDmMetricDef,
  deleteDmMetricDef,
  upsertDmMetricValue,
  saveDmGembaWalk,
  listDmGembaWalks,
  deleteDmGembaWalk,

  listStrategicObjectivesLite,
  listDmCategoryTargets,
  upsertDmCategoryTarget,
  type DmCategory,
  type DmLoopState,
} from "@/lib/oms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Plus, Trash2, Tags,
  ChevronLeft, ChevronRight, AlertTriangle, MoreVertical, Pencil, Archive, ArchiveRestore, ChevronDown, ChevronUp, Footprints,
  SlidersHorizontal,
} from "lucide-react";
import { OwnerSelect, useProfiles } from "@/components/owner-select";
import { toast } from "sonner";
import { FrictionBand } from "@/components/oms/daily/friction-band";
import { ThreeCList } from "@/components/oms/daily/three-c-list";
import { GembaMode } from "@/components/oms/daily/gemba-mode";
import { GembaWalkViewer, GembaWalkList, depthClass, type GembaWalk } from "@/components/oms/daily/gemba-walk-viewer";
import { confirmDialog } from "@/components/confirm-dialog";
import { useMyAccess } from "@/hooks/use-access";

import { CategoryManager } from "@/components/oms/daily/category-manager";
import { ReasonCodeManager } from "@/components/oms/daily/reason-code-manager";
import { RedPareto } from "@/components/oms/daily/red-pareto";
import { PlanVsActual } from "@/components/oms/daily/plan-vs-actual";
import { CategoryIcon } from "@/components/oms/daily/category-meta";
import { LOOP_STATES, type Board, type Category, type Mark, type Escalation, type MetricDef, type MetricValue, type ReasonCode, type CategoryTarget } from "@/components/oms/daily/types";
import { useActiveCompany } from "@/hooks/use-companies";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PARETO_PERIODS, paretoRange, type ParetoPeriod } from "@/lib/oms-pareto-period";

const WHY_RED_KEY = "oms.daily.why-red";
const WHY_RED_PERIOD_KEY = "oms.daily.why-red.period";


export const Route = createFileRoute("/_authenticated/oms/daily")({
  head: () => ({ meta: [{ title: "Daily — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DailyPage,
});


const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const daysInMonth = (d: Date) => endOfMonth(d).getDate();
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();


function DailyPage() {
  const [anchor, setAnchor] = useState<Date>(() => startOfMonth(new Date()));
  const [showArchived, setShowArchived] = useState(false);
  const from = isoDay(startOfMonth(anchor));
  const to = isoDay(endOfMonth(anchor));

  const qc = useQueryClient();
  const { isEnabled, setEnabled } = useUserPreferences();
  const whyRedVisible = isEnabled(WHY_RED_KEY);
  const [paretoPeriod, setParetoPeriod] = useState<ParetoPeriod>(() => {
    if (typeof window === "undefined") return "month";
    const v = window.localStorage.getItem(WHY_RED_PERIOD_KEY);
    return PARETO_PERIODS.some(p => p.value === v) ? (v as ParetoPeriod) : "month";
  });
  const changeParetoPeriod = (p: ParetoPeriod) => {
    setParetoPeriod(p);
    try { window.localStorage.setItem(WHY_RED_PERIOD_KEY, p); } catch { /* ignore */ }
  };

  const activeCompany = useActiveCompany();
  const { isReadOnly } = useMyAccess();
  const isTemplateCompany = activeCompany.data?.companies?.is_template === true;
  const demoNow = useDemoNow();
  const anchoredCompany = useRef<string | null>(null);
  const activeCompanyId = activeCompany.data?.company_id ?? null;
  useEffect(() => {
    if (!activeCompanyId || anchoredCompany.current === activeCompanyId) return;
    anchoredCompany.current = activeCompanyId;
    setAnchor(startOfMonth(isTemplateCompany ? demoNow : new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId, isTemplateCompany]);
  const listFn = useServerFn(listDailyManagement);
  const markFn = useServerFn(upsertDmMark);
  const escFn = useServerFn(upsertDmEscalation);
  const delFn = useServerFn(deleteDmEscalation);
  const archEscFn = useServerFn(archiveDmEscalation);
  const listBoardsFn = useServerFn(listDmBoards);
  const createBoardFn = useServerFn(createDmBoard);
  const renameBoardFn = useServerFn(renameDmBoard);
  const archiveBoardFn = useServerFn(archiveDmBoard);
  const deleteBoardFn = useServerFn(deleteDmBoard);
  const listCatsFn = useServerFn(listDmCategories);
  const createCatFn = useServerFn(createDmCategory);
  const updateCatFn = useServerFn(updateDmCategory);
  const deleteCatFn = useServerFn(deleteDmCategory);
  const listReasonsFn = useServerFn(listDmReasonCodes);
  const createReasonFn = useServerFn(createDmReasonCode);
  const updateReasonFn = useServerFn(updateDmReasonCode);
  const deleteReasonFn = useServerFn(deleteDmReasonCode);

  const { data: boards = [] } = useQuery({
    queryKey: ["dm_boards", showArchived],
    queryFn: () => listBoardsFn({ data: { includeArchived: showArchived } }) as Promise<Board[]>,
  });
  const activeBoards = useMemo(() => boards.filter(b => !b.archived_at), [boards]);
  const archivedBoards = useMemo(() => boards.filter(b => b.archived_at), [boards]);

  const { data: allCategories = [] } = useQuery({
    queryKey: ["dm_categories"],
    queryFn: () => listCatsFn({ data: { includeArchived: true } }) as Promise<Category[]>,
  });
  const categories = useMemo(() => allCategories.filter(c => !c.archived_at), [allCategories]);
  const invalidateCats = () => qc.invalidateQueries({ queryKey: ["dm_categories"] });
  const createCat = useMutation({
    mutationFn: (v: { label: string; accent: string; icon: string }) => createCatFn({ data: v }),
    onSuccess: () => { toast.success("Category added"); invalidateCats(); },
    onError: (e: Error) => toast.error(e.message || "Could not add this category"),
  });
  const updateCat = useMutation({
    mutationFn: (v: Parameters<typeof updateDmCategory>[0]["data"]) => updateCatFn({ data: v }),
    onSuccess: invalidateCats,
    onError: (e: Error) => toast.error(e.message || "Could not update this category"),
  });
  const deleteCat = useMutation({
    mutationFn: (id: string) => deleteCatFn({ data: { id } }),
    onSuccess: (r: { ok: boolean; error?: string }) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("Category deleted");
      invalidateCats();
      qc.invalidateQueries({ queryKey: ["dm"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete this category"),
  });


  const { data: allReasonCodes = [] } = useQuery({
    queryKey: ["dm_reason_codes"],
    queryFn: () => listReasonsFn({ data: { includeArchived: true } }) as Promise<ReasonCode[]>,
  });
  const reasonCodes = useMemo(() => allReasonCodes.filter(r => !r.archived_at), [allReasonCodes]);
  const invalidateReasons = () => qc.invalidateQueries({ queryKey: ["dm_reason_codes"] });
  const createReason = useMutation({
    mutationFn: (v: { label: string; categoryKey: string | null; color: string }) => createReasonFn({ data: v }),
    onSuccess: () => { toast.success("Reason code added"); invalidateReasons(); },
    onError: (e: Error) => toast.error(e.message || "Could not add this reason code"),
  });
  const updateReason = useMutation({
    mutationFn: (v: Parameters<typeof updateDmReasonCode>[0]["data"]) => updateReasonFn({ data: v }),
    onSuccess: invalidateReasons,
    onError: (e: Error) => toast.error(e.message || "Could not update this reason code"),
  });
  const removeReason = useMutation({
    mutationFn: (id: string) => deleteReasonFn({ data: { id } }),
    onSuccess: (r: { ok: boolean; error?: string }) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("Reason code deleted");
      invalidateReasons();
      qc.invalidateQueries({ queryKey: ["dm"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete this reason code"),
  });

  const { data } = useQuery({
    queryKey: ["dm", from, to],
    queryFn: () => listFn({ data: { from, to } }) as Promise<{ marks: Mark[]; escalations: Escalation[] }>,
  });
  const paretoWindow = useMemo(
    () => paretoRange(paretoPeriod, anchor, demoNow),
    [paretoPeriod, anchor, demoNow],
  );
  const isMonthWindow = paretoWindow.from === from && paretoWindow.to === to;
  const { data: paretoData } = useQuery({
    queryKey: ["dm", paretoWindow.from, paretoWindow.to],
    queryFn: () => listFn({ data: { from: paretoWindow.from, to: paretoWindow.to } }) as Promise<{ marks: Mark[]; escalations: Escalation[] }>,
    enabled: !isMonthWindow,
  });

  const listTargetsFn = useServerFn(listDmCategoryTargets);
  const targetFn = useServerFn(upsertDmCategoryTarget);
  const { data: categoryTargets = [] } = useQuery({
    queryKey: ["dm_category_targets", from, to],
    queryFn: () => listTargetsFn({ data: { from, to } }) as Promise<CategoryTarget[]>,
  });
  const saveCategoryTarget = useMutation({
    mutationFn: (v: { boardId: string; categoryKey: string; valueDate: string; planValue?: number | null; actualValue?: number | null }) => targetFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dm_category_targets"] }),
    onError: (e: Error) => toast.error(e.message || "Could not save this value"),
  });
  const { data: profiles = [] } = useProfiles();
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["dm"] }); qc.invalidateQueries({ queryKey: ["dm_boards"] }); };


  const setMark = useMutation({
    mutationFn: (v: { boardId: string; category: DmCategory; markDate: string; status: "green" | "red" | null; reasonCodeId?: string | null }) => markFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message || "Could not update this mark"),
  });
  const delEsc = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("3C deleted"); },
    onError: (e: Error) => toast.error(e.message || "Could not delete this 3C"),
  });
  const archiveEsc = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) => archEscFn({ data: v }),
    onSuccess: (_r, v) => { invalidate(); toast.success(v.archived ? "3C archived" : "3C restored"); },
    onError: (e: Error) => toast.error(e.message || "Could not archive this 3C"),
  });
  const saveEsc = useMutation({
    mutationFn: (v: Parameters<typeof upsertDmEscalation>[0]["data"]) => escFn({ data: v }),
    onSuccess: () => { toast.success("3C saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message || "Could not save this 3C"),
  });

  const createBoard = useMutation({
    mutationFn: (name: string) => createBoardFn({ data: { name } }),
    onSuccess: () => { toast.success("Board created"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const renameBoard = useMutation({
    mutationFn: (v: { id: string; name: string }) => renameBoardFn({ data: v }),
    onSuccess: () => { toast.success("Renamed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message || "Could not rename this board"),
  });
  const archBoard = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) => archiveBoardFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message || "Could not archive this board"),
  });
  const delBoard = useMutation({
    mutationFn: (id: string) => deleteBoardFn({ data: { id } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Board deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete this board"),
  });


  // ---- Leading friction metrics ----
  const frictionFn = useServerFn(listDmFriction);
  const metricDefFn = useServerFn(upsertDmMetricDef);
  const createMetricFn = useServerFn(createDmMetricDef);
  const deleteMetricFn = useServerFn(deleteDmMetricDef);
  const metricValFn = useServerFn(upsertDmMetricValue);
  const a3Fn = useServerFn(escalateDmToA3);
  const eightDFn = useServerFn(escalateDmTo8D);
  const gembaSaveFn = useServerFn(saveDmGembaWalk);
  const gembaListFn = useServerFn(listDmGembaWalks);
  const gembaDeleteFn = useServerFn(deleteDmGembaWalk);

  const objectivesFn = useServerFn(listStrategicObjectivesLite);
  const navigate = useNavigate();

  const { data: friction } = useQuery({
    queryKey: ["dm_friction", from, to],
    queryFn: () => frictionFn({ data: { from, to } }) as Promise<{ defs: MetricDef[]; values: MetricValue[] }>,
  });
  const { data: objectives = [] } = useQuery({
    queryKey: ["dm_objectives_lite"],
    queryFn: () => objectivesFn() as Promise<{ id: string; title: string }[]>,
  });
  const { data: walks = [] } = useQuery({
    queryKey: ["dm_gemba"],
    queryFn: () => gembaListFn() as Promise<GembaWalk[]>,
  });


  const invalidateFriction = () => qc.invalidateQueries({ queryKey: ["dm_friction"] });
  const saveMetricDef = useMutation({
    mutationFn: (v: Parameters<typeof upsertDmMetricDef>[0]["data"]) => metricDefFn({ data: v }),
    onSuccess: () => { toast.success("Metric updated"); invalidateFriction(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const createMetricDef = useMutation({
    mutationFn: (v: Parameters<typeof createDmMetricDef>[0]["data"]) => createMetricFn({ data: v }),
    onSuccess: () => { toast.success("Metric added"); invalidateFriction(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeMetricDef = useMutation({
    mutationFn: (id: string) => deleteMetricFn({ data: { id } }),
    onSuccess: () => { toast.success("Metric deleted"); invalidateFriction(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveMetricValue = useMutation({
    mutationFn: (v: { metricDefId: string; boardId: string; valueDate: string; value?: number | null; planValue?: number | null }) => metricValFn({ data: v }),
    onSuccess: invalidateFriction,
    onError: (e: Error) => toast.error(e.message),
  });
  const toA3 = useMutation({
    mutationFn: (id: string) => a3Fn({ data: { id } }) as Promise<{ a3Id: string; existing: boolean }>,
    onSuccess: (r) => {
      toast.success(r.existing ? "Opening the linked A3" : "A3 created from this 3C");
      invalidate();
      navigate({ to: "/actions/problem-solver/a3" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const to8D = useMutation({
    mutationFn: (id: string) => eightDFn({ data: { id } }) as Promise<{ eightDId: string; existing: boolean }>,
    onSuccess: (r) => {
      toast.success(r.existing ? "Opening the linked 8D" : "8D created from this 3C");
      invalidate();
      navigate({ to: "/actions/problem-solver/eight-d" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveWalk = useMutation({
    mutationFn: (v: Parameters<typeof saveDmGembaWalk>[0]["data"]) => gembaSaveFn({ data: v }),
    onSuccess: () => { toast.success("Gemba walk recorded"); qc.invalidateQueries({ queryKey: ["dm_gemba"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeWalk = useMutation({
    mutationFn: (id: string) => gembaDeleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Gemba walk deleted");
      setViewWalk(null);
      qc.invalidateQueries({ queryKey: ["dm_gemba"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [gembaBoard, setGembaBoard] = useState<Board | null>(null);
  const [viewWalk, setViewWalk] = useState<GembaWalk | null>(null);
  const [walkListOpen, setWalkListOpen] = useState(false);

  const [editing, setEditing] = useState<{ boardId: string; category: DmCategory; date: string; existing?: Escalation; metricDefId?: string | null } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [confirmDel, setConfirmDel] = useState<{ kind: "board" | "esc"; id: string; title: string; body: string } | null>(null);
  const [nameDialog, setNameDialog] = useState<{ mode: "new" | "rename"; id?: string; value: string } | null>(null);
  const [catMgr, setCatMgr] = useState(false);
  const [reasonMgr, setReasonMgr] = useState(false);
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);


  const days = useMemo(() => Array.from({ length: daysInMonth(anchor) }, (_, i) => i + 1), [anchor]);

  // ---- Demo mode -------------------------------------------------------
  // Read-only workspaces (template tenant, viewer access) can still be driven
  // for a demo: edits are applied to an in-memory overlay instead of the API.
  const demoMode = isTemplateCompany || isReadOnly;
  const [demoMarks, setDemoMarks] = useState<Map<string, Mark | null>>(new Map());
  const [demoEsc, setDemoEsc] = useState<Map<string, Escalation | null>>(new Map());
  const [demoTargets, setDemoTargets] = useState<Map<string, CategoryTarget>>(new Map());
  const [demoValues, setDemoValues] = useState<Map<string, MetricValue>>(new Map());
  const demoNoticed = useRef(false);
  const noteDemo = () => {
    if (demoNoticed.current) return;
    demoNoticed.current = true;
    toast("Demo mode — changes are shown here but not saved.");
  };

  const marks = useMemo(() => {
    const base = data?.marks ?? [];
    if (!demoMarks.size) return base;
    const m = new Map<string, Mark>();
    for (const r of base) m.set(`${r.board_id}|${r.category}|${r.mark_date}`, r);
    for (const [k, v] of demoMarks) { if (v) m.set(k, v); else m.delete(k); }
    return [...m.values()];
  }, [data, demoMarks]);

  const paretoMarks = useMemo(() => {
    if (isMonthWindow) return marks;
    const base = paretoData?.marks ?? [];
    if (!demoMarks.size) return base;
    const m = new Map<string, Mark>();
    for (const r of base) m.set(`${r.board_id}|${r.category}|${r.mark_date}`, r);
    for (const [k, v] of demoMarks) { if (v) m.set(k, v); else m.delete(k); }
    return [...m.values()];
  }, [isMonthWindow, marks, paretoData, demoMarks]);


  const escalations = useMemo(() => {
    const base = data?.escalations ?? [];
    if (!demoEsc.size) return base;
    const m = new Map<string, Escalation>();
    for (const e of base) m.set(e.id, e);
    for (const [id, v] of demoEsc) { if (v) m.set(id, v); else m.delete(id); }
    return [...m.values()];
  }, [data, demoEsc]);

  const targets = useMemo(() => {
    if (!demoTargets.size) return categoryTargets;
    const m = new Map<string, CategoryTarget>();
    for (const t of categoryTargets) m.set(`${t.board_id}|${t.category_key}|${t.value_date}`, t);
    for (const [k, v] of demoTargets) m.set(k, v);
    return [...m.values()];
  }, [categoryTargets, demoTargets]);

  const metricValues = useMemo(() => {
    const base = friction?.values ?? [];
    if (!demoValues.size) return base;
    const m = new Map<string, MetricValue>();
    for (const v of base) m.set(`${v.metric_def_id}|${v.value_date}`, v);
    for (const [k, v] of demoValues) m.set(k, v);
    return [...m.values()];
  }, [friction, demoValues]);

  const marksByBoard = useMemo(() => {
    const m = new Map<string, Mark>();
    for (const r of marks) m.set(`${r.board_id}|${r.category}|${r.mark_date}`, r);
    return m;
  }, [marks]);
  const escByBoard = useMemo(() => {
    const m = new Map<string, Escalation[]>();
    for (const e of escalations) {
      const k = `${e.board_id}|${e.category}|${e.occurred_on}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [escalations]);

  function applyDemoMark(v: { boardId: string; category: DmCategory; markDate: string; status: "green" | "red" | null; reasonCodeId?: string | null }) {
    noteDemo();
    const key = `${v.boardId}|${v.category}|${v.markDate}`;
    setDemoMarks(prev => {
      const next = new Map(prev);
      if (!v.status) next.set(key, null);
      else {
        const cur = marksByBoard.get(key);
        next.set(key, {
          board_id: v.boardId, category: v.category, mark_date: v.markDate, status: v.status,
          note: cur?.note ?? null,
          reason_code_id: v.reasonCodeId !== undefined ? v.reasonCodeId : (cur?.reason_code_id ?? null),
        });
      }
      return next;
    });
  }

  function applyDemoEsc(v: Parameters<typeof upsertDmEscalation>[0]["data"]) {
    noteDemo();
    const id = v.id ?? `demo-${Date.now()}`;
    const cur = escalations.find(e => e.id === id);
    setDemoEsc(prev => new Map(prev).set(id, {
      id,
      board_id: v.boardId,
      category: v.category,
      occurred_on: v.occurredOn,
      concern: v.concern,
      cause: v.cause ?? null,
      countermeasure: v.countermeasure ?? null,
      owner_id: v.ownerId ?? null,
      due_date: v.dueDate ?? null,
      status: v.loopState === "closed" ? "closed" : (v.status ?? cur?.status ?? "open"),
      escalated: v.escalated ?? cur?.escalated ?? false,
      loop_state: v.loopState ?? cur?.loop_state ?? "contain",
      recurrence_count: cur?.recurrence_count ?? 1,
      a3_report_id: cur?.a3_report_id ?? null,
      standardised_at: v.loopState === "standardised" ? new Date().toISOString() : (cur?.standardised_at ?? null),
      metric_def_id: v.metricDefId ?? cur?.metric_def_id ?? null,
      archived_at: cur?.archived_at ?? null,
    }));
  }

  function applyDemoEscPatch(id: string, patch: Partial<Escalation> | null) {
    noteDemo();
    const cur = escalations.find(e => e.id === id);
    setDemoEsc(prev => new Map(prev).set(id, patch && cur ? { ...cur, ...patch } : null));
  }

  function applyDemoTarget(v: { boardId: string; categoryKey: string; valueDate: string; planValue?: number | null; actualValue?: number | null }) {
    noteDemo();
    const key = `${v.boardId}|${v.categoryKey}|${v.valueDate}`;
    const cur = targets.find(t => `${t.board_id}|${t.category_key}|${t.value_date}` === key);
    setDemoTargets(prev => new Map(prev).set(key, {
      id: cur?.id ?? `demo-${key}`,
      board_id: v.boardId,
      category_key: v.categoryKey,
      value_date: v.valueDate,
      plan_value: v.planValue !== undefined ? v.planValue : (cur?.plan_value ?? null),
      actual_value: v.actualValue !== undefined ? v.actualValue : (cur?.actual_value ?? null),
    }));
  }

  function applyDemoMetricValue(v: { metricDefId: string; boardId: string; valueDate: string; value?: number | null; planValue?: number | null }) {
    noteDemo();
    const key = `${v.metricDefId}|${v.valueDate}`;
    const cur = metricValues.find(m => `${m.metric_def_id}|${m.value_date}` === key);
    setDemoValues(prev => new Map(prev).set(key, {
      id: cur?.id ?? `demo-${key}`,
      board_id: v.boardId,
      metric_def_id: v.metricDefId,
      value_date: v.valueDate,
      value: v.value !== undefined ? v.value : (cur?.value ?? null),
      plan_value: v.planValue !== undefined ? v.planValue : (cur?.plan_value ?? null),
      note: cur?.note ?? null,
    }));
  }

  function guardReadOnly() {
    if (isTemplateCompany || isReadOnly) {
      toast.error("TitanScale Template is read-only. Duplicate it to edit.");
      return true;
    }
    return false;
  }

  function handleNewBoard() {
    if (guardReadOnly()) return;
    setNameDialog({ mode: "new", value: "" });
  }

  function submitNameDialog() {
    const name = nameDialog?.value.trim();
    if (!nameDialog || !name) return;
    if (guardReadOnly()) { setNameDialog(null); return; }
    if (nameDialog.mode === "new") createBoard.mutate(name);
    else if (nameDialog.id) renameBoard.mutate({ id: nameDialog.id, name });
    setNameDialog(null);
  }


  return (
    <>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Daily Management — SQDP</h1>
          <p className="text-muted-foreground mt-1">Multiple boards per site with a consolidated roll-up on top. Click a day to cycle Green → Red → Clear. Use the 3C link under a red day (or right-click) to raise a 3C.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleNewBoard}><Plus className="h-4 w-4 mr-1" /> New board</Button>
          <Button size="sm" variant="outline" onClick={() => setCatMgr(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Categories
          </Button>
          <CategoryManager
            categories={allCategories}
            open={catMgr}
            onClose={() => setCatMgr(false)}
            onCreate={(v) => createCat.mutate(v)}
            onUpdate={(v) => updateCat.mutate(v)}
            onDelete={(c) => deleteCat.mutate(c.id)}
          />
          <Button size="sm" variant="outline" onClick={() => setReasonMgr(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" /> Reason codes
          </Button>
          <ReasonCodeManager
            reasonCodes={allReasonCodes}
            categories={categories}
            open={reasonMgr}
            onClose={() => setReasonMgr(false)}
            onCreate={(v) => createReason.mutate(v)}
            onUpdate={(v) => updateReason.mutate(v)}
            onDelete={(r) => removeReason.mutate(r.id)}
          />
          <Button size="sm" variant="ghost" onClick={() => setShowArchived(s => !s)}>
            {showArchived ? "Hide" : "Show"} archived
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="outline" size="icon" onClick={() => setAnchor(addMonths(anchor, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-sm font-semibold w-40 text-center tabular-nums">
              {anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <Button variant="outline" size="icon" onClick={() => setAnchor(addMonths(anchor, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => setAnchor(startOfMonth(demoNow))}>Today</Button>
          </div>
        </div>
      </div>

      <div data-tour="daily-gemba">
        <CoachingStrip
          walks={walks}
          boards={activeBoards}
          onOpenWalk={(w) => setViewWalk(w)}
          onOpenAll={() => setWalkListOpen(true)}
        />
      </div>


      <RedPareto
        collapsed={!whyRedVisible}
        onToggleCollapsed={() => setEnabled(WHY_RED_KEY, !whyRedVisible)}
        marks={paretoMarks}
        period={paretoPeriod}
        onPeriodChange={changeParetoPeriod}
        rangeFrom={paretoWindow.from}
        rangeTo={paretoWindow.to}

        reasonCodes={reasonCodes}
        categories={categories}
        boards={activeBoards}
        onManage={() => setReasonMgr(true)}
        selectedReasonId={reasonFilter}
        onSelectReason={setReasonFilter}
      />

      {/* Consolidated friction + board */}
      <div data-tour="daily-friction-band">
        <FrictionBand
          anchor={anchor}
          days={days}
          boards={activeBoards}
          defs={friction?.defs ?? []}
          values={metricValues}
          consolidated
        />
      </div>

      <div data-tour="daily-calendar-grid">
        <BoardSection
          title="Consolidated (all boards)"
          subtitle="Rolls up every active board — red if any board is red that day."
          anchor={anchor}
          days={days}
          boards={activeBoards}
          categories={categories}
          consolidated
          marksByBoard={marksByBoard}
          escByBoard={escByBoard}
          onCycle={() => { /* consolidated is read-only */ }}
          onOpen3C={() => { /* consolidated is read-only */ }}
        />
      </div>

      {/* Per-board sections */}
      <div className="mt-6 space-y-4" data-tour="daily-boards">
        {activeBoards.map(board => (
          <div key={board.id} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <button
                className="flex items-center gap-2 font-semibold text-left"
                onClick={() => setCollapsed(c => ({ ...c, [board.id]: !c[board.id] }))}
              >
                {collapsed[board.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                {board.name}
              </button>
              <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setGembaBoard(board)}>
                <Footprints className="mr-1 h-4 w-4" /> Gemba walk
              </Button>
              <BoardMenu
                board={board}
                onRename={() => setNameDialog({ mode: "rename", id: board.id, value: board.name })}
                onArchive={() => archBoard.mutate({ id: board.id, archived: true })}
                onDelete={() => setConfirmDel({ kind: "board", id: board.id, title: `Delete "${board.name}"?`, body: "All marks and 3Cs for this board are removed. This cannot be undone." })}
              />
              </div>
            </div>
            {!collapsed[board.id] && (
              <div className="p-3">
                <FrictionBand
                  anchor={anchor}
                  days={days}
                  boards={[board]}
                  defs={friction?.defs ?? []}
                  values={metricValues}
                  onSetValue={(v) => { if (demoMode) applyDemoMetricValue(v); else saveMetricValue.mutate(v); }}
                  onSaveDef={(v) => saveMetricDef.mutate(v)}
                  onCreateDef={(v) => createMetricDef.mutate(v)}
                  onArchiveDef={(v) => saveMetricDef.mutate(v)}
                  onDeleteDef={(d) => removeMetricDef.mutate(d.id)}
                  onRaise3C={(def, date) =>
                    setEditing({
                      boardId: board.id,
                      category: def.key === "kit_completeness" || def.key === "tool_readiness" ? "delivery" : def.key === "manning_coverage" ? "people" : "quality",
                      date,
                      metricDefId: def.id,
                    })
                  }
                />
                <BoardSection
                  anchor={anchor}
                  days={days}
                  boards={[board]}
                  categories={categories}
                  marksByBoard={marksByBoard}
                  escByBoard={escByBoard}
                  reasonCodes={reasonCodes}
                  reasonFilter={reasonFilter}
                  onSetReason={(cat, date, reasonCodeId) => {
                    const v = { boardId: board.id, category: cat, markDate: date, status: "red" as const, reasonCodeId };
                    if (demoMode) applyDemoMark(v); else setMark.mutate(v);
                  }}
                  onCycle={(cat, date) => {
                    const cur = marksByBoard.get(`${board.id}|${cat}|${date}`);
                    // No mark -> Green -> Red -> clear. 3Cs are raised deliberately, never by the cycle.
                    const next: "green" | "red" | null = !cur ? "green" : cur.status === "green" ? "red" : null;
                    const v = { boardId: board.id, category: cat, markDate: date, status: next };
                    if (demoMode) applyDemoMark(v); else setMark.mutate(v);
                  }}
                  onOpen3C={(cat, date) => {
                    const existing = escByBoard.get(`${board.id}|${cat}|${date}`)?.[0];
                    setEditing({ boardId: board.id, category: cat, date, existing });
                  }}
                />
                <PlanVsActual
                  anchor={anchor}
                  days={days}
                  boardId={board.id}
                  categories={categories}
                  targets={targets}
                  marks={marks}
                  onSetValue={(v) => { if (demoMode) applyDemoTarget(v); else saveCategoryTarget.mutate(v); }}
                  onSetUnit={(categoryId, unit) => updateCat.mutate({ id: categoryId, unit })}
                />

                <div data-tour="daily-3c-list">
                  <ThreeCList
                    escalations={escalations.filter(e => e.board_id === board.id && e.status !== "closed" && (showArchived || !e.archived_at))}
                    profiles={profiles as { id: string }[]}
                    categories={categories}
                    onEdit={(e) => setEditing({ boardId: e.board_id, category: e.category, date: e.occurred_on, existing: e })}
                    onSave={(v) => { const p = v as Parameters<typeof upsertDmEscalation>[0]["data"]; if (demoMode) applyDemoEsc(p); else saveEsc.mutate(p); }}
                    onDelete={(id) => {
                      const esc = escalations.find(e => e.id === id);
                      setConfirmDel({ kind: "esc", id, title: "Delete this 3C?", body: esc ? `"${esc.concern}" will be permanently removed.` : "This 3C will be permanently removed." });
                    }}
                    onNew={() => setEditing({ boardId: board.id, category: categories[0]?.key ?? "safety", date: isoDay(new Date()) })}

                    onEscalateA3={(e) => toA3.mutate(e.id)}
                    onEscalate8D={(e) => to8D.mutate(e.id)}
                    onArchive={(e, archived) => { if (demoMode) applyDemoEscPatch(e.id, { archived_at: archived ? new Date().toISOString() : null }); else archiveEsc.mutate({ id: e.id, archived }); }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {activeBoards.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No active boards. Click "New board" to add one.
          </div>
        )}

        {showArchived && archivedBoards.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Archived boards</h3>
            <div className="space-y-2">
              {archivedBoards.map(board => (
                <div key={board.id} className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2">
                  <span className="text-sm">{board.name}</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => archBoard.mutate({ id: board.id, archived: false })}>
                      <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Restore
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDel({ kind: "board", id: board.id, title: `Delete "${board.name}"?`, body: "All marks and 3Cs for this board are removed. This cannot be undone." })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {gembaBoard && (
        <GembaMode
          board={gembaBoard}
          boards={activeBoards}
          escalations={escalations.filter(e => e.board_id === gembaBoard.id && e.status !== "closed" && !e.archived_at)}
          defs={friction?.defs ?? []}
          values={metricValues}
          today={isoDay(demoNow)}
          objectives={objectives}
          onClose={() => setGembaBoard(null)}
          onSave={(v) => { saveWalk.mutate(v); setGembaBoard(null); }}
        />
      )}

      {walkListOpen && (
        <GembaWalkList
          walks={walks}
          boards={activeBoards}
          onOpen={(w) => { setWalkListOpen(false); setViewWalk(w); }}
          onClose={() => setWalkListOpen(false)}
        />
      )}

      {viewWalk && (
        <GembaWalkViewer
          walk={viewWalk}
          boards={activeBoards}
          canDelete={!isTemplateCompany && !isReadOnly}
          onDelete={async () => {
            const ok = await confirmDialog({
              title: "Delete this Gemba walk?",
              description: "The coaching record and its scored items will be removed. This cannot be undone.",
              confirmLabel: "Delete",
              destructive: true,
            });
            if (ok) removeWalk.mutate(viewWalk.id);
          }}
          onClose={() => setViewWalk(null)}
        />
      )}



      {editing && (
        <ThreeCDialog
          initial={editing}
          boards={activeBoards}
          categories={categories}
          onClose={() => setEditing(null)}
          onSubmit={(v) => { if (demoMode) applyDemoEsc(v); else saveEsc.mutate(v); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => { if (!o) setConfirmDel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDel?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDel?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDel) return;
                if (demoMode) {
                  if (confirmDel.kind === "esc") applyDemoEscPatch(confirmDel.id, null);
                  else toast.error("TitanScale Template is read-only. Duplicate it to edit.");
                  setConfirmDel(null);
                  return;
                }
                if (confirmDel.kind === "board") delBoard.mutate(confirmDel.id);
                else delEsc.mutate(confirmDel.id);
                setConfirmDel(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!nameDialog} onOpenChange={(o) => { if (!o) setNameDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{nameDialog?.mode === "rename" ? "Rename board" : "New board"}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Board name (e.g. Line 1, Assembly, Shift A)"
            value={nameDialog?.value ?? ""}
            onChange={(e) => setNameDialog(d => (d ? { ...d, value: e.target.value } : d))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitNameDialog(); } }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialog(null)}>Cancel</Button>
            <Button onClick={submitNameDialog} disabled={!nameDialog?.value.trim()}>
              {nameDialog?.mode === "rename" ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CoachingStrip({
  walks, boards, onOpenWalk, onOpenAll,
}: {
  walks: GembaWalk[];
  boards: Board[];
  onOpenWalk: (w: GembaWalk) => void;
  onOpenAll: () => void;
}) {
  const recent = walks.slice(0, 5);
  const scored = walks.map(w => w.avg_depth).filter((v): v is number => v != null);
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  const coveredIds = new Set(walks.slice(0, 20).map(w => w.board_id));
  const uncovered = boards.filter(b => !coveredIds.has(b.id));

  return (
    <div className="mb-4 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Leader coaching</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Avg problem-solving depth{" "}
          <span className={`font-bold tabular-nums ${depthClass(avg)}`}>
            {avg == null ? "—" : avg.toFixed(1)}
          </span>{" "}
          / 5
        </div>
        <button
          onClick={onOpenAll}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {walks.length} walk{walks.length === 1 ? "" : "s"} logged — view all
        </button>
        {uncovered.length > 0 && (
          <div className="text-xs text-amber-700">
            Not coached recently: {uncovered.map(b => b.name).join(", ")}
          </div>
        )}
        {recent.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {recent.map(w => (
              <button
                key={w.id}
                onClick={() => onOpenWalk(w)}
                title="Open this coaching walk"
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              >
                {boards.find(b => b.id === w.board_id)?.name ?? "Board"} · {w.walked_on}
                {w.avg_depth != null && ` · ${Number(w.avg_depth).toFixed(1)}`}
              </button>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}

function BoardMenu({ board, onRename, onArchive, onDelete }: { board: Board; onRename: () => void; onArchive: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRename}><Pencil className="h-3.5 w-3.5 mr-2" /> Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive}><Archive className="h-3.5 w-3.5 mr-2" /> Archive</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BoardSection({
  title, subtitle, anchor, days, boards, categories, marksByBoard, escByBoard, onCycle, onOpen3C, consolidated,
  reasonCodes = [], reasonFilter = null, onSetReason,
}: {
  title?: string; subtitle?: string;
  anchor: Date; days: number[]; boards: Board[];
  categories: Category[];
  marksByBoard: Map<string, Mark>;
  escByBoard: Map<string, Escalation[]>;
  onCycle: (cat: DmCategory, date: string) => void;
  onOpen3C: (cat: DmCategory, date: string) => void;
  consolidated?: boolean;
  reasonCodes?: ReasonCode[];
  reasonFilter?: string | null;
  onSetReason?: (cat: DmCategory, date: string, reasonCodeId: string | null) => void;
}) {
  const today = useDemoNow();

  // For each cat/day: aggregate over provided boards
  function cellState(cat: DmCategory, date: string) {
    let red = 0, green = 0, esc = 0;
    let reasonId: string | null = null;
    for (const b of boards) {
      const mk = marksByBoard.get(`${b.id}|${cat}|${date}`);
      if (mk?.status === "red") { red++; reasonId = reasonId ?? (mk.reason_code_id ?? null); }
      else if (mk?.status === "green") green++;
      esc += escByBoard.get(`${b.id}|${cat}|${date}`)?.length ?? 0;
    }
    const status: "red" | "green" | null = red > 0 ? "red" : green > 0 ? "green" : null;
    return { status, red, green, esc, reasonId };
  }

  const summary = categories.map(c => {
    let green = 0, red = 0;
    for (const d of days) {
      const date = isoDay(new Date(anchor.getFullYear(), anchor.getMonth(), d));
      const s = cellState(c.key, date);
      if (s.status === "green") green++;
      else if (s.status === "red") red++;
    }
    const total = green + red;
    return { ...c, green, red, pct: total ? Math.round((green / total) * 100) : null };
  });


  return (
    <div className={consolidated ? "rounded-lg border-2 border-primary/40 bg-card p-3" : ""}>
      {title && (
        <div className="mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {summary.map(s => (
          <div key={s.key} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CategoryIcon name={s.icon} className={`h-4 w-4 ${s.accent}`} /> {s.label}
              </div>
              <span className="text-xs text-muted-foreground">{s.pct == null ? "—" : `${s.pct}% G`}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{s.green} green</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{s.red} red</span>
            </div>
          </div>
        ))}
      </div>


      <div className="rounded-lg border bg-card overflow-x-auto" data-demo="sqdp-calendar">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="sticky left-0 bg-muted/40 text-left px-3 py-2 font-medium min-w-[140px]">Category</th>
              {days.map(d => {
                const dt = new Date(anchor.getFullYear(), anchor.getMonth(), d);
                const isToday = isSameDay(dt, today);
                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                return (
                  <th key={d} className={`px-1 py-1.5 font-normal text-center border-l ${isWeekend ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                    <div className={isToday ? "bg-primary text-primary-foreground rounded-full h-5 w-5 mx-auto flex items-center justify-center" : ""}>{d}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.key} className="border-b">
                <td className="sticky left-0 bg-card px-3 py-2 font-medium">
                  <div className="flex items-center gap-2"><CategoryIcon name={c.icon} className={`h-4 w-4 ${c.accent}`} /> {c.label}</div>
                </td>
                {days.map(d => {
                  const date = isoDay(new Date(anchor.getFullYear(), anchor.getMonth(), d));
                  const s = cellState(c.key, date);
                  const color = s.status === "green"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : s.status === "red"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-muted hover:bg-muted-foreground/20";
                  const title = consolidated
                    ? `${c.label} — ${date}\n${s.green} green · ${s.red} red${s.esc ? ` · ${s.esc} open 3C` : ""}`
                    : `${c.label} — ${date}\nClick to cycle: green → red → clear`;
                  const reason = s.reasonId ? reasonCodes.find(r => r.id === s.reasonId) : undefined;
                  const dimmed = reasonFilter != null && s.status === "red"
                    && (reasonFilter === "__untagged__" ? !!s.reasonId : s.reasonId !== reasonFilter);
                  return (
                    <td key={d} className={`p-0.5 text-center border-l align-top ${dimmed ? "opacity-25" : ""}`}>
                      <button
                        onClick={() => !consolidated && onCycle(c.key, date)}
                        onContextMenu={(e) => { e.preventDefault(); if (!consolidated) onOpen3C(c.key, date); }}
                        disabled={consolidated}
                        title={s.status === "red" && reason ? `${title}\nReason: ${reason.label}` : title}
                        className={`relative w-6 h-6 rounded ${color} transition-colors mx-auto flex items-center justify-center ${consolidated ? "cursor-default" : ""}`}
                      >
                        {s.esc > 0 && <AlertTriangle className="h-3 w-3 text-white/90 drop-shadow" />}
                      </button>
                      {s.status === "red" && !consolidated && onSetReason && (
                        <ReasonPicker
                          reasonCodes={reasonCodes.filter(r => !r.category_key || r.category_key === c.key)}
                          value={s.reasonId}
                          onChange={(id) => onSetReason(c.key, date, id)}
                        />
                      )}
                      {s.status === "red" && !consolidated && (
                        <button
                          onClick={() => onOpen3C(c.key, date)}
                          className="block mx-auto text-[9px] text-red-600 hover:underline mt-0.5"
                          title="Open 3C"
                        >
                          3C
                        </button>
                      )}
                      {s.status === "red" && consolidated && s.red > 0 && (
                        <div className="text-[9px] text-red-600 mt-0.5">{s.red}×</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-[11px] text-muted-foreground border-t flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" /> Green</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500" /> Red (no 3C)</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500 flex items-center justify-center"><AlertTriangle className="h-2 w-2 text-white" /></span> Red with 3C</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted border" /> No mark</span>
          {!consolidated && <span className="ml-auto">Click cycles green → red → clear. Use the 3C link under a red day (or right-click) to raise a 3C.</span>}

        </div>
      </div>
    </div>
  );
}


function ThreeCDialog({
  initial, boards, categories, onClose, onSubmit,
}: {
  initial: { boardId: string; category: DmCategory; date: string; existing?: Escalation; metricDefId?: string | null };
  boards: Board[];
  categories: Category[];
  onClose: () => void;
  onSubmit: (v: Parameters<typeof upsertDmEscalation>[0]["data"]) => void;
}) {
  const e = initial.existing;
  const [boardId, setBoardId] = useState<string>(e?.board_id ?? initial.boardId);
  const [category, setCategory] = useState<DmCategory>(e?.category ?? initial.category);
  const [occurredOn, setOccurredOn] = useState<string>(e?.occurred_on ?? initial.date);
  const [concern, setConcern] = useState(e?.concern ?? "");
  const [cause, setCause] = useState(e?.cause ?? "");
  const [cm, setCm] = useState(e?.countermeasure ?? "");
  const [ownerId, setOwnerId] = useState<string | null>(e?.owner_id ?? null);
  const [dueDate, setDueDate] = useState<string>(e?.due_date ?? "");
  const [escalated, setEscalated] = useState<boolean>(!!e?.escalated);
  const [loopState, setLoopState] = useState<DmLoopState>(e?.loop_state ?? "contain");

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{e ? "Edit 3C" : "New 3C — Concern · Cause · Countermeasure"}</DialogTitle></DialogHeader>
        <form onSubmit={(ev) => { ev.preventDefault(); if (!concern.trim()) return;
          onSubmit({ id: e?.id, boardId, category, occurredOn, concern, cause: cause || null, countermeasure: cm || null,
            ownerId, dueDate: dueDate || null, escalated, status: e?.status ?? "open",
            loopState, metricDefId: initial.metricDefId ?? e?.metric_def_id ?? null }); }}
          className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Board</label>
              <Select value={boardId} onValueChange={setBoardId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{boards.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as DmCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <Input type="date" value={occurredOn} onChange={(ev) => setOccurredOn(ev.target.value)} />
          </div>
          <Input placeholder="Concern (what happened)" value={concern} onChange={(ev) => setConcern(ev.target.value)} required />
          <Textarea placeholder="Cause (why did it happen)" value={cause} onChange={(ev) => setCause(ev.target.value)} />
          <Textarea placeholder="Countermeasure (what will we do)" value={cm} onChange={(ev) => setCm(ev.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Owner</label>
              <OwnerSelect value={ownerId} onChange={setOwnerId} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Due date</label>
              <Input type="date" value={dueDate} onChange={(ev) => setDueDate(ev.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Loop state</label>
            <Select value={loopState} onValueChange={(v) => setLoopState(v as DmLoopState)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOOP_STATES.map(l => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Containment alone never closes the loop — a 3C closes only once the change is standardised.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={escalated} onChange={(ev) => setEscalated(ev.target.checked)} />
            Flagged for cross-functional support
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{e ? "Save" : "Log 3C"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function ReasonPicker({
  reasonCodes, value, onChange,
}: {
  reasonCodes: ReasonCode[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const selected = value ? reasonCodes.find(r => r.id === value) : undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`mx-auto mt-0.5 block h-3 w-3 rounded-full border ${selected ? `bg-current ${selected.color} border-transparent` : "border-dashed border-muted-foreground/60"}`}
          title={selected ? `Reason: ${selected.label}` : "Tag a reason for this red day"}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {reasonCodes.map(r => (
          <DropdownMenuItem key={r.id} onClick={() => onChange(r.id)}>
            <span className={`mr-2 h-2 w-2 rounded-full bg-current ${r.color}`} />
            {r.label}
          </DropdownMenuItem>
        ))}
        {reasonCodes.length === 0 && (
          <DropdownMenuItem disabled>No reason codes yet</DropdownMenuItem>
        )}
        {value && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange(null)}>Clear reason</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
