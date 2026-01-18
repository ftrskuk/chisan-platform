import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import type {
  Stock,
  StockWithRelations,
  StockSearchInput,
  StocksResponse,
  StockMovement,
  MovementType,
  MovementReferenceType,
  Location,
  Warehouse,
  LocationType,
  CreateStockInInput,
  StockInResult,
  BulkStockInInput,
  BulkStockInResult,
  CreateStockOutInput,
  StockOutResult,
  BulkStockOutInput,
  BulkStockOutResult,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import {
  type DbItem,
  type DbPaperType,
  type DbBrand,
  type DbStock,
  mapItem,
  mapPaperType,
  mapBrand,
  mapStock,
} from "../../common/mappers";
import { handleSupabaseError } from "../../common/utils";

const STOCK_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  QUARANTINE: "quarantine",
  DISPOSED: "disposed",
} as const;

const MOVEMENT_TYPE = {
  IN: "in",
  OUT: "out",
  ADJUSTMENT: "adjustment",
  MOVE: "move",
  QUARANTINE: "quarantine",
} as const;

interface DbLocation {
  id: string;
  warehouse_id: string;
  code: string;
  name: string | null;
  type: string;
  parent_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbWarehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_active: boolean;
  is_default: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbStockWithRelations extends DbStock {
  items: DbItem & {
    paper_types: DbPaperType;
    brands: DbBrand | null;
  };
  locations: DbLocation & {
    warehouses: DbWarehouse;
  };
}

interface DbStockMovement {
  id: string;
  stock_id: string;
  movement_type: string;
  quantity_change: number;
  weight_change_kg: number | null;
  quantity_before: number;
  quantity_after: number;
  weight_before_kg: number | null;
  weight_after_kg: number | null;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  performed_by: string | null;
  created_at: string;
}

const BulkStockInRpcResultSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  results: z.array(
    z.object({
      stockId: z.string().uuid(),
      movementId: z.string().uuid(),
      batchNumber: z.string(),
      itemId: z.string().uuid(),
      locationId: z.string().uuid(),
      widthMm: z.number(),
      weightKg: z.number(),
      quantity: z.number(),
      condition: z.string(),
    }),
  ),
});

const BulkStockOutRpcResultSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  outNumber: z.string(),
  results: z.array(
    z.object({
      stockId: z.string().uuid(),
      movementId: z.string().uuid(),
      outNumber: z.string(),
      itemId: z.string().uuid(),
      locationId: z.string().uuid(),
      quantityOut: z.number(),
      weightOutKg: z.number().nullable(),
      quantityRemaining: z.number(),
      weightRemainingKg: z.number().nullable(),
    }),
  ),
});

