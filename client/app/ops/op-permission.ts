import type { OpConfig } from "./create-ops";
import { canRunOpConfig } from "~/lib/permissions";
import { authKeys } from "~/features/auth/query-keys";
import type { IAuthUser } from "@moon-tailors/contracts";
import type { QueryClient } from "@tanstack/react-query";

export function readSessionUser(qc: QueryClient): IAuthUser | null {
  const user = qc.getQueryData<IAuthUser | null>(authKeys.session());
  return user ?? null;
}

export function isOpAllowed(
  qc: QueryClient,
  op: OpConfig | undefined,
): boolean {
  if (!op) return false;
  return canRunOpConfig(readSessionUser(qc), op);
}
