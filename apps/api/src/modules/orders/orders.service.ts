import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Order,
  OrderItem,
  OrderHistory,
  OrderWithRelations,
  OrderItemWithRelations,
  OrderHistoryWithActor,
  OrdersResponse,
  OrderType,
  OrderStatus,
  OrderReason,
  OrderHistoryAction,
  OrderSearchInput,
  CreateOrderInput,
  UpdateOrderInput,
  ProcessOrderInput,
  ApproveOrderInput,
  RejectOrderInput,
  UrgentApproveOrderInput,
  OrderResult,
  Item,
  PaperType,
  Brand,
  Stock,
  StockCondition,
  StockStatus,
  Partner,
  PartnerType,
  ItemForm,
} from "@repo/shared";
import { ORDER_IN_REASONS, ORDER_OUT_REASONS } from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import { StocksService } from "../stocks/stocks.service";

interface DbOrder {
  id: string;
  order_number: string;
  type: string;
  status: string;
  is_urgent: boolean;
  reason: string;
  partner_id: string | null;
  scheduled_date: string | null;
  memo: string | null;
  requested_by: string;
  processed_by: string | null;
  approved_by: string | null;
  processed_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DbOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  stock_id: string | null;
  width_mm: number;
  requested_qty: number;
  requested_weight_kg: number | null;
  processed_qty: number | null;
  processed_weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

interface DbOrderHistory {
  id: string;
  order_id: string;
  action: string;
  actor_id: string;
  memo: string | null;
  previous_status: string | null;
  new_status: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

interface DbPartner {
  id: string;
  partner_code: string;
  name: string;
  name_local: string | null;
  partner_type: string;
  country_code: string;
  address: string | null;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  supplier_currency: string | null;
  supplier_payment_terms: string | null;
  lead_time_days: number | null;
  customer_currency: string | null;
  customer_payment_terms: string | null;
  credit_limit: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbUser {
  id: string;
  display_name: string | null;
  email: string;
}

interface DbItem {
  id: string;
  item_code: string;
  display_name: string;
  paper_type_id: string;
  brand_id: string | null;
  grammage: number;
  form: string;
  core_diameter_inch: number | null;
  length_mm: number | null;
  sheets_per_ream: number | null;
  unit_of_measure: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbPaperType {
  id: string;
  code: string;
  name_en: string;
  name_ko: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface DbBrand {
  id: string;
  partner_id: string;
  code: string;
  name: string;
  internal_code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbStock {
  id: string;
  item_id: string;
  location_id: string;
  width_mm: number;
  condition: string;
  quantity: number;
  weight_kg: number | null;
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

interface DbOrderWithRelations extends DbOrder {
  partners: DbPartner | null;
  requested_user: DbUser;
  processed_user: DbUser | null;
  approved_user: DbUser | null;
  order_items: Array<
    DbOrderItem & {
      items: DbItem & {
        paper_types: DbPaperType;
        brands: DbBrand | null;
      };
      stocks: DbStock | null;
    }
  >;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
    private readonly stocksService: StocksService,
  ) {}

  private mapOrder(db: DbOrder): Order {
    return {
      id: db.id,
      orderNumber: db.order_number,
      type: db.type as OrderType,
      status: db.status as OrderStatus,
      isUrgent: db.is_urgent,
      reason: db.reason as OrderReason,
      partnerId: db.partner_id,
      scheduledDate: db.scheduled_date,
      memo: db.memo,
      requestedBy: db.requested_by,
      processedBy: db.processed_by,
      approvedBy: db.approved_by,
      processedAt: db.processed_at,
      approvedAt: db.approved_at,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapOrderItem(db: DbOrderItem): OrderItem {
    return {
      id: db.id,
      orderId: db.order_id,
      itemId: db.item_id,
      stockId: db.stock_id,
      widthMm: db.width_mm,
      requestedQty: db.requested_qty,
      requestedWeightKg: db.requested_weight_kg
        ? Number(db.requested_weight_kg)
        : null,
      processedQty: db.processed_qty,
      processedWeightKg: db.processed_weight_kg
        ? Number(db.processed_weight_kg)
        : null,
      notes: db.notes,
      createdAt: db.created_at,
    };
  }

  private mapOrderHistory(db: DbOrderHistory): OrderHistory {
    return {
      id: db.id,
      orderId: db.order_id,
      action: db.action as OrderHistoryAction,
      actorId: db.actor_id,
      memo: db.memo,
      previousStatus: db.previous_status as OrderStatus | null,
      newStatus: db.new_status as OrderStatus | null,
      changes: db.changes,
      createdAt: db.created_at,
    };
  }

  private mapPartner(db: DbPartner | null): Partner | null {
    if (!db) return null;
    return {
      id: db.id,
      partnerCode: db.partner_code,
      name: db.name,
      nameLocal: db.name_local,
      partnerType: db.partner_type as PartnerType,
      countryCode: db.country_code,
      address: db.address,
      city: db.city,
      contactName: db.contact_name,
      contactEmail: db.contact_email,
      contactPhone: db.contact_phone,
      supplierCurrency: db.supplier_currency,
      supplierPaymentTerms: db.supplier_payment_terms,
      leadTimeDays: db.lead_time_days,
      customerCurrency: db.customer_currency,
      customerPaymentTerms: db.customer_payment_terms,
      creditLimit: db.credit_limit ? Number(db.credit_limit) : null,
      isActive: db.is_active,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapUser(
    db: DbUser | null,
  ): { id: string; displayName: string; email: string } | null {
    if (!db) return null;
    return {
      id: db.id,
      displayName: db.display_name ?? db.email,
      email: db.email,
    };
  }

  private mapItem(db: DbItem): Item {
    return {
      id: db.id,
      itemCode: db.item_code,
      displayName: db.display_name,
      paperTypeId: db.paper_type_id,
      brandId: db.brand_id,
      grammage: db.grammage,
      form: db.form as ItemForm,
      coreDiameterInch: db.core_diameter_inch
        ? Number(db.core_diameter_inch)
        : null,
      lengthMm: db.length_mm,
      sheetsPerReam: db.sheets_per_ream,
      unitOfMeasure: db.unit_of_measure,
      isActive: db.is_active,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapPaperType(db: DbPaperType): PaperType {
    return {
      id: db.id,
      code: db.code,
      nameEn: db.name_en,
      nameKo: db.name_ko,
      description: db.description,
      sortOrder: db.sort_order,
      isActive: db.is_active,
      createdAt: db.created_at,
    };
  }

  private mapBrand(db: DbBrand | null): Brand | null {
    if (!db) return null;
    return {
      id: db.id,
      partnerId: db.partner_id,
      code: db.code,
      name: db.name,
      internalCode: db.internal_code,
      description: db.description,
      isActive: db.is_active,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapStock(db: DbStock | null): Stock | null {
    if (!db) return null;
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

  private mapOrderWithRelations(db: DbOrderWithRelations): OrderWithRelations {
    const order = this.mapOrder(db);
    const partner = this.mapPartner(db.partners);
    const requestedByUser = this.mapUser(db.requested_user)!;
    const processedByUser = this.mapUser(db.processed_user);
    const approvedByUser = this.mapUser(db.approved_user);

    const items: OrderItemWithRelations[] = (db.order_items || []).map((oi) => {
      const orderItem = this.mapOrderItem(oi);
      const item = this.mapItem(oi.items);
      const paperType = this.mapPaperType(oi.items.paper_types);
      const brand = this.mapBrand(oi.items.brands);
      const stock = this.mapStock(oi.stocks);

      return {
        ...orderItem,
        item: {
          ...item,
          paperType,
          brand,
        },
        stock,
      };
    });

    const totalRequestedQty = items.reduce(
      (sum, item) => sum + item.requestedQty,
      0,
    );
    const totalProcessedQty = items.some((item) => item.processedQty !== null)
      ? items.reduce((sum, item) => sum + (item.processedQty ?? 0), 0)
      : null;

    return {
      ...order,
      partner,
      requestedByUser,
      processedByUser,
      approvedByUser,
      items,
      itemCount: items.length,
      totalRequestedQty,
      totalProcessedQty,
    };
  }

  async findAll(search: OrderSearchInput): Promise<OrdersResponse> {
    const client = this.supabaseService.getServiceClient();

    let query = client.from("orders").select(
      `
        *,
        partners (*),
        requested_user:users!orders_requested_by_fkey (id, display_name, email),
        processed_user:users!orders_processed_by_fkey (id, display_name, email),
        approved_user:users!orders_approved_by_fkey (id, display_name, email),
        order_items (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          ),
          stocks (*)
        )
      `,
      { count: "exact" },
    );

    if (search.type) {
      query = query.eq("type", search.type);
    }
    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.statuses && search.statuses.length > 0) {
      query = query.in("status", search.statuses);
    }
    if (search.reason) {
      query = query.eq("reason", search.reason);
    }
    if (search.partnerId) {
      query = query.eq("partner_id", search.partnerId);
    }
    if (search.requestedBy) {
      query = query.eq("requested_by", search.requestedBy);
    }
    if (search.isUrgent !== undefined) {
      query = query.eq("is_urgent", search.isUrgent);
    }
    if (search.scheduledDateFrom) {
      query = query.gte("scheduled_date", search.scheduledDateFrom);
    }
    if (search.scheduledDateTo) {
      query = query.lte("scheduled_date", search.scheduledDateTo);
    }
    if (search.q) {
      query = query.ilike("order_number", `%${search.q}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) throw new BadRequestException(error.message);

    const orders = (data as DbOrderWithRelations[]).map((db) =>
      this.mapOrderWithRelations(db),
    );

    return {
      data: orders,
      total: count ?? 0,
      limit: search.limit,
      offset: search.offset,
    };
  }

  async findOne(id: string): Promise<OrderWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("orders")
      .select(
        `
        *,
        partners (*),
        requested_user:users!orders_requested_by_fkey (id, display_name, email),
        processed_user:users!orders_processed_by_fkey (id, display_name, email),
        approved_user:users!orders_approved_by_fkey (id, display_name, email),
        order_items (
          *,
          items (
            *,
            paper_types (*),
            brands (*)
          ),
          stocks (*)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.mapOrderWithRelations(data as DbOrderWithRelations);
  }

  async create(
    input: CreateOrderInput,
    requestedBy: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();

    this.validateReasonForType(input.type, input.reason);

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

      if (input.type === "stock_out" && item.stockId) {
        const { data: stockData, error: stockError } = await client
          .from("stocks")
          .select("id, quantity, status")
          .eq("id", item.stockId)
          .eq("is_active", true)
          .single();

        if (stockError || !stockData) {
          throw new BadRequestException(
            `Invalid or inactive stock: ${item.stockId}`,
          );
        }

        if (stockData.status !== "available") {
          throw new BadRequestException(
            `Stock ${item.stockId} is not available for stock-out`,
          );
        }

        if (stockData.quantity < item.requestedQty) {
          throw new BadRequestException(
            `Insufficient quantity for stock ${item.stockId}. Available: ${stockData.quantity}, Requested: ${item.requestedQty}`,
          );
        }
      }
    }

    if (input.partnerId) {
      const { data: partner, error: partnerError } = await client
        .from("partners")
        .select("id")
        .eq("id", input.partnerId)
        .eq("is_active", true)
        .single();

      if (partnerError || !partner) {
        throw new BadRequestException(
          `Invalid or inactive partner: ${input.partnerId}`,
        );
      }
    }

    const { data: orderNumber, error: orderNumberError } = await client.rpc(
      "generate_order_number",
      { p_type: input.type },
    );

    if (orderNumberError)
      throw new BadRequestException(orderNumberError.message);

    const { data: orderData, error: orderError } = await client
      .from("orders")
      .insert({
        order_number: orderNumber,
        type: input.type,
        status: "pending",
        is_urgent: false,
        reason: input.reason,
        partner_id: input.partnerId ?? null,
        scheduled_date: input.scheduledDate ?? null,
        memo: input.memo ?? null,
        requested_by: requestedBy,
      })
      .select()
      .single();

    if (orderError) throw new BadRequestException(orderError.message);

    const orderItemsToInsert = input.items.map((item) => ({
      order_id: orderData.id,
      item_id: item.itemId,
      stock_id: item.stockId ?? null,
      width_mm: item.widthMm,
      requested_qty: item.requestedQty,
      requested_weight_kg: item.requestedWeightKg ?? null,
      notes: item.notes ?? null,
    }));

    const { error: itemsError } = await client
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsError) throw new BadRequestException(itemsError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: orderData.id,
        action: "created",
        actor_id: requestedBy,
        previous_status: null,
        new_status: "pending",
        changes: { items: input.items },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(orderData.id);

    await this.auditService.log({
      action: "order_created",
      category: "orders",
      targetTable: "orders",
      targetId: orderData.id,
      metadata: {
        orderNumber,
        type: input.type,
        reason: input.reason,
        itemCount: input.items.length,
      },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async update(
    id: string,
    input: UpdateOrderInput,
    userId: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (!["pending", "rejected"].includes(existingOrder.status)) {
      throw new BadRequestException(
        `Cannot update order in status: ${existingOrder.status}`,
      );
    }

    if (input.reason) {
      this.validateReasonForType(existingOrder.type, input.reason);
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    if (input.reason !== undefined && input.reason !== existingOrder.reason) {
      updateData.reason = input.reason;
      changes.reason = { before: existingOrder.reason, after: input.reason };
    }
    if (
      input.partnerId !== undefined &&
      input.partnerId !== existingOrder.partnerId
    ) {
      updateData.partner_id = input.partnerId;
      changes.partnerId = {
        before: existingOrder.partnerId,
        after: input.partnerId,
      };
    }
    if (
      input.scheduledDate !== undefined &&
      input.scheduledDate !== existingOrder.scheduledDate
    ) {
      updateData.scheduled_date = input.scheduledDate;
      changes.scheduledDate = {
        before: existingOrder.scheduledDate,
        after: input.scheduledDate,
      };
    }
    if (input.memo !== undefined && input.memo !== existingOrder.memo) {
      updateData.memo = input.memo;
      changes.memo = { before: existingOrder.memo, after: input.memo };
    }

    if (Object.keys(updateData).length === 0) {
      return {
        order: existingOrder,
        history: {
          id: "",
          orderId: id,
          action: "updated",
          actorId: userId,
          memo: null,
          previousStatus: existingOrder.status,
          newStatus: existingOrder.status,
          changes: null,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const { error: updateError } = await client
      .from("orders")
      .update(updateData)
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "updated",
        actor_id: userId,
        previous_status: existingOrder.status,
        new_status: existingOrder.status,
        changes,
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_updated",
      category: "orders",
      targetTable: "orders",
      targetId: id,
      metadata: { changes },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async cancel(
    id: string,
    userId: string,
    memo?: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (
      !["pending", "field_processing", "awaiting_approval"].includes(
        existingOrder.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot cancel order in status: ${existingOrder.status}`,
      );
    }

    const { error: updateError } = await client
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "cancelled",
        actor_id: userId,
        memo: memo ?? null,
        previous_status: existingOrder.status,
        new_status: "cancelled",
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_cancelled",
      category: "orders",
      targetTable: "orders",
      targetId: id,
      metadata: { previousStatus: existingOrder.status, memo },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async startFieldProcessing(id: string, userId: string): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (existingOrder.status !== "pending") {
      throw new BadRequestException(
        `Cannot start field processing for order in status: ${existingOrder.status}`,
      );
    }

    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "field_processing",
        processed_by: userId,
      })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "field_started",
        actor_id: userId,
        previous_status: "pending",
        new_status: "field_processing",
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_field_started",
      category: "orders",
      targetTable: "orders",
      targetId: id,
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async completeFieldProcessing(
    id: string,
    input: ProcessOrderInput,
    userId: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (existingOrder.status !== "field_processing") {
      throw new BadRequestException(
        `Cannot complete field processing for order in status: ${existingOrder.status}`,
      );
    }

    for (const processedItem of input.items) {
      const orderItem = existingOrder.items.find(
        (oi) => oi.id === processedItem.orderItemId,
      );
      if (!orderItem) {
        throw new BadRequestException(
          `Order item not found: ${processedItem.orderItemId}`,
        );
      }

      const { error: itemUpdateError } = await client
        .from("order_items")
        .update({
          processed_qty: processedItem.processedQty,
          processed_weight_kg: processedItem.processedWeightKg ?? null,
          notes: processedItem.notes ?? orderItem.notes,
        })
        .eq("id", processedItem.orderItemId);

      if (itemUpdateError)
        throw new BadRequestException(itemUpdateError.message);
    }

    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "awaiting_approval",
        processed_by: userId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "field_completed",
        actor_id: userId,
        memo: input.memo ?? null,
        previous_status: "field_processing",
        new_status: "awaiting_approval",
        changes: { processedItems: input.items },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_field_completed",
      category: "orders",
      targetTable: "orders",
      targetId: id,
      metadata: { processedItems: input.items.length },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async approve(
    id: string,
    input: ApproveOrderInput,
    userId: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (existingOrder.status !== "awaiting_approval") {
      throw new BadRequestException(
        `Cannot approve order in status: ${existingOrder.status}`,
      );
    }

    await this.applyStockChanges(existingOrder, userId);

    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "approved",
        actor_id: userId,
        memo: input.memo ?? null,
        previous_status: "awaiting_approval",
        new_status: "approved",
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_approved",
      category: "orders",
      targetTable: "orders",
      targetId: id,
      metadata: {
        type: existingOrder.type,
        itemCount: existingOrder.items.length,
      },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async reject(
    id: string,
    input: RejectOrderInput,
    userId: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (existingOrder.status !== "awaiting_approval") {
      throw new BadRequestException(
        `Cannot reject order in status: ${existingOrder.status}`,
      );
    }

    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "rejected",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "rejected",
        actor_id: userId,
        memo: input.memo,
        previous_status: "awaiting_approval",
        new_status: "rejected",
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_rejected",
      category: "orders",
      targetTable: "orders",
      targetId: id,
      metadata: { reason: input.memo },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async urgentApprove(
    id: string,
    input: UrgentApproveOrderInput,
    userId: string,
  ): Promise<OrderResult> {
    const client = this.supabaseService.getServiceClient();
    const existingOrder = await this.findOne(id);

    if (existingOrder.status !== "pending") {
      throw new BadRequestException(
        `Urgent approval only available for pending orders. Current status: ${existingOrder.status}`,
      );
    }

    for (const processedItem of input.items) {
      const orderItem = existingOrder.items.find(
        (oi) => oi.id === processedItem.orderItemId,
      );
      if (!orderItem) {
        throw new BadRequestException(
          `Order item not found: ${processedItem.orderItemId}`,
        );
      }

      const { error: itemUpdateError } = await client
        .from("order_items")
        .update({
          processed_qty: processedItem.processedQty,
          processed_weight_kg: processedItem.processedWeightKg ?? null,
          notes: processedItem.notes ?? orderItem.notes,
        })
        .eq("id", processedItem.orderItemId);

      if (itemUpdateError)
        throw new BadRequestException(itemUpdateError.message);
    }

    const updatedOrder = await this.findOne(id);
    await this.applyStockChanges(updatedOrder, userId);

    const { error: updateError } = await client
      .from("orders")
      .update({
        status: "approved",
        is_urgent: true,
        processed_by: userId,
        processed_at: new Date().toISOString(),
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw new BadRequestException(updateError.message);

    const { data: historyData, error: historyError } = await client
      .from("order_history")
      .insert({
        order_id: id,
        action: "urgent_approved",
        actor_id: userId,
        memo: input.memo ?? null,
        previous_status: "pending",
        new_status: "approved",
        changes: { processedItems: input.items, isUrgent: true },
      })
      .select()
      .single();

    if (historyError) throw new BadRequestException(historyError.message);

    const order = await this.findOne(id);

    await this.auditService.log({
      action: "order_urgent_approved",
      category: "orders",
      targetTable: "orders",
      targetId: id,
      metadata: {
        type: existingOrder.type,
        itemCount: input.items.length,
        isUrgent: true,
      },
    });

    return {
      order,
      history: this.mapOrderHistory(historyData as DbOrderHistory),
    };
  }

  async getHistory(orderId: string): Promise<OrderHistoryWithActor[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("order_history")
      .select(
        `
        *,
        actor:users!order_history_actor_id_fkey (id, display_name, email)
      `,
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return (data || []).map((h) => ({
      ...this.mapOrderHistory(h as DbOrderHistory),
      actor: this.mapUser((h as { actor: DbUser }).actor)!,
    }));
  }

  private validateReasonForType(type: OrderType, reason: string): void {
    if (type === "stock_in") {
      if (
        !ORDER_IN_REASONS.includes(reason as (typeof ORDER_IN_REASONS)[number])
      ) {
        throw new BadRequestException(
          `Invalid reason for stock_in. Must be one of: ${ORDER_IN_REASONS.join(", ")}`,
        );
      }
    } else if (type === "stock_out") {
      if (
        !ORDER_OUT_REASONS.includes(
          reason as (typeof ORDER_OUT_REASONS)[number],
        )
      ) {
        throw new BadRequestException(
          `Invalid reason for stock_out. Must be one of: ${ORDER_OUT_REASONS.join(", ")}`,
        );
      }
    }
  }

  private async applyStockChanges(
    order: OrderWithRelations,
    userId: string,
  ): Promise<void> {
    if (order.type === "stock_in") {
      await this.applyStockIn(order, userId);
    } else if (order.type === "stock_out") {
      await this.applyStockOut(order, userId);
    }
  }

  private async applyStockIn(
    order: OrderWithRelations,
    userId: string,
  ): Promise<void> {
    const client = this.supabaseService.getServiceClient();

    for (const item of order.items) {
      const processedQty = item.processedQty ?? item.requestedQty;
      const processedWeight = item.processedWeightKg ?? item.requestedWeightKg;

      if (processedQty <= 0) continue;

      const { data: defaultLocation, error: locationError } = await client
        .from("locations")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (locationError || !defaultLocation) {
        throw new BadRequestException("No active location found for stock-in");
      }

      await this.stocksService.stockIn(
        {
          itemId: item.itemId,
          locationId: defaultLocation.id,
          widthMm: item.widthMm,
          weightKg: processedWeight ?? 0,
          quantity: processedQty,
          condition: "parent",
          sourceType: "import",
          notes: `Order: ${order.orderNumber}`,
        },
        userId,
      );
    }
  }

  private async applyStockOut(
    order: OrderWithRelations,
    userId: string,
  ): Promise<void> {
    for (const item of order.items) {
      const processedQty = item.processedQty ?? item.requestedQty;
      const processedWeight = item.processedWeightKg ?? item.requestedWeightKg;

      if (processedQty <= 0) continue;

      if (!item.stockId) {
        throw new BadRequestException(
          `Stock ID required for stock-out order item: ${item.id}`,
        );
      }

      await this.stocksService.stockOut(
        {
          stockId: item.stockId,
          quantity: processedQty,
          weightKg: processedWeight ?? undefined,
          reasonType: "sale",
          reason: `Order: ${order.orderNumber}`,
        },
        userId,
      );
    }
  }
}
