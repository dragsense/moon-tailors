/**
 * Modules opt in with a tiny registration — endpoint + module.
 * HTTP/CRUD operations and entity source are derived automatically.
 *
 * @example
 * DomainEventRegistry.register({
 *   module: "tasks",
 *   events: { endpoint: "/api/tasks" },
 * });
 */
import type { DomainEventRegistration, DomainEventRule } from "./types";

const DEFAULT_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const DEFAULT_OPERATIONS = [
  "crud.create",
  "crud.update",
  "crud.delete",
  "crud.restore",
  "crud.permanentlyDelete",
  "http.create",
  "http.update",
  "http.delete",
  "http.action",
];

/** `tasks` → `task`, `businesses` → `business`, `users` → `user`. */
export function defaultSourceFromModule(module: string): string {
  const m = module.trim().toLowerCase();
  if (m.endsWith("ies")) return `${m.slice(0, -3)}y`;
  if (m.endsWith("s") && m.length > 1) return m.slice(0, -1);
  return m;
}

function normalizeEndpoints(endpoint: string | string[]): string[] {
  const list = Array.isArray(endpoint) ? endpoint : [endpoint];
  return list.map((e) => e.trim()).filter(Boolean);
}

export class DomainEventRegistry {
  private static readonly rules: DomainEventRule[] = [];

  static register(input: DomainEventRegistration): void {
    const endpoints = normalizeEndpoints(input.events.endpoint);
    if (!endpoints.length) return;

    const source = (
      input.events.source ?? defaultSourceFromModule(input.module)
    )
      .trim()
      .toLowerCase();
    const methods = input.events.methods?.length
      ? [...input.events.methods]
      : [...DEFAULT_METHODS];
    const operations = input.events.operations?.length
      ? [...input.events.operations]
      : [...DEFAULT_OPERATIONS];
    const tableName = input.events.tableName ?? input.module;

    const existing = this.rules.find((r) => r.module === input.module);
    if (existing) {
      existing.endpoints = Array.from(
        new Set([...existing.endpoints, ...endpoints]),
      );
      existing.methods = Array.from(
        new Set([...existing.methods, ...methods]),
      );
      existing.sources = Array.from(
        new Set([...existing.sources, source]),
      );
      existing.operations = Array.from(
        new Set([...existing.operations, ...operations]),
      );
      if (tableName) existing.tableName = tableName;
      return;
    }

    this.rules.push({
      module: input.module,
      endpoints,
      methods,
      sources: [source],
      operations,
      tableName,
    });
  }

  static clear(): void {
    this.rules.length = 0;
  }

  static list(): readonly DomainEventRule[] {
    return this.rules;
  }

  /** HTTP interceptor gate. */
  static matchesEndpoint(endpoint: string, method: string): boolean {
    return Boolean(this.ruleForEndpoint(endpoint, method));
  }

  /** Full rule for an HTTP request (method-aware). */
  static ruleForEndpoint(
    endpoint: string,
    method?: string,
  ): DomainEventRule | null {
    const path = endpoint.split("?")[0] ?? endpoint;
    const upper = method?.toUpperCase();

    return (
      this.rules.find((rule) => {
        if (!rule.endpoints.length) return false;
        if (upper) {
          if (!rule.methods.map((m) => m.toUpperCase()).includes(upper)) {
            return false;
          }
        }
        return rule.endpoints.some(
          (prefix) =>
            path === prefix ||
            path.startsWith(`${prefix}/`) ||
            path.includes(prefix),
        );
      }) ?? null
    );
  }

  /** Service / DB emit gate — `source` + `operation` (e.g. task + crud.create). */
  static matchesSource(source: string, operation: string): boolean {
    const src = source.toLowerCase();
    const op = operation.toLowerCase();

    return this.rules.some((rule) => {
      if (!rule.sources.length) return false;
      if (!rule.sources.map((s) => s.toLowerCase()).includes(src)) {
        return false;
      }
      const ops = rule.operations.map((o) => o.toLowerCase());
      return ops.includes(op) || ops.includes("*");
    });
  }

  static moduleForEndpoint(endpoint: string): string | null {
    return this.ruleForEndpoint(endpoint)?.module ?? null;
  }

  /** Primary entity source for auto crud emits. */
  static primarySourceForEndpoint(endpoint: string): string | null {
    const rule = this.ruleForEndpoint(endpoint);
    return rule?.sources[0] ?? null;
  }
}

export function httpOperationFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case "POST":
      return "http.create";
    case "PUT":
    case "PATCH":
      return "http.update";
    case "DELETE":
      return "http.delete";
    default:
      return "http.action";
  }
}

/** Map HTTP method (+ path hints) → crud operation for auto entity emits. */
export function crudOperationFromRequest(
  method: string,
  endpoint: string,
): string {
  const path = (endpoint.split("?")[0] ?? endpoint).toLowerCase();
  if (
    path.includes("/bulk-delete") ||
    path.endsWith("/delete") ||
    path.includes("/remove")
  ) {
    return "crud.delete";
  }

  switch (method.toUpperCase()) {
    case "POST":
      return "crud.create";
    case "PUT":
    case "PATCH":
      return "crud.update";
    case "DELETE":
      return "crud.delete";
    default:
      return "crud.action";
  }
}
