import { z } from "zod";
import { SETTING_CATEGORIES } from "../types/settings";

export const settingCategorySchema = z.enum(SETTING_CATEGORIES);

export const updateSettingSchema = z.object({
  value: z.unknown(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
