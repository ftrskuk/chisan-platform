import { z } from "zod";
import { PARTNER_TYPES } from "../types/partner";

export const partnerTypeSchema = z.enum(PARTNER_TYPES);

const optionalString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional();

const optionalStringLength = (length: number) =>
  z
    .string()
    .transform((val) => (val === "" ? null : val?.toUpperCase()))
    .refine(
      (val) => val === null || val === undefined || val.length === length,
      {
        message: `Must be exactly ${length} characters`,
      },
    )
    .nullable()
    .optional();

export const createPartnerSchema = z.object({
  partnerCode: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  nameLocal: optionalString(100),
  partnerType: partnerTypeSchema,
  countryCode: z.string().length(2).toUpperCase(),
  address: optionalString(200),
  city: optionalString(50),
  contactName: optionalString(50),
  contactEmail: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email",
    }),
  contactPhone: optionalString(30),
  supplierCurrency: optionalStringLength(3),
  supplierPaymentTerms: optionalString(50),
  leadTimeDays: z.number().int().min(0).max(365).optional(),
  customerCurrency: optionalStringLength(3),
  customerPaymentTerms: optionalString(50),
  creditLimit: z.number().min(0).optional(),
  notes: optionalString(500),
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
