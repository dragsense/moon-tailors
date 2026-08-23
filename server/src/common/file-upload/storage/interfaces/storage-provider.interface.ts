import type { Readable } from "node:stream";

export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");

export type StorageProvider = {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getReadStream(key: string): Promise<Readable>;
  /** Delete from local disk when migrating from local → S3. */
  deleteLegacyLocal?(key: string): Promise<void>;
  /** Read from local disk when the row predates S3 migration. */
  getLegacyLocalReadStream?(key: string): Promise<Readable | null>;
};

/** `uploads/{folder}/{timestamp}-{sanitizedName}` */
export function buildUploadKey(folder: string, originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `uploads/${folder}/${Date.now()}-${safe}`;
}
