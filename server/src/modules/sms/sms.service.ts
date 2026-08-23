import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  EResource,
  ESmsDirection,
  ESmsStatus,
  filtersFromListSchema,
  smsMessageListQuerySchema,
  toIsoDate,
  type IMessageResponse,
  type IPaginatedResponse,
  type ISmsStatus,
  type ISmsThread,
  type TSendSmsData,
  type TSmsMessageListQuery,
} from "@template/contracts";
import { PermissionsService } from "../../common/base";
import { TwilioSmsService } from "../../common/communications";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import { SmsMessageEntity } from "./entities/sms-message.entity";

function normalizePhone(raw: string): string {
  return raw.replace(/[\s()-]/g, "").trim();
}

export const SMS_MESSAGE_QUERY: EntityQueryConfig = {
  alias: "sms",
  searchable: ["body", "contactPhone", "fromPhone", "toPhone"],
  sortable: ["createdAt", "updatedAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
  filters: filtersFromListSchema(smsMessageListQuerySchema),
};

@Injectable()
export class SmsInboxService implements OnModuleInit {
  private readonly logger = new Logger(SmsInboxService.name);
  private readonly entity: IBoundEntityService<SmsMessageEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly twilio: TwilioSmsService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(SmsMessageEntity, SMS_MESSAGE_QUERY);
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.SMS);
  }

  getStatus(): ISmsStatus {
    return {
      configured: this.twilio.isConfigured(),
      fromNumber: this.twilio.getFromNumber() ?? null,
    };
  }

  async listThreads(): Promise<ISmsThread[]> {
    const repo = this.entity.getRepository();
    const rows = await repo
      .createQueryBuilder("m")
      .select("m.contactPhone", "contactPhone")
      .addSelect("COUNT(*)", "messageCount")
      .addSelect("MAX(m.createdAt)", "lastAt")
      .groupBy("m.contactPhone")
      .orderBy("MAX(m.createdAt)", "DESC")
      .getRawMany<{
        contactPhone: string;
        messageCount: string;
        lastAt: Date;
      }>();

    const threads: ISmsThread[] = [];
    for (const row of rows) {
      const last = await repo.findOne({
        where: { contactPhone: row.contactPhone },
        order: { createdAt: "DESC" },
      });
      if (!last) continue;
      threads.push({
        contactPhone: row.contactPhone,
        lastBody: last.body,
        lastDirection: last.direction,
        lastAt: toIsoDate(last.createdAt),
        messageCount: Number(row.messageCount) || 0,
      });
    }
    return threads;
  }

  listMessages(
    query: TSmsMessageListQuery,
  ): Promise<IPaginatedResponse<SmsMessageEntity>> {
    const contactPhone = query.contactPhone
      ? normalizePhone(query.contactPhone)
      : undefined;
    return this.entity.list({
      ...query,
      contactPhone,
    });
  }

  async send(
    input: TSendSmsData,
    senderId?: string,
  ): Promise<IMessageResponse> {
    if (!this.twilio.isConfigured()) {
      throw new ServiceUnavailableException(
        "Twilio is not configured (TWILIO_ACCOUNT_SID / AUTH_TOKEN / PHONE_NUMBER)",
      );
    }

    const to = normalizePhone(input.to);
    const from = this.twilio.getFromNumber()!;
    const body = input.body.trim();

    const pending = await this.entity.create({
      senderId: senderId ?? null,
      fromPhone: from,
      toPhone: to,
      contactPhone: to,
      body,
      direction: ESmsDirection.OUTBOUND,
      status: ESmsStatus.PENDING,
      twilioMessageSid: null,
      error: null,
    });

    const result = await this.twilio.sendSms(to, body);
    if (!result.success) {
      await this.entity.update(pending.id, {
        status: ESmsStatus.FAILED,
        error: result.error ?? "Send failed",
      });
      throw new BadRequestException(result.error ?? "Send failed");
    }

    await this.entity.update(pending.id, {
      status: ESmsStatus.SENT,
      twilioMessageSid: result.sid ?? null,
    });
    return { message: "SMS sent" };
  }

  async handleTwilioInbound(params: Record<string, string>): Promise<void> {
    const sid = params.MessageSid || params.SmsSid;
    const from = normalizePhone(params.From || "");
    const to = normalizePhone(params.To || "");
    const body = (params.Body || "").trim();

    if (!from || !body) {
      this.logger.warn("Twilio inbound missing From/Body — ignored");
      return;
    }

    if (sid) {
      const existing = await this.entity.get({ twilioMessageSid: sid });
      if (existing) return;
    }

    await this.entity.create({
      senderId: null,
      fromPhone: from,
      toPhone: to || this.twilio.getFromNumber() || "",
      contactPhone: from,
      body,
      direction: ESmsDirection.INBOUND,
      status: ESmsStatus.RECEIVED,
      twilioMessageSid: sid || null,
      error: null,
    });
  }
}
