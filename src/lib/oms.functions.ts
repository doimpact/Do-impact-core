import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { assertWrote } from "@/lib/write-guard";
import { structurePatch, type KpiStructureInput } from "@/lib/kpi-structure";



// ----- Pillars -----
export const listPillars = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pillars")
      .select("id,key,name,tagline,variant,health,sort_order,archived_at,owner_id,owner:owner_id(id,display_name),sub_pillars(id,name,sort_order)")
      .order("sort_order");

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createPillar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; name: string; tagline?: string | null; variant?: string; ownerId?: string | null }) =>
    z.object({
      key: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
      name: z.string().min(1).max(120),
      tagline: z.string().max(240).nullish(),
      variant: z.string().max(32).optional(),
      ownerId: z.string().uuid().nullish(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: maxRow } = await context.supabase.from("pillars")
      .select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const nextOrder = (maxRow?.sort_order ?? 0) + 1;
    const { data: row, error } = await context.supabase.from("pillars").insert({
      key: data.key, name: data.name, tagline: data.tagline ?? null,
      variant: data.variant ?? "default", sort_order: nextOrder,
      owner_id: data.ownerId ?? null,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePillar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; name?: string; tagline?: string | null; key?: string; variant?: string; ownerId?: string | null }) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(120).optional(),
      tagline: z.string().max(240).nullish(),
      key: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/).optional(),
      variant: z.string().max(32).optional(),
      ownerId: z.string().uuid().nullish(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: { name?: string; tagline?: string | null; key?: string; variant?: string; owner_id?: string | null } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.tagline !== undefined) patch.tagline = data.tagline ?? null;
    if (data.key !== undefined) patch.key = data.key;
    if (data.variant !== undefined) patch.variant = data.variant;
    if (data.ownerId !== undefined) patch.owner_id = data.ownerId ?? null;
    const { error } = await context.supabase.from("pillars").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const archivePillar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; archived: boolean }) => z.object({ id: z.string().uuid(), archived: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("pillars")
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.id)
      .select("id");

    if (error) throw new Error(error.message);
    assertWrote(rows, data.archived ? "archive" : "restore");
    return { ok: true };
  });

export const deletePillar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pillars").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const setPillarHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string; health: "green" | "yellow" | "red" }) =>
    z.object({ pillarId: z.string().uuid(), health: z.enum(["green","yellow","red"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pillars").update({ health: data.health }).eq("id", data.pillarId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPillarByKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: pillar, error } = await context.supabase
      .from("pillars").select("id,key,name,tagline,variant,archived_at,owner_id,owner:owner_id(id,display_name),sub_pillars(id,name,sort_order)")
      .eq("key", data.key).maybeSingle();
    if (error) throw new Error(error.message);
    if (!pillar) throw new Error("Pillar not found");
    return pillar;
  });


// ----- Pillar notes -----
export const listPillarNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("pillar_notes")
      .select("id,pillar_id,kind,position,content").eq("pillar_id", data.pillarId).order("position");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listAllPillarNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("pillar_notes")
      .select("id,pillar_id,kind,position,content").order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addPillarNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string; kind: "working_well" | "can_improve"; content?: string }) =>
    z.object({ pillarId: z.string().uuid(), kind: z.enum(["working_well","can_improve"]), content: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { count, error: cErr } = await context.supabase.from("pillar_notes")
      .select("id", { count: "exact", head: true }).eq("pillar_id", data.pillarId).eq("kind", data.kind);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) >= 5) throw new Error("Max 5 bullets per column");
    const { data: row, error } = await context.supabase.from("pillar_notes").insert({
      pillar_id: data.pillarId, kind: data.kind, position: count ?? 0, content: data.content ?? "", created_by: context.userId,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePillarNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; content: string }) => z.object({ id: z.string().uuid(), content: z.string().max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pillar_notes").update({ content: data.content }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePillarNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pillar_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Tasks -----
export const listTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("tasks").select("*")
      .eq("pillar_id", data.pillarId).or("close_reason.is.null,close_reason.neq.archived").order("position");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listAllTaskCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("tasks").select("pillar_id,status,close_reason");
    if (error) throw new Error(error.message);
    return (data ?? []).filter((r) => r.close_reason !== "archived");
  });

