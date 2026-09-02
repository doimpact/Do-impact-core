import type { ExecRoomThread } from "@/hooks/use-exec-room";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExecRoomLocked, ExecRoomReadOnly } from "@/components/exec-room/ExecRoomChat";
import {
  useCreateExecRoomThread,
  useExecRoomAddon,
  useExecRoomThreads,
} from "@/hooks/use-exec-room";

export const Route = createFileRoute("/_authenticated/report/team-room/")({
  component: TeamRoomIndex,
  head: () => ({
    meta: [
      { title: "Exec Team Room | DO.Impact" },
      {
        name: "description",
        content:
          "Convene an AI senior leadership team grounded in your live company data to run the business.",
      },
      { property: "og:title", content: "Exec Team Room | DO.Impact" },
      {
        property: "og:description",
        content: "An AI senior leadership team that reviews your live operating data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8 text-red-600">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function TeamRoomIndex() {
  const navigate = useNavigate();
  const { isActive, isLoading, isReadOnly, lockReason, termEnd } = useExecRoomAddon();
  const threads = useExecRoomThreads();
  const create = useCreateExecRoomThread();

  // Land straight in the most recent session when one exists.
  useEffect(() => {
    if (!isActive || threads.isLoading) return;
    const latest = threads.data?.[0];
    if (latest) {
      void navigate({
        to: "/report/team-room/$threadId",
        params: { threadId: latest.id },
        replace: true,
      });
    }
  }, [isActive, threads.isLoading, threads.data, navigate]);

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (!isActive) return <ExecRoomLocked reason={lockReason ?? "inactive"} termEnd={termEnd} />;
  // Read-only demo tenant: show the seeded example session if there is one.
  if (isReadOnly) {
    if (threads.isLoading) {
      return (
        <div className="p-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      );
    }
    if ((threads.data?.length ?? 0) === 0) return <ExecRoomReadOnly />;
    return (
      <div className="p-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <Users className="mx-auto mb-4 size-8 text-primary" />
      <h1 className="text-lg font-semibold">Exec Team Room</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start a session with your AI senior leadership team.
      </p>
      <Button
        className="mt-6"
        disabled={create.isPending}
        onClick={() =>
          create.mutate(undefined, {
            onSuccess: (thread: ExecRoomThread) =>
              navigate({ to: "/report/team-room/$threadId", params: { threadId: thread.id } }),
          })
        }
      >
        <Plus className="size-4" /> New session
      </Button>
    </div>
  );
}
