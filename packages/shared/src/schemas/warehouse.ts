import { z } from "zod";
import { LOCATION_TYPES } from "../types/warehouse";

export const locationTypeSchema = z.enum(LOCATION_TYPES);

export const createWarehouseSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  contactName: z.string().max(50).optional(),
  contactPhone: z.string().max(30).optional(),
  isDefault: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const createLocationSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().max(100).optional(),
  type: locationTypeSchema.optional(),
  parentId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
