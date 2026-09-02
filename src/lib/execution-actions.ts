import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ActionModule =
  | "Strategy"
  | "Progress"
  | "Operations"
  | "Turnaround Finance"
  | "Daily Mgmt"
  | "Commercial"
  | "Problem Solver";

export type ActionStatus = "open" | "in_progress" | "done" | "blocked";

export type ActionRow = {
  id: string;
  source: string;
  module: ActionModule;
  title: string;
  parent: string | null;
  owner_id: string | null;
  owner_name: string | null;
  due_date: string | null;
  start_date: string | null;
  end_date: string | null;
  /** ISO date the action was completed, when known. */
  done_date: string | null;
  status: ActionStatus;
  link: { to: string; params?: Record<string, string> };
  archived: boolean;
};

export const ACTION_MODULES: ActionModule[] = [
  "Strategy",
  "Progress",
  "Commercial",
  "Operations",
  "Turnaround Finance",
  "Daily Mgmt",
  "Problem Solver",
];

export const STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

export const STATUS_TONE: Record<ActionStatus, string> = {
  open: "bg-neutral-200 text-neutral-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-emerald-100 text-emerald-800",
  blocked: "bg-red-100 text-red-800",
};

export const MODULE_TONE: Record<ActionModule, string> = {
  Strategy: "bg-violet-100 text-violet-800",
  Progress: "bg-indigo-100 text-indigo-800",
  Operations: "bg-amber-100 text-amber-800",
  "Turnaround Finance": "bg-sky-100 text-sky-800",
  "Daily Mgmt": "bg-rose-100 text-rose-800",
  Commercial: "bg-emerald-100 text-emerald-800",
  "Problem Solver": "bg-teal-100 text-teal-800",
};

export const MODULE_BAR: Record<ActionModule, string> = {
  Strategy: "bg-violet-500 border-violet-700",
  Progress: "bg-indigo-500 border-indigo-700",
  Operations: "bg-amber-500 border-amber-700",
  "Turnaround Finance": "bg-sky-500 border-sky-700",
  "Daily Mgmt": "bg-rose-500 border-rose-700",
  Commercial: "bg-emerald-500 border-emerald-700",
  "Problem Solver": "bg-teal-500 border-teal-700",
};

export const MODULE_HEX: Record<ActionModule, string> = {
  Strategy: "#8b5cf6",
  Progress: "#6366f1",
  Operations: "#f59e0b",
  "Turnaround Finance": "#0ea5e9",
  "Daily Mgmt": "#f43f5e",
  Commercial: "#10b981",
  "Problem Solver": "#14b8a6",
};

/* ---------------- date helpers ---------------- */

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
export function addDaysISO(base: string, d: number) {
  const dt = new Date(base + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
}
export function parseISO(s: string) {
  return new Date(s + "T00:00:00Z");
}
export function daysBetween(a: string, b: string) {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);
}

/* ---------------- filters ---------------- */

export type ActionFilters = {
  q: string;
  modules: ActionModule[];
  status: "all" | ActionStatus | "overdue";
  owner: string; // "all" | "none" | owner id
  range: "all" | "overdue" | "week" | "month" | "next30" | "custom";
  from: string;
  to: string;
  noDueDate: boolean;
  includeClosed: boolean;
};

export const DEFAULT_FILTERS: ActionFilters = {
  q: "",
  modules: [],
  status: "all",
  owner: "all",
  range: "all",
  from: "",
  to: "",
  noDueDate: false,
  includeClosed: false,
};

export function filterActions(rows: ActionRow[], f: ActionFilters, today = todayISO()): ActionRow[] {
  const weekEnd = addDaysISO(today, 7);
  const monthEnd = addDaysISO(today, 30);
  const s = f.q.toLowerCase().trim();
  return rows.filter((r) => {
    if (!f.includeClosed && (r.archived || r.status === "done")) return false;
    if (f.modules.length > 0 && !f.modules.includes(r.module)) return false;
    if (f.owner === "none") {
      if (r.owner_id) return false;
    } else if (f.owner !== "all" && r.owner_id !== f.owner) return false;
    if (f.noDueDate && r.due_date) return false;

    if (f.status === "overdue") {
      if (!r.due_date || r.due_date >= today || r.status === "done") return false;
    } else if (f.status !== "all") {
      if (r.status !== f.status) return false;
    }

    if (!f.noDueDate) {
      if (f.range === "overdue") {
        if (!r.due_date || r.due_date >= today || r.status === "done") return false;
      } else if (f.range === "week") {
        if (!r.due_date || r.due_date < today || r.due_date > weekEnd) return false;
      } else if (f.range === "month" || f.range === "next30") {
        if (!r.due_date || r.due_date < today || r.due_date > monthEnd) return false;
      } else if (f.range === "custom") {
        if (!r.due_date) return false;
        if (f.from && r.due_date < f.from) return false;
        if (f.to && r.due_date > f.to) return false;
      }
    }

    if (
      s &&
      !(
        r.title.toLowerCase().includes(s) ||
        (r.parent ?? "").toLowerCase().includes(s) ||
        (r.owner_name ?? "").toLowerCase().includes(s)
      )
    )
      return false;
    return true;
  });
}

