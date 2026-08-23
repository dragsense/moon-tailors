import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BaseBusinessModule } from "../base/business";
import { PaymentProcessorEntity } from "./entities/payment-processor.entity";
import { PaymentProcessorsService } from "./payment-processors.service";
import { PaymentProcessorsController } from "./payment-processors.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentProcessorEntity]),
    BaseBusinessModule,
  ],
  controllers: [PaymentProcessorsController],
  providers: [PaymentProcessorsService],
  exports: [PaymentProcessorsService],
})
export class PaymentProcessorsModule {}
