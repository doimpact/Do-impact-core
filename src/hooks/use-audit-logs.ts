import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/audit-logs.functions";

export function useAuditLogs(
  filters: {
    companyId?: string | null;
    action?: string | null;
    resourceType?: string | null;
    limit?: number;
    offset?: number;
  },
  enabled = true,
) {
  const fetch = useServerFn(listAuditLogs);
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => fetch({ data: filters }),
    enabled,
  });
}
