import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import type { IAuthUser } from "@moon-tailors/contracts";
import { PUBLIC_ROUTES } from "~/config";
import { useApiQueryKeyed } from "~/hooks";
import { disconnectSocket } from "~/lib/socket";
import { authService } from "../api";
import {
  clearAuthCache,
  fetchSessionUser,
  type AppSession,
} from "../ops/core";
import { authKeys } from "../query-keys";

/** One source of truth: React Query cache at authKeys.session(). */
export function useSessionState() {
  const query = useApiQueryKeyed(authKeys.session(), fetchSessionUser, {
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const user = query.data as IAuthUser | null | undefined;

  return {
    session: user ? ({ user } satisfies AppSession) : null,
    isLoading: query.isPending,
    isError: query.isError,
  };
}

export function useSession(): AppSession | null {
  return useSessionState().session;
}

export function useLogout() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      /* still clear locally */
    } finally {
      disconnectSocket();
      clearAuthCache();
      setIsLoading(false);
      navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
    }
  }, [navigate]);

  return { logout, isLoading };
}
