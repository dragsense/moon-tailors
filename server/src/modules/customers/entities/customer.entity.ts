import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { MeasurementEntity } from "../../measurements/entities/measurement.entity";
import { OrderEntity } from "../../orders/entities/order.entity";

@Entity("customers")
export class CustomerEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Index()
  @Column({ type: "varchar", length: 40, nullable: true })
  whatsapp!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ type: "uuid", nullable: true })
  defaultMeasurementId!: string | null;

  @ManyToOne(() => MeasurementEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "defaultMeasurementId" })
  defaultMeasurement?: MeasurementEntity | null;

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders?: OrderEntity[];
}
