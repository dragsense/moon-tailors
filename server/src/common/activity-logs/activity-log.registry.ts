import type { ActivityLogEndpointRule } from "./types";

const DEFAULT_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Modules register which API paths should write activity logs.
 * Global gate is still ACTIVITY_LOGS_ENABLED — when false, nothing is written.
 */
export class ActivityLogRegistry {
  private static readonly rules: ActivityLogEndpointRule[] = [];

  static register(rule: ActivityLogEndpointRule): void {
    const endpoints = rule.endpoints
      .map((e) => e.trim())
      .filter(Boolean);
    if (!endpoints.length) return;

    const existing = this.rules.find((r) => r.module === rule.module);
    if (existing) {
      existing.endpoints = Array.from(
        new Set([...existing.endpoints, ...endpoints]),
      );
      if (rule.methods?.length) {
        existing.methods = Array.from(
          new Set([...(existing.methods ?? DEFAULT_METHODS), ...rule.methods]),
        );
      }
      return;
    }

    this.rules.push({
      module: rule.module,
      endpoints,
      methods: rule.methods?.length ? [...rule.methods] : [...DEFAULT_METHODS],
    });
  }

  static clear(): void {
    this.rules.length = 0;
  }

  static list(): readonly ActivityLogEndpointRule[] {
    return this.rules;
  }

  static matches(endpoint: string, method: string): boolean {
    const path = endpoint.split("?")[0] ?? endpoint;
    const upper = method.toUpperCase();

    return this.rules.some((rule) => {
      const methods = rule.methods ?? DEFAULT_METHODS;
      if (!methods.map((m) => m.toUpperCase()).includes(upper)) {
        return false;
      }
      return rule.endpoints.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.includes(prefix),
      );
    });
  }
}
