import { Column, Entity, Index } from "typeorm";
import { EPaymentProcessorType } from "@template/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("payment_customers")
export class PaymentCustomerEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 32 })
  processorType!: EPaymentProcessorType;

  @Column({ type: "varchar", length: 255 })
  customerId!: string;
}
