import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, HelpCircle, TriangleAlert } from "lucide-react";
import { CategoryIcon } from "@/components/oms/daily/category-meta";
import type { Category, CategoryTarget, Mark, ReasonCode } from "@/components/oms/daily/types";

/**
 * Operator-facing "today" strip: one big tile per SQDP category.
 * Wording is deliberately about barriers the team hit, not performance scoring.
 */
export function FloorToday({
  categories, marks, reasonCodes, targets, today, readOnly,
  onCycle, onReason, onActual, onAskHelp,
}: {
  categories: Category[];
  marks: Mark[];
  reasonCodes: ReasonCode[];
  targets: CategoryTarget[];
  today: string;
  readOnly: boolean;
  onCycle: (categoryKey: string, next: "green" | "red" | null) => void;
  onReason: (categoryKey: string, reasonCodeId: string | null) => void;
  onActual: (categoryKey: string, actual: number | null) => void;
  onAskHelp: (categoryKey: string) => void;
}) {
  const [barrier, setBarrier] = useState<Category | null>(null);
  const [actualDraft, setActualDraft] = useState<Record<string, string>>({});

  const markFor = (key: string) => marks.find(m => m.category === (key as Mark["category"]) && m.mark_date === today);
  const targetFor = (key: string) => targets.find(t => t.category_key === key && t.value_date === today);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.map((c) => {
        const mark = markFor(c.key);
        const status = mark?.status ?? null;
        const t = targetFor(c.key);
        const plan = t?.plan_value ?? null;
        const actual = t?.actual_value ?? null;
        const pct = plan && plan > 0 && actual != null ? Math.min(150, Math.round((actual / plan) * 100)) : null;
        const reason = mark?.reason_code_id ? reasonCodes.find(r => r.id === mark.reason_code_id) : null;
        const next = status === null ? "green" : status === "green" ? "red" : null;

        return (
          <div
            key={c.id}
            className={`rounded-2xl border-2 p-5 transition-colors ${
              status === "red"
                ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                : status === "green"
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                  : "border-border bg-card"
            }`}
          >
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onCycle(c.key, next)}
              className="flex w-full items-center gap-3 text-left disabled:opacity-70"
            >
              <CategoryIcon name={c.icon} className={`h-8 w-8 ${c.accent}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold">{c.label}</div>
                <div className="text-sm text-muted-foreground">
                  {status === "green" ? "Ran clean today" : status === "red" ? "We hit a barrier" : "Tap to log today"}
                </div>
              </div>
              {status === "green" && <CheckCircle2 className="h-7 w-7 text-emerald-600" />}
              {status === "red" && <TriangleAlert className="h-7 w-7 text-red-600" />}
            </button>

            {plan != null && (
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>Plan {plan}{c.unit ? ` ${c.unit}` : ""}</span>
                  <span>{actual != null ? `Actual ${actual}` : "No actual yet"}</span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${pct != null && pct >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Input
                inputMode="decimal"
                disabled={readOnly}
                className="h-11 w-28 text-base"
                placeholder="Actual"
                value={actualDraft[c.key] ?? (actual != null ? String(actual) : "")}
                onChange={(e) => setActualDraft(d => ({ ...d, [c.key]: e.target.value }))}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const val = raw === "" ? null : Number(raw);
                  if (val != null && Number.isNaN(val)) return;
                  if (val === (actual ?? null)) return;
                  onActual(c.key, val);
                }}
              />
              {status === "red" && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={readOnly}
                  className="h-11"
                  onClick={() => setBarrier(c)}
                >
                  {reason ? reason.label : "What blocked us?"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={readOnly}
                className="h-11 gap-2"
                onClick={() => onAskHelp(c.key)}
              >
                <HelpCircle className="h-5 w-5" /> Ask for help
              </Button>
            </div>
          </div>
        );
      })}

      <Dialog open={!!barrier} onOpenChange={(o) => !o && setBarrier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What blocked us on {barrier?.label}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Naming the barrier is how it gets fixed. Nothing here is about the team's performance.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {reasonCodes
              .filter(r => !r.category_key || r.category_key === barrier?.key)
              .map(r => (
                <Button
                  key={r.id}
                  variant="outline"
                  className="h-14 justify-start text-base"
                  onClick={() => { if (barrier) onReason(barrier.key, r.id); setBarrier(null); }}
                >
                  {r.label}
                </Button>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { if (barrier) onReason(barrier.key, null); setBarrier(null); }}
            >
              Clear reason
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
