import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EStorageDriver } from "@moon-tailors/contracts";
import type { StorageConfig } from "../../../config/storage.config";
import { STORAGE_PROVIDER } from "./interfaces/storage-provider.interface";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import { S3StorageProvider } from "./providers/s3-storage.provider";

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        config: ConfigService,
        local: LocalStorageProvider,
        s3: S3StorageProvider,
      ) => {
        const driver =
          config.get<StorageConfig>("storage")?.driver ?? EStorageDriver.LOCAL;
        return driver === EStorageDriver.S3 ? s3 : local;
      },
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
    },
  ],
  exports: [STORAGE_PROVIDER, LocalStorageProvider, S3StorageProvider],
})
export class StorageModule {}
