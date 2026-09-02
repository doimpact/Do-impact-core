import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RegisterTable } from "./register-table";
import { useBidReviewItems, useBidReviews } from "./use-bid-reviews";

export function RegistersTab() {
  const { data: items } = useBidReviewItems(undefined, true);
  const { data: reviews } = useBidReviews(true);

  const nameOf = useMemo(() => {
    const map = new Map((reviews ?? []).map((r) => [r.id, r.reference ? `${r.reference} · ${r.title}` : r.title]));
    return (id: string) => map.get(id) ?? "";
  }, [reviews]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Every requirement, exception and risk across all bid reviews in one place. Add new entries inside the review
        they belong to.
      </p>
      <Tabs defaultValue="assumption_exception">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="requirement">Requirements matrix</TabsTrigger>
          <TabsTrigger value="assumption_exception">Assumptions & exceptions</TabsTrigger>
          <TabsTrigger value="risk">Contract risks</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="requirement" className="mt-4">
          <RegisterTable kind="requirement" items={items ?? []} showReview={nameOf} />
        </TabsContent>
        <TabsContent value="assumption_exception" className="mt-4">
          <RegisterTable kind="assumption_exception" items={items ?? []} showReview={nameOf} />
        </TabsContent>
        <TabsContent value="risk" className="mt-4">
          <RegisterTable kind="risk" items={items ?? []} showReview={nameOf} />
        </TabsContent>
        <TabsContent value="ongoing" className="mt-4">
          <RegisterTable kind="ongoing" items={items ?? []} showReview={nameOf} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
