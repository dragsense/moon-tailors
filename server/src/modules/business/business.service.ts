import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from "@nestjs/common";
import {
  EDbMode,
  EResource,
  type IPaginatedResponse,
  type TBusinessListQuery,
  type TCreateBusinessData,
} from "@template/contracts";
import {
  BaseBusinessService,
  BaseBusinessThemeService,
  BusinessEntity,
  PermissionsService,
} from "../../common/base";
import { EntityRouterService } from "../../common/database";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { DomainEventRegistry } from "../../common/events";
import { PaymentProcessorsService } from "../../common/payment-processors";
import { AiProcessorsService } from "../../common/ai-processors";

@Injectable()
export class BusinessService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly businesses: BaseBusinessService,
    private readonly themes: BaseBusinessThemeService,
    private readonly permissions: PermissionsService,
    private readonly entityRouter: EntityRouterService,
    private readonly paymentProcessors: PaymentProcessorsService,
    private readonly aiProcessors: AiProcessorsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.BUSINESSES);
    ActivityLogRegistry.register({
      module: "businesses",
      endpoints: ["/api/businesses", "/api/business-theme"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "businesses",
      events: {
        endpoint: ["/api/businesses", "/api/business-theme"],
      },
    });
  }

  /**
   * After processor catalogs seed, attach env DEFAULT_* to the platform business.
   * Platform owner + platform business themselves are seeded in common/base.
   */
  async onApplicationBootstrap() {
    await this.syncPlatformProcessorsFromEnv();
  }

  /**
   * Platform business always mirrors DEFAULT_PAYMENT_PROCESSOR / DEFAULT_AI_PROCESSOR.
   * Secrets (STRIPE_*, OPENAI_*, …) remain in env — only catalog FKs are stored.
   */
  private async syncPlatformProcessorsFromEnv(): Promise<void> {
    const platform = await this.businesses.findPlatform();
    if (!platform) {
      this.logger.warn("No platform business — skip env processor sync");
      return;
    }

    const payment = await this.paymentProcessors.getByType(
      this.paymentProcessors.defaultType(),
    );
    const ai = await this.aiProcessors.getByType(
      this.aiProcessors.defaultType(),
    );

    let changed = false;
    if (platform.paymentProcessorId !== payment.id) {
      await this.businesses.setPaymentProcessor(platform.id, payment.id);
      changed = true;
    }
    if (platform.aiProcessorId !== ai.id) {
      await this.businesses.setAiProcessor(platform.id, ai.id);
      changed = true;
    }

    if (changed) {
      this.logger.log(
        `Platform business processors synced from env: payment=${payment.type} ai=${ai.type}`,
      );
    }
  }

  async create(
    input: TCreateBusinessData,
    ownerUserId: string,
  ): Promise<BusinessEntity> {
    const business = await this.businesses.create(input, { ownerUserId });
    await this.themes.ensureDefault(business.id);
    // Runtime (non-platform) businesses get their own DB when multi-database is on.
    if (this.entityRouter.getMode() === EDbMode.MULTI_DATABASE) {
      await this.entityRouter.createTenantResources(business.tenantId);
    }
    return business;
  }

  list(
    query: TBusinessListQuery,
  ): Promise<IPaginatedResponse<BusinessEntity>> {
    return this.businesses.list(query);
  }

  get(id: string): Promise<BusinessEntity> {
    return this.businesses.get(id);
  }

  async setPaymentProcessor(
    id: string,
    paymentProcessorId: string | null,
  ): Promise<BusinessEntity> {
    await this.assertNotPlatformProcessorChange(id);
    return this.businesses.setPaymentProcessor(id, paymentProcessorId);
  }

  async setAiProcessor(
    id: string,
    aiProcessorId: string | null,
  ): Promise<BusinessEntity> {
    await this.assertNotPlatformProcessorChange(id);
    return this.businesses.setAiProcessor(id, aiProcessorId);
  }

  /** Platform business processors come from env only — not editable via API. */
  private async assertNotPlatformProcessorChange(id: string): Promise<void> {
    const row = await this.businesses.findById(id);
    if (row?.isPlatform) {
      throw new BadRequestException(
        "Platform business processors are controlled by DEFAULT_PAYMENT_PROCESSOR / DEFAULT_AI_PROCESSOR env — change them there, not via API",
      );
    }
  }
}
