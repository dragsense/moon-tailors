import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createReadStream, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import type { Readable } from "node:stream";
import type { StorageConfig } from "../../../../config/storage.config";
import type { StorageProvider } from "../interfaces/storage-provider.interface";

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;
  private readonly publicRoot: string;

  constructor(config: ConfigService) {
    const storage = config.getOrThrow<StorageConfig>("storage");
    const s3 = storage.s3;
    this.bucket = s3?.bucket ?? "";
    const region = s3?.region ?? "us-east-1";

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: s3?.accessKeyId ?? "",
        secretAccessKey: s3?.secretAccessKey ?? "",
      },
      ...(s3?.endpoint
        ? { endpoint: s3.endpoint, forcePathStyle: s3.forcePathStyle }
        : {}),
    });

    this.publicUrlBase =
      s3?.publicUrl ?? `https://${this.bucket}.s3.${region}.amazonaws.com`;
    this.publicRoot = storage.localRoot;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrlBase}/${key}`;
  }

  async getReadStream(key: string): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!response.Body) throw new Error(`File not found in S3: ${key}`);
    return response.Body as Readable;
  }

  async deleteLegacyLocal(key: string): Promise<void> {
    const filePath = join(this.publicRoot, key);
    if (existsSync(filePath)) unlinkSync(filePath);
  }

  async getLegacyLocalReadStream(key: string): Promise<Readable | null> {
    const filePath = join(this.publicRoot, key);
    if (!existsSync(filePath)) return null;
    return createReadStream(filePath);
  }
}
