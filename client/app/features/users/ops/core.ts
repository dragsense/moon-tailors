/**
 * User ops catalog — all user domain ops + default UI.
 * Not a store. Compose into packs with pickOps / spread.
 * Schemas live on SchemaForm / contracts — not here.
 */
import type { TCreateUserData } from "@moon-tailors/contracts";
import { EPermissionAction, EResource } from "@moon-tailors/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { usersService } from "../api";
import { userKeys } from "../query-keys";
import { UserDropdown } from "../dropdown/user-dropdown";
import { CreateUserModal } from "../form/create-user-modal";
import { UserList } from "../list/user-list";

const onSuccess = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listUsers");
  refetchOp(ops, "listUsersDropdown");
  invalidateQueriesKey(userKeys.lists());
  invalidateQueriesKey(userKeys.dropdowns());
};

export const userOpsCore = {
  listUsers: {
    kind: "query" as const,
    permission: { resource: EResource.USERS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20 },
    queryKey: userKeys.list,
    invalidateKey: userKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      usersService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search:
          typeof params.search === "string" ? params.search : undefined,
      }),
    component: UserList,
    auto: false,
    onError: (error: Error) => {
      console.error("[users.listUsers]", error.message);
    },
  },
  /** Searchable picker for foreign packs (task assignee, etc.). */
  listUsersDropdown: {
    kind: "query" as const,
    permission: { resource: EResource.USERS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20, search: "" },
    queryKey: userKeys.dropdown,
    invalidateKey: userKeys.dropdowns(),
    fetch: (params: Record<string, unknown>) =>
      usersService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search:
          typeof params.search === "string" ? params.search : undefined,
      }),
    component: UserDropdown,
    auto: false,
    onError: (error: Error) => {
      console.error("[users.listUsersDropdown]", error.message);
    },
  },
  createUser: {
    kind: "mutation" as const,
    permission: { resource: EResource.USERS, action: EPermissionAction.CREATE },
    mutate: (body: unknown) => usersService.create(body as TCreateUserData),
    component: CreateUserModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[users.createUser]", error.message);
    },
  },
  deleteUser: {
    kind: "mutation" as const,
    permission: { resource: EResource.USERS, action: EPermissionAction.DELETE },
    confirm: {
      title: "Delete user",
      description: (vars: unknown) => {
        const v = vars as { name?: string };
        return v.name
          ? `Delete “${v.name}” permanently?`
          : "Delete this user permanently?";
      },
      confirmLabel: "Delete",
      tone: "destructive" as const,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return usersService.remove(id);
    },
    onSuccess,
    onError: (error: Error) => {
      console.error("[users.deleteUser]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type UserOpsCore = typeof userOpsCore;
export type UserOpName = keyof UserOpsCore;
