import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EOtpPurpose } from "@template/contracts";
import {
  EmailService,
  EmailTemplateService,
} from "../../../common/email";
import type { UserEntity } from "../../../common/base";
import type { AppConfig, AuthConfig } from "../../../config";

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private readonly app: AppConfig;
  private readonly auth: AuthConfig;

  constructor(
    private readonly email: EmailService,
    private readonly templates: EmailTemplateService,
    config: ConfigService,
  ) {
    this.app = config.getOrThrow<AppConfig>("app");
    this.auth = config.getOrThrow<AuthConfig>("auth");
  }

  async sendOtp(user: UserEntity, purpose: EOtpPurpose, code: string) {
    const title = otpTitle(purpose);
    const html = this.templates.generateHTML({
      title,
      greeting: `Hi ${user.firstName}`,
      content: `<p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:16px 0;">${code}</p>
        <p>This code expires in ${Math.round(this.auth.otpTtlMs / 60_000)} minutes.</p>`,
      footerNote: "If you did not request this, you can ignore this email.",
    });
    const text = this.templates.generateText({
      title,
      greeting: `Hi ${user.firstName}`,
      content: `Your verification code is ${code}. It expires in ${Math.round(this.auth.otpTtlMs / 60_000)} minutes.`,
      footerNote: "If you did not request this, you can ignore this email.",
    });

    const ok = await this.email.send({
      to: user.email,
      subject: `${title} · ${this.app.name}`,
      html,
      text,
      recipientUserId: user.id,
      source: `auth.otp.${purpose}`,
    });
    if (!ok && this.email.isEnabled()) {
      this.logger.warn(`Failed to send OTP email to ${user.email}`);
    }
  }

  async sendPasswordResetLink(user: UserEntity, token: string) {
    const path = this.auth.passwordResetPath.replace(/^\//, "");
    const url = `${this.app.appUrl.replace(/\/$/, "")}/${path}?token=${encodeURIComponent(token)}`;
    const title = "Reset your password";
    const html = this.templates.generateHTML({
      title,
      greeting: `Hi ${user.firstName}`,
      content: `<p>Click the button below to choose a new password. This link expires in ${Math.round(this.auth.passwordResetLinkTtlSec / 60)} minutes.</p>`,
      actionButton: { text: "Reset password", url },
      footerNote: "If you did not request a reset, you can ignore this email.",
    });
    const text = this.templates.generateText({
      title,
      greeting: `Hi ${user.firstName}`,
      content: `Reset your password using this link (expires soon): ${url}`,
      footerNote: "If you did not request a reset, you can ignore this email.",
    });

    await this.email.send({
      to: user.email,
      subject: `${title} · ${this.app.name}`,
      html,
      text,
      recipientUserId: user.id,
      source: "auth.password_reset.link",
    });
  }
}

function otpTitle(purpose: EOtpPurpose): string {
  switch (purpose) {
    case EOtpPurpose.SIGNUP:
      return "Verify your email";
    case EOtpPurpose.PASSWORD_RESET:
      return "Password reset code";
    case EOtpPurpose.EMAIL_LOGIN:
      return "Your login code";
    default:
      return "Your login code";
  }
}
