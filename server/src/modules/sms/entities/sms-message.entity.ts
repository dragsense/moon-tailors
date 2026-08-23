import { Column, Entity, Index } from "typeorm";
import { ESmsDirection, ESmsStatus } from "@template/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("sms_messages")
export class SmsMessageEntity extends GeneralBaseEntity {
  @Column({ type: "uuid", nullable: true })
  senderId!: string | null;

  @Column({ type: "varchar", length: 30 })
  fromPhone!: string;

  @Column({ type: "varchar", length: 30 })
  toPhone!: string;

  /** Thread key — the remote party's phone. */
  @Index()
  @Column({ type: "varchar", length: 30 })
  contactPhone!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "varchar", length: 20 })
  direction!: ESmsDirection;

  @Column({ type: "varchar", length: 20, default: ESmsStatus.PENDING })
  status!: ESmsStatus;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 64, nullable: true })
  twilioMessageSid!: string | null;

  @Column({ type: "text", nullable: true })
  error!: string | null;
}
