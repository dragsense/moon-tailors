import type {
  IUserSettingsResponse,
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
}

export const userSettingsService = new UserSettingsService();
