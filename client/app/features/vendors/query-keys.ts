export const vendorKeys = {
  all: ["vendors"] as const,
  list: () => [...vendorKeys.all, "list"] as const,
  listWithParams: (params: Record<string, unknown>) =>
    [...vendorKeys.list(), params] as const,
  detail: () => [...vendorKeys.all, "detail"] as const,
  detailWithParams: (params: Record<string, unknown>) =>
    [...vendorKeys.detail(), params] as const,
  slip: () => [...vendorKeys.all, "slip"] as const,
  slipWithParams: (params: Record<string, unknown>) =>
    [...vendorKeys.slip(), params] as const,
};
