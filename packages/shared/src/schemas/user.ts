import { z } from "zod";
import { USER_ROLES } from "../types/user";

export const userRoleSchema = z.enum(USER_ROLES);

export const assignRoleSchema = z.object({
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
