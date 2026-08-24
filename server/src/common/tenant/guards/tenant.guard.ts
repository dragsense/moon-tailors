import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestContext } from "../../context";
import { BaseBusinessService } from "../../base/business";
import { SKIP_TENANT_KEY } from "../decorators/skip-tenant.decorator";

type TenantRequest = {
  tenantId?: string;
  businessId?: string;
};

/**
 * Always resolve a business into RequestContext so the app is tenant-aware.
 * Header/subdomain → that business; otherwise → platform (`isPlatform`) business.
 * Skip only with `@SkipTenant()` (not `@Public()` — public routes still get platform).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly businesses: BaseBusinessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      targets,
    );
    if (skip) return true;

    const request = context.switchToHttp().getRequest<TenantRequest>();
    
    const tenantId = request.tenantId ?? RequestContext.get("tenantId");

    let business =
      typeof tenantId === "string" && tenantId
        ? await this.businesses.findByTenantId(tenantId)
          : null;

    if ((tenantId) && !business) {
      throw new BadRequestException(
        `Business not found for ${tenantId}`,
      );
    }

    if (!business) {
      business = await this.businesses.findPlatform();
    }

    if (!business) {
      // Platform seed may not have run yet (boot order) — allow through.
      return true;
    }

    if (!business.tenantId) {
      throw new BadRequestException(
        "Tenant ID is required for this operation. Provide a tenant context.",
      );
    }

    request.businessId = business.id;
    request.tenantId = business.tenantId;
    RequestContext.set("businessId", business.id);
    RequestContext.set("tenantId", business.tenantId);
    RequestContext.set("isPlatformBusiness", Boolean(business.isPlatform));

    return true;
  }
}
