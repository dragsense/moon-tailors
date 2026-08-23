import {
  Column,
  Entity,
  Index,
} from "typeorm";
import {
  ENotificationPriority,
  ENotificationType,
} from "@template/contracts";
import { GeneralBaseEntity } from "../../../entities";

@Entity("base_notifications")
export class NotificationEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 32, default: ENotificationType.INFO })
  type!: ENotificationType;

  @Column({ type: "varchar", length: 32, default: ENotificationPriority.NORMAL })
  priority!: ENotificationPriority;

  @Index()
  @Column({ type: "uuid" })
  recipientId!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  entityType!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: "boolean", default: false })
  isRead!: boolean;
}
