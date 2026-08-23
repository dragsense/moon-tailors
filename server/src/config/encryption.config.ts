import { registerAs } from "@nestjs/config";

export type EncryptionConfig = {
  /** API response envelope encryption (`ENCRYPTION_ENABLED`). */
  enabled: boolean;
  /** At-rest field encryption for sensitive columns (`DB_ENCRYPTION_ENABLED`). */
  dbEnabled: boolean;
  key?: string;
  algorithm: string;
  ivLength: number;
  saltLength: number;
  tagLength: number;
  keyLength: number;
  iterations: number;
  hash: string;
  additionalData: string;
};

export default registerAs(
  "encryption",
  (): EncryptionConfig => ({
    enabled: process.env.ENCRYPTION_ENABLED === "true",
    dbEnabled: process.env.DB_ENCRYPTION_ENABLED === "true",
    key: process.env.ENCRYPTION_KEY,
    algorithm: process.env.ENCRYPTION_ALGORITHM ?? "aes-256-gcm",
    ivLength: Number(process.env.ENCRYPTION_IV_LENGTH ?? 16),
    saltLength: Number(process.env.ENCRYPTION_SALT_LENGTH ?? 64),
    tagLength: Number(process.env.ENCRYPTION_TAG_LENGTH ?? 16),
    keyLength: Number(process.env.ENCRYPTION_KEY_LENGTH ?? 32),
    iterations: Number(process.env.ENCRYPTION_ITERATIONS ?? 100000),
    hash: process.env.ENCRYPTION_HASH ?? "sha512",
    additionalData: process.env.ENCRYPTION_AAD ?? "WEB-API",
  }),
);
