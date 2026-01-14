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
  constructor(private readonly supabaseService: SupabaseService) {}

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
    return (data as DbWarehouse[]).map(this.mapWarehouse);
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
      locations: ((locations as DbLocation[]) ?? []).map(this.mapLocation),
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
    return this.mapWarehouse(data as DbWarehouse);
  }

  async update(id: string, input: UpdateWarehouseInput): Promise<Warehouse> {
    const client = this.supabaseService.getServiceClient();

    await this.findOne(id);

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
    return this.mapWarehouse(data as DbWarehouse);
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
    return this.mapWarehouse(data as DbWarehouse);
  }

  async getLocations(warehouseId: string): Promise<Location[]> {
    const client = this.supabaseService.getServiceClient();

    await this.findOne(warehouseId);

    const { data, error } = await client
      .from("locations")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .order("type")
      .order("code");

    if (error) throw new BadRequestException(error.message);
    return ((data as DbLocation[]) ?? []).map(this.mapLocation);
  }

  async createLocation(
    warehouseId: string,
    input: CreateLocationInput,
  ): Promise<Location> {
    const client = this.supabaseService.getServiceClient();

    await this.findOne(warehouseId);

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
    return this.mapLocation(data as DbLocation);
  }

  async updateLocation(
    locationId: string,
    input: UpdateLocationInput,
  ): Promise<Location> {
    const client = this.supabaseService.getServiceClient();

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
    return this.mapLocation(data as DbLocation);
  }
}
