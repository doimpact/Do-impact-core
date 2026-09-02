import { Badge } from "@/components/ui/badge";

/** ISO timestamp -> yyyy-mm-dd for <input type="date">. */
export function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd -> ISO timestamp, or null when cleared. */
export function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export type TermState = "none" | "inactive" | "scheduled" | "active" | "expiring" | "expired";

export function termState(
  status: string,
  termStart?: string | null,
  termEnd?: string | null,
): TermState {
  if (status === "none") return "none";
  if (status !== "active") return "inactive";
  const now = Date.now();
  if (termStart && new Date(termStart).getTime() > now) return "scheduled";
  if (termEnd) {
    const end = new Date(termEnd).getTime();
    if (end <= now) return "expired";
    if (end - now < 30 * 24 * 60 * 60 * 1000) return "expiring";
  }
  return "active";
}

const TONE: Record<TermState, string> = {
  none: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
  scheduled: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  expiring: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  expired: "bg-destructive/15 text-destructive",
};

function daysLeft(termEnd: string) {
  return Math.max(0, Math.ceil((new Date(termEnd).getTime() - Date.now()) / 86_400_000));
}

/** Reads "Active until 12 Mar 2027" / "Expires in 9 days" / "Expired". */
export function TermBadge({
  status,
  termStart,
  termEnd,
}: {
  status: string;
  termStart?: string | null;
  termEnd?: string | null;
}) {
  const state = termState(status, termStart, termEnd);
  const until = termEnd
    ? new Date(termEnd).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const label =
    state === "none"
      ? "No subscription"
      : state === "inactive"
        ? "Inactive"
        : state === "scheduled"
          ? `Starts ${toDateInput(termStart)}`
          : state === "expired"
            ? `Expired ${until ?? ""}`.trim()
            : state === "expiring"
              ? `Expires in ${daysLeft(termEnd!)} days`
              : until
                ? `Active until ${until}`
                : "Active (open-ended)";

  return <Badge className={`${TONE[state]} border-0`}>{label}</Badge>;
}
