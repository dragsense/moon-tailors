import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EEmailDirection, EEmailStatus } from "@template/contracts";
import { fetchImapMessages } from "../../common/communications";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { ImapConfig } from "../../config/imap.config";
import { EMAIL_MESSAGE_QUERY } from "./email-message.query";
import { EmailMessageEntity } from "./entities/email-message.entity";

const SYNC_BATCH_LIMIT = 50;

@Injectable()
export class EmailImapSyncService {
  private readonly logger = new Logger(EmailImapSyncService.name);
  private readonly entity: IBoundEntityService<EmailMessageEntity>;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly entityService: EntityService,
  ) {
    this.entity = this.entityService.bind(
      EmailMessageEntity,
      EMAIL_MESSAGE_QUERY,
    );
  }

  isConfigured(): boolean {
    const imap = this.config.getOrThrow<ImapConfig>("imap");
    return Boolean(imap.enabled && imap.host && imap.user && imap.pass);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron(): Promise<void> {
    const imap = this.config.getOrThrow<ImapConfig>("imap");
    if (!imap.syncEnabled || !this.isConfigured()) return;
    await this.sync().catch((error) => {
      this.logger.warn(
        `IMAP cron sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }

  /** Pull new IMAP messages into the inbox table. */
  async sync(): Promise<number> {
    if (!this.isConfigured()) return 0;
    if (this.running) {
      this.logger.debug("IMAP sync already running — skipped");
      return 0;
    }

    this.running = true;
    try {
      const imap = this.config.getOrThrow<ImapConfig>("imap");
      const afterUid = await this.resolveAfterUid();

      const { messages } = await fetchImapMessages({
        host: imap.host!,
        port: imap.port,
        secure: imap.secure,
        username: imap.user!,
        password: imap.pass!,
        inboxFolder: imap.inboxFolder,
        afterUid,
        limit: SYNC_BATCH_LIMIT,
      });

      let imported = 0;
      for (const msg of messages) {
        if (!msg.fromEmail) continue;

        if (msg.messageId) {
          const existing = await this.entity.get({ messageId: msg.messageId });
          if (existing) continue;
        }

        const existingUid = await this.entity.get({ imapUid: msg.imapUid });
        if (existingUid) continue;

        const toEmail = msg.toAddresses[0] || imap.user || "inbox@localhost";

        await this.entity.create({
          senderId: null,
          fromEmail: msg.fromEmail,
          fromName: msg.fromName,
          toEmail,
          contactEmail: msg.fromEmail,
          subject: msg.subject,
          html: msg.html,
          text: msg.text || null,
          direction: EEmailDirection.INBOUND,
          status: EEmailStatus.RECEIVED,
          messageId: msg.messageId,
          imapUid: msg.imapUid,
          isRead: false,
          error: null,
        });
        imported += 1;
      }

      if (imported > 0) {
        this.logger.log(`IMAP sync imported ${imported} message(s)`);
      }
      return imported;
    } finally {
      this.running = false;
    }
  }

  private async resolveAfterUid(): Promise<number> {
    const row = await this.entity
      .getRepository()
      .createQueryBuilder("m")
      .select("MAX(CAST(m.imapUid AS BIGINT))", "max")
      .where("m.imapUid IS NOT NULL")
      .getRawOne<{ max: string | null }>();
    return Number(row?.max ?? 0) || 0;
  }
}
