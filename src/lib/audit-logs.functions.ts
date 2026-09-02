import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const auditLogFilterSchema = z.object({
  companyId: z.string().optional().nullable(),
  action: z.string().optional().nullable(),
  resourceType: z.string().optional().nullable(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

const auditLogInsertSchema = z.object({
  companyId: z.string().optional().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional().nullable(),
  metadata: z.record(z.any()).default({}),
});

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => auditLogFilterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let query = supabase
      .from("audit_logs")
      .select("*, profiles:actor_id(display_name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(data.limit)
      .range(data.offset, data.offset + data.limit - 1);

    if (data.companyId) {
      query = query.eq("company_id", data.companyId);
    } else {
      // Default to the caller's active company so logs never mix tenants.
      const { data: active } = await supabase.rpc("current_company_id");
      if (active) query = query.eq("company_id", active as string);
    }
    if (data.action) {
      query = query.eq("action", data.action);
    }
    if (data.resourceType) {
      query = query.eq("resource_type", data.resourceType);
    }

    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0 };
  });

export const insertAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => auditLogInsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Resolve a company the user is actually a member of; RLS rejects anything else.
    let companyId: string | null = null;
    if (data.companyId && data.companyId !== "00000000-0000-0000-0000-000000000000") {
      const { data: member } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", userId)
        .eq("company_id", data.companyId)
        .maybeSingle();
      companyId = member?.company_id ?? null;
    }
    if (!companyId) {
      const { data: current } = await supabase.rpc("current_company_id");
      companyId = (current as string | null) ?? null;
    }
    if (!companyId) {
      const { data: memberships } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", userId)
        .limit(1);
      companyId = memberships?.[0]?.company_id ?? null;
    }
    // No workspace yet (e.g. first login) — nothing to audit against.
    if (!companyId) return null;

    const { data: inserted, error } = await supabase
      .from("audit_logs")
      .insert({
        company_id: companyId,
        actor_id: userId,
        action: data.action,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        metadata: data.metadata,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });
