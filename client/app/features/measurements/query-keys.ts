export const measurementKeys = {
  all: ["measurements"] as const,
  detail: () => [...measurementKeys.all, "detail"] as const,
  detailWithParams: (params: Record<string, unknown>) =>
    [...measurementKeys.detail(), params] as const,
};
