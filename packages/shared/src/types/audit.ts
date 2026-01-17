export const AUDIT_CATEGORIES = [
  "auth",
  "user",
  "inventory",
  "master_data",
  "import",
  "production",
  "orders",
  "settings",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_ACTIONS = {
  auth: ["login", "logout", "login_failed"] as const,
  user: [
    "role_assigned",
    "role_removed",
    "deactivated",
    "reactivated",
  ] as const,
  inventory: [
    "stock_in",
    "stock_out",
    "adjustment",
    "move",
    "quarantine",
  ] as const,
  master_data: [
    "paper_type_created",
    "paper_type_updated",
    "item_created",
    "item_updated",
    "item_deactivated",
    "partner_created",
    "partner_updated",
    "partner_deactivated",
    "brand_created",
    "brand_updated",
    "warehouse_created",
    "warehouse_updated",
    "warehouse_deactivated",
    "location_created",
    "location_updated",
  ] as const,
  import: [
    "order_created",
    "order_status_changed",
    "shipment_status_changed",
  ] as const,
  production: [
    "order_created",
    "order_status_changed",
    "job_completed",
  ] as const,
  orders: [
    "order_created",
    "order_updated",
    "order_cancelled",
    "order_field_started",
    "order_field_completed",
    "order_approved",
    "order_rejected",
    "order_urgent_approved",
  ] as const,
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
