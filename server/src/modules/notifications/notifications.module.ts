import { Module } from "@nestjs/common";
import {
  BaseNotificationsModule,
  PermissionsModule,
} from "../../common/base";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Module({
  imports: [BaseNotificationsModule, PermissionsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
