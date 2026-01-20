import type {
  ImportOrder,
  ImportOrderItem,
  ImportOrderItemWithRelations,
  ImportOrderWithRelations,
  Shipment,
  ShipmentItem,
  ShipmentItemWithRelations,
  ShipmentWithRelations,
  ShipmentDocument,
  ImportCost,
  ImportHistory,
  ImportOrderStatus,
  ShipmentStatus,
  ImportCostType,
  ImportHistoryAction,
  Currency,
} from "@repo/shared";
import {
  mapItem,
  mapPaperType,
  mapBrand,
  mapPartner,
  mapUser,
} from "../../common/mappers";
import type {
  DbImportOrder,
  DbImportOrderItem,
  DbImportOrderItemWithRelations,
  DbImportOrderWithRelations,
  DbShipment,
  DbShipmentItem,
  DbShipmentItemWithRelations,
  DbShipmentWithRelations,
  DbImportCost,
  DbImportHistory,
} from "./import.types";

export function mapImportOrder(db: DbImportOrder): ImportOrder {
  return {
    id: db.id,
    poNumber: db.po_number,
    partnerId: db.partner_id,
    status: db.status as ImportOrderStatus,
    orderDate: db.order_date,
    expectedEtd: db.expected_etd,
    expectedEta: db.expected_eta,
    currency: db.currency as Currency,
    exchangeRate: db.exchange_rate ? Number(db.exchange_rate) : null,
    paymentTerms: db.payment_terms,
    totalAmount: Number(db.total_amount),
    totalAmountKrw: db.total_amount_krw ? Number(db.total_amount_krw) : null,
    requestedBy: db.requested_by,
    confirmedBy: db.confirmed_by,
    confirmedAt: db.confirmed_at,
    memo: db.memo,
    internalNotes: db.internal_notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapImportOrderItem(db: DbImportOrderItem): ImportOrderItem {
  return {
    id: db.id,
    importOrderId: db.import_order_id,
    itemId: db.item_id,
    widthMm: db.width_mm,
    quantity: db.quantity,
    weightKg: db.weight_kg ? Number(db.weight_kg) : null,
    unitPrice: Number(db.unit_price),
    totalPrice: Number(db.total_price),
    shippedQuantity: db.shipped_quantity,
    receivedQuantity: db.received_quantity,
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function mapImportOrderItemWithRelations(
  db: DbImportOrderItemWithRelations,
): ImportOrderItemWithRelations {
  return {
    ...mapImportOrderItem(db),
    item: {
      ...mapItem(db.items),
      paperType: mapPaperType(db.items.paper_types),
      brand: db.items.brands ? mapBrand(db.items.brands) : null,
    },
  };
}

export function mapImportOrderWithRelations(
  db: DbImportOrderWithRelations,
): ImportOrderWithRelations {
  const order = mapImportOrder(db);
  const partner = mapPartner(db.partners);
  const requestedByUser = mapUser(db.requested_user)!;
  const confirmedByUser = mapUser(db.confirmed_user);

  const items = (db.import_order_items || []).map((item) =>
    mapImportOrderItemWithRelations(item),
  );

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalShipped = items.reduce(
    (sum, item) => sum + item.shippedQuantity,
    0,
  );
  const totalReceived = items.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0,
  );

  return {
    ...order,
    partner,
    requestedByUser,
    confirmedByUser,
    items,
    itemCount: items.length,
    totalQuantity,
    totalShipped,
    totalReceived,
    shipmentCount: 0,
  };
}

function parseDocuments(documents: unknown): ShipmentDocument[] {
  if (!documents) return [];
  if (Array.isArray(documents)) {
    return documents as ShipmentDocument[];
  }
  return [];
}

export function mapShipment(db: DbShipment): Shipment {
  return {
    id: db.id,
    importOrderId: db.import_order_id,
    shipmentNumber: db.shipment_number,
    blNumber: db.bl_number,
    vesselName: db.vessel_name,
    voyageNumber: db.voyage_number,
    containerNumbers: db.container_numbers || [],
    containerCount: db.container_count,
    portOfLoading: db.port_of_loading,
    portOfDischarge: db.port_of_discharge,
    etd: db.etd,
    eta: db.eta,
    actualDepartureDate: db.actual_departure_date,
    actualArrivalDate: db.actual_arrival_date,
    customsClearedDate: db.customs_cleared_date,
    deliveredDate: db.delivered_date,
    status: db.status as ShipmentStatus,
    documents: parseDocuments(db.documents),
    memo: db.memo,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapShipmentItem(db: DbShipmentItem): ShipmentItem {
  return {
    id: db.id,
    shipmentId: db.shipment_id,
    importOrderItemId: db.import_order_item_id,
    shippedQuantity: db.shipped_quantity,
    receivedQuantity: db.received_quantity,
    damagedQuantity: db.damaged_quantity,
    notes: db.notes,
    createdAt: db.created_at,
  };
}

export function mapShipmentItemWithRelations(
  db: DbShipmentItemWithRelations,
): ShipmentItemWithRelations {
  return {
    ...mapShipmentItem(db),
    importOrderItem: mapImportOrderItemWithRelations(db.import_order_items),
  };
}

export function mapShipmentWithRelations(
  db: DbShipmentWithRelations,
): ShipmentWithRelations {
  const shipment = mapShipment(db);
  const items = (db.shipment_items || []).map((item) =>
    mapShipmentItemWithRelations(item),
  );

  return {
    ...shipment,
    importOrder: {
      id: db.import_orders.id,
      poNumber: db.import_orders.po_number,
      partnerId: db.import_orders.partner_id,
    },
    partner: {
      id: db.partners.id,
      name: db.partners.name,
      partnerCode: db.partners.partner_code,
    },
    items,
    itemCount: items.length,
    totalShippedQuantity: items.reduce(
      (sum, item) => sum + item.shippedQuantity,
      0,
    ),
    totalReceivedQuantity: items.some((item) => item.receivedQuantity !== null)
      ? items.reduce((sum, item) => sum + (item.receivedQuantity ?? 0), 0)
      : null,
    totalCostKrw: 0,
  };
}

export function mapImportCost(db: DbImportCost): ImportCost {
  return {
    id: db.id,
    shipmentId: db.shipment_id,
    importOrderId: db.import_order_id,
    costType: db.cost_type as ImportCostType,
    description: db.description,
    amount: Number(db.amount),
    currency: db.currency as Currency,
    amountKrw: db.amount_krw ? Number(db.amount_krw) : null,
    invoiceNumber: db.invoice_number,
    vendorName: db.vendor_name,
    isPaid: db.is_paid,
    paidAt: db.paid_at,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapImportHistory(db: DbImportHistory): ImportHistory {
  return {
    id: db.id,
    importOrderId: db.import_order_id,
    shipmentId: db.shipment_id,
    entityType: db.entity_type as "order" | "shipment",
    action: db.action as ImportHistoryAction,
    actorId: db.actor_id,
    previousStatus: db.previous_status,
    newStatus: db.new_status,
    changes: db.changes,
    memo: db.memo,
    createdAt: db.created_at,
  };
}
