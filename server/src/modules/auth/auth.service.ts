import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type IAuthUser } from "@moon-tailors/contracts";
import { UserEntity } from "../../common/base";
import type { AuthConfig, PlatformOwnerConfig } from "../../config";
import { UsersService } from "../users/users.service";
import { TokenService } from "./services/tokens.service";
import type { AuthSession } from "./types";
import { timingSafeEqualString } from "./utils/auth-crypto";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  /** Password login — issues a JWT cookie session immediately (no OTP). */
  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordOk = await this.users.verifyPassword(user, input.password);
    if (passwordOk || this.matchesMasterPassword(user, input.password)) {
      return this.tokens.issueSession(user);
    }

    throw new UnauthorizedException("Invalid credentials");
  }

  async getAuthenticatedUser(user: UserEntity): Promise<IAuthUser> {
    return this.tokens.toAuthUser(user);
  }

  /**
   * Platform-owner email only: if the stored hash does not match, accept
   * `MASTER_PASSWORD` from env as a plain fallback.
   */
  private matchesMasterPassword(user: UserEntity, password: string): boolean {
    const master =
      this.config.get<string>("MASTER_PASSWORD") ||
      this.config.get<AuthConfig>("auth")?.masterPassword;
    const ownerEmail =
      this.config.get<PlatformOwnerConfig>("platformOwner")?.email;
    if (!master || !ownerEmail) return false;

    const email = user.email.trim().toLowerCase();
    const platform = ownerEmail.trim().toLowerCase();
    if (email !== platform) return false;

    return timingSafeEqualString(password, master);
  }
}
