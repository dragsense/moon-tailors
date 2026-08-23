import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { EAppMode } from "@template/contracts";
import { RequestContext } from "../../context";
import type { TenantConfig } from "../../../config";

/**
 * Extract business subdomain from Host (multi_domain_tenant mode).
 */
@Injectable()
export class SubdomainTenantMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const tenant = this.config.getOrThrow<TenantConfig>("tenant");
    if (tenant.appMode !== EAppMode.MULTI_DOMAIN_TENANT) {
      return next();
    }

    const hostname = req.hostname;
    if (!hostname) return next();

    const normalized = this.normalizeHostname(hostname, tenant.reservedSubdomains);
    const subdomain = this.extractSubdomain(normalized);
    if (!subdomain) return next();

    (req as Request & { subdomain?: string }).subdomain = subdomain;
    RequestContext.set("subdomain", subdomain);
    next();
  }

  private normalizeHostname(
    hostname: string,
    reserved: string[],
  ): string {
    return hostname
      .toLowerCase()
      .split(".")
      .filter((part) => !reserved.includes(part))
      .join(".");
  }

  private extractSubdomain(hostname: string): string | null {
    const host = hostname.replace(/^https?:\/\//, "").split(":")[0];
    if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return null;
    }

    const parts = host.split(".");
    if (parts.length === 2 && parts[1] === "localhost") return parts[0];
    if (parts.length <= 2) return null;
    if (parts[0] === "www" && parts.length === 3) return null;
    return parts[0];
  }
}
