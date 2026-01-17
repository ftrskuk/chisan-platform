import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Warehouse,
  Location,
  WarehouseWithLocations,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import { buildAuditChanges } from "../../common/utils";

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

@Injectable()
export class WarehousesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

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

  private mapLocation(db: DbLocation): Location {
    return {
      id: db.id,
      warehouseId: db.warehouse_id,
      code: db.code,
      name: db.name,
      type: db.type as Location["type"],
      parentId: db.parent_id,
      isActive: db.is_active,
      notes: db.notes,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  async findAll(): Promise<Warehouse[]> {
    const client = this.supabaseService.getServiceClient();
    const { data, error } = await client
      .from("warehouses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");

    if (error) throw new BadRequestException(error.message);
    return (data as DbWarehouse[]).map((db) => this.mapWarehouse(db));
  }

  async findOne(id: string): Promise<WarehouseWithLocations> {
    const client = this.supabaseService.getServiceClient();

    const { data: warehouse, error } = await client
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    const { data: locations } = await client
      .from("locations")
      .select("*")
      .eq("warehouse_id", id)
      .order("type")
      .order("code");

    return {
      ...this.mapWarehouse(warehouse as DbWarehouse),
      locations: ((locations as DbLocation[]) ?? []).map((db) =>
        this.mapLocation(db),
      ),
    };
  }

  async create(input: CreateWarehouseInput): Promise<Warehouse> {
    const client = this.supabaseService.getServiceClient();

    if (input.isDefault) {
      await client
        .from("warehouses")
        .update({ is_default: false })
        .eq("is_default", true);
    }

    const { data, error } = await client
      .from("warehouses")
      .insert({
        code: input.code,
        name: input.name,
        address: input.address,
        city: input.city,
        postal_code: input.postalCode,
        contact_name: input.contactName,
        contact_phone: input.contactPhone,
        is_default: input.isDefault ?? false,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapWarehouse(data as DbWarehouse);

    await this.auditService.log({
      action: "warehouse_created",
      category: "master_data",
      targetTable: "warehouses",
      targetId: result.id,
      metadata: {
        code: result.code,
        name: result.name,
        city: result.city,
        isDefault: result.isDefault,
      },
    });

    return result;
  }

  async update(id: string, input: UpdateWarehouseInput): Promise<Warehouse> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: fetchError } = await client
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    if (input.isDefault) {
      await client
        .from("warehouses")
        .update({ is_default: false })
        .eq("is_default", true);
    }

    const updateData: Record<string, unknown> = {};
    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.postalCode !== undefined)
      updateData.postal_code = input.postalCode;
    if (input.contactName !== undefined)
      updateData.contact_name = input.contactName;
    if (input.contactPhone !== undefined)
      updateData.contact_phone = input.contactPhone;
    if (input.isDefault !== undefined) updateData.is_default = input.isDefault;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await client
      .from("warehouses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapWarehouse(data as DbWarehouse);

    const existingRecord = existing as unknown as Record<string, unknown>;
    const inputRecord = input as unknown as Record<string, unknown>;
    const changes = buildAuditChanges(existingRecord, inputRecord, {
      code: "code",
      name: "name",
      address: "address",
      city: "city",
      postalCode: "postal_code",
      contactName: "contact_name",
      contactPhone: "contact_phone",
      isDefault: "is_default",
      notes: "notes",
    });

    await this.auditService.log({
      action: "warehouse_updated",
      category: "master_data",
      targetTable: "warehouses",
      targetId: id,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return result;
  }

  async deactivate(id: string): Promise<Warehouse> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("warehouses")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapWarehouse(data as DbWarehouse);

    await this.auditService.log({
      action: "warehouse_deactivated",
      category: "master_data",
      targetTable: "warehouses",
      targetId: id,
      metadata: { code: result.code, name: result.name },
    });

    return result;
  }

  async getLocations(warehouseId: string): Promise<Location[]> {
    const client = this.supabaseService.getServiceClient();

    await this.findOne(warehouseId);

    const { data, error } = await client
      .from("locations")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("is_active", true)
      .order("type")
      .order("code");

    if (error) throw new BadRequestException(error.message);
    return ((data as DbLocation[]) ?? []).map((db) => this.mapLocation(db));
  }

  async createLocation(
    warehouseId: string,
    input: CreateLocationInput,
  ): Promise<Location> {
    const client = this.supabaseService.getServiceClient();

    const warehouse = await this.findOne(warehouseId);

    const { data, error } = await client
      .from("locations")
      .insert({
        warehouse_id: warehouseId,
        code: input.code,
        name: input.name,
        type: input.type ?? "zone",
        parent_id: input.parentId,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapLocation(data as DbLocation);

    await this.auditService.log({
      action: "location_created",
      category: "master_data",
      targetTable: "locations",
      targetId: result.id,
      metadata: {
        warehouseId,
        warehouseName: warehouse.name,
        code: result.code,
        name: result.name,
        type: result.type,
      },
    });

    return result;
  }

  async updateLocation(
    locationId: string,
    input: UpdateLocationInput,
  ): Promise<Location> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: fetchError } = await client
      .from("locations")
      .select("*")
      .eq("id", locationId)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.parentId !== undefined) updateData.parent_id = input.parentId;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await client
      .from("locations")
      .update(updateData)
      .eq("id", locationId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    const result = this.mapLocation(data as DbLocation);

    const existingRecord = existing as unknown as Record<string, unknown>;
    const inputRecord = input as unknown as Record<string, unknown>;
    const changes = buildAuditChanges(existingRecord, inputRecord, {
      code: "code",
      name: "name",
      type: "type",
      parentId: "parent_id",
      notes: "notes",
    });

    await this.auditService.log({
      action: "location_updated",
      category: "master_data",
      targetTable: "locations",
      targetId: locationId,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return result;
  }
}
