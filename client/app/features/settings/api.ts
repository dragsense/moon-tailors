import type {
  IUserSettingsResponse,
  TDeleteUserSettingResponse,
  TSaveUserSettingsData,
  TSaveUserSettingsResponse,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class UserSettingsService extends BaseService<
  IUserSettingsResponse,
  TSaveUserSettingsData,
  TSaveUserSettingsData
> {
  constructor() {
    super("/user-settings");
  }

  getMine() {
    return this.getSingle<IUserSettingsResponse>(
      undefined,
      undefined,
      "/me",
    );
  }

  saveMine(body: TSaveUserSettingsData) {
    return this.put<TSaveUserSettingsResponse>()(body, undefined, "/me");
  }

  getForUser(userId: string) {
    return this.getSingle<IUserSettingsResponse>(userId);
  }

  saveForUser(userId: string, body: TSaveUserSettingsData) {
    return this.put<TSaveUserSettingsResponse>(userId)(body);
  }

  deleteKey(userId: string, key: string) {
    return this.delete<TDeleteUserSettingResponse>(
      key,
      undefined,
      `/${userId}/keys`,
    );
  }
}

export const userSettingsService = new UserSettingsService();
