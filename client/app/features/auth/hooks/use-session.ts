import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { PUBLIC_ROUTES } from "~/config";
import { useApiQueryKeyed } from "~/hooks";
import { disconnectSocket } from "~/lib/socket";
import { logout as logoutRequest } from "../api";
import {
  AUTH_SESSION_QUERY_KEY,
  clearSession,
  fetchSessionUser,
  type AppSession,
} from "../session/session-store";

export function useSessionState() {
  const query = useApiQueryKeyed(
    AUTH_SESSION_QUERY_KEY,
    fetchSessionUser,
    {
      retry: false,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  return {
    session: query.data ? ({ user: query.data } satisfies AppSession) : null,
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
      await logoutRequest();
    } finally {
      disconnectSocket();
      clearSession();
      setIsLoading(false);
      navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
    }
  }, [navigate]);

  return { logout, isLoading };
}
