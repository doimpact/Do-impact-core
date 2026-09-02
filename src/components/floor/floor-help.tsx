import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { OwnerSelect, ownerLabel } from "@/components/owner-select";
import { LifeBuoy } from "lucide-react";
import { LOOP_STATES, type Category, type Escalation } from "@/components/oms/daily/types";

export type HelpDraft = {
  category: string;
  concern: string;
  cause: string;
  countermeasure: string;
  ownerId: string | null;
};

/** "Ask for help" — the 3C, worded as the team handing a barrier to the business. */
export function FloorHelpDialog({
  open, category, categories, readOnly, onClose, onSave,
}: {
  open: boolean;
  category: string | null;
  categories: Category[];
  readOnly: boolean;
  onClose: () => void;
  onSave: (draft: HelpDraft) => void;
}) {
  const [concern, setConcern] = useState("");
  const [cause, setCause] = useState("");
  const [countermeasure, setCountermeasure] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setConcern(""); setCause(""); setCountermeasure(""); setOwnerId(null); }
  }, [open]);

  const label = categories.find(c => c.key === category)?.label ?? "this";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask for help — {label}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tell us what got in the way. It goes to a named owner who is accountable for clearing it.
        </p>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium">What happened?</div>
            <Textarea rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="The barrier we hit" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Why do you think it happened? (optional)</div>
            <Input value={cause} onChange={(e) => setCause(e.target.value)} placeholder="What we saw at the process" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">What did we do right now? (optional)</div>
            <Input value={countermeasure} onChange={(e) => setCountermeasure(e.target.value)} placeholder="Immediate workaround" />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium">Who can clear this?</div>
            <OwnerSelect value={ownerId} onChange={setOwnerId} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={readOnly || !concern.trim() || !category}
            onClick={() => category && onSave({ category, concern: concern.trim(), cause, countermeasure, ownerId })}
          >
            Send it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Open barriers this team has raised, with who owns them now. */
export function FloorHelpList({
  escalations, categories, profiles,
}: {
  escalations: Escalation[];
  categories: Category[];
  profiles: { id: string; display_name: string | null; email: string | null }[];
}) {
  if (!escalations.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No open asks right now. If something blocks you, raise it — that is the whole point of this board.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {escalations.map((e) => {
        const cat = categories.find(c => c.key === e.category)?.label ?? e.category;
        const owner = profiles.find(p => p.id === e.owner_id);
        const loop = LOOP_STATES.find(l => l.key === e.loop_state);
        return (
          <li key={e.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <LifeBuoy className="mt-0.5 h-5 w-5 text-sky-600" />
              <div className="min-w-0 flex-1">
                <div className="text-base font-medium">{e.concern}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{cat}</span>
                  <span>·</span>
                  <span>{e.occurred_on}</span>
                  <span>·</span>
                  <span>{owner ? `Owned by ${ownerLabel(owner)}` : "Waiting for an owner"}</span>
                </div>
              </div>
              {loop && <span className={`rounded-full px-2 py-1 text-xs font-medium ${loop.className}`}>{loop.label}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
