import {
  Column,
  Entity,
  Index,
} from "typeorm";
import { EPaymentProcessorType } from "@template/contracts";
import { GeneralBaseEntity } from "../../entities";

@Entity("payment_processors")
export class PaymentProcessorEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 64 })
  type!: EPaymentProcessorType;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "boolean", default: false })
  enabled!: boolean;

  @Column({ type: "text", nullable: true })
  description!: string | null;
}
