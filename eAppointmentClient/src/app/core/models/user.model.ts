// User domain model for frontend (aligns with backend AppUser + JWT payload)

export type RoleName = 'Admin' | 'Doctor' | 'Patient';

export interface UserIdentity {
  id: string;
  username: string;
  email: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  fullName?: string;
  identityNumber?: string;
  birthDate?: string; // ISO 8601 string
  phoneNumber?: string;
  gender?: string;
}

export interface UserSecurity {
  roles: (RoleName | string)[];
  token?: string;
  refreshToken?: string;
}

export interface User extends UserIdentity, UserProfile, UserSecurity {
  isActive?: boolean;
  createdAt?: string; // ISO 8601 string
  updatedAt?: string; // ISO 8601 string
}

export function getDisplayName(profile: Pick<UserProfile, 'firstName' | 'lastName'>): string {
  const first = (profile.firstName || '').trim();
  const last = (profile.lastName || '').trim();
  return [first, last].filter(Boolean).join(' ');
}


