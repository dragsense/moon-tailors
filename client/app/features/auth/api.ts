import type {
  ICsrfTokenResponse,
  ILoginResponse,
  IAuthUser,
  TLoginData,
  IMessageResponse,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

class AuthService extends BaseService<IAuthUser, TLoginData> {
  constructor() {
    super("/auth");
  }

  login(body: TLoginData) {
    return this.post<ILoginResponse>(body, undefined, "/login");
  }

  me() {
    return this.getSingle(undefined, undefined, "/me");
  }

  logout() {
    return this.post<IMessageResponse>({}, undefined, "/logout");
  }

  fetchCsrfToken() {
    return this.getSingle<ICsrfTokenResponse>(undefined, undefined, "/csrf");
  }
}

export const authService = new AuthService();
