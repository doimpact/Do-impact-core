import { Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Compass, TrendingUp, Cog, Users, ListChecks, FileText, Presentation, Settings as SettingsIcon, Building2 } from "lucide-react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PILLARS, SUB_NAV, type PillarKey } from "@/lib/nav-registry";
import { PILLAR_TEXT, BLURBS, CROSS_CUTTING } from "@/lib/framework-guide-content";

const PILLAR_META: Record<PillarKey, { Icon: typeof Compass; tone: string; tagline: string; intro: string }> = {
  strategy: { Icon: Compass, tone: "var(--color-pillar-strategy)", ...PILLAR_TEXT.strategy },
  commercial: { Icon: TrendingUp, tone: "var(--color-pillar-commercial)", ...PILLAR_TEXT.commercial },
  oms: { Icon: Cog, tone: "var(--color-pillar-oms)", ...PILLAR_TEXT.oms },
  people: { Icon: Users, tone: "var(--color-pillar-people)", ...PILLAR_TEXT.people },
  actions: { Icon: ListChecks, tone: "var(--color-accent)", ...PILLAR_TEXT.actions },
};


function GuideCard({ pk }: { pk: PillarKey }) {
  const meta = PILLAR_META[pk];
  const pillar = PILLARS.find((p) => p.key === pk)!;
  const subs = SUB_NAV[pk];
  const { isEnabled } = useUserPreferences();
  const pillarHidden = !isEnabled(pillar.navKey);
  return (
    <AccordionItem value={pk} className="rounded-lg border border-border bg-background">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <div
            className="rounded-md p-2"
            style={{ backgroundColor: `color-mix(in oklch, ${meta.tone} 15%, transparent)` }}
          >
            <meta.Icon className="h-5 w-5" style={{ color: meta.tone }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{meta.tagline}</p>
            <p className="text-base font-semibold">{pillar.label}</p>
          </div>
          {pillarHidden && (
            <span className="ml-2 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              hidden in your settings
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">{meta.intro}</p>
        {subs.length > 0 && (
          <ul className="mt-4 space-y-3">
            {subs.map((s) => {
              const hidden = !isEnabled(s.key);
              const blurb = BLURBS[s.to] ?? "";
              return (
                <li key={s.to} className={`rounded-md border border-border p-3 ${hidden ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={s.to} className="text-sm font-medium text-primary hover:underline">
                      {s.label}
                    </Link>
                    {hidden && (
                      <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        hidden in your settings
                      </span>
                    )}
                  </div>
                  {blurb && <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function CrossCuttingCard() {
  const ICONS = [ListChecks, FileText, Presentation, SettingsIcon, Building2, Users];
  const items = CROSS_CUTTING.map((c, i) => ({ ...c, Icon: ICONS[i] ?? FileText }));

  return (
    <AccordionItem value="cross" className="rounded-lg border border-border bg-background">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cross-cutting</p>
            <p className="text-base font-semibold">Reporting, Actions, Settings, Companies & Access</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.to} className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <i.Icon className="h-4 w-4 text-muted-foreground" />
                <Link to={i.to as never} className="text-sm font-medium text-primary hover:underline">
                  {i.label}
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{i.blurb}</p>
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function FrameworkGuide() {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Framework Guide — what's inside each module</h2>
        <span className="text-xs text-muted-foreground">Click any section to expand</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        A high-level tour of every pillar and sub-section in DO.Impact. Click a name to jump straight into that view.
      </p>
      <Accordion type="multiple" className="space-y-2">
        {(Object.keys(PILLAR_META) as PillarKey[]).map((pk) => (
          <GuideCard key={pk} pk={pk} />
        ))}
        <CrossCuttingCard />
      </Accordion>
    </div>
  );
}
