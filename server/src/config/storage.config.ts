import { registerAs } from "@nestjs/config";
import { EStorageDriver } from "@template/contracts";

export type StorageS3Config = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  publicUrl?: string;
  endpoint?: string;
  forcePathStyle: boolean;
};

export type StorageConfig = {
  driver: EStorageDriver;
  /** Absolute root for local files (default: `{cwd}/public`). */
  localRoot: string;
  /** Public base URL for local files (e.g. http://localhost:8088). */
  publicBaseUrl: string;
  s3?: StorageS3Config;
};

function parseDriver(raw?: string): EStorageDriver {
  return raw?.toLowerCase() === EStorageDriver.S3
    ? EStorageDriver.S3
    : EStorageDriver.LOCAL;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

export default registerAs(
  "storage",
  (): StorageConfig => {
    const driver = parseDriver(process.env.STORAGE_DRIVER);
    const port = process.env.GATEWAY_EXPOSE || process.env.PORT || "8088";
    const publicBaseUrl = (
      process.env.UPLOAD_PUBLIC_BASE_URL ||
      `http://localhost:${port}/server`
    ).replace(/\/$/, "");

    const config: StorageConfig = {
      driver,
      localRoot: process.env.UPLOAD_LOCAL_ROOT || `${process.cwd()}/public`,
      publicBaseUrl,
    };

    if (driver === EStorageDriver.S3) {
      config.s3 = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION!,
        bucket: process.env.AWS_S3_BUCKET!,
        publicUrl: process.env.AWS_S3_PUBLIC_URL?.replace(/\/$/, ""),
        endpoint: process.env.AWS_S3_ENDPOINT || undefined,
        forcePathStyle: parseBool(process.env.AWS_S3_FORCE_PATH_STYLE, false),
      };
    }

    return config;
  },
);
