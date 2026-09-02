import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPORT_TYPES, SOURCES } from "@/lib/safety";
import { RiskPicker } from "./risk-picker";
import { useCreateReport, uploadSafetyPhoto } from "./use-safety";
import { useActiveCompany } from "@/hooks/use-companies";

const schema = z.object({
  description: z.string().trim().min(5, "Describe the hazard or event (min 5 characters)").max(2000),
  location: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  reporter_name: z.string().trim().max(120).optional(),
  immediate_action: z.string().trim().max(1000).optional(),
  potential_consequence: z.string().trim().max(1000).optional(),
});

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ReportDialog({
  open,
  onOpenChange,
  walkId,
  defaultSource = "report",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  walkId?: string | null;
  defaultSource?: string;
}) {
  const { data: active } = useActiveCompany();
  const create = useCreateReport();
  const [busy, setBusy] = useState(false);

  const [reportType, setReportType] = useState("unsafe_condition");
  const [source, setSource] = useState(defaultSource);
  const [occurredAt, setOccurredAt] = useState(nowLocal);
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [reporter, setReporter] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [description, setDescription] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [consequence, setConsequence] = useState("");
  const [risk, setRisk] = useState({ severity: 3, likelihood: 2 });
  const [file, setFile] = useState<File | null>(null);

  function resetForm() {
    setReportType("unsafe_condition");
    setSource(defaultSource);
    setOccurredAt(nowLocal());
    setLocation("");
    setDepartment("");
    setReporter("");
    setAnonymous(false);
    setDescription("");
    setImmediateAction("");
    setConsequence("");
    setRisk({ severity: 3, likelihood: 2 });
    setFile(null);
  }

  async function submit() {
    const parsed = schema.safeParse({
      description,
      location,
      department,
      reporter_name: reporter,
      immediate_action: immediateAction,
      potential_consequence: consequence,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setBusy(true);
    try {
      let photo_path: string | null = null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Photo must be under 10MB");
        photo_path = await uploadSafetyPhoto(active!.company_id, file);
      }
      await create.mutateAsync({
        report_type: reportType,
        source,
        walk_id: walkId ?? null,
        occurred_at: new Date(occurredAt).toISOString(),
        location: location.trim() || null,
        department: department.trim() || null,
        reporter_name: anonymous ? null : reporter.trim() || null,
        anonymous,
        description: description.trim(),
        immediate_action: immediateAction.trim() || null,
        potential_consequence: consequence.trim() || null,
        photo_path,
        severity: risk.severity,
        likelihood: risk.likelihood,
        status: "open",
      });
      resetForm();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report a hazard, near miss or event</DialogTitle>
          <DialogDescription>
            Anything that could hurt someone. If there is imminent danger, stop work first and then report it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>What are you reporting?</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Shipping door 3" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Assembly" maxLength={120} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Forklift/pedestrian interaction near shipping door creates potential struck-by hazard."
              maxLength={2000}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Immediate action taken</Label>
              <Textarea rows={2} value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} maxLength={1000} />
            </div>
            <div className="space-y-1.5">
              <Label>Potential consequence</Label>
              <Textarea rows={2} value={consequence} onChange={(e) => setConsequence(e.target.value)} maxLength={1000} />
            </div>
          </div>

          <RiskPicker severity={risk.severity} likelihood={risk.likelihood} onChange={setRisk} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Your name</Label>
              <Input
                value={anonymous ? "" : reporter}
                disabled={anonymous}
                onChange={(e) => setReporter(e.target.value)}
                placeholder="Optional"
                maxLength={120}
              />
              <div className="flex items-center gap-2 pt-1">
                <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} />
                <Label htmlFor="anon" className="text-xs font-normal text-muted-foreground">Report anonymously</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Submit report"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
