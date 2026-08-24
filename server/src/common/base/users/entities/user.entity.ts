import {
  AfterLoad,
  Column,
  Entity,
  Index,
  OneToMany,
} from "typeorm";
import { EGender, EUserLevel } from "@moon-tailors/contracts";
import { GeneralBaseEntity } from "../../../entities";
import { UserPermissionEntity } from "../../permissions/entities/user-permission.entity";

@Entity("base_users")
export class UserEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 100 })
  firstName!: string;

  @Column({ type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "int", nullable: true })
  age!: number | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  gender!: EGender | null;

  /** Hydrated from first/last — available when user is loaded via relations. */
  name!: string;

  @Column({ type: "varchar", length: 255, select: false })
  passwordHash!: string;

  @Column({ type: "int", default: EUserLevel.CUSTOMER })
  level!: EUserLevel;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  emailVerifiedAt!: Date | null;

  @OneToMany(() => UserPermissionEntity, (up) => up.user)
  userPermissions?: UserPermissionEntity[];

  @AfterLoad()
  hydrateDisplayName(): void {
    this.name = `${this.firstName ?? ""} ${this.lastName ?? ""}`.trim();
  }
}
