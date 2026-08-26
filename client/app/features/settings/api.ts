import type {
  IUserSettingsResponse,
  TSaveUserSettingsData,
  TSaveUserSettingsResponse,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class SettingsService extends BaseService<
  IUserSettingsResponse,
  TSaveUserSettingsData,
  TSaveUserSettingsData
> {
  constructor() {
    super("/user-settings");
  }

  getMe() {
    return this.getSingle<IUserSettingsResponse>(undefined, undefined, "/me");
  }

  updateMe(body: TSaveUserSettingsData) {
    return this.put<TSaveUserSettingsResponse>()(body, undefined, "/me");
  }
}

export const settingsService = new SettingsService();
/** @deprecated use settingsService */
export const userSettingsService = settingsService;
