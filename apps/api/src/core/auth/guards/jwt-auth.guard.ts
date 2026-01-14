import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service";
import type { RequestUser } from "../types/auth.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Missing authorization token");
    }

    try {
      const client = this.supabaseService.createClientWithToken(token);
      const {
        data: { user },
        error,
      } = await client.auth.getUser();

      if (error || !user) {
        throw new UnauthorizedException("Invalid or expired token");
      }

      const { data: userRoles } = await this.supabaseService
        .getServiceClient()
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const requestUser: RequestUser = {
        id: user.id,
        email: user.email ?? "",
        roles: (userRoles ?? []).map((r) => r.role),
      };

      request.user = requestUser;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Authentication failed");
    }
  }

  private extractTokenFromHeader(request: Request & { headers: { authorization?: string } }): string | null {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(" ");
    return type === "Bearer" ? token ?? null : null;
  }
}
