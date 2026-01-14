export const AUDIT_CATEGORIES = [
  "auth",
  "user",
  "inventory",
  "import",
  "production",
  "settings",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_ACTIONS = {
  auth: ["login", "logout", "login_failed"] as const,
  user: ["role_assigned", "role_removed", "deactivated", "reactivated"] as const,
  inventory: ["stock_in", "stock_out", "adjustment", "move", "quarantine"] as const,
  import: ["order_created", "order_status_changed", "shipment_status_changed"] as const,
  production: ["order_created", "order_status_changed", "job_completed"] as const,
  settings: ["setting_changed"] as const,
} as const;

export type AuditAction = {
  [K in AuditCategory]: (typeof AUDIT_ACTIONS)[K][number];
}[AuditCategory];

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  category: AuditCategory;
  targetTable: string | null;
  targetId: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}
