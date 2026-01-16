import { z } from "zod";
import { STOCK_CONDITIONS, STOCK_STATUSES } from "../types/stock";

export const stockConditionSchema = z.enum(STOCK_CONDITIONS);
export const stockStatusSchema = z.enum(STOCK_STATUSES);

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
