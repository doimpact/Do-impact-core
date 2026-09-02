import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute } from "@tanstack/react-router";
import { useDemoNow } from "@/lib/demo-date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardWorkPanel } from "@/components/oms/standard-work-panel";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { confirmThen } from "@/components/confirm-dialog";

export const Route = createFileRoute("/_authenticated/oms/risk")({
  head: () => ({ meta: [{ title: "Calendar & Standard Work — DO.Impact" }] }),
  component: CalendarPage,
});

type EventType = "audit" | "visit" | "event" | "meeting" | "other";
type Ev = {
  id: string; title: string; notes: string | null; event_type: EventType;
  event_date: string; start_time: string | null; end_time: string | null;
  assignee_id: string | null; pillar_id: string | null; archived_at: string | null;
  created_by: string | null;
};

const TYPE_META: Record<EventType, { label: string; color: string }> = {
  audit: { label: "Audit", color: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
  visit: { label: "Visit", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  event: { label: "Event", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  meeting: { label: "Meeting", color: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30" },
  other: { label: "Other", color: "bg-muted text-foreground border-border" },
};

function ymd(d: Date) {
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const start = new Date(first); start.setDate(first.getDate() - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  return days;
}

function CalendarPage() {
  const qc = useQueryClient();
  const demoNow = useDemoNow();
  const [anchor, setAnchor] = useState(() => demoNow);
  const demoKey = `${demoNow.getFullYear()}-${demoNow.getMonth()}`;
  const syncedKey = useRef<string | null>(null);
  useEffect(() => {
    if (syncedKey.current === demoKey) return;
    syncedKey.current = demoKey;
    setAnchor(demoNow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoKey]);
  const [showArchived, setShowArchived] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [editing, setEditing] = useState<Ev | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | null>(null);
  const [tab, setTab] = useState("calendar");


  const monthKey = `${anchor.getFullYear()}-${anchor.getMonth()}`;

  const { data: events = [] } = useQuery({
    queryKey: ["calendar-events", monthKey, showArchived],
    queryFn: async () => {
      const start = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 2, 0);
      let q = supabase.from("calendar_events").select("*")
        .gte("event_date", ymd(start)).lte("event_date", ymd(end)).order("event_date");
      if (!showArchived) q = q.is("archived_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Ev[];
    },
  });

  const { data: profiles = [] } = useProfiles();
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const filtered = useMemo(
    () => typeFilter === "all" ? events : events.filter((e) => e.event_type === typeFilter),
    [events, typeFilter],
  );

  const eventsByDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of filtered) {
      const list = m.get(e.event_date) ?? []; list.push(e); m.set(e.event_date, list);
    }
    return m;
  }, [filtered]);

  const days = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const monthLabel = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayKey = ymd(demoNow);

  const archiveMut = useMutation({
    mutationFn: async (e: Ev) => {
      const { error } = await supabase.from("calendar_events")
        .update({ archived_at: e.archived_at ? null : new Date().toISOString() }).eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew(date?: string) {
    setEditing(null); setDefaultDate(date ?? ymd(demoNow)); setDialogOpen(true);
  }
  function openEdit(e: Ev) { setEditing(e); setDefaultDate(null); setDialogOpen(true); }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calendar & Standard Work</h1>
          <p className="text-sm text-muted-foreground">Audits, visits, events and the CEO weekly cadence.</p>
        </div>
        {tab === "calendar" && (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EventType | "all")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(TYPE_META) as EventType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={showArchived ? "secondary" : "outline"} size="sm" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? "Hide archived" : "Show archived"}
            </Button>
            <Button size="sm" onClick={() => openNew()}><Plus className="mr-1 h-4 w-4" />New event</Button>
          </div>
        )}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="standard-work">Standard Work</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="space-y-6">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setAnchor(demoNow)}>Today</Button>
                <Button variant="ghost" size="icon" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <h2 className="text-lg font-semibold">{monthLabel}</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_META) as EventType[]).map((t) => (
                  <span key={t} className={cn("rounded-md border px-2 py-0.5 text-xs", TYPE_META[t].color)}>{TYPE_META[t].label}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="bg-muted/60 px-2 py-1 font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map((d) => {
                const key = ymd(d); const isCurMonth = d.getMonth() === anchor.getMonth();
                const list = eventsByDay.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-[110px] bg-background p-1.5",
                      !isCurMonth && "bg-muted/30 text-muted-foreground",
                      key === todayKey && "ring-2 ring-inset ring-primary/60",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <button
                        onClick={() => openNew(key)}
                        className={cn("text-xs font-medium hover:text-primary", key === todayKey && "text-primary")}
                        title="Add event"
                      >
                        {d.getDate()}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {list.slice(0, 4).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => openEdit(e)}
                          className={cn(
                            "block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] hover:opacity-80",
                            TYPE_META[e.event_type]?.color ?? TYPE_META.other.color,
                            e.archived_at && "opacity-50 line-through",
                          )}
                          title={e.title}
                        >
                          {e.start_time && <span className="mr-1 font-mono">{e.start_time.slice(0, 5)}</span>}
                          {e.title}
                        </button>
                      ))}
                      {list.length > 4 && <div className="text-[10px] text-muted-foreground">+{list.length - 4} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Upcoming</h3>
            <div className="space-y-2">
              {filtered.filter((e) => e.event_date >= todayKey && !e.archived_at).slice(0, 15).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-[10px]", TYPE_META[e.event_type]?.color)}>{TYPE_META[e.event_type]?.label}</Badge>
                    <div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.event_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        {e.start_time && ` · ${e.start_time.slice(0, 5)}`}
                        {e.assignee_id && ` · ${ownerLabel(profileMap.get(e.assignee_id))}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => archiveMut.mutate(e)}>
                      {e.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { confirmThen(`Delete "${e.title}"?`, () => { deleteMut.mutate(e.id); }) }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.filter((e) => e.event_date >= todayKey && !e.archived_at).length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing scheduled ahead.</p>
              )}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="standard-work">
          <StandardWorkPanel />
        </TabsContent>
      </Tabs>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultDate={defaultDate}
        onSaved={() => qc.invalidateQueries({ queryKey: ["calendar-events"] })}
      />
    </div>
  );
}


function EventDialog({ open, onOpenChange, editing, defaultDate, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; editing: Ev | null; defaultDate: string | null; onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("audit");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title); setType(editing.event_type); setDate(editing.event_date);
      setStartTime(editing.start_time?.slice(0, 5) ?? ""); setEndTime(editing.end_time?.slice(0, 5) ?? "");
      setNotes(editing.notes ?? ""); setAssigneeId(editing.assignee_id);
    } else {
      setTitle(""); setType("audit"); setDate(defaultDate ?? ymd(new Date()));
      setStartTime(""); setEndTime(""); setNotes(""); setAssigneeId(null);
    }
  }, [open, editing, defaultDate]);

  async function save() {
    if (!title.trim() || !date) { toast.error("Title and date are required"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      event_type: type,
      event_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      notes: notes.trim() || null,
      assignee_id: assigneeId,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("calendar_events").update(payload).eq("id", editing.id));
    } else {
      const { data: userData } = await getCurrentUser();
      ({ error } = await supabase.from("calendar_events").insert({ ...payload, created_by: userData.user?.id ?? null }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Created");
    onSaved(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="EASA audit — Part 145" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_META) as EventType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Owner</Label>
            <OwnerSelect value={assigneeId} onChange={setAssigneeId} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
