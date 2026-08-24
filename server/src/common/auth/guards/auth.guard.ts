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
import { ApiKeysService } from "../../../modules/api-keys/api-keys.service";
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
 * Global auth guard — accepts JWT Bearer **or** user API key.
 *
 * Credentials:
 * - `Authorization: Bearer <jwt>`
 * - `Authorization: Bearer tk_…` (API key prefix)
 * - `X-Api-Key: tk_…`
 *
 * Use `@JwtOnly()` / `@ApiKeyOnly()` / `@AuthModes(...)` to restrict.
 * Use `@Public()` to skip.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: BaseUsersService,
    private readonly apiKeys: ApiKeysService,
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
      ]) ?? this.defaultModes();

    const credential = this.extractCredential(request);
    if (!credential) throw new UnauthorizedException("Unauthorized");

    if (credential.method === EAuthMethod.JWT) {
      if (!allowed.includes(EAuthMethod.JWT)) {
        throw new UnauthorizedException("JWT authentication required");
      }
      await this.authenticateJwt(request, credential.token);
      return true;
    }

    if (!allowed.includes(EAuthMethod.API_KEY)) {
      throw new UnauthorizedException("API key authentication is not allowed here");
    }
    await this.authenticateApiKey(request, credential.token);
    return true;
  }

  private defaultModes(): EAuthMethod[] {
    return this.authConfig.apiKeyEnabled
      ? [EAuthMethod.JWT, EAuthMethod.API_KEY]
      : [EAuthMethod.JWT];
  }

  private extractCredential(
    request: AuthenticatedRequest,
  ): { method: EAuthMethod; token: string } | null {
    const headerKey = request.headers["x-api-key"]?.trim();
    if (headerKey) {
      return { method: EAuthMethod.API_KEY, token: headerKey };
    }

    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) return null;

    if (looksLikeJwt(token)) {
      return { method: EAuthMethod.JWT, token };
    }

    const prefix = this.authConfig.apiKeyPrefix;
    const normalized = prefix.endsWith("_") ? prefix : `${prefix}_`;
    if (this.authConfig.apiKeyEnabled && token.startsWith(normalized)) {
      return { method: EAuthMethod.API_KEY, token };
    }

    // Ambiguous Bearer — try JWT first (legacy), else API key if enabled
    if (looksLikeJwt(token)) {
      return { method: EAuthMethod.JWT, token };
    }
    if (this.authConfig.apiKeyEnabled) {
      return { method: EAuthMethod.API_KEY, token };
    }
    return { method: EAuthMethod.JWT, token };
  }

  private async authenticateJwt(
    request: AuthenticatedRequest,
    token: string,
  ): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      const user = await this.users.findById(payload.sub);
      if (!user) throw new UnauthorizedException("Unauthorized");
      this.attachUser(request, user, EAuthMethod.JWT);
    } catch {
      throw new UnauthorizedException("Unauthorized");
    }
  }

  private async authenticateApiKey(
    request: AuthenticatedRequest,
    raw: string,
  ): Promise<void> {
    const resolved = await this.apiKeys.resolveRawKey(raw);
    if (!resolved) throw new UnauthorizedException("Unauthorized");

    const user =
      resolved.entity.user ?? (await this.users.findById(resolved.userId));
    if (!user) throw new UnauthorizedException("Unauthorized");

    this.attachUser(request, user, EAuthMethod.API_KEY, {
      apiKeyId: resolved.entity.id,
      apiKeyScopes: resolved.scopes,
    });
  }

  private attachUser(
    request: AuthenticatedRequest,
    user: UserEntity,
    method: EAuthMethod,
    extra?: { apiKeyId?: string; apiKeyScopes?: string[] | null },
  ) {
    request.user = user;
    request.authMethod = method;
    request.apiKeyId = extra?.apiKeyId;
    request.apiKeyScopes = extra?.apiKeyScopes ?? null;
    RequestContext.set("userId", user.id);
    RequestContext.set("userLevel", user.level);
  }
}

/** @deprecated Use AuthGuard — kept as alias for existing imports. */
export { AuthGuard as JwtAuthGuard };
