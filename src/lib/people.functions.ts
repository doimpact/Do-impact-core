import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { assertWrote } from "@/lib/write-guard";


// Skills catalog
export const listSkillCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [cats, skills, levels] = await Promise.all([
      context.supabase.from("skill_categories").select("*").order("sort_order"),
      context.supabase.from("skills").select("*").order("name"),
      context.supabase.from("proficiency_levels").select("*").order("level"),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (skills.error) throw new Error(skills.error.message);
    if (levels.error) throw new Error(levels.error.message);
    return { categories: cats.data ?? [], skills: skills.data ?? [], levels: levels.data ?? [] };
  });

export const upsertSkillCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; sortOrder?: number }) => d)
  .handler(async ({ data, context }) => {
    const row = { name: data.name, sort_order: data.sortOrder ?? 0 };
    if (data.id) {
      const { error } = await context.supabase.from("skill_categories").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("skill_categories").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; categoryId?: string | null; name: string; description?: string | null; isCertification?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const row = {
      category_id: data.categoryId ?? null, name: data.name,
      description: data.description ?? null, is_certification: data.isCertification ?? false,
    };
    if (data.id) {
      const { error } = await context.supabase.from("skills").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("skills").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("skills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; archived: boolean }) => z.object({ id: z.string().uuid(), archived: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("skills")
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    assertWrote(rows, data.archived ? "archive" : "restore");
    return { ok: true };
  });


// Employees
export const listEmployees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("employees")
      .select("*,job_roles(id,name,department),employee_skills(id,skill_id,level)")
      .order("last_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; employeeNo?: string | null; firstName: string; lastName: string; email?: string | null; roleId?: string | null; department?: string | null; status?: string }) => d)
  .handler(async ({ data, context }) => {
    const row = {
      employee_no: data.employeeNo ?? null, first_name: data.firstName, last_name: data.lastName,
      email: data.email ?? null, role_id: data.roleId ?? null, department: data.department ?? null,
      status: data.status ?? "active",
    };
    if (data.id) {
      const { error } = await context.supabase.from("employees").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("employees").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("employees").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; archived: boolean }) => z.object({ id: z.string().uuid(), archived: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("employees")
      .update({ archived_at: data.archived ? new Date().toISOString() : null })
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    assertWrote(rows, data.archived ? "archive" : "restore");
    return { ok: true };
  });


// Roles + requirements
export const listRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [roles, reqs] = await Promise.all([
      context.supabase.from("job_roles").select("*").order("name"),
      context.supabase.from("role_requirements").select("*"),
    ]);
    if (roles.error) throw new Error(roles.error.message);
    if (reqs.error) throw new Error(reqs.error.message);
    return { roles: roles.data ?? [], requirements: reqs.data ?? [] };
  });

export const upsertRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; department?: string | null; description?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const row = { name: data.name, department: data.department ?? null, description: data.description ?? null };
    if (data.id) {
      const { error } = await context.supabase.from("job_roles").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("job_roles").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setRoleRequirement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleId: string; skillId: string; requiredLevel: number | null }) => d)
  .handler(async ({ data, context }) => {
    if (data.requiredLevel === null) {
      const { error } = await context.supabase.from("role_requirements")
        .delete().eq("role_id", data.roleId).eq("skill_id", data.skillId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("role_requirements")
      .upsert({ role_id: data.roleId, skill_id: data.skillId, required_level: data.requiredLevel },
        { onConflict: "role_id,skill_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Employee skill assessments
export const setEmployeeSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { employeeId: string; skillId: string; level: number | null; notes?: string | null }) =>
    z.object({ employeeId: z.string().uuid(), skillId: z.string().uuid(), level: z.number().int().min(0).max(4).nullable(), notes: z.string().optional().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.level === null) {
      const { error } = await context.supabase.from("employee_skills")
        .delete().eq("employee_id", data.employeeId).eq("skill_id", data.skillId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("employee_skills").upsert({
      employee_id: data.employeeId, skill_id: data.skillId, level: data.level,
      assessed_on: new Date().toISOString().slice(0, 10), notes: data.notes ?? null,
    }, { onConflict: "employee_id,skill_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Development plans
export const listDevelopmentPlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("development_plans")
      .select("*,employees(id,first_name,last_name),skills(id,name),training_actions(id,name,action_type)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertDevelopmentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; employeeId: string; skillId: string; currentLevel: number; targetLevel: number; actionId?: string | null; targetDate?: string | null; status?: string; notes?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const row = {
      employee_id: data.employeeId, skill_id: data.skillId,
      current_level: data.currentLevel, target_level: data.targetLevel,
      action_id: data.actionId ?? null, target_date: data.targetDate ?? null,
      status: data.status ?? "open", notes: data.notes ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("development_plans").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("development_plans").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDevelopmentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("development_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Training actions
export const listTrainingActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("training_actions").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
