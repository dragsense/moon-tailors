import { registerAs } from "@nestjs/config";

export type ImapConfig = {
 enabled: boolean;
 syncEnabled: boolean;
 host?: string;
 port: number;
 secure: boolean;
 user?: string;
 pass?: string;
 inboxFolder: string;
};

/**
 * Platform IMAP inbox from env (platform mailbox).
 * Falls back to MAIL_USER / MAIL_PASS when IMAP-specific creds are omitted.
 */
export default registerAs(
 "imap",
  (): ImapConfig => ({
 enabled: process.env.MAIL_IMAP_ENABLED === "true",
 syncEnabled: process.env.MAIL_IMAP_SYNC_ENABLED !== "false",
 host: process.env.MAIL_IMAP_HOST || undefined,
 port: Number(process.env.MAIL_IMAP_PORT || 993),
 secure: process.env.MAIL_IMAP_SECURE !== "false",
 user: process.env.MAIL_IMAP_USER || process.env.MAIL_USER || undefined,
 pass: process.env.MAIL_IMAP_PASS || process.env.MAIL_PASS || undefined,
 inboxFolder: process.env.MAIL_IMAP_INBOX_FOLDER || "INBOX",
 }),
);
