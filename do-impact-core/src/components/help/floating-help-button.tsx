"use client";

import * as React from "react";
import { HelpCircle, Play, LifeBuoy, X, BookOpen, Search } from "lucide-react";
import { useTour } from "@/components/help/tour-context";
import { openHelpSearch } from "@/components/help/help-search";
import { getHelpEntry } from "@/lib/help-registry";
import { useRouterState, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";


export function FloatingHelpButton() {
  const { currentRouteTour, startTour, isRunning, hasCompleted, stopTour } = useTour();
  const [open, setOpen] = React.useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const helpEntry = getHelpEntry(pathname);

  // Hide on kiosk / fullscreen / meeting modes
  if (pathname.startsWith("/floor") || pathname.startsWith("/meeting")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="mb-2 w-64 rounded-xl border bg-card p-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openHelpSearch();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
          >
            <Search className="h-4 w-4 text-primary" />
            <span className="flex-1">Search the app</span>
            <kbd className="rounded border px-1 text-[10px] text-muted-foreground">⌘K</kbd>
          </button>
          {currentRouteTour && (

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                startTour(currentRouteTour.id);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <Play className="h-4 w-4 text-primary" />
              <span className="flex-1 truncate">
                {hasCompleted(currentRouteTour.id) ? "Replay tour" : "Tour this page"}
              </span>
            </button>
          )}
          {helpEntry && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t mt-1 pt-2">
              <span className="font-medium text-foreground">{helpEntry.title}</span>
              <p className="mt-1 line-clamp-3">{helpEntry.shortBlurb}</p>
            </div>
          )}
          <Link
            to="/support"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <LifeBuoy className="h-4 w-4" />
            Support center
          </Link>
          <Link
            to="/support"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <BookOpen className="h-4 w-4" />
            FAQ
          </Link>
        </div>
      )}
      <button
        type="button"
        data-testid="floating-help-button"
        onClick={() => {
          if (isRunning) {
            stopTour();
          } else {
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isRunning ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        aria-label={isRunning ? "Stop tour" : "Help"}
      >
        {isRunning ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
