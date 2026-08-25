import { Column, Entity, Index } from "typeorm";
import { EGarmentAudience } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("garment_types")
export class GarmentTypeEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 80 })
  slug!: string;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 16 })
  audience!: EGarmentAudience;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: false })
  isSystem!: boolean;
}
