import { z } from "zod";
import {
  IMPORT_ORDER_STATUSES,
  SHIPMENT_STATUSES,
  IMPORT_COST_TYPES,
  CURRENCIES,
} from "../types/import";

export const importOrderSearchSchema = z.object({
  partnerId: z.string().uuid().optional(),
  status: z.enum(IMPORT_ORDER_STATUSES).optional(),
  statuses: z.array(z.enum(IMPORT_ORDER_STATUSES)).optional(),
  currency: z.enum(CURRENCIES).optional(),
  orderDateFrom: z.string().optional(),
  orderDateTo: z.string().optional(),
  etaFrom: z.string().optional(),
  etaTo: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
export type ImportOrderSearchInput = z.infer<typeof importOrderSearchSchema>;

export const createImportOrderItemSchema = z.object({
  itemId: z.string().uuid(),
  widthMm: z.number().int().min(50).max(2500),
  quantity: z.number().int().min(1),
  weightKg: z.number().positive().optional(),
  unitPrice: z.number().positive(),
  notes: z.string().optional(),
});
export type CreateImportOrderItemInput = z.infer<
  typeof createImportOrderItemSchema
>;

export const createImportOrderSchema = z.object({
  partnerId: z.string().uuid(),
  orderDate: z.string().optional(),
  expectedEtd: z.string().optional(),
  expectedEta: z.string().optional(),
  currency: z.enum(CURRENCIES).default("USD"),
  exchangeRate: z.number().positive().optional(),
  paymentTerms: z.string().optional(),
  memo: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(createImportOrderItemSchema).min(1),
});
export type CreateImportOrderInput = z.infer<typeof createImportOrderSchema>;

export const updateImportOrderSchema = z.object({
  expectedEtd: z.string().optional(),
  expectedEta: z.string().optional(),
  exchangeRate: z.number().positive().optional(),
  paymentTerms: z.string().optional(),
  memo: z.string().optional(),
  internalNotes: z.string().optional(),
});
export type UpdateImportOrderInput = z.infer<typeof updateImportOrderSchema>;

export const confirmImportOrderSchema = z.object({
  exchangeRate: z.number().positive().optional(),
  memo: z.string().optional(),
});
export type ConfirmImportOrderInput = z.infer<typeof confirmImportOrderSchema>;

export const shipmentSearchSchema = z.object({
  importOrderId: z.string().uuid().optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  statuses: z.array(z.enum(SHIPMENT_STATUSES)).optional(),
  etaFrom: z.string().optional(),
  etaTo: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
export type ShipmentSearchInput = z.infer<typeof shipmentSearchSchema>;

export const createShipmentItemSchema = z.object({
  importOrderItemId: z.string().uuid(),
  shippedQuantity: z.number().int().min(1),
  notes: z.string().optional(),
});
export type CreateShipmentItemInput = z.infer<typeof createShipmentItemSchema>;

export const createShipmentSchema = z.object({
  importOrderId: z.string().uuid(),
  blNumber: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  containerNumbers: z.array(z.string()).optional(),
  containerCount: z.number().int().min(1).default(1),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  etd: z.string().optional(),
  eta: z.string().optional(),
  destinationLocationId: z.string().uuid().optional(),
  memo: z.string().optional(),
  items: z.array(createShipmentItemSchema).min(1),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const updateShipmentSchema = z.object({
  blNumber: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  containerNumbers: z.array(z.string()).optional(),
  containerCount: z.number().int().min(1).optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  etd: z.string().optional(),
  eta: z.string().optional(),
  actualDepartureDate: z.string().optional(),
  actualArrivalDate: z.string().optional(),
  customsClearedDate: z.string().optional(),
  deliveredDate: z.string().optional(),
  destinationLocationId: z.string().uuid().optional(),
  memo: z.string().optional(),
});
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

export const updateShipmentStatusSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  actualDepartureDate: z.string().optional(),
  actualArrivalDate: z.string().optional(),
  customsClearedDate: z.string().optional(),
  deliveredDate: z.string().optional(),
  memo: z.string().optional(),
});
export type UpdateShipmentStatusInput = z.infer<
  typeof updateShipmentStatusSchema
>;

export const receiveShipmentItemSchema = z.object({
  shipmentItemId: z.string().uuid(),
  receivedQuantity: z.number().int().min(0),
  damagedQuantity: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});
export type ReceiveShipmentItemInput = z.infer<
  typeof receiveShipmentItemSchema
>;

export const receiveShipmentSchema = z.object({
  locationId: z.string().uuid(),
  items: z.array(receiveShipmentItemSchema).min(1),
  memo: z.string().optional(),
});
export type ReceiveShipmentInput = z.infer<typeof receiveShipmentSchema>;

export const createImportCostSchema = z.object({
  shipmentId: z.string().uuid().optional(),
  importOrderId: z.string().uuid().optional(),
  costType: z.enum(IMPORT_COST_TYPES),
  description: z.string().optional(),
  amount: z.number().min(0),
  currency: z.enum(CURRENCIES).default("KRW"),
  amountKrw: z.number().int().optional(),
  invoiceNumber: z.string().optional(),
  vendorName: z.string().optional(),
  isPaid: z.boolean().default(false),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateImportCostInput = z.infer<typeof createImportCostSchema>;

export const updateImportCostSchema = z.object({
  costType: z.enum(IMPORT_COST_TYPES).optional(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  currency: z.enum(CURRENCIES).optional(),
  amountKrw: z.number().int().optional(),
  invoiceNumber: z.string().optional(),
  vendorName: z.string().optional(),
  isPaid: z.boolean().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateImportCostInput = z.infer<typeof updateImportCostSchema>;

export const importCostSearchSchema = z.object({
  shipmentId: z.string().uuid().optional(),
  importOrderId: z.string().uuid().optional(),
  costType: z.enum(IMPORT_COST_TYPES).optional(),
  isPaid: z.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ImportCostSearchInput = z.infer<typeof importCostSearchSchema>;
