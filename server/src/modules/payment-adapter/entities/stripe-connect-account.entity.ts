import { Column, Entity, Index } from "typeorm";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("stripe_connect_accounts")
export class StripeConnectAccountEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 255 })
  accountId!: string;

  @Column({ type: "boolean", default: false })
  chargesEnabled!: boolean;

  @Column({ type: "boolean", default: false })
  detailsSubmitted!: boolean;
}
