import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from '../rbac/permissions';

export const PERMISSION_KEY = 'requiredPermission';
export interface RequiredPermission {
  resource: Resource;
  action: Action;
}

export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as RequiredPermission);
