import { Column, Entity, Index, OneToMany } from "typeorm";
import { EGender } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../common/entities";
import { MeasurementEntity } from "../../measurements/entities/measurement.entity";
import { OrderEntity } from "../../orders/entities/order.entity";

@Entity("customers")
export class CustomerEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "varchar", length: 16, nullable: true })
  gender!: EGender | null;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Index()
  @Column({ name: "whatsapp", type: "varchar", length: 40, nullable: true })
  alternative!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @OneToMany(() => MeasurementEntity, (measurement) => measurement.customer)
  measurements?: MeasurementEntity[];

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders?: OrderEntity[];
}
