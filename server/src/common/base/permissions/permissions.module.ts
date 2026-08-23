import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionEntity, UserPermissionEntity } from "./entities";
import { PermissionsService } from "./permissions.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionEntity, UserPermissionEntity]),
  ],
  providers: [PermissionsService],
  exports: [PermissionsService, TypeOrmModule],
})
export class PermissionsModule {}
