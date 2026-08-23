import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { BaseBusinessModule } from "../base/business";
import { TenantGuard } from "./guards/tenant.guard";
import { TenantMiddleware } from "./middleware/tenant.middleware";
import { SubdomainTenantMiddleware } from "./middleware/subdomain-tenant.middleware";

@Global()
@Module({
  imports: [BaseBusinessModule],
  providers: [
    TenantMiddleware,
    SubdomainTenantMiddleware,
    TenantGuard,
    { provide: APP_GUARD, useClass: TenantGuard },
  ],
  exports: [
    BaseBusinessModule,
    TenantMiddleware,
    SubdomainTenantMiddleware,
    TenantGuard,
  ],
})
export class TenantModule {}
