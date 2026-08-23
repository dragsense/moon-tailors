import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  emailMessageListQuerySchema,
  markEmailReadSchema,
  sendEmailSchema,
  type IEmailStatus,
  type IEmailSyncResult,
  type IEmailThread,
  type IMessageResponse,
  type IPaginatedResponse,
  type TEmailMessageListQuery,
  type TMarkEmailReadData,
  type TSendEmailData,
} from "@template/contracts";
import {
  CurrentUser,
  RequirePermissions,
  RequireUserLevels,
} from "../../common/auth";
import type { UserEntity } from "../../common/base";
import { ZodValidationPipe } from "../../common/validation";
import { EmailMessageEntity } from "./entities/email-message.entity";
import { EmailInboxService } from "./email.service";

@ApiTags("Email Inbox")
@Controller("email")
export class EmailController {
  constructor(private readonly inbox: EmailInboxService) {}

  @Get("status")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.EMAIL,
    action: EPermissionAction.READ,
  })
  status(): IEmailStatus {
    return this.inbox.getStatus();
  }

  @Get("threads")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.EMAIL,
    action: EPermissionAction.READ,
  })
  threads(): Promise<IEmailThread[]> {
    return this.inbox.listThreads();
  }

  @Get("messages")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.EMAIL,
    action: EPermissionAction.READ,
  })
  messages(
    @Query(new ZodValidationPipe(emailMessageListQuerySchema))
    query: TEmailMessageListQuery,
  ): Promise<IPaginatedResponse<EmailMessageEntity>> {
    return this.inbox.listMessages(query);
  }

  @Post("send")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.EMAIL,
    action: EPermissionAction.CREATE,
  })
  send(
    @Body(new ZodValidationPipe(sendEmailSchema)) body: TSendEmailData,
    @CurrentUser() user: UserEntity,
  ): Promise<IMessageResponse> {
    return this.inbox.send(body, user.id);
  }

  @Post("sync")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.EMAIL,
    action: EPermissionAction.CREATE,
  })
  sync(): Promise<IEmailSyncResult> {
    return this.inbox.syncInbox();
  }

  @Patch("messages/:id/read")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.EMAIL,
    action: EPermissionAction.UPDATE,
  })
  markRead(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(markEmailReadSchema)) body: TMarkEmailReadData,
  ): Promise<IMessageResponse> {
    return this.inbox.markRead(id, body.isRead);
  }
}
