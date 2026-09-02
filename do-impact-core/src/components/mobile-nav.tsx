import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PILLARS, SUB_NAV, PILLAR_TONE, tint, type PillarKey } from "@/lib/nav-registry";
import { Wordmark } from "@/components/wordmark";

type Props = {
  visible: (key: string) => boolean;
};

export function MobileNav({ visible }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const pillars = PILLARS.filter((p) => visible(p.navKey));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className="min-h-11 min-w-11 shrink-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>
            <Wordmark className="font-bold tracking-tight" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-2 py-3">
          <Link
            to="/overview"
            className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-sm ${
              pathname === "/overview" ? "bg-secondary font-semibold text-secondary-foreground" : "text-foreground"
            }`}
          >
            <Home className="h-4 w-4" />
            Overview
          </Link>

          {pillars.map((p) => {
            const tone = PILLAR_TONE[p.key as PillarKey];
            const isActive = !!p.match && pathname.startsWith(p.match);
            const subs = (SUB_NAV[p.key] ?? []).filter((s) => visible(s.key));
            return (
              <div key={p.to} className="mt-1">
                <Link
                  to={p.to}
                  aria-current={isActive ? "page" : undefined}
                  className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold"
                  style={{
                    backgroundColor: isActive ? tint(tone, 14) : undefined,
                    color: tone,
                  }}
                >
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tone }} />
                  <span className="flex-1 truncate">{p.label}</span>
                  {!isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                </Link>

                {isActive && subs.length > 0 && (
                  <div
                    className="mt-1 ml-4 flex flex-col border-l pl-3"
                    style={{ borderColor: tint(tone, 35) }}
                  >
                    {subs.map((s) => {
                      const subActive = pathname === s.to;
                      return (
                        <Link
                          key={s.to}
                          to={s.to}
                          aria-current={subActive ? "page" : undefined}
                          className={`flex min-h-11 items-center rounded-md px-2 text-sm ${
                            subActive ? "font-semibold" : "text-muted-foreground"
                          }`}
                          style={subActive ? { color: tone } : undefined}
                        >
                          {s.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
