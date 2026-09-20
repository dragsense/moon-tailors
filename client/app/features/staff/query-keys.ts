export const staffKeys = {
  all: ["staff"] as const,
  list: () => [...staffKeys.all, "list"] as const,
  listWithParams: (params: Record<string, unknown>) =>
    [...staffKeys.list(), params] as const,
  detail: () => [...staffKeys.all, "detail"] as const,
  detailWithParams: (params: Record<string, unknown>) =>
    [...staffKeys.detail(), params] as const,
  slip: () => [...staffKeys.all, "slip"] as const,
  slipWithParams: (params: Record<string, unknown>) =>
    [...staffKeys.slip(), params] as const,
};
