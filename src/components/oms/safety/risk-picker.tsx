import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LIKELIHOOD_SCALE, SEVERITY_SCALE, riskBand } from "@/lib/safety";

export function RiskPicker({
  severity,
  likelihood,
  onChange,
}: {
  severity: number;
  likelihood: number;
  onChange: (next: { severity: number; likelihood: number }) => void;
}) {
  const score = severity * likelihood;
  const band = riskBand(score);
  return (
    <div className="rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Severity</Label>
          <Select value={String(severity)} onValueChange={(v) => onChange({ severity: Number(v), likelihood })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEVERITY_SCALE.map((s) => (
                <SelectItem key={s.n} value={String(s.n)}>{s.n} — {s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Likelihood</Label>
          <Select value={String(likelihood)} onValueChange={(v) => onChange({ severity, likelihood: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LIKELIHOOD_SCALE.map((s) => (
                <SelectItem key={s.n} value={String(s.n)}>{s.n} — {s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Risk = {severity} × {likelihood} =</span>
        <span className="font-semibold">{score}</span>
        <Badge className={cn("border-0", band.className)}>{band.label}</Badge>
        <span className="text-xs text-muted-foreground">{band.action}</span>
      </div>
    </div>
  );
}