export const listAllTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("tasks").select("*,pillars(id,key,name)")
      .or("close_reason.is.null,close_reason.neq.archived").order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string; title: string; subPillarId?: string | null; priority?: "low"|"med"|"high"|"urgent"; dueDate?: string | null; description?: string | null; status?: "backlog"|"todo"|"in_progress"|"blocked"|"done"; assigneeId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("tasks").insert({
      pillar_id: data.pillarId, sub_pillar_id: data.subPillarId ?? null, title: data.title,
      description: data.description ?? null, status: data.status ?? "todo", priority: data.priority ?? "med",
      due_date: data.dueDate ?? null, assignee_id: data.assigneeId ?? context.userId,
      created_by: context.userId, position: Date.now(),
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status?: "backlog"|"todo"|"in_progress"|"blocked"|"done"; position?: number; title?: string; description?: string | null; priority?: "low"|"med"|"high"|"urgent"; dueDate?: string | null; assigneeId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const patch = {
      updated_at: new Date().toISOString(),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { due_date: data.dueDate }),
      ...(data.assigneeId !== undefined && { assignee_id: data.assigneeId }),
    };
    const { error } = await context.supabase.from("tasks").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason: "done" | "blocked" }) => z.object({ id: z.string().uuid(), reason: z.enum(["done","blocked"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").update({
      status: data.reason, close_reason: data.reason, closed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reopenTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").update({
      status: "todo", close_reason: null, closed_at: null, updated_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").update({
      status: "done", close_reason: "archived", closed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- KPIs -----
export const listKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: kpis, error } = await context.supabase.from("kpis")
      .select("*,kpi_values(id,period_start,actual,target)").eq("pillar_id", data.pillarId).is("archived_at", null).order("created_at");
    if (error) throw new Error(error.message);
    return kpis ?? [];
  });






export const createKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pillarId: string; name: string; unit?: string | null; target?: number | null; higherIsBetter?: boolean; frequency?: string; description?: string | null } & KpiStructureInput) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("kpis").insert({
      pillar_id: data.pillarId, name: data.name, unit: data.unit ?? null, target: data.target ?? null,
      higher_is_better: data.higherIsBetter ?? true, frequency: data.frequency ?? "monthly",
      description: data.description ?? null, owner_id: context.userId,
      ...structurePatch(data),
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createKpisFromLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { items: { pillarId: string; libraryKey: string }[] }) =>
    z.object({ items: z.array(z.object({ pillarId: z.string().uuid(), libraryKey: z.string().min(1) })).min(1).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { KPI_LIBRARY_BY_KEY } = await import("./kpi-library");
    const keys = data.items.map((i) => i.libraryKey);
    const { data: existing } = await context.supabase.from("kpis").select("library_key").in("library_key", keys);
    const taken = new Set((existing ?? []).map((r) => r.library_key));

    const rows = data.items
      .filter((i) => !taken.has(i.libraryKey))
      .map((i) => {
        const e = KPI_LIBRARY_BY_KEY.get(i.libraryKey);
        if (!e) return null;
        return {
          pillar_id: i.pillarId,
          name: e.name,
          unit: e.unit,
          higher_is_better: e.higherIsBetter,
          frequency: e.frequency,
          description: e.definition,
          purpose: e.definition,
          owner_id: context.userId,
          code: e.code,
          library_key: e.key,
          category: e.category,
          hierarchy_level: e.level,
          indicator_type: e.indicator,
          formula: e.formula,
          data_source: e.dataSource,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) return { created: 0, skipped: data.items.length };
    const { error } = await context.supabase.from("kpis").insert(rows);
    if (error) throw new Error(error.message);
    return { created: rows.length, skipped: data.items.length - rows.length };
  });


export const logKpiValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kpiId: string; periodStart: string; actual?: number | null; target?: number | null; note?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase.from("kpi_values")
      .select("id,actual,target,note").eq("kpi_id", data.kpiId).eq("period_start", data.periodStart).maybeSingle();
    const row = {
      kpi_id: data.kpiId, period_start: data.periodStart,
      actual: data.actual !== undefined ? data.actual : (existing?.actual ?? null),
      target: data.target !== undefined ? data.target : (existing?.target ?? null),
      note: data.note !== undefined ? data.note : (existing?.note ?? null),
    };
    const { error } = await context.supabase.from("kpi_values").upsert(row, { onConflict: "kpi_id,period_start" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kpis").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; name?: string; unit?: string | null; target?: number | null; higherIsBetter?: boolean; frequency?: string; description?: string | null; isKey?: boolean; ownerId?: string | null; amberThreshold?: number | null; greenThreshold?: number | null } & KpiStructureInput) => d)
  .handler(async ({ data, context }) => {
    const patch = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.target !== undefined && { target: data.target }),
      ...(data.higherIsBetter !== undefined && { higher_is_better: data.higherIsBetter }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isKey !== undefined && { is_key: data.isKey }),
      ...(data.ownerId !== undefined && { owner_id: data.ownerId }),
      ...(data.amberThreshold !== undefined && { amber_threshold: data.amberThreshold }),
      ...(data.greenThreshold !== undefined && { green_threshold: data.greenThreshold }),
      ...structurePatch(data),
    };

    const { data: row, error } = await context.supabase.from("kpis").update(patch).eq("id", data.id).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAllKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { includeArchived?: boolean } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("kpis")
      .select("*,pillars(id,key,name,variant,sort_order,health),kpi_values(id,period_start,actual,target)")
      .order("created_at");
    if (!data?.includeArchived) q = q.is("archived_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listArchivedKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("kpis")
      .select("*,pillars(id,key,name,variant,sort_order,health),kpi_values(id,period_start,actual,target)")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const archiveKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kpis").update({ archived_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kpis").update({ archived_at: null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Members / roles -----
export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
      context.supabase.from("profiles").select("id,display_name,avatar_url,title,manager_id"),
      context.supabase.from("user_roles").select("user_id,role"),
    ]);
    if (pe) throw new Error(pe.message);
    if (re) throw new Error(re.message);
    return { profiles: profiles ?? [], roles: roles ?? [] };
  });

export const setManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid(), managerId: z.string().uuid().nullable() }).parse(data))
  .handler(async ({ context, data }) => {
    const isAdmin = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin.data) throw new Error("Only admins can modify the org chart");
    if (data.managerId === data.userId) throw new Error("A person cannot manage themselves");
    const { error } = await context.supabase.from("profiles").update({ manager_id: data.managerId }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.role as "admin" | "leader" | "contributor");
  });

