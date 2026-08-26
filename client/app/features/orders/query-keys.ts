export const orderKeys = {
  all: ["orders"] as const,
  list: () => [...orderKeys.all, "list"] as const,
  listWithParams: (params: Record<string, unknown>) =>
    [...orderKeys.list(), params] as const,
  detail: () => [...orderKeys.all, "detail"] as const,
  detailWithParams: (params: Record<string, unknown>) =>
    [...orderKeys.detail(), params] as const,
};
