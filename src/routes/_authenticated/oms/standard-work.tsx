import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/oms/standard-work")({
  head: () => ({ meta: [{ title: "Standard Work — DO.Impact" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <Navigate to="/oms/risk" replace={true} />,
});
