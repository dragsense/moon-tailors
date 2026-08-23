import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request, Response } from "express";
import {
  DomainEventRegistry,
  crudOperationFromRequest,
  httpOperationFromMethod,
} from "../domain-event.registry";
import { EventService } from "../event.service";

/**
 * Activity-log twin for domain events.
 *
 * For registered mutating endpoints, after a successful response emits:
 * 1. `{module}.http.{create|update|delete}` — telemetry / HTTP audit
 * 2. `{source}.crud.{create|update|delete}` — entity event for listeners
 *    (entity taken from response body or route `:id`)
 *
 * Services should NOT call `emitEntity` for normal HTTP CRUD — register the
 * module in DomainEventRegistry instead. Use manual `emitEntity` only for
 * non-HTTP paths (jobs, seeders) or extra `data` that never appears in the
 * response (prefer putting one-time fields like temp passwords on the DTO).
 */
@Injectable()
export class DomainEventInterceptor implements NestInterceptor {
  constructor(private readonly events: EventService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const url = request.originalUrl || request.url;
    const method = request.method;

    if (url.includes("/events")) {
      return next.handle();
    }

    if (!this.events.isGloballyEnabled()) {
      return next.handle();
    }

    const rule = DomainEventRegistry.ruleForEndpoint(url, method);
    if (!rule) {
      return next.handle();
    }

    const moduleName = rule.module;
    const httpOperation = httpOperationFromMethod(method);
    const crudOperation = crudOperationFromRequest(method, url);
    const source = rule.sources?.[0] ?? null;

    return next.handle().pipe(
      tap((body) => {
        if (response.statusCode >= 400) return;

        this.events.emitHttp({
          module: moduleName,
          operation: httpOperation,
          endpoint: url,
          method,
          statusCode: response.statusCode,
        });

        if (!source) return;
        if (!DomainEventRegistry.matchesSource(source, crudOperation)) return;

        const extracted = extractEntityPayload(body, request);
        this.events.emitEntity({
          source,
          operation: crudOperation,
          entity: extracted.entity,
          entityId: extracted.entityId,
          tableName: rule.tableName,
          data: extracted.data,
        });
      }),
    );
  }
}

/**
 * Pull entity (+ optional one-time fields) from a controller response.
 * Supports:
 * - bare entity `{ id, ... }`
 * - wrapped `{ user|task|data: { id, ... } }`
 * - create-user shape `{ message, user: { id, password? } }` → data.tempPassword
 * - delete with only `{ message }` → entityId from route params
 */
function extractEntityPayload(
  body: unknown,
  request: Request,
): {
  entity?: unknown;
  entityId?: string;
  data?: Record<string, unknown>;
} {
  const paramId =
    typeof request.params?.id === "string" ? request.params.id : undefined;

  if (!body || typeof body !== "object") {
    return { entityId: paramId };
  }

  const obj = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  const wrapped =
    pickObject(obj.user) ??
    pickObject(obj.task) ??
    pickObject(obj.entity) ??
    pickObject(obj.data);

  const entity = wrapped ?? (typeof obj.id === "string" ? obj : undefined);

  if (entity && typeof entity === "object") {
    const record = entity as Record<string, unknown>;
    if (typeof record.password === "string" && record.password) {
      data.tempPassword = record.password;
    }
    const entityId =
      typeof record.id === "string" ? record.id : paramId;
    return {
      entity,
      entityId,
      data: Object.keys(data).length ? data : undefined,
    };
  }

  // Bulk delete: forward ids when present
  if (Array.isArray(obj.ids)) {
    data.ids = obj.ids;
    return {
      entityId: paramId,
      data,
    };
  }

  return {
    entityId: paramId,
    data: Object.keys(data).length ? data : undefined,
  };
}

function pickObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}
