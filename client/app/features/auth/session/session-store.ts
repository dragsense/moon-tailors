import type { IAuthUser, ILoginResponse } from "@moon-tailors/contracts";
import { setApiAccessToken, setCsrfToken } from "~/lib/api";
import { queryClient } from "~/lib/query";
import { getMe } from "../api";
import { authKeys, AUTH_SESSION_QUERY_KEY } from "../query-keys";

export { AUTH_SESSION_QUERY_KEY };

export type AppSession = {
  user: IAuthUser;
};

export function sessionFromLoginResponse(res: ILoginResponse): AppSession {
  return { user: res.user };
}

/**
 * Resolve to `null` for guests so the query keeps a stable "signed out" state
 * instead of erroring (CORS/network/5xx) and leaving the UI stuck.
 */
export async function fetchSessionUser(): Promise<IAuthUser | null> {
  try {
    return await getMe();
  } catch {
    return null;
  }
}

/** Keep access tokens in memory; the server owns the HttpOnly refresh cookie. */
export function writeSession(response: ILoginResponse): AppSession {
  const session = sessionFromLoginResponse(response);
  setApiAccessToken(response.accessToken.token);
  const csrf = (response as ILoginResponse & { csrfToken?: string }).csrfToken;
  if (typeof csrf === "string") setCsrfToken(csrf);
  queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, response.user);
  return session;
}

/** Sync session after silent refresh without forcing a remount. */
export function applyRefreshedSession(response: ILoginResponse): void {
  setApiAccessToken(response.accessToken.token);
  const csrf = (response as ILoginResponse & { csrfToken?: string }).csrfToken;
  if (typeof csrf === "string") setCsrfToken(csrf);
  queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, response.user);
}

export function clearSession() {
  setApiAccessToken(null);
  setCsrfToken(null);
  queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== authKeys.all[0],
  });
}
