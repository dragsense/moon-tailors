import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../config";
import { EmailService, EmailTemplateService } from "../../../common/email";
import type { UserEntity } from "../../../common/base";

export type WelcomeEmailContext = {
  user: UserEntity;
  tempPassword?: string;
  loginUrl?: string;
};

@Injectable()
export class UserEmailService {
  private readonly logger = new Logger(UserEmailService.name);

  constructor(
    private readonly mailer: EmailService,
    private readonly templates: EmailTemplateService,
    private readonly config: ConfigService,
  ) {}

  async sendWelcomeEmail(context: WelcomeEmailContext): Promise<void> {
    const { user, tempPassword } = context;
    const app = this.config.getOrThrow<AppConfig>("app");
    const loginUrl =
      context.loginUrl?.trim() ||
      `${app.appUrl.replace(/\/$/, "")}/login`;
    const userName = user.firstName || "there";

    const accountInfo = `
      <div class="footer-note">
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(user.email)}</p>
        <p style="margin: 0;"><strong>Name:</strong> ${escapeHtml(`${user.firstName} ${user.lastName}`.trim())}</p>
      </div>
    `;

    const credentialsSection = tempPassword
      ? `
      <div class="footer-note" style="border-left-color: #1a1a1a;">
        <p style="margin: 0 0 12px 0;"><strong>Temporary Password:</strong></p>
        <code style="font-size: 16px; padding: 8px 16px; display: inline-block; margin-bottom: 12px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px;">${escapeHtml(tempPassword)}</code>
        <p style="margin: 0; font-size: 13px; color: #666666;">For security, please change your password after your first login.</p>
      </div>
    `
      : "";

    const html = this.templates.generateHTML({
      title: `Welcome to ${app.name}`,
      greeting: `Dear ${userName}`,
      content: `
        <p>Welcome to ${escapeHtml(app.name)}! Your account has been created and is ready to use.</p>
        ${accountInfo}
        ${credentialsSection}
      `,
      actionButton: {
        text: "Access Your Account",
        url: loginUrl,
      },
      appName: app.name,
      appUrl: app.appUrl,
    });

    const text = this.templates.generateText({
      title: `Welcome to ${app.name}`,
      greeting: `Dear ${userName}`,
      content: `
Welcome to ${app.name}! Your account has been created and is ready to use.

Account Details:
- Email: ${user.email}
- Name: ${user.firstName} ${user.lastName}
${
  tempPassword
    ? `\nLogin Credentials:\n- Temporary Password: ${tempPassword}\n- Login URL: ${loginUrl}\n\nPlease change your password after your first login.\n`
    : `\nAccess your account at: ${loginUrl}\n`
}
      `,
      appName: app.name,
      appUrl: app.appUrl,
    });

    await this.mailer.sendAndRecord({
      to: user.email,
      subject: `Welcome to ${app.name} - Account Created`,
      html,
      text,
      recipientUserId: user.id,
      source: "users.onboarding",
    });

    this.logger.log(`Welcome email sent to ${user.email}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
