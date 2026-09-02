import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MAP_PILLARS, type ModuleCounts, type ModuleSpec } from "@/lib/company-map";

export type MapData = Record<string, ModuleCounts & { leaves: string[] }>;

/** Minimal shape of the PostgREST builder we use — keeps the generic tables loose. */
type Q = {
  is: (c: string, v: null) => Q;
  eq: (c: string, v: boolean) => Q;
  in: (c: string, v: string[]) => Q;
  not: (c: string, op: string, v: string) => Q;
  lt: (c: string, v: string) => Q;
  limit: (n: number) => Q;
};

type CountResult = { count: number | null };
type RowsResult = { data: Record<string, unknown>[] | null };

function base(spec: ModuleSpec, select: string, head: boolean): Q {
  const client = supabase as unknown as {
    from: (t: string) => { select: (s: string, o: { count: "exact"; head?: boolean }) => Q };
  };
  let q = client.from(spec.table).select(select, head ? { count: "exact", head: true } : { count: "exact" });
  if (spec.archivedColumn) q = q.is(spec.archivedColumn, null);
  if (spec.archivedFlag) q = q.eq(spec.archivedFlag, false);
  return q;
}

function withAlert(spec: ModuleSpec, q: Q): Q {
  if (!spec.alert) return q;
  if (spec.alert.in) return q.in(spec.alert.column, spec.alert.in);
  if (spec.alert.notIn) return q.not(spec.alert.column, "in", `(${spec.alert.notIn.join(",")})`);
  return q;
}

async function loadModule(spec: ModuleSpec): Promise<ModuleCounts & { leaves: string[] }> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const totalQ = base(spec, "id", true) as unknown as Promise<CountResult>;
    const openQ = spec.alert
      ? (withAlert(spec, base(spec, "id", true)) as unknown as Promise<CountResult>)
      : Promise.resolve({ count: null } as CountResult);
    const overdueQ = spec.overdueColumn
      ? (withAlert(spec, base(spec, "id", true)).lt(spec.overdueColumn, today) as unknown as Promise<CountResult>)
      : Promise.resolve({ count: null } as CountResult);
    const leafQ = spec.titleColumn
      ? (withAlert(spec, base(spec, `id, ${spec.titleColumn}`, false)).limit(3) as unknown as Promise<RowsResult>)
      : Promise.resolve({ data: [] } as RowsResult);

    const [total, open, overdue, leaf] = await Promise.all([totalQ, openQ, overdueQ, leafQ]);
    const totalCount = total.count ?? 0;
    const key = spec.titleColumn ?? "id";

    return {
      total: totalCount,
      open: open.count ?? (spec.alert ? 0 : totalCount),
      overdue: overdue.count ?? 0,
      leaves: (leaf.data ?? [])
        .map((r) => String(r[key] ?? "").trim())
        .filter(Boolean)
        .slice(0, 3),
    };
  } catch {
    return { total: 0, open: 0, overdue: 0, leaves: [] };
  }
}

/** One pass over every module on the map, company-scoped through RLS. */
export function useCompanyMap(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-map", companyId ?? "none"],
    staleTime: 60_000,
    queryFn: async (): Promise<MapData> => {
      const specs = MAP_PILLARS.flatMap((p) => p.modules);
      const results = await Promise.all(specs.map((s) => loadModule(s)));
      const out: MapData = {};
      specs.forEach((s, i) => { out[s.id] = results[i]!; });
      return out;
    },
  });
}
