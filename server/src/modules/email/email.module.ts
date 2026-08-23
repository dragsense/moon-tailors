import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { EmailMessageEntity } from "./entities/email-message.entity";
import { EmailController } from "./email.controller";
import { EmailInboxService } from "./email.service";
import { EmailImapSyncService } from "./email-imap-sync.service";

@Module({
  imports: [TypeOrmModule.forFeature([EmailMessageEntity]), PermissionsModule],
  controllers: [EmailController],
  providers: [EmailInboxService, EmailImapSyncService],
  exports: [EmailInboxService, EmailImapSyncService],
})
export class EmailInboxModule {}