async function activeCompanyId(supabase: { from: (t: string) => any }, userId: string) {
  const { data } = await supabase.from("user_active_company").select("company_id").eq("user_id", userId).maybeSingle();
  const cid = (data as { company_id?: string } | null)?.company_id;
  if (!cid) throw new Error("No active company selected");
  return cid;
}

/** Caller must be an admin of their active company; returns that company id. */
async function requireCompanyAdmin(context: { supabase: any; userId: string }) {
  const companyId = await activeCompanyId(context.supabase, context.userId);
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _company_id: companyId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
  return companyId;
}

/** Target user must belong to the caller's company. */
async function requireSameCompany(context: { supabase: any }, companyId: string, targetUserId: string) {
  const { data } = await context.supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!data) throw new Error("User is not a member of your company");
}



export const setRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "admin" | "leader" | "contributor"; enabled: boolean }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin","leader","contributor"]), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await requireCompanyAdmin(context);
    await requireSameCompany(context, companyId, data.userId);
    if (data.enabled) {
      const { error } = await context.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role, company_id: companyId });
      if (error && !String(error.message).includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role).eq("company_id", companyId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });


export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; displayName?: string; role?: "admin" | "leader" | "contributor" }) =>
    z.object({ email: z.string().email(), displayName: z.string().min(1).optional(), role: z.enum(["admin","leader","contributor"]).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await requireCompanyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const displayName = data.displayName ?? data.email.split("@")[0];
    let uid: string | undefined;
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { data: { full_name: displayName } });
    if (error) {
      const msg = String(error.message).toLowerCase();
      const alreadyExists = msg.includes("already been registered") || msg.includes("already registered") || msg.includes("already exists");
      if (!alreadyExists) throw new Error(error.message);
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw new Error(listErr.message);
      uid = list.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase())?.id;
      if (!uid) throw new Error("User already exists but could not be located");
    } else uid = invited.user?.id;
    if (uid) {
      // Only touch the profile row when it does not exist yet — never overwrite
      // the display name of an existing user from another company.
      const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("id", uid).maybeSingle();
      if (!existing) await supabaseAdmin.from("profiles").insert({ id: uid, display_name: displayName });
      await supabaseAdmin.from("company_members").upsert({ company_id: companyId, user_id: uid, role: "member" }, { onConflict: "company_id,user_id" });
      await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: data.role ?? "contributor", company_id: companyId }, { onConflict: "user_id,company_id,role" });
    }
    return { ok: true, userId: uid };
  });

