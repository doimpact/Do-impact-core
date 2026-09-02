import { cn } from "@/lib/utils";

/**
 * The DO.Impact wordmark: navy letters (light on dark surfaces) with an amber dot.
 * Pass className for size/weight so each placement keeps its own typography.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-ink", className)}>
      DO<span className="brand-dot">.</span>Impact
    </span>
  );
}
