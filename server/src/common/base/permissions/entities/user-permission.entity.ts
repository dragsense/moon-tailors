import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { GeneralBaseEntity } from "../../../entities";
import { UserEntity } from "../../users/entities/user.entity";
import { PermissionEntity } from "./permission.entity";

@Entity("user_permissions")
@Unique(["userId", "permissionId"])
export class UserPermissionEntity extends GeneralBaseEntity {
  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Index()
  @Column({ type: "uuid" })
  permissionId!: string;

  @ManyToOne(() => UserEntity, (user) => user.userPermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: UserEntity;

  @ManyToOne(() => PermissionEntity, (permission) => permission.userPermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "permissionId" })
  permission!: PermissionEntity;
}
