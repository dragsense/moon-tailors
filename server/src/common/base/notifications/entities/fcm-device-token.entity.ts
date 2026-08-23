import {
  Column,
  Entity,
  Index,
  Unique,
} from "typeorm";
import { EFcmPlatform } from "@template/contracts";
import { GeneralBaseEntity } from "../../../entities";

@Entity("base_fcm_device_tokens")
@Unique(["userId", "token"])
export class FcmDeviceTokenEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  token!: string;

  @Column({ type: "varchar", length: 20 })
  platform!: EFcmPlatform;

  @Column({ type: "varchar", length: 255, nullable: true })
  deviceId!: string | null;
}
