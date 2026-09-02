import { supabase } from "@/integrations/supabase/client";

/**
 * The preview surface brokers the auth session to the editor over postMessage,
 * so a session written by sign-in is not always readable on the very next tick.
 * Wait briefly for a readable session before navigating into a guarded route —
 * otherwise the route guard runs first and bounces straight back to /auth.
 */
export async function waitForSession(timeoutMs = 4000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((r) => setTimeout(r, 200));
  }
}

/** Message shown when sign-in succeeded but the session could not be stored. */
export const SESSION_NOT_STORED =
  "You were signed in, but this browser could not store the session. Open the app in its own browser tab (not the embedded preview) and try again.";

// --- Shared current-user read ----------------------------------------------
// `supabase.auth.getUser()` is a live round-trip to the auth service. The app
// asks "who am I?" from the route guard and from most data hooks, which used to
// fire ~10 parallel /user requests per page load (slow first paint, and a real
// risk of auth rate limiting). Share one in-flight promise instead, and drop it
// whenever the session actually changes.

type UserResult = Awaited<ReturnType<typeof supabase.auth.getUser>>;

let cached: Promise<UserResult> | null = null;
let listening = false;

function listenOnce() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  supabase.auth.onAuthStateChange(() => {
    cached = null;
  });
}

/**
 * Cached equivalent of `supabase.auth.getUser()` — same return shape.
 * The cache is per browser tab and is cleared on every auth state change,
 * so it never serves a stale identity.
 */
export function getCurrentUser(): Promise<UserResult> {
  // Never cache on the server: a module-level cache would leak across requests.
  if (typeof window === "undefined") return supabase.auth.getUser();
  listenOnce();
  if (!cached) {
    cached = supabase.auth.getUser().then((res) => {
      // Do not cache transport failures — the next caller should retry.
      if (res.error) cached = null;
      return res;
    });
  }
  return cached;
}

/** Forget the cached identity (used after sign-out). */
export function clearCurrentUser() {
  cached = null;
}
