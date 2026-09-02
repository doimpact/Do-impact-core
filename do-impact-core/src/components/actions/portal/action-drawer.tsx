import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Save } from "lucide-react";
import { OwnerSelect } from "@/components/owner-select";
import { ActionRow, ActionStatus, MODULE_TONE, STATUS_LABEL, STATUS_TONE, isOverdue, todayISO } from "@/lib/execution-actions";
import { editCaps, statusOptions, useUpdateAction } from "@/lib/execution-mutations";

export function ActionDrawer({ row, onOpenChange }: { row: ActionRow | null; onOpenChange: (open: boolean) => void }) {
  const today = todayISO();
  const caps = editCaps(row?.source ?? "");
  const update = useUpdateAction();

  const [status, setStatus] = useState<ActionStatus>("open");
  const [owner, setOwner] = useState<string | null>(null);
  const [due, setDue] = useState("");

  useEffect(() => {
    if (!row) return;
    setStatus(row.status);
    setOwner(row.owner_id);
    setDue(row.due_date ?? "");
  }, [row]);

  if (!row) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  const dirty = status !== row.status || owner !== row.owner_id || (due || null) !== row.due_date;
  const editable = caps.status || caps.owner || caps.due_date;

  const save = () => {
    update.mutate(
      { row, patch: { status, owner_id: owner, due_date: due || null } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base leading-snug pr-6">{row.title || "(untitled)"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${MODULE_TONE[row.module]}`}>{row.module}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_TONE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
            {isOverdue(row, today) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-100 text-red-800">Overdue</span>
            )}
          </div>

          {editable && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)} disabled={!caps.status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions(row.source).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Owner</Label>
                {caps.owner ? (
                  <OwnerSelect value={owner} onChange={setOwner} />
                ) : (
                  <Input value={row.owner_name ?? "—"} disabled />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Due date</Label>
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={!caps.due_date} />
              </div>

              {caps.note && <p className="text-[11px] text-muted-foreground">{caps.note}</p>}

              <Button className="w-full gap-2" onClick={save} disabled={!dirty || update.isPending}>
                <Save className="h-4 w-4" /> {update.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}

          <dl className="text-sm divide-y rounded-md border">
            <Field label="Parent" value={row.parent ?? "—"} />
            <Field label="Start" value={row.start_date ?? "—"} />
            <Field label="Completed" value={row.done_date ?? "—"} />
            <Field label="Source" value={row.source.replace(/_/g, " ")} />
          </dl>

          <Button asChild variant="outline" className="w-full gap-2">
            <Link to={row.link.to} params={row.link.params as never}>
              Open in {row.module} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Status, owner and due date save straight back to the owning module. Titles and details are edited there.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-right truncate">{value}</dd>
    </div>
  );
}
