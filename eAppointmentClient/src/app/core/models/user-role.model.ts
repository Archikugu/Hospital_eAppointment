import type { Role } from './role.model';
import type { RoleName } from './user.model';

export interface UserRolesResponse {
  userId: string;
  roles: (RoleName | string)[];
}

export interface UpdateUserRolesRequest {
  roles: (RoleName | string)[];
}

export interface UpdateUserRolesResult {
  added: (RoleName | string)[];
  removed: (RoleName | string)[];
}

export interface SyncRolesResultDto {
  createdCount: number;
  deletedCount: number;
}

export interface RolesListResponse {
  items: Role[];
}


