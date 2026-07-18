import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';
import { hasPermission } from '../rbac/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @RequirePermission on the route => allow (auth already enforced).
    if (!required) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException('No authenticated user');

    if (!hasPermission(user.roleId, required.resource, required.action)) {
      throw new ForbiddenException(
        `Role is not permitted to ${required.action} ${required.resource}`,
      );
    }
    return true;
  }
}
