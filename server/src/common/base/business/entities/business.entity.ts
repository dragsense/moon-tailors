import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { GeneralBaseEntity } from "../../../entities";
import { UserEntity } from "../../users/entities/user.entity";

@Entity("businesses")
export class BusinessEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 100, nullable: true })
  subdomain!: string | null;

  /** Isolation key for DB routing (header or subdomain resolution). */
  @Index({ unique: true })
  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid", nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "ownerUserId" })
  owner?: UserEntity | null;

  @Column({ type: "uuid", nullable: true })
  paymentProcessorId!: string | null;

  @Column({ type: "uuid", nullable: true })
  aiProcessorId!: string | null;

  /** Seeded root business — exactly one row should be true (enforced in service). */
  @Column({ type: "boolean", default: false })
  isPlatform!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;
}
