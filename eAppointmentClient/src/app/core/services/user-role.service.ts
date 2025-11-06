import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Role } from '../models/role.model';
import type { SyncRolesResultDto, UpdateUserRolesRequest, UpdateUserRolesResult, UserRolesResponse } from '../models/user-role.model';
import type { User } from '../models/user.model';
import { map } from 'rxjs/operators';
import { HttpService } from '../../services/http.service';
import { API_ENDPOINTS } from '../constants/api-endpoints.constant';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  constructor(private readonly httpClient: HttpClient, private readonly http: HttpService) {}

  // Roles
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(API_ENDPOINTS.ROLES.BASE).pipe(
      map(res => (res.isSuccess && res.value ? res.value : []))
    );
  }

  syncRoles(prune: boolean = false): Observable<SyncRolesResultDto> {
    return this.http.post<SyncRolesResultDto>(API_ENDPOINTS.ROLES.SYNC(prune), {}).pipe(
      map(res => (res.isSuccess && res.value ? res.value : { createdCount: 0, deletedCount: 0 }))
    );
  }

  createRole(name: string): Observable<Role> {
    return this.http.post<Role>(API_ENDPOINTS.ROLES.BASE, { name }).pipe(
      map(res => (res.isSuccess && res.value ? res.value : ({} as Role)))
    );
  }

  updateRole(id: string, name: string): Observable<Role> {
    return this.http.put<Role>(`${API_ENDPOINTS.ROLES.BASE}/${encodeURIComponent(id)}`, { name }).pipe(
      map(res => (res.isSuccess && res.value ? res.value : ({} as Role)))
    );
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.ROLES.BASE}/${encodeURIComponent(id)}`).pipe(
      map(res => (res.isSuccess ? undefined : undefined))
    );
  }

  // Users
  getAllUsers(): Observable<User[]> {
    type Dto = { id: string; username: string; email?: string; firstName?: string; lastName?: string; roles: string[] };
    return this.http.get<Dto[]>(API_ENDPOINTS.USERS.GET_ALL).pipe(
      map(res => {
        const items = res.isSuccess && res.value ? res.value : [];
        return items.map(i => ({
          id: i.id,
          username: i.username,
          email: i.email || '',
          firstName: i.firstName || '',
          lastName: i.lastName || '',
          roles: i.roles,
          isActive: true
        } as User));
      })
    );
  }

  // User <-> Roles
  getUserRoles(userId: string): Observable<UserRolesResponse> {
    return this.http.get<UserRolesResponse>(API_ENDPOINTS.USERS.ROLES(userId)).pipe(
      map(res => (res.isSuccess && res.value ? res.value : ({ userId, roles: [] } as UserRolesResponse)))
    );
  }

  updateUserRoles(userId: string, payload: UpdateUserRolesRequest): Observable<UpdateUserRolesResult> {
    return this.http.put<UpdateUserRolesResult>(API_ENDPOINTS.USERS.ROLES(userId), payload).pipe(
      map(res => (res.isSuccess && res.value ? res.value : ({ added: [], removed: [] } as UpdateUserRolesResult)))
    );
  }

  // User CRUD
  createUser(payload: { username: string; email: string; password: string; firstName?: string; lastName?: string }): Observable<User> {
    return this.http.post<User>(API_ENDPOINTS.USERS.CREATE, payload).pipe(
      map(res => (res.isSuccess && res.value ? (res.value as any as User) : ({} as User)))
    );
  }

  updateUser(id: string, payload: { email?: string; firstName?: string; lastName?: string; isActive?: boolean }): Observable<User> {
    return this.http.put<User>(API_ENDPOINTS.USERS.UPDATE(id), payload).pipe(
      map(res => (res.isSuccess && res.value ? (res.value as any as User) : ({} as User)))
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.USERS.DELETE(id)).pipe(
      map(res => (res.isSuccess ? undefined : undefined))
    );
  }

  // Promote
  promoteToDoctor(userId: string, payload: { firstName: string; lastName: string; departmentValue: number }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.USERS.PROMOTE_DOCTOR(userId), payload).pipe(
      map(res => (res.isSuccess && res.value ? res.value : res))
    );
  }

  promoteToPatient(userId: string, payload: { firstName: string; lastName: string; identityNumber: string }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.USERS.PROMOTE_PATIENT(userId), payload).pipe(
      map(res => (res.isSuccess && res.value ? res.value : res))
    );
  }
}


