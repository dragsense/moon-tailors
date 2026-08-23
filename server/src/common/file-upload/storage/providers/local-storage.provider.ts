import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Readable } from "node:stream";
import type { StorageConfig } from "../../../../config/storage.config";
import type { StorageProvider } from "../interfaces/storage-provider.interface";

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly publicRoot: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    const storage = config.getOrThrow<StorageConfig>("storage");
    this.publicRoot = storage.localRoot;
    this.publicBaseUrl = storage.publicBaseUrl;
  }

  private resolvePath(key: string): string {
    return join(this.publicRoot, key);
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<void> {
    const filePath = this.resolvePath(key);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, buffer);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    if (existsSync(filePath)) unlinkSync(filePath);
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  async getReadStream(key: string): Promise<Readable> {
    const filePath = this.resolvePath(key);
    if (!existsSync(filePath)) throw new Error(`File not found: ${key}`);
    return createReadStream(filePath);
  }

  async deleteLegacyLocal(key: string): Promise<void> {
    await this.delete(key);
  }

  async getLegacyLocalReadStream(key: string): Promise<Readable | null> {
    const filePath = this.resolvePath(key);
    if (!existsSync(filePath)) return null;
    return createReadStream(filePath);
  }
}
