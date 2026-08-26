import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { CustomerEntity } from "../../customers/entities/customer.entity";
import { OrderEntity } from "../../orders/entities/order.entity";

@Entity("measurements")
export class MeasurementEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  customerId!: string;

  @ManyToOne(() => CustomerEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "customerId" })
  customer?: CustomerEntity;

  /** Set when this row is an order snapshot; null for the customer default. */
  @Index()
  @Column({ type: "uuid", nullable: true })
  orderId!: string | null;

  @ManyToOne(() => OrderEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "orderId" })
  order?: OrderEntity | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  length!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  shoulder!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  sleeve!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  chest!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  waist!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  hip!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  bottom!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  chak!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  trouserLength!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  paincha!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  belt!: string | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  elastic!: string | null;

  @Column({ type: "text", nullable: true })
  extraNotes!: string | null;
}
