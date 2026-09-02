import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  PHASE_BY_KEY,
  STATEMENT_CHECKS,
  STATEMENT_EXAMPLES,
  type ReferenceMode,
} from "@/lib/problem-tools";
import { PhaseHeader, SectionCard, uid, type PhaseProps } from "./phase-common";

const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed"];

function monthsBack(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function Phase1({ phases, patch }: PhaseProps) {
  const modes = phases.reference_modes ?? [];
  const checks = phases.statement_checks ?? {};
  const setModes = (m: ReferenceMode[]) => patch({ reference_modes: m });

  const chartData = useMemo(() => {
    const keys = new Set<string>();
    modes.forEach((m) => m.points.forEach((p) => keys.add(p.month)));
    return [...keys].sort().map((month) => {
      const row: Record<string, string | number | null> = { month };
      modes.forEach((m) => {
        row[m.label || "Series"] = m.points.find((p) => p.month === month)?.value ?? null;
      });
      return row;
    });
  }, [modes]);

  const addMode = () =>
    setModes([
      ...modes,
      { id: uid("rm"), label: "New metric", unit: "%", points: monthsBack(24).map((month) => ({ month, value: null })) },
    ]);

  return (
    <div className="space-y-4">
      <PhaseHeader def={PHASE_BY_KEY.p1} phases={phases} patch={patch} />

      <SectionCard
        title="Reference modes — behaviour over time"
        hint="Plot 12–36 months of the metrics that are drifting. One-off events lie; trend lines don't."
      >
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={addMode}><Plus className="mr-1.5 h-4 w-4" /> Metric</Button>
        </div>

        {modes.length > 0 && (
          <div className="h-72 w-full rounded-xl border border-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {modes.map((m, i) => (
                  <Line
                    key={m.id}
                    type="monotone"
                    dataKey={m.label || "Series"}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {modes.map((m) => (
          <div key={m.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-xs"
                defaultValue={m.label}
                placeholder="Metric name"
                onBlur={(e) => setModes(modes.map((x) => (x.id === m.id ? { ...x, label: e.target.value } : x)))}
              />
              <Input
                className="w-24"
                defaultValue={m.unit ?? ""}
                placeholder="Unit"
                onBlur={(e) => setModes(modes.map((x) => (x.id === m.id ? { ...x, unit: e.target.value } : x)))}
              />
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-destructive"
                onClick={() => setModes(modes.filter((x) => x.id !== m.id))}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Remove
              </Button>
            </div>

            <Textarea
              rows={2}
              placeholder="Paste a column of monthly values (oldest first) — one per line or comma separated"
              onBlur={(e) => {
                const vals = e.target.value
                  .split(/[\n,;\t]+/)
                  .map((v) => v.trim())
                  .filter(Boolean)
                  .map((v) => Number(v.replace(/[^0-9.-]/g, "")));
                if (!vals.length) return;
                const months = m.points.length >= vals.length ? m.points.map((p) => p.month) : monthsBack(vals.length);
                const offset = months.length - vals.length;
                setModes(
                  modes.map((x) =>
                    x.id === m.id
                      ? {
                          ...x,
                          points: months.map((month, i) => ({
                            month,
                            value: i >= offset && Number.isFinite(vals[i - offset]) ? vals[i - offset] : null,
                          })),
                        }
                      : x,
                  ),
                );
                e.target.value = "";
              }}
            />

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-12">
              {m.points.map((p, i) => (
                <div key={p.month} className="space-y-0.5">
                  <span className="block text-[10px] text-muted-foreground">{p.month.slice(2)}</span>
                  <Input
                    className="h-8 px-1.5 text-xs"
                    defaultValue={p.value ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setModes(
                        modes.map((x) =>
                          x.id === m.id
                            ? { ...x, points: x.points.map((q, j) => (j === i ? { ...q, value: v } : q)) }
                            : x,
                        ),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Problem statement" hint="Frame the drift as system behaviour over time — never as a department's failure.">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <Textarea
              rows={4}
              placeholder="Over the last N months, X has moved from … to … despite …"
              defaultValue={phases.problem_statement ?? ""}
              onBlur={(e) => patch({ problem_statement: e.target.value })}
            />
            <div className="space-y-1.5">
              {STATEMENT_CHECKS.map((c) => (
                <label key={c.key} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={!!checks[c.key]}
                    onCheckedChange={(v) => patch({ statement_checks: { ...checks, [c.key]: !!v } })}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Weak</p>
              <p className="mt-1">{STATEMENT_EXAMPLES.weak}</p>
            </div>
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Strong</p>
              <p className="mt-1">{STATEMENT_EXAMPLES.strong}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
