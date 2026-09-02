import { createFileRoute } from "@tanstack/react-router";
import ChangeEngagement from "@/components/people/change-engagement";

export const Route = createFileRoute("/_authenticated/people/engagement")({
  head: () => ({
    meta: [
      { title: "Change & Engagement — DO.Impact" },
      {
        name: "description",
        content:
          "A tiered engagement architecture for manufacturing turnarounds: the change curve mismatch, board-to-frontline communication, the 7x7 rule and feedback loops.",
      },
      { property: "og:title", content: "Change & Engagement — DO.Impact" },
      {
        property: "og:description",
        content:
          "Board, executive, plant management and shop floor sit in different places on the same change curve. This guide shows how to engage each tier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EngagementPage,
});

function EngagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Change & Engagement</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          As you run the business through Strategy → Commercial → Operations → People, the hardest part is
          bringing people with you. This is the engagement framework that sits across all four pillars.
        </p>
      </div>
      <ChangeEngagement />
    </div>
  );
}
