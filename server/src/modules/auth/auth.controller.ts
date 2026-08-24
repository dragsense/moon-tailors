import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type {
  ICsrfTokenResponse,
  ILoginResponse,
  IRefreshTokenResponse,
  TLoginData,
  IAuthUser,
} from "@moon-tailors/contracts";
import { loginSchema } from "@moon-tailors/contracts";
import type { Request, Response } from "express";
import {
  clearCsrfCookie,
  createCsrfToken,
  readCsrfCookie,
  setCsrfCookie,
} from "../../common/security";
import { ZodValidationPipe } from "../../common/validation";
import { CurrentUser, Public } from "../../common/auth";
import type { AppConfig, AuthConfig } from "../../config";
import type { UserEntity } from "../../common/base";
import { AuthService } from "./auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly appConfig: AppConfig;
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    this.appConfig = config.getOrThrow<AppConfig>("app");
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
  }

  @Get("csrf")
  @Public()
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response): ICsrfTokenResponse {
    const existing = readCsrfCookie(req);
    const token = existing ?? createCsrfToken();
    if (!existing) this.issueCsrf(res, token);
    return { csrfToken: token };
  }

  @Post("login")
  @Public()
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: TLoginData,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ILoginResponse & ICsrfTokenResponse> {
    const session = await this.authService.login(body);
    this.setRefreshCookie(res, session.refreshToken);
    const csrfToken = createCsrfToken();
    this.issueCsrf(res, csrfToken);
    return { ...session.response, csrfToken };
  }

  @Post("refresh")
  @Public()
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IRefreshTokenResponse & ICsrfTokenResponse> {
    const raw = req.cookies?.[this.authConfig.refreshCookieName] as
      | string
      | undefined;
    if (!raw) throw new UnauthorizedException("Missing refresh token");
    const { response, refreshToken } = await this.authService.refresh(raw);
    this.setRefreshCookie(res, refreshToken);
    const csrfToken = readCsrfCookie(req) ?? createCsrfToken();
    this.issueCsrf(res, csrfToken);
    return { ...response, csrfToken };
  }

  @Get("me")
  me(@CurrentUser() user: UserEntity): Promise<IAuthUser> {
    return this.authService.getAuthenticatedUser(user);
  }

  @Post("logout")
  @Public()
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(
      req.cookies?.[this.authConfig.refreshCookieName],
    );
    res.clearCookie(this.authConfig.refreshCookieName, {
      path: this.refreshCookiePath(),
    });
    clearCsrfCookie(res, {
      cookieSecret: this.appConfig.cookieSecret,
      secure: this.appConfig.environment === "production",
      publicServerPath: this.appConfig.publicServerPath,
    });
    return { message: "Logged out" };
  }

  @Post("logout-all")
  @HttpCode(200)
  async logoutAll(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id);
    res.clearCookie(this.authConfig.refreshCookieName, {
      path: this.refreshCookiePath(),
    });
    clearCsrfCookie(res, {
      cookieSecret: this.appConfig.cookieSecret,
      secure: this.appConfig.environment === "production",
      publicServerPath: this.appConfig.publicServerPath,
    });
    return { message: "Logged out from all devices" };
  }

  private refreshCookiePath(): string {
    return `${this.appConfig.publicServerPath}/api/auth`;
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(this.authConfig.refreshCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.appConfig.environment === "production",
      path: this.refreshCookiePath(),
      maxAge: this.authConfig.refreshTtlSeconds * 1000,
    });
  }

  private issueCsrf(res: Response, token: string) {
    setCsrfCookie(res, token, {
      cookieSecret: this.appConfig.cookieSecret,
      secure: this.appConfig.environment === "production",
      publicServerPath: this.appConfig.publicServerPath,
    });
  }
}