export function isOverdue(r: ActionRow, today = todayISO()) {
  return !!r.due_date && r.due_date < today && r.status !== "done";
}

/* ---------------- aggregation ---------------- */

export function useExecutionActions() {
  return useQuery({
    queryKey: ["execution-actions"],
    queryFn: async (): Promise<ActionRow[]> => {
      const [oa, tk, esc, ms, profs, pillars, objs, caps, wis, voc, accts, psa, pplans] = await Promise.all([
        supabase.from("objective_actions").select("id, title, owner_id, due_date, status, archived_at, objective_id, waterfall_item_id, created_at, updated_at"),
        supabase.from("tasks").select("id, title, assignee_id, due_date, status, pillar_id, closed_at, created_at"),
        supabase.from("dm_escalations").select("id, concern, countermeasure, owner_id, due_date, status, occurred_on, updated_at"),
        supabase.from("capex_milestones").select("id, title, due_date, completed_at, capex_id"),
        supabase.from("profiles").select("id, display_name"),
        supabase.from("pillars").select("id, key, name"),
        supabase.from("strategic_objectives").select("id, title"),
        supabase.from("capex_projects").select("id, title"),
        supabase.from("waterfall_items").select("id, label, bridge_id"),
        supabase.from("voc_tasks").select("id, title, owner_id, due_date, status, account_id, created_at, updated_at"),
        supabase.from("accounts").select("id, name"),
        supabase.from("problem_step_actions").select("id, title, owner_id, due_date, status, plan_id, created_at, updated_at"),
        supabase.from("problem_plans").select("id, title"),
      ]);

      const pmap = new Map((profs.data ?? []).map((p) => [p.id, p.display_name as string]));
      const pillarMap = new Map((pillars.data ?? []).map((p) => [p.id, p]));
      const objMap = new Map((objs.data ?? []).map((o) => [o.id, o.title as string]));
      const capMap = new Map((caps.data ?? []).map((c) => [c.id, c.title as string]));
      const wiMap = new Map<string, string>(((wis.data ?? []) as { id: string; label: string }[]).map((w) => [w.id, w.label]));
      const acctMap = new Map(((accts.data ?? []) as { id: string; name: string }[]).map((a) => [a.id, a.name]));
      const planMap = new Map<string, string>(((pplans.data ?? []) as { id: string; title: string }[]).map((p) => [String(p.id), String(p.title)]));

      const iso = (v: unknown) => (v ? String(v).slice(0, 10) : null);
      const out: ActionRow[] = [];

      for (const a of oa.data ?? []) {
        const isWaterfall = !!a.waterfall_item_id;
        const status = ((a.status as ActionStatus) ?? "open") as ActionStatus;
        out.push({
          id: "oa-" + a.id,
          source: isWaterfall ? "waterfall_action" : "objective_action",
          module: isWaterfall ? "Progress" : "Strategy",
          title: a.title,
          parent: isWaterfall
            ? (wiMap.get(a.waterfall_item_id as string) ?? "Workstream lever")
            : (a.objective_id ? objMap.get(a.objective_id) ?? null : null),
          owner_id: a.owner_id,
          owner_name: a.owner_id ? pmap.get(a.owner_id) ?? null : null,
          due_date: a.due_date,
          start_date: iso(a.created_at),
          end_date: a.due_date,
          done_date: status === "done" ? iso(a.updated_at) : null,
          status,
          link: { to: isWaterfall ? "/strategy/initiatives" : "/strategy" },
          archived: !!a.archived_at,
        });
      }

      for (const t of tk.data ?? []) {
        const pill = pillarMap.get(t.pillar_id) as { key?: string; name?: string } | undefined;
        const s = t.status as string;
        const mapped: ActionStatus = s === "done" ? "done" : s === "in_progress" ? "in_progress" : s === "blocked" ? "blocked" : "open";
        out.push({
          id: "tk-" + t.id,
          source: "task",
          module: "Operations",
          title: t.title,
          parent: pill?.name ?? null,
          owner_id: t.assignee_id,
          owner_name: t.assignee_id ? pmap.get(t.assignee_id) ?? null : null,
          due_date: t.due_date,
          start_date: iso(t.created_at),
          end_date: t.closed_at ? iso(t.closed_at) : t.due_date,
          done_date: mapped === "done" ? iso(t.closed_at) : null,
          status: mapped,
          link: pill?.key ? { to: "/oms/pillars/$pillarKey", params: { pillarKey: pill.key } } : { to: "/oms" },
          archived: !!t.closed_at && mapped === "done",
        });
      }

      for (const e of esc.data ?? []) {
        const s = (e.status as string) ?? "open";
        const mapped: ActionStatus = s === "closed" || s === "done" ? "done" : s === "in_progress" ? "in_progress" : s === "blocked" ? "blocked" : "open";
        out.push({
          id: "esc-" + e.id,
          source: "dm_escalation",
          module: "Daily Mgmt",
          title: e.countermeasure || e.concern,
          parent: "3C — " + e.occurred_on,
          owner_id: e.owner_id,
          owner_name: e.owner_id ? pmap.get(e.owner_id) ?? null : null,
          due_date: e.due_date,
          start_date: e.occurred_on ?? null,
          end_date: e.due_date,
          done_date: mapped === "done" ? iso(e.updated_at) : null,
          status: mapped,
          link: { to: "/oms/daily" },
          archived: false,
        });
      }

      for (const m of ms.data ?? []) {
        const mapped: ActionStatus = m.completed_at ? "done" : "open";
        out.push({
          id: "ms-" + m.id,
          source: "capex_milestone",
          module: "Turnaround Finance",
          title: m.title,
          parent: capMap.get(m.capex_id) ?? null,
          owner_id: null,
          owner_name: null,
          due_date: m.due_date,
          start_date: m.due_date ? addDaysISO(m.due_date, -7) : null,
          end_date: m.completed_at ? iso(m.completed_at) : m.due_date,
          done_date: iso(m.completed_at),
          status: mapped,
          link: { to: "/strategy/capex" },
          archived: false,
        });
      }

      for (const v of (voc.data ?? []) as { id: string; title: string; owner_id: string | null; due_date: string | null; status: string; account_id: string | null; created_at: string; updated_at?: string }[]) {
        const mapped: ActionStatus = v.status === "done" ? "done" : v.status === "in_progress" ? "in_progress" : v.status === "blocked" ? "blocked" : "open";
        out.push({
          id: "voc-" + v.id,
          source: "voc_task",
          module: "Commercial",
          title: v.title,
          parent: v.account_id ? "VoC — " + (acctMap.get(v.account_id) ?? "Account") : "VoC",
          owner_id: v.owner_id,
          owner_name: v.owner_id ? pmap.get(v.owner_id) ?? null : null,
          due_date: v.due_date,
          start_date: iso(v.created_at),
          end_date: v.due_date,
          done_date: mapped === "done" ? iso(v.updated_at) : null,
          status: mapped,
          link: { to: "/commercial/voc" },
          archived: false,
        });
      }

      for (const a of (psa.data ?? []) as { id: string; title: string; owner_id: string | null; due_date: string | null; status: string; plan_id: string; created_at: string; updated_at?: string }[]) {
        const mapped: ActionStatus = a.status === "done" ? "done" : a.status === "in_progress" ? "in_progress" : a.status === "blocked" ? "blocked" : "open";
        out.push({
          id: "psa-" + a.id,
          source: "problem_step_action",
          module: "Problem Solver",
          title: a.title,
          parent: planMap.get(a.plan_id) ?? "Problem",
          owner_id: a.owner_id,
          owner_name: a.owner_id ? pmap.get(a.owner_id) ?? null : null,
          due_date: a.due_date,
          start_date: iso(a.created_at),
          end_date: a.due_date,
          done_date: mapped === "done" ? iso(a.updated_at) : null,
          status: mapped,
          link: { to: "/actions/problem-solver" },
          archived: false,
        });
      }

      return out;
    },
  });
}
