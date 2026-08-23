import {
 Column,
 Entity,
 Index,
 JoinColumn,
 ManyToOne,
 Unique,
} from "typeorm";
import { UserEntity } from "../../../common/base";
import { GeneralBaseEntity } from "../../../common/entities";

/**
 * Browser/device trusted after OTP with “Remember this device”.
 * Matching deviceId on login skips the OTP challenge .
 */
@Entity("auth_trusted_devices")
@Unique(["userId", "deviceId"])
export class TrustedDeviceEntity extends GeneralBaseEntity {
 @Index()
 @Column({ type: "uuid" })
 userId!: string;

 @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
 @JoinColumn({ name: "userId" })
 user!: UserEntity;

 @Index()
 @Column({ type: "varchar", length: 200 })
 deviceId!: string;

 @Column({ type: "varchar", length: 255, nullable: true })
 deviceName!: string | null;

 @Column({ type: "varchar", length: 100, nullable: true })
 ipAddress!: string | null;

 @Column({ type: "text", nullable: true })
 userAgent!: string | null;
}
