import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { VendorPaymentEntity } from "./entities/vendor-payment.entity";
import { VendorPurchaseItemEntity } from "./entities/vendor-purchase-item.entity";
import { VendorPurchaseEntity } from "./entities/vendor-purchase.entity";
import { VendorEntity } from "./entities/vendor.entity";
import { VendorsController } from "./vendors.controller";
import { VendorSlipService } from "./vendor-slip.service";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VendorEntity,
      VendorPurchaseEntity,
      VendorPurchaseItemEntity,
      VendorPaymentEntity,
    ]),
    PermissionsModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorSlipService],
  exports: [VendorsService],
})
export class VendorsModule {}
