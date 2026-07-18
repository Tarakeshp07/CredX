// Stable role ids — must match prisma/seed.ts and the RoleMaster table.
export const ADMIN = 1;
export const RECRUITER = 2;
export const STUDENT = 3;

export type RoleId = typeof ADMIN | typeof RECRUITER | typeof STUDENT;

export const ROLE_NAMES: Record<number, string> = {
  [ADMIN]: 'ADMIN',
  [RECRUITER]: 'RECRUITER',
  [STUDENT]: 'STUDENT',
};
