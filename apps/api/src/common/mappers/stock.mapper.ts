import type { Stock, StockCondition, StockStatus } from "@repo/shared";

export interface DbStock {
  id: string;
  item_id: string;
  location_id: string;
  width_mm: number;
  condition: string;
  quantity: number;
  weight_kg: string | number | null;
  status: string;
  is_active: boolean;
  batch_number: string | null;
  lot_number: string | null;
  received_at: string | null;
  parent_stock_id: string | null;
  source_type: string | null;
  source_reference_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function mapStock(db: DbStock): Stock {
  return {
    id: db.id,
    itemId: db.item_id,
    locationId: db.location_id,
    widthMm: db.width_mm,
    condition: db.condition as StockCondition,
    quantity: db.quantity,
    weightKg: db.weight_kg ? Number(db.weight_kg) : null,
    status: db.status as StockStatus,
    isActive: db.is_active,
    batchNumber: db.batch_number,
    lotNumber: db.lot_number,
    receivedAt: db.received_at,
    parentStockId: db.parent_stock_id,
    sourceType: db.source_type,
    sourceReferenceId: db.source_reference_id,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapStockNullable(db: DbStock | null): Stock | null {
  if (!db) return null;
  return mapStock(db);
}
