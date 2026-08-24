import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
} from "@nestjs/common";
import type {
  IUserSettingsResponse,
  TSaveUserSettingsData,
  TSaveUserSettingsResponse,
} from "@moon-tailors/contracts";
import {  EResource } from "@moon-tailors/contracts";
import {
  BaseSettingsService,
  PermissionsService,
  type UserEntity,
} from "../../common/base";

const ME_ALIAS = "me";

@Injectable()
export class UserSettingsService implements OnModuleInit {
  constructor(
    private readonly settings: BaseSettingsService,
    private readonly permissions: PermissionsService,
  ) {}

  async onModuleInit() {
    await this.permissions.ensureResource(EResource.SETTINGS);
  }

  async getSettings(
    user: UserEntity,
    userIdParam: string,
  ): Promise<IUserSettingsResponse> {
    const userId = this.resolveUserId(user, userIdParam);
    this.assertCanAccess(user, userId);

    return {
      userId,
      settings: await this.settings.getSettings(userId),
    };
  }

  async saveSettings(
    user: UserEntity,
    userIdParam: string,
    body: TSaveUserSettingsData,
  ): Promise<TSaveUserSettingsResponse> {
    const userId = this.resolveUserId(user, userIdParam);
    this.assertCanAccess(user, userId);

    await this.settings.saveSettings(userId, body);

    return {
      message: "Settings saved",
      userId,
      settings: await this.settings.getSettings(userId),
    };
  }

  /** Any feature module can inject BaseSettingsService directly for custom entity IDs. */
  resolveUserId(user: UserEntity, userIdParam: string): string {
    if (userIdParam === ME_ALIAS) return user.id;
    return userIdParam;
  }

  private assertCanAccess(user: UserEntity, userId: string): void {
    if (userId === user.id) return;
    throw new ForbiddenException("Cannot access settings for this user");
  }
}
