import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Stock,
  StockWithRelations,
  StockCondition,
  StockStatus,
  StockSearchInput,
  StocksResponse,
  Item,
  PaperType,
  Brand,
  Location,
  Warehouse,
  ItemForm,
  LocationType,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";

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

@Injectable()
export class StocksService {
  constructor(private readonly supabaseService: SupabaseService) {}

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
}
