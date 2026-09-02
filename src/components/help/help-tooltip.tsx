"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type HelpTooltipProps = {
  children?: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  iconClassName?: string;
  tone?: string;
};

export function HelpTooltip({
  children,
  content,
  side = "top",
  align = "center",
  className,
  iconClassName,
  tone,
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Help"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              iconClassName,
            )}
            style={tone ? { color: tone } : undefined}
          >
            {children ?? <HelpCircle className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className={cn("max-w-xs text-xs leading-relaxed", className)}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
