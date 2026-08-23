import { Column, Entity, Index } from "typeorm";
import {
  EBillingStatus,
  EBillingType,
  type TBillingLineItem,
} from "@template/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("billings")
export class BillingEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "varchar", length: 32, default: EBillingType.PRODUCT })
  type!: EBillingType;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "date" })
  issueDate!: string;

  @Column({ type: "date" })
  dueDate!: string;

  @Column({ type: "jsonb", default: [] })
  lineItems!: TBillingLineItem[];

  @Column({ type: "numeric", precision: 5, scale: 2, default: 0 })
  taxRate!: number;

  @Index()
  @Column({ type: "uuid" })
  recipientUserId!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "varchar", length: 32, default: EBillingStatus.PENDING })
  status!: EBillingStatus;

  @Column({ type: "int", default: 0 })
  amountCents!: number;

  @Column({ type: "int", default: 0 })
  paidAmountCents!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  paymentIntentId!: string | null;
}
