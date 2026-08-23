import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
  randomBytes,
  type CipherGCM,
  type CipherGCMTypes,
  type DecipherGCM,
} from "crypto";
import type { EncryptionConfig } from "../../config";
import { bindDbEncryption } from "./db-encryption";

/** Prefix so plaintext legacy rows can coexist until re-saved. */
export const DB_FIELD_PREFIX = "enc:v1:";

@Injectable()
export class EncryptionService implements OnModuleInit {
  private config: (EncryptionConfig & { key: string }) | null = null;
  private responseEnabled = false;
  private fieldEnabled = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config =
      this.configService.getOrThrow<EncryptionConfig>("encryption");
    const needsCrypto = config.enabled || config.dbEnabled;
    if (needsCrypto) {
      if (!config.key || config.key.length < 32) {
        throw new Error(
          "ENCRYPTION_KEY must be at least 32 characters when ENCRYPTION_ENABLED or DB_ENCRYPTION_ENABLED is true",
        );
      }
      this.config = { ...config, key: config.key };
    }
    this.responseEnabled = Boolean(config.enabled && this.config);
    this.fieldEnabled = Boolean(config.dbEnabled && this.config);
    bindDbEncryption(this);
  }

  /** API response encryption (`ENCRYPTION_ENABLED`). */
  get enabled(): boolean {
    return this.responseEnabled;
  }

  /** At-rest column encryption (`DB_ENCRYPTION_ENABLED`). */
  get dbEnabled(): boolean {
    return this.fieldEnabled;
  }

  encrypt(data: unknown): string {
    const config = this.requireConfig();
    const jsonData = JSON.stringify(data);
    const iv = randomBytes(config.ivLength);
    const salt = randomBytes(config.saltLength);
    const key = pbkdf2Sync(
      config.key,
      salt,
      config.iterations,
      config.keyLength,
      config.hash,
    );

    const cipher = createCipheriv(
      config.algorithm as CipherGCMTypes,
      key,
      iv,
    ) as CipherGCM;
    cipher.setAAD(Buffer.from(config.additionalData, "utf8"));
    let encrypted = cipher.update(jsonData, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "hex"),
    ]).toString("base64");
  }

  decrypt(encryptedData: string): unknown {
    const config = this.requireConfig();
    const combined = Buffer.from(encryptedData, "base64");
    const salt = combined.subarray(0, config.saltLength);
    const iv = combined.subarray(
      config.saltLength,
      config.saltLength + config.ivLength,
    );
    const tag = combined.subarray(
      config.saltLength + config.ivLength,
      config.saltLength + config.ivLength + config.tagLength,
    );
    const encrypted = combined.subarray(
      config.saltLength + config.ivLength + config.tagLength,
    );

    const key = pbkdf2Sync(
      config.key,
      salt,
      config.iterations,
      config.keyLength,
      config.hash,
    );
    const decipher = createDecipheriv(
      config.algorithm as CipherGCMTypes,
      key,
      iv,
    ) as DecipherGCM;
    decipher.setAAD(Buffer.from(config.additionalData, "utf8"));
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }

  /**
   * Encrypt a string for DB storage when `DB_ENCRYPTION_ENABLED=true`.
   * Passes through when disabled (or null/empty).
   */
  encryptField(value: string | null | undefined): string | null {
    if (value == null || value === "") return value ?? null;
    if (!this.fieldEnabled) return value;
    if (value.startsWith(DB_FIELD_PREFIX)) return value;
    return `${DB_FIELD_PREFIX}${this.encrypt(value)}`;
  }

  /**
   * Decrypt a DB field. Legacy plaintext (no prefix) is returned as-is.
   * When DB encryption is off, returns the stored value unchanged.
   */
  decryptField(value: string | null | undefined): string | null {
    if (value == null || value === "") return value ?? null;
    if (!value.startsWith(DB_FIELD_PREFIX)) return value;
    if (!this.config) {
      throw new Error(
        "Encrypted DB field found but ENCRYPTION_KEY / DB crypto is not configured",
      );
    }
    const payload = value.slice(DB_FIELD_PREFIX.length);
    const decrypted = this.decrypt(payload);
    return typeof decrypted === "string" ? decrypted : String(decrypted);
  }

  encryptResponse(data: unknown, timestamp = Date.now()) {
    const config = this.requireConfig();
    const responseData = {
      data,
      timestamp,
      version: "1.0",
      checksum: this.generateChecksum(data),
    };
    return {
      encrypted: true as const,
      data: this.encrypt(responseData),
      algorithm: config.algorithm,
      timestamp,
    };
  }

  private generateChecksum(data: unknown): string {
    return createHash("sha256").update(JSON.stringify(data)).digest("hex");
  }

  private requireConfig(): EncryptionConfig & { key: string } {
    if (!this.config) {
      throw new Error("Encryption is not enabled");
    }
    return this.config;
  }
}
