import { getCurrentUser } from "@/lib/auth-session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, ShieldAlert, Archive, Trash2, Lock, CheckCircle2, Circle, ArrowRight, MoreHorizontal, Eye, RotateCcw } from "lucide-react";
import { OwnerSelect, useProfiles, ownerLabel } from "@/components/owner-select";
import {
  DISCIPLINES, EIGHT_D_SEVERITY_META, EIGHT_D_STATUS_META, completionPct,
  isDisciplineLocked, type EightD, type EightDSeverity, type EightDStatus,
} from "@/lib/eight-d";

export const Route = createFileRoute("/_authenticated/actions/problem-solver/eight-d")({
  head: () => ({
    meta: [
      { title: "8D Problem Solving — DO.Impact" },
      { name: "description", content: "Run the Eight Disciplines (8D) method for high-severity quality escapes: containment, root cause of occurrence and escape, permanent corrective actions and systemic prevention." },
      { property: "og:title", content: "8D Problem Solving — DO.Impact" },
      { property: "og:description", content: "Eight Disciplines problem solving with containment, dual root-cause analysis and systemic prevention." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EightDPage,
});

const STATUSES = Object.keys(EIGHT_D_STATUS_META) as EightDStatus[];

function EightDPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | EightDStatus>("all");
  const [selected, setSelected] = useState<EightD | null>(null);
  const [editing, setEditing] = useState<EightD | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<EightD | null>(null);

  const listQ = useQuery({
    queryKey: ["eight_d"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eight_d_reports")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EightD[];
    },
  });

  const rows = Array.isArray(listQ.data) ? listQ.data : [];
  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );
  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<EightDStatus, number>;
    rows.forEach((r) => { c[r.status]++; });
    return c;
  }, [rows]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["eight_d"] });

  const updateStatus = async (r: EightD, status: EightDStatus) => {
    const { error } = await supabase.from("eight_d_reports").update({ status } as never).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    invalidate();
    setSelected(null);
  };

  const remove = async (r: EightD) => {
    const { error } = await supabase.from("eight_d_reports").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("8D deleted");
    invalidate();
    setConfirmDel(null);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldAlert className="h-6 w-6" /> 8D Problem Solving
          </h1>
          <p className="text-sm text-muted-foreground">
            Eight Disciplines for high-severity escapes — emergency response, containment, dual root cause, permanent corrective action and systemic prevention.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" /> New 8D
        </Button>
      </div>

      <WhenToUsePanel />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-lg border p-3 text-left transition ${
              statusFilter === s ? "border-primary bg-primary/5" : "border-border bg-card hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {EIGHT_D_STATUS_META[s].label}
            </div>
            <div className="mt-1 text-2xl font-bold">{counts[s]}</div>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No 8D reports yet. Click <span className="font-medium">New 8D</span> to open one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Severity</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Progress</th>
                <th className="px-4 py-2 text-left font-medium">Updated</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <button className="text-left" onClick={() => setSelected(r)}>
                      <div className="flex items-center gap-2 font-medium">
                        {r.emergency_response && <ShieldAlert className="h-3.5 w-3.5 text-red-600" />}
                        {r.title}
                      </div>
                      {r.reference && <div className="text-xs text-muted-foreground">{r.reference}</div>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${EIGHT_D_SEVERITY_META[r.severity].className}`}>
                      {EIGHT_D_SEVERITY_META[r.severity].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${EIGHT_D_STATUS_META[r.status].className}`}>
                      {EIGHT_D_STATUS_META[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar pct={completionPct(r)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Actions for ${r.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setSelected(r)}>
                          <Eye className="mr-2 h-4 w-4" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditing(r)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {r.status === "archived" ? (
                          <DropdownMenuItem onSelect={() => updateStatus(r, "draft")}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => updateStatus(r, "archived")}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onSelect={() => setConfirmDel(r)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ViewerDialog
          report={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null); }}
          onClosed={() => updateStatus(selected, "closed")}
          onArchive={() => updateStatus(selected, "archived")}
          onRestore={() => updateStatus(selected, "draft")}
          onDelete={() => setConfirmDel(selected)}
        />
      )}
      {editing && (
        <EditorDialog
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this 8D?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{confirmDel?.title}&rdquo; will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && remove(confirmDel)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground">{pct}%</span>
    </div>
  );
}

function WhenToUsePanel() {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
      <div className="rounded-lg border border-border p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Use A3 when</div>
        <p className="mt-1 text-sm">
          Local continuous improvement, daily process flow and localized waste reduction — told on a single page.
        </p>
        <Link to="/actions/problem-solver/a3" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
          Go to A3 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Use 8D when</div>
        <p className="mt-1 text-sm">
          High-severity quality escapes, recurring technical failures and complex systemic issues that need strict
          customer or regulatory documentation and mandatory containment.
        </p>
      </div>
    </div>
  );
}

function ViewerDialog({
  report, onClose, onEdit, onClosed, onArchive, onRestore, onDelete,
}: {
  report: EightD;
  onClose: () => void;
  onEdit: () => void;
  onClosed: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { data: profiles = [] } = useProfiles();
  const owner = report.owner_id ? profiles.find((p) => p.id === report.owner_id) : undefined;
  const done = new Set(report.completed_disciplines ?? []);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">8D Report</div>
          <DialogTitle className="text-xl">{report.title}</DialogTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 ${EIGHT_D_STATUS_META[report.status].className}`}>
              {EIGHT_D_STATUS_META[report.status].label}
            </span>
            <span className={`rounded px-2 py-0.5 ${EIGHT_D_SEVERITY_META[report.severity].className}`}>
              {EIGHT_D_SEVERITY_META[report.severity].label}
            </span>
            <span className="text-muted-foreground">👤 {ownerLabel(owner)}</span>
            {report.emergency_response && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">Emergency response applied</span>
            )}
          </div>
          <div className="mt-2"><ProgressBar pct={completionPct(report)} /></div>
        </DialogHeader>

        <div className="space-y-3">
          {DISCIPLINES.map((d) => (
            <div key={d.code} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                {done.has(d.code)
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  : <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                <div className="flex-1">
                  <div className="text-sm font-semibold">{d.code} — {d.title}</div>
                  <p className="text-[11px] text-muted-foreground">{d.description}</p>
                </div>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {d.fields.map((f) => {
                  const v = report[f.key];
                  const display = f.kind === "boolean" ? (v ? "Yes" : "No") : v == null || v === "" ? null : String(v);
                  return (
                    <div key={String(f.key)} className="rounded border border-border bg-background p-2">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</div>
                      <div className="mt-0.5 whitespace-pre-wrap text-sm">
                        {display ?? <span className="italic text-muted-foreground">Empty</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {report.status !== "closed" && (
              <Button variant="outline" onClick={onClosed}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark closed
              </Button>
            )}
            {report.status !== "archived" ? (
              <Button variant="outline" onClick={onArchive}>
                <Archive className="mr-1 h-4 w-4" /> Archive
              </Button>
            ) : (
              <Button variant="outline" onClick={onRestore}>
                <RotateCcw className="mr-1 h-4 w-4" /> Restore
              </Button>
            )}
            <Button variant="ghost" className="text-red-600" onClick={onDelete}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={onEdit}><Pencil className="mr-1 h-4 w-4" /> Edit</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type FormState = Record<string, unknown>;

function EditorDialog({
  initial, onCancel, onSaved,
}: {
  initial: EightD | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    const base: FormState = {
      title: initial?.title ?? "",
      reference: initial?.reference ?? "",
      status: (initial?.status ?? "draft") as EightDStatus,
      severity: (initial?.severity ?? "medium") as EightDSeverity,
      owner_id: initial?.owner_id ?? null,
      completed_disciplines: initial?.completed_disciplines ?? [],
    };
    DISCIPLINES.forEach((d) => d.fields.forEach((f) => {
      const v = initial ? initial[f.key] : undefined;
      base[f.key as string] = f.kind === "boolean" ? Boolean(v) : f.kind === "number" ? (v ?? "") : (v ?? "");
    }));
    return base;
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const doneList = (form.completed_disciplines as string[]) ?? [];

  const toggleDone = (code: string) => {
    const locked = isDisciplineLocked(code, form as Partial<EightD>);
    if (locked && !doneList.includes(code)) return toast.error(locked);
    set(
      "completed_disciplines",
      doneList.includes(code) ? doneList.filter((c) => c !== code) : [...doneList, code],
    );
  };

  const save = async () => {
    if (!String(form.title).trim()) return toast.error("Title required");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      // normalise empty strings to null and numbers/dates
      DISCIPLINES.forEach((d) => d.fields.forEach((f) => {
        const key = f.key as string;
        const v = payload[key];
        if (f.kind === "boolean") payload[key] = Boolean(v);
        else if (v === "" || v == null) payload[key] = null;
        else if (f.kind === "number") payload[key] = Number(v);
      }));
      if (payload.reference === "") payload.reference = null;

      const { data: userData } = await getCurrentUser();
      if (initial) {
        const { error } = await supabase.from("eight_d_reports").update(payload as never).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("eight_d_reports").insert({
          ...payload,
          created_by: userData.user?.id,
          owner_id: (payload.owner_id as string | null) ?? userData.user?.id,
        } as never);
        if (error) throw error;
      }
      toast.success("Saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit 8D" : "New 8D"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <label className="text-xs font-medium">Title</label>
              <Input value={String(form.title)} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Status</label>
              <Select value={String(form.status)} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{EIGHT_D_STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Severity</label>
              <Select value={String(form.severity)} onValueChange={(v) => set("severity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(EIGHT_D_SEVERITY_META) as EightDSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>{EIGHT_D_SEVERITY_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Reference / NCR number</label>
              <Input value={String(form.reference ?? "")} onChange={(e) => set("reference", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Owner</label>
              <OwnerSelect value={(form.owner_id as string | null) ?? null} onChange={(v) => set("owner_id", v)} />
            </div>
          </div>

          {DISCIPLINES.map((d) => {
            const locked = isDisciplineLocked(d.code, form as Partial<EightD>);
            const isDone = doneList.includes(d.code);
            return (
              <div key={d.code} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{d.code} — {d.title}</div>
                    <p className="text-[11px] text-muted-foreground">{d.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isDone ? "default" : "outline"}
                    onClick={() => toggleDone(d.code)}
                  >
                    {locked && !isDone ? <Lock className="mr-1 h-3.5 w-3.5" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                    {isDone ? "Complete" : "Mark complete"}
                  </Button>
                </div>
                {locked && !isDone && (
                  <div className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">{locked}</div>
                )}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {d.fields.map((f) => {
                    const key = f.key as string;
                    if (f.kind === "boolean") {
                      return (
                        <label key={key} className="flex items-center gap-2 self-start rounded border border-border p-2 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(form[key])}
                            onChange={(e) => set(key, e.target.checked)}
                          />
                          {f.label}
                        </label>
                      );
                    }
                    if (f.kind === "number" || f.kind === "date") {
                      return (
                        <div key={key}>
                          <label className="text-xs font-medium">{f.label}</label>
                          <Input
                            type={f.kind === "number" ? "number" : "date"}
                            value={String(form[key] ?? "")}
                            onChange={(e) => set(key, e.target.value)}
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={key}>
                        <label className="text-xs font-medium">{f.label}</label>
                        <Textarea
                          rows={f.rows ?? 3}
                          placeholder={f.placeholder}
                          value={String(form[key] ?? "")}
                          onChange={(e) => set(key, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={save} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
