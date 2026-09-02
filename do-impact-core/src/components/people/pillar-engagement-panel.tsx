import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Users2, ArrowRight } from "lucide-react";
import { PILLAR_ENGAGEMENT, TIER_BY_KEY, type PillarEngagementKey } from "@/lib/change-engagement";

export function PillarEngagementPanel({
  pillar,
  defaultOpen = false,
}: {
  pillar: PillarEngagementKey;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const data = PILLAR_ENGAGEMENT[pillar];

  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Users2 className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Bring people with you</div>
          <div className="truncate text-xs text-muted-foreground">
            Tier-by-tier engagement for this pillar — what to say, to whom, how often.
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t p-4">
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{data.intro}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {data.rows.map((row) => {
              const tier = TIER_BY_KEY[row.tier];
              return (
                <div key={row.tier} className="rounded-lg border bg-background p-3">
                  <span className="inline-block h-1.5 w-8 rounded-full" style={{ backgroundColor: tier.tone }} />
                  <p className="mt-2 text-xs font-semibold">{tier.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{row.channel}</p>
                </div>
              );
            })}
          </div>
          <Link
            to="/people/engagement"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open the full change & engagement guide <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
