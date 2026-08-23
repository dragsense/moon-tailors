import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  EUserLevel,
  paymentProcessorListQuerySchema,
  type IPaginatedResponse,
  type TPaymentProcessorListQuery,
} from "@template/contracts";
import { RequireUserLevels } from "../auth";
import { ZodValidationPipe } from "../validation";
import { PaymentProcessorEntity } from "./entities/payment-processor.entity";
import { PaymentProcessorsService } from "./payment-processors.service";

@ApiTags("Payment processors")
@Controller("payment-processors")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class PaymentProcessorsController {
  constructor(private readonly processors: PaymentProcessorsService) {}

  @Get("current")
  current() {
    return this.processors.resolveForCurrentBusiness();
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(paymentProcessorListQuerySchema))
    query: TPaymentProcessorListQuery,
  ): Promise<IPaginatedResponse<PaymentProcessorEntity>> {
    return this.processors.list(query);
  }
}
