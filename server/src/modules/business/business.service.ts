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
} from "@moon-tailors/contracts";
import {
  BaseBusinessService,
  BusinessEntity,
  PermissionsService,
} from "../../common/base";
import { EntityRouterService } from "../../common/database";
import { ActivityLogRegistry } from "../../common/activity-logs";
import { DomainEventRegistry } from "../../common/events";

@Injectable()
export class BusinessService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly businesses: BaseBusinessService,
    private readonly permissions: PermissionsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.BUSINESSES);
    ActivityLogRegistry.register({
      module: "businesses",
      endpoints: ["/api/businesses"],
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    });
    DomainEventRegistry.register({
      module: "businesses",
      events: {
        endpoint: ["/api/businesses"],
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

  }

  get(id: string): Promise<BusinessEntity> {
    return this.businesses.get(id);
  }

}
