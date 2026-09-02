import { createFileRoute } from "@tanstack/react-router";
import { FloorView } from "@/components/floor/floor-view";

export const Route = createFileRoute("/_authenticated/floor")({
  head: () => ({
    meta: [
      { title: "Floor View — track barriers & downtime | DO.Impact" },
      { name: "description", content: "A shop-floor screen for one team: log the day, name what blocked you, ask for help and run the hour-by-hour SIC shift." },
      { property: "og:title", content: "Floor View — track barriers & downtime | DO.Impact" },
      { property: "og:description", content: "One team, one screen: today's board, downtime causes and the current SIC shift." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FloorPage,
});

function FloorPage() {
  return <FloorView />;
}
