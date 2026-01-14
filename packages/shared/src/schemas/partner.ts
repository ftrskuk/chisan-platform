import { z } from "zod";
import { PARTNER_TYPES } from "../types/partner";

export const partnerTypeSchema = z.enum(PARTNER_TYPES);

export const createPartnerSchema = z.object({
  partnerCode: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  nameLocal: z.string().max(100).optional(),
  partnerType: partnerTypeSchema,
  countryCode: z.string().length(2).toUpperCase(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  contactName: z.string().max(50).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  supplierCurrency: z.string().length(3).toUpperCase().optional(),
  supplierPaymentTerms: z.string().max(50).optional(),
  leadTimeDays: z.number().int().min(0).max(365).optional(),
  customerCurrency: z.string().length(3).toUpperCase().optional(),
  customerPaymentTerms: z.string().max(50).optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const createBrandSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
