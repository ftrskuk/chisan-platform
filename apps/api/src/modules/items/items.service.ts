import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Item,
  Brand,
  PaperType,
  ItemForm,
  ItemWithRelations,
  CreateItemInput,
  UpdateItemInput,
  CreatePaperTypeInput,
  UpdatePaperTypeInput,
  ItemSearchInput,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import { type DbBrand, mapBrand } from "../../common/mappers";
import { buildAuditChanges } from "../../common/utils";

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

@Injectable()
export class ItemsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

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

  async getAllPaperTypes(): Promise<PaperType[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("paper_types")
      .select("*")
      .order("sort_order");

    if (error) throw new BadRequestException(error.message);
    return (data as DbPaperType[]).map((db) => this.mapPaperType(db));
  }

  async createPaperType(input: CreatePaperTypeInput): Promise<PaperType> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("paper_types")
      .insert({
        code: input.code,
        name_en: input.nameEn,
        name_ko: input.nameKo,
        description: input.description,
        sort_order: input.sortOrder ?? 0,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapPaperType(data as DbPaperType);

    await this.auditService.log({
      action: "paper_type_created",
      category: "master_data",
      targetTable: "paper_types",
      targetId: result.id,
      metadata: { code: result.code, nameEn: result.nameEn },
    });

    return result;
  }

  async updatePaperType(
    id: string,
    input: UpdatePaperTypeInput,
  ): Promise<PaperType> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: fetchError } = await client
      .from("paper_types")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`PaperType with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.code !== undefined) updateData.code = input.code;
    if (input.nameEn !== undefined) updateData.name_en = input.nameEn;
    if (input.nameKo !== undefined) updateData.name_ko = input.nameKo;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    const { data, error } = await client
      .from("paper_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapPaperType(data as DbPaperType);

    const existingRecord = existing as unknown as Record<string, unknown>;
    const inputRecord = input as unknown as Record<string, unknown>;
    const changes = buildAuditChanges(existingRecord, inputRecord, {
      code: "code",
      nameEn: "name_en",
      nameKo: "name_ko",
      description: "description",
      sortOrder: "sort_order",
    });

    await this.auditService.log({
      action: "paper_type_updated",
      category: "master_data",
      targetTable: "paper_types",
      targetId: id,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return result;
  }

  async findAll(search?: ItemSearchInput): Promise<Item[]> {
    const client = this.supabaseService.getServiceClient();

    let query = client.from("items").select("*");

    if (search?.paperTypeId) {
      query = query.eq("paper_type_id", search.paperTypeId);
    }
    if (search?.brandId) {
      query = query.eq("brand_id", search.brandId);
    }
    if (search?.grammage) {
      query = query.eq("grammage", search.grammage);
    }
    if (search?.grammageMin) {
      query = query.gte("grammage", search.grammageMin);
    }
    if (search?.grammageMax) {
      query = query.lte("grammage", search.grammageMax);
    }
    if (search?.form) {
      query = query.eq("form", search.form);
    }
    if (search?.isActive !== undefined) {
      query = query.eq("is_active", search.isActive);
    }
    if (search?.q) {
      query = query.ilike("display_name", `%${search.q}%`);
    }

    const { data, error } = await query.order("display_name");

    if (error) throw new BadRequestException(error.message);
    return (data as DbItem[]).map((db) => this.mapItem(db));
  }

  async findOne(id: string): Promise<ItemWithRelations> {
    const client = this.supabaseService.getServiceClient();

    const { data: item, error } = await client
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    const dbItem = item as DbItem;
    const mappedItem = this.mapItem(dbItem);

    const { data: paperType } = await client
      .from("paper_types")
      .select("*")
      .eq("id", dbItem.paper_type_id)
      .single();

    let brand: Brand | null = null;
    if (dbItem.brand_id) {
      const { data: brandData } = await client
        .from("brands")
        .select("*")
        .eq("id", dbItem.brand_id)
        .single();
      if (brandData) {
        brand = mapBrand(brandData as DbBrand);
      }
    }

    return {
      ...mappedItem,
      paperType: this.mapPaperType(paperType as DbPaperType),
      brand,
    };
  }

  async create(input: CreateItemInput): Promise<Item> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("items")
      .insert({
        item_code: input.itemCode || "",
        display_name: input.displayName,
        paper_type_id: input.paperTypeId,
        brand_id: input.brandId,
        grammage: input.grammage,
        form: input.form,
        core_diameter_inch: input.coreDiameterInch,
        length_mm: input.lengthMm,
        sheets_per_ream: input.sheetsPerReam,
        unit_of_measure: input.unitOfMeasure ?? "kg",
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapItem(data as DbItem);

    await this.auditService.log({
      action: "item_created",
      category: "master_data",
      targetTable: "items",
      targetId: result.id,
      metadata: {
        itemCode: result.itemCode,
        displayName: result.displayName,
        paperTypeId: result.paperTypeId,
        brandId: result.brandId,
        grammage: result.grammage,
        form: result.form,
      },
    });

    return result;
  }

  async update(id: string, input: UpdateItemInput): Promise<Item> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: fetchError } = await client
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.itemCode !== undefined) updateData.item_code = input.itemCode;
    if (input.displayName !== undefined)
      updateData.display_name = input.displayName;
    if (input.paperTypeId !== undefined)
      updateData.paper_type_id = input.paperTypeId;
    if (input.brandId !== undefined) updateData.brand_id = input.brandId;
    if (input.grammage !== undefined) updateData.grammage = input.grammage;
    if (input.form !== undefined) updateData.form = input.form;
    if (input.coreDiameterInch !== undefined)
      updateData.core_diameter_inch = input.coreDiameterInch;
    if (input.lengthMm !== undefined) updateData.length_mm = input.lengthMm;
    if (input.sheetsPerReam !== undefined)
      updateData.sheets_per_ream = input.sheetsPerReam;
    if (input.unitOfMeasure !== undefined)
      updateData.unit_of_measure = input.unitOfMeasure;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await client
      .from("items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapItem(data as DbItem);

    const changes = buildAuditChanges(
      existing as Record<string, unknown>,
      input as Record<string, unknown>,
      {
        itemCode: "item_code",
        displayName: "display_name",
        paperTypeId: "paper_type_id",
        brandId: "brand_id",
        grammage: "grammage",
        form: "form",
        coreDiameterInch: "core_diameter_inch",
        lengthMm: "length_mm",
        sheetsPerReam: "sheets_per_ream",
        unitOfMeasure: "unit_of_measure",
        notes: "notes",
      },
    );

    await this.auditService.log({
      action: "item_updated",
      category: "master_data",
      targetTable: "items",
      targetId: id,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return result;
  }

  async deactivate(id: string): Promise<Item> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("items")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapItem(data as DbItem);

    await this.auditService.log({
      action: "item_deactivated",
      category: "master_data",
      targetTable: "items",
      targetId: id,
      metadata: { itemCode: result.itemCode, displayName: result.displayName },
    });

    return result;
  }
}
