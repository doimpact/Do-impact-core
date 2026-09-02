import { getCurrentUser } from "@/lib/auth-session";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfiles } from "@/components/owner-select";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

import { Plus, Pencil, Trash2, Star, StarOff, User, CalendarClock, CheckCircle2, XCircle, Users } from "lucide-react";
import { RowActions } from "@/components/commercial/row-actions";

import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";

const ROLE_PRESETS = ["Decision maker","Influencer","Champion","Blocker","End user","CEO","CTO","CFO","COO","VP","Director","Manager","Other"] as const;
const ROLE_PRIORITY: Record<string, number> = {
  "Decision maker": 0, "CEO": 1, "CTO": 2, "CFO": 3, "COO": 4,
  "VP": 5, "Director": 6, "Manager": 7,
  "Champion": 8, "Influencer": 9, "End user": 10, "Blocker": 11, "Other": 99,
};
function roleSort(a: string, b: string) {
  const pa = ROLE_PRIORITY[a] ?? 50;
  const pb = ROLE_PRIORITY[b] ?? 50;
  if (pa !== pb) return pa - pb;
  return a.localeCompare(b);
}

const INFLUENCE = ["low", "medium", "high"] as const;
const STRENGTH = ["weak", "neutral", "strong", "champion"] as const;
const TP_TYPES = ["call", "email", "meeting", "note", "update"] as const;
type TPType = (typeof TP_TYPES)[number];
const TP_LABEL: Record<TPType, string> = { call: "Call", email: "Email", meeting: "Meeting", note: "Note", update: "Update" };

type Profile = { id: string; display_name: string | null };

