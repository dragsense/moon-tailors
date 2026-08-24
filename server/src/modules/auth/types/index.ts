import type { ILoginResponse } from "@moon-tailors/contracts";
import type { EOtpPurpose } from "@moon-tailors/contracts";
import type { UserEntity } from "../../../common/base";

/** Issued session from TokenService (JSON body + JWT cookie value). */
export type AuthSession = {
  response: ILoginResponse;
  accessToken: string;
};

/** Successful OTP verification before session issue / password reset. */
export type VerifiedOtpChallenge = {
  user: UserEntity;
  purpose: EOtpPurpose;
};
