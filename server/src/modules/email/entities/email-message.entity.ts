import { Column, Entity, Index } from "typeorm";
import { EEmailDirection, EEmailStatus } from "@template/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("email_messages")
export class EmailMessageEntity extends GeneralBaseEntity {
  @Column({ type: "uuid", nullable: true })
  senderId!: string | null;

  @Column({ type: "varchar", length: 255 })
  fromEmail!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  fromName!: string | null;

  @Column({ type: "varchar", length: 255 })
  toEmail!: string;

  /** Thread key — the remote party's email. */
  @Index()
  @Column({ type: "varchar", length: 255 })
  contactEmail!: string;

  @Column({ type: "varchar", length: 500 })
  subject!: string;

  @Column({ type: "text" })
  html!: string;

  @Column({ type: "text", nullable: true })
  text!: string | null;

  @Column({ type: "varchar", length: 20 })
  direction!: EEmailDirection;

  @Column({ type: "varchar", length: 20, default: EEmailStatus.PENDING })
  status!: EEmailStatus;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 500, nullable: true })
  messageId!: string | null;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 64, nullable: true })
  imapUid!: string | null;

  @Column({ type: "boolean", default: false })
  isRead!: boolean;

  @Column({ type: "text", nullable: true })
  error!: string | null;
}
