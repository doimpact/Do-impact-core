import { useMemo, useState } from "react";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ABNORMALITY_FIELDS,
  ABNORMALITY_STATUSES,
  AM_CHECK_ITEMS,
  AM_LEVELS,
  tagMeta,
  type AmpmAbnormality,
  type AmpmAmCheck,
  type AmpmEquipment,
  type FieldSpec,
} from "@/lib/ampm";
import { RecordDialog, normalise } from "@/components/oms/bcm/record-dialog";
import { useCreateAmpm, useDeleteAmpm, useUpdateAmpm } from "./use-ampm";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function CheckSheetDialog({
  open,
  onOpenChange,
  equipment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  equipment: AmpmEquipment[];
}) {
  const create = useCreateAmpm("ampm_am_checks");
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState("Day");
  const [operator, setOperator] = useState("");
  const [items, setItems] = useState<Record<string, boolean>>({});
  const [abnormality, setAbnormality] = useState("");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);

  const passed = AM_CHECK_ITEMS.filter((i) => items[i.key]).length;

  async function submit() {
    setBusy(true);
    try {
      await create.mutateAsync({
        equipment_id: equipmentId || null,
        check_date: date,
        shift,
        operator_name: operator || null,
        items,
        items_passed: passed,
        items_total: AM_CHECK_ITEMS.length,
        abnormality_found: !!abnormality.trim(),
        abnormality: abnormality.trim() || null,
        action_taken: action.trim() || null,
      });
      onOpenChange(false);
      setItems({});
      setAbnormality("");
      setAction("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily operator check</DialogTitle>
          <DialogDescription>Clean → inspect → detect → report. Anything beyond authorised basic care goes to maintenance.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Equipment</Label>
            <Select value={equipmentId} onValueChange={setEquipmentId}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {equipment.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Shift</Label>
            <Input value={shift} onChange={(e) => setShift(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Operator</Label>
            <Input value={operator} onChange={(e) => setOperator(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>15-point check</span>
            <span className="text-muted-foreground">{passed}/{AM_CHECK_ITEMS.length} OK</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {AM_CHECK_ITEMS.map((i) => (
              <label key={i.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!items[i.key]}
                  onCheckedChange={(v) => setItems((s) => ({ ...s, [i.key]: !!v }))}
                />
                {i.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Abnormality found</Label>
          <Textarea rows={2} value={abnormality} onChange={(e) => setAbnormality(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Action taken / reported to</Label>
          <Textarea rows={2} value={action} onChange={(e) => setAction(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Save check</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AmPanel({
  equipment,
  checks,
  abnormalities,
}: {
  equipment: AmpmEquipment[];
  checks: AmpmAmCheck[];
  abnormalities: AmpmAbnormality[];
}) {
  const [checkOpen, setCheckOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [edit, setEdit] = useState<AmpmAbnormality | null>(null);
  const create = useCreateAmpm("ampm_abnormalities");
  const update = useUpdateAmpm("ampm_abnormalities");
  const del = useDeleteAmpm("ampm_abnormalities");

  const nameOf = useMemo(() => {
    const m = new Map(equipment.map((e) => [e.id, e.name]));
    return (id: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [equipment]);

  const fields: FieldSpec[] = useMemo(
    () => [
      { name: "equipment_id", label: "Equipment", kind: "select", options: equipment.map((e) => ({ key: e.id, label: e.name })) },
      ...ABNORMALITY_FIELDS,
    ],
    [equipment],
  );

  const openTags = abnormalities.filter((a) => a.status !== "closed" && a.status !== "verified");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Abnormality tags</h3>
            <p className="text-sm text-muted-foreground">
              Detect → tag → report → assess → run / plan / stop → correct → verify → remove tag. {openTags.length} open.
            </p>
          </div>
          <Button className="no-print" onClick={() => { setEdit(null); setTagOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Raise tag
          </Button>
        </div>

        {abnormalities.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No abnormalities tagged yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Tag</th>
                  <th className="p-3">Abnormality</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Found</th>
                  <th className="p-3">Safe to run</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 no-print" />
                </tr>
              </thead>
              <tbody>
                {abnormalities.map((a) => {
                  const t = tagMeta(a.tag_colour);
                  return (
                    <tr key={a.id} className="border-t align-top">
                      <td className="p-3"><Badge className={t.className}>{t.label}</Badge></td>
                      <td className="max-w-[22rem] p-3">
                        <button className="text-left font-medium hover:underline" onClick={() => { setEdit(a); setTagOpen(true); }}>
                          {a.description}
                        </button>
                        {a.corrective_action && <div className="text-xs text-muted-foreground">{a.corrective_action}</div>}
                      </td>
                      <td className="p-3 text-muted-foreground">{nameOf(a.equipment_id)}</td>
                      <td className="p-3 text-muted-foreground">{a.found_on}{a.found_by ? ` · ${a.found_by}` : ""}</td>
                      <td className="p-3">
                        {a.can_run_safely ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white"><TriangleAlert className="mr-1 h-3 w-3" /> No</Badge>
                        )}
                      </td>
                      <td className="p-3">{a.owner_name || <span className="text-destructive">Unassigned</span>}</td>
                      <td className="p-3 text-muted-foreground">{a.due_date || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {ABNORMALITY_STATUSES.find((s) => s.key === a.status)?.label ?? a.status}
                        </Badge>
                      </td>
                      <td className="p-3 no-print">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del.mutate(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Operator daily checks</h3>
            <p className="text-sm text-muted-foreground">
              AM levels: {AM_LEVELS.map((l) => l.label.replace(" — ", " ")).join(" · ")}.
            </p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => setCheckOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Log check
          </Button>
        </div>

        {checks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No operator checks logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Equipment</th>
                  <th className="p-3">Shift</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Abnormality</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 40).map((c) => (
                  <tr key={c.id} className="border-t align-top">
                    <td className="p-3">{c.check_date}</td>
                    <td className="p-3 text-muted-foreground">{nameOf(c.equipment_id)}</td>
                    <td className="p-3 text-muted-foreground">{c.shift || "—"}</td>
                    <td className="p-3 text-muted-foreground">{c.operator_name || "—"}</td>
                    <td className="p-3">
                      <Badge variant={c.items_passed === c.items_total ? "default" : "outline"}>
                        {c.items_passed ?? 0}/{c.items_total ?? AM_CHECK_ITEMS.length}
                      </Badge>
                    </td>
                    <td className="max-w-[22rem] p-3 text-muted-foreground">{c.abnormality || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CheckSheetDialog open={checkOpen} onOpenChange={setCheckOpen} equipment={equipment} />

      <RecordDialog
        open={tagOpen}
        onOpenChange={setTagOpen}
        title={edit ? "Edit abnormality tag" : "Raise abnormality tag"}
        description="Red = immediate attention. Yellow = plan maintenance. Green = monitor."
        fields={fields}
        initial={
          edit
            ? ({ ...edit } as Record<string, unknown>)
            : { tag_colour: "yellow", found_on: today(), can_run_safely: true, status: "open" }
        }
        onSubmit={async (v) => {
          const patch = normalise(fields, v);
          if (edit) await update.mutateAsync({ id: edit.id, patch });
          else await create.mutateAsync(patch);
        }}
      />
    </div>
  );
}
