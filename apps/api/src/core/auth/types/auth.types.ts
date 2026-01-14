import type { UserRole } from "@repo/shared";

export interface JwtPayload {
  sub: string;
  email: string;
  aud: string;
  role: string;
  iat: number;
  exp: number;
}

export interface RequestUser {
  id: string;
  email: string;
  roles: UserRole[];
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
