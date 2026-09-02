// DO.Impact Core (open-source edition) — no free-tier sandbox locally.

export const FREE_TRIAL_DAYS = 0;

export function useSandbox() {
  return {
    isLoading: false,
    isFreeTier: false,
    isSandbox: false,
    isExpired: false,
    daysLeft: 0,
    expiresAt: null as Date | null,
  };
}
