import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WALK_TYPES } from "@/lib/safety";
import { useCreateWalk } from "./use-safety";

const schema = z.object({
  area: z.string().trim().max(120).optional(),
  led_by: z.string().trim().max(120).optional(),
  participants: z.string().trim().max(500).optional(),
  good_practices: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export function WalkDialog({
  open,
  onOpenChange,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogged?: (walkId: string) => void;
}) {
  const create = useCreateWalk();
  const [walkType, setWalkType] = useState("daily");
  const [walkDate, setWalkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [area, setArea] = useState("");
  const [department, setDepartment] = useState("");
  const [ledBy, setLedBy] = useState("");
  const [participants, setParticipants] = useState("");
  const [goodPractices, setGoodPractices] = useState("");
  const [notes, setNotes] = useState("");

  const hint = WALK_TYPES.find((w) => w.key === walkType)?.hint;

  async function submit() {
    const parsed = schema.safeParse({ area, led_by: ledBy, participants, good_practices: goodPractices, notes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    const row = await create.mutateAsync({
      walk_type: walkType,
      walk_date: walkDate,
      area: area.trim() || null,
      department: department.trim() || null,
      led_by: ledBy.trim() || null,
      participants: participants.trim() || null,
      good_practices: goodPractices.trim() || null,
      notes: notes.trim() || null,
    });
    setArea("");
    setGoodPractices("");
    setNotes("");
    onOpenChange(false);
    if (row?.id) onLogged?.(row.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a safety walk</DialogTitle>
          <DialogDescription>
            Every walk produces four outputs: good practices, hazards, a risk rating and corrective actions with owners.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Walk type</Label>
              <Select value={walkType} onValueChange={setWalkType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WALK_TYPES.map((w) => <SelectItem key={w.key} value={w.key}>{w.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={walkDate} onChange={(e) => setWalkDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Machine shop, cell 4" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={120} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Led by</Label>
              <Input value={ledBy} onChange={(e) => setLedBy(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Participants</Label>
              <Input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Supervisor + operator" maxLength={500} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Good practices observed</Label>
            <Textarea
              rows={2}
              value={goodPractices}
              onChange={(e) => setGoodPractices(e.target.value)}
              placeholder="Operator correctly verified zero energy before beginning maintenance."
              maxLength={2000}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </div>
          <p className="text-xs text-muted-foreground">
            After saving you can add each hazard found as a report linked to this walk.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Save walk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
