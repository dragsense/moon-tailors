import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { VendorPurchaseItemEntity } from "./vendor-purchase-item.entity";
import { VendorEntity } from "./vendor.entity";

/** One purchase from a vendor. Total = sum of its line items (not stored). */
@Entity("vendor_purchases")
export class VendorPurchaseEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  vendorId!: string;

  @ManyToOne(() => VendorEntity, (vendor) => vendor.purchases, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "vendorId" })
  vendor?: VendorEntity;

  @Index()
  @Column({ type: "date" })
  purchaseDate!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @OneToMany(() => VendorPurchaseItemEntity, (item) => item.purchase)
  items?: VendorPurchaseItemEntity[];
}
