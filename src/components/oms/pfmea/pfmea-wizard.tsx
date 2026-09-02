import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { FileUp, Loader2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportDialog } from "@/components/ImportDialog";
import { draftPfmea } from "@/lib/pfmea.functions";
import { fileToDataUrl, uploadPfmeaDrawing, usePfmeaMutations } from "./use-pfmea";
import { PfmeaRowDialog } from "./pfmea-row-dialog";
import {
  AP_LABEL,
  PROCESS_FAMILIES,
  actionPriority,
  apClasses,
  emptyDraftRow,
  rpn,
  type DraftRow,
  type PfmeaStudy,
} from "./pfmea-types";

type NpiOption = { id: string; part_number: string; part_name: string | null; customer: string | null; program: string | null };

const STEPS = ["Scope", "Process steps", "Generate", "Review & save"] as const;

export function PfmeaWizard({
  open,
  onOpenChange,
  companyId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string | null;
  onCreated: (study: PfmeaStudy) => void;
}) {
  const [step, setStep] = useState(0);
  const { createStudy } = usePfmeaMutations();
  const generate = useServerFn(draftPfmea);

  // Step 1 — scope
  const [npiId, setNpiId] = useState<string>("none");
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [customer, setCustomer] = useState("");
  const [program, setProgram] = useState("");
  const [processFamily, setProcessFamily] = useState("machining");
  const [revision, setRevision] = useState("");
  const [specialChars, setSpecialChars] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2 — steps & drawing
  const [stepsText, setStepsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 3 — generation
  const [depth, setDepth] = useState<"lean" | "standard" | "thorough">("standard");
  const [busy, setBusy] = useState(false);

  // Step 4 — review
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [editing, setEditing] = useState<{ index: number; row: Omit<DraftRow, "tempId"> } | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["pfmea-npi-options"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("npi_projects")
        .select("id, part_number, part_name, customer, program")
        .is("archived_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NpiOption[];
    },
  });

  const parsedSteps = useMemo(
    () =>
      stepsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, i) => {
          const m = line.match(/^(\d{1,4})\s*[.:\-–]\s*(.+)$/);
          return m ? { step_no: m[1], step_name: m[2] } : { step_no: String((i + 1) * 10), step_name: line };
        }),
    [stepsText],
  );

  function reset() {
    setStep(0);
    setNpiId("none"); setPartNumber(""); setPartName(""); setCustomer(""); setProgram("");
    setProcessFamily("machining"); setRevision(""); setSpecialChars(""); setNotes("");
    setStepsText(""); setFile(null); setDepth("standard"); setRows([]);
  }

  function pickProject(id: string) {
    setNpiId(id);
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setPartNumber(p.part_number);
    setPartName(p.part_name ?? "");
    setCustomer(p.customer ?? "");
    setProgram(p.program ?? "");
  }

  async function runGeneration() {
    setBusy(true);
    try {
      let fileDataUrl: string | null = null;
      if (file) fileDataUrl = await fileToDataUrl(file);
      const res = await generate({
        data: {
          partNumber: partNumber.trim(),
          partName: partName || null,
          customer: customer || null,
          program: program || null,
          processFamily,
          specialCharacteristics: specialChars || null,
          notes: notes || null,
          steps: parsedSteps,
          depth,
          fileDataUrl,
          fileName: file?.name ?? null,
          fileMime: file?.type ?? null,
          extractStepsFromFile: !!file && parsedSteps.length === 0,
        },
      });
      const generated = (res.rows ?? []).map((r, i) => ({
        ...emptyDraftRow(i + 1),
        ...r,
        action_status: r.action ? ("open" as const) : ("not_required" as const),
      })) as DraftRow[];
      if (generated.length === 0) throw new Error("The AI returned no lines — add a few process steps and try again.");
      setRows(generated);
      setStep(3);
      toast.success(`Drafted ${generated.length} PFMEA lines`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not draft the PFMEA");
    } finally {
      setBusy(false);
    }
  }

  function skipToManualReview() {
    setRows(
      parsedSteps.map((s, i) => ({ ...emptyDraftRow(i + 1), step_no: s.step_no, step_name: s.step_name })),
    );
    setStep(3);
  }

  async function save() {
    if (!partNumber.trim() || rows.length === 0) return;
    try {
      let drawingPath: string | null = null;
      if (file && companyId) {
        setUploading(true);
        try {
          drawingPath = await uploadPfmeaDrawing(companyId, file);
        } catch {
          toast.warning("The drawing could not be stored — the PFMEA was still saved.");
        } finally {
          setUploading(false);
        }
      }
      const study = await createStudy.mutateAsync({
        study: {
          npi_project_id: npiId === "none" ? null : npiId,
          title: `PFMEA — ${partName || partNumber}`,
          part_number: partNumber.trim(),
          part_name: partName || null,
          customer: customer || null,
          program: program || null,
          process_family: processFamily,
          revision: revision || null,
          status: "draft",
          source: file ? "drawing" : rows.some((r) => r.failure_mode) ? "ai" : "manual",
          drawing_path: drawingPath,
          notes: notes || null,
        },
        rows,
      });
      toast.success("PFMEA created");
      onOpenChange(false);
      reset();
      onCreated(study);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the PFMEA");
    }
  }

  const canNext = step === 0 ? partNumber.trim().length > 0 : step === 1 ? parsedSteps.length > 0 || !!file : true;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New PFMEA</DialogTitle>
          <DialogDescription>
            Scope the part, give the process steps, let the assistant draft the worksheet, then review before anything is saved.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap gap-2 text-xs">
          {STEPS.map((label, i) => (
            <li key={label}>
              <Badge variant={i === step ? "default" : "outline"}>{i + 1}. {label}</Badge>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Link an NPI project (optional)</Label>
              <Select value={npiId} onValueChange={pickProject}>
                <SelectTrigger><SelectValue placeholder="Not linked" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.part_number}{p.part_name ? ` — ${p.part_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Part number *</Label>
                <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="TS-4471-01" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Part name</Label>
                <Input value={partName} onChange={(e) => setPartName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Customer</Label>
                <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Program</Label>
                <Input value={program} onChange={(e) => setProgram(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Process family</Label>
                <Select value={processFamily} onValueChange={setProcessFamily}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROCESS_FAMILIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Revision</Label>
                <Input value={revision} onChange={(e) => setRevision(e.target.value)} placeholder="A" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Known special / key characteristics</Label>
              <Textarea rows={2} value={specialChars} onChange={(e) => setSpecialChars(e.target.value)}
                placeholder="e.g. hole diameter 6.35 +0.03/-0.00 (CC), coating thickness per MIL-DTL-5541" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Context notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Process steps — one per line</Label>
              <Textarea
                rows={8}
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                placeholder={"10: Receive and verify raw bar\n20: CNC rough mill datum face\n30: CNC finish mill pocket profile"}
              />
              <p className="text-xs text-muted-foreground">{parsedSteps.length} steps detected. A leading number becomes the step number.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ImportDialog<{ step_no: string | null; step_name: string }>
                trigger={<Button variant="outline" className="w-full"><FileUp className="h-4 w-4 mr-1" /> Import routing (Excel/CSV)</Button>}
                title="Import process steps"
                entity="steps"
                templateName="pfmea-routing-template.xlsx"
                columns={[
                  { key: "step_no", example: "10" },
                  { key: "step_name", required: true, example: "CNC rough mill datum face" },
                ]}
                parseRow={(raw) => {
                  const name = String(raw["step_name"] ?? raw["operation"] ?? "").trim();
                  if (!name) return { data: null, errors: ["Missing step_name"] };
                  const no = String(raw["step_no"] ?? "").trim();
                  return { data: { step_no: no || null, step_name: name }, errors: [] };
                }}
                onImport={async (imported) => {
                  setStepsText((prev) =>
                    [prev.trim(), ...imported.map((s) => (s.step_no ? `${s.step_no}: ${s.step_name}` : s.step_name))]
                      .filter(Boolean)
                      .join("\n"),
                  );
                  return { inserted: imported.length, failed: 0 };
                }}
              />

              <label className="flex items-center gap-3 rounded-md border-2 border-dashed p-3 cursor-pointer hover:bg-muted/40">
                <FileUp className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{file ? file.name : "Upload drawing or spec"}</div>
                  <div className="text-xs text-muted-foreground">PDF, PNG or JPG — read by the assistant, stored privately.</div>
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {file && parsedSteps.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No steps typed — the assistant will derive a likely routing from the drawing for you to confirm.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Draft depth</Label>
              <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lean">Lean — one failure mode per step</SelectItem>
                  <SelectItem value="standard">Standard — two per step</SelectItem>
                  <SelectItem value="thorough">Thorough — three per step</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
              <div className="font-medium">{partNumber} {partName ? `— ${partName}` : ""}</div>
              <div className="text-muted-foreground text-xs">
                {parsedSteps.length} process steps · {PROCESS_FAMILIES.find((f) => f.value === processFamily)?.label}
                {file ? ` · drawing: ${file.name}` : ""}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void runGeneration()} disabled={busy}>
                {busy ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Drafting…</> : <><Sparkles className="h-4 w-4 mr-1" /> Draft the PFMEA</>}
              </Button>
              <Button variant="outline" onClick={skipToManualReview} disabled={busy || parsedSteps.length === 0}>
                Skip — fill it in myself
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Nothing is saved yet. You will review and edit every line before the PFMEA is created.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{rows.length} lines to review</span>
              <Button variant="outline" size="sm" onClick={() => setRows([...rows, emptyDraftRow(rows.length + 1)])}>
                Add line
              </Button>
            </div>
            <div className="max-h-[45vh] overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0">
                  <tr>
                    {["Step", "Failure mode / effect", "S", "O", "D", "AP", "RPN", "Action", ""].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const ap = actionPriority(r.severity, r.occurrence, r.detection);
                    return (
                      <tr key={r.tempId} className="border-t align-top">
                        <td className="px-2 py-1.5 max-w-[150px]">
                          <div className="font-medium">{r.step_no ? `${r.step_no} · ` : ""}{r.step_name}</div>
                          <div className="text-muted-foreground">{r.function_req}</div>
                        </td>
                        <td className="px-2 py-1.5 max-w-[220px]">
                          <div>{r.failure_mode}</div>
                          <div className="text-muted-foreground">{r.effect}</div>
                        </td>
                        <td className="px-2 py-1.5 font-mono">{r.severity ?? "—"}</td>
                        <td className="px-2 py-1.5 font-mono">{r.occurrence ?? "—"}</td>
                        <td className="px-2 py-1.5 font-mono">{r.detection ?? "—"}</td>
                        <td className="px-2 py-1.5"><Badge variant="outline" className={apClasses(ap)}>{ap ? AP_LABEL[ap] : "—"}</Badge></td>
                        <td className="px-2 py-1.5 font-mono">{rpn(r.severity, r.occurrence, r.detection) ?? "—"}</td>
                        <td className="px-2 py-1.5 max-w-[180px]">{r.action}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            const { tempId: _t, ...rest } = r;
                            void _t;
                            setEditing({ index: i, row: rest });
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button disabled={rows.length === 0 || createStudy.isPending || uploading} onClick={() => void save()}>
              {createStudy.isPending || uploading ? "Saving…" : `Save PFMEA (${rows.length} lines)`}
            </Button>
          )}
        </DialogFooter>

        <PfmeaRowDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          initial={editing?.row ?? null}
          onSave={(row) => {
            if (!editing) return;
            setRows(rows.map((r, i) => (i === editing.index ? { ...row, tempId: r.tempId } : r)));
            setEditing(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
