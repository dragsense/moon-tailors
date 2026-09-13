import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { EStaffPayType } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../common/entities";
import { StaffEntity } from "./staff.entity";

/** One join → leave period. Open (still working) while `leaveDate` is null. */
@Entity("staff_employments")
export class StaffEmploymentEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  staffId!: string;

  @ManyToOne(() => StaffEntity, (staff) => staff.employments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "staffId" })
  staff?: StaffEntity;

  @Column({ type: "date" })
  joinDate!: string;

  @Column({ type: "date", nullable: true })
  leaveDate!: string | null;

  @Column({ type: "varchar", length: 16, default: EStaffPayType.FIXED })
  payType!: EStaffPayType;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  salary!: string;

  @Column({ type: "text", nullable: true })
  leaveReason!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
