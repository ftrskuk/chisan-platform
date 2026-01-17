import type { AuditCategory } from "@repo/shared";

export type AuditCategoryVariant =
  | "auth"
  | "user"
  | "inventory"
  | "master_data"
  | "import"
  | "production"
  | "orders"
  | "settings";

export const categoryVariantMap: Record<AuditCategory, AuditCategoryVariant> = {
  auth: "auth",
  user: "user",
  inventory: "inventory",
  master_data: "master_data",
  import: "import",
  production: "production",
  orders: "orders",
  settings: "settings",
};
