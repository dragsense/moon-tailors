import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { EOtpPurpose } from "@template/contracts";
import { UserEntity } from "../../../common/base";
import { GeneralBaseEntity } from "../../../common/entities";

@Entity("auth_otp_challenges")
export class OtpChallengeEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  /** SHA-256 hash of the OTP code. */
  @Column({ type: "varchar", length: 128 })
  codeHash!: string;

  @Column({ type: "varchar", length: 32 })
  purpose!: EOtpPurpose;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "timestamptz", nullable: true })
  consumedAt!: Date | null;
}
