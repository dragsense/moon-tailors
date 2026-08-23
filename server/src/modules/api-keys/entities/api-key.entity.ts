import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { UserEntity } from "../../../common/base";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("auth_api_keys")
export class ApiKeyEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  /** Public recognition prefix, e.g. `tk_a1b2c3d4` (never the secret). */
  @Index()
  @Column({ type: "varchar", length: 32 })
  keyPrefix!: string;

  /** SHA-256 of the full secret — never selected by default. */
  @Index({ unique: true })
  @Column({ type: "varchar", length: 128, select: false })
  keyHash!: string;

  /**
   * Optional permission allowlist. `null` → full user permissions.
   * Stored as JSON string array.
   */
  @Column({ type: "simple-json", nullable: true })
  scopes!: string[] | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  isValid(): boolean {
    if (this.revokedAt) return false;
    if (this.expiresAt && this.expiresAt.getTime() <= Date.now()) return false;
    return true;
  }
}
