import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  ImportOrderWithRelations,
  ImportOrdersResponse,
  ImportOrderResult,
  ShipmentWithRelations,
  ShipmentsResponse,
  ShipmentResult,
  ImportCost,
  ImportHistory,
  ImportHistoryWithActor,
  ImportOrderSearchInput,
  CreateImportOrderInput,
  UpdateImportOrderInput,
  ConfirmImportOrderInput,
  ShipmentSearchInput,
  CreateShipmentInput,
  UpdateShipmentInput,
  UpdateShipmentStatusInput,
  ReceiveShipmentInput,
  ImportCostSearchInput,
  CreateImportCostInput,
  UpdateImportCostInput,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import { mapUser, type DbUser } from "../../common/mappers";
import { handleSupabaseError } from "../../common/utils";
import {
  IMPORT_ORDER_STATUS,
  SHIPMENT_STATUS,
  ENTITY_TYPE,
  HISTORY_ACTION,
  type DbImportOrderWithRelations,
  type DbShipmentWithRelations,
  type DbImportCost,
  type DbImportHistory,
} from "./import.types";
import {
  mapImportOrderWithRelations,
  mapShipmentWithRelations,
  mapImportCost,
  mapImportHistory,
} from "./import.mapper";

@Injectable()
export class ImportService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private readonly orderSelectQuery = `
    *,
    partners (*),
    requested_user:users!import_orders_requested_by_fkey (id, display_name, email),
    confirmed_user:users!import_orders_confirmed_by_fkey (id, display_name, email),
    import_order_items (
      *,
      items (
        *,
        paper_types (*),
        brands (*)
      )
    )
  `;

  private readonly shipmentSelectQuery = `
    *,
    import_orders!shipments_import_order_id_fkey (id, po_number, partner_id),
    partners:import_orders!shipments_import_order_id_fkey (
      partners (id, name, partner_code)
    ),
    shipment_items (
      *,
      import_order_items (
        *,
        items (
          *,
          paper_types (*),
          brands (*)
        )
      )
    )
  `;

  async findAllOrders(
    search: ImportOrderSearchInput,
  ): Promise<ImportOrdersResponse> {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from("import_orders")
      .select(this.orderSelectQuery, { count: "exact" });

    if (search.partnerId) {
      query = query.eq("partner_id", search.partnerId);
    }
    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.statuses && search.statuses.length > 0) {
      query = query.in("status", search.statuses);
    }
    if (search.currency) {
      query = query.eq("currency", search.currency);
    }
    if (search.orderDateFrom) {
      query = query.gte("order_date", search.orderDateFrom);
    }
    if (search.orderDateTo) {
      query = query.lte("order_date", search.orderDateTo);
    }
    if (search.etaFrom) {
      query = query.gte("expected_eta", search.etaFrom);
    }
    if (search.etaTo) {
      query = query.lte("expected_eta", search.etaTo);
    }
    if (search.q) {
      query = query.ilike("po_number", `%${search.q}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch import orders",
        resource: "ImportOrder",
      });
    }

    const orders = await Promise.all(
      (data as DbImportOrderWithRelations[]).map(async (db) => {
        const order = mapImportOrderWithRelations(db);
        const { count: shipmentCount } = await client
          .from("shipments")
          .select("id", { count: "exact", head: true })
          .eq("import_order_id", db.id);
        return { ...order, shipmentCount: shipmentCount ?? 0 };
      }),
    );

    return {
      data: orders,
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  async findOneOrder(id: string): Promise<ImportOrderWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("import_orders")
      .select(this.orderSelectQuery)
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Import order with ID ${id} not found`);
    }

    const order = mapImportOrderWithRelations(
      data as DbImportOrderWithRelations,
    );

    const { count: shipmentCount } = await client
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("import_order_id", id);

    return { ...order, shipmentCount: shipmentCount ?? 0 };
  }

  async createOrder(
    input: CreateImportOrderInput,
    requestedBy: string,
  ): Promise<ImportOrderResult> {
    const client = this.supabaseService.getServiceClient();

    const { data: partner, error: partnerError } = await client
      .from("partners")
      .select("id, partner_type")
      .eq("id", input.partnerId)
      .eq("is_active", true)
      .single();

    if (partnerError || !partner) {
      throw new BadRequestException(
        `Invalid or inactive partner: ${input.partnerId}`,
      );
    }

    if (!["supplier", "both"].includes(partner.partner_type)) {
      throw new BadRequestException(
        `Partner ${input.partnerId} is not a supplier`,
      );
    }

    for (const item of input.items) {
      const { data: itemData, error: itemError } = await client
        .from("items")
        .select("id")
        .eq("id", item.itemId)
        .eq("is_active", true)
        .single();

      if (itemError || !itemData) {
        throw new BadRequestException(
          `Invalid or inactive item: ${item.itemId}`,
        );
      }
    }

    const { data: poNumber, error: poNumberError } =
      await client.rpc("generate_po_number");

    if (poNumberError) throw new BadRequestException(poNumberError.message);

    const { data: orderData, error: orderError } = await client
      .from("import_orders")
      .insert({
        po_number: poNumber,
        partner_id: input.partnerId,
        status: IMPORT_ORDER_STATUS.DRAFT,
        order_date: input.orderDate ?? new Date().toISOString().slice(0, 10),
        expected_etd: input.expectedEtd ?? null,
        expected_eta: input.expectedEta ?? null,
        currency: input.currency,
        exchange_rate: input.exchangeRate ?? null,
        payment_terms: input.paymentTerms ?? null,
        memo: input.memo ?? null,
        internal_notes: input.internalNotes ?? null,
        requested_by: requestedBy,
      })
      .select()
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    const itemsToInsert = input.items.map((item) => ({
      import_order_id: orderData.id,
      item_id: item.itemId,
      width_mm: item.widthMm,
      quantity: item.quantity,
      weight_kg: item.weightKg ?? null,
      unit_price: item.unitPrice,
      notes: item.notes ?? null,
    }));

    const { error: itemsError } = await client
      .from("import_order_items")
      .insert(itemsToInsert);

    if (itemsError) throw new BadRequestException(itemsError.message);

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        import_order_id: orderData.id,
        entity_type: ENTITY_TYPE.ORDER,
        action: HISTORY_ACTION.CREATED,
        actor_id: requestedBy,
        previous_status: null,
        new_status: IMPORT_ORDER_STATUS.DRAFT,
        changes: { items: input.items },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const importOrder = await this.findOneOrder(orderData.id);

    await this.auditService.log({
      action: "import_order_created",
      category: "import",
      targetTable: "import_orders",
      targetId: orderData.id,
      metadata: {
        poNumber,
        partnerId: input.partnerId,
        currency: input.currency,
        itemCount: input.items.length,
      },
    });

    return {
      importOrder,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async updateOrder(
    id: string,
    input: UpdateImportOrderInput,
    userId: string,
  ): Promise<ImportOrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOneOrder(id);

    if (existingOrder.status !== IMPORT_ORDER_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot update order in status: ${existingOrder.status}`,
      );
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    if (
      input.expectedEtd !== undefined &&
      input.expectedEtd !== existingOrder.expectedEtd
    ) {
      updateData.expected_etd = input.expectedEtd;
      changes.expectedEtd = {
        before: existingOrder.expectedEtd,
        after: input.expectedEtd,
      };
    }
    if (
      input.expectedEta !== undefined &&
      input.expectedEta !== existingOrder.expectedEta
    ) {
      updateData.expected_eta = input.expectedEta;
      changes.expectedEta = {
        before: existingOrder.expectedEta,
        after: input.expectedEta,
      };
    }
    if (
      input.exchangeRate !== undefined &&
      input.exchangeRate !== existingOrder.exchangeRate
    ) {
      updateData.exchange_rate = input.exchangeRate;
      changes.exchangeRate = {
        before: existingOrder.exchangeRate,
        after: input.exchangeRate,
      };
    }
    if (
      input.paymentTerms !== undefined &&
      input.paymentTerms !== existingOrder.paymentTerms
    ) {
      updateData.payment_terms = input.paymentTerms;
      changes.paymentTerms = {
        before: existingOrder.paymentTerms,
        after: input.paymentTerms,
      };
    }
    if (input.memo !== undefined && input.memo !== existingOrder.memo) {
      updateData.memo = input.memo;
      changes.memo = { before: existingOrder.memo, after: input.memo };
    }
    if (
      input.internalNotes !== undefined &&
      input.internalNotes !== existingOrder.internalNotes
    ) {
      updateData.internal_notes = input.internalNotes;
      changes.internalNotes = {
        before: existingOrder.internalNotes,
        after: input.internalNotes,
      };
    }

    if (Object.keys(updateData).length === 0) {
      return {
        importOrder: existingOrder,
        history: {
          id: "",
          importOrderId: id,
          shipmentId: null,
          entityType: ENTITY_TYPE.ORDER,
          action: HISTORY_ACTION.UPDATED,
          actorId: userId,
          previousStatus: existingOrder.status,
          newStatus: existingOrder.status,
          changes: null,
          memo: null,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const { error: updateError } = await client
      .from("import_orders")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        import_order_id: id,
        entity_type: ENTITY_TYPE.ORDER,
        action: HISTORY_ACTION.UPDATED,
        actor_id: userId,
        previous_status: existingOrder.status,
        new_status: existingOrder.status,
        changes,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const importOrder = await this.findOneOrder(id);

    await this.auditService.log({
      action: "import_order_updated",
      category: "import",
      targetTable: "import_orders",
      targetId: id,
      metadata: { changes },
    });

    return {
      importOrder,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async confirmOrder(
    id: string,
    input: ConfirmImportOrderInput,
    userId: string,
  ): Promise<ImportOrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOneOrder(id);

    if (existingOrder.status !== IMPORT_ORDER_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot confirm order in status: ${existingOrder.status}`,
      );
    }

    if (existingOrder.items.length === 0) {
      throw new BadRequestException("Cannot confirm order with no items");
    }

    const updateData: Record<string, unknown> = {
      status: IMPORT_ORDER_STATUS.CONFIRMED,
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    };

    if (input.exchangeRate !== undefined) {
      updateData.exchange_rate = input.exchangeRate;
    }

    const { error: updateError } = await client
      .from("import_orders")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        import_order_id: id,
        entity_type: ENTITY_TYPE.ORDER,
        action: HISTORY_ACTION.CONFIRMED,
        actor_id: userId,
        previous_status: IMPORT_ORDER_STATUS.DRAFT,
        new_status: IMPORT_ORDER_STATUS.CONFIRMED,
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const importOrder = await this.findOneOrder(id);

    await this.auditService.log({
      action: "import_order_confirmed",
      category: "import",
      targetTable: "import_orders",
      targetId: id,
      metadata: {
        exchangeRate: input.exchangeRate,
        totalAmount: existingOrder.totalAmount,
      },
    });

    return {
      importOrder,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async cancelOrder(
    id: string,
    userId: string,
    memo?: string,
  ): Promise<ImportOrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOneOrder(id);

    const cancellableStatuses = [
      IMPORT_ORDER_STATUS.DRAFT,
      IMPORT_ORDER_STATUS.CONFIRMED,
    ];

    if (
      !cancellableStatuses.includes(
        existingOrder.status as (typeof cancellableStatuses)[number],
      )
    ) {
      throw new BadRequestException(
        `Cannot cancel order in status: ${existingOrder.status}`,
      );
    }

    const { count: shipmentCount } = await client
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("import_order_id", id)
      .neq("status", SHIPMENT_STATUS.CANCELLED);

    if (shipmentCount && shipmentCount > 0) {
      throw new BadRequestException(
        "Cannot cancel order with active shipments",
      );
    }

    const { error: updateError } = await client
      .from("import_orders")
      .update({ status: IMPORT_ORDER_STATUS.CANCELLED })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        import_order_id: id,
        entity_type: ENTITY_TYPE.ORDER,
        action: HISTORY_ACTION.CANCELLED,
        actor_id: userId,
        previous_status: existingOrder.status,
        new_status: IMPORT_ORDER_STATUS.CANCELLED,
        memo: memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const importOrder = await this.findOneOrder(id);

    await this.auditService.log({
      action: "import_order_cancelled",
      category: "import",
      targetTable: "import_orders",
      targetId: id,
      metadata: { previousStatus: existingOrder.status, memo },
    });

    return {
      importOrder,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async getOrderHistory(orderId: string): Promise<ImportHistoryWithActor[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("import_history")
      .select(
        `
        *,
        actor:users!import_history_actor_id_fkey (id, display_name, email)
      `,
      )
      .eq("import_order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch import order history",
        resource: "ImportHistory",
      });
    }

    return (data || []).map((h) => ({
      ...mapImportHistory(h as DbImportHistory),
      actor: mapUser((h as { actor: DbUser }).actor)!,
    }));
  }

  async findAllShipments(
    search: ShipmentSearchInput,
  ): Promise<ShipmentsResponse> {
    const client = this.supabaseService.getServiceClient();

    let query = client.from("shipments").select(
      `
        *,
        import_orders (id, po_number, partner_id, partners (id, name, partner_code)),
        shipment_items (
          *,
          import_order_items (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          )
        )
      `,
      { count: "exact" },
    );

    if (search.importOrderId) {
      query = query.eq("import_order_id", search.importOrderId);
    }
    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.statuses && search.statuses.length > 0) {
      query = query.in("status", search.statuses);
    }
    if (search.etaFrom) {
      query = query.gte("eta", search.etaFrom);
    }
    if (search.etaTo) {
      query = query.lte("eta", search.etaTo);
    }
    if (search.q) {
      query = query.or(
        `shipment_number.ilike.%${search.q}%,bl_number.ilike.%${search.q}%`,
      );
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch shipments",
        resource: "Shipment",
      });
    }

    const shipments = (data || []).map((db) => {
      const importOrder = db.import_orders as {
        id: string;
        po_number: string;
        partner_id: string;
        partners: { id: string; name: string; partner_code: string };
      };

      return mapShipmentWithRelations({
        ...db,
        import_orders: {
          id: importOrder.id,
          po_number: importOrder.po_number,
          partner_id: importOrder.partner_id,
        },
        partners: importOrder.partners,
        shipment_items: db.shipment_items || [],
      } as DbShipmentWithRelations);
    });

    return {
      data: shipments,
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  async findOneShipment(id: string): Promise<ShipmentWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("shipments")
      .select(
        `
        *,
        import_orders (id, po_number, partner_id, partners (id, name, partner_code)),
        shipment_items (
          *,
          import_order_items (
            *,
            items (
              *,
              paper_types (*),
              brands (*)
            )
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    const importOrder = data.import_orders as {
      id: string;
      po_number: string;
      partner_id: string;
      partners: { id: string; name: string; partner_code: string };
    };

    return mapShipmentWithRelations({
      ...data,
      import_orders: {
        id: importOrder.id,
        po_number: importOrder.po_number,
        partner_id: importOrder.partner_id,
      },
      partners: importOrder.partners,
      shipment_items: data.shipment_items || [],
    } as DbShipmentWithRelations);
  }

  async createShipment(
    input: CreateShipmentInput,
    userId: string,
  ): Promise<ShipmentResult> {
    const client = this.supabaseService.getServiceClient();

    const order = await this.findOneOrder(input.importOrderId);

    const shippableStatuses = [
      IMPORT_ORDER_STATUS.CONFIRMED,
      IMPORT_ORDER_STATUS.PARTIALLY_SHIPPED,
    ];

    if (
      !shippableStatuses.includes(
        order.status as (typeof shippableStatuses)[number],
      )
    ) {
      throw new BadRequestException(
        `Cannot create shipment for order in status: ${order.status}`,
      );
    }

    for (const item of input.items) {
      const orderItem = order.items.find(
        (oi) => oi.id === item.importOrderItemId,
      );
      if (!orderItem) {
        throw new BadRequestException(
          `Order item not found: ${item.importOrderItemId}`,
        );
      }

      const remainingQty = orderItem.quantity - orderItem.shippedQuantity;
      if (item.shippedQuantity > remainingQty) {
        throw new BadRequestException(
          `Cannot ship ${item.shippedQuantity} units of item ${item.importOrderItemId}. Only ${remainingQty} remaining.`,
        );
      }
    }

    const { data: shipmentNumber, error: shipmentNumberError } =
      await client.rpc("generate_shipment_number");

    if (shipmentNumberError)
      throw new BadRequestException(shipmentNumberError.message);

    const { data: shipmentData, error: shipmentError } = await client
      .from("shipments")
      .insert({
        import_order_id: input.importOrderId,
        shipment_number: shipmentNumber,
        bl_number: input.blNumber ?? null,
        vessel_name: input.vesselName ?? null,
        voyage_number: input.voyageNumber ?? null,
        container_numbers: input.containerNumbers ?? null,
        container_count: input.containerCount,
        port_of_loading: input.portOfLoading ?? null,
        port_of_discharge: input.portOfDischarge ?? null,
        etd: input.etd ?? null,
        eta: input.eta ?? null,
        status: SHIPMENT_STATUS.PENDING,
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (shipmentError) throw new BadRequestException(shipmentError.message);

    const itemsToInsert = input.items.map((item) => ({
      shipment_id: shipmentData.id,
      import_order_item_id: item.importOrderItemId,
      shipped_quantity: item.shippedQuantity,
      notes: item.notes ?? null,
    }));

    const { error: itemsError } = await client
      .from("shipment_items")
      .insert(itemsToInsert);

    if (itemsError) throw new BadRequestException(itemsError.message);

    const updatedOrder = await this.findOneOrder(input.importOrderId);
    const allShipped = updatedOrder.items.every(
      (item) => item.shippedQuantity >= item.quantity,
    );
    const anyShipped = updatedOrder.items.some(
      (item) => item.shippedQuantity > 0,
    );

    if (allShipped) {
      await client
        .from("import_orders")
        .update({ status: IMPORT_ORDER_STATUS.SHIPPED })
        .eq("id", input.importOrderId);
    } else if (anyShipped) {
      await client
        .from("import_orders")
        .update({ status: IMPORT_ORDER_STATUS.PARTIALLY_SHIPPED })
        .eq("id", input.importOrderId);
    }

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        shipment_id: shipmentData.id,
        entity_type: ENTITY_TYPE.SHIPMENT,
        action: HISTORY_ACTION.CREATED,
        actor_id: userId,
        previous_status: null,
        new_status: SHIPMENT_STATUS.PENDING,
        changes: { items: input.items },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const shipment = await this.findOneShipment(shipmentData.id);

    await this.auditService.log({
      action: "shipment_created",
      category: "import",
      targetTable: "shipments",
      targetId: shipmentData.id,
      metadata: {
        shipmentNumber,
        importOrderId: input.importOrderId,
        itemCount: input.items.length,
      },
    });

    return {
      shipment,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async updateShipment(
    id: string,
    input: UpdateShipmentInput,
    userId: string,
  ): Promise<ShipmentResult> {
    const client = this.supabaseService.getServiceClient();
    const existingShipment = await this.findOneShipment(id);

    const editableStatuses = [
      SHIPMENT_STATUS.PENDING,
      SHIPMENT_STATUS.DEPARTED,
    ];
    if (
      !editableStatuses.includes(
        existingShipment.status as (typeof editableStatuses)[number],
      )
    ) {
      throw new BadRequestException(
        `Cannot update shipment in status: ${existingShipment.status}`,
      );
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    const fieldsToUpdate = [
      { key: "blNumber", dbKey: "bl_number" },
      { key: "vesselName", dbKey: "vessel_name" },
      { key: "voyageNumber", dbKey: "voyage_number" },
      { key: "containerNumbers", dbKey: "container_numbers" },
      { key: "containerCount", dbKey: "container_count" },
      { key: "portOfLoading", dbKey: "port_of_loading" },
      { key: "portOfDischarge", dbKey: "port_of_discharge" },
      { key: "etd", dbKey: "etd" },
      { key: "eta", dbKey: "eta" },
      { key: "actualDepartureDate", dbKey: "actual_departure_date" },
      { key: "actualArrivalDate", dbKey: "actual_arrival_date" },
      { key: "customsClearedDate", dbKey: "customs_cleared_date" },
      { key: "deliveredDate", dbKey: "delivered_date" },
      { key: "memo", dbKey: "memo" },
    ] as const;

    for (const { key, dbKey } of fieldsToUpdate) {
      const inputValue = input[key as keyof UpdateShipmentInput];
      const existingValue =
        existingShipment[key as keyof typeof existingShipment];
      if (inputValue !== undefined && inputValue !== existingValue) {
        updateData[dbKey] = inputValue;
        changes[key] = { before: existingValue, after: inputValue };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return {
        shipment: existingShipment,
        history: {
          id: "",
          importOrderId: null,
          shipmentId: id,
          entityType: ENTITY_TYPE.SHIPMENT,
          action: HISTORY_ACTION.UPDATED,
          actorId: userId,
          previousStatus: existingShipment.status,
          newStatus: existingShipment.status,
          changes: null,
          memo: null,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const { error: updateError } = await client
      .from("shipments")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        shipment_id: id,
        entity_type: ENTITY_TYPE.SHIPMENT,
        action: HISTORY_ACTION.UPDATED,
        actor_id: userId,
        previous_status: existingShipment.status,
        new_status: existingShipment.status,
        changes,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const shipment = await this.findOneShipment(id);

    await this.auditService.log({
      action: "shipment_updated",
      category: "import",
      targetTable: "shipments",
      targetId: id,
      metadata: { changes },
    });

    return {
      shipment,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async updateShipmentStatus(
    id: string,
    input: UpdateShipmentStatusInput,
    userId: string,
  ): Promise<ShipmentResult> {
    const client = this.supabaseService.getServiceClient();
    const existingShipment = await this.findOneShipment(id);

    const updateData: Record<string, unknown> = {
      status: input.status,
    };

    if (input.actualDepartureDate) {
      updateData.actual_departure_date = input.actualDepartureDate;
    }
    if (input.actualArrivalDate) {
      updateData.actual_arrival_date = input.actualArrivalDate;
    }
    if (input.customsClearedDate) {
      updateData.customs_cleared_date = input.customsClearedDate;
    }
    if (input.deliveredDate) {
      updateData.delivered_date = input.deliveredDate;
    }

    const { error: updateError } = await client
      .from("shipments")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    if (input.status === SHIPMENT_STATUS.ARRIVED) {
      await client
        .from("import_orders")
        .update({ status: IMPORT_ORDER_STATUS.ARRIVED })
        .eq("id", existingShipment.importOrderId);
    } else if (input.status === SHIPMENT_STATUS.CUSTOMS_HOLD) {
      await client
        .from("import_orders")
        .update({ status: IMPORT_ORDER_STATUS.CUSTOMS_CLEARING })
        .eq("id", existingShipment.importOrderId);
    } else if (input.status === SHIPMENT_STATUS.CUSTOMS_CLEARED) {
      await client
        .from("import_orders")
        .update({ status: IMPORT_ORDER_STATUS.CLEARED })
        .eq("id", existingShipment.importOrderId);
    }

    const actionMap: Record<string, string> = {
      departed: HISTORY_ACTION.SHIPPED,
      arrived: HISTORY_ACTION.ARRIVED,
      customs_hold: HISTORY_ACTION.CUSTOMS_STARTED,
      customs_cleared: HISTORY_ACTION.CUSTOMS_CLEARED,
      delivered: HISTORY_ACTION.COMPLETED,
    };

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        shipment_id: id,
        entity_type: ENTITY_TYPE.SHIPMENT,
        action: actionMap[input.status] || HISTORY_ACTION.UPDATED,
        actor_id: userId,
        previous_status: existingShipment.status,
        new_status: input.status,
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const shipment = await this.findOneShipment(id);

    await this.auditService.log({
      action: "shipment_status_updated",
      category: "import",
      targetTable: "shipments",
      targetId: id,
      metadata: {
        previousStatus: existingShipment.status,
        newStatus: input.status,
      },
    });

    return {
      shipment,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async receiveShipment(
    id: string,
    input: ReceiveShipmentInput,
    userId: string,
  ): Promise<ShipmentResult> {
    const client = this.supabaseService.getServiceClient();
    const existingShipment = await this.findOneShipment(id);

    if (existingShipment.status !== SHIPMENT_STATUS.CUSTOMS_CLEARED) {
      throw new BadRequestException(
        `Cannot receive shipment in status: ${existingShipment.status}`,
      );
    }

    for (const item of input.items) {
      const { error: itemError } = await client
        .from("shipment_items")
        .update({
          received_quantity: item.receivedQuantity,
          damaged_quantity: item.damagedQuantity,
          notes: item.notes ?? null,
        })
        .eq("id", item.shipmentItemId);

      if (itemError) throw new BadRequestException(itemError.message);
    }

    const { error: updateError } = await client
      .from("shipments")
      .update({
        status: SHIPMENT_STATUS.DELIVERED,
        delivered_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const updatedOrder = await this.findOneOrder(
      existingShipment.importOrderId,
    );
    const allReceived = updatedOrder.items.every(
      (item) => item.receivedQuantity >= item.quantity,
    );

    if (allReceived) {
      await client
        .from("import_orders")
        .update({ status: IMPORT_ORDER_STATUS.COMPLETED })
        .eq("id", existingShipment.importOrderId);
    }

    const { data: historyData, error: historyError } = await client
      .from("import_history")
      .insert({
        shipment_id: id,
        entity_type: ENTITY_TYPE.SHIPMENT,
        action: HISTORY_ACTION.COMPLETED,
        actor_id: userId,
        previous_status: SHIPMENT_STATUS.CUSTOMS_CLEARED,
        new_status: SHIPMENT_STATUS.DELIVERED,
        changes: { receivedItems: input.items },
        memo: input.memo ?? null,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const shipment = await this.findOneShipment(id);

    await this.auditService.log({
      action: "shipment_received",
      category: "import",
      targetTable: "shipments",
      targetId: id,
      metadata: { itemCount: input.items.length },
    });

    return {
      shipment,
      history: mapImportHistory(historyData as DbImportHistory),
    };
  }

  async getShipmentHistory(
    shipmentId: string,
  ): Promise<ImportHistoryWithActor[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("import_history")
      .select(
        `
        *,
        actor:users!import_history_actor_id_fkey (id, display_name, email)
      `,
      )
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: true });

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch shipment history",
        resource: "ImportHistory",
      });
    }

    return (data || []).map((h) => ({
      ...mapImportHistory(h as DbImportHistory),
      actor: mapUser((h as { actor: DbUser }).actor)!,
    }));
  }

  async findAllCosts(search: ImportCostSearchInput): Promise<ImportCost[]> {
    const client = this.supabaseService.getServiceClient();

    let query = client.from("import_costs").select("*");

    if (search.shipmentId) {
      query = query.eq("shipment_id", search.shipmentId);
    }
    if (search.importOrderId) {
      query = query.eq("import_order_id", search.importOrderId);
    }
    if (search.costType) {
      query = query.eq("cost_type", search.costType);
    }
    if (search.isPaid !== undefined) {
      query = query.eq("is_paid", search.isPaid);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch import costs",
        resource: "ImportCost",
      });
    }

    return (data as DbImportCost[]).map((db) => mapImportCost(db));
  }

  async createCost(
    input: CreateImportCostInput,
    userId: string,
  ): Promise<ImportCost> {
    const client = this.supabaseService.getServiceClient();

    if (!input.shipmentId && !input.importOrderId) {
      throw new BadRequestException(
        "Either shipmentId or importOrderId must be provided",
      );
    }

    if (input.shipmentId) {
      await this.findOneShipment(input.shipmentId);
    }
    if (input.importOrderId) {
      await this.findOneOrder(input.importOrderId);
    }

    const { data, error } = await client
      .from("import_costs")
      .insert({
        shipment_id: input.shipmentId ?? null,
        import_order_id: input.importOrderId ?? null,
        cost_type: input.costType,
        description: input.description ?? null,
        amount: input.amount,
        currency: input.currency,
        amount_krw: input.amountKrw ?? null,
        invoice_number: input.invoiceNumber ?? null,
        vendor_name: input.vendorName ?? null,
        is_paid: input.isPaid,
        paid_at: input.paidAt ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.auditService.log({
      action: "import_cost_created",
      category: "import",
      targetTable: "import_costs",
      targetId: data.id,
      metadata: {
        costType: input.costType,
        amount: input.amount,
        currency: input.currency,
      },
    });

    return mapImportCost(data as DbImportCost);
  }

  async updateCost(
    id: string,
    input: UpdateImportCostInput,
    userId: string,
  ): Promise<ImportCost> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: existingError } = await client
      .from("import_costs")
      .select("*")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      throw new NotFoundException(`Import cost with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};

    if (input.costType !== undefined) updateData.cost_type = input.costType;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.amountKrw !== undefined) updateData.amount_krw = input.amountKrw;
    if (input.invoiceNumber !== undefined)
      updateData.invoice_number = input.invoiceNumber;
    if (input.vendorName !== undefined)
      updateData.vendor_name = input.vendorName;
    if (input.isPaid !== undefined) updateData.is_paid = input.isPaid;
    if (input.paidAt !== undefined) updateData.paid_at = input.paidAt;
    if (input.notes !== undefined) updateData.notes = input.notes;

    if (Object.keys(updateData).length === 0) {
      return mapImportCost(existing as DbImportCost);
    }

    const { data, error } = await client
      .from("import_costs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.auditService.log({
      action: "import_cost_updated",
      category: "import",
      targetTable: "import_costs",
      targetId: id,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return mapImportCost(data as DbImportCost);
  }

  async deleteCost(id: string, userId: string): Promise<void> {
    const client = this.supabaseService.getServiceClient();

    const { error: existingError } = await client
      .from("import_costs")
      .select("id")
      .eq("id", id)
      .single();

    if (existingError) {
      throw new NotFoundException(`Import cost with ID ${id} not found`);
    }

    const { error } = await client.from("import_costs").delete().eq("id", id);

    if (error) throw new BadRequestException(error.message);

    await this.auditService.log({
      action: "import_cost_deleted",
      category: "import",
      targetTable: "import_costs",
      targetId: id,
    });
  }
}
