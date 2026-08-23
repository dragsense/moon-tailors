/**
 * Domain event payload.
 * Event name: `{source}.{operation}` e.g. `task.crud.create`, `tasks.http.update`.
 *
 * `data` always includes tenant/business/user snapshot from RequestContext at
 * emit time. Listeners should use `runWithEventContext(payload, …)` to restore ALS.
 */
export type EventPayload = {
  entity?: unknown;
  entityId?: string;
  operation: string;
  source: string;
  tableName?: string;
  timestamp: Date;
  oldEntity?: unknown;
  data?: Record<string, unknown>;
};

export type EmitEntityInput = {
  source: string;
  operation: string;
  entity?: unknown;
  entityId?: string;
  tableName?: string;
  oldEntity?: unknown;
  data?: Record<string, unknown>;
};

/**
 * Simple module registration — HTTP + CRUD ops are derived automatically.
 *
 * @example
 * DomainEventRegistry.register({
 * module: "tasks",
 * events: { endpoint: "/api/tasks" },
 * });
 * // → tasks.http.* + task.crud.* on POST/PUT/PATCH/DELETE
 */
export type DomainEventRegistration = {
  module: string;
  events: {
    /** Path prefix(es) watched by the HTTP interceptor. */
    endpoint: string | string[];
    /** Defaults to mutating methods. */
    methods?: string[];
    /**
     * Entity source for `{source}.crud.*`.
     * Default: singular of module (`tasks` → `task`).
     */
    source?: string;
    /** Attached to auto crud payloads. Default: module name. */
    tableName?: string;
    /** Allow-list; omit to allow all standard crud/http ops (auto). */
    operations?: string[];
  };
};

/** Normalized internal rule (after register). */
export type DomainEventRule = {
  module: string;
  endpoints: string[];
  methods: string[];
  sources: string[];
  operations: string[];
  tableName?: string;
};