export const addLocalMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { displayName: string; title?: string; role?: "admin" | "leader" | "contributor" }) =>
    z.object({ displayName: z.string().trim().min(1).max(120), title: z.string().trim().max(120).optional(), role: z.enum(["admin","leader","contributor"]).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await requireCompanyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const { error } = await supabaseAdmin.from("profiles").insert({ id, display_name: data.displayName, title: data.title ?? null });
    if (error) throw new Error(error.message);
    if (data.role) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: data.role, company_id: companyId }, { onConflict: "user_id,company_id,role" });
    }
    return { ok: true, userId: id };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await requireCompanyAdmin(context);
    if (data.userId === context.userId) throw new Error("You can't delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // The target must either be a member of the caller's company, or a
    // local (non-auth) profile that belongs to no company at all.
    const { data: memberships } = await supabaseAdmin
      .from("company_members").select("company_id").eq("user_id", data.userId);
    const rows = memberships ?? [];
    const inCallerCompany = rows.some((m) => m.company_id === companyId);
    if (rows.length > 0 && !inCallerCompany) throw new Error("User is not a member of your company");

    // Always remove company-scoped links first.
    await supabaseAdmin.from("company_members").delete().eq("user_id", data.userId).eq("company_id", companyId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("company_id", companyId);

    // Keep the account alive when the user still belongs to other companies.
    if (rows.some((m) => m.company_id !== companyId)) return { ok: true, removedFromCompany: true };

    await supabaseAdmin.from("profiles").update({ manager_id: null }).eq("manager_id", data.userId);
    await supabaseAdmin.from("tasks").update({ assignee_id: null }).eq("assignee_id", data.userId);
    await supabaseAdmin.from("calendar_events").update({ assignee_id: null }).eq("assignee_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    if (error) throw new Error(error.message);
    try { await supabaseAdmin.auth.admin.deleteUser(data.userId); } catch { /* no auth user */ }
    return { ok: true };
  });

// ----- Calendar Events -----
export const listCalendarEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("calendar_events")
      .select("*,pillars(id,key,name),profiles:assignee_id(id,display_name)")
      .gte("event_date", data.from).lte("event_date", data.to).order("event_date");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; eventType: "visit"|"audit"|"meeting"|"other"; eventDate: string; startTime?: string | null; endTime?: string | null; notes?: string | null; assigneeId?: string | null; pillarId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("calendar_events").insert({
      title: data.title, event_type: data.eventType, event_date: data.eventDate,
      start_time: data.startTime ?? null, end_time: data.endTime ?? null, notes: data.notes ?? null,
      assignee_id: data.assigneeId ?? null, pillar_id: data.pillarId ?? null, created_by: context.userId,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; title?: string; eventType?: "visit"|"audit"|"meeting"|"other"; eventDate?: string; startTime?: string | null; endTime?: string | null; notes?: string | null; assigneeId?: string | null; pillarId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const patch = {
      updated_at: new Date().toISOString(),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.eventType !== undefined && { event_type: data.eventType }),
      ...(data.eventDate !== undefined && { event_date: data.eventDate }),
      ...(data.startTime !== undefined && { start_time: data.startTime }),
      ...(data.endTime !== undefined && { end_time: data.endTime }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.assigneeId !== undefined && { assignee_id: data.assigneeId }),
      ...(data.pillarId !== undefined && { pillar_id: data.pillarId }),
    };
    const { error } = await context.supabase.from("calendar_events").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("calendar_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- A3 reports (Operations variant using text fields) -----
type A3Status = "draft" | "active" | "completed" | "archived";
type A3Input = {
  id?: string; title: string; pillarId?: string | null; ownerId?: string | null; status?: A3Status;
  problemStatement?: string | null; background?: string | null; currentCondition?: string | null;
  goal?: string | null; rootCause?: string | null; countermeasures?: string | null;
  actionPlan?: string | null; followup?: string | null;
};

export const listA3s = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: rows }, { data: profiles }, { data: pillars }] = await Promise.all([
      context.supabase.from("a3_reports").select("*").order("updated_at", { ascending: false }),
      context.supabase.from("profiles").select("id,display_name"),
      context.supabase.from("pillars").select("id,name,key"),
    ]);
    const pm = new Map((profiles ?? []).map((p) => [p.id, p]));
    const plm = new Map((pillars ?? []).map((p) => [p.id, p]));
    return {
      a3s: (rows ?? []).map((r) => ({
        ...r,
        owner: r.owner_id ? (pm.get(r.owner_id) ?? null) : null,
        pillar: r.pillar_id ? (plm.get(r.pillar_id) ?? null) : null,
      })),
    };
  });

export const upsertA3 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: A3Input) => d)
  .handler(async ({ data, context }) => {
    const patch = {
      title: data.title, pillar_id: data.pillarId ?? null, owner_id: data.ownerId ?? null,
      status: data.status ?? "draft",
      problem_statement: data.problemStatement ?? null, background: data.background ?? null,
      current_condition: data.currentCondition ?? null, goal: data.goal ?? null,
      root_cause: data.rootCause ?? null, countermeasures: data.countermeasures ?? null,
      action_plan: data.actionPlan ?? null, followup: data.followup ?? null,
      completed_at: data.status === "completed" ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("a3_reports").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("a3_reports")
      .insert({ ...patch, created_by: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteA3 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("a3_reports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Daily Management (SQDP) -----
/** Category key — workspace-defined (see dm_categories). */
export type DmCategory = string;

const DEFAULT_DM_CATEGORIES = [
  { key: "safety", label: "Safety", accent: "text-red-600", icon: "ShieldCheck", sort_order: 0 },
  { key: "people", label: "People", accent: "text-sky-600", icon: "Users", sort_order: 1 },
  { key: "quality", label: "Quality", accent: "text-violet-600", icon: "BadgeCheck", sort_order: 2 },
  { key: "delivery", label: "Delivery", accent: "text-amber-600", icon: "Truck", sort_order: 3 },
];

function slugifyCategory(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "category";
}

export const listDmCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { includeArchived?: boolean } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const read = async () => {
      let q = context.supabase.from("dm_categories").select("*").eq("company_id", companyId).order("sort_order").order("created_at");
      if (!data.includeArchived) q = q.is("archived_at", null);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      return rows ?? [];
    };
    let rows = await read();
    if (rows.length === 0) {
      await (context.supabase.from("dm_categories") as any)
        .insert(DEFAULT_DM_CATEGORIES.map(c => ({ ...c, company_id: companyId })));
      rows = await read();
    }
    return rows;
  });

export const createDmCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { label: string; accent?: string; icon?: string }) => d)
  .handler(async ({ data, context }) => {
    const label = data.label.trim();
    if (!label) throw new Error("Name required");
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: existing } = await context.supabase.from("dm_categories").select("key, sort_order").eq("company_id", companyId);
    const keys = new Set((existing ?? []).map((r: any) => r.key as string));
    const base = slugifyCategory(label);
    let key = base;
    let n = 2;
    while (keys.has(key)) key = `${base}_${n++}`;
    const sort = Math.max(-1, ...(existing ?? []).map((r: any) => Number(r.sort_order) || 0)) + 1;
    const { data: row, error } = await (context.supabase.from("dm_categories") as any).insert({
      company_id: companyId, key, label,
      accent: data.accent ?? "text-slate-600", icon: data.icon ?? "Circle", sort_order: sort,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateDmCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; label?: string; accent?: string; icon?: string; unit?: string | null; sortOrder?: number; archived?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.label != null) patch.label = data.label.trim();
    if (data.accent != null) patch.accent = data.accent;
    if (data.icon != null) patch.icon = data.icon;
    if (data.sortOrder != null) patch.sort_order = data.sortOrder;
    if (data.archived != null) patch.archived_at = data.archived ? new Date().toISOString() : null;
    const { error } = await (context.supabase.from("dm_categories") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDmCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: cat, error: readErr } = await context.supabase
      .from("dm_categories").select("key").eq("id", data.id).eq("company_id", companyId).maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!cat) throw new Error("Category not found");
    const key = (cat as any).key as string;
    const { error } = await context.supabase.from("dm_categories").delete().eq("id", data.id);
    if (error?.message.includes("TitanScale Template is read-only")) return { ok: false, error: error.message };
    if (error) throw new Error(error.message);
    await context.supabase.from("dm_marks").delete().eq("company_id", companyId).eq("category", key);
    await context.supabase.from("dm_escalations").delete().eq("company_id", companyId).eq("category", key);
    return { ok: true };
  });


async function ensureDefaultBoard(supabase: any, companyId: string): Promise<string> {
  const { data: existing } = await supabase.from("dm_boards").select("id").eq("company_id", companyId).order("sort_order").limit(1).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created, error } = await supabase.from("dm_boards").insert({ name: "Main", sort_order: 0, company_id: companyId }).select("id").single();
  if (error) throw new Error(error.message);
  return created!.id;
}

