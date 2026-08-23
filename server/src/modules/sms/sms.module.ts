import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { SmsMessageEntity } from "./entities/sms-message.entity";
import { SmsController } from "./sms.controller";
import { SmsInboxService } from "./sms.service";

@Module({
  imports: [TypeOrmModule.forFeature([SmsMessageEntity]), PermissionsModule],
  controllers: [SmsController],
  providers: [SmsInboxService],
  exports: [SmsInboxService],
})
export class SmsInboxModule {}
