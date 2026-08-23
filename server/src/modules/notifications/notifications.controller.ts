import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type {
  IMessageResponse,
  IPaginatedResponse,
  TCreatePushSubscriptionData,
  TNotificationListQuery,
  TRegisterFcmDeviceData,
  TUnregisterFcmDeviceResponse,
  TUnreadCountResponse,
} from "@template/contracts";
import {
  EPermissionAction,
  EResource,
  createPushSubscriptionSchema,
  notificationListQuerySchema,
  registerFcmDeviceSchema,
} from "@template/contracts";
import type { Request } from "express";
import type {
  FcmDeviceTokenEntity,
  NotificationEntity,
  PushSubscriptionEntity,
  UserEntity,
} from "../../common/base";
import { CurrentUser, RequirePermissions } from "../../common/auth";
import { ZodValidationPipe } from "../../common/validation";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.READ,
  })
  list(
    @CurrentUser() user: UserEntity,
    @Query(new ZodValidationPipe(notificationListQuerySchema))
    query: TNotificationListQuery,
  ): Promise<IPaginatedResponse<NotificationEntity>> {
    return this.notifications.list(user.id, query);
  }

  @Get("unread-count")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.READ,
  })
  unreadCount(@CurrentUser() user: UserEntity): Promise<TUnreadCountResponse> {
    return this.notifications.unreadCount(user.id);
  }

  @Get("push/vapid-public-key")
  vapidPublicKey(): { publicKey?: string } {
    return this.notifications.getVapidPublicKey();
  }

  @Get("push/subscriptions")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.READ,
  })
  listPushSubscriptions(
    @CurrentUser() user: UserEntity,
  ): Promise<PushSubscriptionEntity[]> {
    return this.notifications.listPushSubscriptions(user.id);
  }

  @Post("push/subscribe")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.UPDATE,
  })
  subscribePush(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createPushSubscriptionSchema))
    body: TCreatePushSubscriptionData,
    @Req() req: Request,
  ): Promise<PushSubscriptionEntity> {
    return this.notifications.subscribePush(
      user.id,
      body,
      req.headers["user-agent"],
    );
  }

  @Delete("push/unsubscribe")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.DELETE,
  })
  unsubscribePush(
    @CurrentUser() user: UserEntity,
    @Query("endpoint") endpoint: string,
  ) {
    return this.notifications.unsubscribePush(user.id, endpoint);
  }

  @Post("push/device")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.UPDATE,
  })
  registerFcmDevice(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(registerFcmDeviceSchema))
    body: TRegisterFcmDeviceData,
  ): Promise<IMessageResponse & { device: FcmDeviceTokenEntity }> {
    return this.notifications.registerFcmDevice(user.id, body);
  }

  @Delete("push/device")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.DELETE,
  })
  unregisterFcmDevice(
    @CurrentUser() user: UserEntity,
    @Query("token") token: string,
  ): Promise<TUnregisterFcmDeviceResponse> {
    return this.notifications.unregisterFcmDevice(user.id, token);
  }

  @Get("push/devices")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.READ,
  })
  listFcmDevices(
    @CurrentUser() user: UserEntity,
  ): Promise<{ devices: FcmDeviceTokenEntity[]; count: number }> {
    return this.notifications.listFcmDevices(user.id);
  }

  @Put("read-all")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.UPDATE,
  })
  markAllRead(@CurrentUser() user: UserEntity) {
    return this.notifications.markAllAsRead(user.id);
  }

  @Put(":id/read")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.UPDATE,
  })
  markRead(
    @CurrentUser() user: UserEntity,
    @Param("id") id: string,
  ): Promise<IMessageResponse> {
    return this.notifications.markAsRead(user.id, id);
  }

  @Delete(":id")
  @RequirePermissions({
    resource: EResource.NOTIFICATIONS,
    action: EPermissionAction.DELETE,
  })
  remove(
    @CurrentUser() user: UserEntity,
    @Param("id") id: string,
  ): Promise<IMessageResponse> {
    return this.notifications.remove(user.id, id);
  }
}
