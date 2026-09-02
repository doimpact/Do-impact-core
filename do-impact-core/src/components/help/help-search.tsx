"use client";

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchDestinations, DESTINATION_GROUP_ORDER, type Destination } from "@/lib/destination-index";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { EyeOff } from "lucide-react";

export const OPEN_SEARCH_EVENT = "doimpact:open-search";

export function openHelpSearch() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
}

const RECENTS_KEY = "doimpact.search.recents";

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function HelpSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [recents, setRecents] = React.useState<string[]>([]);
  const navigate = useNavigate();
  const { isEnabled } = useUserPreferences();

  React.useEffect(() => {
    setRecents(readRecents());
  }, [open]);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = React.useMemo(() => searchDestinations(query), [query]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Destination[]>();
    for (const d of results) {
      const list = map.get(d.group) ?? [];
      list.push(d);
      map.set(d.group, list);
    }
    return DESTINATION_GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const);
  }, [results]);

  const go = (d: Destination) => {
    const trimmed = query.trim();
    if (trimmed) {
      const next = [trimmed, ...recents.filter((r) => r !== trimmed)].slice(0, 6);
      setRecents(next);
      try {
        window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — recents are best-effort */
      }
    }
    setOpen(false);
    setQuery("");
    navigate({ to: d.path, search: d.search ?? {} } as never);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search for a module, tool or report — e.g. safety management system"
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          No match. Try a shorter word, an acronym (OEE, SMS, 8D) or browse the Support center.
        </CommandEmpty>

        {!query && recents.length > 0 && (
          <CommandGroup heading="Recent searches">
            {recents.map((r) => (
              <CommandItem key={r} value={`recent-${r}`} onSelect={() => setQuery(r)}>
                {r}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {grouped.map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((d) => {
              const hidden = d.key ? !isEnabled(d.key) : false;
              return (
                <CommandItem
                  key={`${d.path}-${d.label}`}
                  value={`${d.label} ${d.path} ${d.keywords.join(" ")}`}
                  onSelect={() => go(d)}
                  className="items-start gap-3"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: d.tone }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{d.label}</span>
                      {hidden && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <EyeOff className="h-3 w-3" /> hidden in your settings
                        </span>
                      )}
                    </span>
                    {d.description && (
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{d.description}</span>
                    )}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