export const listDmBoards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { includeArchived?: boolean } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    await ensureDefaultBoard(context.supabase, companyId);
    let q = context.supabase.from("dm_boards").select("*").eq("company_id", companyId).order("sort_order").order("created_at");
    if (!data.includeArchived) q = q.is("archived_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createDmBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data, context }) => {
    const name = data.name.trim();
    if (!name) throw new Error("Name required");
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: row, error } = await (context.supabase.from("dm_boards") as any).insert({ name, company_id: companyId }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });


export const renameDmBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; name: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dm_boards").update({ name: data.name.trim() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveDmBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; archived: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dm_boards").update({ archived_at: data.archived ? new Date().toISOString() : null }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDmBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dm_boards").delete().eq("id", data.id);
    if (error?.message.includes("TitanScale Template is read-only")) {
      return { ok: false, error: error.message };
    }
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listDailyManagement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string; boardIds?: string[] }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    let marksQ = context.supabase.from("dm_marks").select("*").eq("company_id", companyId).gte("mark_date", data.from).lte("mark_date", data.to).order("mark_date");
    let escQ = context.supabase.from("dm_escalations").select("*").eq("company_id", companyId).gte("occurred_on", data.from).lte("occurred_on", data.to).order("occurred_on", { ascending: false });
    if (data.boardIds && data.boardIds.length) {
      marksQ = marksQ.in("board_id", data.boardIds);
      escQ = escQ.in("board_id", data.boardIds);
    }
    const [marks, escalations] = await Promise.all([marksQ, escQ]);
    if (marks.error) throw new Error(marks.error.message);
    if (escalations.error) throw new Error(escalations.error.message);
    return { marks: marks.data ?? [], escalations: escalations.data ?? [] };
  });

export const upsertDmMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { boardId: string; category: DmCategory; markDate: string; status: "green" | "red" | null; note?: string | null; reasonCodeId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    if (data.status === null) {
      const { error } = await context.supabase.from("dm_marks").delete()
        .eq("board_id", data.boardId).eq("category", data.category).eq("mark_date", data.markDate);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await (context.supabase.from("dm_marks") as any).upsert({
      board_id: data.boardId, category: data.category, mark_date: data.markDate, status: data.status,
      note: data.note ?? null, created_by: context.userId,
      reason_code_id: data.status === "red" ? (data.reasonCodeId ?? null) : null,
    }, { onConflict: "board_id,category,mark_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type DmLoopState = "contain" | "cause" | "countermeasure" | "standardised" | "closed";

export const upsertDmEscalation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; boardId: string; category: DmCategory; occurredOn: string; concern: string; cause?: string | null; countermeasure?: string | null; ownerId?: string | null; dueDate?: string | null; status?: string; escalated?: boolean; loopState?: DmLoopState; metricDefId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const row: Record<string, unknown> = {
      board_id: data.boardId,
      category: data.category, occurred_on: data.occurredOn, concern: data.concern,
      cause: data.cause ?? null, countermeasure: data.countermeasure ?? null,
      owner_id: data.ownerId ?? null, due_date: data.dueDate ?? null,
      status: data.status ?? "open", escalated: data.escalated ?? false,
      metric_def_id: data.metricDefId ?? null,
    };
    if (data.loopState) {
      row.loop_state = data.loopState;
      if (data.loopState === "standardised") {
        row.standardised_at = new Date().toISOString();
        row.standardised_by = context.userId;
      }
      if (data.loopState === "closed") row.status = "closed";
    }
    if (data.id) {
      const { error } = await (context.supabase.from("dm_escalations") as any).update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    // Recurrence: same board + category with a similar concern in the last 90 days.
    const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const { data: prior } = await context.supabase
      .from("dm_escalations")
      .select("id,concern")
      .eq("board_id", data.boardId)
      .eq("category", data.category)
      .gte("occurred_on", since);
    const fingerprint = (t: string) =>
      t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 32);
    const fp = fingerprint(data.concern);
    const matches = (prior ?? []).filter((p: { concern: string }) => fingerprint(p.concern) === fp);
    row.recurrence_count = matches.length + 1;

    const { data: created, error } = await (context.supabase.from("dm_escalations") as any)
      .insert({ ...row, created_by: context.userId }).select("id").single();
    if (error) throw new Error(error.message);

    // Keep the sibling rows' counters in sync so the badge is consistent.
    if (matches.length) {
      await (context.supabase.from("dm_escalations") as any)
        .update({ recurrence_count: matches.length + 1 })
        .in("id", matches.map((m: { id: string }) => m.id));
    }
    return { ok: true, id: created?.id as string | undefined, recurrenceCount: matches.length + 1 };
  });

export const archiveDmEscalation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; archived: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase.from("dm_escalations") as any)
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw new Error("Nothing was updated — this 3C may belong to another workspace or be read-only.");
    return { ok: true };
  });

