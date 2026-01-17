import type { Item, PaperType } from "./item";
import type { Brand } from "./partner";
import type { Location, Warehouse } from "./warehouse";

export const STOCK_CONDITIONS = ["parent", "slitted"] as const;
export type StockCondition = (typeof STOCK_CONDITIONS)[number];

export const STOCK_STATUSES = [
  "available",
  "reserved",
  "quarantine",
  "disposed",
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const MOVEMENT_TYPES = [
  "in",
  "out",
  "adjustment",
  "move",
  "quarantine",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_REFERENCE_TYPES = [
  "import",
  "production",
  "sale",
  "adjustment",
  "transfer",
  "disposal",
] as const;
export type MovementReferenceType = (typeof MOVEMENT_REFERENCE_TYPES)[number];

export interface Stock {
  id: string;
  itemId: string;
  locationId: string;
  widthMm: number;
  condition: StockCondition;
  quantity: number;
  weightKg: number | null;
  status: StockStatus;
  isActive: boolean;
  batchNumber: string | null;
  lotNumber: string | null;
  receivedAt: string | null;
  parentStockId: string | null;
  sourceType: string | null;
  sourceReferenceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockWithRelations extends Stock {
  item: Item & { paperType: PaperType; brand: Brand | null };
  location: Location;
  warehouse: Warehouse;
}

export interface StockMovement {
  id: string;
  stockId: string;
  movementType: MovementType;
  quantityChange: number;
  weightChangeKg: number | null;
  quantityBefore: number;
  quantityAfter: number;
  weightBeforeKg: number | null;
  weightAfterKg: number | null;
  reason: string | null;
  referenceType: MovementReferenceType | null;
  referenceId: string | null;
  performedBy: string | null;
  createdAt: string;
}

export interface StockMovementWithRelations extends StockMovement {
  stock: Stock;
}

export interface StocksResponse {
  data: StockWithRelations[];
  total: number;
  limit: number;
  offset: number;
}

export const STOCK_SOURCE_TYPES = [
  "import",
  "production",
  "adjustment",
] as const;
export type StockSourceType = (typeof STOCK_SOURCE_TYPES)[number];

export interface CreateStockInInput {
  itemId: string;
  locationId: string;
  widthMm: number;
  weightKg: number;
  quantity?: number;
  condition: StockCondition;
  sourceType: StockSourceType;
  lotNumber?: string;
  notes?: string;
}

export interface StockInResult {
  stock: StockWithRelations;
  movement: StockMovement;
  batchNumber: string;
}

export interface BulkStockInInput {
  items: CreateStockInInput[];
}

export interface BulkStockInFailure {
  input: CreateStockInInput;
  error: string;
}

export interface BulkStockInResult {
  results: StockInResult[];
  successCount: number;
  failureCount: number;
  failures: BulkStockInFailure[];
}

export const STOCK_OUT_REASON_TYPES = [
  "sale",
  "production",
  "adjustment",
  "disposal",
  "transfer",
] as const;
export type StockOutReasonType = (typeof STOCK_OUT_REASON_TYPES)[number];

export interface CreateStockOutInput {
  stockId: string;
  quantity?: number;
  weightKg?: number;
  reasonType: StockOutReasonType;
  reason?: string;
  referenceId?: string;
  notes?: string;
}

export interface StockOutResult {
  stock: StockWithRelations;
  movement: StockMovement;
}

export interface BulkStockOutInput {
  items: CreateStockOutInput[];
}

export interface BulkStockOutFailure {
  input: CreateStockOutInput;
  error: string;
}

export interface BulkStockOutResult {
  results: StockOutResult[];
  successCount: number;
  failureCount: number;
  failures: BulkStockOutFailure[];
}
