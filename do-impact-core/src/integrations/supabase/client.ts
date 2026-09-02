// DO.Impact Core (open-source edition) — local Supabase client.
//
// There is no login in this edition: `supabase.auth` is shimmed so that every
// call resolves to one fixed local identity. All data access goes through the
// local Supabase instance configured in .env, where RLS is disabled.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { LOCAL_USER, LOCAL_USER_ID } from "@/lib/local-user";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    "[DO.Impact Core] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill in your local Supabase credentials.",
  );
}

const client = createClient<Database>(SUPABASE_URL ?? "http://localhost:54321", SUPABASE_KEY ?? "missing-key", {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

// --- Single-user auth shim -------------------------------------------------
const fakeUser = { ...LOCAL_USER } as never;
const noopSubscription = { subscription: { unsubscribe: () => {} } };

client.auth.getUser = (async () => ({ data: { user: fakeUser }, error: null })) as never;
client.auth.getSession = (async () => ({
  data: { session: null },
  error: null,
})) as never;
client.auth.onAuthStateChange = ((() => ({ data: noopSubscription })) as never);
client.auth.signOut = (async () => ({ error: null })) as never;

export const supabase = client;
export const CURRENT_USER_ID = LOCAL_USER_ID;
