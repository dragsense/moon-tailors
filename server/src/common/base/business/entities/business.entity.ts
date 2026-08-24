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
@Index("UQ_businesses_tenantId", ["tenantId"], { unique: true })
export class BusinessEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "uuid", nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "ownerUserId" })
  owner?: UserEntity | null;


  /** Seeded root business — exactly one row should be true (enforced in service). */
  @Column({ type: "boolean", default: false })
  isPlatform!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;
}
