import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";
import {
  EEmailDirection,
  EEmailStatus,
  EResource,
  toIsoDate,
  type IEmailStatus,
  type IEmailSyncResult,
  type IEmailThread,
  type IMessageResponse,
  type IPaginatedResponse,
  type TEmailMessageListQuery,
  type TSendEmailData,
} from "@template/contracts";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { MailerConfig } from "../../config/mailer.config";
import { EMAIL_MESSAGE_QUERY } from "./email-message.query";
import { EmailImapSyncService } from "./email-imap-sync.service";
import { EmailMessageEntity } from "./entities/email-message.entity";

export { EMAIL_MESSAGE_QUERY } from "./email-message.query";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function previewFrom(html: string, text: string | null): string {
  const raw =
    text?.trim() ||
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return raw.slice(0, 160);
}

@Injectable()
export class EmailInboxService implements OnModuleInit {
  private readonly logger = new Logger(EmailInboxService.name);
  private readonly entity: IBoundEntityService<EmailMessageEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
    private readonly imapSync: EmailImapSyncService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(
      EmailMessageEntity,
      EMAIL_MESSAGE_QUERY,
    );
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.EMAIL);
  }

  getStatus(): IEmailStatus {
    const mailer = this.config.getOrThrow<MailerConfig>("mailer");
    return {
      sendConfigured: mailer.enabled,
      receiveConfigured: this.imapSync.isConfigured(),
      fromEmail: mailer.from ?? null,
    };
  }

  async listThreads(): Promise<IEmailThread[]> {
    const repo = this.entity.getRepository();
    const rows = await repo
      .createQueryBuilder("m")
      .select("m.contactEmail", "contactEmail")
      .addSelect("COUNT(*)", "messageCount")
      .addSelect(
        "SUM(CASE WHEN m.isRead = false AND m.direction = :inbound THEN 1 ELSE 0 END)",
        "unreadCount",
      )
      .addSelect("MAX(m.createdAt)", "lastAt")
      .setParameter("inbound", EEmailDirection.INBOUND)
      .groupBy("m.contactEmail")
      .orderBy("MAX(m.createdAt)", "DESC")
      .getRawMany<{
        contactEmail: string;
        messageCount: string;
        unreadCount: string;
        lastAt: Date;
      }>();

    const threads: IEmailThread[] = [];
    for (const row of rows) {
      const last = await repo.findOne({
        where: { contactEmail: row.contactEmail },
        order: { createdAt: "DESC" },
      });
      if (!last) continue;
      threads.push({
        contactEmail: row.contactEmail,
        lastSubject: last.subject,
        lastPreview: previewFrom(last.html, last.text),
        lastDirection: last.direction,
        lastAt: toIsoDate(last.createdAt),
        messageCount: Number(row.messageCount) || 0,
        unreadCount: Number(row.unreadCount) || 0,
      });
    }
    return threads;
  }

  listMessages(
    query: TEmailMessageListQuery,
  ): Promise<IPaginatedResponse<EmailMessageEntity>> {
    return this.entity.list(query);
  }

  async send(
    input: TSendEmailData,
    senderId?: string,
  ): Promise<IMessageResponse> {
    const mailer = this.config.getOrThrow<MailerConfig>("mailer");
    if (!mailer.enabled) {
      throw new ServiceUnavailableException(
        "Mail sending is disabled (set MAIL_ENABLED=true)",
      );
    }

    const to = input.to.trim().toLowerCase();
    const subject = input.subject.trim();
    const asHtml = Boolean(input.html);
    const html = asHtml
      ? input.body
      : `<p>${escapeHtml(input.body).replace(/\r?\n/g, "<br>")}</p>`;
    const text = asHtml
      ? input.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : input.body.trim();

    const pending = await this.entity.create({
      senderId: senderId ?? null,
      fromEmail: mailer.from,
      fromName: null,
      toEmail: to,
      contactEmail: to,
      subject,
      html,
      text,
      direction: EEmailDirection.OUTBOUND,
      status: EEmailStatus.PENDING,
      messageId: null,
      imapUid: null,
      isRead: true,
      error: null,
    });

    try {
      const info = await this.mailer.sendMail({
        to,
        subject,
        html,
        text,
      });
      const mid =
        typeof info?.messageId === "string" ? info.messageId : null;
      await this.entity.update(pending.id, {
        status: EEmailStatus.SENT,
        messageId: mid?.replace(/^<|>$/g, "") || null,
      });
      return { message: "Email sent" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      await this.entity.update(pending.id, {
        status: EEmailStatus.FAILED,
        error: message,
      });
      this.logger.error(`Outbound email failed: ${message}`);
      throw new BadRequestException(message);
    }
  }

  async markRead(id: string, isRead: boolean): Promise<IMessageResponse> {
    await this.entity.update(id, { isRead });
    return { message: isRead ? "Marked as read" : "Marked as unread" };
  }

  async syncInbox(): Promise<IEmailSyncResult> {
    if (!this.imapSync.isConfigured()) {
      throw new ServiceUnavailableException(
        "IMAP is not configured (set MAIL_IMAP_ENABLED + MAIL_IMAP_HOST / USER / PASS)",
      );
    }
    const imported = await this.imapSync.sync();
    return { imported };
  }
}
