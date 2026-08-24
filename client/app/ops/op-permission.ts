import type { OpConfig } from "./create-ops";
import { canRunOpConfig } from "~/lib/permissions";
import { AUTH_SESSION_QUERY_KEY } from "~/features/auth/session";
import type { IAuthUser } from "@moon-tailors/contracts";
import type { QueryClient } from "@tanstack/react-query";

export function readSessionUser(qc: QueryClient): IAuthUser | null {
  const user = qc.getQueryData<IAuthUser | null>(AUTH_SESSION_QUERY_KEY);
  return user ?? null;
}

export function isOpAllowed(
  qc: QueryClient,
  op: OpConfig | undefined,
): boolean {
  if (!op) return false;
  return canRunOpConfig(readSessionUser(qc), op);
}
