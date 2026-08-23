import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { EventsConfig } from "../../config/events.config";
import { RequestContext } from "../context";
import { DomainEventRegistry } from "./domain-event.registry";
import type { EmitEntityInput, EventPayload } from "./types";

/**
 * Nest EventEmitter2 wrapper.
 * Honors EVENTS_ENABLED + DomainEventRegistry before emitting.
 */
@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  isGloballyEnabled(): boolean {
    return this.config.getOrThrow<EventsConfig>("events").enabled === true;
  }

  /**
 * Low-level emit. Skips when disabled.
 * Prefer `emitEntity` so registry source/operation checks apply.
 */
  emit(eventType: string, payload: EventPayload): void {
    if (!this.isGloballyEnabled()) return;
    try {
      this.logger.debug(`Emitting ${eventType}`);
      this.eventEmitter.emit(eventType, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to emit ${eventType}: ${message}`);
    }
  }

  /**
 * Emit `{source}.{operation}` after a DB/service mutation.
 * No-ops unless EVENTS_ENABLED and the source+operation are registered.
 */
  emitEntity(input: EmitEntityInput): void {
    if (!this.isGloballyEnabled()) return;
    if (!DomainEventRegistry.matchesSource(input.source, input.operation)) {
      return;
    }

    const entityId =
      input.entityId ??
      (input.entity &&
      typeof input.entity === "object" &&
      input.entity !== null &&
      "id" in input.entity
        ? String((input.entity as { id: unknown }).id)
        : undefined);

    const payload: EventPayload = {
      entity: input.entity,
      entityId,
      operation: input.operation,
      source: input.source.toLowerCase(),
      tableName: input.tableName,
      timestamp: new Date(),
      oldEntity: input.oldEntity,
      data: {
        ...input.data,
        tenantId: RequestContext.get("tenantId"),
        businessId: RequestContext.get("businessId"),
        userId: RequestContext.get("userId"),
        subdomain: RequestContext.get("subdomain"),
      },
    };

    this.emit(`${payload.source}.${input.operation}`, payload);
  }

  /**
 * Emit after a successful HTTP mutation registered by endpoint.
 * Event name: `{module}.{http.create|http.update|http.delete|http.action}`.
 */
  emitHttp(input: {
    module: string;
    operation: string;
    endpoint: string;
    method: string;
    statusCode?: number;
    data?: Record<string, unknown>;
  }): void {
    if (!this.isGloballyEnabled()) return;
    if (!DomainEventRegistry.matchesEndpoint(input.endpoint, input.method)) {
      return;
    }

    const source = input.module.toLowerCase();
    const payload: EventPayload = {
      operation: input.operation,
      source,
      timestamp: new Date(),
      data: {
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        tenantId: RequestContext.get("tenantId"),
        businessId: RequestContext.get("businessId"),
        userId: RequestContext.get("userId"),
        ...input.data,
      },
    };

    this.emit(`${source}.${input.operation}`, payload);
  }
}