export const deleteDmEscalation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("dm_escalations").delete().eq("id", data.id).select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw new Error("Nothing was deleted — this 3C may belong to another workspace or be read-only.");
    return { ok: true };
  });

/** Create a linked A3 report from a 3C and store the link back on the escalation. */
export const escalateDmToA3 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: esc, error: e1 } = await context.supabase
      .from("dm_escalations").select("*").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    const row = esc as any;
    if (row.a3_report_id) return { ok: true, a3Id: row.a3_report_id as string, existing: true };

    const { data: board } = await context.supabase
      .from("dm_boards").select("name").eq("id", row.board_id).maybeSingle();
    const boardName = (board as { name?: string } | null)?.name ?? "Daily board";
    const cat = String(row.category);

    const { data: a3, error: e2 } = await (context.supabase.from("a3_reports") as any).insert({
      title: `${row.concern}`.slice(0, 120),
      status: "active",
      owner_id: row.owner_id,
      created_by: context.userId,
      problem_statement: row.concern,
      background: `Escalated from Daily Management (SQDP) — board "${boardName}", ${cat} category, first seen ${row.occurred_on}. Recurrence count: ${row.recurrence_count ?? 1}.`,
      current_condition: row.cause ? `Cause identified at the board: ${row.cause}` : "Containment applied at the cell; root cause not yet verified.",
      root_cause: row.cause ?? null,
      countermeasures: row.countermeasure ?? null,
    }).select("id").single();
    if (e2) throw new Error(e2.message);

    const { error: e3 } = await (context.supabase.from("dm_escalations") as any)
      .update({ a3_report_id: a3.id, escalated: true }).eq("id", data.id);
    if (e3) throw new Error(e3.message);
    return { ok: true, a3Id: a3.id as string, existing: false };
  });

/** Create a linked 8D report from a 3C escalation (high-severity / recurring escapes). */
export const escalateDmTo8D = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: esc, error: e1 } = await context.supabase
      .from("dm_escalations").select("*").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    const row = esc as any;

    const { data: existing } = await (context.supabase.from("eight_d_reports") as any)
      .select("id").eq("source_escalation_id", data.id).maybeSingle();
    if (existing?.id) return { ok: true, eightDId: existing.id as string, existing: true };

    const { data: board } = await context.supabase
      .from("dm_boards").select("name").eq("id", row.board_id).maybeSingle();
    const boardName = (board as { name?: string } | null)?.name ?? "Daily board";

    const { data: rep, error: e2 } = await (context.supabase.from("eight_d_reports") as any).insert({
      title: `${row.concern}`.slice(0, 120),
      status: "open",
      severity: (row.recurrence_count ?? 1) > 2 ? "high" : "medium",
      owner_id: row.owner_id,
      created_by: context.userId,
      source_escalation_id: data.id,
      d0_rationale: `Escalated from Daily Management (SQDP) — board "${boardName}", ${String(row.category)} category. Recurrence count: ${row.recurrence_count ?? 1}.`,
      d2_what: row.concern,
      d2_when: row.occurred_on,
      d2_where: boardName,
      d3_containment: row.countermeasure ?? null,
      d4_cause_occurrence: row.cause ?? null,
    }).select("id").single();
    if (e2) throw new Error(e2.message);

    const { error: e3 } = await (context.supabase.from("dm_escalations") as any)
      .update({ escalated: true }).eq("id", data.id);
    if (e3) throw new Error(e3.message);
    return { ok: true, eightDId: rep.id as string, existing: false };
  });



