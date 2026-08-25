import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessEntity } from "./entities";
import { BaseBusinessService } from "./base-business.service";

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity])],
  providers: [BaseBusinessService],
  exports: [BaseBusinessService, TypeOrmModule],
})
export class BaseBusinessModule {}
