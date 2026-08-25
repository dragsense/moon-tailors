export const garmentTypeKeys = {
  all: ["garment-types"] as const,
  lists: () => [...garmentTypeKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...garmentTypeKeys.lists(), params] as const,
  catalog: (audience?: string) =>
    [...garmentTypeKeys.all, "catalog", audience ?? "all"] as const,
};
