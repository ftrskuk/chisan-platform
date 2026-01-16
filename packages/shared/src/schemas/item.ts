import { z } from "zod";
import { ITEM_FORMS } from "../types/item";

export const itemFormSchema = z.enum(ITEM_FORMS);

export const createPaperTypeSchema = z.object({
  code: z.string().min(1).max(10).toUpperCase(),
  nameEn: z.string().min(1).max(50),
  nameKo: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePaperTypeSchema = createPaperTypeSchema.partial();

export const createItemSchema = z.object({
  itemCode: z.string().max(50).optional(),
  displayName: z.string().min(1).max(200),
  paperTypeId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  grammage: z.number().int().min(30).max(500),
  form: itemFormSchema,
  coreDiameterInch: z.number().min(1).max(12).optional(),
  lengthMm: z.number().int().min(50).max(2500).optional(),
  sheetsPerReam: z.number().int().min(1).max(1000).optional(),
  unitOfMeasure: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const itemSearchSchema = z.object({
  paperTypeId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  grammage: z.number().int().optional(),
  grammageMin: z.number().int().optional(),
  grammageMax: z.number().int().optional(),
  form: itemFormSchema.optional(),
  isActive: z.boolean().optional(),
  q: z.string().optional(),
});

export type CreatePaperTypeInput = z.infer<typeof createPaperTypeSchema>;
export type UpdatePaperTypeInput = z.infer<typeof updatePaperTypeSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemSearchInput = z.infer<typeof itemSearchSchema>;
