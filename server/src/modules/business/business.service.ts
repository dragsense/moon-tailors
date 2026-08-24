import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from "@nestjs/common";
import {
  EResource,
  IMessageResponse,
  type TCreateBusinessData,
} from "@moon-tailors/contracts";
import {
  BaseBusinessService,
  BusinessEntity,
  PermissionsService,
  type CreateBusinessOptions,
} from "../../common/base";
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
   * Platform owner is seeded in UsersModule; platform business in BusinessModule.
   */
  async onApplicationBootstrap() {
  }


  get(id: string): Promise<BusinessEntity> {
    return this.businesses.get(id);
  }

  findPlatform(): Promise<BusinessEntity | null> {
    return this.businesses.findPlatform();
  }

  async create(
    input: TCreateBusinessData,
    options: CreateBusinessOptions = {},
  ): Promise<IMessageResponse> {
    const business = await this.businesses.create(input, options);
    this.logger.log(`Business created: ${business.id}`);
    return { message: `Business created: ${business.id}` };
  }


}
