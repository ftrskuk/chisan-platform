import {
  Injectable,
  Inject,
  Scope,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import type { AuditCategory } from "@repo/shared";
import { SupabaseService } from "../supabase/supabase.service";
import type { RequestUser } from "../auth/types/auth.types";
import { handleSupabaseError } from "../../common/utils";

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

interface DbAuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  category: string;
  target_table: string | null;
  target_id: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private mapAuditLog(db: DbAuditLog) {
    return {
      id: db.id,
      actorId: db.actor_id,
      actorEmail: db.actor_email,
      actorRole: db.actor_role,
      action: db.action,
      category: db.category,
      targetTable: db.target_table,
      targetId: db.target_id,
      changes: db.changes,
      metadata: db.metadata,
      ipAddress: db.ip_address,
      userAgent: db.user_agent,
      requestId: db.request_id,
      createdAt: db.created_at,
    };
  }

  async log(params: AuditLogParams): Promise<void> {
    const user = (this.request as Request & { user?: RequestUser }).user;
    if (!user) {
      return;
    }

    const client = this.supabaseService.getServiceClient();

    const { error } = await client.from("audit_logs").insert({
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

    if (error) {
      // Log error but don't throw - audit failures shouldn't break business logic
      this.logger.error(`Audit log failed: ${error.message}`);
    }
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
      handleSupabaseError(error, {
        operation: "fetch audit logs",
        resource: "AuditLog",
      });
    }

    return {
      data:
        (data as DbAuditLog[] | null)?.map((db) => this.mapAuditLog(db)) ?? [],
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
      throw new NotFoundException(`Audit log not found: ${error.message}`);
    }

    return this.mapAuditLog(data as DbAuditLog);
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