// ----- Daily Management: leading friction metrics -----
export const listDmFriction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string; includeArchived?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    let defsQ = context.supabase.from("dm_metric_defs").select("*").eq("company_id", companyId).order("sort_order");
    if (!data.includeArchived) defsQ = defsQ.is("archived_at", null);
    const [defs, values] = await Promise.all([
      defsQ,
      context.supabase.from("dm_metric_values").select("*").eq("company_id", companyId)
        .gte("value_date", data.from).lte("value_date", data.to).order("value_date"),
    ]);
    if (defs.error) throw new Error(defs.error.message);
    if (values.error) throw new Error(values.error.message);
    return { defs: defs.data ?? [], values: values.data ?? [] };
  });

const slugKey = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "metric";

export const createDmMetricDef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    boardId: string; label: string; unit?: string;
    direction?: "higher_better" | "lower_better";
    target?: number | null; redTrigger?: number | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("dm_metric_defs").select("key,sort_order").eq("board_id", data.boardId);
    const taken = new Set((existing ?? []).map((r: { key: string }) => r.key));
    let key = slugKey(data.label);
    let i = 2;
    while (taken.has(key)) key = `${slugKey(data.label)}_${i++}`;
    const maxSort = Math.max(-1, ...(existing ?? []).map((r: { sort_order: number }) => r.sort_order ?? 0));

    const { error } = await (context.supabase.from("dm_metric_defs") as any).insert({
      board_id: data.boardId,
      key,
      label: data.label,
      unit: data.unit ?? "%",
      direction: data.direction ?? "higher_better",
      target: data.target ?? null,
      red_trigger: data.redTrigger ?? null,
      sort_order: maxSort + 1,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertDmMetricDef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string; target?: number | null; redTrigger?: number | null; active?: boolean;
    label?: string; unit?: string; direction?: "higher_better" | "lower_better"; archived?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.target !== undefined) patch.target = data.target;
    if (data.redTrigger !== undefined) patch.red_trigger = data.redTrigger;
    if (data.active !== undefined) patch.active = data.active;
    if (data.label !== undefined) patch.label = data.label;
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.direction !== undefined) patch.direction = data.direction;
    if (data.archived !== undefined) patch.archived_at = data.archived ? new Date().toISOString() : null;
    const { error } = await (context.supabase.from("dm_metric_defs") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDmMetricDef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dm_metric_defs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertDmMetricValue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { metricDefId: string; boardId: string; valueDate: string; value?: number | null; planValue?: number | null; note?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("dm_metric_values").select("id,value,plan_value")
      .eq("metric_def_id", data.metricDefId).eq("value_date", data.valueDate).maybeSingle();

    const nextValue = data.value !== undefined ? data.value : ((existing as any)?.value ?? null);
    const nextPlan = data.planValue !== undefined ? data.planValue : ((existing as any)?.plan_value ?? null);

    if (nextValue === null && nextPlan === null) {
      if (!existing) return { ok: true };
      const { error } = await context.supabase.from("dm_metric_values").delete()
        .eq("metric_def_id", data.metricDefId).eq("value_date", data.valueDate);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { data: companyId } = await context.supabase.rpc("current_company_id");
    const { error } = await (context.supabase.from("dm_metric_values") as any).upsert({
      metric_def_id: data.metricDefId, board_id: data.boardId, value_date: data.valueDate,
      value: nextValue, plan_value: nextPlan,
      note: data.note ?? null, created_by: context.userId,
      ...(companyId ? { company_id: companyId } : {}),
    }, { onConflict: "metric_def_id,value_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Daily Management: red-day reason codes -----
export type DmReasonCode = {
  id: string; label: string; category_key: string | null;
  color: string; sort_order: number; archived_at: string | null;
};

export const listDmReasonCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { includeArchived?: boolean } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    let q = context.supabase.from("dm_reason_codes").select("*").eq("company_id", companyId).order("sort_order");
    if (!data.includeArchived) q = q.is("archived_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as DmReasonCode[];
  });

export const createDmReasonCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { label: string; categoryKey?: string | null; color?: string }) => d)
  .handler(async ({ data, context }) => {
    const label = data.label.trim();
    if (!label) throw new Error("Label required");
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("dm_reason_codes").select("sort_order").eq("company_id", companyId);
    const sort = Math.max(-1, ...(existing ?? []).map((r: any) => Number(r.sort_order) || 0)) + 1;
    const { data: row, error } = await (context.supabase.from("dm_reason_codes") as any).insert({
      company_id: companyId, label, category_key: data.categoryKey ?? null,
      color: data.color ?? "text-slate-600", sort_order: sort,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return row as DmReasonCode;
  });

export const updateDmReasonCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; label?: string; categoryKey?: string | null; color?: string; sortOrder?: number; archived?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.label != null) patch.label = data.label.trim();
    if (data.categoryKey !== undefined) patch.category_key = data.categoryKey;
    if (data.color != null) patch.color = data.color;
    if (data.sortOrder != null) patch.sort_order = data.sortOrder;
    if (data.archived != null) patch.archived_at = data.archived ? new Date().toISOString() : null;
    const { error } = await (context.supabase.from("dm_reason_codes") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDmReasonCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dm_reason_codes").delete().eq("id", data.id);
    if (error?.message.includes("TitanScale Template is read-only")) return { ok: false, error: error.message };
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Daily Management: Gemba coaching walks -----
export const listDmGembaWalks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("dm_gemba_walks")
      .select("*, dm_gemba_items(*)")
      .eq("company_id", companyId)
      .order("walked_on", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveDmGembaWalk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    boardId: string; walkedOn: string; notes?: string | null;
    items: { escalationId?: string | null; metricDefId?: string | null; label?: string | null; depthScore?: number | null; objectiveId?: string | null; note?: string | null }[];
  }) => d)
  .handler(async ({ data, context }) => {
    const scored = data.items.map(i => i.depthScore).filter((v): v is number => typeof v === "number");
    const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
    const companyId = await activeCompanyId(context.supabase, context.userId);

    const { data: walk, error } = await (context.supabase.from("dm_gemba_walks") as any).insert({
      company_id: companyId,
      board_id: data.boardId, walked_on: data.walkedOn, leader_id: context.userId,
      notes: data.notes ?? null, avg_depth: avg,
    }).select("id, company_id").single();
    if (error) throw new Error(error.message);

    if (data.items.length) {
      const rows = data.items.map((i, idx) => ({
        walk_id: walk.id,
        company_id: walk.company_id,
        escalation_id: i.escalationId ?? null,
        metric_def_id: i.metricDefId ?? null,
        label: i.label ?? null,
        depth_score: i.depthScore ?? null,
        objective_id: i.objectiveId ?? null,
        note: i.note ?? null,
        sort_order: idx,
      }));
      const { error: e2 } = await (context.supabase.from("dm_gemba_items") as any).insert(rows);
      if (e2) throw new Error(e2.message);
    }
    return { ok: true, id: walk.id as string, avgDepth: avg };
  });

export const deleteDmGembaWalk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dm_gemba_walks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listStrategicObjectivesLite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("strategic_objectives").select("id,title").is("archived_at", null).order("title");
    if (error) throw new Error(error.message);
    return (data ?? []) as { id: string; title: string }[];
  });



