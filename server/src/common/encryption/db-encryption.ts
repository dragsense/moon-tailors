import type { ValueTransformer } from "typeorm";
import type { EncryptionService } from "./encryption.service";

/**
 * Bound from EncryptionService.onModuleInit so TypeORM transformers
 * can call encrypt/decrypt without Nest DI on the entity class.
 */
let dbEncryption: EncryptionService | null = null;

export function bindDbEncryption(service: EncryptionService): void {
  dbEncryption = service;
}

export function getDbEncryption(): EncryptionService | null {
  return dbEncryption;
}

/**
 * TypeORM column transformer for sensitive text fields.
 * Uses `DB_ENCRYPTION_ENABLED` — no-op when that flag is false.
 *
 * @example
 * @Column({ type: "text", nullable: true, select: false, transformer: encryptedTextTransformer })
 * password!: string | null;
 */
export const encryptedTextTransformer: ValueTransformer = {
  to(value: string | null | undefined): string | null {
    return dbEncryption?.encryptField(value) ?? value ?? null;
  },
  from(value: string | null | undefined): string | null {
    return dbEncryption?.decryptField(value) ?? value ?? null;
  },
};
