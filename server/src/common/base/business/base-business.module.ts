import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUploadModule } from "../../file-upload";
import { BusinessEntity } from "./entities";
import { BaseBusinessService } from "./base-business.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity]),
    FileUploadModule,
  ],
  providers: [BaseBusinessService],
  exports: [
    BaseBusinessService,
    TypeOrmModule,
  ],
})
export class BaseBusinessModule {}
