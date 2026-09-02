import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown } from "lucide-react";
import { buildBurnDown, daysUntil, type CppPulseCheck, type CppTask, type CppVisit } from "./types";
import { useCppRows } from "./use-cpp";

export function BurnDown({ visit }: { visit: CppVisit }) {
  const tasksQ = useCppRows<CppTask>("cpp_tasks", visit.id, "sort_order");
  const checksQ = useCppRows<CppPulseCheck>("cpp_pulse_checks", visit.id, "check_at");
  const { points, verdict } = buildBurnDown(visit, tasksQ.data ?? [], checksQ.data ?? []);
  const remaining = daysUntil(visit.planned_redelivery);

  const tone =
    verdict.tone === "bad"
      ? "border-red-500/50 bg-red-500/10 text-red-600"
      : verdict.tone === "warn"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-600"
        : "border-emerald-500/50 bg-emerald-500/10 text-emerald-600";

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <TrendingDown className="h-4 w-4" /> Burn-down rate
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Remaining earned hours against remaining time to redelivery. Critical path burn-down is tracked separately from
          total aircraft burn-down.
          {remaining !== null && (
            <> {remaining >= 0 ? `${remaining} days` : `${Math.abs(remaining)} days past`} to planned redelivery.</>
          )}
        </p>
      </div>

      <div className={`rounded-md border px-3 py-2 text-sm ${tone}`}>{verdict.text}</div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="total" name="Total remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="critical" name="Critical path remaining" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="idealTotal" name="Ideal total" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="idealCritical" name="Ideal critical" stroke="hsl(25 90% 55%)" strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
