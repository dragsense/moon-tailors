import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { IAuthUser } from "@template/contracts";
import { IsNull } from "typeorm";
import type { AuthConfig } from "../../../config";
import { PermissionsService, UserEntity } from "../../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../../common/database";
import type { EntityQueryConfig } from "../../../common/query";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import {
  generateRefreshToken,
  hashAuthSecret,
} from "../utils/auth-crypto";
import type { AuthSession } from "../types";

export const REFRESH_TOKEN_QUERY: EntityQueryConfig = {
  alias: "refreshToken",
  restrictedFields: ["tokenHash", "passwordHash"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class TokenService {
  private readonly authConfig: AuthConfig;
  private readonly entity: IBoundEntityService<RefreshTokenEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly jwt: JwtService,
    private readonly permissions: PermissionsService,
    config: ConfigService,
  ) {
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
    this.entity = this.entityService.bind(
      RefreshTokenEntity,
      REFRESH_TOKEN_QUERY,
    );
  }

  async issueSession(user: UserEntity): Promise<AuthSession> {
    const authUser = await this.toAuthUser(user);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, level: user.level },
      { expiresIn: this.authConfig.accessTtlSeconds },
    );

    const refreshToken = generateRefreshToken();
    const storedRefreshToken = await this.entity.create({
      userId: user.id,
      tokenHash: hashAuthSecret(refreshToken),
      expiresAt: new Date(
        Date.now() + this.authConfig.refreshTtlSeconds * 1000,
      ),
      revokedAt: null,
      replacedById: null,
    });

    return {
      refreshToken,
      refreshTokenId: storedRefreshToken.id,
      response: {
        user: authUser,
        accessToken: {
          token: accessToken,
          expiresIn: this.authConfig.accessTtlSeconds,
        },
        message: "Authenticated",
      },
    };
  }

  async refresh(rawRefreshToken?: string): Promise<AuthSession> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const stored = await this.entity.get(
      { tokenHash: hashAuthSecret(rawRefreshToken) },
      { _relations: ["user"] },
    );
    if (!stored || !stored.user?.isActive || !stored.isValid()) {
      if (stored) {
        await this.entity.update(stored.id, {
          revokedAt: stored.revokedAt ?? new Date(),
        });
      }
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Atomic compare-and-set — reject reuse races.
    const rotation = await this.entity.getRepository().update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (rotation.affected !== 1) {
      throw new UnauthorizedException("Refresh token already used");
    }

    const session = await this.issueSession(stored.user);
    await this.entity.update(stored.id, {
      replacedById: session.refreshTokenId,
    });
    return session;
  }

  async revoke(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const stored = await this.entity.get({
      tokenHash: hashAuthSecret(rawRefreshToken),
    });
    if (!stored || stored.revokedAt) return;
    await this.entity.update(stored.id, { revokedAt: new Date() });
  }

  /** Revoke every refresh token for a user (logout-all devices). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.entity.getRepository().update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async toAuthUser(user: UserEntity): Promise<IAuthUser> {
    const permissions = await this.permissions.resolveForUser(user.id);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      level: user.level,
      permissions,
    };
  }
}
