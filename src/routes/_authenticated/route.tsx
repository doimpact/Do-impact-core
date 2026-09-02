import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

// DO.Impact Core (open-source edition) — no login gate; local single-user mode.
export const Route = createFileRoute("/_authenticated")({
  head: () => ({ meta: [{ title: "Workspace — DO.Impact Core" }, { name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
