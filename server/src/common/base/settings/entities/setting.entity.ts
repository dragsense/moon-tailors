import {
  Column,
  Entity,
  Index,
  Unique,
} from "typeorm";
import { ESettingType } from "@template/contracts";
import { GeneralBaseEntity } from "../../../entities";

@Entity("base_settings")
@Unique(["entityId", "key"])
export class SettingEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "varchar", length: 255 })
  entityId!: string;

  @Column({ type: "varchar", length: 100 })
  key!: string;

  @Column({ type: "text" })
  value!: string;

  @Column({ type: "varchar", length: 32, default: ESettingType.STRING })
  type!: ESettingType;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "boolean", default: false })
  isPublic!: boolean;

  @Column({ type: "boolean", default: true })
  isEditable!: boolean;
}
