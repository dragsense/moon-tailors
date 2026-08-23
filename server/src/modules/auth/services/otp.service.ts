import { randomInt } from "crypto";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EOtpPurpose,
  type IAuthChallengeResponse,
} from "@template/contracts";
import type { AuthConfig } from "../../../config";
import { UserEntity } from "../../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../../common/database";
import type { EntityQueryConfig } from "../../../common/query";
import { OtpChallengeEntity } from "../entities/otp-challenge.entity";
import { hashAuthSecret } from "../utils/auth-crypto";
import type { VerifiedOtpChallenge } from "../types";
import { AuthMailService } from "./auth-mail.service";

export const OTP_CHALLENGE_QUERY: EntityQueryConfig = {
  alias: "otpChallenge",
  restrictedFields: ["codeHash", "passwordHash"],
  sortable: ["createdAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class OtpService {
  private readonly authConfig: AuthConfig;
  private readonly entity: IBoundEntityService<OtpChallengeEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly authMail: AuthMailService,
    config: ConfigService,
  ) {
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
    this.entity = this.entityService.bind(
      OtpChallengeEntity,
      OTP_CHALLENGE_QUERY,
    );
  }

  async createChallenge(
    user: UserEntity,
    purpose: EOtpPurpose,
    options?: { email?: boolean },
  ): Promise<IAuthChallengeResponse> {
    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + this.authConfig.otpTtlMs);
    const challenge = await this.entity.create({
      userId: user.id,
      codeHash: hashAuthSecret(code),
      purpose,
      expiresAt,
      attempts: 0,
      consumedAt: null,
    });

    if (options?.email !== false) {
      // Don't block the challenge response if SMTP is slow/unreachable.
      void this.authMail.sendOtp(user, purpose, code);
    }

    return {
      challengeId: challenge.id,
      purpose,
      expiresAt: expiresAt.toISOString(),
      message: challengeMessage(purpose),
    };
  }

  async verifyChallenge(input: {
    challengeId: string;
    code: string;
    /** When set, purpose must match. */
    expectedPurpose?: EOtpPurpose | EOtpPurpose[];
  }): Promise<VerifiedOtpChallenge> {
    const challenge = await this.entity.get(input.challengeId, {
      _relations: ["user"],
    });
    if (!challenge) throw new BadRequestException("Invalid challenge");
    if (challenge.consumedAt) {
      throw new BadRequestException("OTP already used");
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("OTP expired");
    }
    if (challenge.attempts >= this.authConfig.otpMaxAttempts) {
      throw new BadRequestException("Too many OTP attempts");
    }

    if (input.expectedPurpose) {
      const allowed = Array.isArray(input.expectedPurpose)
        ? input.expectedPurpose
        : [input.expectedPurpose];
      if (!allowed.includes(challenge.purpose)) {
        throw new BadRequestException("OTP purpose mismatch");
      }
    }

    const attempts = challenge.attempts + 1;
    if (challenge.codeHash !== hashAuthSecret(input.code)) {
      await this.entity.update(challenge.id, { attempts });
      throw new BadRequestException("Invalid OTP code");
    }

    if (!challenge.user.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    await this.entity.update(challenge.id, {
      attempts,
      consumedAt: new Date(),
    });
    return { user: challenge.user, purpose: challenge.purpose };
  }
}

function challengeMessage(purpose: EOtpPurpose): string {
  switch (purpose) {
    case EOtpPurpose.SIGNUP:
      return "Verify your email with the OTP code";
    case EOtpPurpose.PASSWORD_RESET:
      return "Enter the OTP code to reset your password";
    case EOtpPurpose.EMAIL_LOGIN:
      return "Enter the OTP code sent to your email";
    default:
      return "Enter the OTP code to continue";
  }
}
