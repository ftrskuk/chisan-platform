import type { UserRole } from "./user";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  roles: UserRole[];
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  roles: UserRole[];
}
