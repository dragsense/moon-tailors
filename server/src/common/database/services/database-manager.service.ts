import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import {
  DataSource,
  type EntityTarget,
  type ObjectLiteral,
  type Repository,
} from "typeorm";
import { EDbMode } from "@moon-tailors/contracts";
import type { DatabaseConfig, TenantConfig } from "../../../config";
import { RequestContext } from "../../context";
import type { TenantContext } from "../types";

/**
 * Routes repositories to the main Nest DataSource or a per-tenant DataSource
 * when DB_MODE=multi-database.
 *
 * Single mode: always main.
 * Multi-database: creates `{mainDb}_tenant_{tenantId}` on demand and caches it.
 */
@Injectable()
export class DatabaseManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseManager.name);
  private readonly tenantConnections = new Map<string, DataSource>();
  private dbMode: EDbMode = EDbMode.SINGLE;
  private synchronize = false;

  constructor(
    @InjectDataSource()
    private readonly main: DataSource,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.dbMode = this.config.getOrThrow<TenantConfig>("tenant").dbMode;
    this.synchronize =
      this.config.getOrThrow<DatabaseConfig>("database").synchronize;
    this.logger.log(`Database manager ready (dbMode=${this.dbMode})`);
  }

  async onModuleDestroy() {
    for (const [name, ds] of this.tenantConnections) {
      if (ds.isInitialized) {
        await ds.destroy();
        this.logger.log(`Closed tenant connection ${name}`);
      }
    }
    this.tenantConnections.clear();
  }

  getMode(): EDbMode {
    return this.dbMode;
  }

  getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    context?: TenantContext,
  ): Repository<T> {
    // Platform / default business always stays on the main database.
    if (RequestContext.get("isPlatformBusiness")) {
      return this.main.getRepository(entity);
    }

    const tenantId =
      context?.tenantId ?? RequestContext.get("tenantId") ?? undefined;

    if (this.dbMode !== EDbMode.MULTI_DATABASE || !tenantId) {
      return this.main.getRepository(entity);
    }

    const connectionName = `tenant_${tenantId}`;
    const cached = this.tenantConnections.get(connectionName);
    if (!cached?.isInitialized) {
      // Lazy sync path: callers that need guaranteed tenant DB should await createTenantResources first.
      this.logger.warn(
        `Tenant connection ${connectionName} not ready; falling back to main`,
      );
      return this.main.getRepository(entity);
    }
    return cached.getRepository(entity);
  }

  async createTenantResources(tenantId: string): Promise<void> {
    if (this.dbMode !== EDbMode.MULTI_DATABASE) return;
    // Never create a tenant DB for the platform / default business.
    if (RequestContext.get("isPlatformBusiness")) return;

    const connectionName = `tenant_${tenantId}`;
    if (this.tenantConnections.get(connectionName)?.isInitialized) {
      return;
    }

    const mainUrl = this.config.getOrThrow<DatabaseConfig>("database").url;
    const parsed = new URL(mainUrl);
    const mainDb = parsed.pathname.replace(/^\//, "") || "moon_tailors_db";
    const tenantDb = `${mainDb}_tenant_${tenantId.replace(/-/g, "")}`;

    await this.main
      .query(`SELECT 1 FROM pg_database WHERE datname = $1`, [tenantDb])
      .then(async (rows: unknown[]) => {
        if (!rows.length) {
          this.logger.log(`Creating tenant database ${tenantDb}`);
          await this.main.query(`CREATE DATABASE "${tenantDb}"`);
        }
      });

    const tenantUrl = new URL(mainUrl);
    tenantUrl.pathname = `/${tenantDb}`;

    const dataSource = new DataSource({
      type: "postgres",
      url: tenantUrl.toString(),
      entities: this.main.options.entities,
      synchronize: this.synchronize,
    });
    await dataSource.initialize();
    this.tenantConnections.set(connectionName, dataSource);
    this.logger.log(`Tenant connection ready: ${connectionName}`);
  }

  async tenantExists(tenantId: string): Promise<boolean> {
    if (this.dbMode !== EDbMode.MULTI_DATABASE) return true;
    return this.tenantConnections.has(`tenant_${tenantId}`);
  }

  getMainDataSource(): DataSource {
    return this.main;
  }
}
