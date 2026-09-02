import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ClipboardList, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { confirmDialog } from "@/components/confirm-dialog";
import { useActiveCompany } from "@/hooks/use-companies";
import { cn } from "@/lib/utils";
import { PfmeaWizard } from "./pfmea-wizard";
import { PfmeaWorksheet } from "./pfmea-worksheet";
import { usePfmeaMutations, usePfmeaRowCounts, usePfmeaStudies } from "./use-pfmea";
import { AP_LABEL, PROCESS_FAMILIES, actionPriority, apClasses, type PfmeaStudy } from "./pfmea-types";

export function PfmeaPanel() {
  const { data: studies = [], isLoading } = usePfmeaStudies();
  const { data: counts = [] } = usePfmeaRowCounts();
  const { updateStudy, deleteStudy, duplicateStudy } = usePfmeaMutations();
  const { data: active } = useActiveCompany();

  const [openId, setOpenId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<PfmeaStudy | null>(null);

  const stats = useMemo(() => {
    const map = new Map<string, { rows: number; high: number; openActions: number }>();
    for (const r of counts) {
      const entry = map.get(r.study_id) ?? { rows: 0, high: 0, openActions: 0 };
      entry.rows += 1;
      if (actionPriority(r.severity, r.occurrence, r.detection) === "H") entry.high += 1;
      if (r.action_status === "open" || r.action_status === "in_progress") entry.openActions += 1;
      map.set(r.study_id, entry);
    }
    return map;
  }, [counts]);

  const archivedCount = studies.filter((s) => s.archived_at).length;
  const activeCount = studies.length - archivedCount;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return studies.filter((s) => {
      if (!showArchived && s.archived_at) return false;
      if (!needle) return true;
      return [s.title, s.part_number, s.part_name, s.customer, s.program]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [studies, showArchived, q]);

  const openStudy = openId ? studies.find((s) => s.id === openId) ?? null : null;
  if (openStudy) return <PfmeaWorksheet study={openStudy} onBack={() => setOpenId(null)} />;

  async function toggleArchive(study: PfmeaStudy) {
    const archiving = !study.archived_at;
    try {
      await updateStudy.mutateAsync({
        id: study.id,
        patch: {
          archived_at: archiving ? new Date().toISOString() : null,
          status: archiving ? "archived" : "draft",
        },
      });
      toast.success(archiving ? "PFMEA archived" : "PFMEA restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the PFMEA");
    }
  }

  async function remove(study: PfmeaStudy) {
    const ok = await confirmDialog({
      title: "Delete this PFMEA?",
      description: `"${study.title ?? study.part_number}" and all of its worksheet lines will be permanently removed.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteStudy.mutateAsync(study.id);
      toast.success("PFMEA deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the PFMEA");
    }
  }

  async function duplicate(study: PfmeaStudy) {
    try {
      await duplicateStudy.mutateAsync(study);
      toast.success("PFMEA duplicated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate the PFMEA");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6" /> PFMEA</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Guided Process FMEA to AIAG-VDA. Start from typed routing steps, an imported routing, or a drawing —
            the assistant drafts failure modes, effects, causes, controls and ratings for you to review.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}><Plus className="h-4 w-4 mr-1" /> New PFMEA</Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Input className="max-w-xs" placeholder="Search part / customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex items-center gap-2">
          <Switch id="pfmea-archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="pfmea-archived" className="text-sm">Show archived</Label>
        </div>
        <span className="text-sm text-muted-foreground">{activeCount} active · {archivedCount} archived</span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              {["PFMEA", "Part", "Customer / program", "Process", "Lines", "High AP", "Open actions", "Status", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && visible.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                No PFMEAs yet — create one to get started.
              </td></tr>
            )}
            {visible.map((s) => {
              const stat = stats.get(s.id) ?? { rows: 0, high: 0, openActions: 0 };
              return (
                <tr key={s.id} className={cn("border-t", s.archived_at && "opacity-60")}>
                  <td className="px-3 py-2">
                    <button className="font-medium text-left hover:underline" onClick={() => setOpenId(s.id)}>
                      {s.title ?? `PFMEA — ${s.part_number}`}
                    </button>
                    {s.archived_at && <Badge variant="outline" className="ml-2">Archived</Badge>}
                  </td>
                  <td className="px-3 py-2">
                    <div>{s.part_number}</div>
                    <div className="text-xs text-muted-foreground">{s.part_name}{s.revision ? ` · Rev ${s.revision}` : ""}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{[s.customer, s.program].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-3 py-2">{PROCESS_FAMILIES.find((f) => f.value === s.process_family)?.label ?? s.process_family}</td>
                  <td className="px-3 py-2 font-mono">{stat.rows}</td>
                  <td className="px-3 py-2">
                    {stat.high > 0
                      ? <Badge variant="outline" className={apClasses("H")}>{stat.high} {AP_LABEL.H}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 font-mono">{stat.openActions}</td>
                  <td className="px-3 py-2 capitalize">{s.status}</td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setOpenId(s.id)}>Open</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(s)}><Pencil className="h-4 w-4 mr-2" /> Edit details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void duplicate(s)}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void toggleArchive(s)}>
                          {s.archived_at
                            ? <><ArchiveRestore className="h-4 w-4 mr-2" /> Restore</>
                            : <><Archive className="h-4 w-4 mr-2" /> Archive</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => void remove(s)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PfmeaWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        companyId={active?.company_id ?? null}
        onCreated={(study) => setOpenId(study.id)}
      />

      <EditStudyDialog
        study={editing}
        onClose={() => setEditing(null)}
        onSave={async (patch) => {
          if (!editing) return;
          try {
            await updateStudy.mutateAsync({ id: editing.id, patch });
            toast.success("PFMEA updated");
            setEditing(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not update the PFMEA");
          }
        }}
      />
    </div>
  );
}

function EditStudyDialog({
  study,
  onClose,
  onSave,
}: {
  study: PfmeaStudy | null;
  onClose: () => void;
  onSave: (patch: Partial<PfmeaStudy>) => void;
}) {
  const [draft, setDraft] = useState<Partial<PfmeaStudy>>({});
  const value = { ...study, ...draft } as PfmeaStudy;
  if (!study) return null;

  return (
    <Dialog open={!!study} onOpenChange={(o) => { if (!o) { setDraft({}); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit PFMEA details</DialogTitle>
          <DialogDescription>Header information only — worksheet lines are edited inside the PFMEA.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={value.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value || null })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Part number</Label>
              <Input value={value.part_number} onChange={(e) => setDraft({ ...draft, part_number: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Part name</Label>
              <Input value={value.part_name ?? ""} onChange={(e) => setDraft({ ...draft, part_name: e.target.value || null })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Customer</Label>
              <Input value={value.customer ?? ""} onChange={(e) => setDraft({ ...draft, customer: e.target.value || null })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Program</Label>
              <Input value={value.program ?? ""} onChange={(e) => setDraft({ ...draft, program: e.target.value || null })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Process family</Label>
              <Select value={value.process_family} onValueChange={(v) => setDraft({ ...draft, process_family: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROCESS_FAMILIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={value.status} onValueChange={(v) => setDraft({ ...draft, status: v as PfmeaStudy["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Revision</Label>
              <Input value={value.revision ?? ""} onChange={(e) => setDraft({ ...draft, revision: e.target.value || null })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={3} value={value.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setDraft({}); onClose(); }}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
