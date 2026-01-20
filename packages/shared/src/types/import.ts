import type { Item, PaperType } from "./item";
import type { Brand, Partner } from "./partner";
import type { User } from "./user";

export const IMPORT_ORDER_STATUSES = [
  "draft",
  "confirmed",
  "partially_shipped",
  "shipped",
  "arrived",
  "customs_clearing",
  "cleared",
  "completed",
  "cancelled",
] as const;
export type ImportOrderStatus = (typeof IMPORT_ORDER_STATUSES)[number];

export const SHIPMENT_STATUSES = [
  "pending",
  "departed",
  "in_transit",
  "arrived",
  "customs_hold",
  "customs_cleared",
  "delivered",
  "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const IMPORT_COST_TYPES = [
  "freight",
  "insurance",
  "tariff",
  "vat",
  "customs_fee",
  "inland_transport",
  "port_charge",
  "bank_charge",
  "inspection",
  "storage",
  "other",
] as const;
export type ImportCostType = (typeof IMPORT_COST_TYPES)[number];

export const IMPORT_HISTORY_ACTIONS = [
  "created",
  "updated",
  "confirmed",
  "shipped",
  "arrived",
  "customs_started",
  "customs_cleared",
  "completed",
  "cancelled",
] as const;
export type ImportHistoryAction = (typeof IMPORT_HISTORY_ACTIONS)[number];

export const CURRENCIES = ["USD", "EUR", "JPY", "CNY", "KRW"] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface ImportOrder {
  id: string;
  poNumber: string;
  partnerId: string;
  status: ImportOrderStatus;
  orderDate: string;
  expectedEtd: string | null;
  expectedEta: string | null;
  currency: Currency;
  exchangeRate: number | null;
  paymentTerms: string | null;
  totalAmount: number;
  totalAmountKrw: number | null;
  requestedBy: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  memo: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportOrderItem {
  id: string;
  importOrderId: string;
  itemId: string;
  widthMm: number;
  quantity: number;
  weightKg: number | null;
  unitPrice: number;
  totalPrice: number;
  shippedQuantity: number;
  receivedQuantity: number;
  notes: string | null;
  createdAt: string;
}

export interface ImportOrderItemWithRelations extends ImportOrderItem {
  item: Item & { paperType: PaperType; brand: Brand | null };
}

export interface ImportOrderWithRelations extends ImportOrder {
  partner: Partner;
  requestedByUser: Pick<User, "id" | "displayName" | "email">;
  confirmedByUser: Pick<User, "id" | "displayName" | "email"> | null;
  items: ImportOrderItemWithRelations[];
  itemCount: number;
  totalQuantity: number;
  totalShipped: number;
  totalReceived: number;
  shipmentCount: number;
}

export interface Shipment {
  id: string;
  importOrderId: string;
  shipmentNumber: string;
  blNumber: string | null;
  vesselName: string | null;
  voyageNumber: string | null;
  containerNumbers: string[];
  containerCount: number;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  etd: string | null;
  eta: string | null;
  actualDepartureDate: string | null;
  actualArrivalDate: string | null;
  customsClearedDate: string | null;
  deliveredDate: string | null;
  destinationLocationId: string | null;
  status: ShipmentStatus;
  documents: ShipmentDocument[];
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentDocument {
  type: "bl" | "invoice" | "packing_list" | "certificate" | "other";
  filename: string;
  url: string;
  uploadedAt: string;
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  importOrderItemId: string;
  shippedQuantity: number;
  receivedQuantity: number | null;
  damagedQuantity: number;
  notes: string | null;
  createdAt: string;
}

export interface ShipmentItemWithRelations extends ShipmentItem {
  importOrderItem: ImportOrderItemWithRelations;
}

export interface ShipmentWithRelations extends Shipment {
  importOrder: Pick<ImportOrder, "id" | "poNumber" | "partnerId">;
  partner: Pick<Partner, "id" | "name" | "partnerCode">;
  items: ShipmentItemWithRelations[];
  itemCount: number;
  totalShippedQuantity: number;
  totalReceivedQuantity: number | null;
  totalCostKrw: number;
}

export interface ImportCost {
  id: string;
  shipmentId: string | null;
  importOrderId: string | null;
  costType: ImportCostType;
  description: string | null;
  amount: number;
  currency: Currency;
  amountKrw: number | null;
  invoiceNumber: string | null;
  vendorName: string | null;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportHistory {
  id: string;
  importOrderId: string | null;
  shipmentId: string | null;
  entityType: "order" | "shipment";
  action: ImportHistoryAction;
  actorId: string;
  previousStatus: string | null;
  newStatus: string | null;
  changes: Record<string, unknown> | null;
  memo: string | null;
  createdAt: string;
}

export interface ImportHistoryWithActor extends ImportHistory {
  actor: Pick<User, "id" | "displayName" | "email">;
}

export interface LandedCostSummary {
  importOrderId: string;
  poNumber: string;
  partnerId: string;
  partnerName: string;
  totalAmount: number;
  currency: Currency;
  goodsValueKrw: number | null;
  freightKrw: number;
  insuranceKrw: number;
  tariffKrw: number;
  vatKrw: number;
  customsFeeKrw: number;
  inlandTransportKrw: number;
  otherCostsKrw: number;
  totalLandedCostKrw: number;
  costPercentage: number;
}

export interface ImportOrdersResponse {
  data: ImportOrderWithRelations[];
  total: number;
  limit: number;
  offset: number;
}

export interface ShipmentsResponse {
  data: ShipmentWithRelations[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImportOrderResult {
  importOrder: ImportOrderWithRelations;
  history: ImportHistory;
}

export interface ShipmentResult {
  shipment: ShipmentWithRelations;
  history: ImportHistory;
}
