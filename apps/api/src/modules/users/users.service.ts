import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { UserRole, UserWithRoles } from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import { handleSupabaseError } from "../../common/utils";

interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbUserRole {
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<UserWithRoles[]> {
    const client = this.supabaseService.getServiceClient();

    const { data: users, error: usersError } = await client
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError) {
      handleSupabaseError(usersError, {
        operation: "fetch users",
        resource: "User",
      });
    }

    const { data: allRoles, error: rolesError } = await client
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      handleSupabaseError(rolesError, {
        operation: "fetch user roles",
        resource: "UserRole",
      });
    }

    const rolesByUser = new Map<string, UserRole[]>();
    for (const r of allRoles ?? []) {
      const existing = rolesByUser.get(r.user_id) ?? [];
      existing.push(r.role as UserRole);
      rolesByUser.set(r.user_id, existing);
    }

    return (users as DbUser[]).map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      roles: rolesByUser.get(user.id) ?? [],
    }));
  }

  async findOne(id: string): Promise<UserWithRoles> {
    const client = this.supabaseService.getServiceClient();

    const { data: user, error: userError } = await client
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError || !user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { data: userRoles } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", id);

    const dbUser = user as DbUser;
    return {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.display_name,
      avatarUrl: dbUser.avatar_url,
      isActive: dbUser.is_active,
      lastLoginAt: dbUser.last_login_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      roles: ((userRoles as DbUserRole[]) ?? []).map((r) => r.role),
    };
  }

  async update(
    id: string,
    data: { displayName?: string; isActive?: boolean },
  ): Promise<UserWithRoles> {
    const client = this.supabaseService.getServiceClient();

    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) {
      updateData.display_name = data.displayName;
    }
    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findOne(id);
    }

    const { error } = await client
      .from("users")
      .update(updateData)
      .eq("id", id);

    if (error) {
      handleSupabaseError(error, {
        operation: "update user",
        resource: "User",
      });
    }

    return this.findOne(id);
  }

  async assignRole(
    userId: string,
    role: UserRole,
    assignedBy: string,
  ): Promise<UserWithRoles> {
    const client = this.supabaseService.getServiceClient();

    const user = await this.findOne(userId);

    const { error } = await client.from("user_roles").upsert(
      {
        user_id: userId,
        role,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "user_id,role" },
    );

    if (error) {
      handleSupabaseError(error, {
        operation: "assign role",
        resource: "UserRole",
      });
    }

    await this.auditService.log({
      action: "role_assigned",
      category: "user",
      targetTable: "user_roles",
      targetId: userId,
      metadata: { role, userEmail: user.email, assignedBy },
    });

    return this.findOne(userId);
  }

  async removeRole(userId: string, role: UserRole): Promise<UserWithRoles> {
    const client = this.supabaseService.getServiceClient();

    const user = await this.findOne(userId);

    if (role === "admin") {
      const { count } = await client
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1 && user.roles.includes("admin")) {
        throw new BadRequestException(
          "Cannot remove the last admin. At least one admin must exist.",
        );
      }
    }

    const { error } = await client
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      handleSupabaseError(error, {
        operation: "remove role",
        resource: "UserRole",
      });
    }

    await this.auditService.log({
      action: "role_removed",
      category: "user",
      targetTable: "user_roles",
      targetId: userId,
      metadata: { role, userEmail: user.email },
    });

    return this.findOne(userId);
  }

  async deactivate(userId: string): Promise<UserWithRoles> {
    const user = await this.findOne(userId);
    const result = await this.update(userId, { isActive: false });

    await this.auditService.log({
      action: "deactivated",
      category: "user",
      targetTable: "users",
      targetId: userId,
      metadata: { userEmail: user.email },
    });

    return result;
  }

  async reactivate(userId: string): Promise<UserWithRoles> {
    const user = await this.findOne(userId);
    const result = await this.update(userId, { isActive: true });

    await this.auditService.log({
      action: "reactivated",
      category: "user",
      targetTable: "users",
      targetId: userId,
      metadata: { userEmail: user.email },
    });

    return result;
  }
}
