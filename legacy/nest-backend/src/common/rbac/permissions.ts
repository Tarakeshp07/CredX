// Single source of truth for authorization. Static in-memory matrix keyed by
// roleId. The JWT strategy re-reads roleId every request, so role changes take
// effect immediately with no cache to invalidate.
import { ADMIN, RECRUITER, STUDENT } from './roles';

export enum Resource {
  PROFILE = 'PROFILE',
  JOBS = 'JOBS',
  MATCHES = 'MATCHES',
  APPLICATIONS = 'APPLICATIONS',
  SKILLS = 'SKILLS',
}

export enum Action {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

const A = Action;
const R = Resource;

export const ROLE_PERMISSIONS: Record<number, Partial<Record<Resource, Action[]>>> = {
  [ADMIN]: {
    [R.PROFILE]: [A.VIEW, A.UPDATE],
    [R.JOBS]: [A.VIEW, A.CREATE, A.UPDATE, A.DELETE],
    [R.MATCHES]: [A.VIEW],
    [R.APPLICATIONS]: [A.VIEW],
    [R.SKILLS]: [A.VIEW, A.CREATE],
  },
  [RECRUITER]: {
    [R.PROFILE]: [A.VIEW, A.UPDATE],
    [R.JOBS]: [A.VIEW, A.CREATE, A.UPDATE, A.DELETE],
    [R.SKILLS]: [A.VIEW, A.CREATE],
  },
  [STUDENT]: {
    [R.PROFILE]: [A.VIEW, A.UPDATE],
    [R.JOBS]: [A.VIEW],
    [R.MATCHES]: [A.VIEW],
    [R.APPLICATIONS]: [A.VIEW, A.CREATE, A.DELETE],
    [R.SKILLS]: [A.VIEW],
  },
};

export function hasPermission(roleId: number, resource: Resource, action: Action): boolean {
  return ROLE_PERMISSIONS[roleId]?.[resource]?.includes(action) ?? false;
}
