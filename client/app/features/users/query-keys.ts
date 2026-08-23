/** Domain query keys for users — list + dropdown share cache across packs. */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...userKeys.lists(), params] as const,
  dropdowns: () => [...userKeys.all, "dropdown"] as const,
  dropdown: (params: Record<string, unknown>) =>
    [...userKeys.dropdowns(), params] as const,
};
