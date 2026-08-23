import {
  Column,
  Entity,
  Index,
} from "typeorm";
import { GeneralBaseEntity } from "../../entities";

/** Outbound email audit row — owned by EmailModule / EmailService. */
@Entity("base_sent_emails")
export class SentEmailEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid", nullable: true })
  recipientUserId!: string | null;

  @Column({ type: "varchar", length: 255 })
  toEmail!: string;

  @Column({ type: "varchar", length: 255 })
  subject!: string;

  @Column({ type: "text" })
  html!: string;

  @Column({ type: "text", nullable: true })
  text!: string | null;

  @Column({ type: "varchar", length: 64, default: "pending" })
  status!: "pending" | "sent" | "failed";

  @Column({ type: "text", nullable: true })
  errorMessage!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  source!: string | null;
}
