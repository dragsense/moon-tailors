export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  listWithParams: (params: Record<string, unknown>) =>
    [...customerKeys.list(), params] as const,
  detail: () => [...customerKeys.all, "detail"] as const,
  detailWithParams: (params: Record<string, unknown>) =>
    [...customerKeys.detail(), params] as const,
};
