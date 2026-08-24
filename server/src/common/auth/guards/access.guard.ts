import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { EUserLevel } from "@moon-tailors/contracts";
import type { UserEntity } from "../../base";
import {
  IS_PUBLIC_KEY,
  MAX_USER_LEVEL_KEY,
  REQUIRED_USER_LEVELS_KEY,
} from "../decorators/auth.decorators";

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.switchToHttp().getRequest().method === "OPTIONS") return true;

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: UserEntity }>().user;
    if (!user?.isActive) {
      throw new ForbiddenException("User is inactive");
    }

    const levels = this.reflector.getAllAndOverride<EUserLevel[]>(
      REQUIRED_USER_LEVELS_KEY,
      targets,
    );
    if (levels?.length && !levels.includes(user.level)) {
      throw new ForbiddenException("Insufficient account level");
    }

    const maxLevel = this.reflector.getAllAndOverride<EUserLevel>(
      MAX_USER_LEVEL_KEY,
      targets,
    );
    if (maxLevel !== undefined && user.level > maxLevel) {
      throw new ForbiddenException("Insufficient account level");
    }

    return true;
  }
}
