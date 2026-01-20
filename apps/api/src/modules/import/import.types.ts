import type {
  DbItem,
  DbPaperType,
  DbBrand,
  DbUser,
  DbPartner,
} from "../../common/mappers";

export const IMPORT_ORDER_STATUS = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  PARTIALLY_SHIPPED: "partially_shipped",
  SHIPPED: "shipped",
  ARRIVED: "arrived",
  CUSTOMS_CLEARING: "customs_clearing",
  CLEARED: "cleared",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const SHIPMENT_STATUS = {
  PENDING: "pending",
  DEPARTED: "departed",
  IN_TRANSIT: "in_transit",
  ARRIVED: "arrived",
  CUSTOMS_HOLD: "customs_hold",
  CUSTOMS_CLEARED: "customs_cleared",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const IMPORT_COST_TYPE = {
  FREIGHT: "freight",
  INSURANCE: "insurance",
  TARIFF: "tariff",
  VAT: "vat",
  CUSTOMS_FEE: "customs_fee",
  INLAND_TRANSPORT: "inland_transport",
  PORT_CHARGE: "port_charge",
  BANK_CHARGE: "bank_charge",
  INSPECTION: "inspection",
  STORAGE: "storage",
  OTHER: "other",
} as const;

export const ENTITY_TYPE = {
  ORDER: "order",
  SHIPMENT: "shipment",
} as const;

export const HISTORY_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  ARRIVED: "arrived",
  CUSTOMS_STARTED: "customs_started",
  CUSTOMS_CLEARED: "customs_cleared",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export interface DbImportOrder {
  id: string;
  po_number: string;
  partner_id: string;
  status: string;
  order_date: string;
  expected_etd: string | null;
  expected_eta: string | null;
  currency: string;
  exchange_rate: string | number | null;
  payment_terms: string | null;
  total_amount: string | number;
  total_amount_krw: string | number | null;
  requested_by: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  memo: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbImportOrderItem {
  id: string;
  import_order_id: string;
  item_id: string;
  width_mm: number;
  quantity: number;
  weight_kg: string | number | null;
  unit_price: string | number;
  total_price: string | number;
  shipped_quantity: number;
  received_quantity: number;
  notes: string | null;
  created_at: string;
}

export interface DbShipment {
  id: string;
  import_order_id: string;
  shipment_number: string;
  bl_number: string | null;
  vessel_name: string | null;
  voyage_number: string | null;
  container_numbers: string[] | null;
  container_count: number;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  etd: string | null;
  eta: string | null;
  actual_departure_date: string | null;
  actual_arrival_date: string | null;
  customs_cleared_date: string | null;
  delivered_date: string | null;
  destination_location_id: string | null;
  status: string;
  documents: unknown;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbShipmentItem {
  id: string;
  shipment_id: string;
  import_order_item_id: string;
  shipped_quantity: number;
  received_quantity: number | null;
  damaged_quantity: number;
  notes: string | null;
  created_at: string;
}

export interface DbImportCost {
  id: string;
  shipment_id: string | null;
  import_order_id: string | null;
  cost_type: string;
  description: string | null;
  amount: string | number;
  currency: string;
  amount_krw: string | number | null;
  invoice_number: string | null;
  vendor_name: string | null;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbImportHistory {
  id: string;
  import_order_id: string | null;
  shipment_id: string | null;
  entity_type: string;
  action: string;
  actor_id: string;
  previous_status: string | null;
  new_status: string | null;
  changes: Record<string, unknown> | null;
  memo: string | null;
  created_at: string;
}

export interface DbImportOrderItemWithRelations extends DbImportOrderItem {
  items: DbItem & {
    paper_types: DbPaperType;
    brands: DbBrand | null;
  };
}

export interface DbImportOrderWithRelations extends DbImportOrder {
  partners: DbPartner;
  requested_user: DbUser;
  confirmed_user: DbUser | null;
  import_order_items: DbImportOrderItemWithRelations[];
}

export interface DbShipmentItemWithRelations extends DbShipmentItem {
  import_order_items: DbImportOrderItemWithRelations;
}

export interface DbShipmentWithRelations extends DbShipment {
  import_orders: Pick<DbImportOrder, "id" | "po_number" | "partner_id">;
  partners: Pick<DbPartner, "id" | "name" | "partner_code">;
  shipment_items: DbShipmentItemWithRelations[];
}

export interface DbImportHistoryWithActor extends DbImportHistory {
  actor: DbUser;
}
