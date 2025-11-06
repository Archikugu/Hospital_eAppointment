import type { RoleName } from './user.model';

export interface Role {
  id: string;
  name: RoleName | string; // UI'da dinamik roller için esneklik
}

export const BUILT_IN_ROLES: RoleName[] = ['Admin', 'Doctor', 'Patient'];

export function isBuiltInRole(name: string): name is RoleName {
  return (BUILT_IN_ROLES as string[]).includes(name);
}


