import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createPillar, updatePillar, listMembers } from "@/lib/oms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export type PillarLike = { id: string; key: string; name: string; tagline: string | null; owner_id?: string | null };

const NONE = "__none__";

export function PillarDialog({
  open, onOpenChange, pillar, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  pillar?: PillarLike | null;
  onSaved: () => void;
}) {
  const isEdit = !!pillar;
  const createFn = useServerFn(createPillar);
  const updateFn = useServerFn(updatePillar);
  const membersFn = useServerFn(listMembers);
  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: () => membersFn(),
    enabled: open,
  });
  const people = members?.profiles ?? [];
  const [name, setName] = useState(pillar?.name ?? "");
  const [key, setKey] = useState(pillar?.key ?? "");
  const [tagline, setTagline] = useState(pillar?.tagline ?? "");
  const [ownerId, setOwnerId] = useState<string>(pillar?.owner_id ?? NONE);

  const onOpenChangeWrap = (o: boolean) => {
    if (o) {
      setName(pillar?.name ?? "");
      setKey(pillar?.key ?? "");
      setTagline(pillar?.tagline ?? "");
      setOwnerId(pillar?.owner_id ?? NONE);
    }
    onOpenChange(o);
  };

  const save = useMutation({
    mutationFn: async () => {
      const owner = ownerId === NONE ? null : ownerId;
      if (isEdit && pillar) {
        return updateFn({ data: { id: pillar.id, name, key, tagline: tagline || null, ownerId: owner } });
      }
      return createFn({ data: { name, key, tagline: tagline || null, ownerId: owner } });
    },
    onSuccess: () => { toast.success(isEdit ? "Pillar updated" : "Pillar created"); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoKey = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);

  return (
    <Dialog open={open} onOpenChange={onOpenChangeWrap}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit pillar" : "New pillar"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={name} onChange={(e) => {
              setName(e.target.value);
              if (!isEdit) setKey(autoKey(e.target.value));
            }} placeholder="e.g. Safety" />
          </div>
          <div>
            <Label htmlFor="p-key">Key <span className="text-xs text-muted-foreground">(URL slug)</span></Label>
            <Input id="p-key" value={key} onChange={(e) => setKey(autoKey(e.target.value))} placeholder="safety" />
          </div>
          <div>
            <Label htmlFor="p-tagline">Tagline</Label>
            <Input id="p-tagline" value={tagline ?? ""} onChange={(e) => setTagline(e.target.value)} placeholder="Short description" />
          </div>
          <div>
            <Label>Owner</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name ?? "Unnamed"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || !key.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
