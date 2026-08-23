import { registerAs } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import type { MailerOptions } from "@nestjs-modules/mailer";
import * as fs from "fs";
import * as path from "path";

export type MailerConfig = {
  enabled: boolean;
  from: string;
  adminEmail?: string;
  host: string;
  port: number;
  user?: string;
  pass?: string;
  dkimDomain?: string;
  dkimSelector: string;
  dkimPrivateKeyPath: string;
};

export default registerAs(
  "mailer",
  (): MailerConfig => ({
    enabled: process.env.MAIL_ENABLED === "true",
    from: process.env.MAIL_FROM ?? "noreply@example.com",
    adminEmail: process.env.MAIL_ADMIN_EMAIL,
    host: process.env.MAIL_HOST ?? "mailpit",
    port: Number(process.env.MAIL_PORT || 1025),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    dkimDomain: process.env.MAIL_DKIM_DOMAIN,
    dkimSelector: process.env.MAIL_DKIM_SELECTOR || "default",
    dkimPrivateKeyPath:
      process.env.MAIL_DKIM_PRIVATE_KEY_PATH || "/root/private.key",
  }),
);

export const getMailerConfig = async (
  configService: ConfigService,
): Promise<MailerOptions> => {
  const isDev = process.env.NODE_ENV === "development";
  const mailer = configService.getOrThrow<MailerConfig>("mailer");
  const appName =
    configService.get<string>("app.name") ??
    configService.get<string>("app.serviceName") ??
    "App";

  const transport: Record<string, unknown> = {
    host: mailer.host,
    port: mailer.port,
    secure: !isDev && mailer.port === 465,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 8_000,
    auth:
      !isDev && mailer.user
        ? { user: mailer.user, pass: mailer.pass }
        : undefined,
  };

  if (isDev) {
    transport.ignoreTLS = true;
  }

  if (!isDev && mailer.dkimDomain) {
    const keyPath = path.resolve(mailer.dkimPrivateKeyPath);
    if (fs.existsSync(keyPath)) {
      transport.dkim = {
        domainName: mailer.dkimDomain,
        keySelector: mailer.dkimSelector,
        privateKey: fs.readFileSync(keyPath, "utf8"),
      };
    }
  }

  return {
    transport,
    defaults: {
      from: `"${appName}" <${mailer.from}>`,
    },
  };
};
