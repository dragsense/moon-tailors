export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (params: Record<string, unknown>) =>
    [...customerKeys.details(), params] as const,
};
