import {
  Column,
  Entity,
  Index,
  Unique,
} from "typeorm";
import { GeneralBaseEntity } from "../../../entities";

@Entity("base_push_subscriptions")
@Unique(["userId", "endpoint"])
export class PushSubscriptionEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  endpoint!: string;

  @Column({ type: "jsonb" })
  keys!: { p256dh: string; auth: string };

  @Column({ type: "varchar", length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  deviceId!: string | null;
}
