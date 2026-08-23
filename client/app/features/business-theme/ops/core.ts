import {
  EPermissionAction,
  EResource,
  type IBusinessTheme,
  type TUpsertBusinessThemeData,
} from "@template/contracts";
import type { OpsBag } from "~/ops";
import { refetchOp } from "~/ops";
import { businessThemeService } from "../api";

export const businessThemeKeys = {
  current: ["business-theme", "current"] as const,
  my: ["business-theme", "my"] as const,
};

export type SaveBusinessThemeVars = {
  data: TUpsertBusinessThemeData;
  files?: {
    logoLight?: File | null;
    logoDark?: File | null;
    favicon?: File | null;
  };
};

export const businessThemeOpsCore = {
  currentTheme: {
    kind: "query" as const,
    fetch: () => businessThemeService.getCurrent(),
    queryKey: () => businessThemeKeys.current,
    invalidateKey: businessThemeKeys.current,
    queryOptions: {
      staleTime: 5 * 60_000,
      retry: false,
    },
  },
  myTheme: {
    kind: "query" as const,
    permission: {
      resource: EResource.BUSINESSES,
      action: EPermissionAction.READ,
    },
    fetch: () => businessThemeService.getMyTheme(),
    queryKey: () => businessThemeKeys.my,
    invalidateKey: businessThemeKeys.my,
    queryOptions: {
      staleTime: 30_000,
      retry: false,
    },
  },
  saveTheme: {
    kind: "mutation" as const,
    permission: {
      resource: EResource.BUSINESSES,
      action: EPermissionAction.UPDATE,
    },
    mutate: async (vars: unknown) => {
      const { data, files } = vars as SaveBusinessThemeVars;
      return businessThemeService.upsert(data, files);
    },
    onSuccess: (_result: unknown, _vars: unknown, ops: OpsBag) => {
      refetchOp(ops, "currentTheme");
      refetchOp(ops, "myTheme");
    },
  },
};

export type { IBusinessTheme };
