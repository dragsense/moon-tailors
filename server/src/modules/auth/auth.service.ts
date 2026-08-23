import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  EOtpPurpose,
  EPasswordResetMode,
  type IAuthOptions,
  type IAuthUser,
  type TAuthMessageResponse,
  type TSignupData,
} from "@template/contracts";
import { UserEntity } from "../../common/base";
import type { AuthConfig } from "../../config";
import { UsersService } from "../users/users.service";
import type { AuthSession } from "./types";
import { AuthMailService } from "./services/auth-mail.service";
import { OtpService } from "./services/otp.service";
import { TokenService } from "./services/tokens.service";
import { TrustedDeviceService } from "./services/trusted-device.service";

const SESSION_OTP_PURPOSES: EOtpPurpose[] = [
  EOtpPurpose.SIGNUP,
  EOtpPurpose.LOGIN,
  EOtpPurpose.EMAIL_LOGIN,
];

const FORGOT_ACK: TAuthMessageResponse = {
  message:
    "If an account exists for that email, password reset instructions were sent.",
};

@Injectable()
export class AuthService {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly authMail: AuthMailService,
    private readonly trustedDevices: TrustedDeviceService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
  }

  getOptions(): IAuthOptions {
    return {
      loginPasswordOtp: this.authConfig.loginPasswordOtp,
      loginEmailOtp: this.authConfig.loginEmailOtp,
      passwordResetMode:
        this.authConfig.passwordResetMode === "link"
          ? EPasswordResetMode.LINK
          : EPasswordResetMode.OTP,
      apiKeyEnabled: this.authConfig.apiKeyEnabled,
    };
  }

  /** Account create lives in UsersService; auth only starts the OTP challenge. */
  async signup(input: TSignupData) {
    const user = await this.users.signup(input);
    return this.otp.createChallenge(user, EOtpPurpose.SIGNUP);
  }

  /**
   * Password login — OTP when `AUTH_LOGIN_PASSWORD_OTP=true`, unless this
   * `deviceId` was remembered. Otherwise issues a session immediately.
   */
  async login(input: {
    email: string;
    password: string;
    deviceId?: string;
  }): Promise<
    | {
        kind: "challenge";
        challenge: Awaited<ReturnType<OtpService["createChallenge"]>>;
      }
    | { kind: "session"; session: AuthSession }
  > {
    const user = await this.users.findByEmail(input.email);
    if (
      !user ||
      !user.isActive ||
      !(await this.users.verifyPassword(user, input.password))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (this.authConfig.loginPasswordOtp) {
      const trusted = await this.trustedDevices.isTrusted(
        user.id,
        input.deviceId,
      );
      if (!trusted) {
        return {
          kind: "challenge",
          challenge: await this.otp.createChallenge(user, EOtpPurpose.LOGIN),
        };
      }
    }
    return { kind: "session", session: await this.tokens.issueSession(user) };
  }

  /**
   * Passwordless email → OTP (requires `AUTH_LOGIN_EMAIL_OTP=true`).
   * Missing/inactive users get a generic message (no challenge).
   */
  async emailLogin(input: { email: string; deviceId?: string }) {
    if (!this.authConfig.loginEmailOtp) {
      throw new BadRequestException("Email OTP login is disabled");
    }
    const user = await this.users.findByEmail(input.email);
    if (!user || !user.isActive) {
      return {
        message: "If an account exists for that email, an OTP was sent.",
      } satisfies TAuthMessageResponse;
    }
    return this.otp.createChallenge(user, EOtpPurpose.EMAIL_LOGIN);
  }

  /**
   * Forgot password — `AUTH_PASSWORD_RESET_MODE=otp|link`.
   * OTP mode returns a challenge when the account exists (for the reset form).
   */
  async forgotPassword(input: { email: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user || !user.isActive) return FORGOT_ACK;

    if (this.authConfig.passwordResetMode === "link") {
      const token = await this.jwt.signAsync(
        { sub: user.id, purpose: "password_reset" },
        { expiresIn: this.authConfig.passwordResetLinkTtlSec },
      );
      await this.authMail.sendPasswordResetLink(user, token);
      return FORGOT_ACK;
    }

    return this.otp.createChallenge(user, EOtpPurpose.PASSWORD_RESET);
  }

  async resetPasswordWithOtp(input: {
    challengeId: string;
    code: string;
    password: string;
  }): Promise<TAuthMessageResponse> {
    if (this.authConfig.passwordResetMode !== "otp") {
      throw new BadRequestException("Password reset uses a link, not OTP");
    }
    const { user } = await this.otp.verifyChallenge({
      challengeId: input.challengeId,
      code: input.code,
      expectedPurpose: EOtpPurpose.PASSWORD_RESET,
    });
    await this.users.updatePassword(user.id, input.password);
    return { message: "Password updated. You can sign in now." };
  }

  async resetPasswordWithToken(input: {
    token: string;
    password: string;
  }): Promise<TAuthMessageResponse> {
    if (this.authConfig.passwordResetMode !== "link") {
      throw new BadRequestException("Password reset uses OTP, not a link");
    }
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(input.token);
    } catch {
      throw new BadRequestException("Invalid or expired reset link");
    }
    if (payload.purpose !== "password_reset" || !payload.sub) {
      throw new BadRequestException("Invalid reset token");
    }
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new BadRequestException("Invalid reset token");
    }
    await this.users.updatePassword(user.id, input.password);
    return { message: "Password updated. You can sign in now." };
  }

  async verifyOtp(input: {
    challengeId: string;
    code: string;
    deviceId?: string;
    rememberDevice?: boolean;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const challenge = await this.otp.verifyChallenge({
      challengeId: input.challengeId,
      code: input.code,
      expectedPurpose: SESSION_OTP_PURPOSES,
    });
    let { user } = challenge;
    if (challenge.purpose === EOtpPurpose.SIGNUP) {
      user = await this.users.markEmailVerified(user.id);
    }
    if (input.rememberDevice && input.deviceId) {
      await this.trustedDevices.remember(user.id, input.deviceId, {
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      });
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
    await this.trustedDevices.removeAllForUser(userId);
  }

  async getAuthenticatedUser(user: UserEntity): Promise<IAuthUser> {
    return this.tokens.toAuthUser(user);
  }
}
