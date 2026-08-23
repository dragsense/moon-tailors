import { Module } from "@nestjs/common";
import {
  BaseBusinessModule,
  BaseUsersModule,
  PermissionsModule,
} from "../../common/base";
import { PaymentProcessorsModule } from "../../common/payment-processors";
import { AiProcessorsModule } from "../../common/ai-processors";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";
import { BusinessThemeController } from "./controllers/business-theme.controller";
import { BusinessThemeService } from "./services/business-theme.service";

@Module({
  imports: [
    BaseBusinessModule,
    BaseUsersModule,
    PermissionsModule,
    PaymentProcessorsModule,
    AiProcessorsModule,
  ],
  controllers: [BusinessController, BusinessThemeController],
  providers: [BusinessService, BusinessThemeService],
  exports: [BusinessService, BusinessThemeService],
})
export class BusinessModule {}
