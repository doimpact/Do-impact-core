import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/meeting/")({
  head: () => ({ meta: [{ title: "Meeting — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  // This route only forwards to /meeting/weekly. Redirecting from beforeLoad left a blank
  // screen on hard loads (the hop happened before the app mounted and the
  // client never rendered), so the hop is done from the component instead.
  component: () => <Navigate to="/meeting/weekly" replace />,
});
