/** Domain query keys for tasks — shared across page ops packs. */
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...taskKeys.lists(), params] as const,
};
