import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { EAppMode } from "@moon-tailors/contracts";
import { RequestContext } from "../../context";
import type { TenantConfig } from "../../../config";

/**
 * Extract tenantId from cookie / header / query / body (single-domain mode).
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const tenant = this.config.getOrThrow<TenantConfig>("tenant");
    if (tenant.appMode !== EAppMode.SINGLE_DOMAIN_TENANT) {
      return next();
    }

    const tenantId = this.extractTenantId(req);
    if (!tenantId) return next();

    (req as Request & { tenantId?: string }).tenantId = tenantId;
    RequestContext.set("tenantId", tenantId);
    next();
  }

  private extractTenantId(req: Request): string | null {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    if (cookies?.tenant_id || cookies?.tenantId) {
      return String(cookies.tenant_id ?? cookies.tenantId);
    }

    const header =
      req.headers["x-tenant-id"] ??
      req.headers["tenant-id"] ??
      req.headers["x-tenantid"];
    if (header) {
      return Array.isArray(header) ? header[0] : header;
    }

    const query = req.query.tenantId ?? req.query.tenant_id;
    if (typeof query === "string") return query;
    if (Array.isArray(query) && typeof query[0] === "string") return query[0];

    const body = req.body as { tenantId?: string; tenant_id?: string } | undefined;
    if (body?.tenantId) return String(body.tenantId);
    if (body?.tenant_id) return String(body.tenant_id);

    return null;
  }
}
