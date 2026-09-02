/**
 * A failed dynamic import (stale or evicted bundle chunk) leaves navigation dead:
 * clicks appear to do nothing. Reload the page once to pick up a fresh bundle.
 * The one-shot flag lives in sessionStorage so this can never loop.
 */
const FLAG = "do-impact:chunk-reload";

function isChunkError(message: string): boolean {
  return /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|ChunkLoadError/i.test(
    message,
  );
}

function handle(message: string) {
  if (!isChunkError(message)) return;
  try {
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, "1");
  } catch {
    return;
  }
  window.location.reload();
}

export function installChunkReload() {
  if (typeof window === "undefined") return () => {};

  const onRejection = (e: PromiseRejectionEvent) => {
    const reason = e.reason;
    handle(reason instanceof Error ? reason.message : String(reason ?? ""));
  };
  const onError = (e: ErrorEvent) => handle(e.message ?? "");

  window.addEventListener("unhandledrejection", onRejection);
  window.addEventListener("error", onError);
  return () => {
    window.removeEventListener("unhandledrejection", onRejection);
    window.removeEventListener("error", onError);
  };
}

/** Clear the one-shot guard once the app has rendered successfully. */
export function clearChunkReloadFlag() {
  try {
    sessionStorage.removeItem(FLAG);
  } catch {
    /* storage unavailable */
  }
}
