import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scClient, weightedScore, ratingBand, monthLabel, type Metric, type Score, type ScRow } from "@/lib/supply-chain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

const firstOfMonth = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

export function ScorecardsTab({
  suppliers, metrics, readOnly, now,
}: { suppliers: ScRow[]; metrics: Metric[]; readOnly: boolean; now: Date }) {
  const qc = useQueryClient();
  const liveMetrics = metrics.filter((m) => !m.archived_at);
  const [supplierId, setSupplierId] = useState<string>("");
  const [period, setPeriod] = useState<string>(() => firstOfMonth(now));
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!supplierId && suppliers[0]) setSupplierId(String(suppliers[0].id));
  }, [suppliers, supplierId]);

  const cardsQ = useQuery({
    queryKey: ["sc", "sc_scorecards", supplierId],
    queryFn: async () => {
      const { data, error } = await scClient.from("sc_scorecards").select("*")
        .eq("supplier_id", supplierId).order("period_month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ScRow[];
    },
    enabled: !!supplierId,
  });
  const cards = cardsQ.data ?? [];
  const current = cards.find((c) => String(c.period_month).slice(0, 10) === period) ?? null;

  const scoresQ = useQuery({
    queryKey: ["sc", "sc_scorecard_scores", supplierId],
    queryFn: async () => {
      const ids = cards.map((c) => c.id);
      if (!ids.length) return [] as Score[];
      const { data, error } = await scClient.from("sc_scorecard_scores").select("*").in("scorecard_id", ids);
      if (error) throw error;
      return (data ?? []) as Score[];
    },
    enabled: cards.length > 0,
  });
  const allScores = scoresQ.data ?? [];

  useEffect(() => {
    const d: Record<string, string> = {};
    for (const m of liveMetrics) {
      const s = allScores.find((x) => x.scorecard_id === current?.id && x.metric_id === m.id);
      d[m.id] = s ? String(s.score) : "";
    }
    setDraft(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, allScores.length, metrics.length]);

  const save = useMutation({
    mutationFn: async () => {
      let cardId = current?.id as string | undefined;
      if (!cardId) {
        const { data, error } = await scClient.from("sc_scorecards")
          .insert({ supplier_id: supplierId, period_month: period }).select("id").single();
        if (error) throw error;
        cardId = data.id as string;
      }
      const rows = liveMetrics
        .filter((m) => draft[m.id] !== "" && draft[m.id] !== undefined)
        .map((m) => ({ scorecard_id: cardId, metric_id: m.id, score: Number(draft[m.id]) }));
      if (rows.length) {
        const { error } = await (scClient.from("sc_scorecard_scores") as any)
          .upsert(rows, { onConflict: "scorecard_id,metric_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sc", "sc_scorecards"] });
      qc.invalidateQueries({ queryKey: ["sc", "sc_scorecard_scores"] });
      toast.success("Scorecard saved");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const draftScore = useMemo(() => {
    const fake: Score[] = liveMetrics
      .filter((m) => draft[m.id] !== "" && draft[m.id] !== undefined)
      .map((m) => ({ id: m.id, scorecard_id: "draft", metric_id: m.id, score: Number(draft[m.id]) }));
    return weightedScore(fake, liveMetrics);
  }, [draft, liveMetrics]);
  const band = ratingBand(draftScore);

  const history = cards.slice(0, 12).map((c) => ({
    id: c.id as string,
    period: String(c.period_month),
    score: weightedScore(allScores.filter((s) => s.scorecard_id === c.id), liveMetrics),
  }));

  const totalWeight = liveMetrics.reduce((a, m) => a + (Number(m.weight_pct) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px]">
          <Label className="text-xs">Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Pick a supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{String(s.name)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Period (month)</Label>
          <Input type="month" value={period.slice(0, 7)} onChange={(e) => setPeriod(`${e.target.value}-01`)} className="w-44" />
        </div>
        <Badge className={band.className}>
          {draftScore === null ? "No score" : `${draftScore} / 100`} · {band.label}
        </Badge>
        <Button onClick={() => save.mutate()} disabled={readOnly || !supplierId}>
          <Save className="mr-1 h-4 w-4" /> Save scorecard
        </Button>
      </div>

      {totalWeight !== 100 && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Metric weightings add up to {totalWeight}% — adjust them in Setup so the weighted score reflects your policy.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Metric</th>
              <th className="px-3 py-2 text-left font-medium">Dimension</th>
              <th className="px-3 py-2 text-left font-medium">Weight</th>
              <th className="px-3 py-2 text-left font-medium">Score (0–100)</th>
            </tr>
          </thead>
          <tbody>
            {liveMetrics.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2 capitalize text-muted-foreground">{m.dimension}</td>
                <td className="px-3 py-2 tabular-nums">{m.weight_pct}%</td>
                <td className="px-3 py-2">
                  <Input
                    type="number" min={0} max={100} className="h-8 w-28"
                    value={draft[m.id] ?? ""} disabled={readOnly}
                    onChange={(e) => setDraft({ ...draft, [m.id]: e.target.value })}
                  />
                </td>
              </tr>
            ))}
            {liveMetrics.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">Add scorecard metrics in Setup.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Trend</h3>
          <div className="flex flex-wrap gap-2">
            {history.slice().reverse().map((h) => {
              const b = ratingBand(h.score);
              return (
                <button
                  key={h.id}
                  className={`rounded-md px-3 py-2 text-xs ${b.className} ${String(h.period).slice(0, 10) === period ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setPeriod(String(h.period).slice(0, 10))}
                >
                  <div className="font-medium">{monthLabel(h.period)}</div>
                  <div className="tabular-nums">{h.score ?? "—"}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
