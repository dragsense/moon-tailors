/** Domain query keys for files — shared across page ops packs. */
export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...fileKeys.lists(), params] as const,
  folders: () => [...fileKeys.all, "folders"] as const,
};
