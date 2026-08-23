import { ImapFlow } from "imapflow";
import { extractBodies } from "./mail-body.util";

export type ParsedInboundMessage = {
  imapUid: string;
  messageId: string | null;
  fromEmail: string | null;
  fromName: string | null;
  toAddresses: string[];
  subject: string;
  html: string;
  text: string;
  receivedAt: Date;
};

type ImapConnectionOptions = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  inboxFolder: string;
};

function createImapClient(options: ImapConnectionOptions) {
  return new ImapFlow({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: {
      user: options.username,
      pass: options.password,
    },
    logger: false,
  });
}

function normalizeEmail(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return value || null;
}

/** Simplified IMAP pull — all messages after `afterUid` (no known-sender filter). */
export async function fetchImapMessages(
  options: ImapConnectionOptions & { afterUid: number; limit?: number },
): Promise<{ messages: ParsedInboundMessage[]; highestUid: number }> {
  const client = createImapClient(options);
  const limit = options.limit ?? 50;
  const messages: ParsedInboundMessage[] = [];
  let highestUid = options.afterUid;

  await client.connect();
  const lock = await client.getMailboxLock(options.inboxFolder);

  try {
    const range = options.afterUid > 0 ? `${options.afterUid + 1}:*` : "1:*";

    for await (const raw of client.fetch(
      range,
      { uid: true, envelope: true, source: true },
      { uid: true },
    )) {
      const uid = Number(raw.uid);
      if (!uid || uid <= options.afterUid) continue;
      highestUid = Math.max(highestUid, uid);

      try {
        const fromList =
          (raw.envelope?.from as Array<{ address?: string; name?: string }>) ??
          [];
        const toList =
          (raw.envelope?.to as Array<{ address?: string; name?: string }>) ??
          [];
        const from = fromList[0];

        let html = "";
        let text = "";
        let messageId = raw.envelope?.messageId
          ? String(raw.envelope.messageId).replace(/^<|>$/g, "")
          : null;

        if (raw.source) {
          const extracted = extractBodies(raw.source as Buffer);
          html = extracted.html;
          text = extracted.text;
          messageId = extracted.messageId || messageId;
        }

        messages.push({
          imapUid: String(uid),
          messageId,
          fromEmail: normalizeEmail(from?.address),
          fromName: from?.name || null,
          toAddresses: toList
            .map((entry) => normalizeEmail(entry.address))
            .filter((e): e is string => Boolean(e)),
          subject: String(raw.envelope?.subject || "(no subject)"),
          html: html || `<p>${text.replace(/</g, "&lt;")}</p>`,
          text,
          receivedAt: raw.envelope?.date
            ? new Date(raw.envelope.date)
            : new Date(),
        });

        if (messages.length >= limit) break;
      } catch {
        // skip malformed message; highestUid still advances
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return { messages, highestUid };
}

export async function testImapConnection(
  options: ImapConnectionOptions,
): Promise<void> {
  const client = createImapClient(options);
  await client.connect();
  await client.logout();
}
