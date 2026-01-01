// Authentication & Authorization Types

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  PHYSICIAN = 'PHYSICIAN',
  NURSE = 'NURSE',
  FRONT_DESK = 'FRONT_DESK',
  BILLING = 'BILLING',
  LAB_TECH = 'LAB_TECH',
  PHARMACIST = 'PHARMACIST',
  RADIOLOGIST = 'RADIOLOGIST',
  PATIENT = 'PATIENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
}

export enum Permission {
  PATIENT_READ = 'PATIENT_READ',
  PATIENT_WRITE = 'PATIENT_WRITE',
  PATIENT_DELETE = 'PATIENT_DELETE',
  CLINICAL_READ = 'CLINICAL_READ',
  CLINICAL_WRITE = 'CLINICAL_WRITE',
  PRESCRIBE = 'PRESCRIBE',
  BILLING_READ = 'BILLING_READ',
  BILLING_WRITE = 'BILLING_WRITE',
  LAB_ORDER = 'LAB_ORDER',
  LAB_RESULT = 'LAB_RESULT',
  IMAGING_ORDER = 'IMAGING_ORDER',
  IMAGING_READ = 'IMAGING_READ',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
}

export interface MFAVerifyRequest {
  code: string;
}

export interface RolePermissionMap {
  [Role.SUPER_ADMIN]: Permission[];
  [Role.ORG_ADMIN]: Permission[];
  [Role.PHYSICIAN]: Permission[];
  [Role.NURSE]: Permission[];
  [Role.FRONT_DESK]: Permission[];
  [Role.BILLING]: Permission[];
  [Role.LAB_TECH]: Permission[];
  [Role.PHARMACIST]: Permission[];
  [Role.RADIOLOGIST]: Permission[];
  [Role.PATIENT]: Permission[];
}

export const DEFAULT_PERMISSIONS: RolePermissionMap = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ORG_ADMIN]: [
    Permission.PATIENT_READ,
    Permission.PATIENT_WRITE,
    Permission.CLINICAL_READ,
    Permission.BILLING_READ,
    Permission.BILLING_WRITE,
    Permission.ADMIN,
  ],
  [Role.PHYSICIAN]: [
    Permission.PATIENT_READ,
    Permission.PATIENT_WRITE,
    Permission.CLINICAL_READ,
    Permission.CLINICAL_WRITE,
    Permission.PRESCRIBE,
    Permission.LAB_ORDER,
    Permission.LAB_RESULT,
    Permission.IMAGING_ORDER,
    Permission.IMAGING_READ,
  ],
  [Role.NURSE]: [
    Permission.PATIENT_READ,
    Permission.CLINICAL_READ,
    Permission.CLINICAL_WRITE,
    Permission.LAB_RESULT,
  ],
  [Role.FRONT_DESK]: [
    Permission.PATIENT_READ,
    Permission.PATIENT_WRITE,
  ],
  [Role.BILLING]: [
    Permission.PATIENT_READ,
    Permission.BILLING_READ,
    Permission.BILLING_WRITE,
  ],
  [Role.LAB_TECH]: [
    Permission.PATIENT_READ,
    Permission.LAB_ORDER,
    Permission.LAB_RESULT,
  ],
  [Role.PHARMACIST]: [
    Permission.PATIENT_READ,
    Permission.CLINICAL_READ,
    Permission.PRESCRIBE,
  ],
  [Role.RADIOLOGIST]: [
    Permission.PATIENT_READ,
    Permission.CLINICAL_READ,
    Permission.IMAGING_ORDER,
    Permission.IMAGING_READ,
  ],
  [Role.PATIENT]: [
    Permission.PATIENT_READ,
  ],
};
