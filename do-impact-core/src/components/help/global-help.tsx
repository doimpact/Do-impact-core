import { getCurrentUser } from "@/lib/auth-session";
"use client";

import * as React from "react";
import { TourProvider, type TourState, DEFAULT_TOUR_STATE } from "./tour-context";
import { TourSpotlight } from "./tour-spotlight";
import { FloatingHelpButton } from "./floating-help-button";
import { HelpSearch } from "./help-search";

import { useUserPreferences } from "@/hooks/use-user-preferences";
import { supabase } from "@/integrations/supabase/client";

export function GlobalHelp({ children }: { children: React.ReactNode }) {
  const { prefs, setField } = useUserPreferences();
  const [uid, setUid] = React.useState<string | null>(null);

  React.useEffect(() => {
    getCurrentUser().then(({ data }) => {
      setUid(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUid(event === "SIGNED_OUT" ? null : session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const state = React.useMemo<TourState>(() => {
    const raw = prefs?.tour_state;
    if (!raw) return DEFAULT_TOUR_STATE;
    return {
      completed: Array.isArray(raw.completed) ? raw.completed.map(String) : [],
      dismissed: Array.isArray(raw.dismissed) ? raw.dismissed.map(String) : [],
      lastSeenAt: raw.lastSeenAt && typeof raw.lastSeenAt === "object" ? Object.fromEntries(
        Object.entries(raw.lastSeenAt as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
      ) : {},
    };
  }, [prefs?.tour_state]);

  const handleChange = React.useCallback(
    (next: TourState) => {
      if (!uid) return;
      setField({ tour_state: next });
    },
    [uid, setField],
  );

  return (
    <TourProvider state={state} onChange={handleChange}>
      {children}
      <TourSpotlight />
      <HelpSearch />
      <FloatingHelpButton />

    </TourProvider>
  );
}
