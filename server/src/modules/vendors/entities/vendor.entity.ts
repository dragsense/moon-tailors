import { Column, Entity, Index, OneToMany } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { VendorPaymentEntity } from "./vendor-payment.entity";
import { VendorPurchaseEntity } from "./vendor-purchase.entity";

/** Plain vendor info. Totals are calculated from purchases and payments. */
@Entity("vendors")
export class VendorEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40 })
  phone!: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  company!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @OneToMany(() => VendorPurchaseEntity, (purchase) => purchase.vendor)
  purchases?: VendorPurchaseEntity[];

  @OneToMany(() => VendorPaymentEntity, (payment) => payment.vendor)
  payments?: VendorPaymentEntity[];
}
