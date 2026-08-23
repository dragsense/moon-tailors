/**
 * Browser AES-256-GCM decrypt — mirrors server EncryptionService.
 */

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export type EncryptedResponse = {
  encrypted: boolean;
  data: string;
  algorithm: string;
  timestamp: number;
};

type DecryptedEnvelope = {
  data: unknown;
  timestamp: number;
  version: string;
  checksum: string;
};

const KEY = import.meta.env.VITE_ENCRYPTION_KEY;
const AAD = import.meta.env.VITE_ENCRYPTION_AAD ?? "WEB-API";
const ITERATIONS = Number(import.meta.env.VITE_ENCRYPTION_ITERATIONS ?? 100_000);
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

export class DecryptionService {
  async decryptResponse(payload: unknown): Promise<unknown> {
    if (
      !payload ||
      typeof payload !== "object" ||
      !(payload as EncryptedResponse).encrypted ||
      typeof (payload as EncryptedResponse).data !== "string"
    ) {
      return payload;
    }

    if (!KEY || KEY.length < 32) {
      throw new Error("VITE_ENCRYPTION_KEY is required to decrypt API responses");
    }
    if (!Number.isFinite(ITERATIONS) || ITERATIONS < 1) {
      throw new Error("VITE_ENCRYPTION_ITERATIONS must be a positive number");
    }

    const envelope = (await this.decrypt(
      (payload as EncryptedResponse).data,
    )) as DecryptedEnvelope;

    const checksum = await this.checksum(envelope.data);
    if (checksum !== envelope.checksum) {
      throw new Error("Data integrity check failed");
    }
    return envelope.data;
  }

  private async decrypt(encryptedData: string): Promise<unknown> {
    const combined = base64ToUint8Array(encryptedData);
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH,
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const keyBits = await this.deriveKey(KEY!, salt);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBits,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const encryptedWithTag = new Uint8Array(encrypted.length + tag.length);
    encryptedWithTag.set(encrypted);
    encryptedWithTag.set(tag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
        additionalData: new TextEncoder().encode(AAD),
        tagLength: TAG_LENGTH * 8,
      },
      cryptoKey,
      encryptedWithTag,
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  private async deriveKey(
    password: string,
    salt: Uint8Array,
  ): Promise<ArrayBuffer> {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    return crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: ITERATIONS,
        hash: "SHA-512",
      },
      baseKey,
      256,
    );
  }

  private async checksum(data: unknown): Promise<string> {
    const buffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(data)),
    );
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

export const decryptionService = new DecryptionService();
