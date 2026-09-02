import { createFileRoute } from "@tanstack/react-router";
import { VocPanel } from "@/components/commercial/voc-panel";

export const Route = createFileRoute("/_authenticated/commercial/voc")({
  head: () => ({
    meta: [
      { title: "Voice of Customer — DO.Impact" },
      { name: "description", content: "Capture what works well and what to improve from customer conversations, with dashboard tiles for NPS, themes, and open follow-ups." },
      { property: "og:title", content: "Voice of Customer — DO.Impact" },
      { property: "og:description", content: "Structured VoC dashboard: works well, can be improved, NPS trend, top themes, recent interactions, and open follow-ups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VocRoute,
});

function VocRoute() {
  return <VocPanel />;
}
