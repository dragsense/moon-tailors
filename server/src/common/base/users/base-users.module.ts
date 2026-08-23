import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../permissions";
import { UserEntity } from "./entities";
import { BaseUsersService } from "./base-users.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), PermissionsModule],
  providers: [BaseUsersService],
  exports: [BaseUsersService, TypeOrmModule],
})
export class BaseUsersModule {}
