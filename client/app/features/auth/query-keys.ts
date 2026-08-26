/** Domain query keys for auth — session is global, not pack-scoped. */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "me"] as const,
};
