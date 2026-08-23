import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SentEmailEntity } from "./entities";
import { EmailService } from "./email.service";
import { EmailTemplateService } from "./email-template.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SentEmailEntity])],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService, TypeOrmModule],
})
export class EmailModule {}
