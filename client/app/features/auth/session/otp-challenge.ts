import type { IAuthChallengeResponse } from "@template/contracts";

const OTP_CHALLENGE_KEY = "auth_otp_challenge";

export type OtpChallengeState = Pick<
  IAuthChallengeResponse,
  "challengeId" | "purpose" | "expiresAt"
>;

export function saveOtpChallenge(
  challenge: IAuthChallengeResponse,
): OtpChallengeState {
  const state: OtpChallengeState = {
    challengeId: challenge.challengeId,
    purpose: challenge.purpose,
    expiresAt: challenge.expiresAt,
  };
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(OTP_CHALLENGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function readOtpChallenge(): OtpChallengeState | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(OTP_CHALLENGE_KEY);
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as OtpChallengeState;
    if (!state.challengeId || Date.now() >= Date.parse(state.expiresAt)) {
      clearOtpChallenge();
      return null;
    }
    return state;
  } catch {
    clearOtpChallenge();
    return null;
  }
}

export function clearOtpChallenge(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(OTP_CHALLENGE_KEY);
  }
}
