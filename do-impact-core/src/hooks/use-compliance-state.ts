import { getCurrentUser } from "@/lib/auth-session";
import { useCallback, useEffect, useRef, useState } from "react";

export type ItemState = {
  checked: boolean;
  note?: string;
  checkedAt?: string;
  checkedBy?: string;
};
export type ComplianceState = Record<string, ItemState>;

const PREFIX = "doimpact.compliance.part145";

function storageKey(framework: string, uid: string) {
  // Keep the original key shape for part145 so existing local progress is preserved.
  return framework === "part145"
    ? `${PREFIX}.${uid}`
    : `doimpact.compliance.${framework}.${uid}`;
}

export function useComplianceState(framework = "part145") {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [state, setState] = useState<ComplianceState>({});
  const [ready, setReady] = useState(false);
  const keyRef = useRef<string>(storageKey(framework, "anon"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getCurrentUser();
      const uid = data.user?.id ?? "anon";
      const email = data.user?.email ?? null;
      const key = storageKey(framework, uid);
      keyRef.current = key;

      if (cancelled) return;
      setUserId(uid);
      setUserEmail(email);
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
        setState(raw ? (JSON.parse(raw) as ComplianceState) : {});
      } catch {
        setState({});
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [framework]);


  const persist = useCallback((next: ComplianceState) => {
    setState(next);
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const toggle = useCallback(
    (id: string, checked: boolean) => {
      const prev = state[id] ?? {};
      const next: ComplianceState = {
        ...state,
        [id]: {
          ...prev,
          checked,
          checkedAt: checked ? new Date().toISOString() : undefined,
          checkedBy: checked ? userEmail ?? undefined : undefined,
        },
      };
      persist(next);
    },
    [state, persist, userEmail],
  );

  const setNote = useCallback(
    (id: string, note: string) => {
      const prev = state[id] ?? { checked: false };
      persist({ ...state, [id]: { ...prev, note } });
    },
    [state, persist],
  );

  const reset = useCallback(() => persist({}), [persist]);
  const replace = useCallback((next: ComplianceState) => persist(next ?? {}), [persist]);

  return { state, ready, userId, userEmail, toggle, setNote, reset, replace };
}
