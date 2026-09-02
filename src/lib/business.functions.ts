import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const saveSettingsSchema = z.object({
  entity_name: z.string().min(1).max(200).optional(),
  legal_address: z.string().max(1000).optional(),
  support_email: z.string().email().max(320).optional(),
  business_currency: z.string().min(3).max(3).optional(),
  cost_baseline_monthly: z.number().min(0).max(999999999).optional(),
});

/** Full financial snapshot for the LLC owner. */
export const getBusinessSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Verify super admin.
    const { data: isSuper } = await supabase.rpc("is_super_admin", { _user: userId });
    if (!isSuper) throw new Error("Forbidden");

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [{ data: entitlements }, { data: members }, { data: aiAgg }] = await Promise.all([
      supabase.from("company_entitlements").select("*"),
      supabase.from("company_members").select("company_id, user_id"),
      supabase
        .from("ai_usage_events")
        .select("credits")
        .gte("created_at", startOfMonth.toISOString()),
    ]);

    const seatCounts = new Map<string, number>();
    for (const m of members ?? []) {
      seatCounts.set(m.company_id, (seatCounts.get(m.company_id) ?? 0) + 1);
    }

    const rows = (entitlements ?? []).map((e) => {
      const billingPeriod = (e as { billing_period?: string | null }).billing_period ?? "monthly";
      const planPrice = Number((e as { plan_price?: number | null }).plan_price ?? 0);
      const addonsPrice = Number((e as { addons_price?: number | null }).addons_price ?? 0);
      const total = planPrice + addonsPrice;
      const mrr = billingPeriod === "annual" ? total / 12 : total;
      const arr = billingPeriod === "annual" ? total : total * 12;
      return {
        company_id: (e as { company_id: string }).company_id,
        company_name: (e as { company_name: string }).company_name,
        plan_key: (e as { plan_key?: string | null }).plan_key ?? "free",
        status: (e as { status?: string }).status ?? "inactive",
        billing_period: billingPeriod,
        currency: (e as { currency?: string | null }).currency ?? "EUR",
        seats: (e as { seats?: number | null }).seats ?? 0,
        seats_used: (e as { seats_used?: number }).seats_used ?? 0,
        actual_seats: seatCounts.get((e as { company_id: string }).company_id) ?? 0,
        plan_price: planPrice,
        addons_price: addonsPrice,
        total,
        mrr,
        arr,
      };
    });

    const totalMrr = rows.reduce((sum, r) => sum + r.mrr, 0);
    const totalArr = rows.reduce((sum, r) => sum + r.arr, 0);
    const totalAiCredits = (aiAgg ?? []).reduce((sum, e) => sum + Number((e as { credits?: number }).credits ?? 0), 0);
    const activeCompanies = rows.filter((r) => r.status === "active").length;
    const trialingCompanies = rows.filter((r) => r.status === "trialing").length;

    return {
      rows,
      totals: {
        mrr: totalMrr,
        arr: totalArr,
        aiCredits: totalAiCredits,
        activeCompanies,
        trialingCompanies,
        totalCompanies: rows.length,
        totalSeats: rows.reduce((sum, r) => sum + r.actual_seats, 0),
      },
    };
  });

export const getBusinessSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: isSuper } = await supabase.rpc("is_super_admin", { _user: userId });
    if (!isSuper) throw new Error("Forbidden");

    const { data, error } = await supabase.from("business_settings").select("*").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? {
      id: null,
      entity_name: "doimpact.llc",
      legal_address: null,
      support_email: "hello@example.com",
      business_currency: "EUR",
      cost_baseline_monthly: 0,
    }) as unknown as {
      id: string | null;
      entity_name: string;
      legal_address: string | null;
      support_email: string;
      business_currency: string;
      cost_baseline_monthly: number;
    };
  });

export const saveBusinessSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => saveSettingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isSuper } = await supabase.rpc("is_super_admin", { _user: userId });
    if (!isSuper) throw new Error("Forbidden");

    const { data: existing } = await supabase.from("business_settings").select("id").limit(1).maybeSingle();

    const payload = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase.from("business_settings").update(payload).eq("id", (existing as { id: string }).id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("business_settings").insert({ ...payload, created_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });
