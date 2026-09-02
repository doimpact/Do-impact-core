// DO.Impact Core (open-source edition) — single local user with full access
// to every module in the active workspace.
import { useCallback } from "react";
import { LOCAL_USER_ID } from "@/lib/local-user";
import { useActiveCompany } from "@/hooks/use-companies";

export type AccessLevel = "read" | "write" | "admin";

export type MyAccess = {
  userId: string | null;
  isSuperAdmin: boolean;
  companyId: string | null;
  level: AccessLevel | null;
  allowedModules: string[] | null; // null = all modules
};

export function useMyAccess() {
  const activeQ = useActiveCompany();
  const companyId = activeQ.data?.company_id ?? null;

  const hasModule = useCallback((_key: string) => true, []);

  return {
    userId: LOCAL_USER_ID,
    isSuperAdmin: true,
    companyId,
    level: "admin" as AccessLevel,
    allowedModules: null,
    isLoading: activeQ.isLoading,
    hasModule,
    canWrite: true,
    isReadOnly: false,
    isCompanyAdmin: true,
  };
}
