import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-companies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UNASSIGNED = "__unassigned";

export type LiteProfile = { id: string; display_name: string | null; email: string | null };

/**
 * People who can be assigned as owner: members of the ACTIVE company only.
 * RLS already scopes `profiles` for regular users, but platform admins can read
 * every profile — so the company scope is enforced here in the app too.
 */
export function useProfiles() {
  const { data: active } = useActiveCompany();
  const companyId = active?.company_id ?? null;
  const isTemplate = active?.companies?.is_template === true;
  return useQuery({
    queryKey: ["profiles-lite", companyId, isTemplate],
    enabled: !!companyId,
    queryFn: async () => {
      // Inside the read-only demo workspace never expose the real accounts that
      // happen to have access — only the fictional demo personas.
      if (isTemplate) {
        const { data: personaIds, error: pErr } = await supabase.rpc("demo_persona_ids");
        if (pErr) throw pErr;
        const ids = ((personaIds ?? []) as { id: string }[]).map((r) => r.id);
        if (ids.length === 0) return [] as LiteProfile[];
        const { data, error } = await supabase
          .from("profiles")
          .select("id,display_name")
          .in("id", ids)
          .order("display_name");
        if (error) throw error;
        return (data ?? []).map((p) => ({ ...p, email: null })) as LiteProfile[];
      }
      const { data: members, error: mErr } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", companyId!);
      if (mErr) throw mErr;
      const ids = Array.from(new Set((members ?? []).map((m) => m.user_id as string)));
      if (ids.length === 0) return [] as LiteProfile[];
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", ids)
        .order("display_name");
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, email: null })) as LiteProfile[];
    },

    staleTime: 60_000,
  });
}


/** Resolve a single profile that is no longer a member, so labels don't go blank. */
function useOrphanProfile(id: string | null, known: boolean) {
  return useQuery({
    queryKey: ["profile-lite-orphan", id],
    enabled: !!id && !known,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data ? { ...data, email: null } : null) as LiteProfile | null;
    },
  });
}


export function ownerLabel(p: { display_name: string | null; email?: string | null } | undefined) {
  if (!p) return "Unassigned";
  return p.display_name || "User";
}


export function OwnerSelect({
  value,
  onChange,
  placeholder = "Owner",
  allowUnassigned = true,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  allowUnassigned?: boolean;
}) {
  const { data: profiles = [] } = useProfiles();
  const known = !value || profiles.some((p) => p.id === value);
  const { data: orphan } = useOrphanProfile(value, known);

  return (
    <Select
      value={value ?? UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? null : v)}
    >
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {allowUnassigned && <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>}
        {profiles.map((p) => (
          <SelectItem key={p.id} value={p.id}>{ownerLabel(p)}</SelectItem>
        ))}
        {!known && value && (
          <SelectItem value={value} disabled>
            {ownerLabel(orphan ?? undefined)} — no access to this company
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
