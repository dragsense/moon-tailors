import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type {
  ICsrfTokenResponse,
  ILoginResponse,
  TLoginData,
  IAuthUser,
} from "@moon-tailors/contracts";
import { loginSchema } from "@moon-tailors/contracts";
import type { CookieOptions, Request, Response } from "express";
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
  csrf(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): ICsrfTokenResponse {
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
    this.setAccessCookie(res, session.accessToken);
    const csrfToken = createCsrfToken();
    this.issueCsrf(res, csrfToken);
    return { ...session.response, csrfToken };
  }

  @Get("me")
  me(@CurrentUser() user: UserEntity): Promise<IAuthUser> {
    return this.authService.getAuthenticatedUser(user);
  }

  @Post("logout")
  @Public()
  @HttpCode(200)
  logout(
    @Res({ passthrough: true }) res: Response,
  ): { message: string } {
    this.clearAccessCookie(res);
    clearCsrfCookie(res, {
      cookieSecret: this.appConfig.cookieSecret,
      secure: this.appConfig.environment === "production",
      publicServerPath: this.appConfig.publicServerPath,
    });
    return { message: "Logged out" };
  }

  private cookiePath(): string {
    return `${this.appConfig.publicServerPath}/api`;
  }

  private cookieBase(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: this.appConfig.environment === "production",
      path: this.cookiePath(),
    };
  }

  private setAccessCookie(res: Response, token: string) {
    res.cookie(this.authConfig.accessCookieName, token, {
      ...this.cookieBase(),
      maxAge: this.authConfig.accessTtlSeconds * 1000,
    });
  }

  private clearAccessCookie(res: Response) {
    res.clearCookie(this.authConfig.accessCookieName, this.cookieBase());
  }

  private issueCsrf(res: Response, token: string) {
    setCsrfCookie(res, token, {
      cookieSecret: this.appConfig.cookieSecret,
      secure: this.appConfig.environment === "production",
      publicServerPath: this.appConfig.publicServerPath,
    });
  }
}
