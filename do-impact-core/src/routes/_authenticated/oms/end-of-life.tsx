import { createFileRoute } from "@tanstack/react-router";
import { EolPanel } from "@/components/oms/eol/eol-panel";

export const Route = createFileRoute("/_authenticated/oms/end-of-life")({
  head: () => ({ meta: [
    { title: "End-of-Life (LCG 8) — Product Sunset Gates | DO.Impact" },
    { name: "description", content: "Run product end-of-life as a five-phase gate process: EOS strategy, last time buy, final time ship, asset disposition and customer migration." },
    { property: "og:title", content: "End-of-Life (LCG 8) — Product Sunset Gates | DO.Impact" },
    { property: "og:description", content: "Turn product sunset into value recovery: gate checklists, LTB modelling, tooling disposition, customer migration and EOL KPIs." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EndOfLifePage,
});

function EndOfLifePage() {
  return <EolPanel />;
}
