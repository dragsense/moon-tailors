import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import {
  EAuthMethod,
  type EPermissionAction,
  type EResource,
} from "@moon-tailors/contracts";
import type { UserEntity } from "../../base";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export type RequiredPermission = {
  resource: EResource;
  action: EPermissionAction;
};

export const REQUIRED_PERMISSIONS_KEY = "requiredPermissions";
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * Restrict which credential types may call this route.
 * Default (when omitted): JWT.
 */
export const AUTH_MODES_KEY = "authModes";
export const AuthModes = (...modes: EAuthMethod[]) =>
  SetMetadata(AUTH_MODES_KEY, modes);

/** Session JWT only. */
export const JwtOnly = () => AuthModes(EAuthMethod.JWT);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserEntity | undefined =>
    context.switchToHttp().getRequest<{ user?: UserEntity }>().user,
);

export const CurrentAuthMethod = createParamDecorator(
  (_data: unknown, context: ExecutionContext): EAuthMethod | undefined =>
    context
      .switchToHttp()
      .getRequest<{ authMethod?: EAuthMethod }>().authMethod,
);

export const REQUIRED_USER_LEVELS_KEY = "requiredUserLevels";
export const RequireUserLevels = (...levels: number[]) =>
  SetMetadata(REQUIRED_USER_LEVELS_KEY, levels);

/** Lower numeric levels are more privileged, matching the privilege hierarchy. */
export const MAX_USER_LEVEL_KEY = "maxUserLevel";
export const MaxUserLevel = (level: number) =>
  SetMetadata(MAX_USER_LEVEL_KEY, level);
