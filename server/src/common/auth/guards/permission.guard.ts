import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EPermissionAction } from "@moon-tailors/contracts";
import { PermissionsService, UserEntity } from "../../base";
import {
  REQUIRED_PERMISSIONS_KEY,
  type RequiredPermission,
} from "../decorators/auth.decorators";
import type { AuthenticatedRequest } from "../types";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.method === "OPTIONS") return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const user = request.user;
    if (!user) throw new ForbiddenException("Forbidden");

    let names = await this.permissions.resolveForUser(user.id);

    // API key with scopes → intersect with user permissions (never escalate).
    const keyScopes = request.apiKeyScopes;
    if (keyScopes?.length) {
      names = names.filter(
        (name) =>
          keyScopes.includes(name) ||
          keyScopes.includes("*:*") ||
          matchesScopedWildcard(name, keyScopes),
      );
    }

    const allowed = required.every(({ resource, action }) =>
      [
        `${resource}:${action}`,
        `${resource}:${EPermissionAction.MANAGE}`,
        `${resource}:*`,
        `*:${action}`,
        "*:*",
      ].some((name) => names.includes(name)),
    );

    if (!allowed) throw new ForbiddenException("Forbidden");
    return true;
  }
}

function matchesScopedWildcard(userPerm: string, scopes: string[]): boolean {
  const [res, act] = userPerm.split(":");
  return scopes.some((scope) => {
    const [sRes, sAct] = scope.split(":");
    if (sRes === "*" && sAct === "*") return true;
    if (sRes === "*" && sAct === act) return true;
    if (sRes === res && sAct === "*") return true;
    return false;
  });
}
