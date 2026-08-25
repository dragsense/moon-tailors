import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EPermissionAction } from "@moon-tailors/contracts";
import { PermissionsService } from "../../base";
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

    const names = await this.permissions.resolveForUser(user);

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
