/**
 * Build URLSearchParams from a plain object (nested objects JSON-stringified).
 */
export function generateQueryParams(
  params: URLSearchParams,
  source: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        params.append(key, String(item));
      }
      continue;
    }
    if (typeof value === "object") {
      params.set(key, JSON.stringify(value));
      continue;
    }
    params.set(key, String(value));
  }
}

export function toQueryString(source?: Record<string, unknown>): string {
  if (!source) return "";
  const params = new URLSearchParams();
  generateQueryParams(params, source);
  const q = params.toString();
  return q ? `?${q}` : "";
}
