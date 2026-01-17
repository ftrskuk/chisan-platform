import type { Item, PaperType } from "./item";
import type { Brand, Partner } from "./partner";
import type { Stock } from "./stock";
import type { User } from "./user";

export const ORDER_TYPES = ["stock_in", "stock_out"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "pending",
  "field_processing",
  "awaiting_approval",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_IN_REASONS = [
  "container",
  "domestic_purchase",
  "warehouse_transfer",
  "return",
  "adjustment",
] as const;
export type OrderInReason = (typeof ORDER_IN_REASONS)[number];

export const ORDER_OUT_REASONS = [
  "sales",
  "sample",
  "slitting",
  "loss",
  "warehouse_transfer",
] as const;
export type OrderOutReason = (typeof ORDER_OUT_REASONS)[number];

export type OrderReason = OrderInReason | OrderOutReason;

export const ORDER_HISTORY_ACTIONS = [
  "created",
  "updated",
  "field_started",
  "field_completed",
  "approved",
  "rejected",
  "cancelled",
  "urgent_approved",
] as const;
export type OrderHistoryAction = (typeof ORDER_HISTORY_ACTIONS)[number];

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  isUrgent: boolean;
  reason: OrderReason;
  partnerId: string | null;
  scheduledDate: string | null;
  memo: string | null;
  requestedBy: string;
  processedBy: string | null;
  approvedBy: string | null;
  processedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  stockId: string | null;
  widthMm: number;
  requestedQty: number;
  requestedWeightKg: number | null;
  processedQty: number | null;
  processedWeightKg: number | null;
  notes: string | null;
  createdAt: string;
}

export interface OrderItemWithRelations extends OrderItem {
  item: Item & { paperType: PaperType; brand: Brand | null };
  stock: Stock | null;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  action: OrderHistoryAction;
  actorId: string;
  memo: string | null;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrderHistoryWithActor extends OrderHistory {
  actor: Pick<User, "id" | "displayName" | "email">;
}

export interface OrderWithRelations extends Order {
  partner: Partner | null;
  requestedByUser: Pick<User, "id" | "displayName" | "email">;
  processedByUser: Pick<User, "id" | "displayName" | "email"> | null;
  approvedByUser: Pick<User, "id" | "displayName" | "email"> | null;
  items: OrderItemWithRelations[];
  itemCount: number;
  totalRequestedQty: number;
  totalProcessedQty: number | null;
}

export interface OrdersResponse {
  data: OrderWithRelations[];
  total: number;
  limit: number;
  offset: number;
}

export interface OrderResult {
  order: OrderWithRelations;
  history: OrderHistory;
}
