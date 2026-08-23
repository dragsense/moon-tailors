import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  eventContextFromPayload,
  runWithEventContext,
  type EventPayload,
} from "../../../common/events";

/**
 * Task domain listeners — tenant-aware .
 * CRUD events come from DomainEventInterceptor; handlers re-enter
 * RequestContext via runWithEventContext so DB routing sees tenantId.
 */
@Injectable()
export class TaskEventListener {
  private readonly logger = new Logger(TaskEventListener.name);

  @OnEvent("task.crud.create")
  async onCreated(payload: EventPayload) {
    await runWithEventContext(payload, async () => {
      const ctx = eventContextFromPayload(payload);
      this.logger.log(
        `task.crud.create ${payload.entityId}` +
          (ctx.tenantId ? ` tenant=${ctx.tenantId}` : "") +
          (ctx.businessId ? ` business=${ctx.businessId}` : ""),
      );
    });
  }

  @OnEvent("task.crud.update")
  async onUpdated(payload: EventPayload) {
    await runWithEventContext(payload, async () => {
      const ctx = eventContextFromPayload(payload);
      this.logger.log(
        `task.crud.update ${payload.entityId}` +
          (ctx.tenantId ? ` tenant=${ctx.tenantId}` : ""),
      );
    });
  }

  @OnEvent("task.crud.delete")
  async onDeleted(payload: EventPayload) {
    await runWithEventContext(payload, async () => {
      const ctx = eventContextFromPayload(payload);
      this.logger.log(
        `task.crud.delete ${payload.entityId}` +
          (ctx.tenantId ? ` tenant=${ctx.tenantId}` : ""),
      );
    });
  }

  /** HTTP interceptor events use the module name (`tasks.http.create`). */
  @OnEvent("tasks.http.*")
  async onHttp(payload: EventPayload) {
    await runWithEventContext(payload, async () => {
      this.logger.debug(
        `tasks.http ${payload.operation} ${(payload.data as { endpoint?: string })?.endpoint}`,
      );
    });
  }
}
