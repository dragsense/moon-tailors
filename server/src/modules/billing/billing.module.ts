import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { PaymentAdapterModule } from "../payment-adapter/payment-adapter.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { BillingPayController } from "./controllers/billing-pay.controller";
import { BillingEntity } from "./entities/billing.entity";

/**
 * TypeOrmModule.forFeature still registers metadata for the entity.
 * Runtime CRUD uses EntityRouterService.getRepository (tenant or main DS).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([BillingEntity]),
    PermissionsModule,
    forwardRef(() => PaymentAdapterModule),
  ],
  controllers: [BillingController, BillingPayController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
