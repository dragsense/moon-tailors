import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";
import type { MailerConfig } from "../../config/mailer.config";
import {
  EntityService,
  type IBoundEntityService,
} from "../database";
import type { EntityQueryConfig } from "../query";
import { SentEmailEntity } from "./entities";
import type { SendEmailOptions } from "./types";

export const SENT_EMAIL_QUERY: EntityQueryConfig = {
  alias: "sentEmail",
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly entity: IBoundEntityService<SentEmailEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    this.entity = this.entityService.bind(SentEmailEntity, SENT_EMAIL_QUERY);
  }

  isEnabled(): boolean {
    return this.config.getOrThrow<MailerConfig>("mailer").enabled;
  }

  /** Default From header (display name applied by MailerModule defaults). */
  getDefaultFrom(): string {
    return this.config.getOrThrow<MailerConfig>("mailer").from;
  }

  getAdminEmail(): string | undefined {
    return this.config.getOrThrow<MailerConfig>("mailer").adminEmail;
  }

  /**
   * Persist a sent-email row, then send via Nest Mailer (skipped when MAIL_ENABLED≠true).
   */
  async sendAndRecord(options: SendEmailOptions): Promise<SentEmailEntity> {
    let row = await this.entity.create({
      recipientUserId: options.recipientUserId ?? null,
      toEmail: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? null,
      status: "pending",
      errorMessage: null,
      source: options.source ?? null,
    });

    if (!this.isEnabled()) {
      this.logger.debug(
        `Email not sent (MAIL_ENABLED≠true) — recorded ${row.id} for ${options.to}`,
      );
      return this.entity.update(row.id, { status: "sent" });
    }

    try {
      await this.mailer.sendMail({
        to: options.to,
        from: options.from,
        cc: options.cc,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return this.entity.update(row.id, { status: "sent" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      row = await this.entity.update(row.id, {
        status: "failed",
        errorMessage: message,
      });
      this.logger.error(`Email failed for ${options.to}: ${message}`);
      throw error;
    }
  }

  /** Send without throwing — returns whether the transport accepted the message. */
  async send(options: SendEmailOptions): Promise<boolean> {
    try {
      const row = await this.sendAndRecord(options);
      return row.status === "sent" && this.isEnabled();
    } catch {
      return false;
    }
  }
}
