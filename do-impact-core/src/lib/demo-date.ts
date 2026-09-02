import { useActiveCompany } from "@/hooks/use-companies";

/**
 * The TitanScale Template workspace is seeded with demo data around June–July 2026.
 * Views that normally anchor on "today" would look empty, so inside the template
 * workspace we anchor them on this fixed demo date instead.
 */
export const DEMO_ANCHOR_DATE = new Date(2026, 6, 15); // 15 Jul 2026

export function useIsTemplateCompany(): boolean {
  const activeCompany = useActiveCompany();
  return activeCompany.data?.companies?.is_template === true;
}

/** Returns the demo date inside the template workspace, otherwise the real current date. */
export function useDemoNow(): Date {
  const isTemplate = useIsTemplateCompany();
  return isTemplate ? new Date(DEMO_ANCHOR_DATE) : new Date();
}
