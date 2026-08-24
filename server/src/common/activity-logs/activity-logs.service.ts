import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EPermissionAction,
  EResource,
  type IPaginatedResponse,
  type TListQuery,
} from "@moon-tailors/contracts";
import type { ActivityLogsConfig } from "../../config";
import { PermissionsService } from "../base/permissions";
import { RequestContext } from "../context";
import {
  EntityService,
  type IBoundEntityService,
} from "../database";
import type { EntityQueryConfig } from "../query";
import { ActivityLogRegistry } from "./activity-log.registry";
import { ActivityLogEntity } from "./entities";
import type { CreateActivityLogInput } from "./types";

export const ACTIVITY_LOG_QUERY: EntityQueryConfig = {
  alias: "log",
  searchable: ["description", "endpoint", "module", "errorMessage"],
  sortable: ["createdAt", "updatedAt", "statusCode", "type", "status"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class ActivityLogsService implements OnModuleInit {
  private readonly entity: IBoundEntityService<ActivityLogEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly config: ConfigService,
    private readonly permissions: PermissionsService,
  ) {
    this.entity = this.entityService.bind(
      ActivityLogEntity,
      ACTIVITY_LOG_QUERY,
    );
  }

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.ACTIVITY_LOGS, [
      EPermissionAction.READ,
      EPermissionAction.MANAGE,
    ]);
  }

  isGloballyEnabled(): boolean {
    return (
      this.config.getOrThrow<ActivityLogsConfig>("activityLogs").enabled ===
      true
    );
  }

  shouldLog(endpoint: string, method: string): boolean {
    if (!this.isGloballyEnabled()) return false;
    return ActivityLogRegistry.matches(endpoint, method);
  }

  async createActivityLog(
    input: CreateActivityLogInput,
  ): Promise<ActivityLogEntity | null> {
    if (!this.shouldLog(input.endpoint ?? "", input.method ?? "")) {
      return null;
    }

    return this.entity.create({
      description: input.description,
      type: input.type,
      status: input.status,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      endpoint: input.endpoint ?? null,
      method: input.method ?? null,
      statusCode: input.statusCode ?? null,
      metadata: input.metadata ?? null,
      errorMessage: input.errorMessage ?? null,
      userId: RequestContext.get("userId") ?? null,
      businessId: RequestContext.get("businessId") ?? null,
      module: input.module ?? null,
    });
  }

  list(query: TListQuery): Promise<IPaginatedResponse<ActivityLogEntity>> {
    return this.entity.list(query);
  }
}
