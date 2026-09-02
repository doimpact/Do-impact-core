import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GoalDef, PlaybookInputs } from "@/lib/decision-playbook";

/** Goal-specific input form. Every field is optional — the rules cope with blanks. */
export function PlaybookForm({
  goal,
  values,
  onChange,
  disabled,
}: {
  goal: GoalDef;
  values: PlaybookInputs;
  onChange: (next: PlaybookInputs) => void;
  disabled?: boolean;
}) {
  function set(key: string, value: number | string | null) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {goal.inputs.map((input) => {
        const raw = values[input.key];
        return (
          <div key={input.key} className="space-y-1.5">
            <Label className="text-xs font-medium">
              {input.label}
              {input.kind === "number" && input.unit ? (
                <span className="ml-1 text-muted-foreground">({input.unit})</span>
              ) : null}
            </Label>
            {input.kind === "number" ? (
              <Input
                type="number"
                inputMode="decimal"
                disabled={disabled}
                value={raw === null || raw === undefined ? "" : String(raw)}
                onChange={(e) => set(input.key, e.target.value === "" ? null : Number(e.target.value))}
                placeholder="—"
              />
            ) : (
              <Select
                disabled={disabled}
                value={raw ? String(raw) : ""}
                onValueChange={(v) => set(input.key, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {input.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {input.hint && <p className="text-[11px] leading-snug text-muted-foreground">{input.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
