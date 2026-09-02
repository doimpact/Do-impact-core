/**
 * Session-only sandbox layer for the free tier.
 *
 * When sandbox mode is active every write goes into an in-memory overlay
 * instead of the database, and every read is merged with that overlay so the
 * app *feels* fully interactive. Nothing is persisted: a page reload restores
 * the seeded demo workspace. The database itself stays authoritative — the
 * template tenant is protected by RLS and the `prevent_template_write`
 * trigger, so this layer is UX, never a security boundary.
 */
import { supabase } from "@/integrations/supabase/client";

type Row = Record<string, any>;

type TableStore = {
  inserted: Row[];
  patches: Map<string, Row>;
  deleted: Set<string>;
};

const store = new Map<string, TableStore>();
let active = false;
let installed = false;
/** The un-patched `from()` — reads must bypass the sandbox proxy. */
let realFrom: ((table: string) => any) | null = null;

function tableStore(table: string): TableStore {
  let s = store.get(table);
  if (!s) {
    s = { inserted: [], patches: new Map(), deleted: new Set() };
    store.set(table, s);
  }
  return s;
}

export function isSandboxActive() {
  return active;
}

export function setSandboxActive(next: boolean) {
  active = next;
  if (next) installSandbox();
}

export function resetSandboxData() {
  store.clear();
}

const MUTATIONS = new Set(["insert", "update", "upsert", "delete"]);

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `sbx-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}

/** Reads the `eq` filters recorded on a chain, used to scope overlay rows. */
function eqFilters(calls: Array<[string, any[]]>) {
  return calls.filter(([m]) => m === "eq").map(([, args]) => [args[0], args[1]] as const);
}

function matchesFilters(row: Row, filters: ReadonlyArray<readonly [string, any]>) {
  return filters.every(([col, val]) => row[col] === val || String(row[col]) === String(val));
}

function simulateMutation(table: string, calls: Array<[string, any[]]>) {
  const s = tableStore(table);
  const op = calls.find(([m]) => MUTATIONS.has(m))!;
  const [kind, args] = op;
  const filters = eqFilters(calls);
  const now = new Date().toISOString();

  if (kind === "insert" || kind === "upsert") {
    const values: Row[] = Array.isArray(args[0]) ? args[0] : [args[0]];
    const rows = values.map((v) => ({
      id: v?.id ?? newId(),
      created_at: now,
      updated_at: now,
      ...v,
      __sandbox: true,
    }));
    s.inserted.push(...rows);
    return rows;
  }

  if (kind === "update") {
    const patch = { ...(args[0] as Row), updated_at: now };
    const targetId = filters.find(([c]) => c === "id")?.[1];
    if (targetId) {
      const local = s.inserted.find((r) => r.id === targetId);
      if (local) Object.assign(local, patch);
      else s.patches.set(String(targetId), { ...(s.patches.get(String(targetId)) ?? {}), ...patch });
      return [{ id: targetId, ...patch }];
    }
    // Filtered bulk update: apply to any overlay rows we know about.
    s.inserted.filter((r) => matchesFilters(r, filters)).forEach((r) => Object.assign(r, patch));
    return [];
  }

  // delete
  const targetId = filters.find(([c]) => c === "id")?.[1];
  if (targetId) {
    const idx = s.inserted.findIndex((r) => r.id === targetId);
    if (idx >= 0) s.inserted.splice(idx, 1);
    else s.deleted.add(String(targetId));
    return [{ id: targetId }];
  }
  s.inserted = s.inserted.filter((r) => !matchesFilters(r, filters));
  return [];
}

function mergeRead(table: string, data: any, calls: Array<[string, any[]]>) {
  const s = store.get(table);
  if (!s) return data;
  const filters = eqFilters(calls);

  const applyRow = (row: Row | null) => {
    if (!row) return row;
    if (row.id && s.deleted.has(String(row.id))) return null;
    const patch = row.id ? s.patches.get(String(row.id)) : undefined;
    return patch ? { ...row, ...patch } : row;
  };

  if (Array.isArray(data)) {
    const merged = data.map(applyRow).filter(Boolean) as Row[];
    const extra = s.inserted.filter((r) => matchesFilters(r, filters));
    const known = new Set(merged.map((r) => String(r.id)));
    return [...merged, ...extra.filter((r) => !known.has(String(r.id)))];
  }
  if (data && typeof data === "object") return applyRow(data as Row);
  return data;
}

/** Chain recorder — replays reads against the real client, fakes writes. */
function sandboxFrom(table: string) {
  const calls: Array<[string, any[]]> = [];
  let terminal: "single" | "maybeSingle" | null = null;

  const run = async () => {
    const isMutation = calls.some(([m]) => MUTATIONS.has(m));
    if (isMutation) {
      const rows = simulateMutation(table, calls);
      const wantsSelect = calls.some(([m]) => m === "select");
      if (terminal) return { data: wantsSelect ? (rows[0] ?? null) : null, error: null, count: rows.length };
      return { data: wantsSelect ? rows : null, error: null, count: rows.length };
    }
    // Read: replay the chain against the real client, then merge the overlay.
    let builder: any = realFrom ? realFrom(table) : (supabase as any).from(table);
    for (const [method, args] of calls) builder = builder[method](...args);
    if (terminal) builder = builder[terminal]();
    const res = await builder;
    if (res.error) return res;
    return { ...res, data: mergeRead(table, res.data, calls) };
  };

  const chain: any = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") {
          return (resolve: any, reject: any) => run().then(resolve, reject);
        }
        if (prop === "single" || prop === "maybeSingle") {
          return () => {
            terminal = prop;
            return chain;
          };
        }
        if (prop === "abortSignal" || prop === "throwOnError") return () => chain;
        return (...args: any[]) => {
          calls.push([prop, args]);
          return chain;
        };
      },
    },
  );
  return chain;
}

/** RPCs that only read are allowed through; everything else is a no-op. */
const READ_ONLY_RPCS = new Set([
  "ai_limit_for",
  "ai_usage_this_month",
  "can_create_company",
  "company_seats_used",
  "company_subscription_status",
  "current_company_id",
  "has_addon",
  "has_module_access",
  "has_role",
  "has_write_access",
  "is_company_admin",
  "is_company_member",
  "is_super_admin",
  "my_access_level",
  "roadmap_workstream_id",
]);

/**
 * Patches the shared Supabase client once. When sandbox mode is off every
 * call goes straight through to the real implementation.
 */
function installSandbox() {
  if (installed) return;
  installed = true;
  const client = supabase as any;
  realFrom = client.from.bind(client);
  const realRpc = client.rpc.bind(client);

  client.from = (table: string) => (active ? sandboxFrom(table) : realFrom!(table));
  client.rpc = (fn: string, args?: any, opts?: any) => {
    if (active && !READ_ONLY_RPCS.has(fn)) {
      const noop: any = new Proxy(
        {},
        {
          get(_t, prop: string) {
            if (prop === "then") return (res: any) => Promise.resolve({ data: null, error: null }).then(res);
            return () => noop;
          },
        },
      );
      return noop;
    }
    return realRpc(fn, args, opts);
  };
}
