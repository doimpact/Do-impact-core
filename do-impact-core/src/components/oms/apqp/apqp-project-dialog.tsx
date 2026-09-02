import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APQP_PHASES, PROJECT_STATUSES, type ApqpProject } from "@/lib/apqp";
import { usePfmeaStudies } from "@/components/oms/pfmea/use-pfmea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ApqpProject | null;
  onSave: (values: Partial<ApqpProject> & { title: string }) => void;
  saving: boolean;
}

export function ApqpProjectDialog({ open, onOpenChange, project, onSave, saving }: Props) {
  const [v, setV] = useState<Partial<ApqpProject>>({});
  const pfmeaQ = usePfmeaStudies();
  const accountsQ = useQuery({
    queryKey: ["accounts_names"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  useEffect(() => {
    if (open) setV(project ? { ...project } : { status: "active", current_phase: 1 });
  }, [open, project]);

  const set = <K extends keyof ApqpProject>(key: K, value: ApqpProject[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const pfmeaStudies = pfmeaQ.data ?? [];
  const accounts = accountsQ.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit APQP program" : "New APQP program"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="apqp-title">Title</Label>
            <Input id="apqp-title" value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Bracket — automotive transfer program" />
          </div>
          <div>
            <Label>Linked account</Label>
            <Select value={v.account_id ?? "none"} onValueChange={(val) => set("account_id", val === "none" ? null : val)}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="apqp-customer">Customer</Label>
            <Input id="apqp-customer" value={v.customer ?? ""} onChange={(e) => set("customer", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="apqp-partno">Part number</Label>
            <Input id="apqp-partno" value={v.part_number ?? ""} onChange={(e) => set("part_number", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="apqp-partname">Part name</Label>
            <Input id="apqp-partname" value={v.part_name ?? ""} onChange={(e) => set("part_name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="apqp-program">Program</Label>
            <Input id="apqp-program" value={v.program ?? ""} onChange={(e) => set("program", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="apqp-owner">Owner</Label>
            <Input id="apqp-owner" value={v.owner ?? ""} onChange={(e) => set("owner", e.target.value)} />
          </div>
          <div>
            <Label>Current phase</Label>
            <Select value={String(v.current_phase ?? 1)} onValueChange={(val) => set("current_phase", Number(val))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {APQP_PHASES.map((p) => (
                  <SelectItem key={p.phase} value={String(p.phase)}>Phase {p.phase} — {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="apqp-ppap">Target PPAP date</Label>
            <Input id="apqp-ppap" type="date" value={v.target_ppap_date ?? ""} onChange={(e) => set("target_ppap_date", e.target.value || null)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={v.status ?? "active"} onValueChange={(val) => set("status", val as ApqpProject["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linked PFMEA study</Label>
            <Select value={v.pfmea_study_id ?? "none"} onValueChange={(val) => set("pfmea_study_id", val === "none" ? null : val)}>
              <SelectTrigger><SelectValue placeholder="Link a PFMEA (Phase 3)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {pfmeaStudies.map((s) => <SelectItem key={s.id} value={s.id}>{s.title ?? s.part_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="apqp-notes">Notes</Label>
            <Textarea id="apqp-notes" rows={3} value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving || !v.title?.trim()} onClick={() => onSave({ ...v, title: v.title!.trim() })}>
            {project ? "Save changes" : "Create program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
