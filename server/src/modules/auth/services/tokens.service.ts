import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { IAuthUser } from "@moon-tailors/contracts";
import type { AuthConfig } from "../../../config";
import { PermissionsService } from "../../../common/base/permissions";
import { UserEntity } from "../../../common/base/users";
import type { AuthSession } from "../types";

@Injectable()
export class TokenService {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly jwt: JwtService,
    private readonly permissions: PermissionsService,
    config: ConfigService,
  ) {
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
  }

  async issueSession(user: UserEntity): Promise<AuthSession> {
    const authUser = await this.toAuthUser(user);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, level: user.level },
      { expiresIn: this.authConfig.accessTtlSeconds },
    );

    return {
      accessToken,
      response: {
        user: authUser,
        message: "Authenticated",
      },
    };
  }

  async toAuthUser(user: UserEntity): Promise<IAuthUser> {
    const permissions = await this.permissions.resolveForUser(user);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age ?? null,
      gender: user.gender ?? null,
      level: user.level,
      permissions,
    };
  }
}
