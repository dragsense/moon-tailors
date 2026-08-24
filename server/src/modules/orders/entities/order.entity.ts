import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { EOrderStatus } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../common/entities";
import { CustomerEntity } from "../../customers/entities/customer.entity";
import { MeasurementEntity } from "../../measurements/entities/measurement.entity";

@Entity("orders")
export class OrderEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 32 })
  orderNumber!: string;

  @Index()
  @Column({ type: "uuid" })
  customerId!: string;

  @ManyToOne(() => CustomerEntity, (customer) => customer.orders, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "customerId" })
  customer?: CustomerEntity;

  @Column({ type: "uuid" })
  measurementId!: string;

  @ManyToOne(() => MeasurementEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "measurementId" })
  measurement?: MeasurementEntity;

  @Column({ type: "date" })
  orderDate!: string;

  @Index()
  @Column({ type: "date" })
  expectedCompletionDate!: string;

  @Index()
  @Column({ type: "varchar", length: 32, default: EOrderStatus.NEW })
  status!: EOrderStatus;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  totalCost!: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  paidAmount!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
