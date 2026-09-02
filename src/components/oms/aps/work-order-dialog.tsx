import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { promptDialog } from "@/components/confirm-dialog";
import { assertWrote } from "@/lib/write-guard";
import { type ApsComponent, type ApsWorkCenter, type ApsWorkOrder, type ApsTooling, zoneFor, kitStatus, addDays, startOfToday } from "@/lib/aps";

type Props = {
  companyId: string;
  valueStreamId: string;
  workCenters: ApsWorkCenter[];
  tooling: ApsTooling[];
  order: ApsWorkOrder | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

type Form = {
  wo_number: string;
  part_number: string;
  description: string;
  qty: number;
  due_date: string;
  scheduled_start: string;
  setup_minutes: number;
  run_minutes_per_unit: number;
  work_center_id: string;
  family: string;
  required_skill: string;
  tooling_id: string;
  priority: number;
  expedite: boolean;
  status: string;
  source: string;
};

const STATUSES = ["planned", "released", "in_progress", "done", "on_hold"];

function blank(): Form {
  const today = startOfToday();
  return {
    wo_number: "",
    part_number: "",
    description: "",
    qty: 1,
    due_date: addDays(today, 21),
    scheduled_start: addDays(today, 14),
    setup_minutes: 60,
    run_minutes_per_unit: 30,
    work_center_id: "",
    family: "",
    required_skill: "",
    tooling_id: "",
    priority: 3,
    expedite: false,
    status: "planned",
    source: "manual",
  };
}

export function WorkOrderDialog({ companyId, valueStreamId, workCenters, tooling, order, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(blank());
  const [fieldErrors, setFieldErrors] = useState<{ wo_number?: string; part_number?: string }>({});
  const woRef = useRef<HTMLInputElement>(null);
  const partRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!open) return;
    setForm(
      order
        ? {
            wo_number: order.wo_number,
            part_number: order.part_number,
            description: order.description ?? "",
            qty: order.qty,
            due_date: order.due_date,
            scheduled_start: order.scheduled_start,
            setup_minutes: order.setup_minutes,
            run_minutes_per_unit: order.run_minutes_per_unit,
            work_center_id: order.work_center_id ?? "",
            family: order.family ?? "",
            required_skill: order.required_skill ?? "",
            tooling_id: order.tooling_id ?? "",
            priority: order.priority,
            expedite: order.expedite,
            status: order.status,
            source: order.source ?? "manual",
          }
        : blank(),
    );
    setFieldErrors({});
    // Re-sync only when the dialog opens or a different order is edited, so a
    // background refetch cannot wipe what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  const componentsQ = useQuery({
    queryKey: ["aps-components", order?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("aps_components").select("*").eq("work_order_id", order!.id).order("part_number");
      if (error) throw error;
      return (data ?? []) as ApsComponent[];
    },
    enabled: !!order?.id && open,
  });
  const components = componentsQ.data ?? [];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["aps-orders"] });
    void qc.invalidateQueries({ queryKey: ["aps-components"] });
    void qc.invalidateQueries({ queryKey: ["aps-log"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      // Fall back to what is actually in the inputs: autofill / IME entry can set
      // a visible value without React state ever seeing a change event.
      const woNumber = (form.wo_number.trim() || woRef.current?.value.trim() || "");
      const partNumber = (form.part_number.trim() || partRef.current?.value.trim() || "");
      if (!woNumber || !partNumber) {
        console.warn("[work-order] missing required fields", {
          state: { wo_number: form.wo_number, part_number: form.part_number },
          dom: { wo_number: woRef.current?.value, part_number: partRef.current?.value },
        });
        setFieldErrors({
          wo_number: woNumber ? undefined : "Enter a work order number.",
          part_number: partNumber ? undefined : "Enter a part number.",
        });
        (woNumber ? partRef : woRef).current?.focus();
        throw new Error("SILENT_VALIDATION");
      }
      setFieldErrors({});
      setForm((f) => ({ ...f, wo_number: woNumber, part_number: partNumber }));
      const payload = {
        wo_number: woNumber,
        part_number: partNumber,
        description: form.description.trim() || null,

        qty: Number(form.qty),
        due_date: form.due_date,
        scheduled_start: form.scheduled_start,
        setup_minutes: Number(form.setup_minutes),
        run_minutes_per_unit: Number(form.run_minutes_per_unit),
        work_center_id: form.work_center_id || null,
        family: form.family.trim() || null,
        required_skill: form.required_skill.trim() || null,
        tooling_id: form.tooling_id || null,
        priority: Number(form.priority),
        expedite: form.expedite,
        status: form.status,
        source: form.source.trim() || null,
      };

      if (!order) {
        const { error } = await supabase
          .from("aps_work_orders")
          .insert({ ...payload, company_id: companyId, value_stream_id: valueStreamId });
        if (error) throw error;
        return;
      }

      // Frozen-zone protection: locked changes need a supervisor override reason.
      const frozen = zoneFor(order.scheduled_start) === "frozen";
      const lockedChange =
        order.scheduled_start !== payload.scheduled_start || order.qty !== payload.qty || order.due_date !== payload.due_date;
      let reason: string | null = null;
      if (frozen && lockedChange) {
        reason = await promptDialog({
          title: "Frozen zone — supervisor override",
          description: "This work order is inside the frozen zone (0–2 weeks). Record why the date or quantity is changing.",
          label: "Override reason",
          placeholder: "Emergency breakdown, customer expedite…",
        });
        if (!reason) throw new Error("Override cancelled — the frozen work order was not changed.");
      }

      const { data, error } = await supabase.from("aps_work_orders").update(payload).eq("id", order.id).select("id");
      if (error) throw error;
      assertWrote(data, "edit");

      if (reason) {
        await supabase.from("aps_schedule_log").insert({
          company_id: companyId,
          work_order_id: order.id,
          zone: "frozen",
          action: "override",
          from_value: `${order.scheduled_start} · qty ${order.qty} · due ${order.due_date}`,
          to_value: `${payload.scheduled_start} · qty ${payload.qty} · due ${payload.due_date}`,
          reason,
          override: true,
        });
      }
    },
    onSuccess: () => {
      invalidate();
      onOpenChange(false);
      toast.success(order ? "Work order updated" : "Work order created");
    },
    onError: (e: Error) => {
      if (e.message === "SILENT_VALIDATION") return;
      toast.error(e.message);
    },
  });

  const [comp, setComp] = useState({ part_number: "", qty_required: 1, qty_on_hand: 0, qty_allocated: 0, lot_serial: "", inbound_po: "", inbound_date: "", long_lead: false });

  const addComponent = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Save the work order first.");
      if (!comp.part_number.trim()) throw new Error("Component part number is required.");
      const { error } = await supabase.from("aps_components").insert({
        company_id: companyId,
        work_order_id: order.id,
        part_number: comp.part_number.trim(),
        qty_required: Number(comp.qty_required),
        qty_on_hand: Number(comp.qty_on_hand),
        qty_allocated: Number(comp.qty_allocated),
        lot_serial: comp.lot_serial.trim() || null,
        inbound_po: comp.inbound_po.trim() || null,
        inbound_date: comp.inbound_date || null,
        long_lead: comp.long_lead,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setComp({ part_number: "", qty_required: 1, qty_on_hand: 0, qty_allocated: 0, lot_serial: "", inbound_po: "", inbound_date: "", long_lead: false });
      toast.success("Component added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeComponent = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("aps_components").delete().eq("id", id).select("id");
      if (error) throw error;
      assertWrote(data, "delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Component removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setKitReady = useMutation({
    mutationFn: async (ready: boolean) => {
      const { data, error } = await supabase.from("aps_work_orders").update({ kit_ready: ready }).eq("id", order!.id).select("id");
      if (error) throw error;
      assertWrote(data, "update");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Kit status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kit = kitStatus(components);
  const zone = zoneFor(form.scheduled_start);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {order ? `Work order ${order.wo_number}` : "New work order"}
            <Badge variant="outline" className="capitalize">
              {zone === "outside" ? "beyond horizon" : `${zone} zone`}
            </Badge>
            {zone === "frozen" && <Lock className="h-4 w-4 text-muted-foreground" />}
          </DialogTitle>
          <DialogDescription>
            {zone === "frozen"
              ? "Frozen: dates and quantity are locked — a change asks for a supervisor override reason and is logged."
              : zone === "firm"
                ? "Firm: re-sequencing is allowed, keep the weekly volume balanced."
                : "Flexible: level capacity and peg materials freely."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="materials">Materials &amp; kitting</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wo-num">WO number</Label>
              <Input
                id="wo-num"
                ref={woRef}
                value={form.wo_number}
                onChange={(e) => {
                  setForm({ ...form, wo_number: e.target.value });
                  if (fieldErrors.wo_number) setFieldErrors((f) => ({ ...f, wo_number: undefined }));
                }}
                placeholder="WO-10234"
                aria-invalid={!!fieldErrors.wo_number}
              />
              {fieldErrors.wo_number && <p className="text-xs text-destructive">{fieldErrors.wo_number}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-part">Part number</Label>
              <Input
                id="wo-part"
                ref={partRef}
                value={form.part_number}
                onChange={(e) => {
                  setForm({ ...form, part_number: e.target.value });
                  if (fieldErrors.part_number) setFieldErrors((f) => ({ ...f, part_number: undefined }));
                }}
                aria-invalid={!!fieldErrors.part_number}
              />
              {fieldErrors.part_number && <p className="text-xs text-destructive">{fieldErrors.part_number}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="wo-desc">Description</Label>
              <Textarea id="wo-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-qty">Quantity</Label>
              <Input id="wo-qty" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-wc">Work center</Label>
              <select
                id="wo-wc"
                className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={form.work_center_id}
                onChange={(e) => setForm({ ...form, work_center_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {workCenters.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-start">Scheduled start</Label>
              <Input id="wo-start" type="date" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-due">Due date</Label>
              <Input id="wo-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-setup">Setup minutes</Label>
              <Input id="wo-setup" type="number" value={form.setup_minutes} onChange={(e) => setForm({ ...form, setup_minutes: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-run">Run minutes / unit</Label>
              <Input
                id="wo-run"
                type="number"
                value={form.run_minutes_per_unit}
                onChange={(e) => setForm({ ...form, run_minutes_per_unit: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-family">Setup family</Label>
              <Input id="wo-family" value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} placeholder="Ti roughing" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-skill">Required certification</Label>
              <Input id="wo-skill" value={form.required_skill} onChange={(e) => setForm({ ...form, required_skill: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-tool">Tooling / fixture</Label>
              <select
                id="wo-tool"
                className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={form.tooling_id}
                onChange={(e) => setForm({ ...form, tooling_id: e.target.value })}
              >
                <option value="">None</option>
                {tooling.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-status">Status</Label>
              <select
                id="wo-status"
                className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wo-prio">Priority (1 = highest)</Label>
              <Input id="wo-prio" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.expedite} onChange={(e) => setForm({ ...form, expedite: e.target.checked })} />
              Expedite — jump the dispatch queue
            </label>
          </TabsContent>

          <TabsContent value="materials" className="mt-4 space-y-3">
            {!order ? (
              <p className="text-sm text-muted-foreground">Save the work order first, then peg its components here.</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={kit.ready ? "default" : "destructive"}>{kit.ready ? "Kit ready" : `${kit.short.length} short`}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setKitReady.mutate(!order.kit_ready)}>
                    {order.kit_ready ? "Mark kit not ready" : "Mark kit ready for release"}
                  </Button>
                </div>
                <div className="space-y-1">
                  {components.map((c) => {
                    const free = c.qty_on_hand - c.qty_allocated;
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                        <span>
                          <span className="font-medium">{c.part_number}</span> · need {c.qty_required}, free {free}
                          {c.lot_serial && <span className="text-muted-foreground"> · lot {c.lot_serial}</span>}
                          {c.inbound_po && (
                            <span className="text-muted-foreground">
                              {" "}
                              · PO {c.inbound_po} {c.inbound_date ?? ""}
                            </span>
                          )}
                          {c.long_lead && <Badge variant="outline" className="ml-2">long lead</Badge>}
                          {free < c.qty_required && <Badge variant="destructive" className="ml-2">short</Badge>}
                        </span>
                        <button className="text-muted-foreground hover:text-destructive" onClick={() => removeComponent.mutate(c.id)} aria-label="Remove component">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  {components.length === 0 && <p className="text-sm text-muted-foreground">No components pegged yet.</p>}
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <Input placeholder="Part number" value={comp.part_number} onChange={(e) => setComp({ ...comp, part_number: e.target.value })} />
                  <Input type="number" placeholder="Required" value={comp.qty_required} onChange={(e) => setComp({ ...comp, qty_required: Number(e.target.value) })} />
                  <Input type="number" placeholder="On hand" value={comp.qty_on_hand} onChange={(e) => setComp({ ...comp, qty_on_hand: Number(e.target.value) })} />
                  <Input type="number" placeholder="Allocated" value={comp.qty_allocated} onChange={(e) => setComp({ ...comp, qty_allocated: Number(e.target.value) })} />
                  <Input placeholder="Lot / serial" value={comp.lot_serial} onChange={(e) => setComp({ ...comp, lot_serial: e.target.value })} />
                  <Input placeholder="Inbound PO" value={comp.inbound_po} onChange={(e) => setComp({ ...comp, inbound_po: e.target.value })} />
                  <Input type="date" value={comp.inbound_date} onChange={(e) => setComp({ ...comp, inbound_date: e.target.value })} aria-label="Inbound date" />
                  <Button size="sm" onClick={() => addComponent.mutate()}>
                    <Plus className="mr-1 h-4 w-4" /> Add component
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={comp.long_lead} onChange={(e) => setComp({ ...comp, long_lead: e.target.checked })} /> Long-lead item
                </label>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {order ? "Save changes" : "Create work order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
