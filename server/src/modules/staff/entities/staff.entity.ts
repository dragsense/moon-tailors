import { Column, Entity, Index } from "typeorm";
import { EStaffPayType } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

/** A person who works in the shop, and how they are paid. */
@Entity("staff")
export class StaffEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  role!: string | null;

  @Index()
  @Column({ type: "varchar", length: 16, default: EStaffPayType.FIXED })
  payType!: EStaffPayType;

  /** Monthly salary for fixed staff; the usual rate for on-demand staff. */
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  salary!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
