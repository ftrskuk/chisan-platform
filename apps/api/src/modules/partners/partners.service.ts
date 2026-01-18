import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Partner,
  Brand,
  PartnerWithBrands,
  PartnerType,
  CreatePartnerInput,
  UpdatePartnerInput,
  CreateBrandInput,
  UpdateBrandInput,
} from "@repo/shared";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { AuditService } from "../../core/audit/audit.service";
import {
  type DbBrand,
  type DbPartner,
  mapBrand,
  mapPartner,
} from "../../common/mappers";
import { buildAuditChanges, handleSupabaseError } from "../../common/utils";

@Injectable()
export class PartnersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(type?: PartnerType): Promise<Partner[]> {
    const client = this.supabaseService.getServiceClient();
    let query = client.from("partners").select("*").order("name");

    if (type) {
      query = query.or(`partner_type.eq.${type},partner_type.eq.both`);
    }

    const { data, error } = await query;
    if (error) {
      handleSupabaseError(error, {
        operation: "fetch partners",
        resource: "Partner",
      });
    }
    return (data as DbPartner[]).map((db) => mapPartner(db));
  }

  async findSuppliers(): Promise<Partner[]> {
    return this.findAll("supplier");
  }

  async findCustomers(): Promise<Partner[]> {
    return this.findAll("customer");
  }

  async findOne(id: string): Promise<PartnerWithBrands> {
    const client = this.supabaseService.getServiceClient();

    const { data: partner, error } = await client
      .from("partners")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    const { data: brands } = await client
      .from("brands")
      .select("*")
      .eq("partner_id", id)
      .order("name");

    return {
      ...mapPartner(partner as DbPartner),
      brands: ((brands as DbBrand[]) ?? []).map((db) => mapBrand(db)),
    };
  }

  async create(input: CreatePartnerInput): Promise<Partner> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("partners")
      .insert({
        partner_code: input.partnerCode,
        name: input.name,
        name_local: input.nameLocal,
        partner_type: input.partnerType,
        country_code: input.countryCode,
        address: input.address,
        city: input.city,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        supplier_currency: input.supplierCurrency,
        supplier_payment_terms: input.supplierPaymentTerms,
        lead_time_days: input.leadTimeDays,
        customer_currency: input.customerCurrency,
        customer_payment_terms: input.customerPaymentTerms,
        credit_limit: input.creditLimit,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        operation: "create partner",
        resource: "Partner",
      });
    }

    const result = mapPartner(data as DbPartner);

    await this.auditService.log({
      action: "partner_created",
      category: "master_data",
      targetTable: "partners",
      targetId: result.id,
      metadata: {
        partnerCode: result.partnerCode,
        name: result.name,
        partnerType: result.partnerType,
        countryCode: result.countryCode,
      },
    });

    return result;
  }

  async update(id: string, input: UpdatePartnerInput): Promise<Partner> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: fetchError } = await client
      .from("partners")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.partnerCode !== undefined)
      updateData.partner_code = input.partnerCode;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.nameLocal !== undefined) updateData.name_local = input.nameLocal;
    if (input.partnerType !== undefined)
      updateData.partner_type = input.partnerType;
    if (input.countryCode !== undefined)
      updateData.country_code = input.countryCode;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.contactName !== undefined)
      updateData.contact_name = input.contactName;
    if (input.contactEmail !== undefined)
      updateData.contact_email = input.contactEmail;
    if (input.contactPhone !== undefined)
      updateData.contact_phone = input.contactPhone;
    if (input.supplierCurrency !== undefined)
      updateData.supplier_currency = input.supplierCurrency;
    if (input.supplierPaymentTerms !== undefined)
      updateData.supplier_payment_terms = input.supplierPaymentTerms;
    if (input.leadTimeDays !== undefined)
      updateData.lead_time_days = input.leadTimeDays;
    if (input.customerCurrency !== undefined)
      updateData.customer_currency = input.customerCurrency;
    if (input.customerPaymentTerms !== undefined)
      updateData.customer_payment_terms = input.customerPaymentTerms;
    if (input.creditLimit !== undefined)
      updateData.credit_limit = input.creditLimit;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await client
      .from("partners")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        operation: "update partner",
        resource: "Partner",
      });
    }

    const result = mapPartner(data as DbPartner);

    const existingRecord = existing as unknown as Record<string, unknown>;
    const inputRecord = input as unknown as Record<string, unknown>;
    const changes = buildAuditChanges(existingRecord, inputRecord, {
      partnerCode: "partner_code",
      name: "name",
      nameLocal: "name_local",
      partnerType: "partner_type",
      countryCode: "country_code",
      address: "address",
      city: "city",
      contactName: "contact_name",
      contactEmail: "contact_email",
      contactPhone: "contact_phone",
      supplierCurrency: "supplier_currency",
      supplierPaymentTerms: "supplier_payment_terms",
      leadTimeDays: "lead_time_days",
      customerCurrency: "customer_currency",
      customerPaymentTerms: "customer_payment_terms",
      creditLimit: "credit_limit",
      notes: "notes",
    });

    await this.auditService.log({
      action: "partner_updated",
      category: "master_data",
      targetTable: "partners",
      targetId: id,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return result;
  }

  async deactivate(id: string): Promise<Partner> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("partners")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        operation: "deactivate partner",
        resource: "Partner",
      });
    }

    const result = mapPartner(data as DbPartner);

    await this.auditService.log({
      action: "partner_deactivated",
      category: "master_data",
      targetTable: "partners",
      targetId: id,
      metadata: { partnerCode: result.partnerCode, name: result.name },
    });

    return result;
  }

  async getAllBrands(): Promise<Brand[]> {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch all brands",
        resource: "Brand",
      });
    }
    return ((data as DbBrand[]) ?? []).map((db) => mapBrand(db));
  }

  async getBrands(partnerId: string): Promise<Brand[]> {
    const client = this.supabaseService.getServiceClient();

    await this.findOne(partnerId);

    const { data, error } = await client
      .from("brands")
      .select("*")
      .eq("partner_id", partnerId)
      .order("name");

    if (error) {
      handleSupabaseError(error, {
        operation: "fetch partner brands",
        resource: "Brand",
      });
    }
    return ((data as DbBrand[]) ?? []).map((db) => mapBrand(db));
  }

  async createBrand(
    partnerId: string,
    input: CreateBrandInput,
  ): Promise<Brand> {
    const client = this.supabaseService.getServiceClient();

    const partner = await this.findOne(partnerId);
    if (partner.partnerType === "customer") {
      throw new BadRequestException("Brands can only be linked to suppliers");
    }

    const { data, error } = await client
      .from("brands")
      .insert({
        partner_id: partnerId,
        code: input.code,
        name: input.name,
        description: input.description,
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        operation: "create brand",
        resource: "Brand",
      });
    }

    const result = mapBrand(data as DbBrand);

    await this.auditService.log({
      action: "brand_created",
      category: "master_data",
      targetTable: "brands",
      targetId: result.id,
      metadata: {
        partnerId,
        partnerName: partner.name,
        code: result.code,
        name: result.name,
      },
    });

    return result;
  }

  async updateBrand(brandId: string, input: UpdateBrandInput): Promise<Brand> {
    const client = this.supabaseService.getServiceClient();

    const { data: existing, error: fetchError } = await client
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundException(`Brand with ID ${brandId} not found`);
    }

    const updateData: Record<string, unknown> = {};
    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;

    const { data, error } = await client
      .from("brands")
      .update(updateData)
      .eq("id", brandId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        operation: "update brand",
        resource: "Brand",
      });
    }

    const result = mapBrand(data as DbBrand);

    const existingRecord = existing as unknown as Record<string, unknown>;
    const inputRecord = input as unknown as Record<string, unknown>;
    const changes = buildAuditChanges(existingRecord, inputRecord, {
      code: "code",
      name: "name",
      description: "description",
    });

    await this.auditService.log({
      action: "brand_updated",
      category: "master_data",
      targetTable: "brands",
      targetId: brandId,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return result;
  }
}
