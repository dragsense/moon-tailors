import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { EAuthMethod } from "@moon-tailors/contracts";
import type { AuthConfig } from "../../../config";
import { RequestContext } from "../../context";
import { BaseUsersService, UserEntity } from "../../base";
import { looksLikeJwt } from "../../../modules/auth/utils/auth-crypto";
import {
  AUTH_MODES_KEY,
  IS_PUBLIC_KEY,
} from "../decorators/auth.decorators";
import type { AuthenticatedRequest } from "../types";

type AccessPayload = {
  sub: string;
  email: string;
  level: number;
};

/**
 * Global auth guard — JWT from HttpOnly cookie or `Authorization: Bearer`.
 *
 * Credentials:
 * - Cookie `access_token` (browser session)
 * - `Authorization: Bearer <jwt>`
 *
 * Use `@JwtOnly()` / `@AuthModes(...)` to restrict.
 * Use `@Public()` to skip.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: BaseUsersService,
    config: ConfigService,
  ) {
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.method === "OPTIONS") return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const allowed =
      this.reflector.getAllAndOverride<EAuthMethod[]>(AUTH_MODES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [EAuthMethod.JWT];

    const credential = this.extractCredential(request);
    if (!credential) throw new UnauthorizedException("Unauthorized");

    if (credential.method !== EAuthMethod.JWT || !allowed.includes(EAuthMethod.JWT)) {
      throw new UnauthorizedException("JWT authentication required");
    }

    await this.authenticateJwt(request, credential.token);
    return true;
  }

  private extractCredential(
    request: AuthenticatedRequest,
  ): { method: EAuthMethod; token: string } | null {
    const [scheme, bearer] = request.headers.authorization?.split(" ") ?? [];
    if (scheme === "Bearer" && bearer && looksLikeJwt(bearer)) {
      return { method: EAuthMethod.JWT, token: bearer };
    }

    const cookieToken = this.readAccessCookie(request);
    if (cookieToken && looksLikeJwt(cookieToken)) {
      return { method: EAuthMethod.JWT, token: cookieToken };
    }

    return null;
  }

  private readAccessCookie(request: AuthenticatedRequest): string | undefined {
    const name = this.authConfig.accessCookieName;
    const parsed = request.cookies?.[name];
    if (typeof parsed === "string" && parsed) return parsed;

    const signed = (
      request as AuthenticatedRequest & {
        signedCookies?: Record<string, unknown>;
      }
    ).signedCookies?.[name];
    if (typeof signed === "string" && signed) return signed;

    const header = request.headers.cookie;
    if (!header) return undefined;
    for (const part of header.split(";")) {
      const cut = part.trim().indexOf("=");
      if (cut < 0) continue;
      const key = part.trim().slice(0, cut);
      if (key !== name) continue;
      try {
        return decodeURIComponent(part.trim().slice(cut + 1));
      } catch {
        return part.trim().slice(cut + 1);
      }
    }
    return undefined;
  }

  private async authenticateJwt(
    request: AuthenticatedRequest,
    token: string,
  ): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      const user = await this.users.findByIdForAuth(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException("Unauthorized");
      }
      this.attachUser(request, user);
    } catch {
      throw new UnauthorizedException("Unauthorized");
    }
  }

  private attachUser(request: AuthenticatedRequest, user: UserEntity) {
    request.user = user;
    request.authMethod = EAuthMethod.JWT;
    RequestContext.set("userId", user.id);
    RequestContext.set("userLevel", user.level);
  }
}

/** @deprecated Use AuthGuard — kept as alias for existing imports. */
export { AuthGuard as JwtAuthGuard };
