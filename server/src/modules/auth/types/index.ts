import type { ILoginResponse } from "@moon-tailors/contracts";
import type { EOtpPurpose } from "@moon-tailors/contracts";
import type { UserEntity } from "../../../common/base";

/** Issued session from TokenService (access response + refresh cookie value). */
export type AuthSession = {
  response: ILoginResponse;
  refreshToken: string;
  refreshTokenId: string;
};

/** Successful OTP verification before session issue / password reset. */
export type VerifiedOtpChallenge = {
  user: UserEntity;
  purpose: EOtpPurpose;
};
