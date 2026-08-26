/**
 * Auth ops catalog — login (page). Session lives in React Query only
 * (`authKeys.session` via useSession hooks), not mirrored through ops.
 */
import type { IAuthUser, ILoginResponse, TLoginData } from "@moon-tailors/contracts";
import { setCsrfToken } from "~/lib/api";
import { queryClient } from "~/lib/query";
import { invalidateQueriesKey, type OpConfig } from "~/ops";
import { authService } from "../api";
import { LoginForm } from "../form/login-form";
import { authKeys } from "../query-keys";

export type AppSession = {
  user: IAuthUser;
};

/** GET /auth/me — guests resolve to null (no throw). */
export async function fetchSessionUser(): Promise<IAuthUser | null> {
  try {
    return await authService.me();
  } catch {
    return null;
  }
}

/** Wipe CSRF + session cache + non-auth queries (401 / logout). */
export function clearAuthCache() {
  setCsrfToken(null);
  queryClient.setQueryData(authKeys.session(), null);
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== authKeys.all[0],
  });
}

function applyLoginSession(response: ILoginResponse) {
  queryClient.setQueryData(authKeys.session(), response.user);
}

export const authOpsCore = {
  login: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => authService.login(vars as TLoginData),
    component: LoginForm,
    auto: false,
    onSuccess: (result: unknown) => {
      applyLoginSession(result as ILoginResponse);
    },
    onError: (error: Error) => {
      console.error("[auth.login]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type AuthOpsCore = typeof authOpsCore;
export type AuthOpName = keyof AuthOpsCore;

/** Invalidate the shared session query (e.g. after profile update). */
export function invalidateAuthSession() {
  invalidateQueriesKey(authKeys.session());
}
