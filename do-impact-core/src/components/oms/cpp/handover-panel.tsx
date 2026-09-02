import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Plus, Printer, Trash2 } from "lucide-react";
import { useCppMutations, useCppRows } from "./use-cpp";
import { KIT_READINESS, type CppHandover, type CppVisit } from "./types";

const emptyForm = {
  handover_date: new Date().toISOString().slice(0, 10),
  shift_label: "Day",
  outgoing_lead: "",
  incoming_lead: "",
  cards_reviewed: "",
  blockers_carried: "",
  kit_readiness: "ready",
  kit_note: "",
  next_priorities: "",
};

export function HandoverPanel({ visit, readOnly }: { visit: CppVisit; readOnly: boolean }) {
  const q = useCppRows<CppHandover>("cpp_handovers", visit.id, "handover_date", false);
  const { create, remove } = useCppMutations("cpp_handovers", visit.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const rows = q.data ?? [];

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Structured shift handover
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Handovers happen at the bay board, not in a back office. Outgoing and incoming leads walk the active critical
            path cards, the live blockers and kitted material readiness for the next shift.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={() => setOpen((v) => !v)}>
              <Plus className="h-4 w-4 mr-1" /> Handover
            </Button>
          )}
        </div>
      </div>

      {open && !readOnly && (
        <div className="rounded-md border bg-muted/30 p-4 grid gap-3 sm:grid-cols-2">
          <F label="Date">
            <Input type="date" value={form.handover_date} onChange={(e) => setForm({ ...form, handover_date: e.target.value })} />
          </F>
          <F label="Shift">
            <Input value={form.shift_label} onChange={(e) => setForm({ ...form, shift_label: e.target.value })} />
          </F>
          <F label="Outgoing lead">
            <Input value={form.outgoing_lead} onChange={(e) => setForm({ ...form, outgoing_lead: e.target.value })} />
          </F>
          <F label="Incoming lead">
            <Input value={form.incoming_lead} onChange={(e) => setForm({ ...form, incoming_lead: e.target.value })} />
          </F>
          <div className="sm:col-span-2">
            <F label="Critical path cards reviewed">
              <Textarea rows={2} value={form.cards_reviewed} onChange={(e) => setForm({ ...form, cards_reviewed: e.target.value })} />
            </F>
          </div>
          <div className="sm:col-span-2">
            <F label="Blockers carried over">
              <Textarea rows={2} value={form.blockers_carried} onChange={(e) => setForm({ ...form, blockers_carried: e.target.value })} />
            </F>
          </div>
          <F label="Kitted material readiness">
            <Select value={form.kit_readiness} onValueChange={(v) => setForm({ ...form, kit_readiness: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KIT_READINESS.map((k) => (
                  <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Kit note">
            <Input value={form.kit_note} onChange={(e) => setForm({ ...form, kit_note: e.target.value })} />
          </F>
          <div className="sm:col-span-2">
            <F label="Priorities for the next shift">
              <Textarea rows={2} value={form.next_priorities} onChange={(e) => setForm({ ...form, next_priorities: e.target.value })} />
            </F>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() =>
                create.mutate(
                  {
                    ...form,
                    outgoing_lead: form.outgoing_lead || null,
                    incoming_lead: form.incoming_lead || null,
                    cards_reviewed: form.cards_reviewed || null,
                    blockers_carried: form.blockers_carried || null,
                    kit_note: form.kit_note || null,
                    next_priorities: form.next_priorities || null,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm(emptyForm);
                    },
                  },
                )
              }
            >
              Save handover
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No handovers recorded.</p>}
        {rows.map((h) => (
          <div key={h.id} className="rounded-md border p-3 text-sm space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {h.handover_date} · {h.shift_label}
              </span>
              <Badge
                variant={h.kit_readiness === "ready" ? "secondary" : h.kit_readiness === "partial" ? "outline" : "destructive"}
              >
                {KIT_READINESS.find((k) => k.key === h.kit_readiness)?.label ?? h.kit_readiness}
              </Badge>
              <span className="text-muted-foreground">
                {h.outgoing_lead ?? "—"} → {h.incoming_lead ?? "—"}
              </span>
              {!readOnly && (
                <Button variant="ghost" size="icon" className="ml-auto no-print" onClick={() => remove.mutate(h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {h.cards_reviewed && <p><span className="text-muted-foreground">Cards: </span>{h.cards_reviewed}</p>}
            {h.blockers_carried && <p><span className="text-muted-foreground">Blockers: </span>{h.blockers_carried}</p>}
            {h.kit_note && <p><span className="text-muted-foreground">Kit: </span>{h.kit_note}</p>}
            {h.next_priorities && <p><span className="text-muted-foreground">Next shift: </span>{h.next_priorities}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
