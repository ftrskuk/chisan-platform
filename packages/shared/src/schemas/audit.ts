import { z } from "zod";
import { AUDIT_CATEGORIES } from "../types/audit";

export const auditCategorySchema = z.enum(AUDIT_CATEGORIES);

export const auditLogQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  category: auditCategorySchema.optional(),
  action: z.string().optional(),
  targetTable: z.string().optional(),
  targetId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
