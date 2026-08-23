import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EPaymentProcessorType,
  type IPaginatedResponse,
  type TPaymentProcessorListQuery,
} from "@template/contracts";
import type { PaymentProcessorsConfig } from "../../config";
import { BaseBusinessService } from "../base/business";
import { RequestContext } from "../context";
import {
  EntityService,
  type IBoundEntityService,
} from "../database";
import type { EntityQueryConfig } from "../query";
import { PaymentProcessorEntity } from "./entities/payment-processor.entity";

const LABELS: Record<EPaymentProcessorType, string> = {
  [EPaymentProcessorType.STRIPE]: "Stripe",
  [EPaymentProcessorType.PAYSAFE]: "Paysafe",
  [EPaymentProcessorType.CASH]: "Cash",
  [EPaymentProcessorType.OTHER]: "Other",
};

export const PAYMENT_PROCESSOR_QUERY: EntityQueryConfig = {
  alias: "processor",
  searchable: ["name", "type"],
  sortable: ["name", "type", "createdAt", "updatedAt"],
  defaultSort: { field: "name", order: "ASC" },
};

@Injectable()
export class PaymentProcessorsService implements OnModuleInit {
  private readonly entity: IBoundEntityService<PaymentProcessorEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
    private readonly businesses: BaseBusinessService,
  ) {
    this.entity = this.entityService.bind(
      PaymentProcessorEntity,
      PAYMENT_PROCESSOR_QUERY,
    );
  }

  async onModuleInit() {
    for (const type of Object.values(EPaymentProcessorType)) {
      const existing = await this.entity.get({ type }, { access: [] });
      if (!existing) {
        await this.entity.create({
          type,
          name: LABELS[type],
          enabled: type === this.defaultType(),
          description: `${LABELS[type]} payment processor`,
        });
      }
    }
  }

  defaultType(): EPaymentProcessorType {
    return this.config.getOrThrow<PaymentProcessorsConfig>("paymentProcessors")
      .defaultType;
  }

  list(
    query: TPaymentProcessorListQuery,
  ): Promise<IPaginatedResponse<PaymentProcessorEntity>> {
    return this.entity.list(query, { access: [] });
  }

  getById(id: string): Promise<PaymentProcessorEntity> {
    return this.entity.require(id, { access: [] });
  }

  getByType(type: EPaymentProcessorType): Promise<PaymentProcessorEntity> {
    return this.entity.require({ type }, { access: [] });
  }

  /**
   * Resolve processor for the current request:
   * - Platform / default business → always `DEFAULT_PAYMENT_PROCESSOR` (env)
   * - Other businesses → DB FK when set (editable from frontend), else env default
   * Secrets (`STRIPE_*`) always stay in env.
   */
  async resolveForCurrentBusiness(): Promise<{
    processor: PaymentProcessorEntity;
    source: "business" | "env_default";
    stripeEnabled: boolean;
  }> {
    const cfg = this.config.getOrThrow<PaymentProcessorsConfig>(
      "paymentProcessors",
    );
    const stripeEnabled = cfg.enabled;

    const useEnvDefault = async () => {
      const row = await this.getByType(this.defaultType());
      return {
        processor: row,
        source: "env_default" as const,
        stripeEnabled,
      };
    };

    if (RequestContext.get("isPlatformBusiness")) {
      return useEnvDefault();
    }

    const businessId = RequestContext.get("businessId");
    if (businessId) {
      const business = await this.businesses.findById(businessId);
      if (business?.isPlatform) {
        return useEnvDefault();
      }
      if (business?.paymentProcessorId) {
        const row = await this.getById(business.paymentProcessorId);
        return {
          processor: row,
          source: "business",
          stripeEnabled,
        };
      }
    }

    return useEnvDefault();
  }
}
