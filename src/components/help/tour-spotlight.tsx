"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTour } from "@/components/help/tour-context";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TourSpotlight() {
  const { activeTour, activeStep, activeStepIndex, isRunning, nextStep, prevStep, stopTour, completeTour } = useTour();
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);
  const [placement, setPlacement] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!isRunning || !activeStep) {
      setTargetRect(null);
      return;
    }

    const step = activeStep;

    function update() {
      const el = document.querySelector(step.targetSelector);
      if (!el) {
        setTargetRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

      const cardWidth = 320;
      const cardHeight = 180;
      const gap = 16;
      const pos = step.position ?? "bottom";
      let top = 0;
      let left = 0;

      switch (pos) {
        case "top":
          top = rect.top - cardHeight - gap;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case "bottom":
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.left - cardWidth - gap;
          break;
        case "right":
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.right + gap;
          break;
      }

      // Clamp to viewport
      top = Math.max(gap, Math.min(top, window.innerHeight - cardHeight - gap));
      left = Math.max(gap, Math.min(left, window.innerWidth - cardWidth - gap));
      setPlacement({ top, left });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const id = setInterval(update, 500);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearInterval(id);
    };
  }, [isRunning, activeStep]);

  if (!isRunning || !activeTour || !activeStep) return null;

  const total = activeTour.steps.length;
  const isLast = activeStepIndex === total - 1;
  const hasTarget = !!targetRect;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/40" onClick={stopTour} />
      {/* Highlight cutout */}
      {targetRect && (
        <div
          className="fixed z-[101] rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      {/* Step card */}
      <div
        data-testid="tour-spotlight-card"
        className={cn(
          "fixed z-[102] w-80 rounded-xl border bg-card p-4 shadow-xl transition-all duration-300",
          !hasTarget && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={hasTarget ? { top: placement.top, left: placement.left } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm">{activeStep.title}</h4>
          <button
            type="button"
            onClick={stopTour}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{activeStep.body}</p>
        {!hasTarget && (
          <p className="mt-2 text-xs text-amber-500">This part of the page is not visible right now — continue to the next step or come back when the feature is enabled.</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {activeStepIndex + 1} / {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevStep} disabled={activeStepIndex === 0} aria-label="Previous step">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={isLast ? completeTour : nextStep} aria-label={isLast ? "Complete tour" : "Next step"}>
              {isLast ? (
                <>
                  <Check className="h-4 w-4 mr-1" /> Done
                </>
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
