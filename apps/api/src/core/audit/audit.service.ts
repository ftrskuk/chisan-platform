import { Injectable, Inject, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import type { AuditCategory } from "@repo/shared";
import { SupabaseService } from "../supabase/supabase.service";
import type { RequestUser } from "../auth/types/auth.types";

interface AuditLogParams {
  action: string;
  category: AuditCategory;
  targetTable?: string;
  targetId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
}

interface AuditLogQuery {
  actorId?: string;
  category?: string;
  action?: string;
  targetTable?: string;
  targetId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  async log(params: AuditLogParams): Promise<void> {
    const user = (this.request as Request & { user?: RequestUser }).user;
    if (!user) {
      return;
    }

    const client = this.supabaseService.getServiceClient();

    await client.from("audit_logs").insert({
      actor_id: user.id,
      actor_email: user.email,
      actor_role: user.roles[0] ?? "unknown",
      action: params.action,
      category: params.category,
      target_table: params.targetTable,
      target_id: params.targetId,
      changes: params.changes,
      metadata: params.metadata,
      ip_address: this.getClientIp(),
      user_agent: this.request.headers["user-agent"],
      request_id: this.request.headers["x-request-id"] as string | undefined,
    });
  }

  async findAll(query: AuditLogQuery) {
    const client = this.supabaseService.getServiceClient();

    let queryBuilder = client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (query.actorId) {
      queryBuilder = queryBuilder.eq("actor_id", query.actorId);
    }
    if (query.category) {
      queryBuilder = queryBuilder.eq("category", query.category);
    }
    if (query.action) {
      queryBuilder = queryBuilder.eq("action", query.action);
    }
    if (query.targetTable) {
      queryBuilder = queryBuilder.eq("target_table", query.targetTable);
    }
    if (query.targetId) {
      queryBuilder = queryBuilder.eq("target_id", query.targetId);
    }
    if (query.from) {
      queryBuilder = queryBuilder.gte("created_at", query.from);
    }
    if (query.to) {
      queryBuilder = queryBuilder.lte("created_at", query.to);
    }

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("audit_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private getClientIp(): string | undefined {
    const forwarded = this.request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      const firstIp = forwarded.split(",")[0];
      return firstIp?.trim();
    }
    return this.request.socket?.remoteAddress;
  }
}
