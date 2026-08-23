import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { UserEntity } from "../../../common/base";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("auth_refresh_tokens")
export class RefreshTokenEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  /** SHA-256 hash of the refresh token string. */
  @Column({ type: "varchar", length: 128 })
  tokenHash!: string;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ type: "uuid", nullable: true })
  replacedById!: string | null;

  isValid(): boolean {
    return !this.revokedAt && this.expiresAt.getTime() > Date.now();
  }
}
