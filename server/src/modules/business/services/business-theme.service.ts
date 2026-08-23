import { Injectable, NotFoundException } from "@nestjs/common";
import {
  EUserLevel,
  type TUpsertBusinessThemeData,
} from "@template/contracts";
import {
  BaseBusinessService,
  BaseBusinessThemeService,
  BaseUsersService,
  type BusinessThemeEntity,
  type UserEntity,
} from "../../../common/base";
import { RequestContext } from "../../../common/context";

@Injectable()
export class BusinessThemeService {
  constructor(
    private readonly businesses: BaseBusinessService,
    private readonly themes: BaseBusinessThemeService,
    private readonly users: BaseUsersService,
  ) {}

  /** Resolve current business from RequestContext, else platform business. */
  async resolveCurrentBusinessId(): Promise<string> {
    const businessId = RequestContext.get("businessId");
    if (typeof businessId === "string" && businessId) {
      return businessId;
    }

    const tenantId = RequestContext.get("tenantId");
    if (typeof tenantId === "string" && tenantId) {
      const byTenant = await this.businesses.findByTenantId(tenantId);
      if (byTenant) return byTenant.id;
    }

    const platform = await this.businesses.findPlatform();
    if (!platform) {
      throw new NotFoundException("Platform business not found");
    }
    return platform.id;
  }

  async getCurrent(): Promise<BusinessThemeEntity> {
    const businessId = await this.resolveCurrentBusinessId();
    return this.themes.getForBusiness(businessId);
  }

  async getMyTheme(user: UserEntity): Promise<BusinessThemeEntity> {
    const businessId = await this.resolveBusinessForUser(user);
    return this.themes.getForBusiness(businessId);
  }

  async upsertMyTheme(
    user: UserEntity,
    input: TUpsertBusinessThemeData,
    files?: {
      logoLight?: Express.Multer.File[];
      logoDark?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
    },
  ): Promise<BusinessThemeEntity> {
    const businessId = await this.resolveBusinessForUser(user);
    return this.themes.upsert(businessId, input, files);
  }

  private async resolveBusinessForUser(user: UserEntity): Promise<string> {
    if (user.level <= EUserLevel.ADMIN) {
      const ctxId = RequestContext.get("businessId");
      if (typeof ctxId === "string" && ctxId) return ctxId;
      const platform = await this.businesses.findPlatform();
      if (platform) return platform.id;
    }

    const owned = await this.businesses.findByOwnerUserId(user.id);
    if (owned) return owned.id;

    const platform = await this.businesses.findPlatform();
    if (!platform) {
      throw new NotFoundException("Business not found for user");
    }
    return platform.id;
  }
}
