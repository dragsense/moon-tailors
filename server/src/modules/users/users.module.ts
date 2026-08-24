import { Module } from "@nestjs/common";
import {
  BaseSettingsModule,
  BaseUsersModule,
  PermissionsModule,
} from "../../common/base";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PlatformOwnerSeed } from "./seeder/platform-owner.seed";
import { UserEventListener } from "./services/user-event-listener.service";

@Module({
  imports: [PermissionsModule, BaseUsersModule, BaseSettingsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserEventListener,
    PlatformOwnerSeed,
  ],
  exports: [UsersService],
})
export class UsersModule {}
