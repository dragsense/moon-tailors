import {
  EventSubscriber,
  type EntitySubscriberInterface,
  type InsertEvent,
  type UpdateEvent,
} from "typeorm";
import { RequestContext } from "../context";
import { GeneralBaseEntity } from "./base.entity";

/**
 * Fills audit + tenant fields from ALS when the entity extends GeneralBaseEntity.
 * Soft-delete is manual (`deletedAt`); set deletedByUserId in services when soft-deleting.
 */
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<unknown>): void {
    const entity = event.entity;
    if (!(entity instanceof GeneralBaseEntity)) return;

    if (entity.tenantId == null) {
      const tenantId = RequestContext.get("tenantId");
      if (tenantId) entity.tenantId = tenantId;
    }

    const userId = RequestContext.get("userId");
    if (!userId) return;
    if (!entity.createdByUserId) entity.createdByUserId = userId;
    if (!entity.updatedByUserId) entity.updatedByUserId = userId;
  }

  beforeUpdate(event: UpdateEvent<unknown>): void {
    const entity = event.entity;
    if (!(entity instanceof GeneralBaseEntity)) return;
    const userId = RequestContext.get("userId");
    if (!userId) return;
    entity.updatedByUserId = userId;
  }
}
