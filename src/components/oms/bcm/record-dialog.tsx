import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FieldSpec } from "@/lib/bcm";

export type RecordValues = Record<string, unknown>;

function toInputValue(v: unknown, kind: FieldSpec["kind"]) {
  if (v === null || v === undefined) return "";
  if (kind === "datetime") {
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return "";
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
  return String(v);
}

export function RecordDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  extra,
  submitLabel = "Save",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial?: RecordValues;
  extra?: React.ReactNode;
  submitLabel?: string;
  onSubmit: (values: RecordValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<RecordValues>(initial ?? {});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ?? {});
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(name: string, v: unknown) {
    setValues((s) => ({ ...s, [name]: v }));
  }

  async function submit() {
    const missing = fields.find((f) => f.required && !String(values[f.name] ?? "").trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {extra}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={cn("space-y-1.5", (f.full || f.kind === "textarea") && "sm:col-span-2")}>
              {f.kind === "switch" ? (
                <div className="flex items-center gap-3 pt-5">
                  <Switch
                    id={`f-${f.name}`}
                    checked={!!values[f.name]}
                    onCheckedChange={(v) => set(f.name, v)}
                  />
                  <Label htmlFor={`f-${f.name}`}>{f.label}</Label>
                </div>
              ) : (
                <>
                  <Label htmlFor={`f-${f.name}`}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {f.kind === "textarea" ? (
                    <Textarea
                      id={`f-${f.name}`}
                      rows={2}
                      value={toInputValue(values[f.name], f.kind)}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  ) : f.kind === "select" ? (
                    <Select
                      value={values[f.name] === undefined || values[f.name] === null ? "" : String(values[f.name])}
                      onValueChange={(v) => set(f.name, /^\d+$/.test(v) && typeof f.options?.[0]?.key === "number" ? Number(v) : v)}
                    >
                      <SelectTrigger id={`f-${f.name}`}>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => (
                          <SelectItem key={String(o.key)} value={String(o.key)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`f-${f.name}`}
                      type={
                        f.kind === "number" ? "number" : f.kind === "date" ? "date" : f.kind === "datetime" ? "datetime-local" : "text"
                      }
                      value={toInputValue(values[f.name], f.kind)}
                      onChange={(e) =>
                        set(f.name, f.kind === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)
                      }
                    />
                  )}
                  {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Split flat form values into table columns and a jsonb `details` payload. */
export function splitDetails(fields: FieldSpec[], values: RecordValues) {
  const cols: RecordValues = {};
  const details: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.detail) {
      if (v !== undefined && v !== null && String(v) !== "") details[f.name] = String(v);
    } else {
      cols[f.name] = v === "" ? null : v;
    }
  }
  return { cols, details };
}

export function normalise(fields: FieldSpec[], values: RecordValues) {
  const out: RecordValues = {};
  for (const f of fields) {
    const v = values[f.name];
    out[f.name] = v === "" ? null : v;
  }
  return out;
}
