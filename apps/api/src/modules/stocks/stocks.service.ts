import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { z } from "zod";
import type {
  Stock,
  StockWithRelations,
  StockCondition,
  StockStatus,
  StockSearchInput,
  StocksResponse,
  StockMovement,
  MovementType,
  MovementReferenceType,
  Item,
  PaperType,
  Brand,
  Location,
  Warehouse,
  ItemForm,
  LocationType,
  CreateStockInInput,
  StockInResult,
  BulkStockInInput,
  BulkStockInResult,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";

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

@Injectable()
export class StocksService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  private mapStock(db: DbStock): Stock {
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
    const stock = this.mapStock(db);
    const item = this.mapItem(db.items);
    const paperType = this.mapPaperType(db.items.paper_types);
    const brand = this.mapBrand(db.items.brands);
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

    let query = client.from("stocks").select(
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
      { count: "exact" },
    );

    if (search.warehouseId) {
      query = query.eq("locations.warehouse_id", search.warehouseId);
    }
    if (search.locationId) {
      query = query.eq("location_id", search.locationId);
    }
    if (search.itemId) {
      query = query.eq("item_id", search.itemId);
    }
    if (search.widthMm) {
      query = query.eq("width_mm", search.widthMm);
    }
    if (search.widthMin) {
      query = query.gte("width_mm", search.widthMin);
    }
    if (search.widthMax) {
      query = query.lte("width_mm", search.widthMax);
    }
    if (search.condition) {
      query = query.eq("condition", search.condition);
    }
    if (search.status) {
      query = query.eq("status", search.status);
    }
    if (search.isActive !== undefined) {
      query = query.eq("is_active", search.isActive);
    }
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(search.offset, search.offset + search.limit - 1);

    if (error) throw new BadRequestException(error.message);

    let stocks = (data as DbStockWithRelations[]).map((db) =>
      this.mapStockWithRelations(db),
    );

    // TODO: Replace with RPC function for proper server-side search with accurate pagination
    if (search.q) {
      const q = search.q.toLowerCase();
      stocks = stocks.filter(
        (s) =>
          s.item.itemCode.toLowerCase().includes(q) ||
          s.item.displayName.toLowerCase().includes(q),
      );
    }

    return {
      data: stocks,
      total: search.q ? stocks.length : (count ?? 0),
      limit: search.limit,
      offset: search.offset,
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
        status: "available",
        is_active: true,
        batch_number: batchNumber,
        lot_number: input.lotNumber ?? null,
        received_at: new Date().toISOString(),
        source_type: input.sourceType,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (stockError) throw new BadRequestException(stockError.message);

    const { data: movementData, error: movementError } = await client
      .from("stock_movements")
      .insert({
        stock_id: stockData.id,
        movement_type: "in",
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

    if (movementError) throw new BadRequestException(movementError.message);

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
      throw new BadRequestException(error.message);
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
      throw new BadRequestException(error.message);
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
      throw new BadRequestException(error.message);
    }

    return (data as DbStockMovement[]).map((db) => this.mapMovement(db));
  }
}
