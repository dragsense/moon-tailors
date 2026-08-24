import type {
  ICsrfTokenResponse,
  ILoginResponse,
  IRefreshTokenResponse,
  IAuthUser,
  TLoginData,
} from "@moon-tailors/contracts";
import { BaseService, ensureCsrfToken } from "~/lib/api";

class AuthService extends BaseService<
  IAuthUser,
  Record<string, unknown>,
  Record<string, unknown>
> {
  constructor() {
    super("/auth");
  }

  login(body: TLoginData) {
    return this.post<ILoginResponse & ICsrfTokenResponse>(
      body as Record<string, unknown>,
      undefined,
      "/login",
    );
  }

  refreshSession() {
    return this.post<IRefreshTokenResponse & ICsrfTokenResponse>(
      {},
      undefined,
      "/refresh",
    );
  }

  me() {
    return this.getSingle<IAuthUser>(undefined, undefined, "/me");
  }

  async logout() {
    await ensureCsrfToken();
    return this.post<{ message: string }>({}, undefined, "/logout");
  }

  async logoutAll() {
    await ensureCsrfToken();
    return this.post<{ message: string }>({}, undefined, "/logout-all");
  }

  fetchCsrfToken() {
    return this.getSingle<ICsrfTokenResponse>(undefined, undefined, "/csrf");
  }
}

export const authService = new AuthService();

/** @deprecated Prefer `authService` — thin aliases for existing call sites. */
export const login = (body: TLoginData) => authService.login(body);
export const refreshSession = () => authService.refreshSession();
export const getMe = () => authService.me();
export const logout = () => authService.logout();
export const logoutAll = () => authService.logoutAll();
export const fetchCsrfToken = () => authService.fetchCsrfToken();

export function isLoginResponse(value: unknown): value is ILoginResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    "accessToken" in value
  );
}
