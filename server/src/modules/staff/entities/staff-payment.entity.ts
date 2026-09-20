import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { StaffEntity } from "./staff.entity";

/**
 * Money handed to a staff member. Recorded as-is — never capped or reconciled
 * against salary; the monthly slip only reports what was collected.
 */
@Entity("staff_payments")
export class StaffPaymentEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  staffId!: string;

  @ManyToOne(() => StaffEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "staffId" })
  staff?: StaffEntity;

  @Index()
  @Column({ type: "date" })
  paymentDate!: string;

  /**
   * What the work was worth. Only on-demand staff record it — fixed staff take
   * their monthly total from `staff.salary` instead, so this stays null.
   */
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  totalAmount!: string | null;

  /** What was actually handed over. */
  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  amount!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
