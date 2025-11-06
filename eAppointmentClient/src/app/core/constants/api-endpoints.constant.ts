export const API_ENDPOINTS = {
  // Auth Endpoints
  AUTH: {
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout',
    REFRESH_TOKEN: 'auth/refresh-token',
    REGISTER: 'auth/register',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
  },

  // Doctor Endpoints
  DOCTORS: {
    BASE: 'doctors',
    GET_BY_ID: (id: string) => `doctors/${id}`,
    GET_ALL: 'doctors',
    CREATE: 'doctors',
    UPDATE: (id: string) => `doctors/${id}`,
    DELETE: (id: string) => `doctors/${id}`,
  },

  // Patient Endpoints
  PATIENTS: {
    BASE: 'patients',
    GET_BY_ID: (id: string) => `patients/${id}`,
    GET_ALL: 'patients',
    CREATE: 'patients',
    UPDATE: (id: string) => `patients/${id}`,
    DELETE: (id: string) => `patients/${id}`,
  },

  // Appointment Endpoints
  APPOINTMENTS: {
    BASE: 'appointments',
    GET_BY_ID: (id: string) => `appointments/${id}`,
    GET_ALL: 'appointments',
    GET_BY_DOCTOR_ID: (doctorId: string) => `appointments/doctor/${doctorId}`,
    GET_BY_PATIENT_ID: (patientId: string) => `appointments/patient/${patientId}`,
    CREATE: 'appointments',
    UPDATE: (id: string) => `appointments/${id}`,
    DELETE: (id: string) => `appointments/${id}`,
    CANCEL: (id: string) => `appointments/${id}/cancel`,
  },

  // User Endpoints
  USERS: {
    BASE: 'users',
    GET_BY_ID: (id: string) => `users/${id}`,
    GET_PROFILE: 'users/profile',
    UPDATE_PROFILE: 'users/profile',
    CHANGE_PASSWORD: 'users/change-password',
    GET_ALL: 'users',
    CREATE: 'users',
    UPDATE: (id: string) => `users/${id}`,
    DELETE: (id: string) => `users/${id}`,
    ROLES: (id: string) => `users/${id}/roles`,
    PROMOTE_DOCTOR: (id: string) => `users/${id}/promote-to-doctor`,
    PROMOTE_PATIENT: (id: string) => `users/${id}/promote-to-patient`
  },

  // Role Endpoints
  ROLES: {
    BASE: 'roles',
    SYNC: (prune: boolean) => `roles/sync?prune=${prune}`
  },
};

