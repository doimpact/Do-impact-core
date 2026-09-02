// DO.Impact Core (open-source edition) — local-mode middleware.
// The hosted product verifies a Supabase bearer token here; the open-source
// edition is single-user, so every server function runs as the fixed local
// identity against the local database.
import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { LOCAL_USER_ID } from "@/lib/local-user";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL / key env vars (see .env.example).");
  }
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return next({
    context: {
      supabase,
      userId: LOCAL_USER_ID,
      claims: { sub: LOCAL_USER_ID },
    },
  });
});
