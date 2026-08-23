interface ParsedHeaders {
  get(name: string): string | undefined;
}

interface MimeLeaf {
  contentType: string;
  disposition: string;
  html?: string;
  text?: string;
}

/** Split a raw MIME message/part into its header block and body. */
function splitHeadersAndBody(raw: string): { headerBlock: string; body: string } {
  const match = raw.match(/\r?\n\r?\n/);
  if (!match || match.index === undefined) {
    return { headerBlock: raw, body: '' };
  }
  return {
    headerBlock: raw.slice(0, match.index),
    body: raw.slice(match.index + match[0].length),
  };
}

/** Parse a header block, unfolding continuation lines (RFC 5322 §2.2.3). */
function parseHeaders(headerBlock: string): ParsedHeaders {
  const map = new Map<string, string>();
  const lines = headerBlock.split(/\r?\n/);
  let current: { name: string; value: string } | null = null;

  const commit = () => {
    if (current && !map.has(current.name)) {
      map.set(current.name, current.value.trim());
    }
  };

  for (const line of lines) {
    if (/^[ \t]/.test(line) && current) {
      current.value += ' ' + line.trim();
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    commit();
    current = { name: line.slice(0, idx).trim().toLowerCase(), value: line.slice(idx + 1) };
  }
  commit();

  return { get: (name: string) => map.get(name.toLowerCase()) };
}

/** Read a parameter (e.g. boundary, charset) from a structured header value. */
function getHeaderParam(headerValue: string | undefined, param: string): string | null {
  if (!headerValue) return null;
  const pattern = new RegExp(`;\\s*${param}\\s*=\\s*("([^"]*)"|([^;\\s]+))`, 'i');
  const match = headerValue.match(pattern);
  return (match?.[2] ?? match?.[3])?.trim() || null;
}

function getContentType(headers: ParsedHeaders): string {
  return (headers.get('content-type') || 'text/plain').split(';')[0].trim().toLowerCase();
}

/** Decode a quoted-printable body into raw bytes. */
function decodeQuotedPrintable(input: string): Buffer {
  const withoutSoftBreaks = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < withoutSoftBreaks.length; i += 1) {
    const char = withoutSoftBreaks[i];
    if (char === '=' && i + 2 < withoutSoftBreaks.length) {
      const hex = withoutSoftBreaks.slice(i + 1, i + 3);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(char.charCodeAt(0) & 0xff);
  }
  return Buffer.from(bytes);
}

/** Decode raw bytes into a string using the declared charset. */
function decodeCharset(bytes: Buffer, charset: string): string {
  const normalized = charset.toLowerCase();
  if (normalized === 'utf-8' || normalized === 'utf8' || normalized === 'us-ascii' || normalized === 'ascii') {
    return bytes.toString('utf8');
  }
  try {
    return new TextDecoder(normalized).decode(bytes);
  } catch {
    return bytes.toString('latin1');
  }
}

/** Decode a leaf body according to its transfer encoding and charset. */
function decodeBody(body: string, encoding: string, charset: string): string {
  const enc = encoding.trim().toLowerCase();
  if (enc === 'base64') {
    return decodeCharset(Buffer.from(body.replace(/\s+/g, ''), 'base64'), charset);
  }
  if (enc === 'quoted-printable') {
    return decodeCharset(decodeQuotedPrintable(body), charset);
  }
  return decodeCharset(Buffer.from(body, 'latin1'), charset);
}

/** Decode RFC 2047 encoded-words used in headers (Subject, From, ...). */
function decodeEncodedWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g,
    (_, charset: string, enc: string, data: string) => {
      const bytes =
        enc.toUpperCase() === 'B'
          ? Buffer.from(data, 'base64')
          : decodeQuotedPrintable(data.replace(/_/g, ' '));
      return decodeCharset(bytes, charset);
    },
  );
}

/** Recursively collect the first html and text leaves from a MIME tree. */
function collectLeaf(raw: string, into: MimeLeaf): void {
  const { headerBlock, body } = splitHeadersAndBody(raw);
  const headers = parseHeaders(headerBlock);
  const contentTypeRaw = headers.get('content-type') || 'text/plain';
  const contentType = getContentType(headers);
  const disposition = (headers.get('content-disposition') || '').toLowerCase();

  if (contentType.startsWith('multipart/')) {
    const boundary = getHeaderParam(contentTypeRaw, 'boundary');
    if (!boundary) return;
    const parts = splitMultipart(body, boundary);
    for (const part of parts) {
      collectLeaf(part, into);
    }
    return;
  }

  if (disposition.includes('attachment')) return;

  const charset = getHeaderParam(contentTypeRaw, 'charset') || 'utf-8';
  const encoding = headers.get('content-transfer-encoding') || '7bit';
  const decoded = decodeBody(body, encoding, charset).trim();
  if (!decoded) return;

  if (contentType === 'text/html' && into.html === undefined) {
    into.html = decoded;
  } else if (contentType === 'text/plain' && into.text === undefined) {
    into.text = decoded;
  }
}

/** Split a multipart body into its constituent parts by boundary. */
function splitMultipart(body: string, boundary: string): string[] {
  const delimiter = `--${boundary}`;
  const segments = body.split(delimiter);
  const parts: string[] = [];
  for (const segment of segments) {
    const trimmed = segment.replace(/^\r?\n/, '');
    if (!trimmed || trimmed.startsWith('--')) continue;
    parts.push(trimmed);
  }
  return parts;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToHtml(text: string): string {
  return `<p>${escapeHtml(text).replace(/\r?\n/g, '<br>')}</p>`;
}

function parseAddress(headerValue: string | undefined): { email: string | null; name: string | null } {
  if (!headerValue) return { email: null, name: null };
  const value = decodeEncodedWords(headerValue);
  const angle = value.match(/<([^>]+)>/);
  const emailOnly = value.match(/[\w.+-]+@[\w.-]+/);
  const email = (angle?.[1] || emailOnly?.[0] || '').trim().toLowerCase() || null;
  const nameMatch = value.match(/^"?([^"<]+)"?\s*</);
  const name = nameMatch?.[1]?.trim() || null;
  return { email, name };
}

export function extractBodies(source: Buffer | string): {
  html: string;
  text: string;
  messageId: string | null;
  subject: string;
  fromEmail: string | null;
  fromName: string | null;
  toAddresses: string[];
  receivedAt: Date;
} {
  const raw = typeof source === 'string' ? source : source.toString('utf8');

  const { headerBlock } = splitHeadersAndBody(raw);
  const headers = parseHeaders(headerBlock);

  const messageId = headers.get('message-id')?.replace(/^<|>$/g, '').trim() || null;
  const subject = decodeEncodedWords(headers.get('subject') || '').trim() || '(no subject)';
  const dateValue = headers.get('date');
  const receivedAt = dateValue ? new Date(dateValue) : new Date();

  const { email: fromEmail, name: fromName } = parseAddress(headers.get('from'));

  const toAddresses = (decodeEncodedWords(headers.get('to') || '').match(/[\w.+-]+@[\w.-]+/g) || []).map(
    (email) => email.toLowerCase(),
  );

  const leaf: MimeLeaf = { contentType: '', disposition: '' };
  collectLeaf(raw, leaf);

  const html =
    leaf.html || (leaf.text ? textToHtml(leaf.text) : '');
  const text =
    leaf.text || (leaf.html ? leaf.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '');

  return {
    html,
    text,
    messageId,
    subject,
    fromEmail,
    fromName,
    toAddresses,
    receivedAt: Number.isNaN(receivedAt.getTime()) ? new Date() : receivedAt,
  };
}
