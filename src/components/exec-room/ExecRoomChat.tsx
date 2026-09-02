// DO.Impact Core (open-source edition) — the AI "Exec Team Room" add-on is
// part of the hosted product. These stubs render a locked notice.

export function ExecRoomLocked({ reason, termEnd: _termEnd }: { reason?: string | null; termEnd?: string | null }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
      <p className="font-semibold">Exec Team Room</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The AI leadership team is part of the hosted DO.Impact product and is not
        included in the open-source edition{reason ? ` (${reason})` : ""}.
      </p>
    </div>
  );
}

export function ExecRoomReadOnly() {
  return <ExecRoomLocked reason="read-only" />;
}

export function ExecRoomChat(_props: Record<string, unknown>) {
  return <ExecRoomLocked />;
}
