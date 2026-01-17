import { z } from "zod";
import {
  STOCK_CONDITIONS,
  STOCK_STATUSES,
  STOCK_SOURCE_TYPES,
} from "../types/stock";

export const stockConditionSchema = z.enum(STOCK_CONDITIONS);
export const stockStatusSchema = z.enum(STOCK_STATUSES);
export const stockSourceTypeSchema = z.enum(STOCK_SOURCE_TYPES);

export const stockSearchSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  widthMm: z.coerce.number().int().optional(),
  widthMin: z.coerce.number().int().optional(),
  widthMax: z.coerce.number().int().optional(),
  condition: stockConditionSchema.optional(),
  status: stockStatusSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type StockSearchInput = z.infer<typeof stockSearchSchema>;

export const createStockInSchema = z.object({
  itemId: z.string().uuid(),
  locationId: z.string().uuid(),
  widthMm: z.coerce.number().int().min(50).max(2500),
  weightKg: z.coerce.number().positive().max(10000),
  quantity: z.coerce.number().int().positive().default(1),
  condition: stockConditionSchema,
  sourceType: stockSourceTypeSchema,
  lotNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const bulkStockInSchema = z.object({
  items: z.array(createStockInSchema).min(1).max(50),
});

export const stockOutReasonTypeSchema = z.enum([
  "sale",
  "production",
  "adjustment",
  "disposal",
  "transfer",
]);

export const createStockOutSchema = z.object({
  stockId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
  reasonType: stockOutReasonTypeSchema,
  reason: z.string().max(200).optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const bulkStockOutSchema = z.object({
  items: z.array(createStockOutSchema).min(1).max(50),
});
