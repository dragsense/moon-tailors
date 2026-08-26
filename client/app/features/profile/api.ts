import type {
  IMeUser,
  IMessageResponse,
  TChangePasswordData,
  TUpdateMeData,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

/** Current-user profile under `/users/me`. */
class ProfileService extends BaseService<IMeUser, TUpdateMeData, TUpdateMeData> {
  constructor() {
    super("/users");
  }

  getMe() {
    return this.getSingle<IMeUser>(undefined, undefined, "/me");
  }

  updateMe(body: TUpdateMeData) {
    return this.patch<IMeUser>(undefined)(body, undefined, "/me");
  }

  changePassword(body: TChangePasswordData) {
    return this.patch<IMessageResponse>(undefined)(
      body as unknown as TUpdateMeData,
      undefined,
      "/me/password",
    );
  }
}

export const profileService = new ProfileService();
