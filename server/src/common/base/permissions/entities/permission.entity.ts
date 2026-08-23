import {
  Column,
  Entity,
  Index,
  OneToMany,
} from "typeorm";
import { EPermissionAction, EResource } from "@template/contracts";
import { GeneralBaseEntity } from "../../../entities";
import { UserPermissionEntity } from "./user-permission.entity";

@Entity("permissions")
export class PermissionEntity extends GeneralBaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 64 })
  resource!: EResource | "*";

  @Column({ type: "varchar", length: 32 })
  action!: EPermissionAction | "*";

  @OneToMany(() => UserPermissionEntity, (up) => up.permission)
  userPermissions?: UserPermissionEntity[];
}
