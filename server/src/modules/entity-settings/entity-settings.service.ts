import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IEntitySettingsResponse,
  TDeleteEntitySettingResponse,
  TSaveEntitySettingsData,
  TSaveEntitySettingsResponse,
} from "@moon-tailors/contracts";
import { EPermissionAction, EResource, EUserLevel } from "@moon-tailors/contracts";
import {
  BaseSettingsService,
  PermissionsService,
  type UserEntity,
} from "../../common/base";

const ME_ALIAS = "me";

@Injectable()
export class EntitySettingsService implements OnModuleInit {
  constructor(
    private readonly settings: BaseSettingsService,
    private readonly permissions: PermissionsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.SETTINGS);
  }

  async getSettings(
    user: UserEntity,
    entityIdParam: string,
  ): Promise<IEntitySettingsResponse> {
    const entityId = this.resolveEntityId(user, entityIdParam);
    this.assertCanAccess(user, entityId);

    return {
      entityId,
      settings: await this.settings.getSettings(entityId),
    };
  }

  async saveSettings(
    user: UserEntity,
    entityIdParam: string,
    body: TSaveEntitySettingsData,
  ): Promise<TSaveEntitySettingsResponse> {
    const entityId = this.resolveEntityId(user, entityIdParam);
    this.assertCanAccess(user, entityId);

    await this.settings.saveSettings(entityId, body);

    return {
      message: "Settings saved",
      entityId,
      settings: await this.settings.getSettings(entityId),
    };
  }

  async deleteSetting(
    user: UserEntity,
    entityIdParam: string,
    key: string,
  ): Promise<TDeleteEntitySettingResponse> {
    const entityId = this.resolveEntityId(user, entityIdParam);
    this.assertCanAccess(user, entityId);

    const deleted = await this.settings.deleteSetting(entityId, key);
    if (!deleted) throw new NotFoundException("Setting not found");

    return {
      message: "Setting deleted",
      entityId,
      key,
    };
  }

  /** Any feature module can inject BaseSettingsService directly for custom entity IDs. */
  resolveEntityId(user: UserEntity, entityIdParam: string): string {
    if (entityIdParam === ME_ALIAS) return user.id;
    return entityIdParam;
  }

  private assertCanAccess(user: UserEntity, entityId: string): void {
    if (entityId === user.id) return;
    if (user.level <= EUserLevel.ADMIN) return;
    throw new ForbiddenException("Cannot access settings for this entity");
  }
}
