import { Injectable } from "@nestjs/common";
import type {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { RequestContext } from "../../context";
import type { TenantContext } from "../types";
import { DatabaseManager } from "./database-manager.service";

@Injectable()
export class EntityRouterService {
  constructor(private readonly databaseManager: DatabaseManager) {}

  getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    tenantId?: string,
  ): Repository<T> {
    // Platform business always uses main — ignore tenant routing.
    if (RequestContext.get("isPlatformBusiness")) {
      return this.databaseManager.getRepository(entity, {});
    }
    const resolved =
      tenantId ?? RequestContext.get("tenantId") ?? undefined;
    return this.databaseManager.getRepository(entity, {
      tenantId: resolved,
    });
  }

  /** Routed EntityManager (use `.transaction(...)` for writes). */
  getManager(
    entity: EntityTarget<ObjectLiteral>,
    tenantId?: string,
  ): EntityManager {
    return this.getRepository(entity, tenantId).manager;
  }

  /**
   * Create a per-tenant database. Callers must not invoke this for the
   * platform / default business (it always stays on the main DB).
   */
  createTenantResources(tenantId: string): Promise<void> {
    return this.databaseManager.createTenantResources(tenantId);
  }

  tenantExists(tenantId: string): Promise<boolean> {
    return this.databaseManager.tenantExists(tenantId);
  }

  getMode() {
    return this.databaseManager.getMode();
  }

  extractTenantContext(): TenantContext | undefined {
    const tenantId = RequestContext.get("tenantId");
    return tenantId ? { tenantId } : undefined;
  }
}
