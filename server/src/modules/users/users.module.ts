import { Module } from "@nestjs/common";
import {
  BaseSettingsModule,
  BaseUsersModule,
  PermissionsModule,
} from "../../common/base";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PlatformOwnerSeed } from "./seeder/platform-owner.seed";
import { UserEmailService } from "./services/user-email.service";
import { UserEventListener } from "./services/user-event-listener.service";

@Module({
  imports: [PermissionsModule, BaseUsersModule, BaseSettingsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserEmailService,
    UserEventListener,
    PlatformOwnerSeed,
  ],
  exports: [UsersService],
})
export class UsersModule {}
