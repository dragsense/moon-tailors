import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { VendorEntity } from "./vendor.entity";

/** Money paid to a vendor, against their overall balance. */
@Entity("vendor_payments")
export class VendorPaymentEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  vendorId!: string;

  @ManyToOne(() => VendorEntity, (vendor) => vendor.payments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vendorId" })
  vendor?: VendorEntity;

  @Index()
  @Column({ type: "date" })
  paymentDate!: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  amount!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
