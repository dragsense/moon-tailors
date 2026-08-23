import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
  sendSmsSchema,
  smsMessageListQuerySchema,
  type IMessageResponse,
  type IPaginatedResponse,
  type ISmsStatus,
  type ISmsThread,
  type TSendSmsData,
  type TSmsMessageListQuery,
} from "@template/contracts";
import {
  CurrentUser,
  Public,
  RequirePermissions,
  RequireUserLevels,
} from "../../common/auth";
import type { UserEntity } from "../../common/base";
import { SkipCsrf, SkipEncryption } from "../../common/security";
import { TwilioSmsService } from "../../common/communications";
import type { TwilioConfig } from "../../config/twilio.config";
import { ZodValidationPipe } from "../../common/validation";
import { SmsMessageEntity } from "./entities/sms-message.entity";
import { SmsInboxService } from "./sms.service";

const EMPTY_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

@ApiTags("SMS Inbox")
@Controller("sms")
export class SmsController {
  constructor(
    private readonly inbox: SmsInboxService,
    private readonly twilio: TwilioSmsService,
    private readonly config: ConfigService,
  ) {}

  @Get("status")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.SMS,
    action: EPermissionAction.READ,
  })
  status(): ISmsStatus {
    return this.inbox.getStatus();
  }

  @Get("threads")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.SMS,
    action: EPermissionAction.READ,
  })
  threads(): Promise<ISmsThread[]> {
    return this.inbox.listThreads();
  }

  @Get("messages")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.SMS,
    action: EPermissionAction.READ,
  })
  messages(
    @Query(new ZodValidationPipe(smsMessageListQuerySchema))
    query: TSmsMessageListQuery,
  ): Promise<IPaginatedResponse<SmsMessageEntity>> {
    return this.inbox.listMessages(query);
  }

  @Post("send")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  @RequirePermissions({
    resource: EResource.SMS,
    action: EPermissionAction.CREATE,
  })
  send(
    @Body(new ZodValidationPipe(sendSmsSchema)) body: TSendSmsData,
    @CurrentUser() user: UserEntity,
  ): Promise<IMessageResponse> {
    return this.inbox.send(body, user.id);
  }

  @Public()
  @SkipCsrf()
  @SkipEncryption()
  @Post("webhook/twilio")
  @Header("Content-Type", "text/xml; charset=utf-8")
  @HttpCode(200)
  async twilioWebhook(
    @Req() req: Request,
    @Headers("x-twilio-signature") signature: string | undefined,
    @Body() body: Record<string, string>,
  ): Promise<string> {
    return this.handleWebhook(req, signature, body, "webhookUrl");
  }

  @Public()
  @SkipCsrf()
  @SkipEncryption()
  @Post("webhook/twilio/fallback")
  @Header("Content-Type", "text/xml; charset=utf-8")
  @HttpCode(200)
  async twilioWebhookFallback(
    @Req() req: Request,
    @Headers("x-twilio-signature") signature: string | undefined,
    @Body() body: Record<string, string>,
  ): Promise<string> {
    return this.handleWebhook(req, signature, body, "webhookFallbackUrl");
  }

  private async handleWebhook(
    req: Request,
    signature: string | undefined,
    body: Record<string, string>,
    urlKey: "webhookUrl" | "webhookFallbackUrl",
  ): Promise<string> {
    const params = body || {};
    const cfg = this.config.getOrThrow<TwilioConfig>("twilio");
    // Signature must match the public URL Twilio called (no query string).
    const pathOnly = (req.originalUrl || req.url || "").split("?")[0];
    const webhookUrl =
      cfg[urlKey] || `${req.protocol}://${req.get("host")}${pathOnly}`;

    if (!this.twilio.validateSignature(signature, webhookUrl, params)) {
      return EMPTY_TWIML;
    }

    await this.inbox.handleTwilioInbound(params);
    return EMPTY_TWIML;
  }
}
