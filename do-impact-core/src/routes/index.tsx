import { createFileRoute, redirect } from "@tanstack/react-router";

// DO.Impact Core (open-source edition) — the workspace is the home page.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/overview" });
  },
});
