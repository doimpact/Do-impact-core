export type ProficiencyLevel = {
  level: number;
  label: string;
  color: string;
  description: string | null;
};

export const LEVEL_LABELS: Record<number, string> = {
  0: "None",
  1: "Trainee",
  2: "Assisted",
  3: "Independent",
  4: "Expert",
};

export const LEVEL_COLORS: Record<number, string> = {
  0: "#e5e7eb",
  1: "#fca5a5",
  2: "#fcd34d",
  3: "#86efac",
  4: "#22c55e",
};

export function LevelBadge({ level, size = "sm" }: { level: number; size?: "sm" | "md" }) {
  const bg = LEVEL_COLORS[level] ?? "#e5e7eb";
  const cls = size === "md" ? "h-7 w-7 text-sm" : "h-6 w-6 text-xs";
  return (
    <span
      className={`inline-flex ${cls} items-center justify-center rounded font-medium text-slate-900`}
      style={{ backgroundColor: bg }}
      title={LEVEL_LABELS[level]}
    >
      {level}
    </span>
  );
}
