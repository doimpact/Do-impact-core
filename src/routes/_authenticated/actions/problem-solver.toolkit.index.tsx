import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/toolkit/")({
  head: () => ({ meta: [{ title: "Toolkit — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  // This route only forwards to /actions/problem-solver. Redirecting from beforeLoad left a blank
  // screen on hard loads (the hop happened before the app mounted and the
  // client never rendered), so the hop is done from the component instead.
  component: () => <Navigate to="/actions/problem-solver" replace />,
});