// ----- Weekly Meeting -----
export const getMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { weekStart: string }) => z.object({ weekStart: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: row, error } = await context.supabase.from("meeting_notes").select("*")
      .eq("company_id", companyId).eq("week_start", data.weekStart).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertMeetingNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { weekStart: string; attendees?: string[]; sectionNotes?: Record<string, string>; healthSnapshot?: Record<string, string> }) =>
    z.object({
      weekStart: z.string(),
      attendees: z.array(z.string()).optional(),
      sectionNotes: z.record(z.string(), z.string()).optional(),
      healthSnapshot: z.record(z.string(), z.string()).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const patch = {
      company_id: companyId,
      week_start: data.weekStart,
      attendees: data.attendees ?? [],
      section_notes: (data.sectionNotes ?? {}) as unknown as never,
      health_snapshot: (data.healthSnapshot ?? {}) as unknown as never,
      created_by: context.userId,
    };
    const { data: row, error } = await context.supabase.from("meeting_notes").upsert(patch, { onConflict: "company_id,week_start" }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listRecentMeetings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data, error } = await context.supabase.from("meeting_notes")
      .select("week_start,health_snapshot,attendees,updated_at").eq("company_id", companyId).order("week_start", { ascending: false }).limit(8);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ----- Reviews -----
export const listReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("reviews").select("*").order("scheduled_for", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; scheduledFor?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("reviews").insert({
      title: data.title, scheduled_for: data.scheduledFor ?? new Date().toISOString().slice(0, 10),
      created_by: context.userId,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

// ----- Daily Management: per-category plan vs actual -----
export type DmCategoryTarget = {
  id: string; board_id: string; category_key: string; value_date: string;
  plan_value: number | null; actual_value: number | null;
};

export const listDmCategoryTargets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("dm_category_targets")
      .select("id,board_id,category_key,value_date,plan_value,actual_value")
      .eq("company_id", companyId)
      .gte("value_date", data.from).lte("value_date", data.to);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as DmCategoryTarget[];
  });

export const upsertDmCategoryTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { boardId: string; categoryKey: string; valueDate: string; planValue?: number | null; actualValue?: number | null }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await activeCompanyId(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("dm_category_targets").select("id,plan_value,actual_value")
      .eq("company_id", companyId).eq("board_id", data.boardId)
      .eq("category_key", data.categoryKey).eq("value_date", data.valueDate).maybeSingle();

    const nextPlan = data.planValue !== undefined ? data.planValue : ((existing as any)?.plan_value ?? null);
    const nextActual = data.actualValue !== undefined ? data.actualValue : ((existing as any)?.actual_value ?? null);

    if (nextPlan === null && nextActual === null) {
      if (!existing) return { ok: true };
      const { error } = await context.supabase.from("dm_category_targets").delete().eq("id", (existing as any).id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { error } = await (context.supabase.from("dm_category_targets") as any).upsert({
      company_id: companyId,
      board_id: data.boardId,
      category_key: data.categoryKey,
      value_date: data.valueDate,
      plan_value: nextPlan,
      actual_value: nextActual,
    }, { onConflict: "board_id,category_key,value_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
