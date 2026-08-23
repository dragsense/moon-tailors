import { Column, Entity } from "typeorm";
import { ECameraProtocol } from "@template/contracts";
import { encryptedTextTransformer } from "../../../common/encryption/db-encryption";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("cameras")
export class CameraEntity extends GeneralBaseEntity {
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "varchar",
    length: 32,
    default: ECameraProtocol.RTSP,
  })
  protocol!: ECameraProtocol;

  @Column({ type: "varchar", length: 255, nullable: true })
  username!: string | null;

  /**
   * Never selected by default — only loaded for MediaMTX path setup.
   * At-rest encryption when `DB_ENCRYPTION_ENABLED=true` (AES-GCM via ENCRYPTION_KEY).
   */
  @Column({
    type: "text",
    nullable: true,
    select: false,
    transformer: encryptedTextTransformer,
  })
  password!: string | null;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: "integer", nullable: true, default: 554 })
  port!: number | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  path!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;
}
