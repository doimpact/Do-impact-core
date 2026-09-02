import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Permanent (301) canonical host redirect: doimpact.app -> www.doimpact.app.
// Lovable's edge handles non-primary hosts with a 302 before this code runs,
// so this is a safety net for any request that does reach the app worker.
function canonicalHostRedirect(request: Request): Response | undefined {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return undefined;
  }
  if (url.hostname.toLowerCase() !== "doimpact.app") return undefined;
  url.hostname = "www.doimpact.app";
  return new Response(null, {
    status: 301,
    headers: { location: url.toString(), "cache-control": "public, max-age=3600" },
  });
}

// Paths whose only job is to forward to the real screen. The signed-in app is
// client-rendered, so a router-level redirect on a hard load raced the first
// mount and left a blank page. Doing the hop over HTTP avoids that entirely.
const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  "/oms/npi": "/oms/industrialization",
  "/admin": "/admin/people",
  "/meeting": "/meeting/weekly",
  "/actions/problem-solver/toolkit": "/actions/problem-solver",
};

function legacyPathRedirect(request: Request): Response | undefined {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return undefined;
  }
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const target = LEGACY_PATH_REDIRECTS[path];
  if (!target) return undefined;
  url.pathname = target;
  return new Response(null, { status: 302, headers: { location: url.toString() } });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const redirect = canonicalHostRedirect(request) ?? legacyPathRedirect(request);
      if (redirect) return redirect;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
