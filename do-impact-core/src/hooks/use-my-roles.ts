import { getCurrentUser } from "@/lib/auth-session";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: userData } = await getCurrentUser();
      if (!userData.user) return [] as string[];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as string);
    },
  });
}

export function canEditStrategy(_roles: string[]) {
  // All authenticated users can edit strategy content in this workspace.
  return true;
}
