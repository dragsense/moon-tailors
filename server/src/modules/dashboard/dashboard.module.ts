import { Module } from "@nestjs/common";
import { PermissionsModule } from "../../common/base";
import { CustomersModule } from "../customers/customers.module";
import { OrdersModule } from "../orders/orders.module";
import { StaffModule } from "../staff/staff.module";
import { VendorsModule } from "../vendors/vendors.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [PermissionsModule, CustomersModule, OrdersModule, StaffModule, VendorsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
