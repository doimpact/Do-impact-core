import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ExecRoomChat, ExecRoomLocked, ExecRoomReadOnly } from "@/components/exec-room/ExecRoomChat";
import {
  useArchiveExecRoomThread,
  useCreateExecRoomThread,
  useDeleteExecRoomThread,
  useExecRoomAddon,
  useExecRoomThreads,
  useRenameExecRoomThread,
  type ExecRoomThread,
} from "@/hooks/use-exec-room";

export const Route = createFileRoute("/_authenticated/report/team-room/$threadId")({
  component: TeamRoomThread,
  head: () => ({
    meta: [
      { title: "Exec Team Room session | DO.Impact" },
      {
        name: "description",
        content:
          "Work through the business with an AI senior leadership team grounded in your enabled modules.",
      },
      { property: "og:title", content: "Exec Team Room session | DO.Impact" },
      {
        property: "og:description",
        content: "An AI senior leadership team session grounded in your live operating data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8 text-red-600">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Session not found.</div>,
});

function TeamRoomThread() {
  const { threadId } = useParams({ from: "/_authenticated/report/team-room/$threadId" });
  const navigate = useNavigate();
  const { isActive, isLoading, companyId, isReadOnly, lockReason, termEnd } = useExecRoomAddon();
  const [showArchived, setShowArchived] = useState(false);
  const threads = useExecRoomThreads(showArchived);
  const create = useCreateExecRoomThread();
  const remove = useDeleteExecRoomThread();
  const rename = useRenameExecRoomThread();
  const archive = useArchiveExecRoomThread();

  const [renameTarget, setRenameTarget] = useState<ExecRoomThread | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ExecRoomThread | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (!isActive || !companyId)
    return <ExecRoomLocked reason={lockReason ?? "inactive"} termEnd={termEnd} />;
  if (isReadOnly && (threads.data?.length ?? 0) === 0 && !threads.isLoading) {
    return <ExecRoomReadOnly />;
  }

  const list = threads.data ?? [];
  const active = list.find((t) => t.id === threadId);

  /** Move away from a session that is no longer viewable. */
  const leaveThread = (id: string) => {
    if (id !== threadId) return;
    const next = list.find((t) => t.id !== id && !t.archived_at);
    if (next) {
      void navigate({ to: "/report/team-room/$threadId", params: { threadId: next.id } });
    } else {
      void navigate({ to: "/report/team-room" });
    }
  };

  const sessionList = (onPicked?: () => void) => (
    <>
      {!isReadOnly && (
        <div className="p-3">
          <Button
            className="w-full"
            size="sm"
            disabled={create.isPending}
            onClick={() =>
              create.mutate(undefined, {
                onSuccess: (thread: ExecRoomThread) => {
                  onPicked?.();
                  navigate({
                    to: "/report/team-room/$threadId",
                    params: { threadId: thread.id },
                  });
                },
              })
            }
          >
            <Plus className="size-4" /> New session
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between px-3 pb-2 pt-3">

        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sessions
        </span>
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {list.map((thread: ExecRoomThread) => (
          <div
            key={thread.id}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
              thread.id === threadId ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              thread.archived_at && "opacity-60",
            )}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              onClick={() => {
                onPicked?.();
                navigate({
                  to: "/report/team-room/$threadId",
                  params: { threadId: thread.id },
                });
              }}
            >
              {thread.archived_at ? (
                <Archive className="size-3.5 shrink-0 opacity-60" />
              ) : (
                <MessageSquare className="size-3.5 shrink-0 opacity-60" />
              )}
              <span className="truncate">{thread.title}</span>
            </button>

            {!isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Session options for ${thread.title}`}
                    className="rounded p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onSelect={() => {
                      setRenameTarget(thread);
                      setRenameValue(thread.title);
                    }}
                  >
                    <Pencil className="size-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      archive.mutate(
                        { id: thread.id, archived: !thread.archived_at },
                        {
                          onSuccess: () => {
                            if (!thread.archived_at && !showArchived) leaveThread(thread.id);
                          },
                        },
                      )
                    }
                  >
                    {thread.archived_at ? (
                      <>
                        <ArchiveRestore className="size-3.5" /> Unarchive
                      </>
                    ) : (
                      <>
                        <Archive className="size-3.5" /> Archive
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setDeleteTarget(thread)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">No sessions yet.</p>
        )}
      </nav>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r md:flex">{sessionList()}</aside>

      <div className="min-h-0 flex-1">
        <ExecRoomChat
          key={threadId}
          threadId={threadId}
          companyId={companyId}
          threadTitle={active?.title}
          readOnly={isReadOnly}
          headerLeft={
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="mr-2 md:hidden">
                  <PanelLeft className="size-4" /> Sessions
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0 pt-10">
                <SheetHeader className="px-3 pb-0">
                  <SheetTitle className="text-sm">Exec Team Room sessions</SheetTitle>
                </SheetHeader>
                {sessionList(() => setSheetOpen(false))}
              </SheetContent>
            </Sheet>
          }
        />
      </div>


      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename session</DialogTitle>
            <DialogDescription>Give this leadership session a clearer name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="exec-room-rename">Title</Label>
            <Input
              id="exec-room-rename"
              value={renameValue}
              maxLength={80}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim() && renameTarget) {
                  rename.mutate({ id: renameTarget.id, title: renameValue.trim() });
                  setRenameTarget(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim() || rename.isPending}
              onClick={() => {
                if (!renameTarget) return;
                rename.mutate({ id: renameTarget.id, title: renameValue.trim() });
                setRenameTarget(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the session and its conversation. Archive it instead if you
              may want it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = deleteTarget;
                setDeleteTarget(null);
                if (!target) return;
                remove.mutate(target.id, { onSuccess: () => leaveThread(target.id) });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
