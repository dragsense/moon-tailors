import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";
import { VendorPurchaseEntity } from "./vendor-purchase.entity";

/** One line on a purchase. Line total = quantity × unitPrice (not stored). */
@Entity("vendor_purchase_items")
export class VendorPurchaseItemEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  purchaseId!: string;

  @ManyToOne(() => VendorPurchaseEntity, (purchase) => purchase.items, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "purchaseId" })
  purchase?: VendorPurchaseEntity;

  @Column({ type: "varchar", length: 160 })
  description!: string;

  @Column({ type: "decimal", precision: 12, scale: 3, default: 1 })
  quantity!: string;

  @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
  unitPrice!: string;
}
