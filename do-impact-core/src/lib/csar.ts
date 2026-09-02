export const STAGE_PROB: Record<string, number> = {
  draft: 0.1,
  sent: 0.3,
  negotiating: 0.6,
  approved: 0.9,
  closed_won: 1,
  closed_lost: 0,
};

export const STAGES = [
  "draft",
  "sent",
  "negotiating",
  "approved",
  "closed_won",
  "closed_lost",
] as const;
export type QuoteStatus = (typeof STAGES)[number];

export const STAGE_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  negotiating: "Negotiating",
  approved: "Approved",
  closed_won: "Closed — Won",
  closed_lost: "Closed — Lost",
};

export const OPEN_STAGES: QuoteStatus[] = ["draft", "sent", "negotiating", "approved"];

export function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export const INTERACTION_TYPES = ["call", "email", "meeting", "note", "update"] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_LABEL: Record<InteractionType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
  update: "Update",
};

export const TIERS = ["tier_1", "tier_2", "tier_3"] as const;
export type AccountTier = (typeof TIERS)[number];

export const TIER_LABEL: Record<AccountTier, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
};

export const TIER_DESCRIPTION: Record<AccountTier, string> = {
  tier_1: "Strategic / Key / New Prospects",
  tier_2: "Growth / Mid Market",
  tier_3: "Volume / Transactional",
};

export const TIER_BADGE_CLASS: Record<AccountTier, string> = {
  tier_1: "bg-primary text-primary-foreground",
  tier_2: "bg-secondary text-secondary-foreground",
  tier_3: "bg-muted text-muted-foreground border",
};
