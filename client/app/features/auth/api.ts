import type {
  IAuthChallengeResponse,
  IAuthOptions,
  ICsrfTokenResponse,
  ILoginResponse,
  IRefreshTokenResponse,
  IAuthUser,
  TAuthMessageResponse,
  TEmailLoginData,
  TForgotPasswordData,
  TLoginData,
  TResetPasswordWithOtpData,
  TResetPasswordWithTokenData,
  TSignupData,
  TVerifyOtpData,
} from "@template/contracts";
import { BaseService, ensureCsrfToken } from "~/lib/api";

class AuthService extends BaseService<
  IAuthUser,
  Record<string, unknown>,
  Record<string, unknown>
> {
  constructor() {
    super("/auth");
  }

  options() {
    return this.getSingle<IAuthOptions>(undefined, undefined, "/options");
  }

  login(body: TLoginData) {
    return this.post<
      IAuthChallengeResponse | (ILoginResponse & ICsrfTokenResponse)
    >(body as Record<string, unknown>, undefined, "/login");
  }

  emailLogin(body: TEmailLoginData) {
    return this.post<IAuthChallengeResponse | TAuthMessageResponse>(
      body as Record<string, unknown>,
      undefined,
      "/email-login",
    );
  }

  forgotPassword(body: TForgotPasswordData) {
    return this.post<IAuthChallengeResponse | TAuthMessageResponse>(
      body as Record<string, unknown>,
      undefined,
      "/forgot-password",
    );
  }

  resetPasswordWithOtp(body: TResetPasswordWithOtpData) {
    return this.post<TAuthMessageResponse>(
      body as Record<string, unknown>,
      undefined,
      "/reset-password",
    );
  }

  resetPasswordWithToken(body: TResetPasswordWithTokenData) {
    return this.post<TAuthMessageResponse>(
      body as Record<string, unknown>,
      undefined,
      "/reset-password",
    );
  }

  signup(body: TSignupData) {
    return this.post<IAuthChallengeResponse>(
      body as Record<string, unknown>,
      undefined,
      "/signup",
    );
  }

  verifyOtp(body: TVerifyOtpData) {
    return this.post<ILoginResponse & ICsrfTokenResponse>(
      body as Record<string, unknown>,
      undefined,
      "/verify-otp",
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
export const getAuthOptions = () => authService.options();
export const login = (body: TLoginData) => authService.login(body);
export const emailLogin = (body: TEmailLoginData) =>
  authService.emailLogin(body);
export const forgotPassword = (body: TForgotPasswordData) =>
  authService.forgotPassword(body);
export const resetPasswordWithOtp = (body: TResetPasswordWithOtpData) =>
  authService.resetPasswordWithOtp(body);
export const resetPasswordWithToken = (body: TResetPasswordWithTokenData) =>
  authService.resetPasswordWithToken(body);
export const signup = (body: TSignupData) => authService.signup(body);
export const verifyOtp = (body: TVerifyOtpData) => authService.verifyOtp(body);
export const refreshSession = () => authService.refreshSession();
export const getMe = () => authService.me();
export const logout = () => authService.logout();
export const logoutAll = () => authService.logoutAll();
export const fetchCsrfToken = () => authService.fetchCsrfToken();

export function isAuthChallenge(
  value: unknown,
): value is IAuthChallengeResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "challengeId" in value &&
    typeof (value as IAuthChallengeResponse).challengeId === "string"
  );
}

export function isLoginResponse(value: unknown): value is ILoginResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    "accessToken" in value
  );
}
