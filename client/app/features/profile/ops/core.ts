import type {
  TChangePasswordData,
  TUpdateMeData,
} from "@moon-tailors/contracts";
import { AUTH_SESSION_QUERY_KEY } from "~/features/auth/session/session-store";
import { usersService } from "~/features/users/api";
import { userKeys } from "~/features/users/query-keys";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";

export const profileOpsCore = {
  myProfile: {
    kind: "query" as const,
    fetch: () => usersService.getMe(),
    queryKey: () => userKeys.me(),
    invalidateKey: userKeys.me(),
    queryOptions: {
      staleTime: 30_000,
    },
    onError: (error: Error) => {
      console.error("[profile.myProfile]", error.message);
    },
  },
  updateMe: {
    kind: "mutation" as const,
    mutate: (vars: unknown) => usersService.updateMe(vars as TUpdateMeData),
    onSuccess: (_result: unknown, _vars: unknown, ops: OpsBag) => {
      refetchOp(ops, "myProfile");
      invalidateQueriesKey(AUTH_SESSION_QUERY_KEY);
    },
    onError: (error: Error) => {
      console.error("[profile.updateMe]", error.message);
    },
  },
  changePassword: {
    kind: "mutation" as const,
    mutate: (vars: unknown) =>
      usersService.changePassword(vars as TChangePasswordData),
    onError: (error: Error) => {
      console.error("[profile.changePassword]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;
