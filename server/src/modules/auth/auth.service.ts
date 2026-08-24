import { Injectable, UnauthorizedException } from "@nestjs/common";
import {
  type IAuthUser,
} from "@moon-tailors/contracts";
import { UserEntity } from "../../common/base";
import { UsersService } from "../users/users.service";
import { TokenService } from "./services/tokens.service";
import type { AuthSession } from "./types";

@Injectable()
export class AuthService {

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {
  }

  /** Password login — issues a session immediately (no OTP). */
  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const user = await this.users.findByEmail(input.email);
    if (
      !user ||
      !user.isActive ||
      !(await this.users.verifyPassword(user, input.password))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.tokens.issueSession(user);
  }

  refresh(rawRefreshToken?: string) {
    return this.tokens.refresh(rawRefreshToken);
  }

  logout(rawRefreshToken?: string): Promise<void> {
    return this.tokens.revoke(rawRefreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }

  async getAuthenticatedUser(user: UserEntity): Promise<IAuthUser> {
    return this.tokens.toAuthUser(user);
  }
}
