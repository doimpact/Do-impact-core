import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ActionRow, ActionStatus } from "@/lib/execution-actions";
import { assertWrote } from "@/lib/write-guard";

export type EditCaps = { status: boolean; owner: boolean; due_date: boolean; note?: string };

/** What each source table supports for inline editing from the portal. */
export const EDIT_CAPS: Record<string, EditCaps> = {
  objective_action: { status: true, owner: true, due_date: true },
  waterfall_action: { status: true, owner: true, due_date: true },
  task: { status: true, owner: true, due_date: true },
  dm_escalation: { status: true, owner: true, due_date: true },
  voc_task: { status: true, owner: true, due_date: true },
  problem_step_action: { status: true, owner: true, due_date: true },
  capex_milestone: {
    status: true,
    owner: false,
    due_date: true,
    note: "CapEx milestones track done / not done and have no owner field.",
  },
};

export function editCaps(source: string): EditCaps {
  return EDIT_CAPS[source] ?? { status: false, owner: false, due_date: false, note: "This action is read-only in the portal." };
}

/** Milestones only distinguish done vs not done. */
const BINARY_SOURCES = new Set(["capex_milestone", "dm_escalation", "voc_task"]);

export function statusOptions(source: string): ActionStatus[] {
  return BINARY_SOURCES.has(source) ? ["open", "done"] : ["open", "in_progress", "blocked", "done"];
}

/** Strip the portal prefix ("oa-", "tk-", …) to get the underlying row id. */
export function sourceRowId(row: ActionRow): string {
  return row.id.slice(row.id.indexOf("-") + 1);
}

export type ActionPatch = {
  status?: ActionStatus;
  owner_id?: string | null;
  due_date?: string | null;
};

async function applyPatch(row: ActionRow, patch: ActionPatch) {
  const id = sourceRowId(row);
  const nowIso = new Date().toISOString();
  const { status, owner_id, due_date } = patch;
  const hasStatus = status !== undefined;
  const hasOwner = owner_id !== undefined;
  const hasDue = due_date !== undefined;

  switch (row.source) {
    case "objective_action":
    case "waterfall_action": {
      const upd: Record<string, unknown> = {};
      if (hasStatus) {
        upd["status"] = status;
        upd["completed_at"] = status === "done" ? nowIso : null;
      }
      if (hasOwner) upd["owner_id"] = owner_id;
      if (hasDue) upd["due_date"] = due_date;
      const { data, error } = await supabase.from("objective_actions").update(upd as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
      return;
    }
    case "task": {
      const upd: Record<string, unknown> = {};
      if (hasStatus) {
        upd["status"] = status === "open" ? "todo" : status;
        upd["closed_at"] = status === "done" ? nowIso : null;
        if (status !== "done") upd["close_reason"] = null;
      }
      if (hasOwner) upd["assignee_id"] = owner_id;
      if (hasDue) upd["due_date"] = due_date;
      const { data, error } = await supabase.from("tasks").update(upd as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
      return;
    }
    case "dm_escalation": {
      const upd: Record<string, unknown> = {};
      if (hasStatus) upd["status"] = status === "done" ? "closed" : status;
      if (hasOwner) upd["owner_id"] = owner_id;
      if (hasDue) upd["due_date"] = due_date;
      const { data, error } = await supabase.from("dm_escalations").update(upd as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
      return;
    }
    case "voc_task": {
      const upd: Record<string, unknown> = {};
      if (hasStatus) upd["status"] = status;
      if (hasOwner) upd["owner_id"] = owner_id;
      if (hasDue) upd["due_date"] = due_date;
      const { data, error } = await supabase.from("voc_tasks").update(upd as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
      return;
    }
    case "problem_step_action": {
      const upd: Record<string, unknown> = {};
      if (hasStatus) upd["status"] = status === "open" ? "not_started" : status;
      if (hasOwner) upd["owner_id"] = owner_id;
      if (hasDue) upd["due_date"] = due_date;
      const { data, error } = await supabase.from("problem_step_actions").update(upd as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
      return;
    }
    case "capex_milestone": {
      const upd: Record<string, unknown> = {};
      if (hasStatus) upd["completed_at"] = status === "done" ? nowIso : null;
      if (hasDue) upd["due_date"] = due_date;
      const { data, error } = await supabase.from("capex_milestones").update(upd as never).eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
      return;
    }
    default:
      throw new Error("This action can only be edited in its module.");
  }
}

export function useUpdateAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ row, patch }: { row: ActionRow; patch: ActionPatch }) => {
      const caps = editCaps(row.source);
      const safe: ActionPatch = {};
      if (patch.status !== undefined && caps.status) safe.status = patch.status;
      if (patch.owner_id !== undefined && caps.owner) safe.owner_id = patch.owner_id;
      if (patch.due_date !== undefined && caps.due_date) safe.due_date = patch.due_date || null;
      if (Object.keys(safe).length === 0) throw new Error("Nothing editable in this action.");
      await applyPatch(row, safe);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["execution-actions"] });
      toast.success("Action updated");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not update action"),
  });
}