@Injectable()
export class StocksService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private mapLocation(db: DbLocation): Location {
    return {
      id: db.id,
      warehouseId: db.warehouse_id,
      code: db.code,
      name: db.name,
      type: db.type as LocationType,
      parentId: db.parent_id,
      isActive: db.is_active,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapWarehouse(db: DbWarehouse): Warehouse {
    return {
      id: db.id,
      code: db.code,
      name: db.name,
      address: db.address,
      city: db.city,
      postalCode: db.postal_code,
      contactName: db.contact_name,
      contactPhone: db.contact_phone,
      isActive: db.is_active,
      isDefault: db.is_default,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  private mapStockWithRelations(db: DbStockWithRelations): StockWithRelations {
    const stock = mapStock(db);
    const item = mapItem(db.items);
    const paperType = mapPaperType(db.items.paper_types);
    const brand = db.items.brands ? mapBrand(db.items.brands) : null;
    const location = this.mapLocation(db.locations);
    const warehouse = this.mapWarehouse(db.locations.warehouses);

    return {
      ...stock,
      item: {
        ...item,
        paperType,
        brand,
      },
      location,
      warehouse,
    };
  }

  async findAll(search: StockSearchInput): Promise<StocksResponse> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client.rpc("search_stocks", {
      p_warehouse_id: search.warehouseId ?? null,
      p_location_id: search.locationId ?? null,
      p_item_id: search.itemId ?? null,
      p_width_mm: search.widthMm ?? null,
      p_width_min: search.widthMin ?? null,
      p_width_max: search.widthMax ?? null,
      p_condition: search.condition ?? null,
      p_status: search.status ?? null,
      p_is_active: search.isActive ?? null,
      p_search_query: search.q ?? null,
      p_limit: search.limit,
      p_offset: search.offset,
    });

    if (error) {
      handleSupabaseError(error, {
        operation: "search stocks",
        resource: "Stock",
      });
    }

    const result = data as {
      data: StockWithRelations[];
      total: number;
      limit: number;
      offset: number;
    };

    return {
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }

  async findOne(id: string): Promise<StockWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("stocks")
      .select(
        `
        *,
        items!inner (
          *,
          paper_types (*),
          brands (*)
        ),
        locations!inner (
          *,
          warehouses (*)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    return this.mapStockWithRelations(data as DbStockWithRelations);
  }

  private mapMovement(db: DbStockMovement): StockMovement {
    return {
      id: db.id,
      stockId: db.stock_id,
      movementType: db.movement_type as MovementType,
      quantityChange: db.quantity_change,
      weightChangeKg: db.weight_change_kg ? Number(db.weight_change_kg) : null,
      quantityBefore: db.quantity_before,
      quantityAfter: db.quantity_after,
      weightBeforeKg: db.weight_before_kg ? Number(db.weight_before_kg) : null,
      weightAfterKg: db.weight_after_kg ? Number(db.weight_after_kg) : null,
      reason: db.reason,
      referenceType: db.reference_type as MovementReferenceType | null,
      referenceId: db.reference_id,
      performedBy: db.performed_by,
      createdAt: db.created_at,
    };
  }

  private async generateBatchNumber(): Promise<string> {
    const client = this.supabaseService.getServiceClient();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `SI-${today}-`;

    const { data } = await client
      .from("stocks")
      .select("batch_number")
      .like("batch_number", `${prefix}%`)
      .order("batch_number", { ascending: false })
      .limit(1);

    let sequence = 1;
    if (data && data.length > 0) {
      const batchNumber = data[0]?.batch_number;
      if (batchNumber) {
        const lastSeq = parseInt(batchNumber.slice(-3), 10);
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(3, "0")}`;
  }

  async stockIn(
    input: CreateStockInInput,
    performedBy: string,
  ): Promise<StockInResult> {
    const client = this.supabaseService.getServiceClient();

    const { data: location, error: locationError } = await client
      .from("locations")
      .select("id")
      .eq("id", input.locationId)
      .eq("is_active", true)
      .single();

    if (locationError || !location) {
      throw new BadRequestException("Invalid or inactive location.");
    }

    const { data: item, error: itemError } = await client
      .from("items")
      .select("id")
      .eq("id", input.itemId)
      .eq("is_active", true)
      .single();

    if (itemError || !item) {
      throw new BadRequestException("Invalid or inactive item.");
    }

    const batchNumber = await this.generateBatchNumber();
    const quantity = input.quantity ?? 1;
    const weightValue = input.weightKg;

    const { data: stockData, error: stockError } = await client
      .from("stocks")
      .insert({
        item_id: input.itemId,
        location_id: input.locationId,
        width_mm: input.widthMm,
        weight_kg: weightValue,
        quantity: quantity,
        condition: input.condition,
        status: STOCK_STATUS.AVAILABLE,
        is_active: true,
        batch_number: batchNumber,
        lot_number: input.lotNumber ?? null,
        received_at: new Date().toISOString(),
        source_type: input.sourceType,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (stockError) {
      handleSupabaseError(stockError, {
        operation: "create stock",
        resource: "Stock",
      });
    }

    const { data: movementData, error: movementError } = await client
      .from("stock_movements")
      .insert({
        stock_id: stockData.id,
        movement_type: MOVEMENT_TYPE.IN,
        quantity_change: quantity,
        weight_change_kg: weightValue,
        quantity_before: 0,
        quantity_after: quantity,
        weight_before_kg: 0,
        weight_after_kg: weightValue,
        reason: `Stock-in: ${input.sourceType}`,
        reference_type: input.sourceType,
        performed_by: performedBy,
      })
      .select()
      .single();

    if (movementError) {
      handleSupabaseError(movementError, {
        operation: "create stock movement",
        resource: "StockMovement",
      });
    }

    const stock = await this.findOne(stockData.id);

    await this.auditService.log({
      action: "stock_in",
      category: "inventory",
      targetTable: "stocks",
      targetId: stockData.id,
      metadata: {
        batchNumber,
        itemId: input.itemId,
        locationId: input.locationId,
        quantity,
        weightKg: weightValue,
        widthMm: input.widthMm,
        condition: input.condition,
        sourceType: input.sourceType,
        movementId: movementData.id,
      },
    });

    return {
      stock,
      movement: this.mapMovement(movementData as DbStockMovement),
      batchNumber,
    };
  }

  async bulkStockIn(
    input: BulkStockInInput,
    performedBy: string,
  ): Promise<BulkStockInResult> {
    const client = this.supabaseService.getServiceClient();

    const rpcItems = input.items.map((item) => ({
      item_id: item.itemId,
      location_id: item.locationId,
      width_mm: item.widthMm,
      weight_kg: item.weightKg,
      quantity: item.quantity ?? 1,
      condition: item.condition,
      source_type: item.sourceType,
      lot_number: item.lotNumber ?? null,
      notes: item.notes ?? null,
    }));

    const { data, error } = await client.rpc("bulk_stock_in", {
      items: rpcItems,
      performed_by: performedBy,
    });

    if (error) {
      handleSupabaseError(error, {
        operation: "bulk stock-in",
        resource: "Stock",
      });
    }

    const parseResult = BulkStockInRpcResultSchema.safeParse(data);
    if (!parseResult.success) {
      throw new BadRequestException(
        `Invalid RPC response: ${parseResult.error.message}`,
      );
    }

    const rpcResult = parseResult.data;

    if (!rpcResult.success) {
      throw new BadRequestException("Bulk stock-in RPC returned success=false");
    }

    const stockIds = rpcResult.results.map((r) => r.stockId);
    const movementIds = rpcResult.results.map((r) => r.movementId);

    const [stocksData, movementsData] = await Promise.all([
      this.findManyByIds(stockIds),
      this.getMovementsByIds(movementIds),
    ]);

    const stocksMap = new Map(stocksData.map((s) => [s.id, s]));
    const movementsMap = new Map(movementsData.map((m) => [m.id, m]));

    const results: StockInResult[] = rpcResult.results.map((r) => {
      const stock = stocksMap.get(r.stockId);
      const movement = movementsMap.get(r.movementId);

      if (!stock) {
        throw new NotFoundException(`Stock with ID ${r.stockId} not found`);
      }
      if (!movement) {
        throw new NotFoundException(
          `Movement with ID ${r.movementId} not found`,
        );
      }

      return {
        stock,
        movement,
        batchNumber: r.batchNumber,
      };
    });

    await this.auditService.log({
      action: "stock_in",
      category: "inventory",
      targetTable: "stocks",
      targetId: undefined,
      metadata: {
        bulkOperation: true,
        itemCount: rpcResult.count,
        stockIds: rpcResult.results.map((r) => r.stockId),
        batchNumbers: rpcResult.results.map((r) => r.batchNumber),
      },
    });

    return {
      results,
      successCount: rpcResult.count,
      failureCount: 0,
      failures: [],
    };
  }

  private async getMovement(movementId: string): Promise<StockMovement> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("stock_movements")
      .select("*")
      .eq("id", movementId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Movement with ID ${movementId} not found`);
    }

    return this.mapMovement(data as DbStockMovement);
  }

  private async findManyByIds(ids: string[]): Promise<StockWithRelations[]> {
    if (ids.length === 0) return [];

    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("stocks")
      .select(
        `
        *,
        items!inner (
          *,
          paper_types (*),
          brands (*)
        ),
        locations!inner (
          *,
          warehouses (*)
        )
      `,
      )
      .in("id", ids);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch stocks by IDs",
        resource: "Stock",
      });
    }

    return (data as DbStockWithRelations[]).map((db) =>
      this.mapStockWithRelations(db),
    );
  }

  private async getMovementsByIds(ids: string[]): Promise<StockMovement[]> {
    if (ids.length === 0) return [];

    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("stock_movements")
      .select("*")
      .in("id", ids);

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch stock movements by IDs",
        resource: "StockMovement",
      });
    }

    return (data as DbStockMovement[]).map((db) => this.mapMovement(db));
  }

  async stockOut(
    input: CreateStockOutInput,
    performedBy: string,
  ): Promise<StockOutResult> {
    const bulkResult = await this.bulkStockOut({ items: [input] }, performedBy);

    if (bulkResult.failureCount > 0) {
      throw new BadRequestException(
        bulkResult.failures[0]?.error ?? "Stock-out failed",
      );
    }

    const result = bulkResult.results[0];
    if (!result) {
      throw new BadRequestException("Stock-out failed: no result returned");
    }

    return result;
  }

  async bulkStockOut(
    input: BulkStockOutInput,
    performedBy: string,
  ): Promise<BulkStockOutResult> {
    const client = this.supabaseService.getServiceClient();

    const rpcItems = input.items.map((item) => ({
      stock_id: item.stockId,
      quantity: item.quantity ?? null,
      weight_kg: item.weightKg ?? null,
      reason_type: item.reasonType,
      reason: item.reason ?? null,
      reference_id: item.referenceId ?? null,
      notes: item.notes ?? null,
    }));

    const { data, error } = await client.rpc("bulk_stock_out", {
      items: rpcItems,
      performed_by: performedBy,
    });

    if (error) {
      handleSupabaseError(error, {
        operation: "bulk stock-out",
        resource: "Stock",
      });
    }

    const parseResult = BulkStockOutRpcResultSchema.safeParse(data);
    if (!parseResult.success) {
      throw new BadRequestException(
        `Invalid RPC response: ${parseResult.error.message}`,
      );
    }

    const rpcResult = parseResult.data;

    if (!rpcResult.success) {
      throw new BadRequestException(
        "Bulk stock-out RPC returned success=false",
      );
    }

    const stockIds = rpcResult.results.map((r) => r.stockId);
    const movementIds = rpcResult.results.map((r) => r.movementId);

    const [stocksData, movementsData] = await Promise.all([
      this.findManyByIds(stockIds),
      this.getMovementsByIds(movementIds),
    ]);

    const stocksMap = new Map(stocksData.map((s) => [s.id, s]));
    const movementsMap = new Map(movementsData.map((m) => [m.id, m]));

    const results: StockOutResult[] = rpcResult.results.map((r) => {
      const stock = stocksMap.get(r.stockId);
      const movement = movementsMap.get(r.movementId);

      if (!stock) {
        throw new NotFoundException(`Stock with ID ${r.stockId} not found`);
      }
      if (!movement) {
        throw new NotFoundException(
          `Movement with ID ${r.movementId} not found`,
        );
      }

      return {
        stock,
        movement,
      };
    });

    await this.auditService.log({
      action: "stock_out",
      category: "inventory",
      targetTable: "stocks",
      targetId: undefined,
      metadata: {
        bulkOperation: true,
        itemCount: rpcResult.count,
        outNumber: rpcResult.outNumber,
        stockIds: rpcResult.results.map((r) => r.stockId),
      },
    });

    return {
      results,
      successCount: rpcResult.count,
      failureCount: 0,
      failures: [],
    };
  }
}
