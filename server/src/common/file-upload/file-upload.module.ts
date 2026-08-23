import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../base";
import { FileUploadController } from "./controllers/file-upload.controller";
import { FileUploadEntity } from "./entities";
import { FileUploadService } from "./services/file-upload.service";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUploadEntity]),
    PermissionsModule,
    StorageModule,
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService, StorageModule],
})
export class FileUploadModule {}
