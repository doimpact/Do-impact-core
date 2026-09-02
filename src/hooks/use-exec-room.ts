// DO.Impact Core (open-source edition) — the AI "Exec Team Room" add-on is
// part of the hosted product and is always locked in this edition.
export type ExecRoomThread = {
  id: string;
  company_id: string;
  title: string;
  archived_at: string | null;
  created_at: string;
};

export type ExecRoomMessageRow = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type ExecRoomLockReason = "expired" | "inactive" | "no-grant";

export function useExecRoomAddon() {
  return {
    isActive: false,
    isLoading: false,
    isReadOnly: true,
    companyId: null as string | null,
    lockReason: "inactive" as ExecRoomLockReason | null,
    termEnd: null as string | null,
  };
}

export function useExecRoomThreads(_includeArchived = false) {
  return { data: [] as ExecRoomThread[], isLoading: false };
}

export function useExecRoomMessages(_threadId: string | undefined) {
  return { data: [] as ExecRoomMessageRow[], isLoading: false };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopMutation = (): any => ({
  mutate: () => {},
  mutateAsync: async () => {
    throw new Error("Not available in the open-source edition");
  },
  isPending: false,
});

export function useCreateExecRoomThread() { return noopMutation(); }
export function useRenameExecRoomThread() { return noopMutation(); }
export function useArchiveExecRoomThread() { return noopMutation(); }
export function useDeleteExecRoomThread() { return noopMutation(); }
