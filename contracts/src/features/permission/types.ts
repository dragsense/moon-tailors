import type { EPermissionAction, EResource } from "./enum.js";

/** Canonical permission name, e.g. `tasks:read` or `*:*`. */
export type TPermissionName =
  | `${EResource}:${EPermissionAction | "*"}`
  | `*:${EPermissionAction | "*"}`;
