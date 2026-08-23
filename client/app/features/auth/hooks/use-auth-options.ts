import { useQuery } from "@tanstack/react-query";
import { EPasswordResetMode, type IAuthOptions } from "@template/contracts";
import { getAuthOptions } from "../api";
import { authKeys } from "../query-keys";

const DEFAULT_OPTIONS: IAuthOptions = {
  loginPasswordOtp: true,
  loginEmailOtp: true,
  passwordResetMode: EPasswordResetMode.OTP,
  apiKeyEnabled: true,
};

export function useAuthOptions() {
  return useQuery({
    queryKey: authKeys.options(),
    queryFn: getAuthOptions,
    staleTime: 5 * 60_000,
    placeholderData: DEFAULT_OPTIONS,
  });
}
