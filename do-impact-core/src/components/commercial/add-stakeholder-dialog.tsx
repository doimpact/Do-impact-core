import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OwnerSelect } from "@/components/owner-select";

const INFLUENCE = ["low", "medium", "high"] as const;
const STRENGTH = ["weak", "neutral", "strong", "champion"] as const;
const NONE = "__none__";

export function AddStakeholderDialog({
  record,
  open: openProp,
  onOpenChange,
}: {
  record?: any;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
} = {}) {
  const qc = useQueryClient();
  const isEdit = !!record;
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp! : internalOpen;
  const setOpen = (v: boolean) => { isControlled ? onOpenChange?.(v) : setInternalOpen(v); };
  const [busy, setBusy] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [decisionRole, setDecisionRole] = useState("");
  const [influence, setInfluence] = useState<string>(NONE);
  const [strength, setStrength] = useState<string>(NONE);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: accounts } = useQuery({
    queryKey: ["accounts-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("id, name, archived_at").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  function reset() {
    setAccountId(""); setNewAccountName(""); setName(""); setTitle(""); setEmail(""); setPhone("");
    setDecisionRole(""); setInfluence(NONE); setStrength(NONE); setOwnerId(null); setIsPrimary(false); setNotes("");
  }

  useEffect(() => {
    if (!open) return;
    if (record) {
      setAccountId(record.account_id ?? "");
      setNewAccountName("");
      setName(record.name ?? "");
      setTitle(record.title ?? "");
      setEmail(record.email ?? "");
      setPhone(record.phone ?? "");
      setDecisionRole(record.decision_role ?? "");
      setInfluence(record.influence ?? NONE);
      setStrength(record.relationship_strength ?? NONE);
      setOwnerId(record.relationship_owner_id ?? null);
      setIsPrimary(!!record.is_primary);
      setNotes(record.notes ?? "");
    } else {
      reset();
    }
  }, [open, record]);

  async function submit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!accountId && !newAccountName.trim()) { toast.error("Select or create an account"); return; }
    setBusy(true);
    try {
      let accId = accountId;
      if (!accId) {
        const { data: acc, error: accErr } = await supabase.from("accounts")
          .insert({ name: newAccountName.trim() }).select("id").single();
        if (accErr || !acc) throw accErr ?? new Error("Failed to create account");
        accId = acc.id;
      }
      const payload = {
        account_id: accId,
        name: name.trim(),
        title: title.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        decision_role: decisionRole.trim() || null,
        influence: influence === NONE ? null : influence,
        relationship_strength: strength === NONE ? null : strength,
        relationship_owner_id: ownerId,
        is_primary: isPrimary,
        notes: notes.trim() || null,
      };
      if (isEdit) {
        const { data, error } = await supabase.from("contacts").update(payload).eq("id", record.id).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Nothing was changed — this workspace is read-only or you don't have permission.");
      } else {
        const { error } = await supabase.from("contacts").insert(payload);
        if (error) throw error;
      }
      toast.success(isEdit ? "Stakeholder updated" : "Stakeholder added");
      qc.invalidateQueries({ queryKey: ["stakeholders-all"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["accounts-min"] });
      if (!isEdit) reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save stakeholder");
    } finally {
      setBusy(false);
    }
  }

  const accountOptions = (accounts ?? []).filter(
    (a: any) => !a.archived_at || a.id === record?.account_id || a.id === accountId,
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o && !isEdit) reset(); }}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add stakeholder</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit stakeholder" : "Add stakeholder"}</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Account *</Label>
            <Select value={accountId} onValueChange={(v) => { setAccountId(v); setNewAccountName(""); }}>
              <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>
                {accountOptions.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {!isEdit && (
              <>
                <div className="text-xs text-muted-foreground">or create new:</div>
                <Input placeholder="New account name" value={newAccountName}
                  onChange={(e) => { setNewAccountName(e.target.value); if (e.target.value) setAccountId(""); }} />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Decision role</Label>
              <Input value={decisionRole} onChange={(e) => setDecisionRole(e.target.value)} placeholder="e.g. Decision maker" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Influence</Label>
              <Select value={influence} onValueChange={setInfluence}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {INFLUENCE.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Relationship</Label>
              <Select value={strength} onValueChange={setStrength}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {STRENGTH.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Relationship owner</Label>
              <OwnerSelect value={ownerId} onChange={setOwnerId} />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Switch id="is-primary" checked={isPrimary} onCheckedChange={setIsPrimary} />
              <Label htmlFor="is-primary">Primary contact</Label>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{isEdit ? "Save changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
