/**
 * DO.Impact Core (open-source edition) runs in single-user local mode:
 * there is no login. Every module acts on behalf of one fixed local identity.
 */
export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";

export const LOCAL_USER = {
  id: LOCAL_USER_ID,
  email: "operator@localhost",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: { full_name: "Local Operator" },
  created_at: "2024-01-01T00:00:00.000Z",
} as const;
