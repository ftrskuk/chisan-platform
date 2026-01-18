export const USER_ROLES = ["admin", "manager", "worker"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_ONLY_ROLES = ["admin"] as const;
export const ADMIN_MANAGER_ROLES = ["admin", "manager"] as const;

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoles extends User {
  roles: UserRole[];
}
