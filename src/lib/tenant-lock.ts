// DO.Impact Core (open-source edition) — the hosted demo "showcase" lock does
// not exist locally. All lock checks are no-ops.

export const SHOWCASE_COMPANY_ID = "9d12cf46-98e4-40ca-aed4-bcc95257d8b5"; // TitanScale Template

export function isShowcaseHost(): boolean {
  return false;
}

export function getLockedCompanyId(): string | null {
  return null;
}

export function enterShowcase(): void {}

export function exitShowcase(): void {}