export function StakeholderPanel({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);



  const { data: contacts } = useQuery({
    queryKey: ["contacts", accountId],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts")
        .select("*, owner:profiles!contacts_relationship_owner_id_fkey(id, display_name)")
        .eq("account_id", accountId).order("is_primary", { ascending: false }).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useProfiles();


  const visible = (contacts ?? []).filter((c: any) => showArchived || !c.archived_at);
  const grouped = visible.reduce((acc: Record<string, any[]>, c: any) => {
    const key = (c.decision_role as string)?.trim() || "Other";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort(roleSort);
  const totalCount = visible.length;
  const archivedCount = (contacts ?? []).filter((c: any) => c.archived_at).length;
  const withOwnerCount = visible.filter((c: any) => c.relationship_owner_id).length;

  async function removeContact(c: any) {
    const { error } = await supabase.from("contacts").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Stakeholder removed");
    qc.invalidateQueries({ queryKey: ["contacts", accountId] });
  }
  async function archiveContact(c: any, archived: boolean) {
    const { data, error } = await supabase.from("contacts")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", c.id).select("id");
    if (error) return toast.error(error.message);
    if (!data || data.length === 0) return toast.error("Nothing was changed — this workspace is read-only or you don't have permission.");
    toast.success(archived ? "Stakeholder archived" : "Stakeholder restored");
    qc.invalidateQueries({ queryKey: ["contacts", accountId] });
  }
  async function togglePrimary(c: any) {
    const { error } = await supabase.from("contacts").update({ is_primary: !c.is_primary }).eq("id", c.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["contacts", accountId] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {totalCount} stakeholder(s)</span>
          <span className="text-xs">·</span>
          <span className="text-xs">{withOwnerCount}/{totalCount} mapped to an internal owner</span>
        </div>
        <div className="flex items-center gap-2">
          {archivedCount > 0 && (
            <Button size="sm" variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? `Hide archived (${archivedCount})` : `Show archived (${archivedCount})`}
            </Button>
          )}
          <StakeholderDialog accountId={accountId} profiles={profiles} trigger={<Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add stakeholder</Button>} />
        </div>
      </div>

      {totalCount === 0 && (<Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No stakeholders mapped yet.</CardContent></Card>)}


      {totalCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Relationship map</div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <div className="text-[10px] uppercase text-muted-foreground">Stakeholder</div>
              <div />
              <div className="text-[10px] uppercase text-muted-foreground">Our owner</div>
              {(contacts ?? []).map((c: any) => (
                <div key={c.id} className="contents">
                  <div className="min-w-0 truncate">
                    <span className="font-medium">{c.name}</span>
                    {c.decision_role && <span className="text-xs text-muted-foreground"> · {c.decision_role}</span>}
                  </div>
                  <div className="text-muted-foreground">↔</div>
                  <div className={`min-w-0 truncate ${c.owner?.display_name ? "" : "text-muted-foreground italic"}`}>
                    {c.owner?.display_name ?? "Unassigned"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {groupKeys.map((role) => (
        <div key={role} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-[10px] tracking-wide">{role}</Badge>
            <div className="text-xs text-muted-foreground">{grouped[role].length}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {grouped[role].map((c: any) => (
              <StakeholderCard key={c.id} contact={c} profiles={profiles}
                onDelete={() => removeContact(c)} onArchiveToggle={(next) => archiveContact(c, next)}
                onTogglePrimary={() => togglePrimary(c)} accountId={accountId} />
            ))}

          </div>
        </div>
      ))}
    </div>
  );
}

function StakeholderCard({ contact, profiles, onDelete, onArchiveToggle, onTogglePrimary, accountId }: {
  contact: any; profiles: Profile[] | undefined; onDelete: () => void; onArchiveToggle: (next: boolean) => void;
  onTogglePrimary: () => void; accountId: string;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  return (
    <Card className={contact.archived_at ? "opacity-60" : undefined}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button onClick={onTogglePrimary} title="Primary contact">
                {contact.is_primary ? <Star className="w-4 h-4 text-accent fill-accent" /> : <StarOff className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="font-semibold truncate">{contact.name}</div>
              {contact.archived_at && <Badge variant="outline" className="text-[10px] uppercase">Archived</Badge>}
            </div>
            {contact.title && <div className="text-xs text-muted-foreground">{contact.title}</div>}
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {contact.email || "—"}{contact.phone && ` · ${contact.phone}`}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <RowActions
              label={contact.name}
              archived={!!contact.archived_at}
              onEdit={() => setEditOpen(true)}
              onArchiveToggle={onArchiveToggle}
              onDelete={onDelete}
              deleteDescription="All touchpoints will be removed with them."
              size="sm"
            />
            <StakeholderDialog accountId={accountId} profiles={profiles} record={contact}
              open={editOpen} onOpenChange={setEditOpen} />
          </div>
        </div>


        <div className="flex flex-wrap gap-1.5">
          {contact.influence && <Badge variant="secondary" className="text-[10px]">Influence: {contact.influence}</Badge>}
          {contact.relationship_strength && (<Badge variant="secondary" className="text-[10px]">Relationship: {contact.relationship_strength}</Badge>)}
          <Badge variant="outline" className="text-[10px] inline-flex items-center gap-1">
            <User className="w-3 h-3" /> Owner: {contact.owner?.display_name ?? "Unassigned"}
          </Badge>
        </div>

        {contact.notes && (<div className="text-xs text-foreground/80 border-l-2 border-muted pl-2">{contact.notes}</div>)}

        <div className="pt-1 border-t">
          <button onClick={() => setOpen((v) => !v)} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" />
            {open ? "Hide interactions plan" : "Interactions plan"}
          </button>
          {open && <TouchpointsList accountId={accountId} contactId={contact.id} profiles={profiles} />}
        </div>
      </CardContent>
    </Card>
  );
}

function TouchpointsList({ accountId, contactId, profiles }: { accountId: string; contactId: string; profiles: Profile[] | undefined }) {
  const qc = useQueryClient();
  const { data: items } = useQuery({
    queryKey: ["touchpoints", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from("stakeholder_touchpoints")
        .select("*, owner:profiles(display_name)").eq("contact_id", contactId).order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upcoming = (items ?? []).filter((t: any) => t.status === "planned" && !isPast(parseISO(t.scheduled_at)));
  const overdue = (items ?? []).filter((t: any) => t.status === "planned" && isPast(parseISO(t.scheduled_at)));
  const past = (items ?? []).filter((t: any) => t.status !== "planned");

  async function markDone(id: string) {
    const { error } = await supabase.from("stakeholder_touchpoints").update({ status: "completed" }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["touchpoints", contactId] });
  }
  async function markCancelled(id: string) {
    const { error } = await supabase.from("stakeholder_touchpoints").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["touchpoints", contactId] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("stakeholder_touchpoints").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["touchpoints", contactId] });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex justify-end">
        <TouchpointDialog accountId={accountId} contactId={contactId} profiles={profiles}
          trigger={<Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Log or plan</Button>} />
      </div>
      {overdue.length > 0 && (<Section title="Overdue" tone="destructive">
        {overdue.map((t: any) => (<TPRow key={t.id} tp={t} onDone={markDone} onCancel={markCancelled} onRemove={remove} profiles={profiles} accountId={accountId} contactId={contactId} />))}
      </Section>)}
      {upcoming.length > 0 && (<Section title="Upcoming">
        {upcoming.map((t: any) => (<TPRow key={t.id} tp={t} onDone={markDone} onCancel={markCancelled} onRemove={remove} profiles={profiles} accountId={accountId} contactId={contactId} />))}
      </Section>)}
      {past.length > 0 && (<Section title="History">
        {past.map((t: any) => (<TPRow key={t.id} tp={t} onDone={markDone} onCancel={markCancelled} onRemove={remove} profiles={profiles} accountId={accountId} contactId={contactId} />))}
      </Section>)}
      {(items ?? []).length === 0 && (<div className="text-xs text-muted-foreground text-center py-3">No touchpoints yet.</div>)}
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone?: "destructive"; children: React.ReactNode }) {
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wide mb-1 ${tone === "destructive" ? "text-destructive" : "text-muted-foreground"}`}>{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function TPRow({ tp, onDone, onCancel, onRemove, profiles, accountId, contactId }: {
  tp: any; onDone: (id: string) => void; onCancel: (id: string) => void; onRemove: (id: string) => void;
  profiles: Profile[] | undefined; accountId: string; contactId: string;
}) {
  return (
    <div className="text-xs bg-muted/40 rounded p-2 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] capitalize">{TP_LABEL[tp.type as TPType]}</Badge>
          <span className="font-medium">{tp.subject || "(no subject)"}</span>
          {tp.status === "completed" && <CheckCircle2 className="w-3 h-3 text-primary" />}
          {tp.status === "cancelled" && <XCircle className="w-3 h-3 text-muted-foreground" />}
        </div>
        <div className="text-muted-foreground mt-0.5">
          {format(parseISO(tp.scheduled_at), "MMM d, yyyy · HH:mm")}
          {tp.owner?.display_name && <> · {tp.owner.display_name}</>}
        </div>
        {tp.notes && <div className="mt-1 text-foreground/80 whitespace-pre-wrap">{tp.notes}</div>}
      </div>
      <div className="flex gap-0.5 shrink-0">
        {tp.status === "planned" && (<>
          <Button size="icon" variant="ghost" className="h-6 w-6" title="Mark done" onClick={() => onDone(tp.id)}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" title="Cancel" onClick={() => onCancel(tp.id)}><XCircle className="w-3.5 h-3.5" /></Button>
        </>)}
        <TouchpointDialog accountId={accountId} contactId={contactId} profiles={profiles} record={tp}
          trigger={<Button size="icon" variant="ghost" className="h-6 w-6" title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>} />
        <Button size="icon" variant="ghost" className="h-6 w-6" title="Delete" onClick={() => onRemove(tp.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
      </div>
    </div>
  );
}

function StakeholderDialog({ accountId, profiles, record, trigger, open: openProp, onOpenChange }: {
  accountId: string; profiles: Profile[] | undefined; record?: any; trigger?: React.ReactNode;
  open?: boolean; onOpenChange?: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp! : internalOpen;
  const setOpen = (v: boolean) => { if (isControlled) onOpenChange?.(v); else setInternalOpen(v); };

  const isEdit = !!record;
  const [f, setF] = useState(() => ({
    name: record?.name ?? "", title: record?.title ?? "", email: record?.email ?? "", phone: record?.phone ?? "",
    is_primary: record?.is_primary ?? false, decision_role: (record?.decision_role as string) ?? "",
    influence: record?.influence ?? "", relationship_strength: record?.relationship_strength ?? "",
    relationship_owner_id: record?.relationship_owner_id ?? "", notes: record?.notes ?? "",
  }));
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return toast.error("Name required");
    setSaving(true);
    const payload = {
      name: f.name, title: f.title || null, email: f.email || null, phone: f.phone || null,
      is_primary: f.is_primary, decision_role: f.decision_role.trim() || null,
      influence: f.influence || null, relationship_strength: f.relationship_strength || null,
      relationship_owner_id: f.relationship_owner_id || null, notes: f.notes || null,
    };
    const { error } = isEdit
      ? await supabase.from("contacts").update(payload).eq("id", record.id)
      : await supabase.from("contacts").insert({ ...payload, account_id: accountId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Stakeholder updated" : "Stakeholder added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["contacts", accountId] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit stakeholder" : "New stakeholder"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name *</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role</Label>
              <Input list="stakeholder-role-presets" placeholder="e.g. CEO, Decision maker…"
                value={f.decision_role} onChange={(e) => setF({ ...f, decision_role: e.target.value })} />
              <datalist id="stakeholder-role-presets">
                {ROLE_PRESETS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <Label>Influence</Label>
              <Select value={f.influence || "__none__"} onValueChange={(v) => setF({ ...f, influence: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {INFLUENCE.map((i) => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Relationship strength</Label>
              <Select value={f.relationship_strength || "__none__"} onValueChange={(v) => setF({ ...f, relationship_strength: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {STRENGTH.map((i) => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Our relationship owner</Label>
              <Select value={f.relationship_owner_id || "__none__"} onValueChange={(v) => setF({ ...f, relationship_owner_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {(profiles ?? []).map((p) => (<SelectItem key={p.id} value={p.id}>{p.display_name ?? p.id.slice(0, 8)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.is_primary} onChange={(e) => setF({ ...f, is_primary: e.target.checked })} />
            Primary contact for account
          </label>
          <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save" : "Add"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TouchpointDialog({ accountId, contactId, profiles, record, trigger }: {
  accountId: string; contactId: string; profiles: Profile[] | undefined; record?: any; trigger: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const isEdit = !!record;
  const [f, setF] = useState(() => ({
    type: (record?.type as TPType) ?? "meeting",
    status: (record?.status as "planned" | "completed" | "cancelled") ?? "planned",
    scheduled_at: record?.scheduled_at ? toLocalInput(record.scheduled_at) : toLocalInput(new Date().toISOString()),
    subject: record?.subject ?? "", notes: record?.notes ?? "", owner_id: record?.owner_id ?? "",
  }));
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let ownerId = f.owner_id;
    if (!ownerId) {
      const { data: u } = await getCurrentUser();
      ownerId = u.user?.id ?? "";
    }
    const payload = {
      type: f.type, status: f.status,
      scheduled_at: new Date(f.scheduled_at).toISOString(),
      subject: f.subject || null, notes: f.notes || null, owner_id: ownerId || null,
    };
    const { error } = isEdit
      ? await supabase.from("stakeholder_touchpoints").update(payload).eq("id", record.id)
      : await supabase.from("stakeholder_touchpoints").insert({ ...payload, account_id: accountId, contact_id: contactId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Touchpoint updated" : "Touchpoint added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["touchpoints", contactId] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit touchpoint" : "New touchpoint"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as TPType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TP_TYPES.map((t) => <SelectItem key={t} value={t}>{TP_LABEL[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>When</Label><Input type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} /></div>
          <div><Label>Subject</Label><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Quarterly review, follow-up on pricing…" /></div>
          <div>
            <Label>Owner</Label>
            <Select value={f.owner_id || "__none__"} onValueChange={(v) => setF({ ...f, owner_id: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Me" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Me</SelectItem>
                {(profiles ?? []).map((p) => (<SelectItem key={p.id} value={p.id}>{p.display_name ?? p.id.slice(0, 8)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save" : "Add"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
