import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useNumberFormat,
  setNumberFormat,
  type MoneyUnit,
  type MoneyDecimals,
  formatMoney,
  type NumberFormatPrefs,
} from "@/lib/number-format";

const UNITS: { key: MoneyUnit; label: string; hint: string }[] = [
  { key: "auto", label: "Auto", hint: "K / M per value" },
  { key: "full", label: "Full", hint: "1,250,000" },
  { key: "k", label: "Thousands (K)", hint: "1,250K" },
  { key: "m", label: "Millions (M)", hint: "1.3M" },
];

const DECIMALS: { key: MoneyDecimals; label: string }[] = [
  { key: "auto", label: "Auto" },
  { key: 0, label: "0 decimals" },
  { key: 1, label: "1 decimal" },
  { key: 2, label: "2 decimals" },
];

/** Short summary of the active setting, e.g. "$ Auto" or "$ M · 2". */
export function formatPrefsLabel(prefs: NumberFormatPrefs): string {
  const unit =
    prefs.unit === "auto" ? "Auto" : prefs.unit === "full" ? "Full" : prefs.unit === "k" ? "K" : "M";
  const dec = prefs.decimals === "auto" ? "" : ` · ${prefs.decimals}`;
  return `$ ${unit}${dec}`;
}

export function NumberFormatMenu({ variant = "header" }: { variant?: "header" | "inline" }) {
  const prefs = useNumberFormat();
  const label = formatPrefsLabel(prefs);

  const triggerClass =
    variant === "inline"
      ? "inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      : "inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClass}
        aria-label="Number format"
        title="Number format — units and decimals for money values"
      >
        <span className="tabular-nums">{label}</span>
        <ChevronDown className={variant === "inline" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Units</DropdownMenuLabel>
        {UNITS.map((u) => (
          <DropdownMenuItem
            key={u.key}
            className="flex items-center justify-between gap-3"
            onClick={() => setNumberFormat({ unit: u.key })}
          >
            <span className="flex flex-col">
              <span>{u.label}</span>
              <span className="text-xs text-muted-foreground">{u.hint}</span>
            </span>
            {prefs.unit === u.key && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Decimals</DropdownMenuLabel>
        {DECIMALS.map((d) => (
          <DropdownMenuItem
            key={String(d.key)}
            className="flex items-center justify-between gap-3"
            onClick={() => setNumberFormat({ decimals: d.key })}
          >
            <span>{d.label}</span>
            {prefs.decimals === d.key && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Applies to money values on screen. Resets on reload.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Full-size units/decimals picker for the Settings page. */
export function NumberFormatSettings() {
  const prefs = useNumberFormat();

  const chip = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Units</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {UNITS.map((u) => (
            <button key={u.key} className={chip(prefs.unit === u.key)} onClick={() => setNumberFormat({ unit: u.key })}>
              {u.label}
              <span className="ml-1.5 text-xs opacity-70">{u.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decimals</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DECIMALS.map((d) => (
            <button
              key={String(d.key)}
              className={chip(prefs.decimals === d.key)}
              onClick={() => setNumberFormat({ decimals: d.key })}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        1,250,000 shows as <span className="font-medium tabular-nums text-foreground">{formatMoney(1250000, prefs)}</span>.
        Applies to money values across every chart and screen.
      </p>
    </div>
  );
}
