import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  EPermissionAction,
  EResource,
  EUserLevel,
} from "@moon-tailors/contracts";
import { In, type EntityManager } from "typeorm";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import type { EntityQueryConfig } from "../../query";
import { PermissionEntity, UserPermissionEntity } from "./entities";

const WILDCARD = "*:*";
const ALL_ACTIONS = Object.values(EPermissionAction);

type PermissionSeed = Pick<PermissionEntity, "name" | "resource" | "action">;

export const PERMISSION_QUERY: EntityQueryConfig = {
  alias: "permission",
  restrictedFields: ["passwordHash"],
  sortable: ["createdAt", "name"],
  defaultSort: { field: "name", order: "ASC" },
  searchable: ["name", "resource"],
};

export const USER_PERMISSION_QUERY: EntityQueryConfig = {
  alias: "userPermission",
  restrictedFields: ["passwordHash"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "ASC" },
};

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly permissions: IBoundEntityService<PermissionEntity>;
  private readonly userPermissions: IBoundEntityService<UserPermissionEntity>;

  constructor(private readonly entityService: EntityService) {
    this.permissions = this.entityService.bind(
      PermissionEntity,
      PERMISSION_QUERY,
    );
    this.userPermissions = this.entityService.bind(
      UserPermissionEntity,
      USER_PERMISSION_QUERY,
    );
  }

  /** Only shared platform grants live here; feature modules seed their own resources. */
  async onModuleInit() {
    await this.ensurePermissions([
      { name: WILDCARD, resource: "*", action: "*" },
    ]);
  }

  /**
   * Idempotent catalog upsert used by feature modules on init.
   * Example: `ensureResource(EResource.TASKS)` from TasksService.
   */
  async ensureResource(
    resource: EResource,
    actions: readonly EPermissionAction[] = ALL_ACTIONS,
  ): Promise<void> {
    await this.ensurePermissions(
      actions.map((action) => ({
        name: `${resource}:${action}`,
        resource,
        action,
      })),
    );
  }

  /** Seed every `EResource` × action — needed before assigning elevated level grants. */
  async ensureAllResources(): Promise<void> {
    for (const resource of Object.values(EResource)) {
      await this.ensureResource(resource);
    }
  }

  async ensurePermissions(items: PermissionSeed[]): Promise<void> {
    for (const item of items) {
      const existing = await this.permissions.get({ name: item.name });
      if (!existing) {
        await this.permissions.create(item);
      }
    }
  }

  /** Attach permissions to a user by name; there is no Role entity. */
  async assignToUser(
    userId: string,
    names: string[],
    manager?: EntityManager,
  ): Promise<void> {
    if (names.length === 0) return;

    const permRepo = manager
      ? manager.getRepository(PermissionEntity)
      : this.permissions.getRepository();
    const grantRepo = manager
      ? manager.getRepository(UserPermissionEntity)
      : this.userPermissions.getRepository();

    const perms = await permRepo.find({
      where: { name: In(names) },
    });

    for (const permission of perms) {
      const exists = manager
        ? await grantRepo.findOne({
            where: { userId, permissionId: permission.id },
          })
        : await this.userPermissions.get({
            userId,
            permissionId: permission.id,
          });
      if (!exists) {
        if (manager) {
          await grantRepo.save(
            grantRepo.create({ userId, permissionId: permission.id }),
          );
        } else {
          await this.userPermissions.create({
            userId,
            permissionId: permission.id,
          });
        }
      }
    }
  }

  async resolveForUser(user: {
    id: string;
    level: EUserLevel;
  }): Promise<string[]> {
    if (user.level === EUserLevel.PLATFORM_OWNER) {
      return [WILDCARD];
    }

    const rows = await this.userPermissions
      .getRepository()
      .createQueryBuilder("grant")
      .innerJoinAndSelect("grant.permission", "permission")
      .where("grant.userId = :userId", { userId: user.id })
      .andWhere("grant.deletedAt IS NULL")
      .getMany();

    return [...new Set(rows.map((row) => row.permission.name))];
  }
}
