import { Injectable, Logger } from "@nestjs/common";
import { EmailService, EmailTemplateService } from "../../email";
import { BaseUsersService } from "../users/base-users.service";
import { NotificationEntity } from "./entities/notification.entity";

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(
    private readonly email: EmailService,
    private readonly templates: EmailTemplateService,
    private readonly usersService: BaseUsersService,
  ) {}

  async sendForNotification(
    notification: NotificationEntity,
  ): Promise<boolean> {
    const user = await this.usersService.findById(notification.recipientId);
    if (!user?.email) return false;

    const displayName = `${user.firstName} ${user.lastName}`.trim();
    const html = this.templates.generateHTML({
      title: notification.title,
      greeting: displayName || undefined,
      content: `<p>${escapeHtml(notification.message)}</p>`,
    });
    const text = this.templates.generateText({
      title: notification.title,
      greeting: displayName || undefined,
      content: notification.message,
    });

    const sent = await this.email.send({
      recipientUserId: user.id,
      to: user.email,
      subject: notification.title,
      html,
      text,
      source: notification.entityType ?? "notification",
    });

    if (!sent && !this.email.isEnabled()) {
      this.logger.debug(
        `Notification email recorded only for ${user.email} (mailer disabled)`,
      );
    }
    return sent;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
