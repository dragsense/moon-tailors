import type { EPermissionAction, EResource } from "./enum.js";

/** Canonical permission name, e.g. `orders:read` or `*:*`. */
export type TPermissionName =
  | `${EResource}:${EPermissionAction | "*"}`
  | `*:${EPermissionAction | "*"}`;
