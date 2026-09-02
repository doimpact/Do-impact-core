/** Public origin used for auth redirects (invites, password reset, OAuth). */
export const AUTH_SITE_URL =
  (import.meta.env as { VITE_AUTH_SITE_URL?: string }).VITE_AUTH_SITE_URL ??
  "https://www.doimpact.app";
