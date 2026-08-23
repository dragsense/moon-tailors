import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  IPaginatedResponse,
  TCreateNotificationData,
  TNotificationListQuery,
} from "@template/contracts";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import type { EntityKey, EntityQueryConfig } from "../../query";
import { NotificationEntity } from "./entities";

export const NOTIFICATION_QUERY: EntityQueryConfig = {
  alias: "notification",
  sortable: ["createdAt", "updatedAt", "priority", "isRead"],
  defaultSort: { field: "createdAt", order: "DESC" },
  searchable: ["title", "message"],
};

@Injectable()
export class BaseNotificationsService {
  private readonly entity: IBoundEntityService<NotificationEntity>;

  constructor(private readonly entityService: EntityService) {
    this.entity = this.entityService.bind(
      NotificationEntity,
      NOTIFICATION_QUERY,
    );
  }

  create(input: TCreateNotificationData): Promise<NotificationEntity> {
    return this.entity.create({
      title: input.title,
      message: input.message,
      type: input.type,
      priority: input.priority,
      recipientId: input.recipientId,
      entityType: input.entityType ?? null,
      metadata: input.metadata ?? null,
      isRead: false,
    });
  }

  findById(id: string): Promise<NotificationEntity | null> {
    return this.entity.get(id);
  }

  async requireForRecipient(
    id: EntityKey,
    recipientId: string,
  ): Promise<NotificationEntity> {
    const row = await this.entity.get(id, {
      access: { type: "eq", column: "recipientId", value: recipientId },
    });
    if (!row) throw new NotFoundException("Notification not found");
    return row;
  }

  /**
   * List notifications for a recipient (ACL baked in — client cannot widen).
   */
  list(
    recipientId: string,
    query: TNotificationListQuery,
  ): Promise<IPaginatedResponse<NotificationEntity>> {
    return this.entity.list(query, {
      access: { type: "eq", column: "recipientId", value: recipientId },
      beforeQuery: (builder) => {
        if (query.unreadOnly) {
          builder.andWhere("notification.isRead = false");
        }
      },
    });
  }

  getUnreadCount(recipientId: string): Promise<number> {
    return this.entity.getRepository().count({
      where: { recipientId, isRead: false },
    });
  }

  async markAsRead(
    id: EntityKey,
    recipientId: string,
  ): Promise<NotificationEntity> {
    await this.requireForRecipient(id, recipientId);
    return this.entity.update(
      id,
      { isRead: true },
      undefined,
      { access: { type: "eq", column: "recipientId", value: recipientId } },
    );
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await this.entity.getRepository().update(
      { recipientId, isRead: false },
      { isRead: true },
    );
    return result.affected ?? 0;
  }

  async remove(id: EntityKey, recipientId: string): Promise<void> {
    await this.requireForRecipient(id, recipientId);
    await this.entity.hardDelete(id, undefined, {
      access: { type: "eq", column: "recipientId", value: recipientId },
    });
  }
}
